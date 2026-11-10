package controllers

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"gorm.io/gorm"
)

// ---------------------------------------------------------------------------
// AFK forwarding. A player who is AFK answers a tell by themselves at once:
// the client sends "Sorry, I am A.F.K. (Away From Keyboard) right now." back
// to the sender, so it reaches Spire as a reply. Each Game Master tell such an
// answer is for is mailed to the character, through the offline mail path.
// The stock text is not the player writing and is not recorded. Any other
// text is recorded as a player message as usual: it may be a custom /afk
// text, but it may also be a person typing fast, and nothing a player sends
// is dropped.

const (
	// supportAFKText is the stock RoF2 answer; a text starting with
	// supportAFKPrefix counts too.
	supportAFKText   = "Sorry, I am A.F.K. (Away From Keyboard) right now."
	supportAFKPrefix = "Sorry, I am A.F.K."
	// supportAFKTextWindow is how long after a tell the stock text counts as
	// its answer. Any reply within supportAFKFastWindow counts too, whatever
	// it says, since a custom /afk text can say anything; such a reply still
	// goes on the case.
	supportAFKTextWindow = 30 * time.Second
	supportAFKFastWindow = 2 * time.Second

	supportAFKMailSubject = "Message about your petition"
	// supportAFKMailSignature signs the mail when the tell carried no
	// persona.
	supportAFKMailSignature = "Server Staff"
)

// supportAFKAnswerWays is what the AFK mail's footer may offer the player:
// how Spire would take an answer when the mail is written.
type supportAFKAnswerWays struct {
	// RepliesOpen: Player replies is on for the tell's case, so a tell to
	// GameMaster, #petition <message> and a mail to GameMaster are filed on
	// it (acceptInbound). Otherwise each is refused, and the player is told.
	RepliesOpen bool
	// MailReplies: World's UCS passes mail to GameMaster on to Spire
	// (playersupport.Features.MailReplies).
	MailReplies bool
}

// supportAFKMailBody is the mail carrying a tell the player missed while AFK,
// signed with the persona the tell was sent under, and a footer on how to
// answer. Lines are separated by a bare newline, like Spire's other mails.
// The tell is at most 200 characters (playersupport.ValidateMessage), so the
// body needs no shortening.
func supportAFKMailBody(character, message, persona string, ways supportAFKAnswerWays) string {
	signature := strings.TrimSpace(persona)
	if signature == "" {
		signature = supportAFKMailSignature
	}
	return character + ",\n\n" +
		"Good day! I sent you the following message regarding your open petition, but you were AFK:\n\n" +
		"\"" + message + "\"\n\n" +
		"Sincerely,\n" + signature + "\n\n" +
		"----------\n" + supportAFKMailFooter(ways)
}

// supportAFKMailFooter tells the player how to answer, listing only ways that
// are taken now. A tell goes to GameMaster rather than to "(GM) <persona>":
// World remembers a persona for a day and forgets it when it restarts, but
// GameMaster always reaches Player Support.
func supportAFKMailFooter(ways supportAFKAnswerWays) string {
	if !ways.RepliesOpen {
		return "Replies to the Game Master are not open on your petition right now. A Game Master will open them when they need your answer."
	}
	footer := "To answer the Game Master:\n"
	if ways.MailReplies {
		footer += "- Reply to this mail.\n"
	}
	return footer +
		"- Type #petition followed by your message.\n" +
		"- Send /tell GameMaster followed by your message."
}

// supportAFKRepliesOpen reports whether Player replies is on for the case:
// the account's reply route points at it and it is not resolved, as
// acceptInbound requires.
func supportAFKRepliesOpen(db *gorm.DB, accountID, caseID uint) bool {
	var chat models.PlayerSupportChat
	if db.Where("account_id = ?", accountID).Limit(1).Find(&chat).Error != nil || chat.CaseID != caseID {
		return false
	}
	var record models.PlayerSupportCase
	if db.Select("id", "status").Where("id = ?", caseID).Limit(1).Find(&record).Error != nil {
		return false
	}
	return record.ID == caseID && record.Status != "" && record.Status != "resolved"
}

// A sent tell's AFK state (PlayerSupportEntry.Afk): claimed, then mailed or
// failed. Empty means no AFK answer was seen.
const (
	supportAFKPending = "pending"
	supportAFKMailed  = "mailed"
	supportAFKFailed  = "failed"
)

// supportAFKAnswer is how a reply relates to a Game Master tell.
type supportAFKAnswer int

const (
	// supportAFKNone: a reply, not an AFK answer to the tell.
	supportAFKNone supportAFKAnswer = iota
	// supportAFKFast: any text within supportAFKFastWindow. The tell is
	// forwarded by mail, and the reply is recorded like any other.
	supportAFKFast
	// supportAFKStock: the client's stock AFK text. The tell is forwarded by
	// mail, and the reply is not recorded.
	supportAFKStock
)

