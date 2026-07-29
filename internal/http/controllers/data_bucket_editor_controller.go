package controllers

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
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
	dataBucketEditorEventCreate = "DATA_BUCKET_CREATE"
	dataBucketEditorEventUpdate = "DATA_BUCKET_UPDATE"
	dataBucketEditorEventDelete = "DATA_BUCKET_DELETE"
	dataBucketEditorValueLimit  = 65535
)

type DataBucketEditorController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type dataBucketEditorPage struct {
	Data    interface{}             `json:"data"`
	Total   int64                   `json:"total"`
	Page    int                     `json:"page"`
	Limit   int                     `json:"limit"`
	Summary dataBucketEditorSummary `json:"summary"`
}

type dataBucketEditorSummary struct {
	Total     int64 `json:"total"`
	Permanent int64 `json:"permanent"`
	Expiring  int64 `json:"expiring"`
	Expired   int64 `json:"expired"`
	Global    int64 `json:"global"`
	Scoped    int64 `json:"scoped"`
}

type dataBucketEditorSnapshot struct {
	Key         string `json:"key"`
	Value       string `json:"value"`
	Expires     uint64 `json:"expires"`
	AccountID   uint64 `json:"account_id"`
	CharacterID uint64 `json:"character_id"`
	NpcID       uint64 `json:"npc_id"`
	BotID       uint64 `json:"bot_id"`
	ZoneID      uint64 `json:"zone_id"`
	InstanceID  uint64 `json:"instance_id"`
}

type dataBucketEditorInput struct {
	dataBucketEditorSnapshot
	Reason string `json:"reason"`
}

type dataBucketEditorMutationRequest struct {
	Bucket             dataBucketEditorInput     `json:"bucket"`
	Expected           *dataBucketEditorSnapshot `json:"expected,omitempty"`
	Confirm            bool                      `json:"confirm,omitempty"`
	AllowReferencedKey bool                      `json:"allow_referenced_key,omitempty"`
}

type dataBucketEditorRecord struct {
	ID            uint64   `json:"id" gorm:"column:id"`
	Key           string   `json:"key" gorm:"column:key"`
	Value         string   `json:"value" gorm:"column:value"`
	Expires       uint64   `json:"expires" gorm:"column:expires"`
	AccountID     uint64   `json:"account_id" gorm:"column:account_id"`
	CharacterID   uint64   `json:"character_id" gorm:"column:character_id"`
	NpcID         uint64   `json:"npc_id" gorm:"column:npc_id"`
	BotID         uint64   `json:"bot_id" gorm:"column:bot_id"`
	ZoneID        uint64   `json:"zone_id" gorm:"column:zone_id"`
	InstanceID    uint64   `json:"instance_id" gorm:"column:instance_id"`
	AccountName   string   `json:"account_name" gorm:"column:account_name"`
	CharacterName string   `json:"character_name" gorm:"column:character_name"`
	NpcName       string   `json:"npc_name" gorm:"column:npc_name"`
	BotName       string   `json:"bot_name" gorm:"column:bot_name"`
	ZoneName      string   `json:"zone_name" gorm:"column:zone_name"`
	ScopeKind     string   `json:"scope_kind" gorm:"-"`
	ScopeLabels   []string `json:"scope_labels" gorm:"-"`
	Permanent     bool     `json:"permanent" gorm:"-"`
	Expired       bool     `json:"expired" gorm:"-"`
}

type dataBucketEditorUsageSample struct {
	Kind       string `json:"kind"`
	ID         string `json:"id"`
	Label      string `json:"label"`
	Context    string `json:"context"`
	Comparison string `json:"comparison,omitempty"`
}

type dataBucketEditorUsage struct {
	MerchantCount int64                         `json:"merchant_count"`
	SpellCount    int64                         `json:"spell_count"`
	Total         int64                         `json:"total"`
	Samples       []dataBucketEditorUsageSample `json:"samples"`
}

