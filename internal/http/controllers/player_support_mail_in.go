package controllers

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

// ---------------------------------------------------------------------------
// Mail to GameMaster. The patched UCS ("mail_replies") stores mail a player
// sends to GameMaster as a mail row with charid 0, which stock EQEmu never
// writes. Spire collects those rows every 30 seconds: a message from an
// account whose open petition has Player replies on joins that case's
// conversation; any other sender gets one automatic answer.
//
// Several Spire processes can share one game database, each with its own
// Spire database (a live Spire next to a development one). Each decides
// before claiming: only the Spire that holds the account's conversation for
// the open petition files the mail, and a Spire that does not hold it leaves
// the row alone while the petition's shared status (the spire:petition data
// bucket) says replies are on, so it never answers for a case it does not own.

const (
	// supportMailPerPoll and supportMailPerSender cap how many rows one poll
	// takes, overall and per sender; the rest wait for the next poll. UCS
	// also refuses a sixth unclaimed message from one character.
	supportMailPerPoll   = 50
	supportMailPerSender = 3
	// supportMailAnswerEvery allows one automatic answer per sender; more
	// undeliverable mail in that time is dropped without an answer.
	supportMailAnswerEvery = 10 * time.Minute
	// Lengths kept from a player's mail.
	supportMailBodyMax    = 4000
	supportMailSubjectMax = 200
	// supportMailTries is how many polls may meet a database error on one
	// mail before it is given up (logged, never answered).
	supportMailTries = 3
	// A mail left for the Spire that owns the conversation is looked at again
	// after supportMailRecheck. Once older than supportMailStaleAfter nobody
	// took it, so it is answered as undelivered: the player gets an answer and
	// the sender's waiting mail, which UCS caps at five, cannot pile up.
	supportMailRecheck    = 5 * time.Minute
	supportMailStaleAfter = 24 * time.Hour

	supportEventMailAnswer   = "PLAYER_SUPPORT_MAIL_ANSWER"
	supportMailAnswerSubject = "Your message was not delivered"
)

// supportMailIn is a mail row addressed to GameMaster.
type supportMailIn struct {
	MsgID     uint   `gorm:"column:msgid"`
	Timestamp int64  `gorm:"column:timestamp"`
	From      string `gorm:"column:from"`
	Subject   string `gorm:"column:subject"`
	Body      string `gorm:"column:body"`
	To        string `gorm:"column:to"`
	Status    int8   `gorm:"column:status"`
}

// supportMailSender is the character that sent a mail to GameMaster.
type supportMailSender struct {
	ID        uint   `gorm:"column:id"`
	Name      string `gorm:"column:name"`
	AccountID uint   `gorm:"column:account_id"`
}

// Outcomes of one collected mail, for logs and tests.
const (
	supportMailAccepted       = "accepted"
	supportMailDuplicate      = "duplicate"
	supportMailAnsweredNoCase = "answered_no_petition"
	supportMailAnsweredOff    = "answered_replies_off"
	supportMailAnsweredLate   = "answered_undelivered"
	// supportMailLeft: not claimed; another Spire holds the conversation.
	supportMailLeft            = "left_for_owner"
	supportMailDroppedUnknown  = "dropped_unknown_sender"
	supportMailDroppedRate     = "dropped_rate_limited"
	supportMailGivenUp         = "given_up_after_errors"
	supportMailAnswerFailed    = "answer_failed"
	supportMailReturned        = "returned"
	supportMailReturnFailedLog = "lost"
)

// watchGameMasterMail collects mail to GameMaster from the database this
// Spire is configured with, the game server Live chat also uses. It runs in
// every Spire process whether or not anyone has the page open; claiming a row
// by deleting it means only one process handles each message.
func (p *PlayerSupportController) watchGameMasterMail(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := p.collectGameMasterMail(ctx, p.db.GetSpireDb(), p.db.GetEqemuDb(), time.Now()); err != nil && p.log != nil {
				p.log.Warn().Err(err).Msg("Player Support could not collect mail to GameMaster")
			}
		}
	}
}

// supportMailPlan is what this Spire will do with a mail, decided before it
// claims the row.
type supportMailPlan string

