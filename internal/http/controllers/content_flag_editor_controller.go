package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"unicode"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

const (
	contentFlagEditorDefaultPageSize = 50
	contentFlagEditorMaxPageSize     = 100
	contentFlagEditorSampleLimit     = 5
	contentFlagEditorNameLimit       = 75
)

type ContentFlagEditorController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type contentFlagEditorPage struct {
	Data                interface{} `json:"data"`
	Total               int64       `json:"total"`
	Page                int         `json:"page"`
	Limit               int         `json:"limit"`
	ReferenceTableCount int         `json:"reference_table_count,omitempty"`
	ScannedFieldCount   int         `json:"scanned_field_count,omitempty"`
}

type contentFlagEditorInput struct {
	ID       int    `json:"id"`
	FlagName string `json:"flag_name"`
	Enabled  bool   `json:"enabled"`
	Notes    string `json:"notes"`
}

type contentFlagEditorSummary struct {
	ID          int    `json:"id"`
	FlagName    string `json:"flag_name"`
	Enabled     bool   `json:"enabled"`
	NotePreview string `json:"note_preview"`
}

type contentFlagEditorReferenceSample struct {
	RecordKey     string `json:"record_key"`
	RecordLabel   string `json:"record_label"`
	RecordContext string `json:"record_context"`
	RawValue      string `json:"raw_value"`
}

type contentFlagEditorReferenceGroup struct {
	Key        string                             `json:"key"`
	Table      string                             `json:"table"`
	TableLabel string                             `json:"table_label"`
	Column     string                             `json:"column"`
	Mode       string                             `json:"mode"`
	Count      int64                              `json:"count"`
	Samples    []contentFlagEditorReferenceSample `json:"samples"`
}

type contentFlagEditorUsage struct {
	ReferenceCount      int64                             `json:"reference_count"`
	RequiredCount       int64                             `json:"required_count"`
	BlockedCount        int64                             `json:"blocked_count"`
	AffectedTableCount  int                               `json:"affected_table_count"`
	AvailableTableCount int                               `json:"available_table_count"`
	ScannedFieldCount   int                               `json:"scanned_field_count"`
	Groups              []contentFlagEditorReferenceGroup `json:"groups"`
}

type contentFlagEditorDetail struct {
	Flag  contentFlagEditorInput `json:"flag"`
	Usage contentFlagEditorUsage `json:"usage"`
}

type contentFlagEditorResolveRequest struct {
	Mode     string `json:"mode"`
	TargetID int    `json:"target_id"`
}

type contentFlagEditorResolveResult struct {
	DeletedID       int    `json:"deleted_id"`
	Mode            string `json:"mode"`
	ReplacementID   int    `json:"replacement_id,omitempty"`
	ReplacementName string `json:"replacement_name,omitempty"`
	UpdatedRows     int64  `json:"updated_rows"`
}

type contentFlagReferenceDefinition struct {
	Table             string
	TableLabel        string
	KeyExpression     string
	LabelExpression   string
	ContextExpression string
}

type contentFlagReferenceColumn struct {
	contentFlagReferenceDefinition
	Column string
	Mode   string
}

