package controllers

import (
	"errors"
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
	"tasks":    {"Task Accept", "Task Update", "Task Complete"},
	"chat":     supportChatEvents,
	"hack":     {"Possible Hack"},
}

// supportChatEvents need the "Player Support Chat Logs" grant.
var supportChatEvents = []string{"Say", "Player Speech"}

// supportEventPageSize keeps each page of the timeline quick to read and load.
const supportEventPageSize = 50

// supportEventQuery selects the timeline's events for characters since a
// Unix time. Without the chat grant, chat is refused as a group and left out
// of every other view.
func supportEventQuery(db *gorm.DB, characters []uint, since int64, group string, canReadChat bool) (*gorm.DB, error) {
	if group == "chat" && !canReadChat {
		return nil, echo.NewHTTPError(http.StatusForbidden, "Chat log access is required")
	}
	// Both times are server-local, so compare inside the database.
	query := db.Table("player_event_logs AS e").
		Where("e.character_id IN ? AND e.created_at >= FROM_UNIXTIME(?)", characters, since)
	if names, ok := supportEventGroups[group]; ok {
		query = query.Where("e.event_type_name IN ?", names)
	}
	if !canReadChat {
		query = query.Where("e.event_type_name NOT IN ?", supportChatEvents)
	}
	return query, nil
}

type supportEventSubject struct {
	Kind string `json:"kind"`
	Name string `json:"name"`
}

// supportReportedPlayer reads the case's reported player. A case that was
// never stored has none.
func supportReportedPlayer(scope supportScope, view supportCaseView) (uint, string, error) {
	if view.ID == 0 {
		return 0, "", nil
	}
	var subject struct {
		SubjectCharacterID uint
		SubjectCharacter   string
	}
	err := scope.spire.Table("spire_player_support_cases").Select("subject_character_id, subject_character").
		Where("id = ?", view.ID).Take(&subject).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = nil
	}
	return subject.SubjectCharacterID, subject.SubjectCharacter, err
}

// supportEventCharacters resolves whose events the timeline shows: every
// character of the petitioning account, or the reported player.
func supportEventCharacters(scope supportScope, view supportCaseView, kind string, accountID uint) ([]uint, supportEventSubject, error) {
	if kind == "reported" {
		id, name, err := supportReportedPlayer(scope, view)
		if err != nil {
			return nil, supportEventSubject{}, err
		}
		if id == 0 {
			return nil, supportEventSubject{}, echo.NewHTTPError(http.StatusConflict, "Set a reported player first")
		}
		return []uint{id}, supportEventSubject{Kind: "reported", Name: name}, nil
	}
	subject := supportEventSubject{Kind: "petitioner", Name: view.Account}
	// player_event_logs is indexed by character, not account, so look up the
	// account's characters first.
	var characters []uint
	if accountID > 0 {
		if err := scope.eqemu.Table("character_data").Where("account_id = ?", accountID).Pluck("id", &characters).Error; err != nil {
			return nil, subject, err
		}
	}
	return characters, subject, nil
}

// supportSpeechLogging reports whether EQEmu records each chat event. It is
// nil when the settings table is missing.
func supportSpeechLogging(db *gorm.DB) (map[string]bool, error) {
	columns, err := toolColumns(db, "player_event_log_settings")
	if err != nil || !columns["event_name"] || !columns["event_enabled"] {
		return nil, err
	}
	var settings []struct {
		EventName    string
		EventEnabled int
	}
	if err := db.Table("player_event_log_settings").Select("event_name, event_enabled").
		Where("event_name IN ?", supportChatEvents).Scan(&settings).Error; err != nil {
		return nil, err
	}
	logging := map[string]bool{"say": false, "player_speech": false}
	for _, setting := range settings {
		switch setting.EventName {
		case "Say":
			logging["say"] = setting.EventEnabled != 0
		case "Player Speech":
			logging["player_speech"] = setting.EventEnabled != 0
		}
	}
	return logging, nil
}

func (p *PlayerSupportController) events(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/player_event_logs", false) {
		return supportError(c, echo.NewHTTPError(http.StatusForbidden, "Player Event Logs access is required"))
	}
	group := c.QueryParam("group")
	canReadChat := scope.connectionID == 0 ||
		p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/player-support-chat-logs", false)
	if group == "chat" && !canReadChat {
		return supportError(c, echo.NewHTTPError(http.StatusForbidden, "Chat log access is required"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	hours, _ := strconv.Atoi(c.QueryParam("hours"))
	if hours != 6 && hours != 72 && hours != 168 {
		hours = 24
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	characters, subject, err := supportEventCharacters(scope, view, c.QueryParam("subject"), accountID)
	if err != nil {
		return supportError(c, err)
	}
	events := []supportEvent{}
	var total, newer int64
	if len(characters) > 0 {
		query, err := supportEventQuery(scope.eqemu, characters, view.SubmittedAt-int64(hours)*3600, group, canReadChat)
		if err != nil {
			return supportError(c, err)
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
	response := echo.Map{
		"events": events, "hours": hours, "group": group, "filed_at": view.SubmittedAt,
		"page": page, "page_size": supportEventPageSize, "total": total, "newer": newer, "subject": subject,
	}
	if group == "chat" {
		logging, err := supportSpeechLogging(scope.eqemu)
		if err != nil {
			return supportError(c, err)
		}
		if logging != nil {
			response["logging"] = logging
		}
	}
	// Every page that shows chat is recorded, whichever group or page asked
	// for it; toolViewEntry keeps it to once an hour per GM.
	if supportShowsChat(group, events) {
		text := "Opened chat logs for " + view.Account + "'s characters"
		if subject.Kind == "reported" {
			text = "Opened chat logs for " + subject.Name
		}
		if err := toolViewEntry(scope, view, "chat_view", text, true); err != nil {
			return supportError(c, err)
		}
	}
	return c.JSON(http.StatusOK, response)
}

// supportShowsChat reports whether a timeline response discloses chat: the
// Chat group itself, or chat events in another view such as "All".
func supportShowsChat(group string, events []supportEvent) bool {
	if group == "chat" {
		return true
	}
	for _, event := range events {
		for _, name := range supportChatEvents {
			if event.EventTypeName == name {
				return true
			}
		}
	}
	return false
}
