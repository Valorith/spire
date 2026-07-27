package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
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
	inventoryKeyringDefaultPageSize = 30
	inventoryKeyringMaxPageSize     = 100
	inventoryKeyringReasonMinLength = 8
	inventoryKeyringReasonMaxLength = 240
	inventoryStorageCharacter       = "character"
	inventoryStorageSharedBank      = "shared_bank"
)

const (
	inventoryKeyringEventInventoryCreate = "INVENTORY_KEYRING_INVENTORY_CREATE"
	inventoryKeyringEventInventoryUpdate = "INVENTORY_KEYRING_INVENTORY_UPDATE"
	inventoryKeyringEventInventoryDelete = "INVENTORY_KEYRING_INVENTORY_DELETE"
	inventoryKeyringEventKeyCreate       = "INVENTORY_KEYRING_KEY_CREATE"
	inventoryKeyringEventKeyUpdate       = "INVENTORY_KEYRING_KEY_UPDATE"
	inventoryKeyringEventKeyDelete       = "INVENTORY_KEYRING_KEY_DELETE"
)

type InventoryKeyringController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type inventoryKeyringPage struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type inventoryKeyringSummary struct {
	CharactersWithInventory int64 `json:"characters_with_inventory"`
	InventoryItems          int64 `json:"inventory_items"`
	KeyringCharacters       int64 `json:"keyring_characters"`
	KeyringEntries          int64 `json:"keyring_entries"`
	SnapshotCharacters      int64 `json:"snapshot_characters"`
	SnapshotSets            int64 `json:"snapshot_sets"`
}

type inventoryKeyringCharacterSummary struct {
	ID             int    `json:"id"`
	AccountID      int    `json:"account_id"`
	AccountName    string `json:"account_name"`
	Name           string `json:"name"`
	Level          int    `json:"level"`
	Class          int    `json:"class"`
	Race           int    `json:"race"`
	Online         bool   `json:"online"`
	InventoryCount int64  `json:"inventory_count"`
	KeyCount       int64  `json:"key_count"`
	SnapshotCount  int64  `json:"snapshot_count"`
}

type inventoryKeyringItem struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	Icon            int    `json:"icon"`
	ItemClass       int    `json:"item_class"`
	ItemType        int    `json:"item_type"`
	Slots           int64  `json:"slots"`
	Stackable       bool   `json:"stackable"`
	StackSize       int    `json:"stack_size"`
	MaxCharges      int    `json:"max_charges"`
	BagSlots        int    `json:"bag_slots"`
	BagSize         int    `json:"bag_size"`
	BagType         int    `json:"bag_type"`
	Size            int    `json:"size"`
	NoDrop          bool   `json:"no_drop"`
	NoRent          bool   `json:"no_rent"`
	Attuneable      bool   `json:"attuneable"`
	AugmentTypeMask int64  `json:"augment_type_mask"`
	AugmentRestrict int    `json:"augment_restrict"`
	AugmentSlots    []int  `json:"augment_slots"`
}

type inventoryKeyringSlot struct {
	ID          int    `json:"id"`
	Label       string `json:"label"`
	Group       string `json:"group"`
	ParentSlot  *int   `json:"parent_slot,omitempty"`
	BagIndex    *int   `json:"bag_index,omitempty"`
	Known       bool   `json:"known"`
	Selectable  bool   `json:"selectable"`
	Description string `json:"description"`
}

type inventoryKeyringRecord struct {
	CharacterID       int                       `json:"character_id"`
	AccountID         int                       `json:"account_id"`
	StorageKind       string                    `json:"storage_kind"`
	SlotID            int                       `json:"slot_id"`
	Slot              inventoryKeyringSlot      `json:"slot"`
	ItemID            int                       `json:"item_id"`
	Item              inventoryKeyringItem      `json:"item"`
	Charges           int                       `json:"charges"`
	Color             uint                      `json:"color"`
	Augments          []inventoryKeyringAugment `json:"augments"`
	InstanceNoDrop    bool                      `json:"instance_no_drop"`
	CustomData        string                    `json:"custom_data"`
	OrnamentIcon      uint                      `json:"ornament_icon"`
	OrnamentIDFile    uint                      `json:"ornament_id_file"`
	OrnamentHeroModel int                       `json:"ornament_hero_model"`
	GUID              uint64                    `json:"guid"`
	ContainerContents int64                     `json:"container_contents"`
	Evolving          *inventoryKeyringEvolving `json:"evolving,omitempty"`
}

type inventoryKeyringEvolving struct {
	ID             uint64  `json:"id"`
	Activated      bool    `json:"activated"`
	Equipped       bool    `json:"equipped"`
	CurrentAmount  int64   `json:"current_amount"`
	Progression    float64 `json:"progression"`
	RequiredAmount int64   `json:"required_amount"`
	Type           int     `json:"type"`
	SubType        string  `json:"sub_type"`
	FinalItemID    int     `json:"final_item_id"`
	FinalItemName  string  `json:"final_item_name"`
}

type inventoryKeyringAugment struct {
	Socket int                   `json:"socket"`
	ItemID int                   `json:"item_id"`
	Item   *inventoryKeyringItem `json:"item,omitempty"`
}

type inventoryKeyringKey struct {
	ID     int                  `json:"id"`
	CharID int                  `json:"char_id"`
	ItemID int                  `json:"item_id"`
	Item   inventoryKeyringItem `json:"item"`
}

type inventoryKeyringSnapshotSummary struct {
	TimeIndex int64 `json:"time_index"`
	ItemCount int64 `json:"item_count"`
}

type inventoryKeyringCharacterDetail struct {
	Character inventoryKeyringCharacterSummary  `json:"character"`
	Inventory []inventoryKeyringRecord          `json:"inventory"`
	Keyring   []inventoryKeyringKey             `json:"keyring"`
	Snapshots []inventoryKeyringSnapshotSummary `json:"snapshots"`
	Slots     []inventoryKeyringSlot            `json:"slots"`
}

type inventoryKeyringMutationRequest struct {
	ItemID            int    `json:"item_id"`
	SlotID            int    `json:"slot_id"`
	TargetSlotID      *int   `json:"target_slot_id"`
	Charges           int    `json:"charges"`
	Color             uint   `json:"color"`
	Augments          []int  `json:"augments"`
	InstanceNoDrop    bool   `json:"instance_no_drop"`
	CustomData        string `json:"custom_data"`
	OrnamentIcon      uint   `json:"ornament_icon"`
	OrnamentIDFile    uint   `json:"ornament_id_file"`
	OrnamentHeroModel int    `json:"ornament_hero_model"`
	Reason            string `json:"reason"`
	Confirmation      string `json:"confirmation"`
}

type inventoryKeyringKeyMutationRequest struct {
	ItemID       int    `json:"item_id"`
	Reason       string `json:"reason"`
	Confirmation string `json:"confirmation"`
}

type inventoryKeyringSnapshotRecord struct {
	TimeIndex         int64                     `json:"time_index"`
	SlotID            int                       `json:"slot_id"`
	Slot              inventoryKeyringSlot      `json:"slot"`
	ItemID            int                       `json:"item_id"`
	Item              inventoryKeyringItem      `json:"item"`
	Charges           int                       `json:"charges"`
	InstanceNoDrop    bool                      `json:"instance_no_drop"`
	CustomData        string                    `json:"custom_data"`
	OrnamentIcon      uint                      `json:"ornament_icon"`
	OrnamentIDFile    uint                      `json:"ornament_id_file"`
	OrnamentHeroModel int                       `json:"ornament_hero_model"`
	GUID              uint64                    `json:"guid"`
	Augments          []inventoryKeyringAugment `json:"augments"`
}

type inventoryKeyringConflictError struct {
	message string
}

func (e inventoryKeyringConflictError) Error() string {
	return e.message
}

func NewInventoryKeyringController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *InventoryKeyringController {
	return &InventoryKeyringController{db: db, auditLog: auditLog}
}

func (i *InventoryKeyringController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "inventory-keyring/summary", i.summary, nil),
		routes.RegisterRoute(http.MethodGet, "inventory-keyring/characters", i.listCharacters, nil),
		routes.RegisterRoute(http.MethodGet, "inventory-keyring/character/:id", i.getCharacter, nil),
		routes.RegisterRoute(http.MethodGet, "inventory-keyring/character/:id/snapshot/:time_index", i.getSnapshot, nil),
		routes.RegisterRoute(http.MethodGet, "inventory-keyring/lookup/items", i.lookupItems, nil),
		routes.RegisterRoute(http.MethodPost, "inventory-keyring/character/:id/inventory", i.createInventory, nil),
		routes.RegisterRoute(http.MethodPatch, "inventory-keyring/character/:id/inventory/:slot", i.updateInventory, nil),
		routes.RegisterRoute(http.MethodDelete, "inventory-keyring/character/:id/inventory/:slot", i.deleteInventory, nil),
		routes.RegisterRoute(http.MethodPost, "inventory-keyring/character/:id/keyring", i.createKey, nil),
		routes.RegisterRoute(http.MethodPatch, "inventory-keyring/character/:id/keyring/:key_id", i.updateKey, nil),
		routes.RegisterRoute(http.MethodDelete, "inventory-keyring/character/:id/keyring/:key_id", i.deleteKey, nil),
	}
}

func (i *InventoryKeyringController) summary(c echo.Context) error {
	db := i.db.Get(models.Inventory{}, c)
	var result inventoryKeyringSummary
	queries := []struct {
		query string
		dest  *int64
	}{
		{"SELECT COUNT(DISTINCT character_id) FROM inventory", &result.CharactersWithInventory},
		{"SELECT (SELECT COUNT(*) FROM inventory) + (SELECT COUNT(*) FROM sharedbank)", &result.InventoryItems},
		{"SELECT COUNT(DISTINCT char_id) FROM keyring", &result.KeyringCharacters},
		{"SELECT COUNT(*) FROM keyring", &result.KeyringEntries},
		{"SELECT COUNT(DISTINCT charid) FROM inventory_snapshots", &result.SnapshotCharacters},
		{"SELECT COUNT(*) FROM (SELECT charid, time_index FROM inventory_snapshots GROUP BY charid, time_index) snapshot_sets", &result.SnapshotSets},
	}
	for _, query := range queries {
		if err := db.Raw(query.query).Scan(query.dest).Error; err != nil {
			return inventoryKeyringDatabaseError(c, err)
		}
	}
	return c.JSON(http.StatusOK, result)
}

