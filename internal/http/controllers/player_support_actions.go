package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// supportAction is one change to a player's data made from a case. Every
// such change has a reason, a timeline entry and an audit record.
type supportAction struct {
	// Kind is the timeline entry kind, such as "lockout".
	Kind string
	// RequestID is the client's 32-character hex request ID.
	RequestID string
	// Summary is the first timeline line, such as "Removed lockout ...".
	Summary string
	// Reason is the GM's reason, checked with validatePlayerOperationsReason.
	Reason string
	// Event is the audit event name, such as "PLAYER_SUPPORT_LOCKOUT".
	Event string
	// Details are added to the audit payload.
	Details map[string]interface{}
}

// supportActionResult is what an action's work reports.
type supportActionResult struct {
	// Delivery is "sent", "failed" or "unconfirmed".
	Delivery string
	// Message is appended to the timeline entry and returned to the client.
	Message string
	// Data holds extra response fields.
	Data map[string]interface{}
}

// runSupportAction records action on the case, runs work once, and writes
// the response. The caller has already checked the action's preconditions.
func (p *PlayerSupportController) runSupportAction(c echo.Context, scope supportScope, view supportCaseView, action supportAction, work func() supportActionResult) error {
	entry, err := p.recordSupportAction(c, scope, view, action)
	if err != nil {
		return supportError(c, err)
	}
	result := work()
	ctx, cancel := context.WithTimeout(context.WithoutCancel(c.Request().Context()), 3*time.Second)
	defer cancel()
	update := scope.spire.WithContext(ctx).Model(&models.PlayerSupportEntry{}).Where("id = ?", entry.ID).
		Updates(map[string]interface{}{"delivery": result.Delivery, "text": entry.Text + "\n" + result.Message})
	if update.Error != nil || update.RowsAffected != 1 {
		return c.JSON(http.StatusAccepted, echo.Map{"status": "unconfirmed", "message": "Check the result in game before retrying. The case record could not be updated."})
	}
	if result.Delivery == "failed" {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, result.Message))
	}
	response := echo.Map{}
	for key, value := range result.Data {
		response[key] = value
	}
	response["status"], response["message"] = result.Delivery, result.Message
	return c.JSON(http.StatusOK, response)
}

// recordSupportAction writes the pending timeline entry and the audit record.
// Nothing is left behind when either cannot be written.
func (p *PlayerSupportController) recordSupportAction(c echo.Context, scope supportScope, view supportCaseView, action supportAction) (models.PlayerSupportEntry, error) {
	var entry models.PlayerSupportEntry
	if err := validatePlayerOperationsReason(action.Reason); err != nil {
		return entry, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if !supportRequestKey.MatchString(action.RequestID) {
		return entry, echo.NewHTTPError(http.StatusBadRequest, "Invalid request ID")
	}
	reason := strings.TrimSpace(action.Reason)
	var caseID uint
	err := scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		if record.Status == "resolved" {
			return echo.NewHTTPError(http.StatusConflict, "Reopen the case before changing the player's data")
		}
		caseID = record.ID
		key := fmt.Sprintf("%s-%d-%s", action.Kind, record.ID, action.RequestID)
		entry = models.PlayerSupportEntry{
			CaseID: record.ID, Kind: action.Kind, Actor: supportActor(scope.user), Delivery: "pending",
			Text: action.Summary + "\n" + reason, RequestKey: &key,
		}
		err = tx.Create(&entry).Error
		var duplicate *mysql.MySQLError
		if errors.As(err, &duplicate) && duplicate.Number == 1062 {
			return echo.NewHTTPError(http.StatusConflict, "This action was already recorded. Check the case timeline.")
		}
		return err
	})
	if err != nil {
		return entry, err
	}
	accountID, _ := supportAccountID(scope, view)
	details := action.Details
	if details == nil {
		details = map[string]interface{}{}
	}
	// No support_case_id: the timeline renders those events as deliveries.
	payload, err := json.Marshal(map[string]interface{}{
		"case_key": view.SourceKey, "case_id": caseID, "kind": action.Kind, "summary": action.Summary,
		"reason": reason, "character_id": view.CharacterID, "account_id": accountID, "details": details,
	})
	var auditID uint
	if err == nil {
		auditID, err = p.mail.auditLog.LogEditorEvent(c, action.Event, string(payload))
	}
	if err != nil || auditID == 0 {
		c.Logger().Errorf("Player Support: audit for %s on case %s could not be saved: %v", action.Kind, view.SourceKey, err)
		ctx, cancel := context.WithTimeout(context.WithoutCancel(c.Request().Context()), 3*time.Second)
		defer cancel()
		if err := scope.spire.WithContext(ctx).Where("id = ?", entry.ID).Delete(&models.PlayerSupportEntry{}).Error; err != nil {
			c.Logger().Errorf("Player Support: could not remove unaudited entry %d: %v", entry.ID, err)
		}
		return entry, echo.NewHTTPError(http.StatusServiceUnavailable, "Required operation audit could not be saved")
	}
	return entry, nil
}

