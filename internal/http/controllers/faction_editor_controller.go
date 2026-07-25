package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

const (
	factionEditorDefaultPageSize = 50
	factionEditorMaxPageSize     = 100
)

type FactionEditorController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type factionEditorPage struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type factionEditorFactionSummary struct {
	ID                 int    `json:"id"`
	Name               string `json:"name"`
	Base               int16  `json:"base"`
	ModifierCount      int64  `json:"modifier_count"`
	NpcTemplateCount   int64  `json:"npc_template_count"`
	NpcStandingCount   int64  `json:"npc_standing_count"`
	ItemReferenceCount int64  `json:"item_reference_count"`
	TaskReferenceCount int64  `json:"task_reference_count"`
}

type factionEditorNpcTemplateSummary struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	PrimaryFaction int    `json:"primary_faction"`
	PrimaryName    string `json:"primary_name"`
	EntryCount     int64  `json:"entry_count"`
	NpcCount       int64  `json:"npc_count"`
	IgnoreAssist   bool   `json:"ignore_primary_assist"`
}

type factionEditorModifier struct {
	ID      uint   `json:"id"`
	Kind    string `json:"kind"`
	ValueID int    `json:"value_id"`
	Amount  int16  `json:"amount"`
}

type factionEditorBaseData struct {
	Min      *int16 `json:"min"`
	Max      *int16 `json:"max"`
	UnkHero1 *int16 `json:"unk_hero_1"`
	UnkHero2 *int16 `json:"unk_hero_2"`
	UnkHero3 *int16 `json:"unk_hero_3"`
}

type factionEditorFactionInput struct {
	ID        int                     `json:"id"`
	Name      string                  `json:"name"`
	Base      int16                   `json:"base"`
	BaseData  *factionEditorBaseData  `json:"base_data"`
	Modifiers []factionEditorModifier `json:"modifiers"`
}

type factionEditorNpcEntry struct {
	FactionID   uint   `json:"faction_id"`
	FactionName string `json:"faction_name,omitempty"`
	Value       int    `json:"value"`
	NpcValue    int8   `json:"npc_value"`
	Temp        int8   `json:"temp"`
	Temporary   bool   `json:"temporary,omitempty"`
}

type factionEditorNpcTemplateInput struct {
	ID                  int                     `json:"id"`
	Name                string                  `json:"name"`
	PrimaryFaction      int                     `json:"primary_faction"`
	IgnorePrimaryAssist bool                    `json:"ignore_primary_assist"`
	Entries             []factionEditorNpcEntry `json:"entries"`
}

type factionEditorReference struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Extra string `json:"extra,omitempty"`
}

type factionEditorFactionReferences struct {
	NpcTemplatePrimaryCount int64                    `json:"npc_template_primary_count"`
	NpcStandingCount        int64                    `json:"npc_standing_count"`
	ItemCount               int64                    `json:"item_count"`
	TaskCount               int64                    `json:"task_count"`
	CharacterValueCount     int64                    `json:"character_value_count"`
	AssociationCount        int64                    `json:"association_count"`
	NpcTemplates            []factionEditorReference `json:"npc_templates"`
	Items                   []factionEditorReference `json:"items"`
	Tasks                   []factionEditorReference `json:"tasks"`
}

func (r factionEditorFactionReferences) Total() int64 {
	return r.NpcTemplatePrimaryCount +
		r.NpcStandingCount +
		r.ItemCount +
		r.TaskCount +
		r.CharacterValueCount +
		r.AssociationCount
}

type factionEditorNpcAssignment struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Level     uint8  `json:"level"`
	Race      uint16 `json:"race"`
	Class     uint8  `json:"class"`
	SpawnHint string `json:"spawn_hint,omitempty"`
}

type factionEditorNpcTemplateReferences struct {
	NpcCount int64                        `json:"npc_count"`
	Npcs     []factionEditorNpcAssignment `json:"npcs"`
}

type factionEditorFactionDetail struct {
	Faction    factionEditorFactionInput      `json:"faction"`
	References factionEditorFactionReferences `json:"references"`
}

type factionEditorNpcTemplateDetail struct {
	Template   factionEditorNpcTemplateInput      `json:"template"`
	References factionEditorNpcTemplateReferences `json:"references"`
}

type factionEditorReassignRequest struct {
	NpcIDs             []int `json:"npc_ids"`
	TargetNpcFactionID int   `json:"target_npc_faction_id"`
}

func NewFactionEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *FactionEditorController {
	return &FactionEditorController{
		db:       db,
		auditLog: auditLog,
	}
}

