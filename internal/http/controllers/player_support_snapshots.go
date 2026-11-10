package controllers

import (
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
// Inventory snapshots: what the character had at a snapshot that it no longer
// has, so staff can send it back as parcels.

type supportInventoryColumns struct {
	Character, Slot, Item, Charges string
	Augments                       [6]string
}

// Newer EQEmu renamed the inventory columns; read whichever this server has.
func supportInventorySchema(db *gorm.DB, table string) (supportInventoryColumns, error) {
	var names []string
	err := db.Raw("SELECT LOWER(column_name) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?", table).
		Scan(&names).Error
	if err != nil {
		return supportInventoryColumns{}, err
	}
	for _, name := range names {
		if name == "character_id" {
			return supportInventoryColumns{"character_id", "slot_id", "item_id", "charges",
				[6]string{"augment_one", "augment_two", "augment_three", "augment_four", "augment_five", "augment_six"}}, nil
		}
		if name == "charid" {
			return supportInventoryColumns{"charid", "slotid", "itemid", "charges",
				[6]string{"augslot1", "augslot2", "augslot3", "augslot4", "augslot5", "augslot6"}}, nil
		}
	}
	return supportInventoryColumns{}, echo.NewHTTPError(http.StatusServiceUnavailable, "This server has no "+table+" table")
}

type supportInventoryRow struct {
	Slot    uint
	ItemID  uint
	Charges int
	A1      uint
	A2      uint
	A3      uint
	A4      uint
	A5      uint
	A6      uint
}

func (r supportInventoryRow) augments() [6]uint { return [6]uint{r.A1, r.A2, r.A3, r.A4, r.A5, r.A6} }

func supportReadInventory(db *gorm.DB, table string, cols supportInventoryColumns, where string, args ...interface{}) ([]supportInventoryRow, error) {
	selects := fmt.Sprintf("%s AS slot, %s AS item_id, COALESCE(%s, 0) AS charges", cols.Slot, cols.Item, cols.Charges)
	for i, column := range cols.Augments {
		selects += fmt.Sprintf(", COALESCE(%s, 0) AS a%d", column, i+1)
	}
	var rows []supportInventoryRow
	err := db.Table(table).Select(selects).Where(where, args...).Where(cols.Item + " > 0").Scan(&rows).Error
	return rows, err
}

type supportSnapshotLine struct {
	Item     *mailParcelsItemReference    `json:"item"`
	Augments [6]*mailParcelsItemReference `json:"augments"`
	Had      int                          `json:"had"`
	Has      int                          `json:"has"`
	Missing  int                          `json:"missing"`
	// Elsewhere is what was found in other places on the account, in the
	// order it was subtracted from what is missing.
	Elsewhere supportElsewhere `json:"elsewhere"`
	// Accounted: everything the character lost was found elsewhere.
	Accounted bool `json:"accounted"`
}

type supportElsewhere struct {
	Corpse     int `json:"corpse"`
	Parcel     int `json:"parcel"`
	SharedBank int `json:"shared_bank"`
	Alt        int `json:"alt"`
	Restored   int `json:"restored"`
	// AltName names the other characters holding it, when Alt is counted.
	AltName string `json:"alt_name,omitempty"`
	// RestoredAt is when the newest GM parcel batch holding it was sent,
	// when Restored is counted.
	RestoredAt *time.Time `json:"restored_at,omitempty"`
}

func (e supportElsewhere) total() int {
	return e.Corpse + e.Parcel + e.SharedBank + e.Alt + e.Restored
}

// supportItemPlaces counts, per item, what is found in each place other than
// the character's inventory.
type supportItemPlaces struct {
	Corpse, Parcel, SharedBank, Alt, Restored map[supportItemKey]int
	AltNames                                  map[supportItemKey]string
	RestoredAt                                map[supportItemKey]time.Time
}

// supportAccountMissing subtracts what was found elsewhere from what is
// missing, place by place in the order corpse, parcel, shared bank, other
// characters, restored, never below zero.
func supportAccountMissing(missing map[supportItemKey][2]int, places supportItemPlaces) map[supportItemKey]supportElsewhere {
	result := make(map[supportItemKey]supportElsewhere, len(missing))
	for key, counts := range missing {
		left := counts[0] - counts[1]
		take := func(found map[supportItemKey]int) int {
			amount := min(max(found[key], 0), left)
			left -= amount
			return amount
		}
		var elsewhere supportElsewhere
		elsewhere.Corpse = take(places.Corpse)
		elsewhere.Parcel = take(places.Parcel)
		elsewhere.SharedBank = take(places.SharedBank)
		elsewhere.Alt = take(places.Alt)
		elsewhere.Restored = take(places.Restored)
		if elsewhere.Alt > 0 {
			elsewhere.AltName = places.AltNames[key]
		}
		if at, ok := places.RestoredAt[key]; ok && elsewhere.Restored > 0 {
			elsewhere.RestoredAt = &at
		}
		result[key] = elsewhere
	}
	return result
}

// supportCountItems counts rows by item and augments with the snapshot rule.
func supportCountItems(rows []supportInventoryRow, stackable map[uint]bool, wanted map[supportItemKey][2]int) map[supportItemKey]int {
	counts := map[supportItemKey]int{}
	for _, row := range rows {
		key := supportItemKey{row.ItemID, row.augments()}
		if _, ok := wanted[key]; ok {
			counts[key] += toolItemCount(row, stackable)
		}
	}
	return counts
}

// supportRestoreRow is a GM parcel batch line as an inventory row.
func supportRestoreRow(item supportRestoreItem) supportInventoryRow {
	row := supportInventoryRow{ItemID: item.ItemID, Charges: item.Quantity}
	augments := [6]*uint{&row.A1, &row.A2, &row.A3, &row.A4, &row.A5, &row.A6}
	for i, augment := range item.AugmentIDs {
		if i < len(augments) {
			*augments[i] = augment
		}
	}
	return row
}

// supportRestoredItems counts items in GM parcel batches. A batch line holds
// one parcel, so it counts by quantity for stackables and once otherwise.
func supportRestoredItems(restores []supportRestore, stackable map[uint]bool, wanted map[supportItemKey][2]int) map[supportItemKey]int {
	rows := []supportInventoryRow{}
	for _, restore := range restores {
		for _, item := range restore.Items {
			rows = append(rows, supportRestoreRow(item))
		}
	}
	return supportCountItems(rows, stackable, wanted)
}

// supportRestoredAt is, per item, when the newest GM parcel batch holding it
// was sent.
func supportRestoredAt(restores []supportRestore, wanted map[supportItemKey][2]int) map[supportItemKey]time.Time {
	sent := map[supportItemKey]time.Time{}
	for _, restore := range restores {
		for _, item := range restore.Items {
			row := supportRestoreRow(item)
			key := supportItemKey{row.ItemID, row.augments()}
			if _, ok := wanted[key]; !ok {
				continue
			}
			if at, ok := sent[key]; !ok || restore.SentAt.After(at) {
				sent[key] = restore.SentAt
			}
		}
	}
	return sent
}

// supportAltNames names, per item, the other characters holding it, in
// character order: "A", "A and B", "A, B and C".
func supportAltNames(rows []toolItemRow, characters []toolCharacter, stackable map[uint]bool, wanted map[supportItemKey][2]int) map[supportItemKey]string {
	byOwner := map[uint][]supportInventoryRow{}
	for _, row := range rows {
		byOwner[row.Owner] = append(byOwner[row.Owner], row.Row)
	}
	holders := map[supportItemKey][]string{}
	for _, character := range characters {
		for key, count := range supportCountItems(byOwner[character.ID], stackable, wanted) {
			if count > 0 {
				holders[key] = append(holders[key], character.Name)
			}
		}
	}
	names := make(map[supportItemKey]string, len(holders))
	for key, list := range holders {
		names[key] = list[len(list)-1]
		if len(list) > 1 {
			names[key] = strings.Join(list[:len(list)-1], ", ") + " and " + list[len(list)-1]
		}
	}
	return names
}

func toolRows(rows []toolItemRow) []supportInventoryRow {
	result := make([]supportInventoryRow, 0, len(rows))
	for _, row := range rows {
		result = append(result, row.Row)
	}
	return result
}

// supportItemsElsewhere reads what the account holds outside the character's
// inventory, for the items that are missing since the snapshot.
func supportItemsElsewhere(scope supportScope, view supportCaseView, invCols supportInventoryColumns, since time.Time,
	missing map[supportItemKey][2]int, stackable map[uint]bool) (supportItemPlaces, error) {
	places := supportItemPlaces{}
	if len(missing) == 0 {
		return places, nil
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil || accountID == 0 {
		return places, err
	}
	characters, err := toolAccountCharacters(scope, accountID, false)
	if err != nil {
		return places, err
	}
	ids := toolCharacterIDs(characters)
	itemIDs := []uint{}
	for key := range missing {
		itemIDs = append(itemIDs, key.ID)
	}
	alts := []uint{}
	for _, id := range ids {
		if id != view.CharacterID {
			alts = append(alts, id)
		}
	}

	rows, err := toolReadItems(scope.eqemu, "character_corpse_items", "corpse_id", toolCorpseItemColumns,
		"item_id IN ? AND corpse_id IN (SELECT id FROM character_corpses WHERE charid IN ?)", itemIDs, ids)
	if err != nil {
		return places, err
	}
	places.Corpse = supportCountItems(toolRows(rows), stackable, missing)

	restores, err := supportRestoreLedger(scope, toolCharacterNames(characters), since, 1000)
	if err != nil {
		return places, err
	}
	places.Restored = supportRestoredItems(restores, stackable, missing)
	places.RestoredAt = supportRestoredAt(restores, missing)
	skip := []uint{}
	for _, restore := range restores {
		skip = append(skip, restore.parcelIDs()...)
	}
	parcels, err := toolParcelItems(scope.eqemu, ids, skip, "item_id IN ?", itemIDs)
	if err != nil {
		return places, err
	}
	parcelRows := make([]supportInventoryRow, 0, len(parcels))
	for _, parcel := range parcels {
		parcelRows = append(parcelRows, parcel.Row)
	}
	places.Parcel = supportCountItems(parcelRows, stackable, missing)

	bankCols, owner, ok, err := toolSharedBankSchema(scope.eqemu)
	if err != nil {
		return places, err
	}
	if ok {
		rows, err := toolReadItems(scope.eqemu, "sharedbank", owner, bankCols, owner+" = ? AND "+bankCols.Item+" IN ?", accountID, itemIDs)
		if err != nil {
			return places, err
		}
		places.SharedBank = supportCountItems(toolRows(rows), stackable, missing)
	}

	if len(alts) > 0 {
		rows, err := toolReadItems(scope.eqemu, "inventory", invCols.Character, invCols, invCols.Character+" IN ? AND "+invCols.Item+" IN ?", alts, itemIDs)
		if err != nil {
			return places, err
		}
		places.Alt = supportCountItems(toolRows(rows), stackable, missing)
		places.AltNames = supportAltNames(rows, characters, stackable, missing)
	}
	return places, nil
}

type supportItemKey struct {
	ID       uint
	Augments [6]uint
}

// supportMissingItems compares what the character had with what it has. An
// item counts by its stack size when stackable, or once per slot otherwise.
func supportMissingItems(had, has []supportInventoryRow, stackable map[uint]bool) map[supportItemKey][2]int {
	totals := map[supportItemKey][2]int{}
	add := func(rows []supportInventoryRow, side int) {
		for _, row := range rows {
			key := supportItemKey{row.ItemID, row.augments()}
			amount := 1
			if stackable[row.ItemID] && row.Charges > 1 {
				amount = row.Charges
			}
			counts := totals[key]
			counts[side] += amount
			totals[key] = counts
		}
	}
	add(had, 0)
	add(has, 1)
	for key, counts := range totals {
		if counts[0] <= counts[1] {
			delete(totals, key)
		}
	}
	return totals
}

func (p *PlayerSupportController) snapshots(c echo.Context) error {
	scope, view, err := p.recoveryCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	cols, err := supportInventorySchema(scope.eqemu, "inventory_snapshots")
	if err != nil {
		return supportError(c, err)
	}
	type snapshot struct {
		TimeIndex int64 `json:"time_index"`
		Items     int   `json:"items"`
	}
	snapshots := []snapshot{}
	// The table is keyed by time first, so a recent window keeps this off a
	// full scan. EQEmu keeps 30 days of snapshots by default.
	err = scope.eqemu.Table("inventory_snapshots").Select("time_index, COUNT(*) AS items").
		Where("time_index >= ? AND "+cols.Character+" = ?", time.Now().AddDate(0, 0, -30).Unix(), view.CharacterID).
		Group("time_index").Order("time_index DESC").Limit(30).
		Scan(&snapshots).Error
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{"snapshots": snapshots})
}

func (p *PlayerSupportController) snapshotDiff(c echo.Context) error {
	scope, view, err := p.recoveryCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	timeIndex, err := strconv.ParseInt(c.Param("time"), 10, 64)
	if err != nil || timeIndex <= 0 {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid snapshot"))
	}
	snapCols, err := supportInventorySchema(scope.eqemu, "inventory_snapshots")
	if err != nil {
		return supportError(c, err)
	}
	invCols, err := supportInventorySchema(scope.eqemu, "inventory")
	if err != nil {
		return supportError(c, err)
	}
	had, err := supportReadInventory(scope.eqemu, "inventory_snapshots", snapCols,
		snapCols.Character+" = ? AND time_index = ?", view.CharacterID, timeIndex)
	if err != nil {
		return supportError(c, err)
	}
	if len(had) == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusNotFound, "That snapshot is no longer available"))
	}
	has, err := supportReadInventory(scope.eqemu, "inventory", invCols, invCols.Character+" = ?", view.CharacterID)
	if err != nil {
		return supportError(c, err)
	}
	ids := map[uint]bool{}
	for _, row := range append(append([]supportInventoryRow{}, had...), has...) {
		ids[row.ItemID] = true
		for _, augment := range row.augments() {
			if augment > 0 {
				ids[augment] = true
			}
		}
	}
	itemDB := p.db.Get(models.Item{}, c)
	if itemDB == nil || p.connectionID(scope.user) != scope.connectionID {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The active content database changed or is unavailable"))
	}
	items, err := supportItemReferences(itemDB.WithContext(c.Request().Context()), ids)
	if err != nil {
		return supportError(c, err)
	}
	stackable := map[uint]bool{}
	for id, item := range items {
		stackable[id] = item.Stackable != 0
	}
	missing := supportMissingItems(had, has, stackable)
	places, err := supportItemsElsewhere(scope, view, invCols, time.Unix(timeIndex, 0), missing, stackable)
	if err != nil {
		return supportError(c, err)
	}
	accounting := supportAccountMissing(missing, places)
	lines := []supportSnapshotLine{}
	for key, counts := range missing {
		elsewhere := accounting[key]
		line := supportSnapshotLine{Item: items[key.ID], Had: counts[0], Has: counts[1], Elsewhere: elsewhere}
		line.Missing = max(0, counts[0]-counts[1]-elsewhere.total())
		line.Accounted = line.Missing == 0
		if line.Item == nil {
			line.Item = &mailParcelsItemReference{ID: key.ID, Name: fmt.Sprintf("Item %d", key.ID)}
		}
		for i, augment := range key.Augments {
			if augment > 0 {
				line.Augments[i] = items[augment]
			}
		}
		lines = append(lines, line)
	}
	sort.Slice(lines, func(i, j int) bool {
		if lines[i].Item.Name != lines[j].Item.Name {
			return lines[i].Item.Name < lines[j].Item.Name
		}
		return lines[i].Item.ID < lines[j].Item.ID
	})
	return c.JSON(http.StatusOK, echo.Map{"time_index": timeIndex, "snapshot_items": len(had), "missing": lines})
}

func supportItemReferences(db *gorm.DB, ids map[uint]bool) (map[uint]*mailParcelsItemReference, error) {
	result := map[uint]*mailParcelsItemReference{}
	if len(ids) == 0 {
		return result, nil
	}
	list := make([]uint, 0, len(ids))
	for id := range ids {
		list = append(list, id)
	}
	var rows []mailParcelsItemReference
	err := db.Table("items").Select(`id, Name AS name, icon, stackable, stacksize AS stack_size, maxcharges AS max_charges,
		nodrop AS no_drop, bagslots AS bag_slots, bagtype AS bag_type, augtype AS augment_type,
		augslot1type AS augment_slot_1_type, augslot2type AS augment_slot_2_type, augslot3type AS augment_slot_3_type,
		augslot4type AS augment_slot_4_type, augslot5type AS augment_slot_5_type, augslot6type AS augment_slot_6_type,
		evolvinglevel AS evolving_level`).Where("id IN ?", list).Scan(&rows).Error
	for i := range rows {
		result[rows[i].ID] = &rows[i]
	}
	return result, err
}
