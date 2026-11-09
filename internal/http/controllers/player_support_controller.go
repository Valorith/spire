package controllers

import (
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
}

func NewPlayerSupportController(db *database.Resolver, permissions *permissions.Service, mail *MailParcelsEditorController, config *eqemuserverconfig.Config, log *logger.AppLogger) *PlayerSupportController {
	controller := &PlayerSupportController{db: db, permissions: permissions, mail: mail}
	controller.world = playersupport.NewWorld(config, log, controller.receiveChat)
	if config != nil && config.Exists() && db.GetSpireDb() != nil {
		go func() {
			var active models.PlayerSupportChat
			if db.GetSpireDb().Select("account_id").Take(&active).Error == nil {
				controller.world.Resume()
			}
		}()
	}
	return controller
}

func (p *PlayerSupportController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "player-support/cases", p.list, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key", p.detail, nil),
		routes.RegisterRoute(http.MethodPatch, "player-support/cases/:key", p.update, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/reply", p.reply, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/parcel", p.parcel, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/chat", p.chat, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/chat", p.updateChat, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/recovery", p.recovery, nil),
		routes.RegisterRoute(http.MethodGet, "player-support/cases/:key/corpses/:corpse", p.corpseContents, nil),
		routes.RegisterRoute(http.MethodPut, "player-support/cases/:key/move", p.moveRecoveryTarget, nil),
	}
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
	return supportCaseView{
		PlayerSupportCase: record,
		NativeOpen:        row.Dib != 0,
		CheckedOut:        row.Ischeckedout != 0,
		LastGM:            row.Lastgm,
		NativeNote:        row.Gmtext.String,
		Mine:              record.Owner != "" && record.OwnerID == userID,
	}
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
	summary := supportQueueSummary(cases, scope.user.ID)
	if filter == "resolved" {
		query := scope.spire.Model(&models.PlayerSupportCase{}).
			Where("connection_id = ? AND status = ?", scope.connectionID, "resolved")
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
		p.decoratePresence(scope, resolved)
		p.decorateZones(c, resolved)
		decorateConversations(scope, resolved)
		return c.JSON(http.StatusOK, echo.Map{"cases": resolved, "total": count, "connection_id": scope.connectionID, "summary": summary, "companion": p.companion(scope)})
	}

	search = strings.ToLower(search)
	matches := cases[:0]
	for _, record := range cases {
		if filter == "mine" && !record.Mine || filter == "unassigned" && record.Owner != "" {
			continue
		}
		if search == "" || strings.Contains(strings.ToLower(record.Character+" "+record.Account+" "+record.Message+" "+record.SourceKey), search) {
			matches = append(matches, record)
		}
	}
	sort.Slice(matches, func(i, j int) bool {
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
	p.decoratePresence(scope, matches[start:end])
	p.decorateZones(c, matches[start:end])
	decorateConversations(scope, matches[start:end])
	return c.JSON(http.StatusOK, echo.Map{
		"cases": matches[start:end], "total": len(matches), "connection_id": scope.connectionID, "summary": summary,
		"companion": p.companion(scope),
	})
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
	p.decoratePresence(scope, cases)
	p.decorateZones(c, cases)
	decorateConversations(scope, cases)
	return c.JSON(http.StatusOK, echo.Map{"case": cases[0], "activity": activity})
}

type supportSummary struct {
	Active     int `json:"active"`
	Urgent     int `json:"urgent"`
	Unassigned int `json:"unassigned"`
	Waiting    int `json:"waiting"`
	Mine       int `json:"mine"`
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
	}
	return summary
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
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		if record.Revision != input.Revision {
			return echo.NewHTTPError(http.StatusConflict, "The case changed. Refresh it before trying again.")
		}
		actor := supportActor(scope.user)
		text, err := applySupportUpdate(&record, input, scope.user.ID, actor)
		if err != nil {
			return err
		}
		if err := tx.Model(&record).Updates(map[string]interface{}{
			"status": record.Status, "owner_id": record.OwnerID, "owner": record.Owner, "revision": record.Revision + 1,
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
		return supportError(c, err)
	}
	if input.Action == "resolve" && p.world != nil {
		p.world.Notify()
	}
	p.publishCaseStatus(c, scope, view.SourceKey)
	return c.NoContent(http.StatusNoContent)
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
	case "release":
		if record.Owner == "" || record.OwnerID != userID {
			return conflict("Only the current owner can release this case")
		}
		record.OwnerID, record.Owner = 0, ""
		return "Released the case", nil
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