func (f *FactionEditorController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "faction-editor/free-id/:kind", f.getFreeID, nil),
		routes.RegisterRoute(http.MethodGet, "faction-editor/factions", f.listFactions, nil),
		routes.RegisterRoute(http.MethodGet, "faction-editor/faction/:id", f.getFaction, nil),
		routes.RegisterRoute(http.MethodPut, "faction-editor/faction", f.createFaction, nil),
		routes.RegisterRoute(http.MethodPatch, "faction-editor/faction/:id", f.updateFaction, nil),
		routes.RegisterRoute(http.MethodDelete, "faction-editor/faction/:id", f.deleteFaction, nil),
		routes.RegisterRoute(http.MethodGet, "faction-editor/npc-templates", f.listNpcTemplates, nil),
		routes.RegisterRoute(http.MethodGet, "faction-editor/npc-template/:id", f.getNpcTemplate, nil),
		routes.RegisterRoute(http.MethodPut, "faction-editor/npc-template", f.createNpcTemplate, nil),
		routes.RegisterRoute(http.MethodPatch, "faction-editor/npc-template/:id", f.updateNpcTemplate, nil),
		routes.RegisterRoute(http.MethodDelete, "faction-editor/npc-template/:id", f.deleteNpcTemplate, nil),
		routes.RegisterRoute(http.MethodPost, "faction-editor/npc-template/:id/reassign", f.reassignNpcs, nil),
	}
}

func (f *FactionEditorController) getFreeID(c echo.Context) error {
	kind := c.Param("kind")
	table := ""
	var db *gorm.DB
	switch kind {
	case "faction":
		table = "faction_list"
		db = f.db.Get(models.FactionList{}, c)
	case "npc-template":
		table = "npc_faction"
		db = f.db.Get(models.NpcFaction{}, c)
	default:
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Unknown faction record type"})
	}

	var minimum struct {
		ID int `gorm:"column:id"`
	}
	if err := db.Table(table).Select("COALESCE(MIN(id), 0) AS id").Scan(&minimum).Error; err != nil {
		return factionEditorDatabaseError(c, err)
	}
	if minimum.ID > 1 || minimum.ID == 0 {
		return c.JSON(http.StatusOK, echo.Map{"id": 1})
	}

	var result struct {
		ID int `gorm:"column:id"`
	}
	query := fmt.Sprintf(`
		SELECT current_row.id + 1 AS id
		FROM %s current_row
		LEFT JOIN %s next_row ON next_row.id = current_row.id + 1
		WHERE current_row.id > 0
			AND current_row.id < 2147483647
			AND next_row.id IS NULL
		ORDER BY current_row.id
		LIMIT 1
	`, table, table)
	if err := db.Raw(query).Scan(&result).Error; err != nil {
		return factionEditorDatabaseError(c, err)
	}
	if result.ID <= 0 {
		return c.JSON(http.StatusConflict, echo.Map{"error": "No free positive ID is available"})
	}
	return c.JSON(http.StatusOK, echo.Map{"id": result.ID})
}

