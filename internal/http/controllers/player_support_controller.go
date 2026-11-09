package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"maps"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/env"
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/http/request"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/permissions"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerSupportController struct {
	db          *database.Resolver
	permissions *permissions.Service
	mail        *MailParcelsEditorController
	world       *playersupport.World
	log         *logger.AppLogger
	// postWebhook sends petition alerts; tests replace it.
	postWebhook func(ctx context.Context, url string, body []byte) error
	// presence holds who is viewing each case.
	presence supportPresence
}

// A live case is aging when nobody has answered it after supportAgingAfter,
// and overdue after supportOverdueAfter. A waiting case needs a follow-up when
// the player has not replied within supportFollowUpAfter.
const (
	supportAgingAfter    = 30 * time.Minute
	supportOverdueAfter  = 2 * time.Hour
	supportFollowUpAfter = 48 * time.Hour
)

func NewPlayerSupportController(db *database.Resolver, permissions *permissions.Service, mail *MailParcelsEditorController, config *eqemuserverconfig.Config, log *logger.AppLogger) *PlayerSupportController {
	controller := &PlayerSupportController{db: db, permissions: permissions, mail: mail, log: log}
	controller.world = playersupport.NewWorld(config, log, controller.receiveChat)
	if config != nil && config.Exists() && db.GetSpireDb() != nil {
		go func() {
			var active models.PlayerSupportChat
			if db.GetSpireDb().Select("account_id").Take(&active).Error == nil {
				controller.world.Resume()
			}
		}()
	}
	if db.GetSpireDb() != nil {
		go controller.watchPetitionAlerts(context.Background())
	}
	return controller
}

