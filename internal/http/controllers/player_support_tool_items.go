package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// ---------------------------------------------------------------------------
// Item tracer and restore ledger: where an item is on the petitioning
// account now, and what staff already sent back.

// supportRestoreDays is how far back the restore ledger reaches.
const supportRestoreDays = 90

type supportRestoreItem struct {
	ItemID     uint   `json:"item_id"`
	ItemName   string `json:"item_name"`
	Quantity   int    `json:"quantity"`
	AugmentIDs []uint `json:"augment_ids"`
	parcelID   uint
}

// supportRestore is one GM parcel batch sent to a character of the account,
// from Player Support or the Mail & Parcels editor.
type supportRestore struct {
	CaseKey     string               `json:"case_key"`
	Character   string               `json:"character"`
	Quantity    int                  `json:"quantity"`
	SentAt      time.Time            `json:"sent_at"`
	Actor       string               `json:"actor"`
	Source      string               `json:"source"`
	Items       []supportRestoreItem `json:"items,omitempty"`
	characterID uint
}

func (r supportRestore) parcelIDs() []uint {
	ids := make([]uint, 0, len(r.Items))
	for _, item := range r.Items {
		if item.parcelID > 0 {
			ids = append(ids, item.parcelID)
		}
	}
	return ids
}

// supportParseRestore reads a GM parcel batch audit payload. It reports false
// for a batch to a character outside characters.
func supportParseRestore(data string, characters map[uint]string) (supportRestore, bool) {
	var payload struct {
		CharacterID   uint   `json:"character_id"`
		CharacterName string `json:"character_name"`
		RecordIDs     []uint `json:"record_ids"`
		Details       struct {
			Items []struct {
				ParcelID   uint   `json:"parcel_id"`
				ItemID     uint   `json:"item_id"`
				ItemName   string `json:"item_name"`
				Quantity   int    `json:"quantity"`
				AugmentIDs []uint `json:"augment_ids"`
			} `json:"items"`
		} `json:"details"`
	}
	if json.Unmarshal([]byte(data), &payload) != nil {
		return supportRestore{}, false
	}
	name, ok := characters[payload.CharacterID]
	if !ok {
		return supportRestore{}, false
	}
	restore := supportRestore{Character: name, characterID: payload.CharacterID, Items: []supportRestoreItem{}}
	for i, item := range payload.Details.Items {
		augments := make([]uint, 6)
		copy(augments, item.AugmentIDs)
		line := supportRestoreItem{ItemID: item.ItemID, ItemName: item.ItemName, Quantity: item.Quantity, AugmentIDs: augments, parcelID: item.ParcelID}
		if line.parcelID == 0 && i < len(payload.RecordIDs) {
			line.parcelID = payload.RecordIDs[i]
		}
		restore.Items = append(restore.Items, line)
		restore.Quantity += item.Quantity
	}
	return restore, true
}

// supportRestoreLedger lists GM parcel batches sent to characters since a
// time, newest first. Player Support deliveries count once confirmed.
func supportRestoreLedger(scope supportScope, characters map[uint]string, since time.Time, limit int) ([]supportRestore, error) {
	restores := []supportRestore{}
	if len(characters) == 0 {
		return restores, nil
	}
	// Narrow the scan to payloads naming one of the characters; the JSON is
	// checked again after decoding.
	patterns := make([]string, 0, len(characters))
	args := make([]interface{}, 0, len(characters))
	for id := range characters {
		patterns = append(patterns, "events.data LIKE ?")
		args = append(args, fmt.Sprintf(`%%"character_id":%d,%%`, id))
	}
	var rows []struct {
		Data          string
		CreatedAt     time.Time
		SupportCaseID *uint
		Actor         string
		CaseKey       string
	}
	err := scope.spire.Table("spire_user_event_log AS events").
		Select("events.data, events.created_at, events.support_case_id, COALESCE(users.user_name, '') AS actor, COALESCE(cases.source_key, '') AS case_key").
		Joins("LEFT JOIN spire_users AS users ON users.id = events.user_id").
		Joins("LEFT JOIN spire_player_support_cases AS cases ON cases.id = events.support_case_id").
		Where("events.server_database_connection_id = ? AND events.event_name = ? AND events.created_at >= ?",
			scope.connectionID, mailParcelsEventGMSendParcels, since).
		Where("(events.support_case_id IS NULL OR events.support_delivery_state = ?)", "sent").
		Where("("+strings.Join(patterns, " OR ")+")", args...).
		Order("events.id DESC").Limit(2000).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		restore, ok := supportParseRestore(row.Data, characters)
		if !ok {
			continue
		}
		restore.SentAt, restore.Actor, restore.CaseKey, restore.Source = row.CreatedAt, row.Actor, row.CaseKey, "Mail & Parcels"
		if row.SupportCaseID != nil {
			restore.Source = "Player Support"
		}
		if restore.Actor == "" {
			restore.Actor = supportDefaultActor
		}
		restores = append(restores, restore)
		if len(restores) == limit {
			break
		}
	}
	return restores, nil
}