func (f *FactionEditorController) listFactions(c echo.Context) error {
	db := f.db.Get(models.FactionList{}, c)
	page, limit := factionEditorPagination(c)
	query := strings.TrimSpace(c.QueryParam("q"))

	baseQuery := db.Table("faction_list AS f")
	if query != "" {
		baseQuery = baseQuery.Where("f.name LIKE ?", "%"+query+"%")
		if id, err := strconv.Atoi(query); err == nil {
			baseQuery = db.Table("faction_list AS f").Where("f.name LIKE ? OR f.id = ?", "%"+query+"%", id)
		}
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		return factionEditorDatabaseError(c, err)
	}

	if c.QueryParam("lookup") == "1" {
		results := make([]factionEditorReference, 0)
		if err := baseQuery.
			Select("f.id, COALESCE(f.name, '') AS name").
			Order("f.name ASC, f.id ASC").
			Scan(&results).Error; err != nil {
			return factionEditorDatabaseError(c, err)
		}
		return c.JSON(http.StatusOK, factionEditorPage{
			Data: results, Total: total, Page: 1, Limit: len(results),
		})
	}

	results := make([]factionEditorFactionSummary, 0)
	err := baseQuery.
		Select(`
			f.id,
			f.name,
			f.base,
			(SELECT COUNT(*) FROM faction_list_mod flm WHERE flm.faction_id = f.id) AS modifier_count,
			(SELECT COUNT(*) FROM npc_faction nf WHERE nf.primaryfaction = f.id) AS npc_template_count,
			(SELECT COUNT(*) FROM npc_faction_entries nfe WHERE nfe.faction_id = f.id) AS npc_standing_count,
			(SELECT COUNT(*) FROM items i WHERE i.factionmod1 = f.id OR i.factionmod2 = f.id OR i.factionmod3 = f.id OR i.factionmod4 = f.id) AS item_reference_count,
			(SELECT COUNT(*) FROM tasks t WHERE t.faction_reward = f.id) AS task_reference_count
		`).
		Order("f.name ASC, f.id ASC").
		Limit(limit).
		Offset((page - 1) * limit).
		Scan(&results).Error
	if err != nil {
		return factionEditorDatabaseError(c, err)
	}

	return c.JSON(http.StatusOK, factionEditorPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (f *FactionEditorController) listNpcTemplates(c echo.Context) error {
	db := f.db.Get(models.NpcFaction{}, c)
	page, limit := factionEditorPagination(c)
	query := strings.TrimSpace(c.QueryParam("q"))

	baseQuery := db.Table("npc_faction AS nf")
	if query != "" {
		baseQuery = baseQuery.Where("nf.name LIKE ?", "%"+query+"%")
		if id, err := strconv.Atoi(query); err == nil {
			baseQuery = db.Table("npc_faction AS nf").Where("nf.name LIKE ? OR nf.id = ?", "%"+query+"%", id)
		}
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		return factionEditorDatabaseError(c, err)
	}

	if c.QueryParam("lookup") == "1" {
		results := make([]factionEditorReference, 0)
		if err := baseQuery.
			Select("nf.id, COALESCE(nf.name, '') AS name").
			Order("nf.name ASC, nf.id ASC").
			Scan(&results).Error; err != nil {
			return factionEditorDatabaseError(c, err)
		}
		return c.JSON(http.StatusOK, factionEditorPage{
			Data: results, Total: total, Page: 1, Limit: len(results),
		})
	}

	results := make([]factionEditorNpcTemplateSummary, 0)
	err := baseQuery.
		Select(`
			nf.id,
			COALESCE(nf.name, '') AS name,
			nf.primaryfaction AS primary_faction,
			COALESCE(fl.name, '') AS primary_name,
			(SELECT COUNT(*) FROM npc_faction_entries nfe WHERE nfe.npc_faction_id = nf.id) AS entry_count,
			(SELECT COUNT(*) FROM npc_types nt WHERE nt.npc_faction_id = nf.id) AS npc_count,
			CASE WHEN nf.ignore_primary_assist > 0 THEN TRUE ELSE FALSE END AS ignore_assist
		`).
		Joins("LEFT JOIN faction_list fl ON fl.id = nf.primaryfaction").
		Order("nf.name ASC, nf.id ASC").
		Limit(limit).
		Offset((page - 1) * limit).
		Scan(&results).Error
	if err != nil {
		return factionEditorDatabaseError(c, err)
	}

	return c.JSON(http.StatusOK, factionEditorPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (f *FactionEditorController) getFaction(c echo.Context) error {
	id, err := factionEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	detail, err := f.loadFaction(c, id)
	if err != nil {
		return factionEditorLoadError(c, err)
	}

	return c.JSON(http.StatusOK, detail)
}

func (f *FactionEditorController) getNpcTemplate(c echo.Context) error {
	id, err := factionEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	detail, err := f.loadNpcTemplate(c, id)
	if err != nil {
		return factionEditorLoadError(c, err)
	}

	return c.JSON(http.StatusOK, detail)
}

func (f *FactionEditorController) createFaction(c echo.Context) error {
	request := new(factionEditorFactionInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid faction payload: %v", err)})
	}
	if err := validateFactionInput(*request, true); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.FactionList{}, c)
	if err := db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Table("faction_list").Where("id = ?", request.ID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return factionEditorConflict("Faction ID %d already exists", request.ID)
		}
		if err := tx.Table("faction_list").Create(map[string]interface{}{
			"id": request.ID, "name": strings.TrimSpace(request.Name), "base": request.Base,
		}).Error; err != nil {
			return err
		}
		return syncFactionChildren(tx, *request)
	}); err != nil {
		return factionEditorMutationError(c, err)
	}

	f.log(c, "CREATE", fmt.Sprintf("Created [Faction] [id = %d] [%s]", request.ID, strings.TrimSpace(request.Name)))
	detail, err := f.loadFaction(c, request.ID)
	if err != nil {
		return factionEditorLoadError(c, err)
	}
	return c.JSON(http.StatusCreated, detail)
}

func (f *FactionEditorController) updateFaction(c echo.Context) error {
	id, err := factionEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(factionEditorFactionInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid faction payload: %v", err)})
	}
	request.ID = id
	if err := validateFactionInput(*request, false); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.FactionList{}, c)
	err = db.Transaction(func(tx *gorm.DB) error {
		result := tx.Table("faction_list").Where("id = ?", id).Updates(map[string]interface{}{
			"name": strings.TrimSpace(request.Name),
			"base": request.Base,
		})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			var count int64
			if countErr := tx.Table("faction_list").Where("id = ?", id).Count(&count).Error; countErr != nil {
				return countErr
			}
			if count == 0 {
				return gorm.ErrRecordNotFound
			}
		}
		return syncFactionChildren(tx, *request)
	})
	if err != nil {
		return factionEditorMutationError(c, err)
	}

	f.log(c, "UPDATE", fmt.Sprintf("Updated [Faction] [id = %d] [%s]", id, strings.TrimSpace(request.Name)))
	detail, err := f.loadFaction(c, id)
	if err != nil {
		return factionEditorLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (f *FactionEditorController) deleteFaction(c echo.Context) error {
	id, err := factionEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	references, err := f.loadFactionReferences(c, id)
	if err != nil {
		return factionEditorDatabaseError(c, err)
	}
	if references.Total() > 0 {
		return c.JSON(http.StatusConflict, echo.Map{
			"error":      "Faction is still referenced and cannot be deleted",
			"references": references,
		})
	}

	db := f.db.Get(models.FactionList{}, c)
	err = db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Table("faction_list").Where("id = ?", id).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return gorm.ErrRecordNotFound
		}
		if err := tx.Table("faction_list_mod").Where("faction_id = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		if err := tx.Table("faction_base_data").Where("client_faction_id = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		return tx.Table("faction_list").Where("id = ?", id).Delete(nil).Error
	})
	if err != nil {
		return factionEditorMutationError(c, err)
	}

	f.log(c, "DELETE", fmt.Sprintf("Deleted [Faction] [id = %d]", id))
	return c.NoContent(http.StatusNoContent)
}

