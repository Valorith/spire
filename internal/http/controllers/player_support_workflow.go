package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/EQEmuTools/spire/internal/env"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// workflowRoutes are the case workflow routes: staff list, batch actions,
// account notes, viewer presence and discipline. Routes() appends them.
func (p *PlayerSupportController) workflowRoutes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "player-support/staff", p.staff, nil),
		// Not "/bulk": the permissions middleware treats that as a read.
		routes.RegisterRoute(http.MethodPut, "player-support/batch", p.batch, nil),
		routes.RegisterRoute(http.MethodPost, "player-support/cases/:key/account-notes", p.addAccountNote, nil),
		routes.RegisterRoute(http.MethodDelete, "player-support/cases/:key/account-notes/:id", p.deleteAccountNote, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/presence", p.updatePresence, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/discipline", p.discipline, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/kick", p.kick, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/sanction", p.sanction, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/revoke", p.revoke, nil),
	}
}

// ---------------------------------------------------------------------------
// Categories, and a suggestion from the petition text.

var supportCategories = []struct{ ID, Label string }{
	{"items", "Lost or missing items"},
	{"corpse", "Corpse or death"},
	{"stuck", "Stuck or location"},
	{"quest", "Quest or progress"},
	{"conduct", "Player conduct"},
	{"bug", "Bug report"},
	{"account", "Account or access"},
	{"other", "Other"},
}

func supportCategoryLabel(id string) (string, bool) {
	for _, category := range supportCategories {
		if category.ID == id {
			return category.Label, true
		}
	}
	return "", false
}

// Keywords per category, in tie-break order. A keyword matches whole words
// of the petition text; a keyword of several words matches them in a row.
// The last word of a stem also matches longer words that start with it, so
// "quest" counts "quests" but not "request". Words match exactly, for
// keywords that start too many unrelated words ("ban" and "bank", "key" and
// "keyboard"), and list the forms they match.
var supportCategoryKeywords = []struct {
	ID    string
	Stems []string
	Words []string
}{
	{"corpse", []string{"corpse", "died", "death", "dead", "resurrect", "exp loss", "experience"},
		[]string{"rez", "rezz", "body", "bodies"}},
	{"stuck", []string{"stuck", "under the world", "fell through", "falling", "trapped", "can't move", "cannot move", "can not move", "bind"}, nil},
	{"items", []string{"item", "lost", "missing", "disappear", "vanish", "gone", "trade", "destroy", "deleted", "bank"},
		[]string{"sold", "bag", "bags"}},
	{"quest", []string{"quest", "task", "flag", "lockout", "expedition", "instance", "progress"},
		[]string{"key", "keys"}},
	{"conduct", []string{"harass", "spam", "cheat", "hack", "exploit", "rude", "scam", "threat", "kill steal"},
		[]string{"bot", "bots", "botting", "botter", "ks", "ksing", "train", "trains", "trained", "training"}},
	{"bug", []string{"broken", "error", "crash", "glitch", "not working", "doesn't work"},
		[]string{"bug", "bugs", "bugged"}},
	{"account", []string{"account", "password", "login", "log in", "suspend", "name change", "transfer"},
		[]string{"ban", "bans", "banned"}},
}