func (i *InventoryKeyringController) listCharacters(c echo.Context) error {
	db := i.db.Get(models.CharacterDatum{}, c)
	page, limit := inventoryKeyringPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	state := strings.ToLower(strings.TrimSpace(c.QueryParam("state")))
	base := db.Table("character_data ch").Joins("LEFT JOIN account a ON a.id = ch.account_id").
		Where("ch.deleted_at IS NULL")
	if search != "" {
		like := "%" + search + "%"
		base = base.Where("ch.name LIKE ? OR a.name LIKE ? OR CAST(ch.id AS CHAR) LIKE ?", like, like, like)
	}
	switch state {
	case "inventory":
		base = base.Where("EXISTS (SELECT 1 FROM inventory inv WHERE inv.character_id = ch.id) OR EXISTS (SELECT 1 FROM sharedbank sb WHERE sb.account_id = ch.account_id)")
	case "keyring":
		base = base.Where("EXISTS (SELECT 1 FROM keyring kr WHERE kr.char_id = ch.id)")
	case "snapshots":
		base = base.Where("EXISTS (SELECT 1 FROM inventory_snapshots snap WHERE snap.charid = ch.id)")
	case "empty":
		base = base.Where("NOT EXISTS (SELECT 1 FROM inventory inv WHERE inv.character_id = ch.id) AND NOT EXISTS (SELECT 1 FROM sharedbank sb WHERE sb.account_id = ch.account_id) AND NOT EXISTS (SELECT 1 FROM keyring kr WHERE kr.char_id = ch.id)")
	}
	var total int64
	if err := base.Session(&gorm.Session{}).Distinct("ch.id").Count(&total).Error; err != nil {
		return inventoryKeyringDatabaseError(c, err)
	}
	results := make([]inventoryKeyringCharacterSummary, 0)
	if err := base.Session(&gorm.Session{}).Select(`
		ch.id,
		ch.account_id,
		COALESCE(a.name, CONCAT('Unknown account #', ch.account_id)) AS account_name,
		ch.name,
		ch.level,
		ch.class,
		ch.race,
		ch.ingame = 1 AS online,
		((SELECT COUNT(*) FROM inventory inv WHERE inv.character_id = ch.id) +
		 (SELECT COUNT(*) FROM sharedbank sb WHERE sb.account_id = ch.account_id)) AS inventory_count,
		(SELECT COUNT(*) FROM keyring kr WHERE kr.char_id = ch.id) AS key_count,
		(SELECT COUNT(DISTINCT snap.time_index) FROM inventory_snapshots snap WHERE snap.charid = ch.id) AS snapshot_count
	`).Order("ch.name, ch.id").Limit(limit).Offset((page - 1) * limit).Scan(&results).Error; err != nil {
		return inventoryKeyringDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, inventoryKeyringPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (i *InventoryKeyringController) getCharacter(c echo.Context) error {
	id, err := inventoryKeyringPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := loadInventoryKeyringCharacter(i.db.Get(models.CharacterDatum{}, c), id)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (i *InventoryKeyringController) getSnapshot(c echo.Context) error {
	characterID, err := inventoryKeyringPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	timeIndex, err := strconv.ParseInt(c.Param("time_index"), 10, 64)
	if err != nil || timeIndex <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Snapshot time index must be a positive integer"})
	}
	db := i.db.Get(models.InventorySnapshot{}, c)
	var characterCount int64
	if err := db.Table("character_data").Where("id = ?", characterID).Count(&characterCount).Error; err != nil {
		return inventoryKeyringDatabaseError(c, err)
	}
	if characterCount == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Character not found"})
	}
	var rows []inventoryKeyringRawSnapshot
	if err := db.Table("inventory_snapshots snap").
		Select(inventoryKeyringSnapshotSelect).
		Joins("LEFT JOIN items item ON item.id = snap.itemid").
		Where("snap.charid = ? AND snap.time_index = ?", characterID, timeIndex).
		Order("snap.slotid").Scan(&rows).Error; err != nil {
		return inventoryKeyringDatabaseError(c, err)
	}
	if len(rows) == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Snapshot not found"})
	}
	records, err := hydrateInventoryKeyringSnapshots(db, rows)
	if err != nil {
		return inventoryKeyringDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{"time_index": timeIndex, "items": records})
}

