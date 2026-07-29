package controllers

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	qGlobalEditorEventCreate = "QGLOBAL_CREATE"
	qGlobalEditorEventUpdate = "QGLOBAL_UPDATE"
	qGlobalEditorEventDelete = "QGLOBAL_DELETE"
)

type QGlobalEditorController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type qGlobalEditorIdentity struct {
	CharID int64  `json:"charid"`
	NpcID  int64  `json:"npcid"`
	ZoneID int64  `json:"zoneid"`
	Name   string `json:"name"`
}

type qGlobalEditorSnapshot struct {
	qGlobalEditorIdentity
	Value   string `json:"value"`
	Expdate *int64 `json:"expdate"`
}

type qGlobalEditorInput struct {
	qGlobalEditorSnapshot
	Reason string `json:"reason"`
}

type qGlobalEditorMutationRequest struct {
	Global   qGlobalEditorInput     `json:"global"`
	Expected *qGlobalEditorSnapshot `json:"expected,omitempty"`
	Confirm  bool                   `json:"confirm,omitempty"`
}

type qGlobalEditorRecord struct {
	CharID        int64    `json:"charid" gorm:"column:charid"`
	NpcID         int64    `json:"npcid" gorm:"column:npcid"`
	ZoneID        int64    `json:"zoneid" gorm:"column:zoneid"`
	Name          string   `json:"name" gorm:"column:name"`
	Value         string   `json:"value" gorm:"column:value"`
	Expdate       *int64   `json:"expdate" gorm:"column:expdate"`
	CharacterName string   `json:"character_name" gorm:"column:character_name"`
	NpcName       string   `json:"npc_name" gorm:"column:npc_name"`
	ZoneName      string   `json:"zone_name" gorm:"column:zone_name"`
	Identity      string   `json:"identity" gorm:"-"`
	ScopeKind     string   `json:"scope_kind" gorm:"-"`
	ScopeLabels   []string `json:"scope_labels" gorm:"-"`
	Permanent     bool     `json:"permanent" gorm:"-"`
	Expired       bool     `json:"expired" gorm:"-"`
}

type qGlobalEditorSummary struct {
	Total     int64 `json:"total"`
	Global    int64 `json:"global"`
	Scoped    int64 `json:"scoped"`
	Permanent int64 `json:"permanent"`
	Active    int64 `json:"active"`
	Expired   int64 `json:"expired"`
}

type qGlobalEditorPage struct {
	Data    interface{}          `json:"data"`
	Total   int64                `json:"total"`
	Page    int                  `json:"page"`
	Limit   int                  `json:"limit"`
	Summary qGlobalEditorSummary `json:"summary"`
}

type qGlobalEditorUsageSample struct {
	ID      string `json:"id"`
	Label   string `json:"label"`
	Context string `json:"context"`
	Value   string `json:"value,omitempty"`
}

type qGlobalEditorUsageSource struct {
	Key       string                     `json:"key"`
	Label     string                     `json:"label"`
	Available bool                       `json:"available"`
	Count     int64                      `json:"count"`
	Samples   []qGlobalEditorUsageSample `json:"samples"`
}

type qGlobalEditorUsage struct {
	Total   int64                      `json:"total"`
	Sources []qGlobalEditorUsageSource `json:"sources"`
}

type qGlobalEditorDetail struct {
	Global qGlobalEditorRecord `json:"global"`
	Usage  qGlobalEditorUsage  `json:"usage"`
}

func NewQGlobalEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *QGlobalEditorController {
	return &QGlobalEditorController{db: db, auditLog: auditLog}
}

func (q *QGlobalEditorController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "qglobal-editor/globals", q.listGlobals, nil),
		routes.RegisterRoute(http.MethodGet, "qglobal-editor/global/:identity", q.getGlobal, nil),
		routes.RegisterRoute(http.MethodPut, "qglobal-editor/global", q.createGlobal, nil),
		routes.RegisterRoute(http.MethodPatch, "qglobal-editor/global/:identity", q.updateGlobal, nil),
		routes.RegisterRoute(http.MethodDelete, "qglobal-editor/global/:identity", q.deleteGlobal, nil),
		routes.RegisterRoute(http.MethodGet, "qglobal-editor/lookups/:kind", q.lookupScope, nil),
	}
}