func (f *FactionEditorController) createNpcTemplate(c echo.Context) error {
	request := new(factionEditorNpcTemplateInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid NPC faction template payload: %v", err)})
	}
	if err := validateNpcTemplateInput(*request, true); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.NpcFaction{}, c)
	err := db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Table("npc_faction").Where("id = ?", request.ID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return factionEditorConflict("NPC faction template ID %d already exists", request.ID)
		}
		if err := validateNpcTemplateFactions(tx, *request); err != nil {
			return err
		}
		if err := tx.Table("npc_faction").Create(map[string]interface{}{
			"id":                    request.ID,
			"name":                  strings.TrimSpace(request.Name),
			"primaryfaction":        request.PrimaryFaction,
			"ignore_primary_assist": factionEditorBoolInt(request.IgnorePrimaryAssist),
		}).Error; err != nil {
			return err
		}
		return syncNpcTemplateEntries(tx, *request)
	})
	if err != nil {
		return factionEditorMutationError(c, err)
	}

	f.log(c, "CREATE", fmt.Sprintf("Created [NPC Faction Template] [id = %d] [%s]", request.ID, strings.TrimSpace(request.Name)))
	detail, err := f.loadNpcTemplate(c, request.ID)
	if err != nil {
		return factionEditorLoadError(c, err)
	}
	return c.JSON(http.StatusCreated, detail)
}

func (f *FactionEditorController) updateNpcTemplate(c echo.Context) error {
	id, err := factionEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(factionEditorNpcTemplateInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid NPC faction template payload: %v", err)})
	}
	request.ID = id
	if err := validateNpcTemplateInput(*request, false); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.NpcFaction{}, c)
	err = db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Table("npc_faction").Where("id = ?", id).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return gorm.ErrRecordNotFound
		}
		if err := validateNpcTemplateFactions(tx, *request); err != nil {
			return err
		}
		if err := tx.Table("npc_faction").Where("id = ?", id).Updates(map[string]interface{}{
			"name":                  strings.TrimSpace(request.Name),
			"primaryfaction":        request.PrimaryFaction,
			"ignore_primary_assist": factionEditorBoolInt(request.IgnorePrimaryAssist),
		}).Error; err != nil {
			return err
		}
		return syncNpcTemplateEntries(tx, *request)
	})
	if err != nil {
		return factionEditorMutationError(c, err)
	}

	f.log(c, "UPDATE", fmt.Sprintf("Updated [NPC Faction Template] [id = %d] [%s]", id, strings.TrimSpace(request.Name)))
	detail, err := f.loadNpcTemplate(c, id)
	if err != nil {
		return factionEditorLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (f *FactionEditorController) deleteNpcTemplate(c echo.Context) error {
	id, err := factionEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := f.db.Get(models.NpcFaction{}, c)
	var npcCount int64
	if err := db.Table("npc_types").Where("npc_faction_id = ?", id).Count(&npcCount).Error; err != nil {
		return factionEditorDatabaseError(c, err)
	}
	if npcCount > 0 {
		references, loadErr := f.loadNpcTemplateReferences(db, id)
		if loadErr != nil {
			return factionEditorDatabaseError(c, loadErr)
		}
		return c.JSON(http.StatusConflict, echo.Map{
			"error":      "NPC faction template is assigned to NPCs; reassign them before deleting",
			"references": references,
		})
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Table("npc_faction").Where("id = ?", id).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return gorm.ErrRecordNotFound
		}
		if err := tx.Table("npc_faction_entries").Where("npc_faction_id = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		return tx.Table("npc_faction").Where("id = ?", id).Delete(nil).Error
	})
	if err != nil {
		return factionEditorMutationError(c, err)
	}

	f.log(c, "DELETE", fmt.Sprintf("Deleted [NPC Faction Template] [id = %d]", id))
	return c.NoContent(http.StatusNoContent)
}

