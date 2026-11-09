package controllers

import (
	"context"
	"errors"
	"fmt"
	"math"
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
	// The primary bind point is a move preset. Instances are not move targets.
	var bind *supportLocation
	var binds []supportLocation
	if err := scope.eqemu.Table("character_bind").Select("zone_id, instance_id, x, y, z").
		Where("id = ? AND slot = 0", view.CharacterID).Limit(1).Find(&binds).Error; err != nil {
		return supportError(c, err)
	}
	if len(binds) == 1 && binds[0].ZoneID > 0 && binds[0].InstanceID == 0 {
		bind = &binds[0]
	}
	zoneIDs := []int{int(location.ZoneID)}
	if bind != nil {
		zoneIDs = append(zoneIDs, int(bind.ZoneID))
	}
	for _, corpse := range corpses {
		zoneIDs = append(zoneIDs, int(corpse.Location.ZoneID))
	}
	names, err := loadPlayerOperationsZoneNames(zoneDB.WithContext(c.Request().Context()), zoneIDs)
	if err != nil {
		return supportError(c, err)
	}
	location.ZoneName = names[int(location.ZoneID)]
	if bind != nil {
		bind.ZoneName = names[int(bind.ZoneID)]
	}
	for i := range corpses {
		corpses[i].Location.ZoneName = names[int(corpses[i].Location.ZoneID)]
	}
	local := p.localWorld(scope)
	companion := playersupport.CompanionUnknown
	if local {
		companion = p.world.Companion()
	}
	return c.JSON(http.StatusOK, echo.Map{
		"character": location, "corpses": corpses, "local_world": local,
		"companion": companion, "live_destination": local && companion.Moves(), "bind": bind,
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
	// Character moves only: exact coordinates in the destination zone, or
	// another character whose location becomes the destination.
	Coordinates     *supportCoordinates `json:"coordinates"`
	TargetCharacter uint                `json:"target_character"`
}

type supportCoordinates struct {
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
	Z       float64 `json:"z"`
	Heading float64 `json:"heading"`
}

const supportCoordinateLimit = 100000

func (input supportMoveInput) valid() bool {
	if input.SourceZone == 0 || input.SourceZone > 65535 || input.SourceInstance > 65535 ||
		input.Destination > 65535 || input.CorpseID > 1<<32-1 || !supportRequestKey.MatchString(input.RequestID) {
		return false
	}
	switch {
	case input.ToPlayer:
		return input.CorpseID != 0 && input.Destination == 0 && input.Coordinates == nil && input.TargetCharacter == 0
	case input.TargetCharacter != 0:
		return input.CorpseID == 0 && input.Destination == 0 && input.Coordinates == nil
	case input.Coordinates != nil:
		point := input.Coordinates
		for _, value := range []float64{point.X, point.Y, point.Z} {
			if math.IsNaN(value) || math.Abs(value) > supportCoordinateLimit {
				return false
			}
		}
		return input.CorpseID == 0 && input.Destination != 0 && !math.IsNaN(point.Heading) && point.Heading >= 0 && point.Heading < 512
	default:
		return input.Destination != 0
	}
}

// supportMoveDestination resolves another character's position. A live
// position wins over the saved one. Instances are refused because EQEmu
// returns a character that is not a member to the base zone.
func (p *PlayerSupportController) supportMoveDestination(scope supportScope, view supportCaseView, id uint) (*playersupport.MovePosition, string, error) {
	if id == view.CharacterID {
		return nil, "", echo.NewHTTPError(http.StatusBadRequest, "Choose a different character as the destination")
	}
	var target struct {
		AccountID    uint
		Name         string
		ZoneID       uint
		ZoneInstance uint
		X, Y, Z      float64
		Heading      float64
	}
	err := scope.eqemu.Table("character_data").Select("account_id, name, zone_id, zone_instance, x, y, z, heading").
		Where("id = ? AND deleted_at IS NULL", id).Take(&target).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", echo.NewHTTPError(http.StatusConflict, "The destination character is unavailable")
	}
	if err != nil {
		return nil, "", err
	}
	position := &playersupport.MovePosition{
		ZoneID: target.ZoneID, InstanceID: target.ZoneInstance,
		X: float32(target.X), Y: float32(target.Y), Z: float32(target.Z), Heading: float32(target.Heading),
	}
	label := target.Name + "'s last saved location"
	switch status, live := p.world.Locate(id, target.AccountID); status {
	case "located":
		position, label = live, target.Name+"'s current location"
	case "offline":
	case "busy":
		return nil, "", echo.NewHTTPError(http.StatusConflict, target.Name+" is zoning. Try again in a moment.")
	default:
		return nil, "", echo.NewHTTPError(http.StatusServiceUnavailable, "Could not read "+target.Name+"'s location from the game server")
	}
	if position.InstanceID != 0 {
		return nil, "", echo.NewHTTPError(http.StatusConflict, target.Name+" is in an instance. Moves into instances are not supported.")
	}
	if position.ZoneID == 0 {
		return nil, "", echo.NewHTTPError(http.StatusConflict, target.Name+" has no saved zone")
	}
	return position, label, nil
}

func (p *PlayerSupportController) moveRecoveryTarget(c echo.Context) error {
	scope, view, err := p.recoveryCase(c, true)
	if err != nil {
		return supportError(c, err)
	}
	if !p.localWorld(scope) {
		return supportError(c, echo.NewHTTPError(http.StatusServiceUnavailable, "Moves require the local EQEmu World"))
	}
	if companion := p.world.Companion(); companion == playersupport.CompanionMissing {
		return supportError(c, echo.NewHTTPError(http.StatusServiceUnavailable, "Moves need the Player Support patch on World and zones"))
	}
	var input supportMoveInput
	if c.Bind(&input) != nil || !input.valid() {
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
	var position *playersupport.MovePosition
	playerLabel := ""
	if input.TargetCharacter != 0 {
		position, playerLabel, err = p.supportMoveDestination(scope, view, input.TargetCharacter)
		if err != nil {
			return supportError(c, err)
		}
		input.Destination = position.ZoneID
	} else if point := input.Coordinates; point != nil {
		position = &playersupport.MovePosition{
			ZoneID: input.Destination, X: float32(point.X), Y: float32(point.Y), Z: float32(point.Z), Heading: float32(point.Heading),
		}
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
	switch {
	case input.ToPlayer:
		destination = view.Character + "'s current location"
	case destination == "":
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Select a valid destination zone"))
	case position != nil:
		place := fmt.Sprintf("%s at (%.1f, %.1f, %.1f)", destination, position.X, position.Y, position.Z)
		if playerLabel != "" {
			place = playerLabel + " in " + place
		}
		destination = place
	default:
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
			SourceZone: input.SourceZone, SourceInstance: input.SourceInstance, Destination: input.Destination,
			ToPlayer: input.ToPlayer, PlayerPosition: position,
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
