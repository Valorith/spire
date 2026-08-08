package controllers

import (
	"net/http"
	"sync"
	"time"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

const (
	achievementEditorGraphBodyLimit    = "2M"
	achievementEditorMutationBodyLimit = "128K"
	achievementEditorDefaultLimit      = 40
	achievementEditorMaximumLimit      = 200
	achievementEditorMaximumPage       = 100000
	achievementEditorLookupLimit       = 100
)

// AchievementEditorController owns both the content-authoring API and the
// separately permissioned character-state administration API. Keeping them in
// one controller lets the two surfaces share the exact same schema diagnostics
// and metadata without ever joining the content and character databases.
type AchievementEditorController struct {
	db          *database.Resolver
	auditLog    *auditlog.UserEvent
	schemaMu    sync.Mutex
	schemaCache map[string]achievementEditorSchemaCacheEntry
}

func NewAchievementEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *AchievementEditorController {
	return &AchievementEditorController{
		db: db, auditLog: auditLog,
		schemaCache: make(map[string]achievementEditorSchemaCacheEntry),
	}
}

type achievementEditorSchemaCacheEntry struct {
	diagnostics achievementEditorSchemaArea
	expiresAt   time.Time
}

func (a *AchievementEditorController) Routes() []*routes.Route {
	graphLimit := []echo.MiddlewareFunc{middleware.BodyLimit(achievementEditorGraphBodyLimit)}
	mutationLimit := []echo.MiddlewareFunc{middleware.BodyLimit(achievementEditorMutationBodyLimit)}
	return []*routes.Route{
		// Definition, category, and authoring support.
		routes.RegisterRoute(http.MethodGet, "achievement-editor/metadata", a.metadata, nil),
		routes.RegisterRoute(http.MethodGet, "achievement-editor/schema", a.definitionSchema, nil),
		routes.RegisterRoute(http.MethodGet, "achievement-editor/definitions", a.listDefinitions, nil),
		routes.RegisterRoute(http.MethodGet, "achievement-editor/definition/:id", a.getDefinition, nil),
		routes.RegisterRoute(http.MethodPut, "achievement-editor/definition", a.createDefinition, graphLimit),
		routes.RegisterRoute(http.MethodPatch, "achievement-editor/definition/:id", a.updateDefinition, graphLimit),
		routes.RegisterRoute(http.MethodPut, "achievement-editor/definition/:id/clone", a.cloneDefinition, graphLimit),
		routes.RegisterRoute(http.MethodDelete, "achievement-editor/definition/:id", a.deleteDefinition, mutationLimit),
		routes.RegisterRoute(http.MethodGet, "achievement-editor/categories", a.listCategories, nil),
		routes.RegisterRoute(http.MethodGet, "achievement-editor/category/:id", a.getCategory, nil),
		routes.RegisterRoute(http.MethodPut, "achievement-editor/category", a.createCategory, mutationLimit),
		routes.RegisterRoute(http.MethodPatch, "achievement-editor/category/:id", a.updateCategory, mutationLimit),
		routes.RegisterRoute(http.MethodDelete, "achievement-editor/category/:id", a.deleteCategory, mutationLimit),
		routes.RegisterRoute(http.MethodGet, "achievement-editor/lookups/:kind", a.lookup, nil),
		routes.RegisterRoute(http.MethodGet, "achievement-editor/audit", a.definitionAudit, nil),

		// Character state is a separate permission resource because these actions
		// can change durable player progress and reward retry state.
		routes.RegisterRoute(http.MethodGet, "character-achievement-editor/metadata", a.metadata, nil),
		routes.RegisterRoute(http.MethodGet, "character-achievement-editor/schema", a.characterSchema, nil),
		routes.RegisterRoute(http.MethodGet, "character-achievement-editor/characters", a.listAchievementCharacters, nil),
		routes.RegisterRoute(http.MethodGet, "character-achievement-editor/character/:id", a.getCharacterAchievements, nil),
		routes.RegisterRoute(http.MethodGet, "character-achievement-editor/character/:id/audit", a.characterAudit, nil),
		routes.RegisterRoute(http.MethodPatch, "character-achievement-editor/character/:id/progress", a.setCharacterProgress, mutationLimit),
		routes.RegisterRoute(http.MethodPatch, "character-achievement-editor/character/:id/complete", a.completeCharacterAchievement, mutationLimit),
		routes.RegisterRoute(http.MethodPatch, "character-achievement-editor/character/:id/reset", a.resetCharacterAchievement, mutationLimit),
		routes.RegisterRoute(http.MethodPatch, "character-achievement-editor/character/:id/reward/retry", a.retryCharacterReward, mutationLimit),
		routes.RegisterRoute(http.MethodPatch, "character-achievement-editor/character/:id/selection/retry", a.retryCharacterSelection, mutationLimit),
		routes.RegisterRoute(http.MethodPatch, "character-achievement-editor/character/:id/mutation/retry", a.retryCharacterMutation, mutationLimit),
		routes.RegisterRoute(http.MethodDelete, "character-achievement-editor/character/:id/mutation", a.discardCharacterMutation, mutationLimit),
	}
}
