package auditlog

import (
	"errors"
	"fmt"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/discord"
	"github.com/EQEmuTools/spire/internal/http/request"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"github.com/patrickmn/go-cache"
	"os"
)

type UserEvent struct {
	db    *database.Resolver
	cache *cache.Cache
}

func NewUserEvent(
	db *database.Resolver,
	cache *cache.Cache,
) *UserEvent {
	return &UserEvent{
		cache: cache,
		db:    db,
	}
}

const (
	EventServerLock          = "SERVER_LOCK"
	EventServerUpdateRelease = "SERVER_UPDATE_RELEASE"
	EventServerStart         = "SERVER_START"
	EventServerStop          = "SERVER_STOP"
	EventServerRestart       = "SERVER_RESTART"
	EventServerCancelRestart = "SERVER_CANCEL_RESTART"
	EventServerHotReload     = "SERVER_HOT_RELOAD"
	EventServerUpdateConfig  = "SERVER_UPDATE_CONFIG"
)

func (e *UserEvent) LogUserEvent(c echo.Context, eventName string, description string) {
	_, _ = e.logUserEvent(c, eventName, description, false)
}

// LogEditorEvent persists an auditable editor mutation and returns the new
// audit-log identifier. Unlike the legacy best-effort logger, local/default
// development connections are recorded with connection ID 0 so sensitive
// editor operations never succeed without a trace.
func (e *UserEvent) LogEditorEvent(c echo.Context, eventName string, description string) (uint, error) {
	return e.logUserEvent(c, eventName, description, true)
}

// ActiveConnectionID returns the authenticated user's active Spire database
// connection ID. Local/default development sessions use zero.
func (e *UserEvent) ActiveConnectionID(c echo.Context) uint {
	user := request.GetUser(c)
	connectionIdKey := fmt.Sprintf("active-connection-%v", user.ID)
	cachedConn, found := e.cache.Get(connectionIdKey)
	if !found {
		return 0
	}
	connectionID, ok := cachedConn.(uint)
	if !ok {
		return 0
	}
	return connectionID
}

func (e *UserEvent) logUserEvent(
	c echo.Context,
	eventName string,
	description string,
	requirePersisted bool,
) (uint, error) {
	// request user context
	user := request.GetUser(c)

	// create
	var event models.UserEventLog
	event.UserId = user.ID
	event.ServerDatabaseConnectionId = e.ActiveConnectionID(c)

	if event.ServerDatabaseConnectionId == 0 && !requirePersisted {
		return 0, nil
	}
	if e.db.GetSpireDb() == nil {
		if requirePersisted {
			return 0, errors.New("Spire audit database is unavailable")
		}
		return 0, nil
	}

	event.EventName = eventName
	event.Data = description
	if err := e.db.GetSpireDb().Create(&event).Error; err != nil {
		if requirePersisted {
			return 0, err
		}
		return 0, nil
	}

	if event.ServerDatabaseConnectionId > 0 {
		conn := e.db.GetUserConnection(user)
		if len(conn.ServerDatabaseConnection.DiscordWebhookUrl) > 0 {
			// connection webhook
			name := conn.ServerDatabaseConnection.Name
			_ = discord.SendDiscordWebhook(
				conn.ServerDatabaseConnection.DiscordWebhookUrl,
				fmt.Sprintf("[**Spire Audit Log**] [**%v**] [**%v**] %v", name, user.UserName, description),
			)
		}

		// monitor webhook
		if conn.ServerDatabaseConnection.ID > 0 {
			name := conn.ServerDatabaseConnection.Name
			monitor := os.Getenv("DISCORD_MONITOR_URL")
			if len(monitor) > 0 {
				_ = discord.SendDiscordWebhook(
					monitor,
					fmt.Sprintf("[**Spire Audit Log**] [**%v**] [**%v**] %v", name, user.UserName, description),
				)
			}
		}
	}

	return event.ID, nil
}