func (q *QGlobalEditorController) listGlobals(c echo.Context) error {
	db := q.db.Get(models.QuestGlobal{}, c)
	page, limit := operationalEditorPagination(c)
	now := time.Now().Unix()
	base := qGlobalEditorBaseQuery(db)
	search := strings.TrimSpace(c.QueryParam("q"))
	if search != "" {
		like := "%" + search + "%"
		base = base.Where(
			"qg.name LIKE ? OR qg.value LIKE ? OR ch.name LIKE ? OR npc.name LIKE ? OR z.long_name LIKE ? OR z.short_name LIKE ?",
			like, like, like, like, like, like,
		)
	}
	base = qGlobalEditorScopeFilter(base, strings.TrimSpace(c.QueryParam("scope")))
	switch strings.TrimSpace(c.QueryParam("state")) {
	case "permanent":
		base = base.Where("qg.expdate IS NULL OR qg.expdate <= 0")
	case "active":
		base = base.Where("qg.expdate IS NULL OR qg.expdate <= 0 OR qg.expdate > ?", now)
	case "expiring":
		base = base.Where("qg.expdate > ?", now)
	case "expired":
		base = base.Where("qg.expdate > 0 AND qg.expdate <= ?", now)
	}

	var total int64
	if err := base.Session(&gorm.Session{}).
		Distinct("qg.charid, qg.npcid, qg.zoneid, qg.name").
		Count(&total).Error; err != nil {
		return operationalEditorDatabaseError(c, "QGlobals editor", err)
	}
	records := make([]qGlobalEditorRecord, 0)
	if err := base.Session(&gorm.Session{}).
		Select(qGlobalEditorSelectClause()).
		Order("qg.name, qg.charid, qg.npcid, qg.zoneid").
		Limit(limit).Offset((page - 1) * limit).
		Scan(&records).Error; err != nil {
		return operationalEditorDatabaseError(c, "QGlobals editor", err)
	}
	for index := range records {
		decorateQGlobalRecord(&records[index], now)
	}
	summary, err := loadQGlobalEditorSummary(db, now)
	if err != nil {
		return operationalEditorDatabaseError(c, "QGlobals editor", err)
	}
	return c.JSON(http.StatusOK, qGlobalEditorPage{
		Data: records, Total: total, Page: page, Limit: limit, Summary: summary,
	})
}