type dataBucketEditorDetail struct {
	Bucket dataBucketEditorRecord `json:"bucket"`
	Usage  dataBucketEditorUsage  `json:"usage"`
}

type operationalEditorLookup struct {
	ID      uint64 `json:"id" gorm:"column:id"`
	Name    string `json:"name" gorm:"column:name"`
	Context string `json:"context" gorm:"column:context"`
}

func NewDataBucketEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *DataBucketEditorController {
	return &DataBucketEditorController{db: db, auditLog: auditLog}
}

func (d *DataBucketEditorController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "data-bucket-editor/buckets", d.listBuckets, nil),
		routes.RegisterRoute(http.MethodGet, "data-bucket-editor/bucket/:id", d.getBucket, nil),
		routes.RegisterRoute(http.MethodPut, "data-bucket-editor/bucket", d.createBucket, nil),
		routes.RegisterRoute(http.MethodPatch, "data-bucket-editor/bucket/:id", d.updateBucket, nil),
		routes.RegisterRoute(http.MethodDelete, "data-bucket-editor/bucket/:id", d.deleteBucket, nil),
		routes.RegisterRoute(http.MethodGet, "data-bucket-editor/lookups/:kind", d.lookupScope, nil),
	}
}

func (d *DataBucketEditorController) listBuckets(c echo.Context) error {
	db := d.db.Get(models.DataBucket{}, c)
	page, limit := operationalEditorPagination(c)
	now := time.Now().Unix()

	base := dataBucketEditorBaseQuery(db)
	search := strings.TrimSpace(c.QueryParam("q"))
	if search != "" {
		like := "%" + search + "%"
		base = base.Where(
			"db.`key` LIKE ? OR db.`value` LIKE ? OR CAST(db.id AS CHAR) LIKE ? OR a.name LIKE ? OR ch.name LIKE ? OR npc.name LIKE ?",
			like, like, like, like, like, like,
		)
	}
	base = dataBucketEditorScopeFilter(base, strings.TrimSpace(c.QueryParam("scope")))
	switch strings.TrimSpace(c.QueryParam("state")) {
	case "permanent":
		base = base.Where("db.expires = 0")
	case "expiring":
		base = base.Where("db.expires > ?", now)
	case "expired":
		base = base.Where("db.expires > 0 AND db.expires <= ?", now)
	case "active":
		base = base.Where("db.expires = 0 OR db.expires > ?", now)
	}

	var total int64
	if err := base.Session(&gorm.Session{}).Distinct("db.id").Count(&total).Error; err != nil {
		return operationalEditorDatabaseError(c, "Data Buckets editor", err)
	}

	records := make([]dataBucketEditorRecord, 0)
	selectClause := dataBucketEditorSelectClause(db)
	if err := base.Session(&gorm.Session{}).
		Select(selectClause).
		Order("db.`key`, db.id").
		Limit(limit).
		Offset((page - 1) * limit).
		Scan(&records).Error; err != nil {
		return operationalEditorDatabaseError(c, "Data Buckets editor", err)
	}
	for index := range records {
		decorateDataBucketRecord(&records[index], now)
	}

	summary, err := loadDataBucketEditorSummary(db, now)
	if err != nil {
		return operationalEditorDatabaseError(c, "Data Buckets editor", err)
	}
	return c.JSON(http.StatusOK, dataBucketEditorPage{
		Data: records, Total: total, Page: page, Limit: limit, Summary: summary,
	})
}

