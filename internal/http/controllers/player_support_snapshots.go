package controllers

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
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
	lines := []supportSnapshotLine{}
	for key, counts := range supportMissingItems(had, has, stackable) {
		line := supportSnapshotLine{Item: items[key.ID], Had: counts[0], Has: counts[1], Missing: counts[0] - counts[1]}
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