func (p *PlayerSupportController) Routes() []*routes.Route {
	list := []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "player-support/cases", p.list, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key", p.detail, nil),
		routes.RegisterRoute(http.MethodPatch, "player-support/cases/:key", p.update, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/reply", p.reply, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/parcel", p.parcel, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/chat", p.chat, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/chat", p.updateChat, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/recovery", p.recovery, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/events", p.events, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/snapshots", p.snapshots, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/snapshots/:time", p.snapshotDiff, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/merge", p.merge, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/replies", p.listReplies, nil),
		routes.RegisterRoute(http.MethodPost, "player-support/replies", p.saveReply, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/replies/:id", p.saveReply, nil),
		routes.RegisterRoute(http.MethodDelete, "player-support/replies/:id", p.deleteReply, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/settings", p.settings, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/settings", p.updateSettings, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/metrics", p.metrics, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/corpses/:corpse", p.corpseContents, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/move", p.moveRecoveryTarget, nil),
	}
	list = append(list, p.workflowRoutes()...)
	return append(list, p.toolRoutes()...)
}

type supportScope struct {
	spire, eqemu *gorm.DB
	connectionID uint
	user         models.User
}

type supportCaseView struct {
	models.PlayerSupportCase
	NativeOpen        bool   `json:"native_open"`
	CheckedOut        bool   `json:"checked_out"`
	LastGM            string `json:"last_gm,omitempty"`
	NativeNote        string `json:"native_note,omitempty"`
	Mine              bool   `json:"mine"`
	AccountPresence   string `json:"account_presence"`
	CharacterPresence string `json:"character_presence,omitempty"`
	// OnlineCharacter is the account's character in a zone, which can differ
	// from the character that filed the petition.
	OnlineCharacter string `json:"online_character,omitempty"`
	// MessagesOn and LastReplyAt let the queue flag live conversations and
	// player replies the viewer has not seen.
	MessagesOn  bool       `json:"messages_on"`
	LastReplyAt *time.Time `json:"last_reply_at,omitempty"`
	ZoneName    string     `json:"zone_name,omitempty"`
	// MergedKey is the case this one was merged into.
	MergedKey string `json:"merged_into,omitempty"`
	// SuggestedCategory is set while the case has no category.
	SuggestedCategory string `json:"suggested_category,omitempty"`
	// AgeState is "fresh", "aging" or "overdue"; FollowUp marks a waiting
	// case the player has not answered.
	AgeState string          `json:"age_state"`
	FollowUp bool            `json:"follow_up"`
	Viewers  []supportViewer `json:"viewers"`
	// AccountNotes counts the staff notes on the case's account.
	AccountNotes int `json:"account_notes"`
}

type supportActivity struct {
	Key       string    `json:"key"`
	Kind      string    `json:"kind"`
	Actor     string    `json:"actor"`
	Text      string    `json:"text"`
	Delivery  string    `json:"delivery,omitempty"`
	Recipient string    `json:"recipient,omitempty"`
	Receipt   []uint    `json:"receipt,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (p *PlayerSupportController) connectionID(user models.User) uint {
	if user.ID == 0 {
		return 0
	}
	return p.db.GetUserConnection(user).ServerDatabaseConnectionId
}

func (p *PlayerSupportController) scope(c echo.Context, list bool) (supportScope, error) {
	user := request.GetUser(c)
	if env.IsAppEnvProduction() && !user.IsAdmin {
		return supportScope{}, echo.NewHTTPError(http.StatusForbidden, "Server Admin access is required")
	}
	spire := p.db.GetSpireDb()
	if spire == nil {
		return supportScope{}, echo.NewHTTPError(http.StatusServiceUnavailable, "Spire database unavailable")
	}
	connectionID := p.connectionID(user)
	if env.IsAppEnvProduction() && connectionID == 0 {
		return supportScope{}, echo.NewHTTPError(http.StatusForbidden, "Select a server connection")
	}
	if connectionID > 0 && !p.permissions.CanAccessResource(c, user, connectionID) {
		return supportScope{}, echo.NewHTTPError(http.StatusForbidden, "Player Support access is required")
	}
	if !list && c.QueryParam("connection_id") != strconv.FormatUint(uint64(connectionID), 10) {
		return supportScope{}, echo.NewHTTPError(http.StatusConflict, "The active server changed. Refresh Player Support.")
	}
	eqemu := p.db.Get(models.Petition{}, c)
	if eqemu == nil {
		return supportScope{}, echo.NewHTTPError(http.StatusServiceUnavailable, "EQEmu database unavailable")
	}
	if p.connectionID(user) != connectionID || p.mail.auditLog.ActiveConnectionID(c) != connectionID {
		return supportScope{}, echo.NewHTTPError(http.StatusConflict, "The active server changed. Refresh Player Support.")
	}
	ctx := c.Request().Context()
	return supportScope{spire.WithContext(ctx), eqemu.WithContext(ctx), connectionID, user}, nil
}

func supportSourceKey(row models.Petition) string {
	return fmt.Sprintf("%d-%d", row.Dib, row.Senttime)
}

func supportView(record models.PlayerSupportCase, row models.Petition, userID uint) supportCaseView {
	view := supportCaseView{
		PlayerSupportCase: record,
		NativeOpen:        row.Dib != 0,
		CheckedOut:        row.Ischeckedout != 0,
		LastGM:            row.Lastgm,
		NativeNote:        row.Gmtext.String,
		Mine:              record.Owner != "" && record.OwnerID == userID,
		AgeState:          "fresh",
		Viewers:           []supportViewer{},
	}
	if record.Category == "" {
		view.SuggestedCategory = supportSuggestCategory(record.Message)
	}
	return view
}

func (s supportScope) newCase(row models.Petition) models.PlayerSupportCase {
	return models.PlayerSupportCase{
		ConnectionID: s.connectionID, SourceKey: supportSourceKey(row), PetitionID: row.Petid,
		Character: row.Charname, Account: row.Accountname, Zone: row.Zone,
		Message: row.Petitiontext, Urgency: row.Urgency, SubmittedAt: row.Senttime, Status: "open",
	}
}

func (p *PlayerSupportController) list(c echo.Context) error {
	scope, err := p.scope(c, true)
	if err != nil {
		return supportError(c, err)
	}
	filter := c.QueryParam("filter")
	category := c.QueryParam("category")
	if _, known := supportCategoryLabel(category); category != "" && !known {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Unknown category"))
	}
	// Resolved cases are paginated in Spire; the live inbox merges the native
	// queue and the unresolved records that were already imported.
	var native []models.Petition
	if err := scope.eqemu.Find(&native).Error; err != nil {
		return supportError(c, err)
	}
	byKey := make(map[string]models.Petition, len(native))
	keys := make([]string, 0, len(native))
	for _, row := range native {
		key := supportSourceKey(row)
		byKey[key] = row
		keys = append(keys, key)
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	page = max(1, min(page, 1000000))
	const size = 30
	search := strings.TrimSpace(c.QueryParam("q"))
	// The live inbox drives the header summary for every filter, so it is
	// built before the resolved list branches off.
	var live []models.PlayerSupportCase
	liveQuery := scope.spire.Where("connection_id = ?", scope.connectionID)
	if len(keys) > 0 {
		liveQuery = liveQuery.Where("(status <> ? OR source_key IN ?)", "resolved", keys)
	} else {
		liveQuery = liveQuery.Where("status <> ?", "resolved")
	}
	if err := liveQuery.Find(&live).Error; err != nil {
		return supportError(c, err)
	}
	unimported := maps.Clone(byKey)
	cases := make([]supportCaseView, 0, len(live)+len(native))
	for _, record := range live {
		row := byKey[record.SourceKey]
		delete(unimported, record.SourceKey)
		if record.Status != "resolved" {
			cases = append(cases, supportView(record, row, scope.user.ID))
		}
	}
	for _, row := range unimported {
		cases = append(cases, supportView(scope.newCase(row), row, scope.user.ID))
	}
	if err := scope.decorateAge(cases, time.Now()); err != nil {
		return supportError(c, err)
	}
	summary := supportQueueSummary(cases, scope.user.ID)
	scope.latestReply(&summary)
	features := p.features(scope)
	if filter == "resolved" {
		query := scope.spire.Model(&models.PlayerSupportCase{}).
			Where("connection_id = ? AND status = ?", scope.connectionID, "resolved")
		if category != "" {
			query = query.Where("category = ?", category)
		}
		if search != "" {
			pattern := "%" + strings.NewReplacer("!", "!!", "%", "!%", "_", "!_").Replace(search) + "%"
			query = query.Where("(character_name LIKE ? ESCAPE '!' OR account LIKE ? ESCAPE '!' OR message LIKE ? ESCAPE '!' OR source_key LIKE ? ESCAPE '!')",
				pattern, pattern, pattern, pattern)
		}
		var count int64
		var records []models.PlayerSupportCase
		if err := query.Count(&count).Error; err != nil {
			return supportError(c, err)
		}
		if err := query.Order("updated_at DESC, id DESC").Limit(size).Offset((page - 1) * size).Find(&records).Error; err != nil {
			return supportError(c, err)
		}
		resolved := make([]supportCaseView, 0, len(records))
		for _, record := range records {
			resolved = append(resolved, supportView(record, byKey[record.SourceKey], scope.user.ID))
		}
		p.decorateCases(c, scope, resolved)
		return c.JSON(http.StatusOK, echo.Map{
			"cases": resolved, "total": count, "connection_id": scope.connectionID, "summary": summary,
			"companion": p.companion(scope), "features": features,
		})
	}

	search = strings.ToLower(search)
	matches := cases[:0]
	for _, record := range cases {
		if !supportFilterMatches(filter, record) || category != "" && record.Category != category {
			continue
		}
		if search == "" || strings.Contains(strings.ToLower(record.Character+" "+record.Account+" "+record.Message+" "+record.SourceKey), search) {
			matches = append(matches, record)
		}
	}
	sort.Slice(matches, func(i, j int) bool {
		if matches[i].Escalated != matches[j].Escalated {
			return matches[i].Escalated
		}
		if matches[i].Urgency != matches[j].Urgency {
			return matches[i].Urgency > matches[j].Urgency
		}
		if matches[i].SubmittedAt != matches[j].SubmittedAt {
			return matches[i].SubmittedAt < matches[j].SubmittedAt
		}
		return matches[i].SourceKey < matches[j].SourceKey
	})
	start := min((page-1)*size, len(matches))
	end := min(start+size, len(matches))
	p.decorateCases(c, scope, matches[start:end])
	return c.JSON(http.StatusOK, echo.Map{
		"cases": matches[start:end], "total": len(matches), "connection_id": scope.connectionID, "summary": summary,
		"companion": p.companion(scope), "features": features,
	})
}

func supportFilterMatches(filter string, record supportCaseView) bool {
	switch filter {
	case "mine":
		return record.Mine
	case "unassigned":
		return record.Owner == ""
	case "waiting":
		return record.Status == "waiting"
	case "attention":
		return supportNeedsAttention(record)
	default:
		return true
	}
}

func supportNeedsAttention(record supportCaseView) bool {
	return record.Escalated || record.AgeState == "overdue" || record.FollowUp
}

// decorateCases adds the per-page details of each case.
func (p *PlayerSupportController) decorateCases(c echo.Context, scope supportScope, cases []supportCaseView) {
	p.decoratePresence(scope, cases)
	p.decorateZones(c, cases)
	decorateConversations(scope, cases)
	p.decorateViewers(scope, cases)
	scope.decorateNoteCounts(cases)
}

// features reports the patch features of the World behind this connection.
// Only the local World is checked; another connection has none.
func (p *PlayerSupportController) features(scope supportScope) playersupport.Features {
	if !p.localWorld(scope) {
		return playersupport.Features{}
	}
	return p.world.Features()
}

// supportCaseTimes are the timeline facts that decide a case's age state.
type supportCaseTimes struct {
	// Responded: staff sent a tell or a delivery.
	Responded  bool
	LastWait   *time.Time
	LastChatIn *time.Time
}

// supportAgeState measures an unanswered open case from when it was filed.
func supportAgeState(status string, submittedAt int64, times supportCaseTimes, now time.Time) string {
	if status != "open" || times.Responded {
		return "fresh"
	}
	age := now.Sub(time.Unix(submittedAt, 0))
	switch {
	case age > supportOverdueAfter:
		return "overdue"
	case age >= supportAgingAfter:
		return "aging"
	default:
		return "fresh"
	}
}

// supportFollowUp marks a waiting case the player has not answered since
// staff marked it waiting.
func supportFollowUp(status string, times supportCaseTimes, now time.Time) bool {
	if status != "waiting" || times.LastWait == nil || now.Sub(*times.LastWait) < supportFollowUpAfter {
		return false
	}
	return times.LastChatIn == nil || !times.LastChatIn.After(*times.LastWait)
}

// decorateAge sets the age state and follow-up flag of live cases.
func (s supportScope) decorateAge(cases []supportCaseView, now time.Time) error {
	ids := make([]uint, 0, len(cases))
	for _, record := range cases {
		if record.ID > 0 {
			ids = append(ids, record.ID)
		}
	}
	times := map[uint]*supportCaseTimes{}
	if len(ids) > 0 {
		var entries []struct {
			CaseID uint
			Kind   string
			Last   time.Time
		}
		if err := s.spire.Model(&models.PlayerSupportEntry{}).Select("case_id, kind, MAX(created_at) AS last").
			Where("case_id IN ? AND kind IN ?", ids, []string{"chat_out", "wait", "chat_in"}).
			Group("case_id, kind").Scan(&entries).Error; err != nil {
			return err
		}
		var deliveries []uint
		if err := s.spire.Table("spire_user_event_log").Distinct("support_case_id").
			Where("support_case_id IN ? AND server_database_connection_id = ? AND support_delivery_state = ?", ids, s.connectionID, "sent").
			Pluck("support_case_id", &deliveries).Error; err != nil {
			return err
		}
		get := func(id uint) *supportCaseTimes {
			if times[id] == nil {
				times[id] = &supportCaseTimes{}
			}
			return times[id]
		}
		for _, entry := range entries {
			at := entry.Last
			switch entry.Kind {
			case "chat_out":
				get(entry.CaseID).Responded = true
			case "wait":
				get(entry.CaseID).LastWait = &at
			case "chat_in":
				get(entry.CaseID).LastChatIn = &at
			}
		}
		for _, id := range deliveries {
			get(id).Responded = true
		}
	}
	for i := range cases {
		var known supportCaseTimes
		if found := times[cases[i].ID]; found != nil && cases[i].ID > 0 {
			known = *found
		}
		cases[i].AgeState = supportAgeState(cases[i].Status, cases[i].SubmittedAt, known, now)
		cases[i].FollowUp = supportFollowUp(cases[i].Status, known, now)
	}
	return nil
}

// companion reports the Player Support patch status of the World behind this
// connection. Only the local World is checked; another connection is unknown.
func (p *PlayerSupportController) companion(scope supportScope) playersupport.CompanionStatus {
	if !p.localWorld(scope) {
		return playersupport.CompanionUnknown
	}
	return p.world.Companion()
}

func (s supportScope) caseByKey(key string) (supportCaseView, error) {
	dib, submitted, ok := strings.Cut(key, "-")
	rowID, idErr := strconv.ParseUint(dib, 10, 32)
	submittedAt, timeErr := strconv.ParseInt(submitted, 10, 64)
	if !ok || idErr != nil || timeErr != nil || rowID == 0 || submittedAt < 0 || key != fmt.Sprintf("%d-%d", rowID, submittedAt) {
		return supportCaseView{}, echo.NewHTTPError(http.StatusBadRequest, "Invalid petition reference")
	}
	var record models.PlayerSupportCase
	if err := s.spire.Where("connection_id = ? AND source_key = ?", s.connectionID, key).Take(&record).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return supportCaseView{}, err
	}
	var row models.Petition
	if err := s.eqemu.Where("dib = ? AND senttime = ?", rowID, submittedAt).Take(&row).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return supportCaseView{}, err
	}
	if record.ID == 0 {
		if row.Dib == 0 {
			return supportCaseView{}, echo.NewHTTPError(http.StatusNotFound, "Petition unavailable")
		}
		record = s.newCase(row)
	}
	// Current EQEmu uses the character ID for petid. Verify the original names
	// as well before presenting a character link or accepting a delivery.
	record.CharacterID = 0
	if record.PetitionID != 0 {
		var id uint
		err := s.eqemu.Table("character_data AS ch").Select("ch.id").
			Joins("JOIN account AS acct ON acct.id = ch.account_id").
			Where("ch.id = ? AND ch.name = ? AND acct.name = ? AND ch.deleted_at IS NULL", record.PetitionID, record.Character, record.Account).
			Scan(&id).Error
		if err != nil {
			return supportCaseView{}, err
		}
		record.CharacterID = id
	}
	return supportView(record, row, s.user.ID), nil
}

func (p *PlayerSupportController) detail(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	activity, err := scope.activity(view.ID)
	if err != nil {
		return supportError(c, err)
	}
	cases := []supportCaseView{view}
	if view.Status != "resolved" {
		if err := scope.decorateAge(cases, time.Now()); err != nil {
			return supportError(c, err)
		}
	}
	p.decorateCases(c, scope, cases)
	notes, err := scope.accountNotes(view)
	if err != nil {
		return supportError(c, err)
	}
	if view.MergedInto != 0 {
		var into models.PlayerSupportCase
		if scope.spire.Select("source_key").Where("id = ?", view.MergedInto).Take(&into).Error == nil {
			cases[0].MergedKey = into.SourceKey
		}
	}
	history, err := scope.accountHistory(view)
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{
		"case": cases[0], "activity": activity, "history": history,
		"account_notes": notes, "viewers": cases[0].Viewers, "features": p.features(scope),
	})
}

type supportSummary struct {
	Active     int `json:"active"`
	Urgent     int `json:"urgent"`
	Unassigned int `json:"unassigned"`
	Waiting    int `json:"waiting"`
	Mine       int `json:"mine"`
	// Attention counts cases that are escalated, overdue or need a
	// follow-up, each once.
	Attention int `json:"attention"`
	Overdue   int `json:"overdue"`
	FollowUp  int `json:"follow_up"`
	Escalated int `json:"escalated"`
	// The newest petition and the latest player reply let the page alert
	// staff to arrivals beyond the page they are viewing.
	NewestAt        int64      `json:"newest_at"`
	NewestKey       string     `json:"newest_key,omitempty"`
	NewestCharacter string     `json:"newest_character,omitempty"`
	ReplyAt         *time.Time `json:"reply_at,omitempty"`
	ReplyKey        string     `json:"reply_key,omitempty"`
	ReplyCharacter  string     `json:"reply_character,omitempty"`
}

// supportQueueSummary counts the live inbox before filters and search, so the
// header reflects the whole queue.
func supportQueueSummary(cases []supportCaseView, userID uint) supportSummary {
	var summary supportSummary
	for _, record := range cases {
		summary.Active++
		// Matches the queue's labels: 1 is Elevated, 2 and above are Urgent.
		if record.Urgency > 1 {
			summary.Urgent++
		}
		if record.Owner == "" {
			summary.Unassigned++
		}
		if record.Status == "waiting" {
			summary.Waiting++
		}
		if record.Mine {
			summary.Mine++
		}
		if supportNeedsAttention(record) {
			summary.Attention++
		}
		if record.AgeState == "overdue" {
			summary.Overdue++
		}
		if record.FollowUp {
			summary.FollowUp++
		}
		if record.Escalated {
			summary.Escalated++
		}
		if record.SubmittedAt > summary.NewestAt {
			summary.NewestAt, summary.NewestKey, summary.NewestCharacter = record.SubmittedAt, record.SourceKey, record.Character
		}
	}
	return summary
}

// latestReply finds the newest player tell on this connection's cases.
func (s supportScope) latestReply(summary *supportSummary) {
	var reply struct {
		CreatedAt time.Time
		Actor     string
		SourceKey string
	}
	err := s.spire.Table("spire_player_support_entries AS entries").
		Select("entries.created_at, entries.actor, cases.source_key").
		Joins("JOIN spire_player_support_cases AS cases ON cases.id = entries.case_id").
		Where("cases.connection_id = ? AND entries.kind = ?", s.connectionID, "chat_in").
		Order("entries.id DESC").Limit(1).Scan(&reply).Error
	if err == nil && reply.SourceKey != "" {
		summary.ReplyAt, summary.ReplyKey, summary.ReplyCharacter = &reply.CreatedAt, reply.SourceKey, reply.Actor
	}
}

// decorateConversations marks cases with Messages on and the time of the
// latest player reply. Failures leave the fields empty.
func decorateConversations(scope supportScope, cases []supportCaseView) {
	ids := make([]uint, 0, len(cases))
	for _, record := range cases {
		if record.ID > 0 {
			ids = append(ids, record.ID)
		}
	}
	if len(ids) == 0 {
		return
	}
	var active []uint
	if scope.spire.Model(&models.PlayerSupportChat{}).Where("case_id IN ?", ids).Pluck("case_id", &active).Error != nil {
		return
	}
	var replies []struct {
		CaseID uint
		Last   time.Time
	}
	if scope.spire.Model(&models.PlayerSupportEntry{}).Select("case_id, MAX(created_at) AS last").
		Where("case_id IN ? AND kind = ?", ids, "chat_in").Group("case_id").Scan(&replies).Error != nil {
		return
	}
	on := make(map[uint]bool, len(active))
	for _, id := range active {
		on[id] = true
	}
	last := make(map[uint]time.Time, len(replies))
	for _, reply := range replies {
		last[reply.CaseID] = reply.Last
	}
	for i := range cases {
		cases[i].MessagesOn = on[cases[i].ID]
		if at, ok := last[cases[i].ID]; ok {
			cases[i].LastReplyAt = &at
		}
	}
}

// EQEmu records the zone ID on a petition. Resolve it to a readable name when
// the content database is available; the raw value remains the fallback.
func (p *PlayerSupportController) decorateZones(c echo.Context, cases []supportCaseView) {
	ids := make([]int, 0, len(cases))
	for _, record := range cases {
		if id, err := strconv.Atoi(strings.TrimSpace(record.Zone)); err == nil {
			ids = append(ids, id)
		}
	}
	names := map[int]string{}
	if len(ids) > 0 {
		if zoneDB := p.db.Get(models.Zone{}, c); zoneDB != nil {
			if loaded, err := loadPlayerOperationsZoneNames(zoneDB.WithContext(c.Request().Context()), ids); err == nil {
				names = loaded
			}
		}
	}
	for i := range cases {
		cases[i].ZoneName = cases[i].Zone
		if id, err := strconv.Atoi(strings.TrimSpace(cases[i].Zone)); err == nil && names[id] != "" {
			cases[i].ZoneName = names[id]
		}
	}
}

func (s supportScope) activity(id uint) ([]supportActivity, error) {
	result := []supportActivity{}
	if id == 0 {
		return result, nil
	}
	var entries []models.PlayerSupportEntry
	if err := s.spire.Where("case_id = ?", id).Order("id").Find(&entries).Error; err != nil {
		return nil, err
	}
	for _, entry := range entries {
		result = append(result, supportActivity{
			Key: fmt.Sprintf("note-%d", entry.ID), Kind: entry.Kind, Actor: entry.Actor, Text: entry.Text, Delivery: entry.Delivery, Recipient: entry.Recipient, CreatedAt: entry.CreatedAt,
		})
	}
	var audits []struct {
		models.UserEventLog
		Actor string
	}
	if err := s.spire.Table("spire_user_event_log AS events").
		Select("events.*, users.user_name AS actor").
		Joins("LEFT JOIN spire_users AS users ON users.id = events.user_id").
		Where("events.support_case_id = ? AND events.server_database_connection_id = ?", id, s.connectionID).
		Order("events.id").Find(&audits).Error; err != nil {
		return nil, err
	}
	for _, audit := range audits {
		var payload struct {
			mailParcelsAuditPayload
			Details struct {
				Items []struct {
					Name     string `json:"item_name"`
					Quantity uint   `json:"quantity"`
				} `json:"items"`
			} `json:"details"`
		}
		if err := json.Unmarshal([]byte(audit.Data), &payload); err != nil {
			return nil, err
		}
		actor := audit.Actor
		if actor == "" {
			actor = supportDefaultActor
		}
		kind, label := "reply", payload.Subject
		if audit.EventName == mailParcelsEventGMSendParcels {
			kind = "parcel"
			items := make([]string, 0, len(payload.Details.Items))
			for _, item := range payload.Details.Items {
				items = append(items, fmt.Sprintf("%s × %d", item.Name, item.Quantity))
			}
			label = strings.Join(items, ", ") + "\n" + payload.Reason
		}
		if audit.SupportDeliveryState != "sent" {
			kind = "pending"
			label = "Verify delivery · " + label
		}
		result = append(result, supportActivity{
			Key: fmt.Sprintf("delivery-%d", audit.ID), Kind: kind, Actor: actor, Text: label,
			Receipt: payload.RecordIDs, CreatedAt: audit.CreatedAt,
		})
	}
	sort.SliceStable(result, func(i, j int) bool { return result[i].CreatedAt.Before(result[j].CreatedAt) })
	return result, nil
}

func (s supportScope) persist(tx *gorm.DB, record models.PlayerSupportCase) (models.PlayerSupportCase, error) {
	if record.ID == 0 {
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&record).Error; err != nil {
			return record, err
		}
	}
	var stored models.PlayerSupportCase
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("connection_id = ? AND source_key = ?", s.connectionID, record.SourceKey).
		Take(&stored).Error
	return stored, err
}

// MySQL rolls back the entire transaction on a deadlock. Retry case writes
// here, before callers perform any delivery outside the transaction.
func (s supportScope) writeCase(work func(*gorm.DB) error) error {
	for attempt := 1; ; attempt++ {
		err := s.spire.Transaction(work)
		var dbErr *mysql.MySQLError
		if attempt == 3 || !errors.As(err, &dbErr) || dbErr.Number != 1213 {
			return err
		}
	}
}

type supportUpdate struct {
	Action   string `json:"action"`
	Text     string `json:"text"`
	Revision uint   `json:"revision"`
	// AssigneeID is the staff member for "assign"; 0 unassigns the case.
	AssigneeID uint   `json:"assignee_id"`
	Category   string `json:"category"`
	// Subject is the reported player's character name, or "" to clear it.
	Subject string `json:"subject"`
	// CloseInGame also clears the open in-game petition on "resolve".
	CloseInGame bool `json:"close_in_game"`

	// Resolved on the server before applySupportUpdate.
	assigneeName string
	subjectID    uint
	subjectName  string
}

func (p *PlayerSupportController) update(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	var input supportUpdate
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid case update"))
	}
	if input.Action == "assign" && input.AssigneeID != 0 {
		staff, err := p.supportStaff(c, scope)
		if err != nil {
			return supportError(c, err)
		}
		input.assigneeName = supportStaffName(staff, input.AssigneeID)
	}
	petition, err := p.updateCase(c, scope, c.Param("key"), input)
	if err != nil {
		return supportError(c, err)
	}
	if petition == nil {
		return c.NoContent(http.StatusNoContent)
	}
	return c.JSON(http.StatusOK, echo.Map{"petition": petition})
}

// updateCase applies one case action. It returns the in-game petition result
// when a resolve also cleared the petition.
func (p *PlayerSupportController) updateCase(c echo.Context, scope supportScope, key string, input supportUpdate) (*supportPetitionClose, error) {
	view, err := scope.caseByKey(key)
	if err != nil {
		return nil, err
	}
	if input.Action == "subject" {
		if input.subjectID, input.subjectName, err = supportFindSubject(scope, view, input.Subject); err != nil {
			return nil, err
		}
	}
	closing := input.Action == "resolve" && input.CloseInGame && view.NativeOpen
	var accountID uint
	if closing {
		if view.CheckedOut {
			by := ""
			if view.LastGM != "" {
				by = " by " + view.LastGM
			}
			return nil, echo.NewHTTPError(http.StatusConflict, fmt.Sprintf("Petition #%d is checked out in game%s. Untick “Also clear petition in game” to resolve without clearing it.", view.PetitionID, by))
		}
		if accountID, err = supportAccountID(scope, view); err != nil {
			return nil, err
		}
		if accountID == 0 {
			return nil, echo.NewHTTPError(http.StatusConflict, "The petition account is unavailable")
		}
	}
	var caseID uint
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		if record.Revision != input.Revision {
			return echo.NewHTTPError(http.StatusConflict, "The case changed. Refresh it before trying again.")
		}
		caseID = record.ID
		actor := supportActor(scope.user)
		text, err := applySupportUpdate(&record, input, scope.user.ID, actor)
		if err != nil {
			return err
		}
		if err := tx.Model(&record).Updates(map[string]interface{}{
			"status": record.Status, "owner_id": record.OwnerID, "owner": record.Owner, "revision": record.Revision + 1,
			"category": record.Category, "escalated": record.Escalated,
			"subject_character_id": record.SubjectCharacterID, "subject_character": record.SubjectCharacter,
		}).Error; err != nil {
			return err
		}
		if input.Action == "resolve" {
			if err := tx.Where("case_id = ?", record.ID).Delete(&models.PlayerSupportChat{}).Error; err != nil {
				return err
			}
		}
		return tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: input.Action, Actor: actor, Text: text}).Error
	})
	if err != nil {
		return nil, err
	}
	var petition *supportPetitionClose
	if closing {
		petition = p.closeInGamePetition(c, scope, view, caseID, accountID)
	}
	if input.Action == "resolve" && p.world != nil {
		p.world.Notify()
	}
	p.publishCaseStatus(c, scope, view.SourceKey)
	return petition, nil
}

// supportFindSubject finds the reported player by exact name. An empty name
// clears it.
func supportFindSubject(scope supportScope, view supportCaseView, name string) (uint, string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, "", nil
	}
	if utf8.RuneCountInString(name) > 64 {
		return 0, "", echo.NewHTTPError(http.StatusConflict, "No character named "+name)
	}
	var character struct {
		ID        uint
		Name      string
		AccountID uint
	}
	if err := scope.eqemu.Table("character_data").Select("id, name, account_id").
		Where("LOWER(name) = LOWER(?) AND deleted_at IS NULL", name).Order("id").Limit(1).Scan(&character).Error; err != nil {
		return 0, "", err
	}
	if character.ID == 0 {
		return 0, "", echo.NewHTTPError(http.StatusConflict, "No character named "+name)
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return 0, "", err
	}
	if accountID != 0 && character.AccountID == accountID {
		return 0, "", echo.NewHTTPError(http.StatusConflict, "That character is on the petitioning account")
	}
	return character.ID, character.Name, nil
}

// publishCaseStatus shares the case's workflow state with the game, so the
// #petition menu can show it. The value is "status|messages|owner"; the owner
// comes last because it is free text. Failures only affect that menu.
func (p *PlayerSupportController) publishCaseStatus(c echo.Context, scope supportScope, sourceKey string) {
	var record models.PlayerSupportCase
	if scope.spire.Where("connection_id = ? AND source_key = ?", scope.connectionID, sourceKey).Take(&record).Error != nil {
		return
	}
	var chats int64
	if scope.spire.Model(&models.PlayerSupportChat{}).Where("case_id = ?", record.ID).Count(&chats).Error != nil {
		return
	}
	messages := "0"
	if chats > 0 {
		messages = "1"
	}
	key := "spire:petition:" + sourceKey
	value := record.Status + "|" + messages + "|" + record.Owner
	expires := time.Now().Add(30 * 24 * time.Hour).Unix()
	err := scope.eqemu.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM data_buckets WHERE `key` = ?", key).Error; err != nil {
			return err
		}
		return tx.Exec("INSERT INTO data_buckets (`key`, `value`, `expires`) VALUES (?, ?, ?)", key, value, expires).Error
	})
	if err != nil {
		c.Logger().Warnf("Player Support: could not publish case status for %s: %v", sourceKey, err)
	}
}

func applySupportUpdate(record *models.PlayerSupportCase, input supportUpdate, userID uint, actor string) (string, error) {
	conflict := func(message string) (string, error) { return "", echo.NewHTTPError(http.StatusConflict, message) }
	if input.Action == "note" {
		text := strings.TrimSpace(input.Text)
		if text == "" || len(text) > 8000 {
			return "", echo.NewHTTPError(http.StatusBadRequest, "Enter a note of up to 8,000 bytes")
		}
		return text, nil
	}
	if record.Status == "resolved" && input.Action != "reopen" {
		return conflict("Reopen this case to change its status or owner")
	}
	switch input.Action {
	case "claim":
		if record.Owner != "" {
			return conflict("This case is already assigned")
		}
		record.OwnerID, record.Owner = userID, actor
		return "Claimed the case", nil
	case "take":
		if record.Owner != "" && record.OwnerID == userID {
			return conflict("You already own this case")
		}
		previous := record.Owner
		record.OwnerID, record.Owner = userID, actor
		if previous == "" {
			return "Took the case", nil
		}
		return "Took over the case from " + previous, nil
	case "assign":
		if input.AssigneeID == 0 {
			if record.Owner == "" {
				return conflict("The case is not assigned")
			}
			record.OwnerID, record.Owner = 0, ""
			return "Unassigned the case", nil
		}
		if input.assigneeName == "" {
			return conflict("That staff member cannot work Player Support on this server")
		}
		if record.Owner != "" && record.OwnerID == input.AssigneeID {
			return conflict("The case is already assigned to " + record.Owner)
		}
		record.OwnerID, record.Owner = input.AssigneeID, input.assigneeName
		return "Assigned the case to " + input.assigneeName, nil
	case "release":
		if record.Owner == "" || record.OwnerID != userID {
			return conflict("Only the current owner can release this case")
		}
		record.OwnerID, record.Owner = 0, ""
		return "Released the case", nil
	case "escalate":
		reason := strings.TrimSpace(input.Text)
		if reason == "" || utf8.RuneCountInString(reason) > 500 {
			return "", echo.NewHTTPError(http.StatusBadRequest, "Enter a reason of up to 500 characters")
		}
		if record.Escalated {
			return conflict("This case is already escalated")
		}
		record.Escalated = true
		return "Escalated the case\n" + reason, nil
	case "deescalate":
		note := strings.TrimSpace(input.Text)
		if utf8.RuneCountInString(note) > 500 {
			return "", echo.NewHTTPError(http.StatusBadRequest, "Enter a reason of up to 500 characters")
		}
		if !record.Escalated {
			return conflict("This case is not escalated")
		}
		record.Escalated = false
		if note != "" {
			return "Cleared the escalation\n" + note, nil
		}
		return "Cleared the escalation", nil
	case "categorize":
		category := strings.TrimSpace(input.Category)
		label, known := supportCategoryLabel(category)
		if category != "" && !known {
			return "", echo.NewHTTPError(http.StatusBadRequest, "Unknown category")
		}
		if category == record.Category {
			return conflict("The case already has that category")
		}
		record.Category = category
		if category == "" {
			return "Cleared the category", nil
		}
		return "Category: " + label, nil
	case "subject":
		if input.subjectID == 0 {
			if record.SubjectCharacterID == 0 && record.SubjectCharacter == "" {
				return conflict("The case has no reported player")
			}
			record.SubjectCharacterID, record.SubjectCharacter = 0, ""
			return "Cleared the reported player", nil
		}
		if record.SubjectCharacterID == input.subjectID {
			return conflict(input.subjectName + " is already the reported player")
		}
		record.SubjectCharacterID, record.SubjectCharacter = input.subjectID, input.subjectName
		return "Reported player: " + input.subjectName, nil
	case "wait":
		if record.Status != "open" {
			return conflict("Only open cases can be marked waiting")
		}
		record.Status = "waiting"
		return "Waiting for the player", nil
	case "resolve":
		// An optional summary keeps the outcome next to the status change.
		summary := strings.TrimSpace(input.Text)
		if len(summary) > 8000 {
			return "", echo.NewHTTPError(http.StatusBadRequest, "Enter a resolution summary of up to 8,000 bytes")
		}
		record.Status = "resolved"
		record.Escalated = false
		if summary != "" {
			return "Resolved the case\n" + summary, nil
		}
		return "Resolved the case", nil
	case "reopen":
		if record.Status == "open" {
			return conflict("This case is already open")
		}
		record.Status = "open"
		return "Reopened the case", nil
	default:
		return "", echo.NewHTTPError(http.StatusBadRequest, "Unknown case action")
	}
}

const supportDeliveryContextKey = "spire.support.delivery"

var supportRequestKey = regexp.MustCompile(`^[a-f0-9]{32}$`)

type supportDeliveryAudit struct {
	CaseID, ConnectionID uint
	Character, Key       string
	AccountID            int
}

func supportDeliveryFromContext(c echo.Context) *supportDeliveryAudit {
	delivery, _ := c.Get(supportDeliveryContextKey).(*supportDeliveryAudit)
	return delivery
}

func (p *PlayerSupportController) prepareDelivery(c echo.Context, route, token string) (supportScope, uint, error) {
	scope, err := p.scope(c, false)
	if err != nil {
		return scope, 0, err
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/"+route, true) {
		return scope, 0, echo.NewHTTPError(http.StatusForbidden, "Mail & Parcels write access is required")
	}
	if !supportRequestKey.MatchString(token) {
		return scope, 0, echo.NewHTTPError(http.StatusBadRequest, "Invalid delivery request ID")
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return scope, 0, err
	}
	if view.CharacterID == 0 || view.Status == "resolved" || view.CheckedOut {
		return scope, 0, echo.NewHTTPError(http.StatusConflict, "The case is resolved, checked out in-game, or has no matching character")
	}
	var accountID int
	if err := scope.eqemu.Table("account").Select("id").Where("name = ?", view.Account).Scan(&accountID).Error; err != nil {
		return scope, 0, err
	}
	if accountID == 0 {
		return scope, 0, echo.NewHTTPError(http.StatusConflict, "The petition account is unavailable")
	}
	var record models.PlayerSupportCase
	err = scope.writeCase(func(tx *gorm.DB) error {
		var err error
		record, err = scope.persist(tx, view.PlayerSupportCase)
		if err == nil && record.Status == "resolved" {
			return echo.NewHTTPError(http.StatusConflict, "Reopen the case before sending a delivery")
		}
		return err
	})
	if err != nil {
		return scope, 0, err
	}
	key := fmt.Sprintf("%d-%s", record.ID, token)
	var prior models.UserEventLog
	if err := scope.spire.Where("support_delivery_key = ?", key).Take(&prior).Error; err == nil {
		return scope, 0, echo.NewHTTPError(http.StatusConflict, "This delivery was already recorded. Check case activity.")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return scope, 0, err
	}
	c.Set(supportDeliveryContextKey, &supportDeliveryAudit{
		CaseID: record.ID, ConnectionID: scope.connectionID, Character: view.Character, AccountID: accountID, Key: key,
	})
	return scope, view.CharacterID, nil
}

func (p *PlayerSupportController) reply(c echo.Context) error {
	var input struct {
		gmMailSendInput
		RequestID string `json:"request_id"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid reply"))
	}
	scope, recipient, err := p.prepareDelivery(c, "mail-parcels-editor/mail/send", input.RequestID)
	if err != nil {
		return supportError(c, err)
	}
	input.CharacterIDs = []uint{recipient}
	input.Reason = "Player Support case " + c.Param("key")
	input.From = "Server Support"
	input.Timestamp = 0
	return p.mail.deliverDirectMail(c, scope.eqemu, input.gmMailSendInput)
}

