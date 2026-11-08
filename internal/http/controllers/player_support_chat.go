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
	type identity struct {
		ID            uint
		AccountID     uint
		CharacterName string
		AccountName   string
	}
	owners := make(map[uint]identity, len(cases))
	if presence.Known {
		ids := make([]uint, 0, len(cases))
		for _, record := range cases {
			ids = append(ids, record.PetitionID)
		}
		var matches []identity
		err := scope.eqemu.Table("character_data AS ch").Select("ch.id, ch.account_id, ch.name AS character_name, acct.name AS account_name").
			Joins("JOIN account AS acct ON acct.id = ch.account_id").
			Where("ch.id IN ? AND ch.deleted_at IS NULL", ids).Scan(&matches).Error
		if err == nil {
			for _, match := range matches {
				owners[match.ID] = match
			}
		}
	}
	for i := range cases {
		owner := owners[cases[i].PetitionID]
		known := owner.AccountID > 0 && strings.EqualFold(owner.CharacterName, cases[i].Character) && strings.EqualFold(owner.AccountName, cases[i].Account)
		cases[i].AccountPresence = presenceLabel(known, presence.Accounts[owner.AccountID])
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
		var count int64
		if err := scope.spire.Model(&models.PlayerSupportChat{}).Where("case_id = ?", view.ID).Count(&count).Error; err != nil {
			return state, err
		}
		state.Active = count > 0
	}
	if !view.NativeOpen || view.Status == "resolved" || view.CheckedOut || view.CharacterID == 0 || !p.localWorld(scope) {
		return state, nil
	}
	roster := p.world.Roster()
	if !roster.Known {
		return state, nil
	}
	if !roster.Characters[view.CharacterID] {
		state.State = "offline"
		return state, nil
	}
	if p.world.Ready() {
		state.State = "ready"
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
		if view.ID > 0 {
			err := scope.writeCase(func(tx *gorm.DB) error {
				result := tx.Where("case_id = ?", view.ID).Delete(&models.PlayerSupportChat{})
				if result.Error != nil || result.RowsAffected == 0 {
					return result.Error
				}
				return tx.Create(&models.PlayerSupportEntry{CaseID: view.ID, Kind: "chat_off", Actor: supportActor(scope.user), Text: "Turned off messages"}).Error
			})
			if err != nil {
				return supportError(c, err)
			}
			p.world.Notify()
		}
		return c.NoContent(http.StatusNoContent)
	}
	if !view.NativeOpen || view.Status == "resolved" || view.CheckedOut || view.CharacterID == 0 || !p.localWorld(scope) {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Live chat is unavailable for this case"))
	}
	switch input.Action {
	case "start":
		err = p.startChat(scope, view)
	case "send":
		err = p.sendChat(scope, view, input)
	default:
		err = echo.NewHTTPError(http.StatusBadRequest, "Unknown chat action")
	}
	if err != nil {
		return supportError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func (p *PlayerSupportController) startChat(scope supportScope, view supportCaseView) error {
	if !p.world.Roster().Characters[view.CharacterID] {
		return echo.NewHTTPError(http.StatusConflict, "This character cannot receive tells right now")
	}
	if !p.world.Ready() {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "Live chat unavailable")
	}
	accountID, err := chatAccount(scope, view)
	if err != nil {
		return err
	}
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		return enableChat(tx, record, view, accountID, supportActor(scope.user))
	})
	if err == nil {
		p.world.Notify()
	}
	return err
}

func chatAccount(scope supportScope, view supportCaseView) (uint, error) {
	var recipient struct {
		AccountID  uint
		Dib        uint
		Senttime   int64
		CheckedOut int8
	}
	err := scope.eqemu.Table("character_data AS ch").Select("ch.account_id, p.dib, p.senttime, p.ischeckedout AS checked_out").
		Joins("JOIN account AS acct ON acct.id = ch.account_id").
		Joins("JOIN petitions AS p ON p.petid = ch.id AND p.charname = ch.name AND p.accountname = acct.name").
		Where("ch.id = ? AND ch.name = ? AND acct.name = ? AND ch.deleted_at IS NULL", view.CharacterID, view.Character, view.Account).
		Order("p.dib DESC").Limit(1).Scan(&recipient).Error
	if err == nil && (recipient.AccountID == 0 || recipient.CheckedOut != 0 ||
		supportSourceKey(models.Petition{Dib: recipient.Dib, Senttime: recipient.Senttime}) != view.SourceKey) {
		err = echo.NewHTTPError(http.StatusConflict, "The in-game petition changed. Refresh the case before messaging.")
	}
	return recipient.AccountID, err
}