// supportCharacterState says where the case's character is, which decides
// between an in-game change (patch) and a database change.
type supportCharacterState struct {
	// State is "in_zone", "zoning", "offline" or "unknown".
	State string
	// Online is the account's character in a zone, which may be an alt.
	Online    playersupport.OnlineCharacter
	InGame    bool
	AccountID uint
}

// characterState reports supportCharacterState for the case's character.
func (p *PlayerSupportController) characterState(scope supportScope, view supportCaseView) (supportCharacterState, error) {
	var state supportCharacterState
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return state, err
	}
	state.AccountID = accountID
	var ingame int
	if view.CharacterID != 0 {
		if err := scope.eqemu.Table("character_data").Select("COALESCE(ingame, 0)").
			Where("id = ?", view.CharacterID).Scan(&ingame).Error; err != nil {
			return state, err
		}
	}
	state.InGame = ingame != 0
	var roster playersupport.Presence
	if p.localWorld(scope) {
		roster = p.world.Roster()
	}
	state.State = supportPresenceState(roster, accountID, view.CharacterID, state.InGame)
	if roster.Known {
		state.Online = roster.InZone[accountID]
	}
	return state, nil
}

// supportPresenceState applies the World roster to the case's character. A
// character that is logged in but not in a zone with the ingame flag set is
// between zones.
func supportPresenceState(roster playersupport.Presence, accountID, characterID uint, inGame bool) string {
	if !roster.Known {
		if inGame {
			return "unknown"
		}
		return "offline"
	}
	online := roster.InZone[accountID]
	switch {
	case accountID != 0 && online.ID != 0 && online.ID == characterID:
		return "in_zone"
	case accountID != 0 && online.ID == 0 && roster.Accounts[accountID] && inGame:
		return "zoning"
	default:
		return "offline"
	}
}

// ---------------------------------------------------------------------------
// Discipline: kick, suspend, ban and chat revocation for the case's account.

const (
	supportEventKick     = "PLAYER_SUPPORT_KICK"
	supportEventSanction = "PLAYER_SUPPORT_SANCTION"
	supportEventRevoke   = "PLAYER_SUPPORT_REVOKE"
)

type supportDisciplineAccount struct {
	ID             uint       `json:"id"`
	Name           string     `json:"name"`
	Status         int        `json:"status"`
	SuspendedUntil *time.Time `json:"suspended_until" gorm:"column:suspendeduntil"`
	SuspendReason  string     `json:"suspend_reason"`
	BanReason      string     `json:"ban_reason"`
	Revoked        bool       `json:"revoked"`
}

// disciplineCase checks the Player Operations sanction permission and
// resolves the case and its account on the server.
func (p *PlayerSupportController) disciplineCase(c echo.Context, write bool) (supportScope, supportCaseView, supportDisciplineAccount, error) {
	var account supportDisciplineAccount
	scope, err := p.scope(c, false)
	if err != nil {
		return scope, supportCaseView{}, account, err
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/player-operations/account/0/sanction", write) {
		message := "Player Operations access is required"
		if write {
			message = "Player Operations write access is required"
		}
		return scope, supportCaseView{}, account, echo.NewHTTPError(http.StatusForbidden, message)
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return scope, view, account, err
	}
	if view.CharacterID == 0 {
		return scope, view, account, echo.NewHTTPError(http.StatusConflict, "The petition cannot be used for this character operation")
	}
	err = scope.eqemu.Table("account").
		Select("id, name, status, suspendeduntil, COALESCE(suspend_reason, '') AS suspend_reason, COALESCE(ban_reason, '') AS ban_reason, revoked").
		Where("name = ?", view.Account).Take(&account).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = echo.NewHTTPError(http.StatusConflict, "The petition account is unavailable")
	}
	return scope, view, account, err
}

// supportSanctionable explains why an account cannot be suspended or banned.
func supportSanctionable(status int) (bool, string) {
	if status > 0 || status < -2 {
		return false, fmt.Sprintf("This account has status %d. Spire suspends and bans player accounts only.", status)
	}
	return true, ""
}