func (q *QGlobalEditorController) getGlobal(c echo.Context) error {
	identity, err := decodeQGlobalIdentity(c.Param("identity"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := q.loadGlobalDetail(q.db.Get(models.QuestGlobal{}, c), identity)
	if err != nil {
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (q *QGlobalEditorController) createGlobal(c echo.Context) error {
	var request qGlobalEditorMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid QGlobal payload"})
	}
	if err := validateQGlobalEditorInput(request.Global); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := q.db.Get(models.QuestGlobal{}, c)
	payload := qGlobalAuditPayload("create", request.Global.qGlobalEditorSnapshot, nil, request.Global.Reason)
	auditID, err := writeOperationalEditorAudit(c, q.auditLog, qGlobalEditorEventCreate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "QGlobal", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := ensureQGlobalIdentityAvailable(tx, request.Global.qGlobalEditorIdentity, nil); err != nil {
			return err
		}
		return tx.Table("quest_globals").Create(qGlobalEditorValues(request.Global.qGlobalEditorSnapshot)).Error
	})
	if err != nil {
		discardOperationalEditorAudit(q.db, auditID)
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	detail, err := q.loadGlobalDetail(db, request.Global.qGlobalEditorIdentity)
	if err != nil {
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"detail": detail, "audit_id": auditID})
}

func (q *QGlobalEditorController) updateGlobal(c echo.Context) error {
	identity, err := decodeQGlobalIdentity(c.Param("identity"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request qGlobalEditorMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid QGlobal payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original QGlobal snapshot is required"})
	}
	if err := validateQGlobalEditorInput(request.Global); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := q.db.Get(models.QuestGlobal{}, c)
	before, err := loadQGlobalSnapshot(db, identity, false)
	if err != nil {
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	payload := qGlobalAuditPayload("update", request.Global.qGlobalEditorSnapshot, &before, request.Global.Reason)
	auditID, err := writeOperationalEditorAudit(c, q.auditLog, qGlobalEditorEventUpdate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "QGlobal", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		locked, err := loadQGlobalSnapshot(tx, identity, true)
		if err != nil {
			return err
		}
		if !qGlobalSnapshotsEqual(locked, *request.Expected) {
			return operationalEditorConflict("This QGlobal changed after it was loaded. Refresh it before saving.")
		}
		if err := ensureQGlobalIdentityAvailable(tx, request.Global.qGlobalEditorIdentity, &identity); err != nil {
			return err
		}
		result := qGlobalTableIdentityQuery(tx.Table("quest_globals"), identity).
			Updates(qGlobalEditorValues(request.Global.qGlobalEditorSnapshot))
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(q.db, auditID)
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	detail, err := q.loadGlobalDetail(db, request.Global.qGlobalEditorIdentity)
	if err != nil {
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (q *QGlobalEditorController) deleteGlobal(c echo.Context) error {
	identity, err := decodeQGlobalIdentity(c.Param("identity"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request qGlobalEditorMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid QGlobal deletion payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original QGlobal snapshot is required"})
	}
	if !request.Confirm {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Confirm QGlobal deletion before continuing"})
	}
	if err := validateOperationalEditorReason(request.Global.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := q.db.Get(models.QuestGlobal{}, c)
	before, err := loadQGlobalSnapshot(db, identity, false)
	if err != nil {
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	payload := qGlobalAuditPayload("delete", before, &before, request.Global.Reason)
	auditID, err := writeOperationalEditorAudit(c, q.auditLog, qGlobalEditorEventDelete, payload)
	if err != nil {
		return operationalEditorAuditError(c, "QGlobal", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		locked, err := loadQGlobalSnapshot(tx, identity, true)
		if err != nil {
			return err
		}
		if !qGlobalSnapshotsEqual(locked, *request.Expected) {
			return operationalEditorConflict("This QGlobal changed after it was loaded. Refresh it before deleting.")
		}
		result := qGlobalIdentityQuery(tx.Table("quest_globals"), identity).Delete(nil)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(q.db, auditID)
		return operationalEditorMutationError(c, "QGlobal", err)
	}
	return c.JSON(http.StatusOK, echo.Map{
		"deleted_identity": encodeQGlobalIdentity(identity), "audit_id": auditID,
	})
}

func (q *QGlobalEditorController) lookupScope(c echo.Context) error {
	db := q.db.Get(models.QuestGlobal{}, c)
	kind := strings.TrimSpace(c.Param("kind"))
	search := strings.TrimSpace(c.QueryParam("q"))
	like := "%" + search + "%"
	results := make([]operationalEditorLookup, 0)
	var query *gorm.DB
	switch kind {
	case "characters":
		query = db.Table("character_data ch").
			Joins("LEFT JOIN account a ON a.id = ch.account_id").
			Select("ch.id, ch.name, CONCAT('Account ', COALESCE(NULLIF(a.name, ''), CONCAT('#', ch.account_id))) AS context").
			Where("ch.name LIKE ? OR a.name LIKE ? OR CAST(ch.id AS CHAR) LIKE ?", like, like, like).
			Order("ch.name").Limit(20)
	case "npcs":
		query = db.Table("npc_types").
			Select("id, REPLACE(name, '_', ' ') AS name, CONCAT('Level ', level) AS context").
			Where("name LIKE ? OR CAST(id AS CHAR) LIKE ?", like, like).
			Order("name").Limit(20)
	case "zones":
		query = db.Table("zone").
			Select("zoneidnumber AS id, MAX(long_name) AS name, CONCAT(MAX(short_name), ' · all versions') AS context").
			Where("long_name LIKE ? OR short_name LIKE ? OR CAST(zoneidnumber AS CHAR) LIKE ?", like, like, like).
			Group("zoneidnumber").Order("name").Limit(20)
	default:
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Unknown QGlobal lookup type"})
	}
	if err := query.Scan(&results).Error; err != nil {
		return operationalEditorDatabaseError(c, "QGlobals editor", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"data": results})
}

func (q *QGlobalEditorController) loadGlobalDetail(db *gorm.DB, identity qGlobalEditorIdentity) (qGlobalEditorDetail, error) {
	var record qGlobalEditorRecord
	if err := qGlobalIdentityQuery(qGlobalEditorBaseQuery(db), identity).
		Select(qGlobalEditorSelectClause()).
		Take(&record).Error; err != nil {
		return qGlobalEditorDetail{}, err
	}
	decorateQGlobalRecord(&record, time.Now().Unix())
	usage, err := loadQGlobalEditorUsage(db, record.Name)
	if err != nil {
		return qGlobalEditorDetail{}, err
	}
	return qGlobalEditorDetail{Global: record, Usage: usage}, nil
}

func qGlobalEditorBaseQuery(db *gorm.DB) *gorm.DB {
	return db.Table("quest_globals qg").
		Joins("LEFT JOIN character_data ch ON ch.id = qg.charid").
		Joins("LEFT JOIN npc_types npc ON npc.id = qg.npcid").
		Joins("LEFT JOIN zone z ON z.zoneidnumber = qg.zoneid AND z.version = 0")
}

func qGlobalEditorSelectClause() string {
	return `
		qg.charid, qg.npcid, qg.zoneid, qg.name, qg.value, qg.expdate,
		COALESCE(ch.name, '') AS character_name,
		COALESCE(npc.name, '') AS npc_name,
		COALESCE(z.long_name, '') AS zone_name
	`
}

func qGlobalEditorScopeFilter(db *gorm.DB, scope string) *gorm.DB {
	switch scope {
	case "global":
		return db.Where("qg.charid = 0 AND qg.npcid = 0 AND qg.zoneid = 0")
	case "character":
		return db.Where("qg.charid > 0")
	case "npc":
		return db.Where("qg.npcid > 0")
	case "zone":
		return db.Where("qg.zoneid > 0")
	case "composite":
		return db.Where("(qg.charid > 0) + (qg.npcid > 0) + (qg.zoneid > 0) > 1")
	default:
		return db
	}
}

func loadQGlobalEditorSummary(db *gorm.DB, now int64) (qGlobalEditorSummary, error) {
	var summary qGlobalEditorSummary
	err := db.Table("quest_globals").Select(`
		COUNT(*) AS total,
		COALESCE(SUM(charid = 0 AND npcid = 0 AND zoneid = 0), 0) AS global,
		COALESCE(SUM(charid > 0 OR npcid > 0 OR zoneid > 0), 0) AS scoped,
		COALESCE(SUM(expdate IS NULL OR expdate <= 0), 0) AS permanent,
		COALESCE(SUM(expdate IS NULL OR expdate <= 0 OR expdate > ?), 0) AS active,
		COALESCE(SUM(expdate > 0 AND expdate <= ?), 0) AS expired
	`, now, now).Scan(&summary).Error
	return summary, err
}

func loadQGlobalEditorUsage(db *gorm.DB, name string) (qGlobalEditorUsage, error) {
	usage := qGlobalEditorUsage{Sources: make([]qGlobalEditorUsageSource, 0)}
	spells := qGlobalEditorUsageSource{
		Key: "spells", Label: "Spell gates", Available: operationalEditorTableExists(db, "spell_globals"),
		Samples: make([]qGlobalEditorUsageSample, 0),
	}
	if spells.Available && operationalEditorColumnExists(db, "spell_globals", "qglobal") {
		if err := db.Table("spell_globals").Where("qglobal = ?", name).Count(&spells.Count).Error; err != nil {
			return usage, err
		}
		var samples []struct {
			SpellID   int    `gorm:"column:spell_id"`
			SpellName string `gorm:"column:spell_name"`
			Value     string `gorm:"column:value"`
		}
		if err := db.Table("spell_globals").
			Select("spellid AS spell_id, spell_name, value").
			Where("qglobal = ?", name).Order("spell_name").Limit(6).Scan(&samples).Error; err != nil {
			return usage, err
		}
		for _, sample := range samples {
			label := sample.SpellName
			if label == "" {
				label = fmt.Sprintf("Spell #%d", sample.SpellID)
			}
			spells.Samples = append(spells.Samples, qGlobalEditorUsageSample{
				ID: fmt.Sprintf("%d", sample.SpellID), Label: label,
				Context: "Spell availability condition", Value: sample.Value,
			})
		}
	}
	usage.Sources = append(usage.Sources, spells)

	items := qGlobalEditorUsageSource{
		Key: "items", Label: "Item tick scripts", Available: operationalEditorTableExists(db, "item_tick"),
		Samples: make([]qGlobalEditorUsageSample, 0),
	}
	if items.Available && operationalEditorColumnExists(db, "item_tick", "it_qglobal") {
		if err := db.Table("item_tick").Where("it_qglobal = ?", name).Count(&items.Count).Error; err != nil {
			return usage, err
		}
	}
	usage.Sources = append(usage.Sources, items)

	mercenaries := qGlobalEditorUsageSource{
		Key: "mercenaries", Label: "Mercenary merchants",
		Available: operationalEditorTableExists(db, "merc_merchant_templates"),
		Samples:   make([]qGlobalEditorUsageSample, 0),
	}
	if mercenaries.Available && operationalEditorColumnExists(db, "merc_merchant_templates", "qglobal") {
		if err := db.Table("merc_merchant_templates").Where("qglobal = ?", name).Count(&mercenaries.Count).Error; err != nil {
			return usage, err
		}
	}
	usage.Sources = append(usage.Sources, mercenaries)

	for _, source := range usage.Sources {
		usage.Total += source.Count
	}
	return usage, nil
}

func decorateQGlobalRecord(record *qGlobalEditorRecord, now int64) {
	record.Identity = encodeQGlobalIdentity(qGlobalEditorIdentity{
		CharID: record.CharID, NpcID: record.NpcID, ZoneID: record.ZoneID, Name: record.Name,
	})
	record.Permanent = record.Expdate == nil || *record.Expdate <= 0
	record.Expired = record.Expdate != nil && *record.Expdate > 0 && *record.Expdate <= now
	record.ScopeKind, record.ScopeLabels = qGlobalRecordScope(*record)
}

func qGlobalRecordScope(record qGlobalEditorRecord) (string, []string) {
	labels := make([]string, 0)
	kinds := make([]string, 0)
	if record.CharID > 0 {
		label := record.CharacterName
		if label == "" {
			label = fmt.Sprintf("#%d", record.CharID)
		}
		labels = append(labels, "Character "+label)
		kinds = append(kinds, "character")
	}
	if record.NpcID > 0 {
		label := strings.ReplaceAll(record.NpcName, "_", " ")
		if label == "" {
			label = fmt.Sprintf("#%d", record.NpcID)
		}
		labels = append(labels, "NPC "+label)
		kinds = append(kinds, "npc")
	}
	if record.ZoneID > 0 {
		label := record.ZoneName
		if label == "" {
			label = fmt.Sprintf("#%d", record.ZoneID)
		}
		labels = append(labels, "Zone "+label)
		kinds = append(kinds, "zone")
	}
	if len(labels) == 0 {
		return "global", []string{"All characters · all NPCs · all zones"}
	}
	if len(labels) > 1 {
		return "composite", labels
	}
	return kinds[0], labels
}

func validateQGlobalEditorInput(input qGlobalEditorInput) error {
	if err := validateOperationalEditorReason(input.Reason); err != nil {
		return err
	}
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return errors.New("QGlobal name is required")
	}
	if len(input.Name) > 65 {
		return errors.New("QGlobal name must be 65 characters or fewer")
	}
	if len(input.Value) > 128 {
		return errors.New("QGlobal value must be 128 characters or fewer")
	}
	for label, value := range map[string]int64{
		"Character ID": input.CharID, "NPC ID": input.NpcID, "Zone ID": input.ZoneID,
	} {
		if value < 0 || value > math.MaxInt32 {
			return fmt.Errorf("%s must be between 0 and %d", label, math.MaxInt32)
		}
	}
	if input.Expdate != nil && (*input.Expdate < math.MinInt32 || *input.Expdate > math.MaxInt32) {
		return errors.New("Expiration is outside the supported UNIX timestamp range")
	}
	return nil
}

func qGlobalEditorValues(snapshot qGlobalEditorSnapshot) map[string]interface{} {
	return map[string]interface{}{
		"charid": snapshot.CharID, "npcid": snapshot.NpcID, "zoneid": snapshot.ZoneID,
		"name": strings.TrimSpace(snapshot.Name), "value": snapshot.Value, "expdate": snapshot.Expdate,
	}
}

func ensureQGlobalIdentityAvailable(db *gorm.DB, identity qGlobalEditorIdentity, exclude *qGlobalEditorIdentity) error {
	var count int64
	query := qGlobalTableIdentityQuery(db.Table("quest_globals"), identity)
	if exclude != nil {
		query = query.Where("NOT (charid = ? AND npcid = ? AND zoneid = ? AND name = ?)",
			exclude.CharID, exclude.NpcID, exclude.ZoneID, exclude.Name)
	}
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return operationalEditorConflict("A QGlobal already uses this name and exact character/NPC/zone scope")
	}
	return nil
}

func qGlobalIdentityQuery(db *gorm.DB, identity qGlobalEditorIdentity) *gorm.DB {
	return db.Where(
		"qg.charid = ? AND qg.npcid = ? AND qg.zoneid = ? AND qg.name = ?",
		identity.CharID, identity.NpcID, identity.ZoneID, identity.Name,
	)
}

func qGlobalTableIdentityQuery(db *gorm.DB, identity qGlobalEditorIdentity) *gorm.DB {
	return db.Where(
		"charid = ? AND npcid = ? AND zoneid = ? AND name = ?",
		identity.CharID, identity.NpcID, identity.ZoneID, identity.Name,
	)
}

func loadQGlobalSnapshot(db *gorm.DB, identity qGlobalEditorIdentity, lock bool) (qGlobalEditorSnapshot, error) {
	var row struct {
		CharID  int64  `gorm:"column:charid"`
		NpcID   int64  `gorm:"column:npcid"`
		ZoneID  int64  `gorm:"column:zoneid"`
		Name    string `gorm:"column:name"`
		Value   string `gorm:"column:value"`
		Expdate *int64 `gorm:"column:expdate"`
	}
	query := qGlobalTableIdentityQuery(db.Table("quest_globals"), identity).
		Select("charid, npcid, zoneid, name, value, expdate")
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if err := query.Take(&row).Error; err != nil {
		return qGlobalEditorSnapshot{}, err
	}
	return qGlobalEditorSnapshot{
		qGlobalEditorIdentity: qGlobalEditorIdentity{
			CharID: row.CharID,
			NpcID:  row.NpcID,
			ZoneID: row.ZoneID,
			Name:   row.Name,
		},
		Value:   row.Value,
		Expdate: row.Expdate,
	}, nil
}

func qGlobalSnapshotsEqual(left qGlobalEditorSnapshot, right qGlobalEditorSnapshot) bool {
	if left.CharID != right.CharID || left.NpcID != right.NpcID || left.ZoneID != right.ZoneID ||
		left.Name != right.Name || left.Value != right.Value {
		return false
	}
	leftPermanent := left.Expdate == nil || *left.Expdate <= 0
	rightPermanent := right.Expdate == nil || *right.Expdate <= 0
	if leftPermanent || rightPermanent {
		return leftPermanent && rightPermanent
	}
	return *left.Expdate == *right.Expdate
}

func encodeQGlobalIdentity(identity qGlobalEditorIdentity) string {
	data, _ := json.Marshal(identity)
	return base64.RawURLEncoding.EncodeToString(data)
}

func decodeQGlobalIdentity(encoded string) (qGlobalEditorIdentity, error) {
	data, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return qGlobalEditorIdentity{}, errors.New("Invalid QGlobal identity")
	}
	var identity qGlobalEditorIdentity
	if err := json.Unmarshal(data, &identity); err != nil {
		return qGlobalEditorIdentity{}, errors.New("Invalid QGlobal identity")
	}
	if strings.TrimSpace(identity.Name) == "" {
		return qGlobalEditorIdentity{}, errors.New("Invalid QGlobal identity")
	}
	return identity, nil
}

func qGlobalAuditPayload(
	action string,
	after qGlobalEditorSnapshot,
	before *qGlobalEditorSnapshot,
	reason string,
) map[string]interface{} {
	payload := map[string]interface{}{
		"action": action, "identity": after.qGlobalEditorIdentity,
		"value": after.Value, "expdate": after.Expdate, "reason": strings.TrimSpace(reason),
	}
	if before != nil {
		payload["previous_identity"] = before.qGlobalEditorIdentity
		payload["previous_value"] = before.Value
		payload["previous_expdate"] = before.Expdate
	}
	return payload
}