func (f *FactionEditorController) reassignNpcs(c echo.Context) error {
	id, err := factionEditorID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(factionEditorReassignRequest)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid NPC reassignment payload: %v", err)})
	}
	if len(request.NpcIDs) == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Select at least one NPC to reassign"})
	}
	if request.TargetNpcFactionID == id {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Choose a different target NPC faction template"})
	}

	db := f.db.Get(models.NpcFaction{}, c)
	var updated int64
	err = db.Transaction(func(tx *gorm.DB) error {
		if request.TargetNpcFactionID != 0 {
			var targetCount int64
			if err := tx.Table("npc_faction").Where("id = ?", request.TargetNpcFactionID).Count(&targetCount).Error; err != nil {
				return err
			}
			if targetCount == 0 {
				return factionEditorConflict("Target NPC faction template %d does not exist", request.TargetNpcFactionID)
			}
		}

		var sourceCount int64
		if err := tx.Table("npc_types").
			Where("id IN ? AND npc_faction_id = ?", request.NpcIDs, id).
			Count(&sourceCount).Error; err != nil {
			return err
		}
		if sourceCount != int64(len(request.NpcIDs)) {
			return factionEditorConflict("One or more selected NPCs are no longer assigned to this template")
		}

		result := tx.Table("npc_types").
			Where("id IN ? AND npc_faction_id = ?", request.NpcIDs, id).
			Update("npc_faction_id", request.TargetNpcFactionID)
		if result.Error != nil {
			return result.Error
		}
		updated = result.RowsAffected
		return nil
	})
	if err != nil {
		return factionEditorMutationError(c, err)
	}

	f.log(c, "UPDATE", fmt.Sprintf(
		"Reassigned [%d] NPCs from [NPC Faction Template %d] to [%d]",
		updated,
		id,
		request.TargetNpcFactionID,
	))
	return c.JSON(http.StatusOK, echo.Map{
		"updated":               updated,
		"target_npc_faction_id": request.TargetNpcFactionID,
	})
}

func (f *FactionEditorController) loadFaction(c echo.Context, id int) (factionEditorFactionDetail, error) {
	db := f.db.Get(models.FactionList{}, c)
	var record struct {
		ID   int    `gorm:"column:id"`
		Name string `gorm:"column:name"`
		Base int16  `gorm:"column:base"`
	}
	err := db.Table("faction_list").Select("id, name, base").Where("id = ?", id).Take(&record).Error
	if err != nil {
		return factionEditorFactionDetail{}, err
	}
	faction := factionEditorFactionInput{
		ID:        record.ID,
		Name:      record.Name,
		Base:      record.Base,
		Modifiers: make([]factionEditorModifier, 0),
	}

	var modifiers []struct {
		ID      uint   `gorm:"column:id"`
		ModName string `gorm:"column:mod_name"`
		Amount  int16  `gorm:"column:mod"`
	}
	if err := db.Table("faction_list_mod").
		Select("id, mod_name, `mod`").
		Where("faction_id = ?", id).
		Order("mod_name ASC").
		Scan(&modifiers).Error; err != nil {
		return factionEditorFactionDetail{}, err
	}
	for _, modifier := range modifiers {
		kind, valueID, parseErr := parseFactionModifierName(modifier.ModName)
		if parseErr != nil {
			kind = "raw"
		}
		faction.Modifiers = append(faction.Modifiers, factionEditorModifier{
			ID: modifier.ID, Kind: kind, ValueID: valueID, Amount: modifier.Amount,
		})
	}

	var baseData factionEditorBaseData
	result := db.Table("faction_base_data").
		Select("min, max, unk_hero1, unk_hero2, unk_hero3").
		Where("client_faction_id = ?", id).
		Take(&baseData)
	if result.Error == nil {
		faction.BaseData = &baseData
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return factionEditorFactionDetail{}, result.Error
	}

	references, err := f.loadFactionReferences(c, id)
	if err != nil {
		return factionEditorFactionDetail{}, err
	}
	return factionEditorFactionDetail{Faction: faction, References: references}, nil
}

