package controllers

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"
	"unicode"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func worldDatabase(db *gorm.DB) string {
	if db == nil {
		return ""
	}
	dialect, ok := db.Dialector.(*gormMysql.Dialector)
	if !ok {
		return ""
	}
	dsn, err := mysql.ParseDSN(dialect.DSN)
	if err != nil || dsn.DBName == "" {
		return ""
	}
	address := dsn.Addr
	if host, port, err := net.SplitHostPort(address); err == nil {
		if host == "localhost" || host == "::1" {
			host = "127.0.0.1"
		}
		address = net.JoinHostPort(strings.ToLower(host), port)
	}
	return dsn.Net + "/" + address + "/" + dsn.DBName
}

func (p *PlayerSupportController) localWorld(scope supportScope) bool {
	selected := worldDatabase(scope.eqemu)
	return p.world != nil && selected != "" && selected == worldDatabase(p.db.GetEqemuDb())
}

func (p *PlayerSupportController) decoratePresence(scope supportScope, cases []supportCaseView) {
	if len(cases) == 0 {
		return
	}
	var presence playersupport.Presence
	if p.localWorld(scope) {
		presence = p.world.Roster()
	}
	accounts := map[string]uint{}
	if presence.Known {
		names := make([]string, 0, len(cases))
		for _, record := range cases {
			names = append(names, record.Account)
		}
		var rows []struct {
			ID   uint
			Name string
		}
		if scope.eqemu.Table("account").Select("id, name").Where("name IN ?", names).Scan(&rows).Error == nil {
			for _, row := range rows {
				accounts[strings.ToLower(row.Name)] = row.ID
			}
		}
	}
	for i := range cases {
		accountID := accounts[strings.ToLower(cases[i].Account)]
		cases[i].AccountPresence = presenceLabel(accountID > 0, presence.Accounts[accountID])
		if online, ok := presence.InZone[accountID]; ok {
			cases[i].OnlineCharacter = online.Name
		}
		if cases[i].CharacterID > 0 {
			cases[i].CharacterPresence = presenceLabel(presence.Known, presence.Characters[cases[i].CharacterID])
		}
	}
}

func presenceLabel(known, online bool) string {
	if !known {
		return "unknown"
	}
	if online {
		return "online"
	}
	return "offline"
}

type supportChatSnapshot struct {
	State    string                      `json:"state"`
	Active   bool                        `json:"active"`
	Messages []models.PlayerSupportEntry `json:"messages"`
	Cursor   uint                        `json:"cursor"`
	// Recipient is the account's character in a zone, which may not be the
	// character that filed the petition. TellsOff explains an offline state.
	Recipient string `json:"recipient,omitempty"`
	TellsOff  bool   `json:"tells_off,omitempty"`
	// MailTo is set when no character on the account is in game; a message
	// sent now is mailed to the character that filed the petition.
	MailTo string `json:"mail_to,omitempty"`
	// Companion is the local World's Player Support patch status. Without
	// it, a player in game has the "unsupported" state, and offline messages
	// are still mailed but cannot be answered in game.
	Companion playersupport.CompanionStatus `json:"companion,omitempty"`
}

