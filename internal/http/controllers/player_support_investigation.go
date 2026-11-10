package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// toolRoutes are the investigation and repair tool routes: items, restores,
// lockouts, tasks, flags, corpse experience, linked accounts and bug reports.
// Routes() appends them.
func (p *PlayerSupportController) toolRoutes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/items", p.traceItem, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/restores", p.restores, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/lockouts", p.lockouts, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/lockouts", p.removeLockout, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/tasks", p.tasks, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/tasks", p.updateTask, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/flags", p.flags, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/flags/cache", p.reloadBucketCache, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/corpses/:corpse/experience", p.restoreCorpseExp, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/linked-accounts", p.linkedAccounts, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/bug-reports", p.bugReports, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/bug-reports/:id", p.updateBugReport, nil),
	}
}

// toolCase resolves the case for a character tool. Reads need Player
// Operations read access and writes need write access, as for moves.
func (p *PlayerSupportController) toolCase(c echo.Context, write bool) (supportScope, supportCaseView, error) {
	scope, err := p.scope(c, false)
	if err != nil {
		return scope, supportCaseView{}, err
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/player-operations/character/0/relocate", write) {
		if write {
			return scope, supportCaseView{}, echo.NewHTTPError(http.StatusForbidden, "Player Operations write access is required")
		}
		return scope, supportCaseView{}, echo.NewHTTPError(http.StatusForbidden, "Player Operations access is required")
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err == nil && view.CharacterID == 0 {
		err = echo.NewHTTPError(http.StatusConflict, "The petition cannot be used for this character operation")
	}
	return scope, view, err
}

// toolFeatures reports the patch features of the World behind this
// connection; a remote connection has none.
func (p *PlayerSupportController) toolFeatures(scope supportScope) playersupport.Features {
	if !p.localWorld(scope) {
		return playersupport.Features{}
	}
	return p.world.Features()
}

// toolColumns lists a table's columns in lower case. A missing table has
// none, so optional tables read as empty.
func toolColumns(db *gorm.DB, table string) (map[string]bool, error) {
	var names []string
	err := db.Raw("SELECT LOWER(column_name) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?", table).
		Scan(&names).Error
	columns := make(map[string]bool, len(names))
	for _, name := range names {
		columns[name] = true
	}
	return columns, err
}

type toolCharacter struct {
	ID   uint
	Name string
}

// toolAccountCharacters returns the account's characters. Deleted characters
// are included when deleted is true.
func toolAccountCharacters(scope supportScope, accountID uint, deleted bool) ([]toolCharacter, error) {
	characters := []toolCharacter{}
	if accountID == 0 {
		return characters, nil
	}
	query := scope.eqemu.Table("character_data").Select("id, name").Where("account_id = ?", accountID)
	if !deleted {
		query = query.Where("deleted_at IS NULL")
	}
	err := query.Order("id").Scan(&characters).Error
	return characters, err
}

func toolCharacterIDs(characters []toolCharacter) []uint {
	ids := make([]uint, 0, len(characters))
	for _, character := range characters {
		ids = append(ids, character.ID)
	}
	return ids
}

func toolCharacterNames(characters []toolCharacter) map[uint]string {
	names := make(map[uint]string, len(characters))
	for _, character := range characters {
		names[character.ID] = character.Name
	}
	return names
}

// toolAccount resolves the case's account and refuses a case whose account
// no longer exists.
func toolAccount(scope supportScope, view supportCaseView) (uint, error) {
	accountID, err := supportAccountID(scope, view)
	if err == nil && accountID == 0 {
		err = echo.NewHTTPError(http.StatusConflict, "The petition account is unavailable")
	}
	return accountID, err
}

// toolDatabaseRefusal is the 409 for a database edit while the character is
// not known to be offline. It is nil when the state allows the edit.
func toolDatabaseRefusal(state, name string) error {
	switch state {
	case "offline":
		return nil
	case "zoning":
		return echo.NewHTTPError(http.StatusConflict, name+" is zoning. Try again in a moment.")
	case "in_zone":
		return echo.NewHTTPError(http.StatusConflict, name+" is online. Ask them to log out first.")
	default:
		return echo.NewHTTPError(http.StatusConflict, "Spire cannot confirm "+name+" is offline. Check that the game server is running.")
	}
}

// toolContentDB is the content database for the active connection.
func (p *PlayerSupportController) toolContentDB(c echo.Context, scope supportScope, model models.Modelable) (*gorm.DB, error) {
	db := p.db.Get(model, c)
	if db == nil || p.connectionID(scope.user) != scope.connectionID {
		return nil, echo.NewHTTPError(http.StatusConflict, "The active content database changed or is unavailable")
	}
	return db.WithContext(c.Request().Context()), nil
}

// toolViewEntry records that a GM opened private data on the case, at most
// once an hour per GM and text. The case is stored first if needed.
func toolViewEntry(scope supportScope, view supportCaseView, kind, text string, sameText bool) error {
	actor := supportActor(scope.user)
	return scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		query := tx.Model(&models.PlayerSupportEntry{}).
			Where("case_id = ? AND kind = ? AND actor = ? AND created_at >= ?", record.ID, kind, actor, time.Now().Add(-time.Hour))
		if sameText {
			query = query.Where("text = ?", text)
		}
		var recent int64
		if err := query.Count(&recent).Error; err != nil || recent > 0 {
			return err
		}
		return tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: kind, Actor: actor, Text: text}).Error
	})
}

// toolAudit writes an audit-only record for a Player Support operation that
// has no timeline entry.
func (p *PlayerSupportController) toolAudit(c echo.Context, view supportCaseView, event, kind, summary string, accountID uint, details map[string]interface{}) error {
	data, err := json.Marshal(map[string]interface{}{
		"case_key": view.SourceKey, "case_id": view.ID, "kind": kind, "summary": summary, "reason": "",
		"character_id": view.CharacterID, "account_id": accountID, "details": details,
	})
	if err == nil {
		var id uint
		id, err = p.mail.auditLog.LogEditorEvent(c, event, string(data))
		if err == nil && id == 0 {
			err = errors.New("audit record not persisted")
		}
	}
	if err != nil {
		c.Logger().Errorf("Player Support: %s audit failed: %v", event, err)
		return echo.NewHTTPError(http.StatusServiceUnavailable, "Required operation audit could not be saved")
	}
	return nil
}

// toolCut shortens text to limit characters, marking the cut with "…".
func toolCut(text string, limit int) string {
	runes := []rune(text)
	if len(runes) <= limit {
		return text
	}
	return string(runes[:limit]) + "…"
}

// toolGroupedNumber formats n with thousands separators.
func toolGroupedNumber(n int64) string {
	sign := ""
	if n < 0 {
		sign, n = "-", -n
	}
	digits := fmt.Sprint(n)
	var out strings.Builder
	for i, digit := range digits {
		if i > 0 && (len(digits)-i)%3 == 0 {
			out.WriteByte(',')
		}
		out.WriteRune(digit)
	}
	return sign + out.String()
}