func (i *InventoryKeyringController) lookupItems(c echo.Context) error {
	db := i.db.Get(models.Item{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	if len(search) < 2 {
		if _, err := strconv.Atoi(search); err != nil {
			return c.JSON(http.StatusOK, []inventoryKeyringItem{})
		}
	}
	query := db.Table("items").Select(inventoryKeyringItemSelect)
	if exactID, err := strconv.Atoi(search); err == nil && exactID > 0 {
		query = query.Where("id = ? OR Name LIKE ?", exactID, "%"+search+"%")
	} else {
		query = query.Where("Name LIKE ?", "%"+search+"%")
	}
	if strings.EqualFold(c.QueryParam("kind"), "augment") {
		query = query.Where("augtype > 0")
	}
	var rows []InventoryKeyringRawItem
	if err := query.Order("Name, id").Limit(30).Scan(&rows).Error; err != nil {
		return inventoryKeyringDatabaseError(c, err)
	}
	items := make([]inventoryKeyringItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, row.item())
	}
	return c.JSON(http.StatusOK, items)
}

func (i *InventoryKeyringController) createInventory(c echo.Context) error {
	characterID, err := inventoryKeyringPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request inventoryKeyringMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid inventory payload"})
	}
	if err := validateInventoryKeyringMutationRequest(request, false); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := i.db.Get(models.Inventory{}, c)
	accountID, err := inventoryKeyringAccountID(db, characterID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	item, err := loadInventoryKeyringItem(db, request.ItemID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Item", err)
	}
	payload := map[string]interface{}{
		"action": "create", "character_id": characterID, "slot_id": request.SlotID,
		"storage": inventoryKeyringStorageKind(request.SlotID), "item_id": request.ItemID,
		"item_name": item.Name, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := i.writeAudit(c, inventoryKeyringEventInventoryCreate, payload)
	if err != nil {
		return inventoryKeyringAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		storageKind := inventoryKeyringStorageKind(request.SlotID)
		if _, err := inventoryKeyringLockEditableStorage(tx, characterID, storageKind == inventoryStorageSharedBank); err != nil {
			return err
		}
		if err := validateInventoryKeyringDestination(tx, characterID, accountID, request.SlotID, item, request.Charges, request.Augments, -1); err != nil {
			return err
		}
		values := inventoryKeyringInventoryValues(characterID, accountID, request.SlotID, request)
		if err := tx.Table(inventoryKeyringStorageTable(storageKind)).Create(values).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		i.discardAudit(c, auditID)
		return inventoryKeyringMutationError(c, err)
	}
	detail, err := loadInventoryKeyringCharacter(db, characterID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"detail": detail, "audit_id": auditID})
}

func (i *InventoryKeyringController) updateInventory(c echo.Context) error {
	characterID, err := inventoryKeyringPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	sourceSlot, err := inventoryKeyringPositiveOrZeroParam(c, "slot", "Inventory slot")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request inventoryKeyringMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid inventory payload"})
	}
	if request.TargetSlotID == nil {
		request.TargetSlotID = &sourceSlot
	}
	if err := validateInventoryKeyringMutationRequest(request, true); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := i.db.Get(models.Inventory{}, c)
	accountID, err := inventoryKeyringAccountID(db, characterID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	before, err := loadInventoryKeyringRecord(db, characterID, sourceSlot)
	if err != nil {
		return inventoryKeyringLoadError(c, "Inventory item", err)
	}
	item, err := loadInventoryKeyringItem(db, request.ItemID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Item", err)
	}
	payload := map[string]interface{}{
		"action": "update", "character_id": characterID, "source_slot_id": sourceSlot,
		"source_storage": inventoryKeyringStorageKind(sourceSlot),
		"target_slot_id": *request.TargetSlotID, "target_storage": inventoryKeyringStorageKind(*request.TargetSlotID),
		"before": before, "after": request,
		"reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := i.writeAudit(c, inventoryKeyringEventInventoryUpdate, payload)
	if err != nil {
		return inventoryKeyringAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		targetSlot := *request.TargetSlotID
		sourceStorage := inventoryKeyringStorageKind(sourceSlot)
		targetStorage := inventoryKeyringStorageKind(targetSlot)
		if _, err := inventoryKeyringLockEditableStorage(
			tx,
			characterID,
			sourceStorage == inventoryStorageSharedBank || targetStorage == inventoryStorageSharedBank,
		); err != nil {
			return err
		}
		var locked struct {
			SlotID int `gorm:"column:slot_id"`
		}
		if err := inventoryKeyringStorageScope(tx, sourceStorage, characterID, accountID).
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("slot_id").Where("slot_id = ?", sourceSlot).Take(&locked).Error; err != nil {
			return err
		}
		ignoreSlot := -1
		if sourceStorage == targetStorage {
			ignoreSlot = sourceSlot
		}
		if err := validateInventoryKeyringDestination(tx, characterID, accountID, targetSlot, item, request.Charges, request.Augments, ignoreSlot); err != nil {
			return err
		}
		children, err := inventoryKeyringContainerChildren(tx, characterID, accountID, sourceSlot)
		if err != nil {
			return err
		}
		if sourceSlot != targetSlot && len(children) > 0 {
			if err := inventoryKeyringMoveContainerChildren(tx, characterID, accountID, sourceSlot, targetSlot, children); err != nil {
				return err
			}
		}
		values := inventoryKeyringInventoryValues(characterID, accountID, targetSlot, request)
		delete(values, "character_id")
		delete(values, "account_id")
		if sourceStorage == targetStorage {
			if err := inventoryKeyringStorageScope(tx, sourceStorage, characterID, accountID).
				Where("slot_id = ?", sourceSlot).Updates(values).Error; err != nil {
				return err
			}
		} else {
			if len(children) > 0 {
				return inventoryKeyringConflict("Move or remove this container's contents before changing its storage scope")
			}
			targetValues := inventoryKeyringInventoryValues(characterID, accountID, targetSlot, request)
			if err := tx.Table(inventoryKeyringStorageTable(targetStorage)).Create(targetValues).Error; err != nil {
				return err
			}
			if err := inventoryKeyringStorageScope(tx, sourceStorage, characterID, accountID).
				Where("slot_id = ?", sourceSlot).Delete(nil).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		i.discardAudit(c, auditID)
		return inventoryKeyringMutationError(c, err)
	}
	detail, err := loadInventoryKeyringCharacter(db, characterID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (i *InventoryKeyringController) deleteInventory(c echo.Context) error {
	characterID, err := inventoryKeyringPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	slotID, err := inventoryKeyringPositiveOrZeroParam(c, "slot", "Inventory slot")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request inventoryKeyringMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid deletion payload"})
	}
	if err := validateInventoryKeyringReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := i.db.Get(models.Inventory{}, c)
	accountID, err := inventoryKeyringAccountID(db, characterID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	before, err := loadInventoryKeyringRecord(db, characterID, slotID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Inventory item", err)
	}
	expectedConfirmation := fmt.Sprintf("REMOVE %s", before.Item.Name)
	if request.Confirmation != expectedConfirmation {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Type %q to confirm removal", expectedConfirmation)})
	}
	payload := map[string]interface{}{
		"action": "delete", "character_id": characterID, "slot_id": slotID,
		"storage": inventoryKeyringStorageKind(slotID), "record": before,
		"reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := i.writeAudit(c, inventoryKeyringEventInventoryDelete, payload)
	if err != nil {
		return inventoryKeyringAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		storageKind := inventoryKeyringStorageKind(slotID)
		if _, err := inventoryKeyringLockEditableStorage(tx, characterID, storageKind == inventoryStorageSharedBank); err != nil {
			return err
		}
		var locked struct {
			SlotID int `gorm:"column:slot_id"`
		}
		if err := inventoryKeyringStorageScope(tx, storageKind, characterID, accountID).
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("slot_id").Where("slot_id = ?", slotID).Take(&locked).Error; err != nil {
			return err
		}
		children, err := inventoryKeyringContainerChildren(tx, characterID, accountID, slotID)
		if err != nil {
			return err
		}
		if len(children) > 0 {
			return inventoryKeyringConflict("Move or remove the %d item(s) inside this container before removing it", len(children))
		}
		return inventoryKeyringStorageScope(tx, storageKind, characterID, accountID).
			Where("slot_id = ?", slotID).Delete(nil).Error
	}); err != nil {
		i.discardAudit(c, auditID)
		return inventoryKeyringMutationError(c, err)
	}
	detail, err := loadInventoryKeyringCharacter(db, characterID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (i *InventoryKeyringController) createKey(c echo.Context) error {
	return i.mutateKey(c, "create")
}

func (i *InventoryKeyringController) updateKey(c echo.Context) error {
	return i.mutateKey(c, "update")
}

func (i *InventoryKeyringController) deleteKey(c echo.Context) error {
	return i.mutateKey(c, "delete")
}

func (i *InventoryKeyringController) mutateKey(c echo.Context, action string) error {
	characterID, err := inventoryKeyringPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	keyID := 0
	if action != "create" {
		keyID, err = inventoryKeyringPositiveParam(c, "key_id", "Key")
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
	}
	var request inventoryKeyringKeyMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid keyring payload"})
	}
	if err := validateInventoryKeyringReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := i.db.Get(models.Keyring{}, c)
	var before *inventoryKeyringKey
	if action != "create" {
		record, loadErr := loadInventoryKeyringKey(db, characterID, keyID)
		if loadErr != nil {
			return inventoryKeyringLoadError(c, "Keyring entry", loadErr)
		}
		before = &record
	}
	itemID := request.ItemID
	if action == "delete" && before != nil {
		itemID = before.ItemID
		expectedConfirmation := fmt.Sprintf("REMOVE %s", before.Item.Name)
		if request.Confirmation != expectedConfirmation {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Type %q to confirm key removal", expectedConfirmation)})
		}
	}
	if itemID <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Select a key item"})
	}
	item, err := loadInventoryKeyringItem(db, itemID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Item", err)
	}
	event := map[string]string{
		"create": inventoryKeyringEventKeyCreate,
		"update": inventoryKeyringEventKeyUpdate,
		"delete": inventoryKeyringEventKeyDelete,
	}[action]
	payload := map[string]interface{}{
		"action": action, "character_id": characterID, "key_id": keyID,
		"item_id": itemID, "item_name": item.Name, "before": before,
		"reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := i.writeAudit(c, event, payload)
	if err != nil {
		return inventoryKeyringAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := inventoryKeyringLockEditableCharacter(tx, characterID); err != nil {
			return err
		}
		if action != "delete" {
			var duplicate int64
			duplicateQuery := tx.Table("keyring").Where("char_id = ? AND item_id = ?", characterID, itemID)
			if action == "update" {
				duplicateQuery = duplicateQuery.Where("id <> ?", keyID)
			}
			if err := duplicateQuery.Count(&duplicate).Error; err != nil {
				return err
			}
			if duplicate > 0 {
				return inventoryKeyringConflict("%s is already on this character's keyring", item.Name)
			}
		}
		switch action {
		case "create":
			return tx.Table("keyring").Create(map[string]interface{}{"char_id": characterID, "item_id": itemID}).Error
		case "update":
			var locked struct{ ID int }
			if err := tx.Table("keyring").Clauses(clause.Locking{Strength: "UPDATE"}).
				Select("id").Where("id = ? AND char_id = ?", keyID, characterID).Take(&locked).Error; err != nil {
				return err
			}
			return tx.Table("keyring").Where("id = ? AND char_id = ?", keyID, characterID).Update("item_id", itemID).Error
		case "delete":
			var locked struct{ ID int }
			if err := tx.Table("keyring").Clauses(clause.Locking{Strength: "UPDATE"}).
				Select("id").Where("id = ? AND char_id = ?", keyID, characterID).Take(&locked).Error; err != nil {
				return err
			}
			return tx.Table("keyring").Where("id = ? AND char_id = ?", keyID, characterID).Delete(nil).Error
		}
		return nil
	}); err != nil {
		i.discardAudit(c, auditID)
		return inventoryKeyringMutationError(c, err)
	}
	detail, err := loadInventoryKeyringCharacter(db, characterID)
	if err != nil {
		return inventoryKeyringLoadError(c, "Character", err)
	}
	status := http.StatusOK
	if action == "create" {
		status = http.StatusCreated
	}
	return c.JSON(status, echo.Map{"detail": detail, "audit_id": auditID})
}

const inventoryKeyringItemSelect = `
	id,
	Name AS name,
	icon,
	itemclass AS item_class,
	itemtype AS item_type,
	slots,
	stackable,
	stacksize AS stack_size,
	maxcharges AS max_charges,
	bagslots AS bag_slots,
	bagsize AS bag_size,
	bagtype AS bag_type,
	size,
	nodrop AS no_drop,
	norent AS no_rent,
	attuneable,
	augtype AS augment_type_mask,
	augrestrict AS augment_restrict,
	augslot1type,
	augslot2type,
	augslot3type,
	augslot4type,
	augslot5type,
	augslot6type
`

type InventoryKeyringRawItem struct {
	ID              int    `gorm:"column:id"`
	Name            string `gorm:"column:name"`
	Icon            int    `gorm:"column:icon"`
	ItemClass       int    `gorm:"column:item_class"`
	ItemType        int    `gorm:"column:item_type"`
	Slots           int64  `gorm:"column:slots"`
	Stackable       int    `gorm:"column:stackable"`
	StackSize       int    `gorm:"column:stack_size"`
	MaxCharges      int    `gorm:"column:max_charges"`
	BagSlots        int    `gorm:"column:bag_slots"`
	BagSize         int    `gorm:"column:bag_size"`
	BagType         int    `gorm:"column:bag_type"`
	Size            int    `gorm:"column:size"`
	NoDrop          int    `gorm:"column:no_drop"`
	NoRent          int    `gorm:"column:no_rent"`
	Attuneable      int    `gorm:"column:attuneable"`
	AugmentTypeMask int64  `gorm:"column:augment_type_mask"`
	AugmentRestrict int    `gorm:"column:augment_restrict"`
	Augslot1Type    int    `gorm:"column:augslot1type"`
	Augslot2Type    int    `gorm:"column:augslot2type"`
	Augslot3Type    int    `gorm:"column:augslot3type"`
	Augslot4Type    int    `gorm:"column:augslot4type"`
	Augslot5Type    int    `gorm:"column:augslot5type"`
	Augslot6Type    int    `gorm:"column:augslot6type"`
}

func (r InventoryKeyringRawItem) item() inventoryKeyringItem {
	return inventoryKeyringItem{
		ID: r.ID, Name: r.Name, Icon: r.Icon, ItemClass: r.ItemClass, ItemType: r.ItemType, Slots: r.Slots,
		Stackable: r.Stackable > 0, StackSize: r.StackSize, MaxCharges: r.MaxCharges,
		BagSlots: r.BagSlots, BagSize: r.BagSize, BagType: r.BagType, Size: r.Size,
		NoDrop: r.NoDrop == 0, NoRent: r.NoRent == 0, Attuneable: r.Attuneable > 0,
		AugmentTypeMask: r.AugmentTypeMask, AugmentRestrict: r.AugmentRestrict,
		AugmentSlots: []int{r.Augslot1Type, r.Augslot2Type, r.Augslot3Type, r.Augslot4Type, r.Augslot5Type, r.Augslot6Type},
	}
}

type inventoryKeyringRawInventory struct {
	CharacterID       int    `gorm:"column:character_id"`
	AccountID         int    `gorm:"column:account_id"`
	StorageKind       string `gorm:"column:storage_kind"`
	SlotID            int    `gorm:"column:slot_id"`
	ItemID            int    `gorm:"column:item_id"`
	Charges           int    `gorm:"column:charges"`
	Color             uint   `gorm:"column:color"`
	AugmentOne        int    `gorm:"column:augment_one"`
	AugmentTwo        int    `gorm:"column:augment_two"`
	AugmentThree      int    `gorm:"column:augment_three"`
	AugmentFour       int    `gorm:"column:augment_four"`
	AugmentFive       int    `gorm:"column:augment_five"`
	AugmentSix        int    `gorm:"column:augment_six"`
	InstanceNoDrop    int    `gorm:"column:instance_no_drop"`
	CustomData        string `gorm:"column:custom_data"`
	OrnamentIcon      uint   `gorm:"column:ornament_icon"`
	OrnamentIDFile    uint   `gorm:"column:ornament_id_file"`
	OrnamentHeroModel int    `gorm:"column:ornament_hero_model"`
	GUID              uint64 `gorm:"column:guid"`
	InventoryKeyringRawItem
}

const inventoryKeyringInventorySelect = `
	inv.character_id,
	0 AS account_id,
	'character' AS storage_kind,
	inv.slot_id,
	COALESCE(inv.item_id, 0) AS item_id,
	COALESCE(inv.charges, 0) AS charges,
	inv.color,
	inv.augment_one,
	inv.augment_two,
	inv.augment_three,
	inv.augment_four,
	inv.augment_five,
	inv.augment_six,
	inv.instnodrop AS instance_no_drop,
	COALESCE(inv.custom_data, '') AS custom_data,
	inv.ornament_icon,
	inv.ornament_idfile AS ornament_id_file,
	inv.ornament_hero_model,
	COALESCE(inv.guid, 0) AS guid,
	item.id,
	COALESCE(item.Name, CONCAT('Unknown item #', inv.item_id)) AS name,
	COALESCE(item.icon, 0) AS icon,
	COALESCE(item.itemclass, 0) AS item_class,
	COALESCE(item.itemtype, 0) AS item_type,
	COALESCE(item.slots, 0) AS slots,
	COALESCE(item.stackable, 0) AS stackable,
	COALESCE(item.stacksize, 0) AS stack_size,
	COALESCE(item.maxcharges, 0) AS max_charges,
	COALESCE(item.bagslots, 0) AS bag_slots,
	COALESCE(item.bagsize, 0) AS bag_size,
	COALESCE(item.bagtype, 0) AS bag_type,
	COALESCE(item.size, 0) AS size,
	COALESCE(item.nodrop, 1) AS no_drop,
	COALESCE(item.norent, 1) AS no_rent,
	COALESCE(item.attuneable, 0) AS attuneable,
	COALESCE(item.augtype, 0) AS augment_type_mask,
	COALESCE(item.augrestrict, 0) AS augment_restrict,
	COALESCE(item.augslot1type, 0) AS augslot1type,
	COALESCE(item.augslot2type, 0) AS augslot2type,
	COALESCE(item.augslot3type, 0) AS augslot3type,
	COALESCE(item.augslot4type, 0) AS augslot4type,
	COALESCE(item.augslot5type, 0) AS augslot5type,
	COALESCE(item.augslot6type, 0) AS augslot6type
`

const inventoryKeyringSharedBankSelect = `
	0 AS character_id,
	sb.account_id,
	'shared_bank' AS storage_kind,
	sb.slot_id,
	sb.item_id,
	sb.charges,
	sb.color,
	sb.augment_one,
	sb.augment_two,
	sb.augment_three,
	sb.augment_four,
	sb.augment_five,
	sb.augment_six,
	0 AS instance_no_drop,
	COALESCE(sb.custom_data, '') AS custom_data,
	sb.ornament_icon,
	sb.ornament_idfile AS ornament_id_file,
	sb.ornament_hero_model,
	COALESCE(sb.guid, 0) AS guid,
	item.id,
	COALESCE(item.Name, CONCAT('Unknown item #', sb.item_id)) AS name,
	COALESCE(item.icon, 0) AS icon,
	COALESCE(item.itemclass, 0) AS item_class,
	COALESCE(item.itemtype, 0) AS item_type,
	COALESCE(item.slots, 0) AS slots,
	COALESCE(item.stackable, 0) AS stackable,
	COALESCE(item.stacksize, 0) AS stack_size,
	COALESCE(item.maxcharges, 0) AS max_charges,
	COALESCE(item.bagslots, 0) AS bag_slots,
	COALESCE(item.bagsize, 0) AS bag_size,
	COALESCE(item.bagtype, 0) AS bag_type,
	COALESCE(item.size, 0) AS size,
	COALESCE(item.nodrop, 1) AS no_drop,
	COALESCE(item.norent, 1) AS no_rent,
	COALESCE(item.attuneable, 0) AS attuneable,
	COALESCE(item.augtype, 0) AS augment_type_mask,
	COALESCE(item.augrestrict, 0) AS augment_restrict,
	COALESCE(item.augslot1type, 0) AS augslot1type,
	COALESCE(item.augslot2type, 0) AS augslot2type,
	COALESCE(item.augslot3type, 0) AS augslot3type,
	COALESCE(item.augslot4type, 0) AS augslot4type,
	COALESCE(item.augslot5type, 0) AS augslot5type,
	COALESCE(item.augslot6type, 0) AS augslot6type
`

type inventoryKeyringRawSnapshot struct {
	TimeIndex int64 `gorm:"column:time_index"`
	inventoryKeyringRawInventory
}

const inventoryKeyringSnapshotSelect = `
	snap.time_index,
	snap.charid AS character_id,
	snap.slotid AS slot_id,
	COALESCE(snap.itemid, 0) AS item_id,
	COALESCE(snap.charges, 0) AS charges,
	snap.color,
	snap.augslot1 AS augment_one,
	snap.augslot2 AS augment_two,
	snap.augslot3 AS augment_three,
	snap.augslot4 AS augment_four,
	COALESCE(snap.augslot5, 0) AS augment_five,
	COALESCE(snap.augslot6, 0) AS augment_six,
	snap.instnodrop AS instance_no_drop,
	COALESCE(snap.custom_data, '') AS custom_data,
	snap.ornamenticon AS ornament_icon,
	snap.ornamentidfile AS ornament_id_file,
	snap.ornament_hero_model,
	COALESCE(snap.guid, 0) AS guid,
	item.id,
	COALESCE(item.Name, CONCAT('Unknown item #', snap.itemid)) AS name,
	COALESCE(item.icon, 0) AS icon,
	COALESCE(item.itemclass, 0) AS item_class,
	COALESCE(item.itemtype, 0) AS item_type,
	COALESCE(item.slots, 0) AS slots,
	COALESCE(item.stackable, 0) AS stackable,
	COALESCE(item.stacksize, 0) AS stack_size,
	COALESCE(item.maxcharges, 0) AS max_charges,
	COALESCE(item.bagslots, 0) AS bag_slots,
	COALESCE(item.bagsize, 0) AS bag_size,
	COALESCE(item.bagtype, 0) AS bag_type,
	COALESCE(item.size, 0) AS size,
	COALESCE(item.nodrop, 1) AS no_drop,
	COALESCE(item.norent, 1) AS no_rent,
	COALESCE(item.attuneable, 0) AS attuneable,
	COALESCE(item.augtype, 0) AS augment_type_mask,
	COALESCE(item.augrestrict, 0) AS augment_restrict,
	COALESCE(item.augslot1type, 0) AS augslot1type,
	COALESCE(item.augslot2type, 0) AS augslot2type,
	COALESCE(item.augslot3type, 0) AS augslot3type,
	COALESCE(item.augslot4type, 0) AS augslot4type,
	COALESCE(item.augslot5type, 0) AS augslot5type,
	COALESCE(item.augslot6type, 0) AS augslot6type
`

func loadInventoryKeyringCharacter(db *gorm.DB, id int) (*inventoryKeyringCharacterDetail, error) {
	var character inventoryKeyringCharacterSummary
	if err := db.Table("character_data ch").Joins("LEFT JOIN account a ON a.id = ch.account_id").Select(`
		ch.id,
		ch.account_id,
		COALESCE(a.name, CONCAT('Unknown account #', ch.account_id)) AS account_name,
		ch.name,
		ch.level,
		ch.class,
		ch.race,
		ch.ingame = 1 AS online,
		((SELECT COUNT(*) FROM inventory inv WHERE inv.character_id = ch.id) +
		 (SELECT COUNT(*) FROM sharedbank sb WHERE sb.account_id = ch.account_id)) AS inventory_count,
		(SELECT COUNT(*) FROM keyring kr WHERE kr.char_id = ch.id) AS key_count,
		(SELECT COUNT(DISTINCT snap.time_index) FROM inventory_snapshots snap WHERE snap.charid = ch.id) AS snapshot_count
	`).Where("ch.id = ? AND ch.deleted_at IS NULL", id).Take(&character).Error; err != nil {
		return nil, err
	}
	var rows []inventoryKeyringRawInventory
	if err := db.Table("inventory inv").Select(inventoryKeyringInventorySelect).
		Joins("LEFT JOIN items item ON item.id = inv.item_id").
		Where("inv.character_id = ?", id).Order("inv.slot_id").Scan(&rows).Error; err != nil {
		return nil, err
	}
	for index := range rows {
		rows[index].AccountID = character.AccountID
		rows[index].StorageKind = inventoryStorageCharacter
	}
	var sharedRows []inventoryKeyringRawInventory
	if err := db.Table("sharedbank sb").Select(inventoryKeyringSharedBankSelect).
		Joins("LEFT JOIN items item ON item.id = sb.item_id").
		Where("sb.account_id = ?", character.AccountID).Order("sb.slot_id").Scan(&sharedRows).Error; err != nil {
		return nil, err
	}
	for index := range sharedRows {
		sharedRows[index].CharacterID = character.ID
		sharedRows[index].AccountID = character.AccountID
		sharedRows[index].StorageKind = inventoryStorageSharedBank
	}
	rows = append(rows, sharedRows...)
	sort.SliceStable(rows, func(a, b int) bool {
		return rows[a].SlotID < rows[b].SlotID
	})
	inventory, err := hydrateInventoryKeyringRows(db, rows)
	if err != nil {
		return nil, err
	}
	var evolvingRows []struct {
		ID             uint64  `gorm:"column:id"`
		ItemID         int     `gorm:"column:item_id"`
		Activated      int     `gorm:"column:activated"`
		Equipped       int     `gorm:"column:equipped"`
		CurrentAmount  int64   `gorm:"column:current_amount"`
		Progression    float64 `gorm:"column:progression"`
		RequiredAmount int64   `gorm:"column:required_amount"`
		Type           int     `gorm:"column:type"`
		SubType        string  `gorm:"column:sub_type"`
		FinalItemID    int     `gorm:"column:final_item_id"`
		FinalItemName  string  `gorm:"column:final_item_name"`
	}
	if err := db.Table("character_evolving_items evolving").Select(`
		evolving.id,
		COALESCE(evolving.item_id, 0) AS item_id,
		COALESCE(evolving.activated, 0) AS activated,
		COALESCE(evolving.equipped, 0) AS equipped,
		COALESCE(evolving.current_amount, 0) AS current_amount,
		COALESCE(evolving.progression, 0) AS progression,
		COALESCE(details.required_amount, 0) AS required_amount,
		COALESCE(details.type, 0) AS type,
		COALESCE(details.sub_type, '') AS sub_type,
		COALESCE(evolving.final_item_id, 0) AS final_item_id,
		COALESCE(final_item.Name, CONCAT('Item #', evolving.final_item_id)) AS final_item_name
	`).Joins("LEFT JOIN items_evolving_details details ON details.item_id = evolving.item_id").
		Joins("LEFT JOIN items final_item ON final_item.id = evolving.final_item_id").
		Where("evolving.character_id = ? AND evolving.deleted_at IS NULL", id).
		Scan(&evolvingRows).Error; err != nil {
		return nil, err
	}
	evolvingByItem := map[int]*inventoryKeyringEvolving{}
	for _, row := range evolvingRows {
		evolvingByItem[row.ItemID] = &inventoryKeyringEvolving{
			ID: row.ID, Activated: row.Activated > 0, Equipped: row.Equipped > 0,
			CurrentAmount: row.CurrentAmount, Progression: row.Progression,
			RequiredAmount: row.RequiredAmount, Type: row.Type, SubType: row.SubType,
			FinalItemID: row.FinalItemID, FinalItemName: row.FinalItemName,
		}
	}
	for index := range inventory {
		if inventory[index].StorageKind == inventoryStorageCharacter {
			inventory[index].Evolving = evolvingByItem[inventory[index].ItemID]
		}
	}
	var rawKeys []struct {
		ID     int `gorm:"column:id"`
		CharID int `gorm:"column:char_id"`
		ItemID int `gorm:"column:item_id"`
		InventoryKeyringRawItem
	}
	if err := db.Table("keyring kr").Select(`
		kr.id, kr.char_id, kr.item_id,
		item.id, COALESCE(item.Name, CONCAT('Unknown item #', kr.item_id)) AS name,
		COALESCE(item.icon, 0) AS icon, COALESCE(item.itemclass, 0) AS item_class,
		COALESCE(item.itemtype, 0) AS item_type, COALESCE(item.slots, 0) AS slots,
		COALESCE(item.stackable, 0) AS stackable, COALESCE(item.stacksize, 0) AS stack_size,
		COALESCE(item.maxcharges, 0) AS max_charges, COALESCE(item.bagslots, 0) AS bag_slots,
		COALESCE(item.bagsize, 0) AS bag_size, COALESCE(item.bagtype, 0) AS bag_type,
		COALESCE(item.size, 0) AS size, COALESCE(item.nodrop, 1) AS no_drop,
		COALESCE(item.norent, 1) AS no_rent, COALESCE(item.attuneable, 0) AS attuneable,
		COALESCE(item.augtype, 0) AS augment_type_mask, COALESCE(item.augrestrict, 0) AS augment_restrict,
		COALESCE(item.augslot1type, 0) AS augslot1type, COALESCE(item.augslot2type, 0) AS augslot2type,
		COALESCE(item.augslot3type, 0) AS augslot3type, COALESCE(item.augslot4type, 0) AS augslot4type,
		COALESCE(item.augslot5type, 0) AS augslot5type, COALESCE(item.augslot6type, 0) AS augslot6type
	`).Joins("LEFT JOIN items item ON item.id = kr.item_id").
		Where("kr.char_id = ?", id).Order("item.Name, kr.id").Scan(&rawKeys).Error; err != nil {
		return nil, err
	}
	keys := make([]inventoryKeyringKey, 0, len(rawKeys))
	for _, row := range rawKeys {
		keys = append(keys, inventoryKeyringKey{ID: row.ID, CharID: row.CharID, ItemID: row.ItemID, Item: row.InventoryKeyringRawItem.item()})
	}
	snapshots := make([]inventoryKeyringSnapshotSummary, 0)
	if err := db.Table("inventory_snapshots").Select("time_index, COUNT(*) AS item_count").
		Where("charid = ?", id).Group("time_index").Order("time_index DESC").Limit(30).Scan(&snapshots).Error; err != nil {
		return nil, err
	}
	slots := inventoryKeyringSlotOptions(inventory)
	return &inventoryKeyringCharacterDetail{Character: character, Inventory: inventory, Keyring: keys, Snapshots: snapshots, Slots: slots}, nil
}

func hydrateInventoryKeyringRows(db *gorm.DB, rows []inventoryKeyringRawInventory) ([]inventoryKeyringRecord, error) {
	augmentIDs := make([]int, 0)
	for _, row := range rows {
		for _, id := range []int{row.AugmentOne, row.AugmentTwo, row.AugmentThree, row.AugmentFour, row.AugmentFive, row.AugmentSix} {
			if id > 0 {
				augmentIDs = append(augmentIDs, id)
			}
		}
	}
	augmentItems, err := loadInventoryKeyringItemsByID(db, augmentIDs)
	if err != nil {
		return nil, err
	}
	records := make([]inventoryKeyringRecord, 0, len(rows))
	for _, row := range rows {
		augments := make([]inventoryKeyringAugment, 0, 6)
		for index, id := range []int{row.AugmentOne, row.AugmentTwo, row.AugmentThree, row.AugmentFour, row.AugmentFive, row.AugmentSix} {
			augment := inventoryKeyringAugment{Socket: index + 1, ItemID: id}
			if item, ok := augmentItems[id]; ok {
				itemCopy := item
				augment.Item = &itemCopy
			}
			augments = append(augments, augment)
		}
		children, childErr := inventoryKeyringContainerChildren(db, row.CharacterID, row.AccountID, row.SlotID)
		if childErr != nil {
			return nil, childErr
		}
		records = append(records, inventoryKeyringRecord{
			CharacterID: row.CharacterID, AccountID: row.AccountID, StorageKind: row.StorageKind,
			SlotID: row.SlotID, Slot: inventoryKeyringDescribeSlot(row.SlotID),
			ItemID: row.ItemID, Item: row.InventoryKeyringRawItem.item(), Charges: row.Charges, Color: row.Color,
			Augments: augments, InstanceNoDrop: row.InstanceNoDrop > 0, CustomData: row.CustomData,
			OrnamentIcon: row.OrnamentIcon, OrnamentIDFile: row.OrnamentIDFile,
			OrnamentHeroModel: row.OrnamentHeroModel, GUID: row.GUID, ContainerContents: int64(len(children)),
		})
	}
	return records, nil
}

func hydrateInventoryKeyringSnapshots(db *gorm.DB, rows []inventoryKeyringRawSnapshot) ([]inventoryKeyringSnapshotRecord, error) {
	baseRows := make([]inventoryKeyringRawInventory, 0, len(rows))
	for _, row := range rows {
		baseRows = append(baseRows, row.inventoryKeyringRawInventory)
	}
	hydrated, err := hydrateInventoryKeyringRowsWithoutChildren(db, baseRows)
	if err != nil {
		return nil, err
	}
	records := make([]inventoryKeyringSnapshotRecord, 0, len(rows))
	for index, row := range rows {
		record := hydrated[index]
		records = append(records, inventoryKeyringSnapshotRecord{
			TimeIndex: row.TimeIndex, SlotID: record.SlotID, Slot: record.Slot, ItemID: record.ItemID,
			Item: record.Item, Charges: record.Charges, InstanceNoDrop: record.InstanceNoDrop,
			CustomData: record.CustomData, OrnamentIcon: record.OrnamentIcon,
			OrnamentIDFile: record.OrnamentIDFile, OrnamentHeroModel: record.OrnamentHeroModel,
			GUID: record.GUID, Augments: record.Augments,
		})
	}
	return records, nil
}

func hydrateInventoryKeyringRowsWithoutChildren(db *gorm.DB, rows []inventoryKeyringRawInventory) ([]inventoryKeyringRecord, error) {
	augmentIDs := make([]int, 0)
	for _, row := range rows {
		augmentIDs = append(augmentIDs, row.AugmentOne, row.AugmentTwo, row.AugmentThree, row.AugmentFour, row.AugmentFive, row.AugmentSix)
	}
	items, err := loadInventoryKeyringItemsByID(db, augmentIDs)
	if err != nil {
		return nil, err
	}
	records := make([]inventoryKeyringRecord, 0, len(rows))
	for _, row := range rows {
		augments := make([]inventoryKeyringAugment, 0, 6)
		for index, id := range []int{row.AugmentOne, row.AugmentTwo, row.AugmentThree, row.AugmentFour, row.AugmentFive, row.AugmentSix} {
			augment := inventoryKeyringAugment{Socket: index + 1, ItemID: id}
			if item, ok := items[id]; ok {
				copyItem := item
				augment.Item = &copyItem
			}
			augments = append(augments, augment)
		}
		records = append(records, inventoryKeyringRecord{
			CharacterID: row.CharacterID, AccountID: row.AccountID, StorageKind: row.StorageKind,
			SlotID: row.SlotID, Slot: inventoryKeyringDescribeSlot(row.SlotID),
			ItemID: row.ItemID, Item: row.InventoryKeyringRawItem.item(), Charges: row.Charges, Color: row.Color,
			Augments: augments, InstanceNoDrop: row.InstanceNoDrop > 0, CustomData: row.CustomData,
			OrnamentIcon: row.OrnamentIcon, OrnamentIDFile: row.OrnamentIDFile,
			OrnamentHeroModel: row.OrnamentHeroModel, GUID: row.GUID,
		})
	}
	return records, nil
}

func loadInventoryKeyringRecord(db *gorm.DB, characterID, slotID int) (inventoryKeyringRecord, error) {
	accountID, err := inventoryKeyringAccountID(db, characterID)
	if err != nil {
		return inventoryKeyringRecord{}, err
	}
	var rows []inventoryKeyringRawInventory
	if inventoryKeyringStorageKind(slotID) == inventoryStorageSharedBank {
		if err := db.Table("sharedbank sb").Select(inventoryKeyringSharedBankSelect).
			Joins("LEFT JOIN items item ON item.id = sb.item_id").
			Where("sb.account_id = ? AND sb.slot_id = ?", accountID, slotID).Limit(1).Scan(&rows).Error; err != nil {
			return inventoryKeyringRecord{}, err
		}
	} else {
		if err := db.Table("inventory inv").Select(inventoryKeyringInventorySelect).
			Joins("LEFT JOIN items item ON item.id = inv.item_id").
			Where("inv.character_id = ? AND inv.slot_id = ?", characterID, slotID).Limit(1).Scan(&rows).Error; err != nil {
			return inventoryKeyringRecord{}, err
		}
	}
	if len(rows) == 0 {
		return inventoryKeyringRecord{}, gorm.ErrRecordNotFound
	}
	rows[0].CharacterID = characterID
	rows[0].AccountID = accountID
	rows[0].StorageKind = inventoryKeyringStorageKind(slotID)
	records, err := hydrateInventoryKeyringRows(db, rows)
	if err != nil {
		return inventoryKeyringRecord{}, err
	}
	return records[0], nil
}

func loadInventoryKeyringKey(db *gorm.DB, characterID, keyID int) (inventoryKeyringKey, error) {
	var row struct {
		ID     int `gorm:"column:id"`
		CharID int `gorm:"column:char_id"`
		ItemID int `gorm:"column:item_id"`
		InventoryKeyringRawItem
	}
	if err := db.Table("keyring kr").Select(`
		kr.id, kr.char_id, kr.item_id,
		item.id, COALESCE(item.Name, CONCAT('Unknown item #', kr.item_id)) AS name,
		COALESCE(item.icon, 0) AS icon, COALESCE(item.itemclass, 0) AS item_class,
		COALESCE(item.itemtype, 0) AS item_type, COALESCE(item.slots, 0) AS slots,
		COALESCE(item.stackable, 0) AS stackable, COALESCE(item.stacksize, 0) AS stack_size,
		COALESCE(item.maxcharges, 0) AS max_charges, COALESCE(item.bagslots, 0) AS bag_slots,
		COALESCE(item.bagsize, 0) AS bag_size, COALESCE(item.bagtype, 0) AS bag_type,
		COALESCE(item.size, 0) AS size, COALESCE(item.nodrop, 1) AS no_drop,
		COALESCE(item.norent, 1) AS no_rent, COALESCE(item.attuneable, 0) AS attuneable,
		COALESCE(item.augtype, 0) AS augment_type_mask, COALESCE(item.augrestrict, 0) AS augment_restrict,
		COALESCE(item.augslot1type, 0) AS augslot1type, COALESCE(item.augslot2type, 0) AS augslot2type,
		COALESCE(item.augslot3type, 0) AS augslot3type, COALESCE(item.augslot4type, 0) AS augslot4type,
		COALESCE(item.augslot5type, 0) AS augslot5type, COALESCE(item.augslot6type, 0) AS augslot6type
	`).Joins("LEFT JOIN items item ON item.id = kr.item_id").
		Where("kr.id = ? AND kr.char_id = ?", keyID, characterID).Take(&row).Error; err != nil {
		return inventoryKeyringKey{}, err
	}
	return inventoryKeyringKey{ID: row.ID, CharID: row.CharID, ItemID: row.ItemID, Item: row.InventoryKeyringRawItem.item()}, nil
}

func loadInventoryKeyringItem(db *gorm.DB, id int) (inventoryKeyringItem, error) {
	var row InventoryKeyringRawItem
	if err := db.Table("items").Select(inventoryKeyringItemSelect).Where("id = ?", id).Take(&row).Error; err != nil {
		return inventoryKeyringItem{}, err
	}
	return row.item(), nil
}

func loadInventoryKeyringItemsByID(db *gorm.DB, ids []int) (map[int]inventoryKeyringItem, error) {
	unique := make([]int, 0)
	seen := map[int]bool{}
	for _, id := range ids {
		if id > 0 && !seen[id] {
			seen[id] = true
			unique = append(unique, id)
		}
	}
	result := map[int]inventoryKeyringItem{}
	if len(unique) == 0 {
		return result, nil
	}
	var rows []InventoryKeyringRawItem
	if err := db.Table("items").Select(inventoryKeyringItemSelect).Where("id IN ?", unique).Scan(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.ID] = row.item()
	}
	return result, nil
}

func validateInventoryKeyringMutationRequest(request inventoryKeyringMutationRequest, updating bool) error {
	if request.ItemID <= 0 {
		return errors.New("select an item")
	}
	slotID := request.SlotID
	if updating && request.TargetSlotID != nil {
		slotID = *request.TargetSlotID
	}
	if slotID < 0 {
		return errors.New("select a valid destination slot")
	}
	if request.Charges < 0 || request.Charges > 65535 {
		return errors.New("charges must be between 0 and 65,535")
	}
	if len(request.Augments) > 6 {
		return errors.New("inventory items support at most six augment sockets")
	}
	if len(request.CustomData) > 4096 {
		return errors.New("custom data cannot exceed 4,096 characters")
	}
	return validateInventoryKeyringReason(request.Reason)
}

func validateInventoryKeyringReason(reason string) error {
	reason = strings.TrimSpace(reason)
	if len(reason) < inventoryKeyringReasonMinLength {
		return fmt.Errorf("audit reason must be at least %d characters", inventoryKeyringReasonMinLength)
	}
	if len(reason) > inventoryKeyringReasonMaxLength {
		return fmt.Errorf("audit reason cannot exceed %d characters", inventoryKeyringReasonMaxLength)
	}
	return nil
}

func validateInventoryKeyringDestination(
	tx *gorm.DB,
	characterID int,
	accountID int,
	slotID int,
	item inventoryKeyringItem,
	charges int,
	augmentIDs []int,
	ignoreSlot int,
) error {
	if err := validateInventoryKeyringItemPlacement(slotID, item, charges); err != nil {
		return err
	}
	var occupied int64
	storageKind := inventoryKeyringStorageKind(slotID)
	occupiedQuery := inventoryKeyringStorageScope(tx, storageKind, characterID, accountID).Where("slot_id = ?", slotID)
	if ignoreSlot != slotID {
		if err := occupiedQuery.Count(&occupied).Error; err != nil {
			return err
		}
		if occupied > 0 {
			return inventoryKeyringConflict("%s is already occupied", inventoryKeyringDescribeSlot(slotID).Label)
		}
	}
	slot := inventoryKeyringDescribeSlot(slotID)
	if slot.ParentSlot != nil {
		var parent struct {
			ItemID   int `gorm:"column:item_id"`
			BagSlots int `gorm:"column:bag_slots"`
			BagSize  int `gorm:"column:bag_size"`
		}
		parentStorage := inventoryKeyringStorageKind(*slot.ParentSlot)
		parentTable := "inventory inv"
		parentOwnerClause := "inv.character_id = ?"
		parentOwnerID := characterID
		if parentStorage == inventoryStorageSharedBank {
			parentTable = "sharedbank inv"
			parentOwnerClause = "inv.account_id = ?"
			parentOwnerID = accountID
		}
		if err := tx.Table(parentTable).Select("inv.item_id, COALESCE(item.bagslots, 0) AS bag_slots, COALESCE(item.bagsize, 0) AS bag_size").
			Joins("LEFT JOIN items item ON item.id = inv.item_id").
			Where(parentOwnerClause+" AND inv.slot_id = ?", parentOwnerID, *slot.ParentSlot).Take(&parent).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return inventoryKeyringConflict("%s has no parent container", slot.Label)
			}
			return err
		}
		if slot.BagIndex == nil || parent.BagSlots <= *slot.BagIndex {
			return inventoryKeyringConflict("The container in %s does not expose %s", inventoryKeyringDescribeSlot(*slot.ParentSlot).Label, slot.Label)
		}
		if parent.BagSize > 0 && item.Size > parent.BagSize {
			return inventoryKeyringConflict("%s is too large for the container in %s", item.Name, inventoryKeyringDescribeSlot(*slot.ParentSlot).Label)
		}
	}
	augmentItems, err := loadInventoryKeyringItemsByID(tx, augmentIDs)
	if err != nil {
		return err
	}
	for index := 0; index < len(augmentIDs) && index < 6; index++ {
		augmentID := augmentIDs[index]
		if augmentID <= 0 {
			continue
		}
		augment, ok := augmentItems[augmentID]
		if !ok {
			return inventoryKeyringConflict("Augment item #%d does not exist", augmentID)
		}
		socketType := 0
		if index < len(item.AugmentSlots) {
			socketType = item.AugmentSlots[index]
		}
		if socketType <= 0 {
			return inventoryKeyringConflict("%s has no augment socket %d", item.Name, index+1)
		}
		if augment.AugmentTypeMask <= 0 || augment.AugmentTypeMask&(int64(1)<<uint(socketType-1)) == 0 {
			return inventoryKeyringConflict("%s is not compatible with %s socket %d (type %d)", augment.Name, item.Name, index+1, socketType)
		}
		if !inventoryKeyringAugmentRestrictionAllows(item.ItemType, augment.AugmentRestrict) {
			return inventoryKeyringConflict("%s cannot be applied to %s because of its augment restriction", augment.Name, item.Name)
		}
	}
	return nil
}

func validateInventoryKeyringItemPlacement(slotID int, item inventoryKeyringItem, charges int) error {
	if slotID < 0 {
		return inventoryKeyringConflict("Select a valid destination slot")
	}
	slot := inventoryKeyringDescribeSlot(slotID)
	if slot.Group == "Equipment" && slotID <= 22 && item.Slots&(int64(1)<<uint(slotID)) == 0 {
		return inventoryKeyringConflict("%s cannot be equipped in %s", item.Name, slot.Label)
	}
	if item.Stackable && item.StackSize > 0 && charges > item.StackSize {
		return inventoryKeyringConflict("%s supports at most %d charges per stack", item.Name, item.StackSize)
	}
	return nil
}

func inventoryKeyringAugmentRestrictionAllows(itemType int, restriction int) bool {
	switch restriction {
	case 0:
		return true
	case 1:
		return itemType == 10
	case 2:
		return itemType == 0 || itemType == 1 || itemType == 2 || itemType == 3 ||
			itemType == 4 || itemType == 5 || itemType == 35 || itemType == 45
	case 3:
		return itemType == 0 || itemType == 2 || itemType == 3 || itemType == 45
	case 4:
		return itemType == 1 || itemType == 4 || itemType == 35
	case 5:
		return itemType == 0
	case 6:
		return itemType == 3
	case 7:
		return itemType == 2
	case 8:
		return itemType == 45
	case 9:
		return itemType == 1
	case 10:
		return itemType == 4
	case 11:
		return itemType == 35
	case 12:
		return itemType == 5
	case 13:
		return itemType == 8
	case 14:
		return itemType == 0 || itemType == 3 || itemType == 45
	case 15:
		return itemType == 3 || itemType == 45
	default:
		return false
	}
}

func inventoryKeyringAccountID(db *gorm.DB, characterID int) (int, error) {
	var accountID int
	if err := db.Table("character_data").Select("account_id").Where("id = ? AND deleted_at IS NULL", characterID).Scan(&accountID).Error; err != nil {
		return 0, err
	}
	if accountID <= 0 {
		return 0, gorm.ErrRecordNotFound
	}
	return accountID, nil
}

func inventoryKeyringStorageKind(slotID int) string {
	if slotID >= 2500 && slotID <= 2501 {
		return inventoryStorageSharedBank
	}
	for parentSlot := 2500; parentSlot <= 2501; parentSlot++ {
		for _, childRange := range inventoryKeyringChildRanges(parentSlot) {
			if slotID >= childRange.begin && slotID <= childRange.end {
				return inventoryStorageSharedBank
			}
		}
	}
	return inventoryStorageCharacter
}

func inventoryKeyringStorageScope(db *gorm.DB, storageKind string, characterID, accountID int) *gorm.DB {
	if storageKind == inventoryStorageSharedBank {
		return db.Table("sharedbank").Where("account_id = ?", accountID)
	}
	return db.Table("inventory").Where("character_id = ?", characterID)
}

func inventoryKeyringStorageTable(storageKind string) string {
	if storageKind == inventoryStorageSharedBank {
		return "sharedbank"
	}
	return "inventory"
}

func inventoryKeyringInventoryValues(characterID, accountID, slotID int, request inventoryKeyringMutationRequest) map[string]interface{} {
	augments := append([]int{}, request.Augments...)
	for len(augments) < 6 {
		augments = append(augments, 0)
	}
	values := map[string]interface{}{
		"slot_id": slotID, "item_id": request.ItemID,
		"charges": request.Charges, "color": request.Color,
		"augment_one": augments[0], "augment_two": augments[1], "augment_three": augments[2],
		"augment_four": augments[3], "augment_five": augments[4], "augment_six": augments[5],
		"custom_data":   strings.TrimSpace(request.CustomData),
		"ornament_icon": request.OrnamentIcon, "ornament_idfile": request.OrnamentIDFile,
		"ornament_hero_model": request.OrnamentHeroModel,
	}
	if inventoryKeyringStorageKind(slotID) == inventoryStorageSharedBank {
		values["account_id"] = accountID
	} else {
		values["character_id"] = characterID
		values["instnodrop"] = boolInt(request.InstanceNoDrop)
	}
	return values
}

func inventoryKeyringLockEditableCharacter(tx *gorm.DB, characterID int) error {
	var character struct {
		ID      int        `gorm:"column:id"`
		InGame  bool       `gorm:"column:ingame"`
		Deleted *time.Time `gorm:"column:deleted_at"`
	}
	if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("id, ingame, deleted_at").Where("id = ?", characterID).Take(&character).Error; err != nil {
		return err
	}
	if character.Deleted != nil {
		return inventoryKeyringConflict("Restore this character before changing inventory")
	}
	if character.InGame {
		return inventoryKeyringConflict("This character is online. Log them out before changing inventory or keyring data")
	}
	return nil
}

func inventoryKeyringLockEditableStorage(tx *gorm.DB, characterID int, includesSharedBank bool) (int, error) {
	if err := inventoryKeyringLockEditableCharacter(tx, characterID); err != nil {
		return 0, err
	}
	accountID, err := inventoryKeyringAccountID(tx, characterID)
	if err != nil {
		return 0, err
	}
	if !includesSharedBank {
		return accountID, nil
	}
	var onlineCharacters []string
	if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("account_id = ? AND deleted_at IS NULL AND ingame = 1", accountID).
		Pluck("name", &onlineCharacters).Error; err != nil {
		return 0, err
	}
	if len(onlineCharacters) > 0 {
		return 0, inventoryKeyringConflict(
			"Shared bank changes are locked while account character %s is online",
			strings.Join(onlineCharacters, ", "),
		)
	}
	return accountID, nil
}

func inventoryKeyringContainerChildren(db *gorm.DB, characterID, accountID, parentSlot int) ([]int, error) {
	ranges := inventoryKeyringChildRanges(parentSlot)
	if len(ranges) == 0 {
		return []int{}, nil
	}
	parts := make([]string, 0, len(ranges))
	args := make([]interface{}, 0, len(ranges)*2)
	for _, childRange := range ranges {
		parts = append(parts, "(slot_id BETWEEN ? AND ?)")
		args = append(args, childRange.begin, childRange.end)
	}
	query := inventoryKeyringStorageScope(db, inventoryKeyringStorageKind(parentSlot), characterID, accountID).
		Select("slot_id").Where("("+strings.Join(parts, " OR ")+")", args...)
	var children []int
	if err := query.Order("slot_id").Scan(&children).Error; err != nil {
		return nil, err
	}
	return children, nil
}

type inventoryKeyringSlotRange struct {
	begin    int
	end      int
	parent   int
	capacity int
	stride   int
}

func inventoryKeyringChildRanges(parentSlot int) []inventoryKeyringSlotRange {
	ranges := make([]inventoryKeyringSlotRange, 0, 2)
	add := func(begin, capacity, stride int) {
		ranges = append(ranges, inventoryKeyringSlotRange{begin: begin, end: begin + capacity - 1, parent: parentSlot, capacity: capacity, stride: stride})
	}
	switch {
	case parentSlot >= 23 && parentSlot <= 32:
		index := parentSlot - 23
		add(251+index*10, 10, 10)
		add(4010+index*200, 200, 200)
	case parentSlot == 33:
		add(351, 10, 10)
		add(6010, 200, 200)
	case parentSlot >= 2000 && parentSlot <= 2023:
		index := parentSlot - 2000
		add(2031+index*10, 10, 10)
		add(6210+index*200, 200, 200)
	case parentSlot >= 2500 && parentSlot <= 2501:
		index := parentSlot - 2500
		add(2531+index*10, 10, 10)
		add(11010+index*200, 200, 200)
	}
	return ranges
}

func inventoryKeyringMoveContainerChildren(tx *gorm.DB, characterID, accountID, sourceSlot, targetSlot int, children []int) error {
	sourceRanges := inventoryKeyringChildRanges(sourceSlot)
	targetRanges := inventoryKeyringChildRanges(targetSlot)
	if len(sourceRanges) == 0 || len(targetRanges) == 0 {
		return inventoryKeyringConflict("Move or remove the container contents before moving this container to %s", inventoryKeyringDescribeSlot(targetSlot).Label)
	}
	sourceStorage := inventoryKeyringStorageKind(sourceSlot)
	targetStorage := inventoryKeyringStorageKind(targetSlot)
	if sourceStorage != targetStorage {
		return inventoryKeyringConflict("Move or remove this container's contents before moving it between character and shared-bank storage")
	}
	moves := map[int]int{}
	for _, child := range children {
		mapped := false
		for sourceIndex, sourceRange := range sourceRanges {
			if child < sourceRange.begin || child > sourceRange.end {
				continue
			}
			offset := child - sourceRange.begin
			targetRange := targetRanges[0]
			for _, candidate := range targetRanges {
				if candidate.stride == sourceRange.stride {
					targetRange = candidate
					break
				}
			}
			if offset >= targetRange.capacity {
				return inventoryKeyringConflict("The destination slot cannot preserve every container child slot")
			}
			moves[child] = targetRange.begin + offset
			_ = sourceIndex
			mapped = true
			break
		}
		if !mapped {
			return inventoryKeyringConflict("Container child slot #%d could not be mapped safely", child)
		}
	}
	for _, target := range moves {
		var occupied int64
		if err := inventoryKeyringStorageScope(tx, targetStorage, characterID, accountID).
			Where("slot_id = ? AND slot_id NOT IN ?", target, children).Count(&occupied).Error; err != nil {
			return err
		}
		if occupied > 0 {
			return inventoryKeyringConflict("%s is occupied, so the container and its contents cannot move atomically", inventoryKeyringDescribeSlot(target).Label)
		}
	}
	tempOffset := 1000000
	for source := range moves {
		if err := inventoryKeyringStorageScope(tx, sourceStorage, characterID, accountID).
			Where("slot_id = ?", source).Update("slot_id", source+tempOffset).Error; err != nil {
			return err
		}
	}
	for source, target := range moves {
		if err := inventoryKeyringStorageScope(tx, sourceStorage, characterID, accountID).
			Where("slot_id = ?", source+tempOffset).Update("slot_id", target).Error; err != nil {
			return err
		}
	}
	return nil
}

func inventoryKeyringDescribeSlot(slotID int) inventoryKeyringSlot {
	equipment := []string{
		"Charm", "Left Ear", "Head", "Face", "Right Ear", "Neck", "Shoulders", "Arms", "Back",
		"Left Wrist", "Right Wrist", "Range", "Hands", "Primary", "Secondary", "Left Finger",
		"Right Finger", "Chest", "Legs", "Feet", "Waist", "Power Source", "Ammo",
	}
	if slotID >= 0 && slotID < len(equipment) {
		return inventoryKeyringSlot{ID: slotID, Label: equipment[slotID], Group: "Equipment", Known: true, Selectable: true, Description: "Equipped character slot"}
	}
	if slotID >= 23 && slotID <= 32 {
		return inventoryKeyringSlot{ID: slotID, Label: fmt.Sprintf("General %d", slotID-22), Group: "Inventory", Known: true, Selectable: true, Description: "Top-level carried inventory slot"}
	}
	if slotID == 33 {
		return inventoryKeyringSlot{ID: slotID, Label: "Cursor", Group: "Inventory", Known: true, Selectable: true, Description: "Character cursor slot"}
	}
	if slotID >= 2000 && slotID <= 2023 {
		return inventoryKeyringSlot{ID: slotID, Label: fmt.Sprintf("Bank %d", slotID-1999), Group: "Bank", Known: true, Selectable: true, Description: "Personal bank slot"}
	}
	if slotID >= 2500 && slotID <= 2501 {
		return inventoryKeyringSlot{ID: slotID, Label: fmt.Sprintf("Shared Bank %d", slotID-2499), Group: "Shared Bank", Known: true, Selectable: true, Description: "Account-shared bank slot"}
	}
	parents := inventoryKeyringTopLevelContainerSlots()
	for _, parent := range parents {
		for _, childRange := range inventoryKeyringChildRanges(parent) {
			if slotID >= childRange.begin && slotID <= childRange.end {
				bagIndex := slotID - childRange.begin
				parentCopy := parent
				indexCopy := bagIndex
				return inventoryKeyringSlot{
					ID: slotID, Label: fmt.Sprintf("%s · Container %d", inventoryKeyringDescribeSlot(parent).Label, bagIndex+1),
					Group: "Container", ParentSlot: &parentCopy, BagIndex: &indexCopy, Known: true,
					Selectable: true, Description: "Item inside a persisted container slot",
				}
			}
		}
	}
	return inventoryKeyringSlot{
		ID: slotID, Label: fmt.Sprintf("Legacy slot #%d", slotID), Group: "Legacy", Known: false,
		Selectable: false, Description: "Unknown or client-specific slot preserved exactly as stored",
	}
}

func inventoryKeyringSlotOptions(inventory []inventoryKeyringRecord) []inventoryKeyringSlot {
	slots := make([]inventoryKeyringSlot, 0, 100)
	for slotID := 0; slotID <= 33; slotID++ {
		slots = append(slots, inventoryKeyringDescribeSlot(slotID))
	}
	for slotID := 2000; slotID <= 2023; slotID++ {
		slots = append(slots, inventoryKeyringDescribeSlot(slotID))
	}
	for slotID := 2500; slotID <= 2501; slotID++ {
		slots = append(slots, inventoryKeyringDescribeSlot(slotID))
	}
	for _, record := range inventory {
		if record.Item.BagSlots <= 0 {
			continue
		}
		ranges := inventoryKeyringChildRanges(record.SlotID)
		if len(ranges) == 0 {
			continue
		}
		// Prefer the current server range. If legacy child rows are already
		// present, preserve that family for new sibling selections.
		selectedRange := ranges[len(ranges)-1]
		for _, existing := range inventory {
			for _, candidate := range ranges {
				if existing.SlotID >= candidate.begin && existing.SlotID <= candidate.end {
					selectedRange = candidate
					break
				}
			}
		}
		capacity := record.Item.BagSlots
		if capacity > selectedRange.capacity {
			capacity = selectedRange.capacity
		}
		for index := 0; index < capacity; index++ {
			slots = append(slots, inventoryKeyringDescribeSlot(selectedRange.begin+index))
		}
	}
	seen := map[int]bool{}
	filtered := make([]inventoryKeyringSlot, 0, len(slots))
	for _, slot := range slots {
		if !seen[slot.ID] {
			seen[slot.ID] = true
			filtered = append(filtered, slot)
		}
	}
	sort.SliceStable(filtered, func(a, b int) bool {
		groupOrder := map[string]int{"Equipment": 0, "Inventory": 1, "Container": 2, "Bank": 3, "Shared Bank": 4, "Legacy": 5}
		if groupOrder[filtered[a].Group] != groupOrder[filtered[b].Group] {
			return groupOrder[filtered[a].Group] < groupOrder[filtered[b].Group]
		}
		return filtered[a].ID < filtered[b].ID
	})
	return filtered
}

func inventoryKeyringTopLevelContainerSlots() []int {
	slots := make([]int, 0, 37)
	for slot := 23; slot <= 33; slot++ {
		slots = append(slots, slot)
	}
	for slot := 2000; slot <= 2023; slot++ {
		slots = append(slots, slot)
	}
	for slot := 2500; slot <= 2501; slot++ {
		slots = append(slots, slot)
	}
	return slots
}

func inventoryKeyringPagination(c echo.Context) (int, int) {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 {
		limit = inventoryKeyringDefaultPageSize
	}
	if limit > inventoryKeyringMaxPageSize {
		limit = inventoryKeyringMaxPageSize
	}
	return page, limit
}

func inventoryKeyringPositiveParam(c echo.Context, name, label string) (int, error) {
	value, err := strconv.Atoi(c.Param(name))
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("%s identifier must be a positive integer", label)
	}
	return value, nil
}

func inventoryKeyringPositiveOrZeroParam(c echo.Context, name, label string) (int, error) {
	value, err := strconv.Atoi(c.Param(name))
	if err != nil || value < 0 {
		return 0, fmt.Errorf("%s identifier must be zero or a positive integer", label)
	}
	return value, nil
}

func inventoryKeyringConflict(format string, args ...interface{}) error {
	return inventoryKeyringConflictError{message: fmt.Sprintf(format, args...)}
}

func inventoryKeyringLoadError(c echo.Context, label string, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": label + " not found"})
	}
	return inventoryKeyringDatabaseError(c, err)
}