func (p *PlayerSupportController) chat(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	changed := p.world.Changes()
	state, err := p.chatSnapshot(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	if state.Active && c.QueryParam("after") == fmt.Sprint(state.Cursor) {
		timer := time.NewTimer(12 * time.Second)
		defer timer.Stop()
		select {
		case <-changed:
		case <-timer.C:
		case <-c.Request().Context().Done():
			return nil
		}
		scope, err = p.scope(c, false)
		if err != nil {
			return supportError(c, err)
		}
		view, err = scope.caseByKey(c.Param("key"))
		if err != nil {
			return supportError(c, err)
		}
		state, err = p.chatSnapshot(scope, view)
		if err != nil {
			return supportError(c, err)
		}
	}
	return c.JSON(http.StatusOK, state)
}

func (p *PlayerSupportController) chatSnapshot(scope supportScope, view supportCaseView) (supportChatSnapshot, error) {
	state := supportChatSnapshot{State: "unavailable", Messages: []models.PlayerSupportEntry{}}
	if view.ID > 0 {
		if err := scope.spire.Where("case_id = ? AND kind IN ?", view.ID, []string{"chat_in", "chat_out"}).
			Order("id DESC").Limit(100).Find(&state.Messages).Error; err != nil {
			return state, err
		}
		if len(state.Messages) > 0 {
			state.Cursor = state.Messages[0].ID
		}
		for i, j := 0, len(state.Messages)-1; i < j; i, j = i+1, j-1 {
			state.Messages[i], state.Messages[j] = state.Messages[j], state.Messages[i]
		}
		// The cursor stays on entries: Reply by mail joins the list only.
		replies, err := scope.mailReplyMessages(view)
		if err != nil {
			return state, err
		}
		state.Messages = mergeChatMessages(state.Messages, replies)
		var count int64
		if err := scope.spire.Model(&models.PlayerSupportChat{}).Where("case_id = ?", view.ID).Count(&count).Error; err != nil {
			return state, err
		}
		state.Active = count > 0
	}
	if !view.NativeOpen || view.Status == "resolved" || view.CheckedOut || !p.localWorld(scope) {
		return state, nil
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil || accountID == 0 {
		return state, err
	}
	roster := p.world.Roster()
	if !roster.Known {
		return state, nil
	}
	state.Companion = p.world.Companion()
	online, ok := roster.InZone[accountID]
	state.State = "offline"
	if !ok {
		if view.CharacterID > 0 {
			state.MailTo = view.Character
		}
		return state, nil
	}
	state.Recipient = online.Name
	if online.TellsOff {
		state.TellsOff = true
		return state, nil
	}
	if state.Companion == playersupport.CompanionReady && !p.world.Ready() {
		// Opening the stream may have found an older patch.
		state.Companion = p.world.Companion()
	}
	switch state.Companion {
	case playersupport.CompanionMissing, playersupport.CompanionOutdated:
		state.State = "unsupported"
	case playersupport.CompanionReady:
		state.State = "unavailable"
		if p.world.Ready() {
			state.State = "ready"
		}
	default:
		// The player is in game, but World did not answer the patch check.
		state.State = "unavailable"
	}
	return state, nil
}

type supportChatInput struct {
	Action    string `json:"action"`
	RequestID string `json:"request_id"`
	Text      string `json:"text"`
}

func (p *PlayerSupportController) updateChat(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	var input supportChatInput
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid chat request"))
	}
	if input.Action == "end" {
		entryID, err := turnOffReplies(scope, view)
		if err != nil {
			return supportError(c, err)
		}
		// Only a change from on to off tells the player; a repeated request
		// finds replies already off and sends nothing.
		if entryID == 0 {
			return c.JSON(http.StatusOK, echo.Map{"message": "Player replies are already off."})
		}
		p.world.Notify()
		p.publishCaseStatus(c, scope, view.SourceKey)
		summary := p.notifyRepliesOff(c, scope, view, view.ID, entryID)
		return c.JSON(http.StatusOK, echo.Map{"message": "Player replies are off. " + summary})
	}
	if !view.NativeOpen || view.Status == "resolved" || view.CheckedOut || !p.localWorld(scope) {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Live chat is unavailable for this case"))
	}
	var delivery string
	switch input.Action {
	case "start":
		err = p.startChat(scope, view)
	case "send":
		delivery, err = p.sendChat(scope, view, input)
	default:
		err = echo.NewHTTPError(http.StatusBadRequest, "Unknown chat action")
	}
	if err != nil {
		return supportError(c, err)
	}
	p.publishCaseStatus(c, scope, view.SourceKey)
	if input.Action == "send" {
		return c.JSON(http.StatusOK, supportChatSent{Delivery: delivery})
	}
	return c.NoContent(http.StatusNoContent)
}

// turnOffReplies ends Player replies on the case and records it. It returns
// the new "chat_off" entry, or 0 when replies were already off.
func turnOffReplies(scope supportScope, view supportCaseView) (uint, error) {
	var entryID uint
	if view.ID == 0 {
		return 0, nil
	}
	err := scope.writeCase(func(tx *gorm.DB) error {
		entryID = 0
		result := tx.Where("case_id = ?", view.ID).Delete(&models.PlayerSupportChat{})
		if result.Error != nil || result.RowsAffected == 0 {
			return result.Error
		}
		entry := models.PlayerSupportEntry{CaseID: view.ID, Kind: "chat_off", Actor: supportActor(scope.user), Text: supportRepliesOffText}
		if err := tx.Create(&entry).Error; err != nil {
			return err
		}
		entryID = entry.ID
		return nil
	})
	return entryID, err
}

// supportChatSent answers a send with the message's delivery: "sent", "mail",
// "failed", "unconfirmed", or "pending" while a repeated request is still
// being delivered, or its outcome could not be recorded.
type supportChatSent struct {
	Delivery string `json:"delivery"`
}

// tellDelivery records how World answered a tell.
func tellDelivery(err error) string {
	switch {
	case err == nil:
		return "sent"
	case errors.Is(err, playersupport.ErrDeliveryUnknown):
		return "unconfirmed"
	}
	return "failed"
}

// startChat turns on player replies: the player's tells and #petition
// messages are accepted onto this case. The player need not be in game, since
// replies only arrive through the patched World's chat stream, which must be
// open. An older patch is refused, so it never turns replies on.
func (p *PlayerSupportController) startChat(scope supportScope, view supportCaseView) error {
	accountID, err := chatAccount(scope, view)
	if err != nil {
		return err
	}
	if err := companionChatError(p.world.ChatCompanion()); err != nil {
		return err
	}
	if !p.world.Ready() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "Live chat unavailable")
	}
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		return enableChat(tx, record, accountID, supportActor(scope.user))
	})
	if err == nil {
		p.world.Notify()
	}
	return err
}