// supportLegacySanction is a restriction Spire saved before it set the
// account status, which EQEmu does not enforce at login.
func supportLegacySanction(account supportDisciplineAccount, now time.Time) bool {
	return account.Status == 0 && (strings.TrimSpace(account.BanReason) != "" || (account.SuspendedUntil != nil && account.SuspendedUntil.After(now)))
}

func (p *PlayerSupportController) discipline(c echo.Context) error {
	scope, _, account, err := p.disciplineCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	local := p.localWorld(scope)
	online := ""
	if local {
		if roster := p.world.Roster(); roster.Known {
			online = roster.InZone[account.ID].Name
		}
	}
	sanctionable, note := supportSanctionable(account.Status)
	legacy := supportLegacySanction(account, time.Now())
	legacyNote := ""
	if legacy {
		legacyNote = "This account was restricted in Spire before restrictions blocked login. Apply it again to enforce it."
	}
	return c.JSON(http.StatusOK, echo.Map{
		"account": account, "online_character": online, "local_world": local,
		"sanctionable": sanctionable, "sanction_note": note, "legacy_sanction": legacy, "legacy_note": legacyNote,
	})
}

func (p *PlayerSupportController) kick(c echo.Context) error {
	var input struct {
		Reason    string `json:"reason"`
		RequestID string `json:"request_id"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid kick request"))
	}
	scope, view, account, err := p.disciplineCase(c, true)
	if err != nil {
		return supportError(c, err)
	}
	if !p.localWorld(scope) {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Kicking needs the game server this Spire runs beside"))
	}
	roster := p.world.Roster()
	online := roster.InZone[account.ID]
	if !roster.Known || online.ID == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "No character on "+account.Name+" is in a zone right now"))
	}
	action := supportAction{
		Kind: "kick", RequestID: input.RequestID, Reason: input.Reason, Event: supportEventKick,
		Summary: "Kicked " + online.Name + " from the game",
		Details: map[string]interface{}{"kicked_character_id": online.ID, "kicked_character": online.Name},
	}
	return p.runSupportAction(c, scope, view, action, func() supportActionResult {
		switch p.world.Kick(online.Name) {
		case playersupport.KickRequested:
			return supportActionResult{Delivery: "sent", Message: "Kick sent. " + online.Name + " should leave the game within a few seconds."}
		case playersupport.KickInvalid:
			return supportActionResult{Delivery: "failed", Message: online.Name + " cannot be kicked from the console."}
		default:
			return supportActionResult{Delivery: "failed", Message: "World did not accept the kick."}
		}
	})
}

func (p *PlayerSupportController) sanction(c echo.Context) error {
	var input struct {
		Mode          string     `json:"mode"`
		Until         *time.Time `json:"until"`
		ExpectedUntil *time.Time `json:"expected_suspended_until"`
		Reason        string     `json:"reason"`
		RequestID     string     `json:"request_id"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid sanction request"))
	}
	input.Mode = strings.ToLower(strings.TrimSpace(input.Mode))
	if err := validatePlayerOperationsSanction(input.Mode, input.Until); err != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, err.Error()))
	}
	scope, view, account, err := p.disciplineCase(c, true)
	if err != nil {
		return supportError(c, err)
	}
	if !playerOperationsTimesEqual(account.SuspendedUntil, input.ExpectedUntil) {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Account sanction changed; refresh before applying"))
	}
	banReason := account.BanReason
	if _, err := playerOperationsSanctionPlan(input.Mode, playerOperationsSanctionAccount{
		Status: account.Status, SuspendedUntil: account.SuspendedUntil, BanReason: &banReason,
	}, input.Until, input.Reason); err != nil {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, err.Error()))
	}
	summary := "Lifted the restriction on account " + account.Name
	switch input.Mode {
	case "suspend":
		summary = "Suspended account " + account.Name + " until " + input.Until.UTC().Format("Jan 2, 2006 15:04 UTC")
	case "ban":
		summary = "Banned account " + account.Name
	}
	action := supportAction{
		Kind: "sanction", RequestID: input.RequestID, Reason: input.Reason, Event: supportEventSanction, Summary: summary,
		Details: map[string]interface{}{
			"mode": input.Mode, "account_name": account.Name, "previous_status": account.Status,
			"previous_until": account.SuspendedUntil, "until": input.Until,
		},
	}
	local := p.localWorld(scope)
	return p.runSupportAction(c, scope, view, action, func() supportActionResult {
		if err := applyPlayerOperationsSanction(scope.eqemu, int(account.ID), input.Mode, input.Until, input.ExpectedUntil, input.Reason); err != nil {
			var conflict playerOperationsConflictError
			if errors.As(err, &conflict) {
				return supportActionResult{Delivery: "failed", Message: conflict.Error()}
			}
			c.Logger().Errorf("Player Support: sanction on account %d failed: %v", account.ID, err)
			return supportActionResult{Delivery: "failed", Message: "The account could not be updated."}
		}
		if input.Mode == "clear" {
			return supportActionResult{Delivery: "sent", Message: "The account can log in again.", Data: map[string]interface{}{"kick": "none", "kicked": []string{}}}
		}
		state, kicked, err := kickSanctionedAccount(scope.eqemu, int(account.ID), local, p.world.Kick)
		if err != nil {
			c.Logger().Errorf("Player Support: could not list in-game characters of account %d: %v", account.ID, err)
		}
		message := "The account is blocked at login."
		switch len(kicked) {
		case 0:
		case 1:
			message += " " + kicked[0] + " was in game and has been kicked."
		default:
			message += " " + strings.Join(kicked, " and ") + " were in game and have been kicked."
		}
		if state == "not_local" || state == "unavailable" {
			message += " Spire could not reach the game server; an online character stays in game until it logs out."
		}
		return supportActionResult{Delivery: "sent", Message: message, Data: map[string]interface{}{"kick": state, "kicked": kicked}}
	})
}