var contentFlagReferenceDefinitions = []contentFlagReferenceDefinition{
	{
		Table: "blocked_spells", TableLabel: "Blocked Spells",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`description`, ''), CONCAT('Spell ', `spellid`))",
		ContextExpression: "CONCAT('Zone ', `zoneid`)",
	},
	{
		Table: "doors", TableLabel: "Doors",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`name`, ''), CONCAT('Door ', `doorid`))",
		ContextExpression: "CONCAT(COALESCE(`zone`, 'Unknown zone'), ' · version ', `version`)",
	},
	{
		Table: "fishing", TableLabel: "Fishing",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "CONCAT('Item ', `Itemid`)",
		ContextExpression: "CONCAT('Zone ', `zoneid`, ' · chance ', `chance`, '%')",
	},
	{
		Table: "forage", TableLabel: "Forage",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "CONCAT('Item ', `Itemid`)",
		ContextExpression: "CONCAT('Zone ', `zoneid`, ' · chance ', `chance`, '%')",
	},
	{
		Table: "global_loot", TableLabel: "Global Loot",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`description`, ''), CONCAT('Loot table ', `loottable_id`))",
		ContextExpression: "CONCAT('Levels ', `min_level`, '–', `max_level`)",
	},
	{
		Table: "ground_spawns", TableLabel: "Ground Spawns",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`name`, ''), CONCAT('Item ', `item`))",
		ContextExpression: "CONCAT(COALESCE(`zoneid`, 'Unknown zone'), ' · version ', `version`)",
	},
	{
		Table: "lootdrop", TableLabel: "Loot Drops",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`name`, ''), CONCAT('Loot drop ', `id`))",
		ContextExpression: "CONCAT('Loot drop #', `id`)",
	},
	{
		Table: "lootdrop_entries", TableLabel: "Loot Drop Entries",
		KeyExpression:     "CONCAT(`lootdrop_id`, ':', `item_id`)",
		LabelExpression:   "CONCAT('Item ', `item_id`)",
		ContextExpression: "CONCAT('Loot drop ', `lootdrop_id`, ' · chance ', `chance`, '%')",
	},
	{
		Table: "loottable", TableLabel: "Loot Tables",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`name`, ''), CONCAT('Loot table ', `id`))",
		ContextExpression: "CONCAT('Loot table #', `id`)",
	},
	{
		Table: "merchantlist", TableLabel: "Merchant Entries",
		KeyExpression:     "CONCAT(`merchantid`, ':', `slot`)",
		LabelExpression:   "CONCAT('Item ', `item`)",
		ContextExpression: "CONCAT('Merchant ', `merchantid`, ' · slot ', `slot`)",
	},
	{
		Table: "npc_spells_entries", TableLabel: "NPC Spell Entries",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "CONCAT('Spell ', `spellid`)",
		ContextExpression: "CONCAT('NPC spell list ', `npc_spells_id`, ' · levels ', `minlevel`, '–', `maxlevel`)",
	},
	{
		Table: "object", TableLabel: "Objects",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`display_name`, ''), NULLIF(`objectname`, ''), CONCAT('Object ', `id`))",
		ContextExpression: "CONCAT(COALESCE(`zoneid`, 'Unknown zone'), ' · version ', `version`)",
	},
	{
		Table: "spawn2", TableLabel: "Spawn Points",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "CONCAT('Spawn group ', `spawngroupID`)",
		ContextExpression: "CONCAT(COALESCE(`zone`, 'Unknown zone'), ' · version ', `version`)",
	},
	{
		Table: "spawnentry", TableLabel: "Spawn Entries",
		KeyExpression:     "CONCAT(`spawngroupID`, ':', `npcID`)",
		LabelExpression:   "CONCAT('NPC ', `npcID`)",
		ContextExpression: "CONCAT('Spawn group ', `spawngroupID`, ' · chance ', `chance`, '%')",
	},
	{
		Table: "starting_items", TableLabel: "Starting Items",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "CONCAT('Item ', `item_id`)",
		ContextExpression: "CONCAT('Inventory slot ', `inventory_slot`)",
	},
	{
		Table: "start_zones", TableLabel: "Starting Zones",
		KeyExpression:     "CONCAT(`player_choice`, ':', `player_class`, ':', `player_deity`, ':', `player_race`)",
		LabelExpression:   "CONCAT('Choice ', `player_choice`, ' · class ', `player_class`)",
		ContextExpression: "CONCAT('Start zone ', `start_zone`, ' · race ', `player_race`)",
	},
	{
		Table: "tradeskill_recipe", TableLabel: "Tradeskill Recipes",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`name`, ''), CONCAT('Recipe ', `id`))",
		ContextExpression: "CONCAT('Tradeskill ', `tradeskill`, ' · trivial ', `trivial`)",
	},
	{
		Table: "traps", TableLabel: "Traps",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`message`, ''), CONCAT('Trap ', `id`))",
		ContextExpression: "CONCAT(COALESCE(`zone`, 'Unknown zone'), ' · version ', `version`)",
	},
	{
		Table: "zone", TableLabel: "Zones",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "COALESCE(NULLIF(`long_name`, ''), NULLIF(`short_name`, ''), CONCAT('Zone ', `id`))",
		ContextExpression: "CONCAT(COALESCE(`short_name`, 'Unknown zone'), ' · version ', `version`)",
	},
	{
		Table: "zone_points", TableLabel: "Zone Points",
		KeyExpression:     "CAST(`id` AS CHAR)",
		LabelExpression:   "CONCAT('Zone point ', `number`)",
		ContextExpression: "CONCAT(COALESCE(`zone`, 'Unknown zone'), ' → zone ', `target_zone_id`)",
	},
}

func NewContentFlagEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *ContentFlagEditorController {
	return &ContentFlagEditorController{
		db:       db,
		auditLog: auditLog,
	}
}

func (f *ContentFlagEditorController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "content-flag-editor/flags", f.listFlags, nil),
		routes.RegisterRoute(http.MethodGet, "content-flag-editor/flag/:id", f.getFlag, nil),
		routes.RegisterRoute(http.MethodPut, "content-flag-editor/flag", f.createFlag, nil),
		routes.RegisterRoute(http.MethodPatch, "content-flag-editor/flag/:id", f.updateFlag, nil),
		routes.RegisterRoute(http.MethodDelete, "content-flag-editor/flag/:id", f.deleteFlag, nil),
		routes.RegisterRoute(http.MethodPost, "content-flag-editor/flag/:id/resolve", f.resolveAndDeleteFlag, nil),
	}
}

func (f *ContentFlagEditorController) listFlags(c echo.Context) error {
	db := f.db.Get(models.ContentFlag{}, c)
	page, limit := contentFlagEditorPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	status := strings.TrimSpace(c.QueryParam("status"))

	query := db.Table("content_flags")
	if search != "" {
		query = query.Where("flag_name LIKE ? OR notes LIKE ?", "%"+search+"%", "%"+search+"%")
		if id, err := strconv.Atoi(search); err == nil {
			query = db.Table("content_flags").Where(
				"flag_name LIKE ? OR notes LIKE ? OR id = ?",
				"%"+search+"%",
				"%"+search+"%",
				id,
			)
		}
	}
	switch status {
	case "enabled":
		query = query.Where("enabled <> 0")
	case "disabled":
		query = query.Where("enabled = 0 OR enabled IS NULL")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return contentFlagEditorDatabaseError(c, err)
	}
	referenceColumns, referenceTableCount, err := availableContentFlagReferenceColumns(db)
	if err != nil {
		return contentFlagEditorDatabaseError(c, err)
	}

	if c.QueryParam("lookup") == "1" {
		results := make([]contentFlagEditorSummary, 0)
		if err := query.
			Select(`
				id,
				COALESCE(flag_name, '') AS flag_name,
				CASE WHEN enabled <> 0 THEN TRUE ELSE FALSE END AS enabled,
				'' AS note_preview
			`).
			Order("flag_name ASC, id ASC").
			Scan(&results).Error; err != nil {
			return contentFlagEditorDatabaseError(c, err)
		}
		return c.JSON(http.StatusOK, contentFlagEditorPage{
			Data: results, Total: total, Page: 1, Limit: len(results),
			ReferenceTableCount: referenceTableCount,
			ScannedFieldCount:   len(referenceColumns),
		})
	}

	results := make([]contentFlagEditorSummary, 0)
	if err := query.
		Select(`
			id,
			COALESCE(flag_name, '') AS flag_name,
			CASE WHEN enabled <> 0 THEN TRUE ELSE FALSE END AS enabled,
			LEFT(COALESCE(notes, ''), 140) AS note_preview
		`).
		Order("flag_name ASC, id ASC").
		Limit(limit).
		Offset((page - 1) * limit).
		Scan(&results).Error; err != nil {
		return contentFlagEditorDatabaseError(c, err)
	}

	return c.JSON(http.StatusOK, contentFlagEditorPage{
		Data: results, Total: total, Page: page, Limit: limit,
		ReferenceTableCount: referenceTableCount,
		ScannedFieldCount:   len(referenceColumns),
	})
}