const (
	planMailDrop       supportMailPlan = "drop"
	planMailAccept     supportMailPlan = "accept"
	planMailNoPetition supportMailPlan = "no_petition"
	planMailRepliesOff supportMailPlan = "replies_off"
	planMailLate       supportMailPlan = "late"
	planMailLeave      supportMailPlan = "leave"
	planMailRetry      supportMailPlan = "retry"
)

// supportMailDeferrals remembers mail left for another Spire, so a poll does
// not look at it again until supportMailRecheck has passed.
type supportMailDeferrals struct {
	mu sync.Mutex
	at map[uint]time.Time
}

// waiting lists the mail not to look at now, and forgets old entries.
func (d *supportMailDeferrals) waiting(now time.Time) []uint {
	d.mu.Lock()
	defer d.mu.Unlock()
	ids := []uint{}
	for id, at := range d.at {
		switch {
		case now.Sub(at) > supportMailStaleAfter+time.Hour:
			delete(d.at, id)
		case now.Sub(at) < supportMailRecheck:
			ids = append(ids, id)
		}
	}
	return ids
}

// leave records a mail left for another Spire; it reports whether it is new.
func (d *supportMailDeferrals) leave(id uint, now time.Time) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.at == nil {
		d.at = map[uint]time.Time{}
	}
	_, seen := d.at[id]
	d.at[id] = now
	return !seen
}

func (d *supportMailDeferrals) forget(id uint) {
	d.mu.Lock()
	defer d.mu.Unlock()
	delete(d.at, id)
}

// collectGameMasterMail plans, claims and handles waiting mail to GameMaster
// and returns each handled message's outcome by msgid, including
// supportMailLeft for mail left for another Spire.
func (p *PlayerSupportController) collectGameMasterMail(ctx context.Context, spire, eqemu *gorm.DB, now time.Time) (map[uint]string, error) {
	outcomes := map[uint]string{}
	if spire == nil || eqemu == nil {
		return outcomes, nil
	}
	spire, eqemu = spire.WithContext(ctx), eqemu.WithContext(ctx)
	query := eqemu.Table("mail").
		Select("msgid, timestamp, COALESCE(`from`, '') AS `from`, COALESCE(subject, '') AS subject, COALESCE(body, '') AS body, COALESCE(`to`, '') AS `to`, status").
		Where("charid = 0")
	// Mail just left for another Spire does not take this poll's places.
	if waiting := p.mailDeferred.waiting(now); len(waiting) > 0 {
		query = query.Where("msgid NOT IN ?", waiting)
	}
	var rows []supportMailIn
	if err := query.Order("msgid").Limit(supportMailPerPoll).Find(&rows).Error; err != nil {
		return outcomes, err
	}
	taken := map[string]int{}
	for _, row := range rows {
		sender := strings.ToLower(strings.TrimSpace(row.From))
		if taken[sender] >= supportMailPerSender {
			continue
		}
		plan, character, err := planGameMasterMail(spire, eqemu, row, now)
		switch plan {
		case planMailRetry:
			// Nothing claimed: the next poll decides again.
			if p.log != nil {
				p.log.Warn().Err(err).Str("from", row.From).Msg("Player Support could not check a mail to GameMaster; it waits for the next poll")
			}
			continue
		case planMailLeave:
			if p.mailDeferred.leave(row.MsgID, now) && p.log != nil {
				p.log.Debug().Str("from", row.From).Uint("msgid", row.MsgID).Msg("Player Support left a mail to GameMaster for the Spire that holds the conversation")
			}
			outcomes[row.MsgID] = supportMailLeft
			continue
		}
		taken[sender]++
		// Claim: only the process whose delete removed the row handles it.
		claim := eqemu.Exec("DELETE FROM mail WHERE msgid = ? AND charid = 0", row.MsgID)
		if claim.Error != nil {
			return outcomes, claim.Error
		}
		p.mailDeferred.forget(row.MsgID)
		if claim.RowsAffected != 1 {
			continue
		}
		outcome := p.handleGameMasterMail(spire, eqemu, row, plan, character, now)
		outcomes[row.MsgID] = outcome
		if p.log != nil {
			p.log.Info().Str("from", row.From).Uint("msgid", row.MsgID).Str("outcome", outcome).Msg("Player Support collected mail to GameMaster")
		}
	}
	return outcomes, nil
}