func supportAccountID(scope supportScope, view supportCaseView) (uint, error) {
	var id uint
	err := scope.eqemu.Table("account").Select("id").Where("name = ?", view.Account).Scan(&id).Error
	return id, err
}

// chatAccount confirms the case still matches the account's open petition.
// Petitions are one per account, so any of its characters may take part.
func chatAccount(scope supportScope, view supportCaseView) (uint, error) {
	var petition struct {
		AccountID  uint
		Dib        uint
		Senttime   int64
		CheckedOut int8
	}
	err := scope.eqemu.Table("petitions AS p").Select("acct.id AS account_id, p.dib, p.senttime, p.ischeckedout AS checked_out").
		Joins("JOIN account AS acct ON acct.name = p.accountname").
		Where("acct.name = ?", view.Account).
		Order("p.dib DESC").Limit(1).Scan(&petition).Error
	if err == nil && (petition.AccountID == 0 || petition.CheckedOut != 0 ||
		supportSourceKey(models.Petition{Dib: petition.Dib, Senttime: petition.Senttime}) != view.SourceKey) {
		err = echo.NewHTTPError(http.StatusConflict, "The in-game petition changed. Refresh the case before messaging.")
	}
	return petition.AccountID, err
}

// enableChat routes the account's replies to this case. The caller holds the
// case row lock. A new route is recorded in the case timeline.
func enableChat(tx *gorm.DB, record models.PlayerSupportCase, accountID uint, actor string) error {
	if record.Status == "resolved" {
		return echo.NewHTTPError(http.StatusConflict, "Reopen this case to turn on player replies")
	}
	enabled := func() error {
		return tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: "chat_on", Actor: actor, Text: "Turned on player replies"}).Error
	}
	chat := models.PlayerSupportChat{AccountID: accountID, CaseID: record.ID}
	created := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&chat)
	if created.Error != nil {
		return created.Error
	}
	if created.RowsAffected == 1 {
		return enabled()
	}
	var current models.PlayerSupportChat
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("account_id = ?", accountID).Take(&current).Error; err != nil {
		return err
	}
	if current.CaseID == record.ID {
		return nil
	}
	var previous models.PlayerSupportCase
	err := tx.Where("id = ?", current.CaseID).Take(&previous).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if previous.SourceKey == record.SourceKey && previous.Status != "resolved" {
		return echo.NewHTTPError(http.StatusConflict, "Player replies for this petition are already on in another case")
	}
	// The selected case was verified against the account's newest petition.
	// An older binding for this account must not carry over to that petition.
	if err := tx.Model(&current).Update("case_id", record.ID).Error; err != nil {
		return err
	}
	return enabled()
}

// companionChatError explains why tells cannot be sent when World lacks the
// current Player Support patch.
func companionChatError(status playersupport.CompanionStatus) error {
	switch status {
	case playersupport.CompanionMissing:
		return echo.NewHTTPError(http.StatusServiceUnavailable, "Live chat needs the Player Support patch on World. Reply by mail instead.")
	case playersupport.CompanionOutdated:
		return echo.NewHTTPError(http.StatusServiceUnavailable, "World has an older Player Support patch. Rebuild World and zones with the current patch to use live chat.")
	}
	return nil
}

