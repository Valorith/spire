package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
)

// ---------------------------------------------------------------------------
// Flags: zone flags, keys, data buckets and quest globals, read only, and a
// data bucket cache reload for after an edit in the Data Buckets editor.

const supportFlagLimit = 200

type supportZoneFlag struct {
	ZoneID   int    `json:"zone_id"`
	ZoneName string `json:"zone_name"`
}

type supportKey struct {
	ItemID uint   `json:"item_id"`
	Name   string `json:"name"`
}

type supportBucket struct {
	ID        uint64     `json:"id"`
	Key       string     `json:"key"`
	Value     string     `json:"value"`
	ExpiresAt *time.Time `json:"expires_at"`
	Scope     string     `json:"scope"`
}

type supportQuestGlobal struct {
	Name      string     `json:"name"`
	Value     string     `json:"value"`
	NpcID     int        `json:"npc_id"`
	ZoneID    int        `json:"zone_id"`
	ExpiresAt *time.Time `json:"expires_at"`
}

func (p *PlayerSupportController) flags(c echo.Context) error {
	scope, view, err := p.toolCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	zoneFlags := []supportZoneFlag{}
	keys := []supportKey{}
	buckets := []supportBucket{}
	globals := []supportQuestGlobal{}

	if columns, err := toolColumns(scope.eqemu, "zone_flags"); err != nil {
		return supportError(c, err)
	} else if columns["zoneid"] {
		if err := scope.eqemu.Table("zone_flags").Select("zoneID AS zone_id").Where("charID = ?", view.CharacterID).
			Order("zoneID").Limit(supportFlagLimit).Scan(&zoneFlags).Error; err != nil {
			return supportError(c, err)
		}
	}
	if len(zoneFlags) > 0 {
		zoneDB, err := p.toolContentDB(c, scope, models.Zone{})
		if err != nil {
			return supportError(c, err)
		}
		ids := make([]int, 0, len(zoneFlags))
		for _, flag := range zoneFlags {
			ids = append(ids, flag.ZoneID)
		}
		names, err := loadPlayerOperationsZoneNames(zoneDB, ids)
		if err != nil {
			return supportError(c, err)
		}
		for i := range zoneFlags {
			zoneFlags[i].ZoneName = names[zoneFlags[i].ZoneID]
		}
	}

	if columns, err := toolColumns(scope.eqemu, "keyring"); err != nil {
		return supportError(c, err)
	} else if columns["char_id"] {
		if err := scope.eqemu.Table("keyring").Select("item_id").Where("char_id = ?", view.CharacterID).
			Order("item_id").Limit(supportFlagLimit).Scan(&keys).Error; err != nil {
			return supportError(c, err)
		}
	}
	if len(keys) > 0 {
		itemDB, err := p.toolContentDB(c, scope, models.Item{})
		if err != nil {
			return supportError(c, err)
		}
		ids := make([]uint, 0, len(keys))
		for _, key := range keys {
			ids = append(ids, key.ItemID)
		}
		items, err := loadMailParcelsItems(itemDB, ids)
		if err != nil {
			return supportError(c, err)
		}
		for i := range keys {
			keys[i].Name = items[keys[i].ItemID].Name
		}
	}

	if columns, err := toolColumns(scope.eqemu, "data_buckets"); err != nil {
		return supportError(c, err)
	} else if columns["key"] {
		var rows []struct {
			ID          uint64
			Key         string
			Value       string
			Expires     int64
			CharacterID uint
		}
		legacy := !columns["character_id"] || !columns["account_id"]
		selects := "id, `key`, COALESCE(`value`, '') AS value, COALESCE(expires, 0) AS expires"
		query := scope.eqemu.Table("data_buckets")
		if legacy {
			// Older servers scope character buckets by a "<character id>-" key prefix.
			query = query.Where("`key` LIKE ?", strconv.FormatUint(uint64(view.CharacterID), 10)+"-%")
		} else {
			selects += ", character_id"
			query = query.Where("(character_id = ? OR (account_id = ? AND account_id > 0))", view.CharacterID, accountID)
		}
		if err := query.Select(selects).Order("`key`, id").Limit(supportFlagLimit).Scan(&rows).Error; err != nil {
			return supportError(c, err)
		}
		for _, row := range rows {
			bucket := supportBucket{ID: row.ID, Key: row.Key, Value: toolCut(row.Value, 200), ExpiresAt: supportUnix(row.Expires), Scope: "account"}
			if legacy || row.CharacterID == view.CharacterID {
				bucket.Scope = "character"
			}
			buckets = append(buckets, bucket)
		}
	}

	if columns, err := toolColumns(scope.eqemu, "quest_globals"); err != nil {
		return supportError(c, err)
	} else if columns["charid"] {
		var rows []struct {
			Name    string
			Value   string
			Npcid   int
			Zoneid  int
			Expdate int64
		}
		if err := scope.eqemu.Table("quest_globals").
			Select("name, COALESCE(value, '') AS value, COALESCE(npcid, 0) AS npcid, COALESCE(zoneid, 0) AS zoneid, COALESCE(expdate, 0) AS expdate").
			Where("charid = ?", view.CharacterID).Order("name").Limit(supportFlagLimit).Scan(&rows).Error; err != nil {
			return supportError(c, err)
		}
		for _, row := range rows {
			globals = append(globals, supportQuestGlobal{
				Name: row.Name, Value: toolCut(row.Value, 200), NpcID: row.Npcid, ZoneID: row.Zoneid, ExpiresAt: supportUnix(row.Expdate),
			})
		}
	}
	return c.JSON(http.StatusOK, echo.Map{
		"zone_flags": zoneFlags, "keys": keys, "buckets": buckets, "quest_globals": globals, "local_world": p.localWorld(scope),
	})
}

func (p *PlayerSupportController) reloadBucketCache(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/data-bucket-editor", true) {
		return supportError(c, echo.NewHTTPError(http.StatusForbidden, "Data Buckets editor write access is required"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	if !p.localWorld(scope) {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Reloading the game cache needs the game server this Spire runs beside"))
	}
	accountID, err := supportAccountID(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	if err := p.toolAudit(c, view, "PLAYER_SUPPORT_BUCKET_CACHE", "bucket_cache",
		"Reloaded the data bucket cache", accountID, map[string]interface{}{"reload_type": 7}); err != nil {
		return supportError(c, err)
	}
	if p.world.ReloadBucketCache() != "sent" {
		return supportError(c, echo.NewHTTPError(http.StatusServiceUnavailable, "World did not accept the reload."))
	}
	return c.JSON(http.StatusOK, echo.Map{"status": "sent", "message": "Zones will read data buckets from the database again."})
}