func (f *ContentFlagEditorController) getFlag(c echo.Context) error {
	id, err := contentFlagEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	detail, err := f.loadFlagDetail(f.db.Get(models.ContentFlag{}, c), id)
	if err != nil {
		return contentFlagEditorLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (f *ContentFlagEditorController) createFlag(c echo.Context) error {
	request := new(contentFlagEditorInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid content flag payload: %v", err)})
	}
	if err := validateContentFlagEditorInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.ContentFlag{}, c)
	var createdID int
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := ensureContentFlagNameAvailable(tx, strings.TrimSpace(request.FlagName), 0); err != nil {
			return err
		}
		values := map[string]interface{}{
			"flag_name": strings.TrimSpace(request.FlagName),
			"enabled":   contentFlagEditorBoolInt(request.Enabled),
			"notes":     strings.TrimSpace(request.Notes),
		}
		if err := tx.Table("content_flags").Create(values).Error; err != nil {
			return err
		}
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&createdID).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return contentFlagEditorMutationError(c, err)
	}

	f.log(c, "CREATE", fmt.Sprintf(
		"Created [Content Flag] [id = %d] [%s]",
		createdID,
		strings.TrimSpace(request.FlagName),
	))
	detail, err := f.loadFlagDetail(db, createdID)
	if err != nil {
		return contentFlagEditorLoadError(c, err)
	}
	return c.JSON(http.StatusCreated, detail)
}

func (f *ContentFlagEditorController) updateFlag(c echo.Context) error {
	id, err := contentFlagEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(contentFlagEditorInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid content flag payload: %v", err)})
	}
	request.ID = id
	if err := validateContentFlagEditorInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.ContentFlag{}, c)
	newName := strings.TrimSpace(request.FlagName)
	var oldName string
	var rewrittenRows int64
	err = db.Transaction(func(tx *gorm.DB) error {
		var current contentFlagEditorInput
		if err := tx.Table("content_flags").
			Select("id, COALESCE(flag_name, '') AS flag_name").
			Where("id = ?", id).
			Take(&current).Error; err != nil {
			return err
		}
		oldName = current.FlagName
		if err := ensureContentFlagNameAvailable(tx, newName, id); err != nil {
			return err
		}
		if oldName != newName {
			updated, rewriteErr := rewriteContentFlagReferences(tx, oldName, newName)
			if rewriteErr != nil {
				return rewriteErr
			}
			rewrittenRows = updated
		}
		return tx.Table("content_flags").Where("id = ?", id).Updates(map[string]interface{}{
			"flag_name": newName,
			"enabled":   contentFlagEditorBoolInt(request.Enabled),
			"notes":     strings.TrimSpace(request.Notes),
		}).Error
	})
	if err != nil {
		return contentFlagEditorMutationError(c, err)
	}

	description := fmt.Sprintf("Updated [Content Flag] [id = %d] [%s]", id, newName)
	if oldName != newName {
		description = fmt.Sprintf(
			"Renamed [Content Flag] [id = %d] [%s] to [%s] and updated [%d] reference rows",
			id,
			oldName,
			newName,
			rewrittenRows,
		)
	}
	f.log(c, "UPDATE", description)
	detail, err := f.loadFlagDetail(db, id)
	if err != nil {
		return contentFlagEditorLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (f *ContentFlagEditorController) deleteFlag(c echo.Context) error {
	id, err := contentFlagEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.ContentFlag{}, c)
	var deletedName string
	err = db.Transaction(func(tx *gorm.DB) error {
		var flag contentFlagEditorInput
		if err := tx.Table("content_flags").
			Select("id, COALESCE(flag_name, '') AS flag_name").
			Where("id = ?", id).
			Take(&flag).Error; err != nil {
			return err
		}
		deletedName = flag.FlagName
		usage, usageErr := loadContentFlagUsage(tx, flag.FlagName)
		if usageErr != nil {
			return usageErr
		}
		if usage.ReferenceCount > 0 {
			return contentFlagEditorReferenceConflict{usage: usage}
		}
		return tx.Table("content_flags").Where("id = ?", id).Delete(nil).Error
	})
	if err != nil {
		var referenceConflict contentFlagEditorReferenceConflict
		if errors.As(err, &referenceConflict) {
			return c.JSON(http.StatusConflict, echo.Map{
				"error": "Content flag is still referenced. Replace or remove its references before deleting it.",
				"usage": referenceConflict.usage,
			})
		}
		return contentFlagEditorMutationError(c, err)
	}

	f.log(c, "DELETE", fmt.Sprintf("Deleted [Content Flag] [id = %d] [%s]", id, deletedName))
	return c.NoContent(http.StatusNoContent)
}