// supportOfflineMailPrefix introduces a Game Master message that was mailed
// because no character on the account was in game.
const supportOfflineMailPrefix = "This message was sent to you in response to your petition while you were offline: "

// sendChat returns the message's delivery. A repeated request ID returns the
// delivery recorded for the first request without sending again.
func (p *PlayerSupportController) sendChat(scope supportScope, view supportCaseView, input supportChatInput) (string, error) {
	text := strings.TrimSpace(input.Text)
	if !supportRequestKey.MatchString(input.RequestID) || !playersupport.ValidateMessage(text) {
		return "", echo.NewHTTPError(http.StatusBadRequest, "Enter up to 200 printable ASCII characters")
	}
	accountID, err := chatAccount(scope, view)
	if err != nil {
		return "", err
	}
	// A player in game gets a tell. With no character on the account in a
	// zone, the message is mailed to the character that filed the petition.
	roster := p.world.Roster()
	online, inGame := roster.InZone[accountID]
	mail := roster.Known && !inGame
	recipient := online.Name
	if mail {
		recipient = view.Character
	}
	// Sending never changes whether the player's replies are accepted; that
	// is the case's reply setting alone (startChat and "end").
	companion := p.world.ChatCompanion()
	var refusal error
	switch {
	case !roster.Known:
		refusal = echo.NewHTTPError(http.StatusServiceUnavailable, "Spire cannot check whether the player is in game right now")
	case inGame && online.TellsOff:
		refusal = echo.NewHTTPError(http.StatusConflict, online.Name+" has tells turned off")
	case inGame && companionChatError(companion) != nil:
		refusal = companionChatError(companion)
	case inGame && !p.world.Ready():
		refusal = echo.NewHTTPError(http.StatusServiceUnavailable, "Live chat unavailable")
	case mail && view.CharacterID == 0:
		refusal = echo.NewHTTPError(http.StatusConflict, "The player is offline and the character that filed the petition is unavailable for mail")
	}
	// A tell carries the Game Master's persona; mail always comes from GameMaster.
	persona := ""
	if !mail {
		persona = p.personaArgument(scope)
	}
	entry, duplicate, err := recordChatSend(scope, view, input.RequestID, text, recipient, persona, refusal)
	if err != nil {
		return "", err
	}
	if duplicate {
		return entry.Delivery, nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	outcome := "sent"
	if mail {
		outcome = "mail"
		row := gmMailInsert{
			CharID: view.CharacterID, Timestamp: time.Now().Unix(), From: playersupport.Identity,
			Subject: "Response to your petition", Body: supportOfflineMailPrefix + text,
			To: view.Character, Status: mailStatusUnread,
		}
		if err := scope.eqemu.WithContext(ctx).Table("mail").Create(&row).Error; err != nil {
			outcome = "failed"
		} else {
			p.alertMail(scope.eqemu, []uint{row.CharID}, row.From)
		}
	} else {
		outcome = tellDelivery(p.world.Send(scope.spire.Statement.Context, *entry.RequestKey, accountID, online.ID, text, entry.Persona))
	}
	err = p.db.GetSpireDb().WithContext(ctx).Model(&entry).Update("delivery", outcome).Error
	p.world.Notify()
	if err != nil {
		return "", err
	}
	return outcome, nil
}

// recordChatSend records an outgoing message as pending before it is sent. A
// repeated request ID returns the first request's entry with duplicate set.
// It never touches the case's reply setting: sending neither turns player
// replies on nor off.
// persona is the name the tell is sent under, kept so Live chat can show it.
func recordChatSend(scope supportScope, view supportCaseView, requestID, text, recipient, persona string, refusal error) (models.PlayerSupportEntry, bool, error) {
	var entry models.PlayerSupportEntry
	var duplicate bool
	err := scope.writeCase(func(tx *gorm.DB) error {
		duplicate = false
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		key := fmt.Sprintf("chat-%d-%s", record.ID, requestID)
		err = tx.Where("request_key = ?", key).Take(&entry).Error
		if err == nil {
			duplicate = true
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if refusal != nil {
			return refusal
		}
		if record.Status == "resolved" {
			return echo.NewHTTPError(http.StatusConflict, "Reopen this case to message the player")
		}
		entry = models.PlayerSupportEntry{
			CaseID: record.ID, Kind: "chat_out", Actor: supportActor(scope.user), Text: text,
			Delivery: "pending", Recipient: recipient, Persona: persona, RequestKey: &key,
		}
		return tx.Create(&entry).Error
	})
	return entry, duplicate, err
}

func (p *PlayerSupportController) receiveChat(frame playersupport.Frame) playersupport.TellDecision {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	// An AFK client answering a Game Master tell is not the player writing:
	// the tell goes to them by mail instead, and World is told it was taken.
	if p.forwardAFK(ctx, p.db.GetEqemuDb(), p.db.GetSpireDb(), frame, time.Now()) {
		return playersupport.TellAccepted
	}
	decision, recorded := acceptChat(ctx, p.db.GetEqemuDb(), p.db.GetSpireDb(), frame)
	if recorded {
		p.world.Notify()
	}
	return decision
}

// acceptChat decides whether a player's tell joins a case. It is accepted
// only while player replies are on for the account's open petition; with
// replies off World tells the player their message was not sent. recorded is
// false for a repeated request.
func acceptChat(ctx context.Context, eqemu, db *gorm.DB, frame playersupport.Frame) (playersupport.TellDecision, bool) {
	if eqemu == nil {
		return playersupport.TellUnavailable, false
	}
	// World names the sending character; confirm it belongs to the account.
	var sender int64
	err := eqemu.WithContext(ctx).Table("character_data").
		Where("id = ? AND account_id = ? AND name = ? AND deleted_at IS NULL", frame.CharacterID, frame.AccountID, frame.Character).
		Count(&sender).Error
	if err != nil {
		return playersupport.TellUnavailable, false
	}
	if sender == 0 {
		return playersupport.TellInvalid, false
	}
	text := strings.TrimSpace(strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return -1
		}
		return r
	}, frame.Text))
	if text == "" || len(text) > 4096 {
		return playersupport.TellInvalid, false
	}
	return acceptInbound(ctx, eqemu, db, supportInbound{
		AccountID: frame.AccountID, Character: frame.Character, Text: text, Key: "tell-" + frame.RequestID,
	})
}