// toolItemRow is an item row with the character, corpse, parcel or account
// that holds it. gorm skips unexported embedded fields, so the row is a
// named embedded field.
type toolItemRow struct {
	Owner uint
	Row   supportInventoryRow `gorm:"embedded"`
}

// toolItemSelect selects an item table's columns as the columns toolItemRow
// maps.
func toolItemSelect(owner string, cols supportInventoryColumns) string {
	selects := fmt.Sprintf("%s AS owner, %s AS slot, %s AS item_id, COALESCE(%s, 0) AS charges", owner, cols.Slot, cols.Item, cols.Charges)
	for i, column := range cols.Augments {
		selects += fmt.Sprintf(", COALESCE(%s, 0) AS a%d", column, i+1)
	}
	return selects
}

func toolReadItems(db *gorm.DB, table, owner string, cols supportInventoryColumns, where string, args ...interface{}) ([]toolItemRow, error) {
	var rows []toolItemRow
	err := db.Table(table).Select(toolItemSelect(owner, cols)).Where(where, args...).Where(cols.Item + " > 0").Limit(2000).Scan(&rows).Error
	return rows, err
}

var (
	toolCorpseItemColumns = supportInventoryColumns{Slot: "equip_slot", Item: "item_id", Charges: "charges",
		Augments: [6]string{"aug_1", "aug_2", "aug_3", "aug_4", "aug_5", "aug_6"}}
	toolParcelColumns = supportInventoryColumns{Slot: "slot_id", Item: "item_id", Charges: "quantity",
		Augments: [6]string{"aug_slot_1", "aug_slot_2", "aug_slot_3", "aug_slot_4", "aug_slot_5", "aug_slot_6"}}
)

// toolSharedBankSchema reads the shared bank's column names, which EQEmu
// renamed along with the inventory's. ok is false without a shared bank.
func toolSharedBankSchema(db *gorm.DB) (supportInventoryColumns, string, bool, error) {
	columns, err := toolColumns(db, "sharedbank")
	switch {
	case err != nil:
		return supportInventoryColumns{}, "", false, err
	case columns["account_id"]:
		return supportInventoryColumns{Slot: "slot_id", Item: "item_id", Charges: "charges",
			Augments: [6]string{"augment_one", "augment_two", "augment_three", "augment_four", "augment_five", "augment_six"}}, "account_id", true, nil
	case columns["acctid"]:
		return supportInventoryColumns{Slot: "slotid", Item: "itemid", Charges: "charges",
			Augments: [6]string{"augslot1", "augslot2", "augslot3", "augslot4", "augslot5", "augslot6"}}, "acctid", true, nil
	}
	return supportInventoryColumns{}, "", false, nil
}

// toolItemCount applies the snapshot rule: a stackable item counts by its
// stack size, anything else once per slot.
func toolItemCount(row supportInventoryRow, stackable map[uint]bool) int {
	if stackable[row.ItemID] && row.Charges > 1 {
		return row.Charges
	}
	return 1
}

type supportItemLocation struct {
	Place     string     `json:"place"`
	Character string     `json:"character,omitempty"`
	Slot      *uint      `json:"slot,omitempty"`
	CorpseID  uint       `json:"corpse_id,omitempty"`
	ZoneName  string     `json:"zone_name,omitempty"`
	ParcelID  uint       `json:"parcel_id,omitempty"`
	From      string     `json:"from,omitempty"`
	SentAt    *time.Time `json:"sent_at,omitempty"`
	Count     int        `json:"count"`
	Augments  [6]uint    `json:"augments"`
}

// supportItemEventPattern matches an event's "item_id" field holding exactly
// id. It is built from the number only.
func supportItemEventPattern(id uint) string {
	return fmt.Sprintf(`"item_id"[[:space:]]*:[[:space:]]*%d([^0-9]|$)`, id)
}