func (f *ContentFlagEditorController) resolveAndDeleteFlag(c echo.Context) error {
	id, err := contentFlagEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(contentFlagEditorResolveRequest)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid resolution payload: %v", err)})
	}
	request.Mode = strings.TrimSpace(strings.ToLower(request.Mode))
	if request.Mode != "replace" && request.Mode != "remove" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Resolution mode must be replace or remove"})
	}
	if request.Mode == "replace" && request.TargetID <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Select a replacement content flag"})
	}
	if request.Mode == "replace" && request.TargetID == id {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Replacement content flag must be different"})
	}

	db := f.db.Get(models.ContentFlag{}, c)
	result := contentFlagEditorResolveResult{DeletedID: id, Mode: request.Mode}
	var sourceName string
	err = db.Transaction(func(tx *gorm.DB) error {
		var source contentFlagEditorInput
		if err := tx.Table("content_flags").
			Select("id, COALESCE(flag_name, '') AS flag_name").
			Where("id = ?", id).
			Take(&source).Error; err != nil {
			return err
		}
		sourceName = source.FlagName

		replacementName := ""
		if request.Mode == "replace" {
			var target contentFlagEditorInput
			if err := tx.Table("content_flags").
				Select("id, COALESCE(flag_name, '') AS flag_name").
				Where("id = ?", request.TargetID).
				Take(&target).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return contentFlagEditorConflict("Replacement content flag was not found")
				}
				return err
			}
			replacementName = target.FlagName
			result.ReplacementID = target.ID
			result.ReplacementName = target.FlagName
		}

		updatedRows, rewriteErr := rewriteContentFlagReferences(tx, source.FlagName, replacementName)
		if rewriteErr != nil {
			return rewriteErr
		}
		result.UpdatedRows = updatedRows

		remaining, usageErr := loadContentFlagUsage(tx, source.FlagName)
		if usageErr != nil {
			return usageErr
		}
		if remaining.ReferenceCount > 0 {
			return contentFlagEditorConflict(
				"%d references could not be resolved safely; no changes were committed",
				remaining.ReferenceCount,
			)
		}
		return tx.Table("content_flags").Where("id = ?", id).Delete(nil).Error
	})
	if err != nil {
		return contentFlagEditorMutationError(c, err)
	}

	description := fmt.Sprintf(
		"Removed [%d] references and deleted [Content Flag] [id = %d] [%s]",
		result.UpdatedRows,
		id,
		sourceName,
	)
	if request.Mode == "replace" {
		description = fmt.Sprintf(
			"Replaced [%d] references from [Content Flag] [%s] to [%s] and deleted [id = %d]",
			result.UpdatedRows,
			sourceName,
			result.ReplacementName,
			id,
		)
	}
	f.log(c, "DELETE", description)
	return c.JSON(http.StatusOK, result)
}

func (f *ContentFlagEditorController) loadFlagDetail(db *gorm.DB, id int) (contentFlagEditorDetail, error) {
	var flag contentFlagEditorInput
	if err := db.Table("content_flags").
		Select(`
			id,
			COALESCE(flag_name, '') AS flag_name,
			CASE WHEN enabled <> 0 THEN TRUE ELSE FALSE END AS enabled,
			COALESCE(notes, '') AS notes
		`).
		Where("id = ?", id).
		Take(&flag).Error; err != nil {
		return contentFlagEditorDetail{}, err
	}
	usage, err := loadContentFlagUsage(db, flag.FlagName)
	if err != nil {
		return contentFlagEditorDetail{}, err
	}
	return contentFlagEditorDetail{Flag: flag, Usage: usage}, nil
}