// supportInbound is a player's message to GameMaster: a tell, or a mail.
type supportInbound struct {
	AccountID uint
	Character string
	Text      string
	// Delivery is "mail" for a mail, with its Subject; empty for a tell.
	Delivery, Subject string
	// Key makes a repeated message a no-op.
	Key string
}

// acceptInbound files a player's message on the case of the account's open
// petition while player replies are on for it. Otherwise it answers
// TellNoPetition (the account has no petition) or TellMessagesOff.
func acceptInbound(ctx context.Context, eqemu, db *gorm.DB, in supportInbound) (playersupport.TellDecision, bool) {
	if eqemu == nil || db == nil {
		return playersupport.TellUnavailable, false
	}
	var petition models.Petition
	err := eqemu.WithContext(ctx).Table("petitions AS p").Select("p.*").
		Joins("JOIN account AS acct ON acct.name = p.accountname").
		Where("acct.id = ?", in.AccountID).
		Order("p.dib DESC").Take(&petition).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return playersupport.TellNoPetition, false
	}
	if err != nil {
		return playersupport.TellUnavailable, false
	}
	decision := playersupport.TellMessagesOff
	recorded := false
	err = db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var chat models.PlayerSupportChat
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("account_id = ?", in.AccountID).Take(&chat).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		if err != nil {
			return err
		}
		var record models.PlayerSupportCase
		err = tx.Where("id = ?", chat.CaseID).Take(&record).Error
		if err != nil {
			return err
		}
		if record.SourceKey != supportSourceKey(petition) || record.Status == "resolved" || petition.Ischeckedout != 0 {
			return nil
		}
		key := in.Key
		entry := models.PlayerSupportEntry{
			CaseID: chat.CaseID, Kind: "chat_in", Actor: in.Character, Text: in.Text,
			Delivery: in.Delivery, Subject: in.Subject, RequestKey: &key,
		}
		result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&entry)
		if result.Error == nil {
			decision = playersupport.TellAccepted
			recorded = result.RowsAffected == 1
		}
		return result.Error
	})
	if err != nil {
		return playersupport.TellUnavailable, false
	}
	return decision, recorded
}