func inventoryKeyringMutationError(c echo.Context, err error) error {
	var conflict inventoryKeyringConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "The requested character or record no longer exists"})
	}
	if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
		return c.JSON(http.StatusConflict, echo.Map{"error": "The selected destination is already occupied"})
	}
	return inventoryKeyringDatabaseError(c, err)
}

func inventoryKeyringAuditError(c echo.Context, err error) error {
	c.Logger().Errorf("Required inventory and keyring audit could not be saved: %v", err)
	return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "Required operation audit could not be saved"})
}

func inventoryKeyringDatabaseError(c echo.Context, err error) error {
	c.Logger().Errorf("Inventory and keyring database error: %v", err)
	return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Inventory and keyring database error"})
}

func (i *InventoryKeyringController) writeAudit(c echo.Context, event string, payload interface{}) (uint, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return 0, err
	}
	id, err := i.auditLog.LogEditorEvent(c, event, string(data))
	if err != nil {
		return 0, fmt.Errorf("could not persist the required audit record: %w", err)
	}
	if id == 0 {
		return 0, errors.New("could not persist the required audit record")
	}
	return id, nil
}

func (i *InventoryKeyringController) discardAudit(c echo.Context, id uint) {
	if id == 0 || i.db.GetSpireDb() == nil {
		return
	}
	if err := i.db.GetSpireDb().Table("spire_user_event_log").Where("id = ?", id).Delete(nil).Error; err != nil {
		c.Logger().Errorf("Could not discard rolled-back Inventory & Keyring audit event %d: %v", id, err)
	}
}