func loadContentFlagUsage(db *gorm.DB, flagName string) (contentFlagEditorUsage, error) {
	columns, availableTableCount, err := availableContentFlagReferenceColumns(db)
	if err != nil {
		return contentFlagEditorUsage{}, err
	}
	usage := contentFlagEditorUsage{
		Groups:              make([]contentFlagEditorReferenceGroup, 0),
		AvailableTableCount: availableTableCount,
		ScannedFieldCount:   len(columns),
	}
	affectedTables := make(map[string]bool)

	for _, reference := range columns {
		condition := contentFlagTokenCondition(reference.Column)
		var count int64
		if err := db.Table(reference.Table).Where(condition, flagName).Count(&count).Error; err != nil {
			return contentFlagEditorUsage{}, err
		}
		if count == 0 {
			continue
		}

		samples := make([]contentFlagEditorReferenceSample, 0)
		selectExpression := fmt.Sprintf(
			"%s AS record_key, %s AS record_label, %s AS record_context, COALESCE(`%s`, '') AS raw_value",
			reference.KeyExpression,
			reference.LabelExpression,
			reference.ContextExpression,
			reference.Column,
		)
		if err := db.Table(reference.Table).
			Select(selectExpression).
			Where(condition, flagName).
			Order(reference.KeyExpression).
			Limit(contentFlagEditorSampleLimit).
			Scan(&samples).Error; err != nil {
			return contentFlagEditorUsage{}, err
		}

		usage.ReferenceCount += count
		if reference.Mode == "required" {
			usage.RequiredCount += count
		} else {
			usage.BlockedCount += count
		}
		affectedTables[reference.Table] = true
		usage.Groups = append(usage.Groups, contentFlagEditorReferenceGroup{
			Key:        reference.Table + "." + reference.Column,
			Table:      reference.Table,
			TableLabel: reference.TableLabel,
			Column:     reference.Column,
			Mode:       reference.Mode,
			Count:      count,
			Samples:    samples,
		})
	}
	usage.AffectedTableCount = len(affectedTables)
	return usage, nil
}

func availableContentFlagReferenceColumns(db *gorm.DB) ([]contentFlagReferenceColumn, int, error) {
	type availableColumn struct {
		TableName  string `gorm:"column:table_name"`
		ColumnName string `gorm:"column:column_name"`
	}
	rows := make([]availableColumn, 0)
	if err := db.Raw(`
		SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
			AND COLUMN_NAME IN ('content_flags', 'content_flags_disabled')
	`).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	available := make(map[string]bool)
	for _, row := range rows {
		available[strings.ToLower(row.TableName+"."+row.ColumnName)] = true
	}
	columns := make([]contentFlagReferenceColumn, 0, len(contentFlagReferenceDefinitions)*2)
	tables := make(map[string]bool)
	for _, definition := range contentFlagReferenceDefinitions {
		for _, field := range []struct {
			column string
			mode   string
		}{
			{column: "content_flags", mode: "required"},
			{column: "content_flags_disabled", mode: "blocked"},
		} {
			if !available[strings.ToLower(definition.Table+"."+field.column)] {
				continue
			}
			columns = append(columns, contentFlagReferenceColumn{
				contentFlagReferenceDefinition: definition,
				Column:                         field.column,
				Mode:                           field.mode,
			})
			tables[definition.Table] = true
		}
	}
	return columns, len(tables), nil
}

func rewriteContentFlagReferences(db *gorm.DB, oldName string, replacementName string) (int64, error) {
	columns, _, err := availableContentFlagReferenceColumns(db)
	if err != nil {
		return 0, err
	}
	var updatedRows int64
	for _, reference := range columns {
		condition := contentFlagTokenCondition(reference.Column)
		expression := contentFlagReplacementExpression(reference.Column)
		result := db.Table(reference.Table).
			Where(condition, oldName).
			Update(reference.Column, gorm.Expr(expression, oldName, replacementName))
		if result.Error != nil {
			return 0, result.Error
		}
		updatedRows += result.RowsAffected
	}
	return updatedRows, nil
}

