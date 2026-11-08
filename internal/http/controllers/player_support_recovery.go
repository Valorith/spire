package controllers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type supportLocation struct {
	ZoneID     uint    `json:"zone_id"`
	InstanceID uint    `json:"instance_id"`
	ZoneName   string  `json:"zone_name" gorm:"-"`
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	Z          float64 `json:"z"`
}

type supportCorpse struct {
	Location    supportLocation `json:"location" gorm:"embedded"`
	ID          uint            `json:"id"`
	TimeOfDeath time.Time       `json:"time_of_death"`
	Buried      bool            `json:"buried" gorm:"column:is_buried"`
	Rezzed      bool            `json:"rezzed" gorm:"column:is_rezzed"`
	Rezzable    bool            `json:"rezzable"`
	ItemCount   uint            `json:"item_count"`
	Platinum    uint            `json:"platinum"`
	Gold        uint            `json:"gold"`
	Silver      uint            `json:"silver"`
	Copper      uint            `json:"copper"`
}

type supportCorpseItem struct {
	ID      uint   `json:"id" gorm:"column:item_id"`
	Slot    uint   `json:"slot" gorm:"column:equip_slot"`
	Charges int    `json:"charges"`
	Name    string `json:"name" gorm:"-"`
	Icon    int    `json:"icon" gorm:"-"`
}

func (p *PlayerSupportController) recoveryCase(c echo.Context, write bool) (supportScope, supportCaseView, error) {
	scope, err := p.scope(c, false)
	if err != nil {
		return scope, supportCaseView{}, err
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/player-operations/character/0/relocate", write) {
		return scope, supportCaseView{}, echo.NewHTTPError(http.StatusForbidden, "Player Operations access is required")
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err == nil && (view.CharacterID == 0 || (write && (view.CheckedOut || view.Status == "resolved"))) {
		err = echo.NewHTTPError(http.StatusConflict, "The petition cannot be used for this character operation")
	}
	return scope, view, err
}

func supportCharacterLocation(db *gorm.DB, view supportCaseView) (supportLocation, uint, error) {
	var character struct {
		Location  supportLocation `gorm:"embedded"`
		AccountID uint
	}
	err := db.Table("character_data AS ch").Select("ch.account_id, ch.zone_id, ch.zone_instance AS instance_id, ch.x, ch.y, ch.z").
		Joins("JOIN account AS acct ON acct.id = ch.account_id").
		Where("ch.id = ? AND ch.name = ? AND acct.name = ? AND ch.deleted_at IS NULL", view.CharacterID, view.Character, view.Account).
		Take(&character).Error
	return character.Location, character.AccountID, err
}

func (p *PlayerSupportController) recovery(c echo.Context) error {
	scope, view, err := p.recoveryCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	location, _, err := supportCharacterLocation(scope.eqemu, view)
	if err != nil {
		return supportError(c, err)
	}
	corpses := []supportCorpse{}
	err = scope.eqemu.Table("character_corpses AS corpses").
		Select(`id, zone_id, instance_id, x, y, z, time_of_death,
			COALESCE(is_buried, 0) AS is_buried, COALESCE(is_rezzed, 0) AS is_rezzed, COALESCE(rezzable, 0) AS rezzable,
			COALESCE(platinum, 0) AS platinum, COALESCE(gold, 0) AS gold,
			COALESCE(silver, 0) AS silver, COALESCE(copper, 0) AS copper,
			(SELECT COUNT(*) FROM character_corpse_items WHERE corpse_id = corpses.id) AS item_count`).
		Where("charid = ?", view.CharacterID).Order("time_of_death DESC, id DESC").Find(&corpses).Error
	if err != nil {
		return supportError(c, err)
	}
	zoneDB := p.db.Get(models.Zone{}, c)
	if zoneDB == nil || p.connectionID(scope.user) != scope.connectionID {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The active content database changed or is unavailable"))
	}
	zoneIDs := []int{int(location.ZoneID)}
	for _, corpse := range corpses {
		zoneIDs = append(zoneIDs, int(corpse.Location.ZoneID))
	}
	names, err := loadPlayerOperationsZoneNames(zoneDB.WithContext(c.Request().Context()), zoneIDs)
	if err != nil {
		return supportError(c, err)
	}
	location.ZoneName = names[int(location.ZoneID)]
	for i := range corpses {
		corpses[i].Location.ZoneName = names[int(corpses[i].Location.ZoneID)]
	}
	local := p.localWorld(scope)
	return c.JSON(http.StatusOK, echo.Map{
		"character": location, "corpses": corpses, "local_world": local, "live_destination": local,
	})
}

func (p *PlayerSupportController) corpseContents(c echo.Context) error {
	scope, view, err := p.recoveryCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	id, err := strconv.ParseUint(c.Param("corpse"), 10, 32)
	if err != nil || id == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid corpse reference"))
	}
	items := []supportCorpseItem{}
	err = scope.eqemu.Table("character_corpse_items AS loot").
		Select("COALESCE(loot.item_id, 0) AS item_id, loot.equip_slot, COALESCE(loot.charges, 0) AS charges").
		Joins("JOIN character_corpses AS corpse ON corpse.id = loot.corpse_id AND corpse.charid = ?", view.CharacterID).
		Where("loot.corpse_id = ?", id).Order("loot.equip_slot").Find(&items).Error
	if err != nil {
		return supportError(c, err)
	}
	if len(items) > 0 {
		itemDB := p.db.Get(models.Item{}, c)
		if itemDB == nil || p.connectionID(scope.user) != scope.connectionID {
			return supportError(c, echo.NewHTTPError(http.StatusConflict, "The active content database changed or is unavailable"))
		}
		ids := make([]uint, 0, len(items))
		for _, item := range items {
			ids = append(ids, item.ID)
		}
		details, err := loadMailParcelsItems(itemDB.WithContext(c.Request().Context()), ids)
		if err != nil {
			return supportError(c, err)
		}
		for i := range items {
			item := details[items[i].ID]
			items[i].Name, items[i].Icon = item.Name, item.Icon
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"items": items})
}