// planGameMasterMail decides, without changing anything, what this Spire
// does with a mail:
//   - an unknown sender is dropped, and a sender without an open petition
//     is answered, by any Spire;
//   - the Spire whose database holds the account's conversation for the open
//     petition files it while replies are on, and otherwise answers that
//     replies are not open;
//   - any other Spire answers "not open" only when the petition's shared
//     status also says replies are off; while it says on, the mail is left
//     for the Spire that holds the conversation, until it is too old.
func planGameMasterMail(spire, eqemu *gorm.DB, row supportMailIn, now time.Time) (supportMailPlan, supportMailSender, error) {
	var sender supportMailSender
	err := eqemu.Table("character_data").Select("id, name, account_id").
		Where("name = ? AND deleted_at IS NULL", strings.TrimSpace(row.From)).Take(&sender).Error
	if errors.Is(err, gorm.ErrRecordNotFound) || (err == nil && (sender.ID == 0 || sender.AccountID == 0)) {
		return planMailDrop, sender, nil
	}
	if err != nil {
		return planMailRetry, sender, err
	}
	var petition models.Petition
	err = eqemu.Table("petitions AS p").Select("p.*").
		Joins("JOIN account AS acct ON acct.name = p.accountname").
		Where("acct.id = ?", sender.AccountID).
		Order("p.dib DESC").Take(&petition).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return planMailNoPetition, sender, nil
	}
	if err != nil {
		return planMailRetry, sender, err
	}
	var chat models.PlayerSupportChat
	err = spire.Where("account_id = ?", sender.AccountID).Take(&chat).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return planMailRetry, sender, err
	}
	if err == nil {
		var record models.PlayerSupportCase
		err = spire.Where("id = ?", chat.CaseID).Take(&record).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return planMailRetry, sender, err
		}
		if err == nil && record.SourceKey == supportSourceKey(petition) {
			// This Spire holds the conversation for this petition.
			if record.Status != "resolved" && petition.Ischeckedout == 0 {
				return planMailAccept, sender, nil
			}
			return planMailRepliesOff, sender, nil
		}
	}
	open, err := supportBucketRepliesOn(eqemu, petition, now)
	if err != nil {
		return planMailRetry, sender, err
	}
	if !open {
		return planMailRepliesOff, sender, nil
	}
	if now.Sub(time.Unix(row.Timestamp, 0)) > supportMailStaleAfter {
		return planMailLate, sender, nil
	}
	return planMailLeave, sender, nil
}

// supportBucketValue is a data bucket's value.
type supportBucketValue struct {
	Value string `gorm:"column:value"`
}

// supportBucketRepliesOn reads the petition's shared status, which the Spire
// that has the case publishes as "status|messages|owner" in the
// spire:petition:<dib>-<senttime> data bucket (see publishCaseStatus); the
// patched #petition menu reads the same bucket. messages is "1" while
// replies are on.
func supportBucketRepliesOn(eqemu *gorm.DB, petition models.Petition, now time.Time) (bool, error) {
	var bucket supportBucketValue
	err := eqemu.Table("data_buckets").Select("value").
		Where("`key` = ? AND (expires = 0 OR expires > ?)", "spire:petition:"+supportSourceKey(petition), now.Unix()).
		Limit(1).Find(&bucket).Error
	if err != nil {
		return false, err
	}
	parts := strings.SplitN(bucket.Value, "|", 3)
	return len(parts) == 3 && parts[1] == "1", nil
}