func (d *DataBucketEditorController) getBucket(c echo.Context) error {
	id, err := operationalEditorPositiveID(c, "id", "Data bucket ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := d.loadBucketDetail(d.db.Get(models.DataBucket{}, c), id)
	if err != nil {
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (d *DataBucketEditorController) createBucket(c echo.Context) error {
	var request dataBucketEditorMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid data bucket payload"})
	}
	if err := validateDataBucketEditorInput(request.Bucket); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := d.db.Get(models.DataBucket{}, c)
	payload := map[string]interface{}{
		"action": "create", "key": strings.TrimSpace(request.Bucket.Key),
		"scope":   dataBucketSnapshotScope(request.Bucket.dataBucketEditorSnapshot),
		"expires": request.Bucket.Expires, "reason": strings.TrimSpace(request.Bucket.Reason),
		"value_length": len(request.Bucket.Value),
	}
	auditID, err := writeOperationalEditorAudit(c, d.auditLog, dataBucketEditorEventCreate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Data bucket", err)
	}

	var createdID uint64
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := ensureDataBucketIdentityAvailable(tx, request.Bucket.dataBucketEditorSnapshot, 0); err != nil {
			return err
		}
		row := dataBucketEditorValues(request.Bucket.dataBucketEditorSnapshot)
		if err := tx.Table("data_buckets").Create(row).Error; err != nil {
			return err
		}
		return tx.Raw("SELECT LAST_INSERT_ID()").Scan(&createdID).Error
	})
	if err != nil {
		discardOperationalEditorAudit(d.db, auditID)
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	detail, err := d.loadBucketDetail(db, createdID)
	if err != nil {
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"detail": detail, "audit_id": auditID})
}