func (f *FactionEditorController) loadNpcTemplate(c echo.Context, id int) (factionEditorNpcTemplateDetail, error) {
	db := f.db.Get(models.NpcFaction{}, c)
	var record struct {
		ID                  int    `gorm:"column:id"`
		Name                string `gorm:"column:name"`
		PrimaryFaction      int    `gorm:"column:primaryfaction"`
		IgnorePrimaryAssist int8   `gorm:"column:ignore_primary_assist"`
	}
	err := db.Table("npc_faction").Where("id = ?", id).Take(&record).Error
	if err != nil {
		return factionEditorNpcTemplateDetail{}, err
	}

	template := factionEditorNpcTemplateInput{
		ID:                  record.ID,
		Name:                record.Name,
		PrimaryFaction:      record.PrimaryFaction,
		IgnorePrimaryAssist: record.IgnorePrimaryAssist > 0,
		Entries:             make([]factionEditorNpcEntry, 0),
	}
	if err := db.Table("npc_faction_entries AS nfe").
		Select(`
			nfe.faction_id,
			COALESCE(fl.name, '') AS faction_name,
			nfe.value,
			nfe.npc_value,
			nfe.temp,
			CASE WHEN nfe.temp IN (1, 2) THEN TRUE ELSE FALSE END AS temporary
		`).
		Joins("LEFT JOIN faction_list fl ON fl.id = nfe.faction_id").
		Where("nfe.npc_faction_id = ?", id).
		Order("fl.name ASC, nfe.faction_id ASC").
		Scan(&template.Entries).Error; err != nil {
		return factionEditorNpcTemplateDetail{}, err
	}

	references, err := f.loadNpcTemplateReferences(db, id)
	if err != nil {
		return factionEditorNpcTemplateDetail{}, err
	}
	return factionEditorNpcTemplateDetail{Template: template, References: references}, nil
}

func (f *FactionEditorController) loadFactionReferences(c echo.Context, id int) (factionEditorFactionReferences, error) {
	contentDb := f.db.Get(models.FactionList{}, c)
	defaultDb := f.db.Get(models.FactionValue{}, c)
	references := factionEditorFactionReferences{
		NpcTemplates: make([]factionEditorReference, 0),
		Items:        make([]factionEditorReference, 0),
		Tasks:        make([]factionEditorReference, 0),
	}

	countQueries := []struct {
		db    *gorm.DB
		table string
		where string
		args  []interface{}
		out   *int64
	}{
		{contentDb, "npc_faction", "primaryfaction = ?", []interface{}{id}, &references.NpcTemplatePrimaryCount},
		{contentDb, "npc_faction_entries", "faction_id = ?", []interface{}{id}, &references.NpcStandingCount},
		{contentDb, "items", "factionmod1 = ? OR factionmod2 = ? OR factionmod3 = ? OR factionmod4 = ?", []interface{}{id, id, id, id}, &references.ItemCount},
		{contentDb, "tasks", "faction_reward = ?", []interface{}{id}, &references.TaskCount},
		{defaultDb, "faction_values", "faction_id = ?", []interface{}{id}, &references.CharacterValueCount},
		{defaultDb, "faction_association", "id_1 = ? OR id_2 = ? OR id_3 = ? OR id_4 = ? OR id_5 = ? OR id_6 = ? OR id_7 = ? OR id_8 = ? OR id_9 = ? OR id_10 = ?", []interface{}{id, id, id, id, id, id, id, id, id, id}, &references.AssociationCount},
	}
	for _, query := range countQueries {
		if err := query.db.Table(query.table).Where(query.where, query.args...).Count(query.out).Error; err != nil {
			return references, err
		}
	}

	if err := contentDb.Table("npc_faction AS nf").
		Select("nf.id, COALESCE(nf.name, '') AS name, CASE WHEN nf.primaryfaction = ? THEN 'Primary faction' ELSE 'Standing entry' END AS extra", id).
		Joins("LEFT JOIN npc_faction_entries nfe ON nfe.npc_faction_id = nf.id AND nfe.faction_id = ?", id).
		Where("nf.primaryfaction = ? OR nfe.faction_id = ?", id, id).
		Group("nf.id, nf.name, nf.primaryfaction").
		Order("nf.name ASC").
		Limit(50).
		Scan(&references.NpcTemplates).Error; err != nil {
		return references, err
	}
	if err := contentDb.Table("items").
		Select("id, name").
		Where("factionmod1 = ? OR factionmod2 = ? OR factionmod3 = ? OR factionmod4 = ?", id, id, id, id).
		Order("name ASC").
		Limit(50).
		Scan(&references.Items).Error; err != nil {
		return references, err
	}
	if err := contentDb.Table("tasks").
		Select("id, title AS name").
		Where("faction_reward = ?", id).
		Order("title ASC").
		Limit(50).
		Scan(&references.Tasks).Error; err != nil {
		return references, err
	}

	return references, nil
}