// handleGameMasterMail acts on a claimed mail as planned.
func (p *PlayerSupportController) handleGameMasterMail(spire, eqemu *gorm.DB, row supportMailIn, plan supportMailPlan, sender supportMailSender, now time.Time) string {
	if plan == planMailDrop {
		return supportMailDroppedUnknown
	}
	reason := map[supportMailPlan]string{
		planMailNoPetition: supportMailReasonNoPetition, planMailRepliesOff: supportMailReasonRepliesOff, planMailLate: supportMailReasonLate,
	}[plan]
	outcome := ""
	if plan == planMailAccept {
		decision, recorded := acceptInbound(eqemu.Statement.Context, eqemu, spire, supportInbound{
			AccountID: sender.AccountID, Character: sender.Name,
			Text: supportMailText(row.Body), Subject: supportMailSubject(row.Subject), Delivery: "mail",
			Key: fmt.Sprintf("mail-%d-%d", row.MsgID, row.Timestamp),
		})
		switch decision {
		case playersupport.TellAccepted:
			outcome = supportMailAccepted
			if !recorded {
				outcome = supportMailDuplicate
			} else if p.world != nil {
				p.world.Notify()
			}
		case playersupport.TellNoPetition:
			// Replies or the petition changed since the plan.
			reason = supportMailReasonNoPetition
		case playersupport.TellMessagesOff:
			reason = supportMailReasonRepliesOff
		default:
			// A database error: Spire cannot tell whether replies are on, so the
			// player must not be told they are off.
			return p.returnGameMasterMail(eqemu, row, errors.New("the case could not be checked"))
		}
	}
	if outcome == "" {
		var answerErr error
		outcome, answerErr = p.answerGameMasterMail(spire, eqemu, sender, row, reason, now)
		if answerErr != nil {
			return p.returnGameMasterMail(eqemu, row, answerErr)
		}
	}
	p.mailFailures.done(row)
	return outcome
}

// supportMailFailures counts database errors per mail, across polls of this
// Spire process, keyed by the mail's content (a returned mail gets a new
// msgid).
type supportMailFailures struct {
	mu    sync.Mutex
	tries map[string]int
}

func supportMailKey(row supportMailIn) string {
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s\x00%d\x00%s\x00%s", row.From, row.Timestamp, row.Subject, row.Body)))
	return fmt.Sprintf("%x", sum)
}

// fail records one more database error and reports whether to try again.
func (f *supportMailFailures) fail(row supportMailIn) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.tries == nil {
		f.tries = map[string]int{}
	}
	key := supportMailKey(row)
	f.tries[key]++
	if f.tries[key] >= supportMailTries {
		delete(f.tries, key)
		return false
	}
	return true
}

func (f *supportMailFailures) done(row supportMailIn) {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.tries, supportMailKey(row))
}

// returnGameMasterMail handles a database error on a claimed mail. It is
// never answered, since Spire could not tell whether replies are on: it goes
// back for the next poll, and after supportMailTries errors it is given up
// and logged, so a mail that always fails cannot loop forever.
func (p *PlayerSupportController) returnGameMasterMail(eqemu *gorm.DB, row supportMailIn, cause error) string {
	if !p.mailFailures.fail(row) {
		if p.log != nil {
			p.log.Error().Err(cause).Str("from", row.From).Str("subject", row.Subject).Int64("sent", row.Timestamp).
				Msg("Player Support gave up on a mail to GameMaster after repeated database errors")
		}
		return supportMailGivenUp
	}
	if p.log != nil {
		p.log.Warn().Err(cause).Str("from", row.From).Msg("Player Support will retry a mail to GameMaster after a database error")
	}
	back := gmMailInsert{Timestamp: row.Timestamp, From: row.From, Subject: row.Subject, Body: row.Body, To: row.To, Status: row.Status}
	if err := eqemu.Table("mail").Create(&back).Error; err != nil {
		if p.log != nil {
			p.log.Error().Err(err).Str("from", row.From).Str("subject", row.Subject).Msg("Player Support lost a mail to GameMaster")
		}
		return supportMailReturnFailedLog
	}
	return supportMailReturned
}

