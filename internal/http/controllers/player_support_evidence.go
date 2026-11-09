package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// ---------------------------------------------------------------------------
// Evidence timeline: the petitioning account's player events around the time
// the petition was filed.

type supportEvent struct {
	ID            int64     `json:"id"`
	CharacterID   int64     `json:"character_id"`
	Character     string    `json:"character"`
	ZoneID        int       `json:"zone_id"`
	EventTypeID   int       `json:"event_type_id"`
	EventTypeName string    `json:"event_type_name"`
	EventData     string    `json:"event_data"`
	CreatedAt     time.Time `json:"created_at"`
}

// supportEventGroups narrows the timeline by EQEmu's event names, which stay
// stable across versions where the numeric IDs may not.
var supportEventGroups = map[string][]string{
	"items": {
		"Trade", "Loot Item", "Item Destroy", "Dropped Item", "Merchant Purchase", "Merchant Sell",
		"Parcel Item Sent", "Parcel Item Retrieved", "Parcel Prune Routine", "NPC Handin", "Trader Purchase",
		"Trader Sell", "Groundspawn Pickup", "Combine Success", "Combine Failure", "Item Creation",
		"Barter Transaction", "Guild Bank Item Deposit", "Guild Bank Item Withdrawal", "Split Money",
	},
	"deaths":   {"Death", "Rez Accepted"},
	"movement": {"Zoning"},
	"gm":       {"GM Command"},
}

// supportEventPageSize keeps each page of the timeline quick to read and load.
const supportEventPageSize = 50

func (p *PlayerSupportController) events(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/player_event_logs", false) {
		return supportError(c, echo.NewHTTPError(http.StatusForbidden, "Player Event Logs access is required"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	hours, _ := strconv.Atoi(c.QueryParam("hours"))
	if hours != 6 && hours != 72 && hours != 168 {
		hours = 24
	}
	group := c.QueryParam("group")
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	events := []supportEvent{}
	var total, newer int64
	// player_event_logs is indexed by character, not account, so look up the
	// account's characters first.
	var characters []uint
	if accountID > 0 {
		if err := scope.eqemu.Table("character_data").Where("account_id = ?", accountID).Pluck("id", &characters).Error; err != nil {
			return supportError(c, err)
		}
	}
	if len(characters) > 0 {
		// Both times are server-local, so compare inside the database.
		query := scope.eqemu.Table("player_event_logs AS e").
			Where("e.character_id IN ? AND e.created_at >= FROM_UNIXTIME(?)", characters, view.SubmittedAt-int64(hours)*3600)
		if names, ok := supportEventGroups[group]; ok {
			query = query.Where("e.event_type_name IN ?", names)
		}
		if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
			return supportError(c, err)
		}
		// The page places the "Petition filed" marker after this many events.
		if err := query.Session(&gorm.Session{}).Where("e.created_at >= FROM_UNIXTIME(?)", view.SubmittedAt).
			Count(&newer).Error; err != nil {
			return supportError(c, err)
		}
		pages := int((total + supportEventPageSize - 1) / supportEventPageSize)
		if page > pages && pages > 0 {
			page = pages
		}
		if err := query.Session(&gorm.Session{}).
			Select("e.id, COALESCE(e.character_id, 0) AS character_id, COALESCE(ch.name, '') AS `character`, " +
				"COALESCE(e.zone_id, 0) AS zone_id, COALESCE(e.event_type_id, 0) AS event_type_id, " +
				"COALESCE(e.event_type_name, '') AS event_type_name, COALESCE(e.event_data, '') AS event_data, e.created_at").
			Joins("LEFT JOIN character_data AS ch ON ch.id = e.character_id").
			Order("e.created_at DESC, e.id DESC").Offset((page - 1) * supportEventPageSize).
			Limit(supportEventPageSize).Scan(&events).Error; err != nil {
			return supportError(c, err)
		}
	}
	return c.JSON(http.StatusOK, echo.Map{
		"events": events, "hours": hours, "group": group, "filed_at": view.SubmittedAt,
		"page": page, "page_size": supportEventPageSize, "total": total, "newer": newer,
	})
}