func (d *DataBucketEditorController) updateBucket(c echo.Context) error {
	id, err := operationalEditorPositiveID(c, "id", "Data bucket ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request dataBucketEditorMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid data bucket payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original data bucket snapshot is required"})
	}
	if err := validateDataBucketEditorInput(request.Bucket); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := d.db.Get(models.DataBucket{}, c)
	before, err := loadDataBucketSnapshot(db, id, false)
	if err != nil {
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	payload := map[string]interface{}{
		"action": "update", "bucket_id": id, "key": strings.TrimSpace(request.Bucket.Key),
		"previous_key": before.Key, "scope": dataBucketSnapshotScope(request.Bucket.dataBucketEditorSnapshot),
		"expires": request.Bucket.Expires, "reason": strings.TrimSpace(request.Bucket.Reason),
		"value_length": len(request.Bucket.Value), "previous_value_length": len(before.Value),
	}
	auditID, err := writeOperationalEditorAudit(c, d.auditLog, dataBucketEditorEventUpdate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Data bucket", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		locked, err := loadDataBucketSnapshot(tx, id, true)
		if err != nil {
			return err
		}
		if !dataBucketSnapshotsEqual(locked, *request.Expected) {
			return operationalEditorConflict("This data bucket changed after it was loaded. Refresh it before saving.")
		}
		if err := ensureDataBucketIdentityAvailable(tx, request.Bucket.dataBucketEditorSnapshot, id); err != nil {
			return err
		}
		return tx.Table("data_buckets").Where("id = ?", id).
			Updates(dataBucketEditorValues(request.Bucket.dataBucketEditorSnapshot)).Error
	})
	if err != nil {
		discardOperationalEditorAudit(d.db, auditID)
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	detail, err := d.loadBucketDetail(db, id)
	if err != nil {
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (d *DataBucketEditorController) deleteBucket(c echo.Context) error {
	id, err := operationalEditorPositiveID(c, "id", "Data bucket ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request dataBucketEditorMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid data bucket deletion payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original data bucket snapshot is required"})
	}
	if !request.Confirm {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Confirm data bucket deletion before continuing"})
	}
	if err := validateOperationalEditorReason(request.Bucket.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := d.db.Get(models.DataBucket{}, c)
	detail, err := d.loadBucketDetail(db, id)
	if err != nil {
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	if detail.Usage.Total > 0 && !request.AllowReferencedKey {
		return c.JSON(http.StatusConflict, echo.Map{
			"error": "This key is referenced by merchant or spell conditions. Review the usage and explicitly allow referenced-key removal.",
			"usage": detail.Usage,
		})
	}
	payload := map[string]interface{}{
		"action": "delete", "bucket_id": id, "key": detail.Bucket.Key,
		"scope": detail.Bucket.ScopeLabels, "expires": detail.Bucket.Expires,
		"reason": strings.TrimSpace(request.Bucket.Reason), "usage": detail.Usage,
		"value_length": len(detail.Bucket.Value),
	}
	auditID, err := writeOperationalEditorAudit(c, d.auditLog, dataBucketEditorEventDelete, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Data bucket", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		locked, err := loadDataBucketSnapshot(tx, id, true)
		if err != nil {
			return err
		}
		if !dataBucketSnapshotsEqual(locked, *request.Expected) {
			return operationalEditorConflict("This data bucket changed after it was loaded. Refresh it before deleting.")
		}
		result := tx.Table("data_buckets").Where("id = ?", id).Delete(nil)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(d.db, auditID)
		return operationalEditorMutationError(c, "Data bucket", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted_id": id, "audit_id": auditID})
}

func (d *DataBucketEditorController) lookupScope(c echo.Context) error {
	db := d.db.Get(models.DataBucket{}, c)
	kind := strings.TrimSpace(c.Param("kind"))
	search := strings.TrimSpace(c.QueryParam("q"))
	like := "%" + search + "%"
	results := make([]operationalEditorLookup, 0)
	var query *gorm.DB
	switch kind {
	case "accounts":
		query = db.Table("account").
			Select("id, name, CONCAT('Account #', id) AS context").
			Where("name LIKE ? OR CAST(id AS CHAR) LIKE ?", like, like).
			Order("name").Limit(20)
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
	case "bots":
		if !operationalEditorTableExists(db, "bot_data") {
			return c.JSON(http.StatusOK, echo.Map{"data": results, "available": false})
		}
		query = db.Table("bot_data").
			Select("bot_id AS id, name, CONCAT('Owner character #', owner_id) AS context").
			Where("name LIKE ? OR CAST(bot_id AS CHAR) LIKE ?", like, like).
			Order("name").Limit(20)
	case "zones":
		query = db.Table("zone").
			Select("zoneidnumber AS id, MAX(long_name) AS name, CONCAT(MAX(short_name), ' · all versions') AS context").
			Where("long_name LIKE ? OR short_name LIKE ? OR CAST(zoneidnumber AS CHAR) LIKE ?", like, like, like).
			Group("zoneidnumber").Order("name").Limit(20)
	default:
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Unknown data bucket lookup type"})
	}
	if err := query.Scan(&results).Error; err != nil {
		return operationalEditorDatabaseError(c, "Data Buckets editor", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"data": results, "available": true})
}

func (d *DataBucketEditorController) loadBucketDetail(db *gorm.DB, id uint64) (dataBucketEditorDetail, error) {
	var bucket dataBucketEditorRecord
	if err := dataBucketEditorBaseQuery(db).
		Select(dataBucketEditorSelectClause(db)).
		Where("db.id = ?", id).
		Take(&bucket).Error; err != nil {
		return dataBucketEditorDetail{}, err
	}
	decorateDataBucketRecord(&bucket, time.Now().Unix())
	usage, err := loadDataBucketEditorUsage(db, bucket.Key)
	if err != nil {
		return dataBucketEditorDetail{}, err
	}
	return dataBucketEditorDetail{Bucket: bucket, Usage: usage}, nil
}

func dataBucketEditorBaseQuery(db *gorm.DB) *gorm.DB {
	query := db.Table("data_buckets db").
		Joins("LEFT JOIN account a ON a.id = db.account_id").
		Joins("LEFT JOIN character_data ch ON ch.id = db.character_id").
		Joins("LEFT JOIN npc_types npc ON npc.id = db.npc_id")
	if operationalEditorTableExists(db, "bot_data") {
		query = query.Joins("LEFT JOIN bot_data bot ON bot.bot_id = db.bot_id")
	}
	return query
}

func dataBucketEditorSelectClause(db *gorm.DB) string {
	botName := "'' AS bot_name"
	if operationalEditorTableExists(db, "bot_data") {
		botName = "COALESCE(bot.name, '') AS bot_name"
	}
	return fmt.Sprintf(`
		db.id, COALESCE(db.`+"`key`"+`, '') AS `+"`key`"+`, COALESCE(db.`+"`value`"+`, '') AS `+"`value`"+`,
		COALESCE(db.expires, 0) AS expires, COALESCE(db.account_id, 0) AS account_id,
		db.character_id, db.npc_id, db.bot_id, db.zone_id, db.instance_id,
		COALESCE(a.name, '') AS account_name, COALESCE(ch.name, '') AS character_name,
		COALESCE(npc.name, '') AS npc_name, %s,
		COALESCE((SELECT z.long_name FROM zone z WHERE z.zoneidnumber = db.zone_id ORDER BY z.version LIMIT 1), '') AS zone_name
	`, botName)
}

func dataBucketEditorScopeFilter(db *gorm.DB, scope string) *gorm.DB {
	switch scope {
	case "global":
		return db.Where("db.account_id = 0 AND db.character_id = 0 AND db.npc_id = 0 AND db.bot_id = 0 AND db.zone_id = 0 AND db.instance_id = 0")
	case "account":
		return db.Where("db.account_id > 0")
	case "character":
		return db.Where("db.character_id > 0")
	case "npc":
		return db.Where("db.npc_id > 0")
	case "bot":
		return db.Where("db.bot_id > 0")
	case "zone":
		return db.Where("db.zone_id > 0")
	case "instance":
		return db.Where("db.instance_id > 0")
	case "composite":
		return db.Where("(db.account_id > 0) + (db.character_id > 0) + (db.npc_id > 0) + (db.bot_id > 0) + (db.zone_id > 0) + (db.instance_id > 0) > 1")
	default:
		return db
	}
}

func loadDataBucketEditorSummary(db *gorm.DB, now int64) (dataBucketEditorSummary, error) {
	var summary dataBucketEditorSummary
	err := db.Table("data_buckets").Select(`
		COUNT(*) AS total,
		COALESCE(SUM(expires = 0), 0) AS permanent,
		COALESCE(SUM(expires > ?), 0) AS expiring,
		COALESCE(SUM(expires > 0 AND expires <= ?), 0) AS expired,
		COALESCE(SUM(account_id = 0 AND character_id = 0 AND npc_id = 0 AND bot_id = 0 AND zone_id = 0 AND instance_id = 0), 0) AS global,
		COALESCE(SUM(account_id > 0 OR character_id > 0 OR npc_id > 0 OR bot_id > 0 OR zone_id > 0 OR instance_id > 0), 0) AS scoped
	`, now, now).Scan(&summary).Error
	return summary, err
}

func loadDataBucketEditorUsage(db *gorm.DB, key string) (dataBucketEditorUsage, error) {
	usage := dataBucketEditorUsage{Samples: make([]dataBucketEditorUsageSample, 0)}
	if operationalEditorTableExists(db, "merchantlist") {
		if err := db.Table("merchantlist").Where("bucket_name = ?", key).Count(&usage.MerchantCount).Error; err != nil {
			return usage, err
		}
		var samples []struct {
			MerchantID int    `gorm:"column:merchant_id"`
			Slot       int    `gorm:"column:slot"`
			ItemID     int    `gorm:"column:item_id"`
			ItemName   string `gorm:"column:item_name"`
			Value      string `gorm:"column:bucket_value"`
			Comparison int    `gorm:"column:bucket_comparison"`
		}
		if err := db.Table("merchantlist ml").
			Joins("LEFT JOIN items i ON i.id = ml.item").
			Select("ml.merchantid AS merchant_id, ml.slot, ml.item AS item_id, COALESCE(i.Name, '') AS item_name, ml.bucket_value, ml.bucket_comparison").
			Where("ml.bucket_name = ?", key).Order("ml.merchantid, ml.slot").Limit(6).Scan(&samples).Error; err != nil {
			return usage, err
		}
		for _, sample := range samples {
			label := sample.ItemName
			if label == "" {
				label = fmt.Sprintf("Item #%d", sample.ItemID)
			}
			usage.Samples = append(usage.Samples, dataBucketEditorUsageSample{
				Kind: "merchant", ID: fmt.Sprintf("%d:%d", sample.MerchantID, sample.Slot),
				Label: label, Context: fmt.Sprintf("Merchant %d · slot %d", sample.MerchantID, sample.Slot),
				Comparison: dataBucketComparisonLabel(sample.Comparison, sample.Value),
			})
		}
	}
	if operationalEditorTableExists(db, "spell_buckets") {
		if err := db.Table("spell_buckets").Where("bucket_name = ?", key).Count(&usage.SpellCount).Error; err != nil {
			return usage, err
		}
		var samples []struct {
			SpellID    int    `gorm:"column:spell_id"`
			Value      string `gorm:"column:bucket_value"`
			Comparison int    `gorm:"column:bucket_comparison"`
		}
		if err := db.Table("spell_buckets").
			Select("spell_id, bucket_value, bucket_comparison").
			Where("bucket_name = ?", key).Order("spell_id").Limit(6).Scan(&samples).Error; err != nil {
			return usage, err
		}
		for _, sample := range samples {
			usage.Samples = append(usage.Samples, dataBucketEditorUsageSample{
				Kind: "spell", ID: strconv.Itoa(sample.SpellID),
				Label: fmt.Sprintf("Spell #%d", sample.SpellID), Context: "Spell bucket condition",
				Comparison: dataBucketComparisonLabel(sample.Comparison, sample.Value),
			})
		}
	}
	usage.Total = usage.MerchantCount + usage.SpellCount
	return usage, nil
}

func dataBucketComparisonLabel(comparison int, value string) string {
	operators := map[int]string{0: "=", 1: "!=", 2: ">", 3: "<", 4: ">=", 5: "<=", 6: "contains", 7: "not contains"}
	operator, ok := operators[comparison]
	if !ok {
		operator = fmt.Sprintf("comparison %d", comparison)
	}
	return fmt.Sprintf("%s %s", operator, value)
}

func decorateDataBucketRecord(record *dataBucketEditorRecord, now int64) {
	record.Permanent = record.Expires == 0
	record.Expired = record.Expires > 0 && int64(record.Expires) <= now
	record.ScopeKind, record.ScopeLabels = dataBucketRecordScope(*record)
}

func dataBucketRecordScope(record dataBucketEditorRecord) (string, []string) {
	labels := make([]string, 0)
	kinds := make([]string, 0)
	if record.AccountID > 0 {
		label := record.AccountName
		if label == "" {
			label = fmt.Sprintf("#%d", record.AccountID)
		}
		labels = append(labels, "Account "+label)
		kinds = append(kinds, "account")
	}
	if record.CharacterID > 0 {
		label := record.CharacterName
		if label == "" {
			label = fmt.Sprintf("#%d", record.CharacterID)
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
	if record.BotID > 0 {
		label := record.BotName
		if label == "" {
			label = fmt.Sprintf("#%d", record.BotID)
		}
		labels = append(labels, "Bot "+label)
		kinds = append(kinds, "bot")
	}
	if record.ZoneID > 0 {
		label := record.ZoneName
		if label == "" {
			label = fmt.Sprintf("#%d", record.ZoneID)
		}
		labels = append(labels, "Zone "+label)
		kinds = append(kinds, "zone")
	}
	if record.InstanceID > 0 {
		labels = append(labels, fmt.Sprintf("Instance #%d", record.InstanceID))
		kinds = append(kinds, "instance")
	}
	if len(labels) == 0 {
		return "global", []string{"Global"}
	}
	if len(labels) > 1 {
		return "composite", labels
	}
	return kinds[0], labels
}

func dataBucketSnapshotScope(snapshot dataBucketEditorSnapshot) []string {
	record := dataBucketEditorRecord{
		AccountID: snapshot.AccountID, CharacterID: snapshot.CharacterID, NpcID: snapshot.NpcID,
		BotID: snapshot.BotID, ZoneID: snapshot.ZoneID, InstanceID: snapshot.InstanceID,
	}
	_, labels := dataBucketRecordScope(record)
	return labels
}

func validateDataBucketEditorInput(input dataBucketEditorInput) error {
	if err := validateOperationalEditorReason(input.Reason); err != nil {
		return err
	}
	key := strings.TrimSpace(input.Key)
	if key == "" {
		return errors.New("Bucket key is required")
	}
	if len(key) > 100 {
		return errors.New("Bucket key must be 100 characters or fewer")
	}
	if len(input.Value) > dataBucketEditorValueLimit {
		return fmt.Errorf("Bucket value must be %d characters or fewer", dataBucketEditorValueLimit)
	}
	if input.Expires > math.MaxUint32 {
		return errors.New("Expiration is outside the supported UNIX timestamp range")
	}
	if input.NpcID > math.MaxUint32 || input.BotID > math.MaxUint32 {
		return errors.New("NPC and bot IDs must fit the connected EQEmu schema")
	}
	if input.ZoneID > math.MaxUint16 || input.InstanceID > math.MaxUint16 {
		return errors.New("Zone and instance IDs must be 65535 or lower")
	}
	return nil
}

func dataBucketEditorValues(snapshot dataBucketEditorSnapshot) map[string]interface{} {
	return map[string]interface{}{
		"key": strings.TrimSpace(snapshot.Key), "value": snapshot.Value, "expires": snapshot.Expires,
		"account_id": snapshot.AccountID, "character_id": snapshot.CharacterID,
		"npc_id": snapshot.NpcID, "bot_id": snapshot.BotID,
		"zone_id": snapshot.ZoneID, "instance_id": snapshot.InstanceID,
	}
}

func ensureDataBucketIdentityAvailable(db *gorm.DB, snapshot dataBucketEditorSnapshot, excludeID uint64) error {
	var count int64
	query := db.Table("data_buckets").
		Where("`key` = ? AND account_id = ? AND character_id = ? AND npc_id = ? AND bot_id = ? AND zone_id = ? AND instance_id = ?",
			strings.TrimSpace(snapshot.Key), snapshot.AccountID, snapshot.CharacterID, snapshot.NpcID,
			snapshot.BotID, snapshot.ZoneID, snapshot.InstanceID)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return operationalEditorConflict("A data bucket already uses this key and exact scope combination")
	}
	return nil
}

func loadDataBucketSnapshot(db *gorm.DB, id uint64, lock bool) (dataBucketEditorSnapshot, error) {
	var snapshot dataBucketEditorSnapshot
	query := db.Table("data_buckets").
		Select("COALESCE(`key`, '') AS `key`, COALESCE(`value`, '') AS `value`, COALESCE(expires, 0) AS expires, COALESCE(account_id, 0) AS account_id, character_id, npc_id, bot_id, zone_id, instance_id").
		Where("id = ?", id)
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := query.Take(&snapshot).Error
	return snapshot, err
}

func dataBucketSnapshotsEqual(left dataBucketEditorSnapshot, right dataBucketEditorSnapshot) bool {
	return left.Key == right.Key &&
		left.Value == right.Value &&
		left.Expires == right.Expires &&
		left.AccountID == right.AccountID &&
		left.CharacterID == right.CharacterID &&
		left.NpcID == right.NpcID &&
		left.BotID == right.BotID &&
		left.ZoneID == right.ZoneID &&
		left.InstanceID == right.InstanceID
}