func (p *PlayerSupportController) traceItem(c echo.Context) error {
	scope, view, err := p.toolCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	itemID, err := strconv.ParseUint(c.QueryParam("item_id"), 10, 32)
	if err != nil || itemID == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Choose an item"))
	}
	id := uint(itemID)
	itemDB, err := p.toolContentDB(c, scope, models.Item{})
	if err != nil {
		return supportError(c, err)
	}
	items, err := supportItemReferences(itemDB, map[uint]bool{id: true})
	if err != nil {
		return supportError(c, err)
	}
	item := items[id]
	if item == nil {
		return supportError(c, echo.NewHTTPError(http.StatusNotFound, "That item does not exist"))
	}
	accountID, err := toolAccount(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	characters, err := toolAccountCharacters(scope, accountID, false)
	if err != nil {
		return supportError(c, err)
	}
	names := toolCharacterNames(characters)
	stackable := map[uint]bool{id: item.Stackable != 0}
	locations, err := p.toolItemLocations(c, scope, view, accountID, characters, id, stackable)
	if err != nil {
		return supportError(c, err)
	}
	ledger, err := supportRestoreLedger(scope, names, time.Now().AddDate(0, 0, -supportRestoreDays), 100)
	if err != nil {
		return supportError(c, err)
	}
	restores := []supportRestore{}
	for _, restore := range ledger {
		quantity := 0
		for _, line := range restore.Items {
			if line.ItemID == id {
				quantity += line.Quantity
			}
		}
		if quantity > 0 {
			restore.Quantity, restore.Items = quantity, nil
			restores = append(restores, restore)
		}
	}
	events := []supportEvent{}
	if ids := toolCharacterIDs(characters); len(ids) > 0 {
		err = scope.eqemu.Table("player_event_logs AS e").
			Select("e.id, COALESCE(e.character_id, 0) AS character_id, COALESCE(ch.name, '') AS `character`, "+
				"COALESCE(e.zone_id, 0) AS zone_id, COALESCE(e.event_type_id, 0) AS event_type_id, "+
				"COALESCE(e.event_type_name, '') AS event_type_name, COALESCE(e.event_data, '') AS event_data, e.created_at").
			Joins("LEFT JOIN character_data AS ch ON ch.id = e.character_id").
			Where("e.character_id IN ? AND e.created_at >= NOW() - INTERVAL 30 DAY AND e.event_type_name IN ?", ids, supportEventGroups["items"]).
			Where("e.event_data REGEXP ?", supportItemEventPattern(id)).
			Order("e.created_at DESC, e.id DESC").Limit(20).Scan(&events).Error
		if err != nil {
			return supportError(c, err)
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"item": item, "locations": locations, "restores": restores, "events": events})
}

// toolItemLocations finds every copy of an item on the account: the case
// character's inventory, other characters, the shared bank, corpses and
// unclaimed parcels.
func (p *PlayerSupportController) toolItemLocations(c echo.Context, scope supportScope, view supportCaseView, accountID uint,
	characters []toolCharacter, itemID uint, stackable map[uint]bool) ([]supportItemLocation, error) {
	locations := []supportItemLocation{}
	names := toolCharacterNames(characters)
	ids := toolCharacterIDs(characters)
	if len(ids) == 0 {
		return locations, nil
	}
	add := func(place string, row toolItemRow, location supportItemLocation) {
		location.Place, location.Count, location.Augments = place, toolItemCount(row.Row, stackable), row.Row.augments()
		locations = append(locations, location)
	}
	slot := func(row toolItemRow) *uint {
		value := row.Row.Slot
		return &value
	}

	invCols, err := supportInventorySchema(scope.eqemu, "inventory")
	if err != nil {
		return nil, err
	}
	rows, err := toolReadItems(scope.eqemu, "inventory", invCols.Character, invCols, invCols.Character+" IN ? AND "+invCols.Item+" = ?", ids, itemID)
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		place := "alt"
		if row.Owner == view.CharacterID {
			place = "inventory"
		}
		add(place, row, supportItemLocation{Character: names[row.Owner], Slot: slot(row)})
	}

	bankCols, owner, ok, err := toolSharedBankSchema(scope.eqemu)
	if err != nil {
		return nil, err
	}
	if ok {
		rows, err := toolReadItems(scope.eqemu, "sharedbank", owner, bankCols, owner+" = ? AND "+bankCols.Item+" = ?", accountID, itemID)
		if err != nil {
			return nil, err
		}
		for _, row := range rows {
			add("shared_bank", row, supportItemLocation{Slot: slot(row)})
		}
	}

	rows, err = toolReadItems(scope.eqemu, "character_corpse_items", "corpse_id", toolCorpseItemColumns,
		"item_id = ? AND corpse_id IN (SELECT id FROM character_corpses WHERE charid IN ?)", itemID, ids)
	if err != nil {
		return nil, err
	}
	if len(rows) > 0 {
		corpseIDs := make([]uint, 0, len(rows))
		for _, row := range rows {
			corpseIDs = append(corpseIDs, row.Owner)
		}
		var corpses []struct {
			ID     uint
			Charid uint
			ZoneID int
		}
		if err := scope.eqemu.Table("character_corpses").Select("id, charid, zone_id").Where("id IN ?", corpseIDs).Scan(&corpses).Error; err != nil {
			return nil, err
		}
		owners := map[uint]uint{}
		zoneIDs := []int{}
		zones := map[uint]int{}
		for _, corpse := range corpses {
			owners[corpse.ID], zones[corpse.ID] = corpse.Charid, corpse.ZoneID
			zoneIDs = append(zoneIDs, corpse.ZoneID)
		}
		zoneNames := map[int]string{}
		if zoneDB, err := p.toolContentDB(c, scope, models.Zone{}); err == nil {
			if zoneNames, err = loadPlayerOperationsZoneNames(zoneDB, zoneIDs); err != nil {
				return nil, err
			}
		}
		for _, row := range rows {
			zone := zoneNames[zones[row.Owner]]
			if zone == "" {
				zone = fmt.Sprintf("Zone #%d", zones[row.Owner])
			}
			add("corpse", row, supportItemLocation{CorpseID: row.Owner, Character: names[owners[row.Owner]], ZoneName: zone})
		}
	}

	parcels, err := toolParcelItems(scope.eqemu, ids, nil, "item_id = ?", itemID)
	if err != nil {
		return nil, err
	}
	for _, parcel := range parcels {
		add("parcel", parcel.toolItemRow, supportItemLocation{ParcelID: parcel.Owner, Character: names[parcel.CharacterID], From: parcel.From, SentAt: parcel.SentAt})
	}
	return locations, nil
}