func contentFlagTokenCondition(column string) string {
	normalized := fmt.Sprintf(
		"REPLACE(REPLACE(COALESCE(`%s`, ''), ', ', ','), ' ,', ',')",
		column,
	)
	return fmt.Sprintf("FIND_IN_SET(?, %s) > 0", normalized)
}

func contentFlagReplacementExpression(column string) string {
	normalized := fmt.Sprintf(
		"REPLACE(REPLACE(COALESCE(`%s`, ''), ', ', ','), ' ,', ',')",
		column,
	)
	replaced := fmt.Sprintf(
		"REPLACE(CONCAT(',', TRIM(BOTH ',' FROM %s), ','), CONCAT(',', ?, ','), CONCAT(',', ?, ','))",
		normalized,
	)
	compacted := fmt.Sprintf("REPLACE(REPLACE(%s, ',,', ','), ',,', ',')", replaced)
	return fmt.Sprintf("TRIM(BOTH ',' FROM %s)", compacted)
}

func ensureContentFlagNameAvailable(db *gorm.DB, flagName string, excludeID int) error {
	query := db.Table("content_flags").Where("flag_name = ?", flagName)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	var count int64
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return contentFlagEditorConflict("A content flag named %q already exists", flagName)
	}
	return nil
}

func validateContentFlagEditorInput(input contentFlagEditorInput) error {
	flagName := strings.TrimSpace(input.FlagName)
	if flagName == "" {
		return errors.New("Flag name is required")
	}
	if len(flagName) > contentFlagEditorNameLimit {
		return fmt.Errorf("Flag name must be %d characters or fewer", contentFlagEditorNameLimit)
	}
	if strings.Contains(flagName, ",") {
		return errors.New("Flag name cannot contain a comma because references are comma-separated")
	}
	for _, character := range flagName {
		if unicode.IsControl(character) {
			return errors.New("Flag name cannot contain control characters")
		}
	}
	return nil
}

func contentFlagEditorPagination(c echo.Context) (int, int) {
	page := 1
	limit := contentFlagEditorDefaultPageSize
	if parsed, err := strconv.Atoi(c.QueryParam("page")); err == nil && parsed > 0 {
		page = parsed
	}
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if limit > contentFlagEditorMaxPageSize {
		limit = contentFlagEditorMaxPageSize
	}
	return page, limit
}

func contentFlagEditorID(c echo.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, errors.New("Content flag ID must be a positive number")
	}
	return id, nil
}

type contentFlagEditorConflictError struct {
	message string
}

func (e contentFlagEditorConflictError) Error() string {
	return e.message
}

func contentFlagEditorConflict(format string, args ...interface{}) error {
	return contentFlagEditorConflictError{message: fmt.Sprintf(format, args...)}
}

type contentFlagEditorReferenceConflict struct {
	usage contentFlagEditorUsage
}

func (e contentFlagEditorReferenceConflict) Error() string {
	return "Content flag is still referenced"
}

func contentFlagEditorMutationError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Content flag was not found"})
	}
	var conflict contentFlagEditorConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	return contentFlagEditorDatabaseError(c, err)
}

func contentFlagEditorLoadError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Content flag was not found"})
	}
	return contentFlagEditorDatabaseError(c, err)
}

func contentFlagEditorDatabaseError(c echo.Context, err error) error {
	return c.JSON(
		http.StatusInternalServerError,
		echo.Map{"error": fmt.Sprintf("Content flag editor database error: %v", err)},
	)
}

func contentFlagEditorBoolInt(value bool) int8 {
	if value {
		return 1
	}
	return 0
}

func (f *ContentFlagEditorController) log(c echo.Context, eventName string, description string) {
	if f.db.GetSpireDb() != nil {
		f.auditLog.LogUserEvent(c, eventName, description)
	}
}