// supportAFKReply tells how a reply received at receivedAt relates to a tell
// sent at sentAt.
func supportAFKReply(text string, sentAt, receivedAt time.Time) supportAFKAnswer {
	gap := receivedAt.Sub(sentAt)
	if gap < 0 {
		// Spire's and the database's clocks can disagree by a little.
		gap = 0
	}
	if gap <= supportAFKTextWindow && supportIsAFKText(text) {
		return supportAFKStock
	}
	if gap <= supportAFKFastWindow {
		return supportAFKFast
	}
	return supportAFKNone
}

// supportIsAFKText reports whether text is the client's stock AFK answer.
func supportIsAFKText(text string) bool {
	trimmed := strings.ToLower(strings.TrimSpace(text))
	return trimmed == strings.ToLower(supportAFKText) || strings.HasPrefix(trimmed, strings.ToLower(supportAFKPrefix))
}

// supportAccountName is an EQEmu account's name.
type supportAccountName struct {
	Name string `gorm:"column:name"`
}

// forwardAFK handles a reply that is an AFK answer to Game Master tells: each
// such tell not forwarded yet is mailed to the character, once. It reports
// whether the reply is the stock AFK text answering a tell, which is not a
// player message and is not recorded; any other reply is recorded by the
// caller, whether or not it caused a tell to be mailed.
func (p *PlayerSupportController) forwardAFK(ctx context.Context, eqemu, db *gorm.DB, frame playersupport.Frame, now time.Time) bool {
	if eqemu == nil || db == nil || frame.CharacterID == 0 || frame.AccountID == 0 {
		return false
	}
	eqemu, db = eqemu.WithContext(ctx), db.WithContext(ctx)
	var account supportAccountName
	if eqemu.Table("account").Select("name").Where("id = ?", frame.AccountID).Limit(1).Find(&account).Error != nil || account.Name == "" {
		return false
	}
	// The tells to this character on the account's cases that an answer now
	// could still be for. A tell's delivery can still read "pending": World
	// passes the AFK answer on before Spire has recorded the tell as sent.
	var tells []models.PlayerSupportEntry
	err := db.Table("spire_player_support_entries AS entries").Select("entries.*").
		Joins("JOIN spire_player_support_cases AS cases ON cases.id = entries.case_id").
		Where("cases.account = ? AND entries.kind = ? AND entries.recipient = ? AND entries.delivery <> ? AND entries.created_at >= ?",
			account.Name, "chat_out", frame.Character, "failed", now.Add(-supportAFKTextWindow)).
		Order("entries.id").Find(&tells).Error
	if err != nil {
		return false
	}
	answered, stock := false, false
	for _, tell := range tells {
		answer := supportAFKReply(frame.Text, tell.CreatedAt, now)
		if answer == supportAFKNone {
			continue
		}
		answered = true
		stock = stock || answer == supportAFKStock
		if tell.Afk != "" {
			continue
		}
		p.forwardAFKTell(eqemu, db, frame, tell, now)
	}
	if answered && p.world != nil {
		p.world.Notify()
	}
	return stock
}

// forwardAFKTell mails one tell, claimed first so a tell is forwarded once
// even when several Spire processes or answers race, and records how it went
// on the tell and on the timeline.
func (p *PlayerSupportController) forwardAFKTell(eqemu, db *gorm.DB, frame playersupport.Frame, tell models.PlayerSupportEntry, now time.Time) {
	claim := db.Model(&models.PlayerSupportEntry{}).Where("id = ? AND (afk IS NULL OR afk = '')", tell.ID).Update("afk", supportAFKPending)
	if claim.Error != nil || claim.RowsAffected != 1 {
		return
	}
	ways := supportAFKAnswerWays{
		RepliesOpen: supportAFKRepliesOpen(db, frame.AccountID, tell.CaseID),
		MailReplies: p.world != nil && p.world.Features().MailReplies,
	}
	row := gmMailInsert{
		CharID: frame.CharacterID, Timestamp: now.Unix(), From: playersupport.Identity,
		Subject: supportAFKMailSubject, Body: supportAFKMailBody(frame.Character, tell.Text, tell.Persona, ways), To: frame.Character, Status: mailStatusUnread,
	}
	state, delivery := supportAFKMailed, "mail"
	text := "Player was AFK: the Game Master tell was mailed to " + frame.Character + "\n" + tell.Text
	if err := eqemu.Table("mail").Create(&row).Error; err != nil {
		state, delivery = supportAFKFailed, "failed"
		text = "Player was AFK: the Game Master tell could not be mailed to " + frame.Character + "\n" + tell.Text
	} else {
		p.alertMail(eqemu, []uint{row.CharID}, row.From)
	}
	db.Model(&models.PlayerSupportEntry{}).Where("id = ?", tell.ID).Updates(map[string]interface{}{"afk": state, "afk_at": now})
	key := "afk-" + strconv.FormatUint(uint64(tell.ID), 10)
	db.Create(&models.PlayerSupportEntry{
		CaseID: tell.CaseID, Kind: "afk_mail", Actor: playersupport.DisplayName, Text: text,
		Delivery: delivery, Recipient: frame.Character, RequestKey: &key,
	})
}