// answerGameMasterMail mails the sender the automatic answer, at most once
// per supportMailAnswerEvery. The audit row carries a key per sender and
// ten-minute window, unique in the audit log, so two Spire processes cannot
// both answer in one window.
func (p *PlayerSupportController) answerGameMasterMail(spire, eqemu *gorm.DB, sender supportMailSender, row supportMailIn, reason string, now time.Time) (string, error) {
	window := now.Unix() / int64(supportMailAnswerEvery/time.Second)
	var recent int64
	previous := supportMailAnswerKey(sender.ID, window-1)
	if err := spire.Model(&models.UserEventLog{}).
		Where("support_delivery_key = ? AND created_at > ?", previous, now.Add(-supportMailAnswerEvery)).
		Count(&recent).Error; err != nil {
		return "", err
	}
	if recent > 0 {
		return supportMailDroppedRate, nil
	}
	outcome := map[string]string{
		supportMailReasonNoPetition: supportMailAnsweredNoCase, supportMailReasonRepliesOff: supportMailAnsweredOff, supportMailReasonLate: supportMailAnsweredLate,
	}[reason]
	data, _ := json.Marshal(map[string]interface{}{
		"character_id": sender.ID, "character": sender.Name, "account_id": sender.AccountID,
		"reason": reason, "subject": supportMailSubject(row.Subject), "received_at": row.Timestamp,
	})
	key := supportMailAnswerKey(sender.ID, window)
	audit := models.UserEventLog{EventName: supportEventMailAnswer, Data: string(data), SupportDeliveryKey: &key, SupportDeliveryState: "pending"}
	if err := spire.Create(&audit).Error; err != nil {
		var duplicate *mysql.MySQLError
		if errors.As(err, &duplicate) && duplicate.Number == 1062 {
			return supportMailDroppedRate, nil
		}
		// No audit, no answer: tried again on the next poll.
		return "", err
	}
	answer := gmMailInsert{
		CharID: sender.ID, Timestamp: now.Unix(), From: playersupport.Identity, Subject: supportMailAnswerSubject,
		Body: supportMailAnswerBody(sender.Name, reason), To: sender.Name, Status: mailStatusUnread,
	}
	state := "sent"
	if err := eqemu.Table("mail").Create(&answer).Error; err != nil {
		state, outcome = "failed", supportMailAnswerFailed
	} else {
		p.alertMail(eqemu, []uint{answer.CharID}, answer.From)
	}
	spire.Model(&models.UserEventLog{}).Where("id = ?", audit.ID).Update("support_delivery_state", state)
	return outcome, nil
}

func supportMailAnswerKey(characterID uint, window int64) string {
	return fmt.Sprintf("mail-answer-%d-%d", characterID, window)
}

// Why an automatic answer is sent; also recorded in its audit row.
const (
	supportMailReasonNoPetition = "no_petition"
	supportMailReasonRepliesOff = "replies_off"
	supportMailReasonLate       = "undelivered"
)

// supportMailAnswerBody is the automatic answer. It quotes nothing from the
// player's mail.
func supportMailAnswerBody(character, reason string) string {
	body := "Hello " + character + ",\n\n" +
		"Thank you for your message to the Game Master. It was not delivered to the Game Master team.\n\n"
	switch reason {
	case supportMailReasonRepliesOff:
		body += "Replies to the Game Master are not open on your petition right now. A Game Master will open them when they need your answer.\n\n"
	case supportMailReasonLate:
		body += "It could not be passed on in time. If you still need help, please send it again, or add to your petition in game with #petition.\n\n"
	default:
		body += "The Game Master mailbox is only read while you have an open petition. If you need help, please file a petition in game with #petition.\n\n"
	}
	return body + "The Game Master team"
}

// supportMailText keeps a mail body's lines, drops other control characters
// and shortens a long body.
func supportMailText(body string) string {
	text := strings.Map(func(r rune) rune {
		if r == '\n' {
			return r
		}
		if r == '\r' || r == '\t' {
			return ' '
		}
		if unicode.IsControl(r) {
			return -1
		}
		return r
	}, body)
	text = strings.TrimSpace(text)
	if text == "" {
		return "(No message text)"
	}
	return supportShorten(text, supportMailBodyMax)
}

// supportMailSubject is a one-line subject.
func supportMailSubject(subject string) string {
	text := strings.TrimSpace(strings.Join(strings.Fields(strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return ' '
		}
		return r
	}, subject)), " "))
	return supportShorten(text, supportMailSubjectMax)
}

// supportShorten cuts text to at most max bytes on a character boundary,
// ending in "...".
func supportShorten(text string, max int) string {
	if len(text) <= max {
		return text
	}
	cut := max - 3
	for cut > 0 && !utf8.RuneStart(text[cut]) {
		cut--
	}
	return strings.TrimRightFunc(text[:cut], unicode.IsSpace) + "..."
}