func (f *FactionEditorController) loadNpcTemplateReferences(db *gorm.DB, id int) (factionEditorNpcTemplateReferences, error) {
	references := factionEditorNpcTemplateReferences{
		Npcs: make([]factionEditorNpcAssignment, 0),
	}
	if err := db.Table("npc_types").Where("npc_faction_id = ?", id).Count(&references.NpcCount).Error; err != nil {
		return references, err
	}
	if err := db.Table("npc_types").
		Select("id, name, level, race, class").
		Where("npc_faction_id = ?", id).
		Order("name ASC, id ASC").
		Limit(250).
		Scan(&references.Npcs).Error; err != nil {
		return references, err
	}
	return references, nil
}

func syncFactionChildren(tx *gorm.DB, faction factionEditorFactionInput) error {
	if err := tx.Table("faction_list_mod").Where("faction_id = ?", faction.ID).Delete(nil).Error; err != nil {
		return err
	}
	for _, modifier := range faction.Modifiers {
		modName, err := formatFactionModifierName(modifier.Kind, modifier.ValueID)
		if err != nil {
			return err
		}
		if err := tx.Table("faction_list_mod").Create(map[string]interface{}{
			"faction_id": faction.ID,
			"mod":        modifier.Amount,
			"mod_name":   modName,
		}).Error; err != nil {
			return err
		}
	}

	if faction.BaseData == nil {
		return tx.Table("faction_base_data").Where("client_faction_id = ?", faction.ID).Delete(nil).Error
	}
	if faction.ID > 32767 {
		return factionEditorConflict("Faction IDs above 32767 cannot have client faction bounds")
	}
	values := map[string]interface{}{
		"client_faction_id": faction.ID,
		"min":               faction.BaseData.Min,
		"max":               faction.BaseData.Max,
		"unk_hero1":         faction.BaseData.UnkHero1,
		"unk_hero2":         faction.BaseData.UnkHero2,
		"unk_hero3":         faction.BaseData.UnkHero3,
	}
	var count int64
	if err := tx.Table("faction_base_data").Where("client_faction_id = ?", faction.ID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return tx.Table("faction_base_data").Create(values).Error
	}
	delete(values, "client_faction_id")
	return tx.Table("faction_base_data").Where("client_faction_id = ?", faction.ID).Updates(values).Error
}

func syncNpcTemplateEntries(tx *gorm.DB, template factionEditorNpcTemplateInput) error {
	if err := tx.Table("npc_faction_entries").Where("npc_faction_id = ?", template.ID).Delete(nil).Error; err != nil {
		return err
	}
	for _, entry := range template.Entries {
		if err := tx.Table("npc_faction_entries").Create(map[string]interface{}{
			"npc_faction_id": template.ID,
			"faction_id":     entry.FactionID,
			"value":          entry.Value,
			"npc_value":      entry.NpcValue,
			"temp":           factionEditorNpcEntryTemp(entry),
		}).Error; err != nil {
			return err
		}
	}
	return nil
}

func factionEditorNpcEntryTemp(entry factionEditorNpcEntry) int8 {
	if entry.Temp == 0 && entry.Temporary {
		return 1
	}
	return entry.Temp
}

func validateNpcTemplateFactions(tx *gorm.DB, template factionEditorNpcTemplateInput) error {
	ids := make([]int, 0, len(template.Entries)+1)
	if template.PrimaryFaction > 0 {
		ids = append(ids, template.PrimaryFaction)
	}
	for _, entry := range template.Entries {
		ids = append(ids, int(entry.FactionID))
	}
	if len(ids) == 0 {
		return nil
	}
	var count int64
	if err := tx.Table("faction_list").Where("id IN ?", ids).Distinct("id").Count(&count).Error; err != nil {
		return err
	}
	unique := make(map[int]struct{}, len(ids))
	for _, id := range ids {
		unique[id] = struct{}{}
	}
	if count != int64(len(unique)) {
		return factionEditorConflict("One or more selected player factions no longer exist")
	}
	return nil
}