// supportRevokeRefusal is the 409 for a chat change Spire cannot make now.
// inGame is true when a character is in a zone or may be (state "unknown").
func supportRevokeRefusal(state string, inGame, local bool, features playersupport.Features, name string) error {
	switch {
	case inGame && !local:
		return echo.NewHTTPError(http.StatusConflict, name+" is marked in game. Revoking chat for a player in game needs the game server this Spire runs beside; wait until they log out.")
	case inGame && !features.Revoke:
		return echo.NewHTTPError(http.StatusConflict, name+" is in game. Revoking chat for a player in game needs the updated Player Support patch; kick them first or wait until they log out.")
	case state == "unknown":
		return echo.NewHTTPError(http.StatusConflict, "Spire cannot confirm "+name+" is offline. Check that the game server is running.")
	case state == "zoning":
		return echo.NewHTTPError(http.StatusConflict, name+" is zoning. Try again in a moment.")
	}
	return nil
}

func (p *PlayerSupportController) revoke(c echo.Context) error {
	var input struct {
		Revoked   bool   `json:"revoked"`
		Reason    string `json:"reason"`
		RequestID string `json:"request_id"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid chat request"))
	}
	scope, view, account, err := p.disciplineCase(c, true)
	if err != nil {
		return supportError(c, err)
	}
	if account.Revoked == input.Revoked {
		if input.Revoked {
			return supportError(c, echo.NewHTTPError(http.StatusConflict, "Chat is already revoked for this account"))
		}
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Chat is not revoked for this account"))
	}
	state, err := p.characterState(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	inGame := state.Online.ID != 0 || state.State == "unknown"
	name := view.Character
	if state.Online.ID != 0 {
		name = state.Online.Name
	}
	if err := supportRevokeRefusal(state.State, inGame, p.localWorld(scope), p.features(scope), name); err != nil {
		return supportError(c, err)
	}
	summary := "Restored OOC, auction and shout for " + account.Name
	if input.Revoked {
		summary = "Revoked OOC, auction and shout for " + account.Name
	}
	action := supportAction{
		Kind: "revoke", RequestID: input.RequestID, Reason: input.Reason, Event: supportEventRevoke, Summary: summary,
		Details: map[string]interface{}{"revoked": input.Revoked, "account_name": account.Name, "in_game": inGame},
	}
	online := state.Online
	return p.runSupportAction(c, scope, view, action, func() supportActionResult {
		if inGame {
			switch p.world.SetRevoked(online.ID, account.ID, input.Revoked) {
			case "applied":
				return supportActionResult{Delivery: "sent", Message: "Tells still work. The change applies at once in game."}
			case "offline":
				return supportActionResult{Delivery: "failed", Message: online.Name + " left the game. Try again."}
			default:
				return supportActionResult{Delivery: "failed", Message: "The game server did not confirm the change."}
			}
		}
		updated := scope.eqemu.Exec("UPDATE account SET revoked = ? WHERE id = ? AND revoked = ?", boolInt(input.Revoked), account.ID, boolInt(!input.Revoked))
		if updated.Error != nil {
			c.Logger().Errorf("Player Support: chat change on account %d failed: %v", account.ID, updated.Error)
			return supportActionResult{Delivery: "failed", Message: "The account could not be updated."}
		}
		if updated.RowsAffected != 1 {
			return supportActionResult{Delivery: "failed", Message: "The account changed. Refresh and try again."}
		}
		return supportActionResult{Delivery: "sent", Message: "It applies when the player next logs in."}
	})
}