type toolParcelItem struct {
	toolItemRow
	CharacterID uint
	From        string
	SentAt      *time.Time
}

// toolParcelItems reads unclaimed parcels of characters, with the items in
// parcelled containers, leaving out the parcels in skip. A server without
// parcels has none.
func toolParcelItems(db *gorm.DB, characters, skip []uint, where string, args ...interface{}) ([]toolParcelItem, error) {
	result := []toolParcelItem{}
	columns, err := toolColumns(db, "character_parcels")
	if err != nil || !columns["char_id"] || len(characters) == 0 {
		return result, err
	}
	parcelFilter := "char_id IN ?"
	filterArgs := []interface{}{characters}
	if len(skip) > 0 {
		parcelFilter += " AND id NOT IN ?"
		filterArgs = append(filterArgs, skip)
	}
	rows, err := toolReadItems(db, "character_parcels", "id", toolParcelColumns, parcelFilter+" AND "+where, append(filterArgs, args...)...)
	if err != nil {
		return nil, err
	}
	containers, err := toolColumns(db, "character_parcels_containers")
	if err != nil {
		return nil, err
	}
	if containers["parcels_id"] {
		inner, err := toolReadItems(db, "character_parcels_containers", "parcels_id", toolParcelColumns,
			"parcels_id IN (SELECT id FROM character_parcels WHERE "+parcelFilter+") AND "+where, append(filterArgs, args...)...)
		if err != nil {
			return nil, err
		}
		rows = append(rows, inner...)
	}
	if len(rows) == 0 {
		return result, nil
	}
	parcelIDs := make([]uint, 0, len(rows))
	for _, row := range rows {
		parcelIDs = append(parcelIDs, row.Owner)
	}
	var meta []struct {
		ID       uint
		CharID   uint
		FromName string
		SentDate *time.Time
	}
	if err := db.Table("character_parcels").Select("id, char_id, COALESCE(from_name, '') AS from_name, sent_date").
		Where("id IN ?", parcelIDs).Scan(&meta).Error; err != nil {
		return nil, err
	}
	byID := map[uint]int{}
	for i, parcel := range meta {
		byID[parcel.ID] = i
	}
	for _, row := range rows {
		item := toolParcelItem{toolItemRow: row}
		if i, ok := byID[row.Owner]; ok {
			item.CharacterID, item.From, item.SentAt = meta[i].CharID, meta[i].FromName, meta[i].SentDate
		}
		result = append(result, item)
	}
	return result, nil
}

func (p *PlayerSupportController) restores(c echo.Context) error {
	scope, view, err := p.toolCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	accountID, err := toolAccount(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	characters, err := toolAccountCharacters(scope, accountID, true)
	if err != nil {
		return supportError(c, err)
	}
	ledger, err := supportRestoreLedger(scope, toolCharacterNames(characters), time.Now().AddDate(0, 0, -supportRestoreDays), 100)
	if err != nil {
		return supportError(c, err)
	}
	sort.SliceStable(ledger, func(i, j int) bool { return ledger[i].SentAt.After(ledger[j].SentAt) })
	return c.JSON(http.StatusOK, echo.Map{"restores": ledger})
}