func validateFactionInput(faction factionEditorFactionInput, creating bool) error {
	if creating && faction.ID <= 0 {
		return errors.New("Faction ID must be greater than zero")
	}
	if strings.TrimSpace(faction.Name) == "" {
		return errors.New("Faction name is required")
	}
	seen := make(map[string]bool)
	for _, modifier := range faction.Modifiers {
		name, err := formatFactionModifierName(modifier.Kind, modifier.ValueID)
		if err != nil {
			return err
		}
		if seen[name] {
			return fmt.Errorf("Duplicate modifier %s", name)
		}
		seen[name] = true
	}
	if faction.BaseData != nil && faction.BaseData.Min != nil && faction.BaseData.Max != nil &&
		*faction.BaseData.Min > *faction.BaseData.Max {
		return errors.New("Client faction minimum cannot be greater than maximum")
	}
	return nil
}

func validateNpcTemplateInput(template factionEditorNpcTemplateInput, creating bool) error {
	if creating && template.ID <= 0 {
		return errors.New("NPC faction template ID must be greater than zero")
	}
	if strings.TrimSpace(template.Name) == "" {
		return errors.New("NPC faction template name is required")
	}
	if template.PrimaryFaction < 0 {
		return errors.New("Primary faction cannot be negative")
	}
	seen := make(map[uint]bool)
	for _, entry := range template.Entries {
		if entry.FactionID == 0 {
			return errors.New("Every standing entry must select a player faction")
		}
		if seen[entry.FactionID] {
			return fmt.Errorf("Player faction %d appears more than once", entry.FactionID)
		}
		seen[entry.FactionID] = true
	}
	return nil
}

func formatFactionModifierName(kind string, valueID int) (string, error) {
	prefix := ""
	switch strings.ToLower(strings.TrimSpace(kind)) {
	case "race":
		prefix = "r"
	case "class":
		prefix = "c"
	case "deity":
		prefix = "d"
	default:
		return "", fmt.Errorf("Modifier type must be race, class, or deity")
	}
	if valueID <= 0 {
		return "", fmt.Errorf("%s modifier ID must be greater than zero", strings.Title(strings.ToLower(kind)))
	}
	return fmt.Sprintf("%s%d", prefix, valueID), nil
}

func parseFactionModifierName(name string) (string, int, error) {
	if len(name) < 2 {
		return "", 0, fmt.Errorf("Invalid faction modifier name %q", name)
	}
	kind := ""
	switch strings.ToLower(name[:1]) {
	case "r":
		kind = "race"
	case "c":
		kind = "class"
	case "d":
		kind = "deity"
	default:
		return "", 0, fmt.Errorf("Invalid faction modifier name %q", name)
	}
	valueID, err := strconv.Atoi(name[1:])
	if err != nil || valueID <= 0 {
		return "", 0, fmt.Errorf("Invalid faction modifier name %q", name)
	}
	return kind, valueID, nil
}

func factionEditorPagination(c echo.Context) (int, int) {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = factionEditorDefaultPageSize
	}
	if limit > factionEditorMaxPageSize {
		limit = factionEditorMaxPageSize
	}
	return page, limit
}

func factionEditorID(c echo.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, errors.New("Faction ID must be a positive integer")
	}
	return id, nil
}

type factionEditorConflictError struct {
	message string
}

func (e factionEditorConflictError) Error() string {
	return e.message
}

func factionEditorConflict(format string, args ...interface{}) error {
	return factionEditorConflictError{message: fmt.Sprintf(format, args...)}
}

func factionEditorMutationError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Faction record was not found"})
	}
	var conflict factionEditorConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	return factionEditorDatabaseError(c, err)
}

func factionEditorLoadError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Faction record was not found"})
	}
	return factionEditorDatabaseError(c, err)
}

func factionEditorDatabaseError(c echo.Context, err error) error {
	return c.JSON(http.StatusInternalServerError, echo.Map{"error": fmt.Sprintf("Faction editor database error: %v", err)})
}

func factionEditorBoolInt(value bool) int8 {
	if value {
		return 1
	}
	return 0
}

func (f *FactionEditorController) log(c echo.Context, eventName string, description string) {
	if f.db.GetSpireDb() != nil {
		f.auditLog.LogUserEvent(c, eventName, description)
	}
}