type supportMoveInput struct {
	CorpseID       uint   `json:"corpse_id"`
	SourceZone     uint   `json:"source_zone"`
	SourceInstance uint   `json:"source_instance"`
	Destination    uint   `json:"destination"`
	ToPlayer       bool   `json:"to_player"`
	Reason         string `json:"reason"`
	RequestID      string `json:"request_id"`
}

func (p *PlayerSupportController) moveRecoveryTarget(c echo.Context) error {
	scope, view, err := p.recoveryCase(c, true)
	if err != nil {
		return supportError(c, err)
	}
	if !p.localWorld(scope) {
		return supportError(c, echo.NewHTTPError(http.StatusServiceUnavailable, "Moves require the local EQEmu World"))
	}
	var input supportMoveInput
	if c.Bind(&input) != nil || input.SourceZone == 0 || input.SourceZone > 65535 ||
		input.SourceInstance > 65535 || input.Destination > 65535 ||
		(input.ToPlayer && (input.CorpseID == 0 || input.Destination != 0)) ||
		(!input.ToPlayer && input.Destination == 0) ||
		input.CorpseID > 1<<32-1 || !supportRequestKey.MatchString(input.RequestID) {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid move request"))
	}
	if err := validatePlayerOperationsReason(input.Reason); err != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, err.Error()))
	}
	location, accountID, err := supportCharacterLocation(scope.eqemu, view)
	if err == nil && input.CorpseID != 0 {
		err = scope.eqemu.Table("character_corpses").Select("zone_id, instance_id, x, y, z").
			Where("id = ? AND charid = ? AND is_buried = 0", input.CorpseID, view.CharacterID).Take(&location).Error
	}
	if errors.Is(err, gorm.ErrRecordNotFound) || (err == nil &&
		(location.ZoneID != input.SourceZone || location.InstanceID != input.SourceInstance)) {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The target moved or is unavailable. Refresh and try again."))
	}
	if err != nil {
		return supportError(c, err)
	}
	zoneDB := p.db.Get(models.Zone{}, c)
	if zoneDB == nil || p.connectionID(scope.user) != scope.connectionID {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The active content database changed or is unavailable"))
	}
	names, err := loadPlayerOperationsZoneNames(zoneDB.WithContext(c.Request().Context()), []int{int(input.SourceZone), int(input.Destination)})
	if err != nil {
		return supportError(c, err)
	}
	destination := names[int(input.Destination)]
	if input.ToPlayer {
		destination = view.Character + "'s current location"
	} else if destination == "" {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Select a valid destination zone"))
	} else {
		destination += " safe point"
	}
	source := names[int(input.SourceZone)]
	if source == "" {
		source = fmt.Sprintf("Zone #%d", input.SourceZone)
	}
	if input.SourceInstance != 0 {
		source += fmt.Sprintf(" (instance #%d)", input.SourceInstance)
	}
	target, kind := view.Character, "character_move"
	if input.CorpseID != 0 {
		target, kind = fmt.Sprintf("Corpse #%d", input.CorpseID), "corpse_move"
	}
	entry := models.PlayerSupportEntry{
		Kind: kind, Actor: supportActor(scope.user), Delivery: "pending",
		Text: fmt.Sprintf("%s from %s at (%.1f, %.1f, %.1f) to %s\n%s",
			target, source, location.X, location.Y, location.Z, destination, strings.TrimSpace(input.Reason)),
	}
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		if record.Status == "resolved" {
			return echo.NewHTTPError(http.StatusConflict, "Reopen the case before moving a character or corpse")
		}
		key := fmt.Sprintf("move-%d-%s", record.ID, input.RequestID)
		entry.ID, entry.CaseID, entry.RequestKey = 0, record.ID, &key
		err = tx.Create(&entry).Error
		var duplicate *mysql.MySQLError
		if errors.As(err, &duplicate) && duplicate.Number == 1062 {
			return echo.NewHTTPError(http.StatusConflict, "This move was already recorded. Check the petition history.")
		}
		return err
	})
	if err != nil {
		return supportError(c, err)
	}
	status := "connection_changed"
	if p.connectionID(scope.user) == scope.connectionID {
		status = p.world.Move(playersupport.MoveTarget{
			CharacterID: view.CharacterID, AccountID: accountID, CorpseID: input.CorpseID,
			SourceZone: input.SourceZone, SourceInstance: input.SourceInstance, Destination: input.Destination, ToPlayer: input.ToPlayer,
		})
	}
	delivery, message := supportMoveResult(status, input.CorpseID != 0)
	auditContext, cancel := context.WithTimeout(context.WithoutCancel(c.Request().Context()), 3*time.Second)
	defer cancel()
	update := scope.spire.WithContext(auditContext).Model(&entry).Updates(map[string]interface{}{
		"delivery": delivery, "text": entry.Text + "\n" + message,
	})
	if update.Error != nil || update.RowsAffected != 1 {
		return c.JSON(http.StatusAccepted, echo.Map{"status": "unconfirmed", "message": "Check the target location before retrying. The move receipt could not be updated."})
	}
	if delivery == "failed" {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, message))
	}
	return c.JSON(http.StatusOK, echo.Map{"status": status, "message": message})
}

func supportMoveResult(status string, corpse bool) (string, string) {
	switch status {
	case "moved_notified":
		return "sent", "Corpse moved and player notified."
	case "moved_notice_unavailable":
		return "sent", "Corpse arrived. The player was unavailable for the notice."
	case "moved_arrival_unconfirmed":
		return "unconfirmed", "Corpse position saved. The server could not confirm its arrival or notify the player."
	case "saved":
		if !corpse {
			return "sent", "Saved position updated. The player will be notified when they enter the game."
		}
		return "sent", "Saved position updated."
	case "moved":
		if corpse {
			return "sent", "Corpse moved."
		}
		return "sent", "Character moved."
	case "requested":
		return "sent", "Move requested in game."
	case "busy":
		return "failed", "The character is zoning or the corpse is being looted. Try again when it is available."
	case "offline":
		return "failed", "The petitioning character must be in game to move a corpse to their location."
	case "stale":
		return "failed", "The target moved or is unavailable. Refresh and try again."
	case "unavailable":
		return "failed", "The move requires an available World and zone with the Player Support patch."
	case "connection_changed":
		return "failed", "The active server changed. Refresh Player Support."
	default:
		return "unconfirmed", "The server did not confirm the move. Check the target location before retrying."
	}
}