func (p *PlayerSupportController) parcel(c echo.Context) error {
	var input struct {
		gmParcelSendInput
		RequestID string `json:"request_id"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid parcel"))
	}
	scope, recipient, err := p.prepareDelivery(c, "mail-parcels-editor/parcel/send", input.RequestID)
	if err != nil {
		return supportError(c, err)
	}
	itemDB := p.db.Get(models.Item{}, c)
	if itemDB == nil || p.connectionID(scope.user) != scope.connectionID || p.mail.auditLog.ActiveConnectionID(c) != scope.connectionID {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The active content database changed or is unavailable"))
	}
	input.CharacterID = recipient
	input.FromName = "Server Support"
	input.SentDate = ""
	return p.mail.deliverGMParcels(c, scope.eqemu, itemDB.WithContext(c.Request().Context()), input.gmParcelSendInput)
}

// supportDefaultActor names staff who act without a Spire user name, such as
// a local install with authentication off.
const supportDefaultActor = "Game Master"

func supportActor(user models.User) string {
	if user.UserName == "" {
		return supportDefaultActor
	}
	return user.UserName
}

func supportError(c echo.Context, err error) error {
	var httpErr *echo.HTTPError
	if errors.As(err, &httpErr) {
		return c.JSON(httpErr.Code, echo.Map{"error": httpErr.Message})
	}
	c.Logger().Errorf("Player Support: %v", err)
	return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Player Support database request failed"})
}