// The caller holds the case row lock. Enabling a route and recording a first
// outgoing tell can therefore happen in the same transaction. A new route is
// recorded in the case timeline.
func enableChat(tx *gorm.DB, record models.PlayerSupportCase, view supportCaseView, accountID uint, actor string) error {
	if record.Status == "resolved" {
		return echo.NewHTTPError(http.StatusConflict, "Reopen this case to enable messages")
	}
	enabled := func() error {
		return tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: "chat_on", Actor: actor, Text: "Turned on messages"}).Error
	}
	chat := models.PlayerSupportChat{CharacterID: view.CharacterID, AccountID: accountID, CaseID: record.ID, Character: view.Character}
	created := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&chat)
	if created.Error != nil {
		return created.Error
	}
	if created.RowsAffected == 1 {
		return enabled()
	}
	var current models.PlayerSupportChat
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("character_id = ?", view.CharacterID).Take(&current).Error; err != nil {
		return err
	}
	if current.CaseID == record.ID && current.AccountID == accountID {
		return nil
	}
	var previous models.PlayerSupportCase
	err := tx.Where("id = ?", current.CaseID).Take(&previous).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if previous.SourceKey == record.SourceKey && previous.Status != "resolved" {
		return echo.NewHTTPError(http.StatusConflict, "This petition already has messaging enabled in another case")
	}
	// The selected case was verified against the newest native petition.
	// An older binding for this character must not carry over to that petition.
	if err := tx.Model(&current).Updates(chat).Error; err != nil {
		return err
	}
	return enabled()
}

func (p *PlayerSupportController) sendChat(scope supportScope, view supportCaseView, input supportChatInput) error {
	text := strings.TrimSpace(input.Text)
	if !supportRequestKey.MatchString(input.RequestID) || !playersupport.ValidateMessage(text) {
		return echo.NewHTTPError(http.StatusBadRequest, "Enter up to 200 printable ASCII characters")
	}
	accountID, err := chatAccount(scope, view)
	if err != nil {
		return err
	}
	available := p.world.Roster().Characters[view.CharacterID] && p.world.Ready()
	var entry models.PlayerSupportEntry
	var duplicate bool
	err = scope.writeCase(func(tx *gorm.DB) error {
		duplicate = false
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		key := fmt.Sprintf("chat-%d-%s", record.ID, input.RequestID)
		err = tx.Where("request_key = ?", key).Take(&entry).Error
		if err == nil {
			duplicate = true
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if !available {
			return echo.NewHTTPError(http.StatusConflict, "This character cannot receive tells right now")
		}
		if err := enableChat(tx, record, view, accountID, supportActor(scope.user)); err != nil {
			return err
		}
		entry = models.PlayerSupportEntry{CaseID: record.ID, Kind: "chat_out", Actor: supportActor(scope.user), Text: text, Delivery: "pending", RequestKey: &key}
		return tx.Create(&entry).Error
	})
	if err != nil || duplicate {
		return err
	}
	outcome := "sent"
	if err := p.world.Send(scope.spire.Statement.Context, *entry.RequestKey, accountID, view.CharacterID, text); err != nil {
		outcome = "failed"
		if errors.Is(err, playersupport.ErrDeliveryUnknown) {
			outcome = "unconfirmed"
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	err = p.db.GetSpireDb().WithContext(ctx).Model(&entry).Update("delivery", outcome).Error
	p.world.Notify()
	return err
}

func (p *PlayerSupportController) receiveChat(frame playersupport.Frame) playersupport.TellDecision {
	eqemu := p.db.GetEqemuDb()
	if eqemu == nil {
		return playersupport.TellUnavailable
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	var petition models.Petition
	err := eqemu.WithContext(ctx).Table("petitions AS p").Select("p.*").
		Joins("JOIN character_data AS ch ON ch.id = p.petid AND ch.name = p.charname").
		Joins("JOIN account AS acct ON acct.id = ch.account_id AND acct.name = p.accountname").
		Where("ch.id = ? AND ch.account_id = ? AND ch.name = ? AND ch.deleted_at IS NULL", frame.CharacterID, frame.AccountID, frame.Character).
		Order("p.dib DESC").Take(&petition).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return playersupport.TellNoPetition
	}
	if err != nil {
		return playersupport.TellUnavailable
	}
	db := p.db.GetSpireDb()
	if db == nil {
		return playersupport.TellUnavailable
	}
	text := strings.TrimSpace(strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return -1
		}
		return r
	}, frame.Text))
	if text == "" || len(text) > 4096 {
		return playersupport.TellInvalid
	}
	decision := playersupport.TellMessagesOff
	recorded := false
	err = db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var chat models.PlayerSupportChat
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("character_id = ? AND account_id = ?", frame.CharacterID, frame.AccountID).Take(&chat).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		if err != nil || !strings.EqualFold(chat.Character, frame.Character) {
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
		key := "tell-" + frame.RequestID
		entry := models.PlayerSupportEntry{CaseID: chat.CaseID, Kind: "chat_in", Actor: chat.Character, Text: text, RequestKey: &key}
		result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&entry)
		if result.Error == nil {
			decision = playersupport.TellAccepted
			recorded = result.RowsAffected == 1
		}
		return result.Error
	})
	if err != nil {
		return playersupport.TellUnavailable
	}
	if recorded {
		p.world.Notify()
	}
	return decision
}