// supportWords splits text into lowercase words of letters, digits and
// apostrophes.
func supportWords(text string) []string {
	text = strings.ReplaceAll(strings.ToLower(text), "\u2019", "'")
	return strings.FieldsFunc(text, func(r rune) bool {
		return r != '\'' && !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
}

// supportKeywordHit reports whether the keyword's words appear in a row in
// words. With stem, its last word also matches a longer word it starts.
func supportKeywordHit(words []string, keyword string, stem bool) bool {
	parts := strings.Fields(keyword)
	last := len(parts) - 1
	for start := 0; start+last < len(words); start++ {
		matched := true
		for i, part := range parts {
			word := words[start+i]
			if word != part && !(stem && i == last && strings.HasPrefix(word, part)) {
				matched = false
				break
			}
		}
		if matched {
			return true
		}
	}
	return false
}

// supportSuggestCategory counts keyword hits per category in the petition
// text. The most hits win; a tie goes to the earlier category.
func supportSuggestCategory(message string) string {
	words := supportWords(message)
	best, bestHits := "", 0
	for _, category := range supportCategoryKeywords {
		hits := 0
		for _, keyword := range category.Stems {
			if supportKeywordHit(words, keyword, true) {
				hits++
			}
		}
		for _, keyword := range category.Words {
			if supportKeywordHit(words, keyword, false) {
				hits++
			}
		}
		if hits > bestHits {
			best, bestHits = category.ID, hits
		}
	}
	return best
}

// ---------------------------------------------------------------------------
// Staff who can work cases on this connection.

type supportStaffMember struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func (p *PlayerSupportController) staff(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	staff, err := p.supportStaff(c, scope)
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{"staff": staff})
}

// supportStaff lists the users linked to the connection, and its creator,
// who may write Player Support cases on it.
func (p *PlayerSupportController) supportStaff(c echo.Context, scope supportScope) ([]supportStaffMember, error) {
	staff := []supportStaffMember{}
	if scope.connectionID == 0 {
		return append(staff, supportStaffMember{ID: scope.user.ID, Name: supportActor(scope.user)}), nil
	}
	var ids []uint
	if err := scope.spire.Table("spire_user_server_database_connections").
		Where("server_database_connection_id = ? AND deleted_at IS NULL", scope.connectionID).
		Distinct().Pluck("user_id", &ids).Error; err != nil {
		return nil, err
	}
	var owner uint
	if err := scope.spire.Table("spire_server_database_connections").Select("created_by").
		Where("id = ?", scope.connectionID).Scan(&owner).Error; err != nil {
		return nil, err
	}
	if owner > 0 {
		ids = append(ids, owner)
	}
	if len(ids) == 0 {
		return staff, nil
	}
	query := scope.spire.Where("id IN ?", ids)
	if env.IsAppEnvProduction() {
		query = query.Where("is_admin = ?", true)
	}
	var users []models.User
	if err := query.Find(&users).Error; err != nil {
		return nil, err
	}
	for _, user := range users {
		if p.permissions.CanAccessRoute(c, user, scope.connectionID, "/api/v1/player-support/cases", true) {
			staff = append(staff, supportStaffMember{ID: user.ID, Name: supportActor(user)})
		}
	}
	sort.Slice(staff, func(i, j int) bool {
		if !strings.EqualFold(staff[i].Name, staff[j].Name) {
			return strings.ToLower(staff[i].Name) < strings.ToLower(staff[j].Name)
		}
		return staff[i].ID < staff[j].ID
	})
	return staff, nil
}

// supportStaffName is the name of a staff member, or "" when id is not one.
func supportStaffName(staff []supportStaffMember, id uint) string {
	for _, member := range staff {
		if member.ID == id {
			return member.Name
		}
	}
	return ""
}

// ---------------------------------------------------------------------------
// Viewer presence. It is per Spire process and advisory; nothing is locked.

const supportPresenceExpiry = 40 * time.Second

type supportViewer struct {
	Name      string `json:"name"`
	Composing bool   `json:"composing"`
}

type supportPresenceEntry struct {
	supportViewer
	seen time.Time
}

type supportPresence struct {
	mu    sync.Mutex
	cases map[string]map[uint]supportPresenceEntry
}

func supportPresenceKey(connectionID uint, key string) string {
	return fmt.Sprintf("%d|%s", connectionID, key)
}

// update records the user's state ("viewing", "composing" or "left") and
// returns the other viewers.
func (s *supportPresence) update(key string, userID uint, name, state string, now time.Time) []supportViewer {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cases == nil {
		s.cases = map[string]map[uint]supportPresenceEntry{}
	}
	if state == "left" {
		delete(s.cases[key], userID)
	} else {
		if s.cases[key] == nil {
			s.cases[key] = map[uint]supportPresenceEntry{}
		}
		s.cases[key][userID] = supportPresenceEntry{supportViewer{Name: name, Composing: state == "composing"}, now}
	}
	return s.viewersLocked(key, userID, now)
}

// viewers returns who else is on the case, dropping expired entries.
func (s *supportPresence) viewers(key string, userID uint, now time.Time) []supportViewer {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.viewersLocked(key, userID, now)
}

func (s *supportPresence) viewersLocked(key string, userID uint, now time.Time) []supportViewer {
	viewers := []supportViewer{}
	for id, entry := range s.cases[key] {
		if now.Sub(entry.seen) > supportPresenceExpiry {
			delete(s.cases[key], id)
			continue
		}
		if id != userID {
			viewers = append(viewers, entry.supportViewer)
		}
	}
	if len(s.cases[key]) == 0 {
		delete(s.cases, key)
	}
	sort.Slice(viewers, func(i, j int) bool { return viewers[i].Name < viewers[j].Name })
	return viewers
}

func (p *PlayerSupportController) decorateViewers(scope supportScope, cases []supportCaseView) {
	now := time.Now()
	for i := range cases {
		cases[i].Viewers = p.presence.viewers(supportPresenceKey(scope.connectionID, cases[i].SourceKey), scope.user.ID, now)
	}
}

func (p *PlayerSupportController) updatePresence(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	var input struct {
		State string `json:"state"`
	}
	if c.Bind(&input) != nil || (input.State != "viewing" && input.State != "composing" && input.State != "left") {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid presence state"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	viewers := p.presence.update(supportPresenceKey(scope.connectionID, view.SourceKey), scope.user.ID, supportActor(scope.user), input.State, time.Now())
	return c.JSON(http.StatusOK, echo.Map{"viewers": viewers})
}

// ---------------------------------------------------------------------------
// Account notes: staff notes on an EQEmu account, shown on all its cases.

const supportAccountNoteLimit = 20

func (s supportScope) accountNotes(view supportCaseView) ([]models.PlayerSupportAccountNote, error) {
	notes := []models.PlayerSupportAccountNote{}
	accountID, err := supportAccountID(s, view)
	if err != nil || accountID == 0 {
		return notes, err
	}
	err = s.spire.Where("connection_id = ? AND account_id = ?", s.connectionID, accountID).
		Order("id DESC").Limit(supportAccountNoteLimit).Find(&notes).Error
	return notes, err
}

// decorateNoteCounts sets the number of account notes on each case.
// Failures leave the counts at zero.
func (s supportScope) decorateNoteCounts(cases []supportCaseView) {
	names := make([]string, 0, len(cases))
	for _, record := range cases {
		if record.Account != "" {
			names = append(names, record.Account)
		}
	}
	if len(names) == 0 {
		return
	}
	var accounts []struct {
		ID   uint
		Name string
	}
	if s.eqemu.Table("account").Select("id, name").Where("name IN ?", names).Scan(&accounts).Error != nil || len(accounts) == 0 {
		return
	}
	ids := make([]uint, 0, len(accounts))
	byName := map[string]uint{}
	for _, account := range accounts {
		ids = append(ids, account.ID)
		byName[strings.ToLower(account.Name)] = account.ID
	}
	var counts []struct {
		AccountID uint
		Total     int
	}
	if s.spire.Model(&models.PlayerSupportAccountNote{}).Select("account_id, COUNT(*) AS total").
		Where("connection_id = ? AND account_id IN ?", s.connectionID, ids).Group("account_id").Scan(&counts).Error != nil {
		return
	}
	byAccount := map[uint]int{}
	for _, count := range counts {
		byAccount[count.AccountID] = count.Total
	}
	for i := range cases {
		cases[i].AccountNotes = byAccount[byName[strings.ToLower(cases[i].Account)]]
	}
}

func (p *PlayerSupportController) addAccountNote(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	var input struct {
		Text string `json:"text"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Enter a note of up to 2,000 characters"))
	}
	text := strings.TrimSpace(input.Text)
	if text == "" || utf8.RuneCountInString(text) > 2000 {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Enter a note of up to 2,000 characters"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	if accountID == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The petition account is unavailable"))
	}
	actor := supportActor(scope.user)
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&models.PlayerSupportAccountNote{}).Where("connection_id = ? AND account_id = ?", scope.connectionID, accountID).
			Count(&count).Error; err != nil {
			return err
		}
		if count >= supportAccountNoteLimit {
			return echo.NewHTTPError(http.StatusConflict, "Keep up to 20 notes per account")
		}
		note := models.PlayerSupportAccountNote{
			ConnectionID: scope.connectionID, AccountID: accountID, Account: view.Account, Text: text,
			AuthorID: scope.user.ID, Author: actor,
		}
		if err := tx.Create(&note).Error; err != nil {
			return err
		}
		return tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: "account_note", Actor: actor, Text: "Added an account note\n" + text}).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	notes, err := scope.accountNotes(view)
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"notes": notes})
}

func (p *PlayerSupportController) deleteAccountNote(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusNotFound, "That note was already removed"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	if accountID == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusNotFound, "That note was already removed"))
	}
	actor := supportActor(scope.user)
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		var note models.PlayerSupportAccountNote
		err = tx.Clauses(clauseLockForUpdate()).Where("id = ? AND connection_id = ? AND account_id = ?", id, scope.connectionID, accountID).
			Take(&note).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "That note was already removed")
		}
		if err != nil {
			return err
		}
		if err := tx.Where("id = ? AND connection_id = ? AND account_id = ?", note.ID, scope.connectionID, accountID).
			Delete(&models.PlayerSupportAccountNote{}).Error; err != nil {
			return err
		}
		return tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: "account_note", Actor: actor, Text: "Removed an account note\n" + note.Text}).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	notes, err := scope.accountNotes(view)
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{"notes": notes})
}

// ---------------------------------------------------------------------------
// Batch actions: each case runs the single-case path in its own transaction.

const supportBatchLimit = 50

type supportBatchInput struct {
	Action string `json:"action"`
	Cases  []struct {
		Key      string `json:"key"`
		Revision uint   `json:"revision"`
	} `json:"cases"`
	AssigneeID  uint   `json:"assignee_id"`
	Category    string `json:"category"`
	Text        string `json:"text"`
	CloseInGame bool   `json:"close_in_game"`
}

type supportBatchResult struct {
	Key      string                `json:"key"`
	OK       bool                  `json:"ok"`
	Error    string                `json:"error,omitempty"`
	Petition *supportPetitionClose `json:"petition,omitempty"`
}

func validateSupportBatch(input supportBatchInput) error {
	switch input.Action {
	case "claim", "assign", "categorize", "wait", "resolve":
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "Unknown batch action")
	}
	if len(input.Cases) < 1 || len(input.Cases) > supportBatchLimit {
		return echo.NewHTTPError(http.StatusBadRequest, "Choose between 1 and 50 cases")
	}
	seen := map[string]bool{}
	for _, item := range input.Cases {
		if seen[item.Key] {
			return echo.NewHTTPError(http.StatusBadRequest, "Choose each case only once")
		}
		seen[item.Key] = true
	}
	return nil
}

func (p *PlayerSupportController) batch(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	var input supportBatchInput
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid batch request"))
	}
	if err := validateSupportBatch(input); err != nil {
		return supportError(c, err)
	}
	assignee := ""
	if input.Action == "assign" && input.AssigneeID != 0 {
		staff, err := p.supportStaff(c, scope)
		if err != nil {
			return supportError(c, err)
		}
		assignee = supportStaffName(staff, input.AssigneeID)
	}
	results := make([]supportBatchResult, 0, len(input.Cases))
	for _, item := range input.Cases {
		update := supportUpdate{
			Action: input.Action, Text: input.Text, Revision: item.Revision, AssigneeID: input.AssigneeID,
			Category: input.Category, CloseInGame: input.CloseInGame, assigneeName: assignee,
		}
		petition, err := p.updateCase(c, scope, item.Key, update)
		result := supportBatchResult{Key: item.Key, OK: err == nil, Petition: petition}
		if err != nil {
			result.Error = supportErrorMessage(c, err)
		}
		results = append(results, result)
	}
	return c.JSON(http.StatusOK, echo.Map{"results": results})
}

// supportErrorMessage is the sentence supportError would answer with.
func supportErrorMessage(c echo.Context, err error) string {
	var httpErr *echo.HTTPError
	if errors.As(err, &httpErr) {
		if message, ok := httpErr.Message.(string); ok {
			return message
		}
	}
	c.Logger().Errorf("Player Support: %v", err)
	return "Player Support database request failed"
}

// ---------------------------------------------------------------------------
// Clearing the in-game petition when a case is resolved.

type supportPetitionClose struct {
	// Status is "closed", "deleted", "checked_out", "gone" or "unconfirmed".
	Status  string `json:"status"`
	Message string `json:"message"`
}

const supportEventPetitionClose = "PLAYER_SUPPORT_PETITION_CLOSE"

// closeInGamePetition clears the resolved case's petition through World when
// it supports that, and in the database otherwise. The case stays resolved
// whatever happens here.
func (p *PlayerSupportController) closeInGamePetition(c echo.Context, scope supportScope, view supportCaseView, caseID, accountID uint) *supportPetitionClose {
	dibText, sentText, _ := strings.Cut(view.SourceKey, "-")
	dib, _ := strconv.ParseUint(dibText, 10, 32)
	senttime, _ := strconv.ParseInt(sentText, 10, 64)
	ctx, cancel := context.WithTimeout(context.WithoutCancel(c.Request().Context()), 5*time.Second)
	defer cancel()
	local := p.localWorld(scope)
	features := p.features(scope)
	status, via := "", "database"
	if local && features.ClosePetition && p.connectionID(scope.user) == scope.connectionID {
		status, via = p.world.ClosePetition(uint(dib), senttime, accountID), "world"
	}
	if status == "" || status == playersupport.PetitionNoCommand {
		status, via = closePetitionInDatabase(scope.eqemu.WithContext(ctx), uint(dib), senttime, view.Account), "database"
	}
	result, delivery, message := supportPetitionCloseResult(status, local && features.Patch >= 1)
	summary := fmt.Sprintf("Cleared petition #%d in game", view.PetitionID)
	payload, _ := json.Marshal(map[string]interface{}{
		"case_key": view.SourceKey, "case_id": caseID, "kind": "petition_close", "summary": summary,
		"character_id": view.CharacterID, "account_id": accountID,
		"details": map[string]interface{}{"dib": dib, "senttime": senttime, "status": status, "via": via, "message": message},
	})
	if id, err := p.mail.auditLog.LogEditorEvent(c, supportEventPetitionClose, string(payload)); err != nil || id == 0 {
		c.Logger().Errorf("Player Support: petition close audit for %s could not be saved: %v", view.SourceKey, err)
	}
	entry := models.PlayerSupportEntry{CaseID: caseID, Kind: "petition_close", Actor: supportActor(scope.user), Delivery: delivery, Text: summary + "\n" + message}
	if err := scope.spire.WithContext(ctx).Create(&entry).Error; err != nil {
		c.Logger().Errorf("Player Support: petition close entry for %s could not be saved: %v", view.SourceKey, err)
	}
	return &supportPetitionClose{Status: result, Message: message}
}

// closePetitionInDatabase deletes a petition that is not checked out. Zones
// that loaded it keep it until their next petition refresh.
func closePetitionInDatabase(db *gorm.DB, dib uint, senttime int64, account string) string {
	deleted := db.Exec("DELETE FROM petitions WHERE dib = ? AND senttime = ? AND accountname = ? AND ischeckedout = 0", dib, senttime, account)
	if deleted.Error != nil {
		return playersupport.PetitionUnavailable
	}
	if deleted.RowsAffected > 0 {
		return "deleted"
	}
	var rows []struct{ Ischeckedout int }
	if err := db.Table("petitions").Select("ischeckedout").Where("dib = ? AND senttime = ? AND accountname = ?", dib, senttime, account).
		Limit(1).Scan(&rows).Error; err != nil {
		return playersupport.PetitionUnavailable
	}
	if len(rows) == 0 {
		return playersupport.PetitionGone
	}
	if rows[0].Ischeckedout != 0 {
		return playersupport.PetitionCheckedOut
	}
	return playersupport.PetitionUnconfirmed
}

// supportPetitionCloseResult turns a World or database outcome into the
// response status, the timeline delivery and the message. currentPatch is
// a local World whose patched #petition rereads the database.
func supportPetitionCloseResult(status string, currentPatch bool) (string, string, string) {
	switch status {
	case playersupport.PetitionClosed:
		return "closed", "sent", "Removed from the in-game queue. The player can file a new petition."
	case "deleted":
		if currentPatch {
			return "deleted", "sent", "Removed from the database. Zones that loaded it keep it until the next petition is filed or withdrawn; #petition already sees the change."
		}
		return "deleted", "sent", "Removed from the database. Zones that loaded it keep it until the next petition is filed or withdrawn, so the player may be told one is still open until then."
	case playersupport.PetitionCheckedOut:
		return "checked_out", "failed", "Not cleared: a Game Master checked it out in game. Clear it with #delpetition."
	case playersupport.PetitionGone:
		return "gone", "sent", "It was already cleared in game."
	default:
		return "unconfirmed", "unconfirmed", "Spire could not confirm it was cleared. Check #listpetition."
	}
}
