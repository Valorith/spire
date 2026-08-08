package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

const (
	achievementEditorEventDefinitionCreate = "ACHIEVEMENT_DEFINITION_CREATE"
	achievementEditorEventDefinitionUpdate = "ACHIEVEMENT_DEFINITION_UPDATE"
	achievementEditorEventDefinitionClone  = "ACHIEVEMENT_DEFINITION_CLONE"
	achievementEditorEventDefinitionDelete = "ACHIEVEMENT_DEFINITION_DELETE"
	achievementEditorEventCategoryCreate   = "ACHIEVEMENT_CATEGORY_CREATE"
	achievementEditorEventCategoryUpdate   = "ACHIEVEMENT_CATEGORY_UPDATE"
	achievementEditorEventCategoryDelete   = "ACHIEVEMENT_CATEGORY_DELETE"

	achievementEditorEventProgressSet     = "CHARACTER_ACHIEVEMENT_PROGRESS_SET"
	achievementEditorEventForceComplete   = "CHARACTER_ACHIEVEMENT_FORCE_COMPLETE"
	achievementEditorEventReset           = "CHARACTER_ACHIEVEMENT_RESET"
	achievementEditorEventRewardRetry     = "CHARACTER_ACHIEVEMENT_REWARD_RETRY"
	achievementEditorEventSelectionRetry  = "CHARACTER_ACHIEVEMENT_SELECTION_RETRY"
	achievementEditorEventMutationRetry   = "CHARACTER_ACHIEVEMENT_MUTATION_RETRY"
	achievementEditorEventMutationDiscard = "CHARACTER_ACHIEVEMENT_MUTATION_DISCARD"
)

func (a *AchievementEditorController) metadata(c echo.Context) error {
	return c.JSON(http.StatusOK, getAchievementEditorMetadata())
}

func (a *AchievementEditorController) definitionSchema(c echo.Context) error {
	content := a.inspectAchievementSchema(a.contentDB(c), "content", achievementEditorContentSchemaSpec(), achievementEditorRefreshSchema(c))
	diagnostics := achievementEditorSchemaDiagnostics{
		Ready:     content.Ready,
		Content:   content,
		Character: achievementEditorSchemaArea{Ready: false, Tables: make(map[string]achievementEditorSchemaTable), Issues: make([]achievementEditorSchemaIssue, 0)},
	}
	return c.JSON(http.StatusOK, diagnostics)
}

func (a *AchievementEditorController) characterSchema(c echo.Context) error {
	refresh := achievementEditorRefreshSchema(c)
	content := a.inspectAchievementSchema(a.contentDB(c), "content", achievementEditorContentSchemaSpec(), refresh)
	character := a.inspectAchievementSchema(a.characterDB(c), "character", achievementEditorCharacterSchemaSpec(), refresh)
	diagnostics := achievementEditorSchemaDiagnostics{Ready: content.Ready && character.Ready, Content: content, Character: character}
	return c.JSON(http.StatusOK, diagnostics)
}

func (a *AchievementEditorController) requireContentSchema(c echo.Context) error {
	diagnostics := a.inspectAchievementSchema(a.contentDB(c), "content", achievementEditorContentSchemaSpec(), false)
	if diagnostics.Ready {
		return nil
	}
	return achievementEditorFieldError(http.StatusServiceUnavailable, "schema", "Achievement content schema is missing or incompatible", diagnostics)
}

func (a *AchievementEditorController) requireCharacterSchema(c echo.Context) error {
	content := a.inspectAchievementSchema(a.contentDB(c), "content", achievementEditorContentSchemaSpec(), false)
	character := a.inspectAchievementSchema(a.characterDB(c), "character", achievementEditorCharacterSchemaSpec(), false)
	if content.Ready && character.Ready {
		return nil
	}
	return achievementEditorFieldError(
		http.StatusServiceUnavailable, "schema", "Achievement content or character-state schema is missing or incompatible",
		achievementEditorSchemaDiagnostics{Ready: false, Content: content, Character: character},
	)
}

func achievementEditorRefreshSchema(c echo.Context) bool {
	value := strings.ToLower(strings.TrimSpace(c.QueryParam("refresh")))
	return value == "1" || value == "true" || value == "yes"
}

func (a *AchievementEditorController) listDefinitions(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement definitions", err)
	}
	page, limit := achievementEditorPagination(c, achievementEditorMaximumLimit)
	filters := achievementEditorDefinitionFilters{
		Search: c.QueryParam("q"), RewardMode: strings.TrimSpace(c.QueryParam("reward")),
		Sort: strings.TrimSpace(c.QueryParam("sort")), Direction: strings.TrimSpace(c.QueryParam("direction")),
		Page: page, Limit: limit,
	}
	switch c.QueryParam("enabled") {
	case "1", "true", "enabled":
		value := true
		filters.Enabled = &value
	case "0", "false", "disabled":
		value := false
		filters.Enabled = &value
	}
	if value, ok := achievementEditorIntQuery(c, "category_id", 1, int(^uint32(0))); ok {
		converted := uint32(value)
		filters.CategoryID = &converted
	}
	if value, ok := achievementEditorIntQuery(c, "event_type", 0, 13); ok {
		converted := uint8(value)
		filters.EventType = &converted
	}
	if value, ok := achievementEditorIntQuery(c, "reward_type", 0, 5); ok {
		converted := uint8(value)
		filters.RewardType = &converted
	}
	rows, total, err := newAchievementEditorRepository(a.contentDB(c)).listDefinitions(filters)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement definitions", err)
	}
	return c.JSON(http.StatusOK, achievementEditorPage{Data: rows, Total: total, Page: page, Limit: limit})
}

func (a *AchievementEditorController) getDefinition(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	id, err := achievementEditorParamID(c, "id", "Achievement ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	graph, err := newAchievementEditorRepository(a.contentDB(c)).loadDefinition(id)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	revision, err := achievementEditorDefinitionRevision(graph)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement definition revision", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"definition": graph, "revision": revision})
}

func (a *AchievementEditorController) listCategories(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement categories", err)
	}
	rows, err := newAchievementEditorRepository(a.contentDB(c)).listCategories()
	if err != nil {
		return achievementEditorRespondError(c, "Achievement categories", err)
	}
	return c.JSON(http.StatusOK, achievementEditorPage{Data: rows, Total: int64(len(rows)), Page: 1, Limit: len(rows)})
}

func (a *AchievementEditorController) getCategory(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement category", err)
	}
	id, err := achievementEditorParamID(c, "id", "Category ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	category, err := newAchievementEditorRepository(a.contentDB(c)).loadCategory(id)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement category", err)
	}
	revision, err := achievementEditorCategoryRevision(category)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement category revision", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"category": category, "revision": revision})
}

func (a *AchievementEditorController) lookup(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement lookup", err)
	}
	limit := 20
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if limit > achievementEditorLookupLimit {
		limit = achievementEditorLookupLimit
	}
	ids := make([]uint32, 0)
	for _, raw := range strings.Split(c.QueryParam("ids"), ",") {
		if len(ids) >= achievementEditorLookupLimit {
			break
		}
		value, err := strconv.ParseUint(strings.TrimSpace(raw), 10, 32)
		if err == nil {
			ids = append(ids, uint32(value))
		}
	}
	rows, err := newAchievementEditorRepository(a.contentDB(c)).lookup(c.Param("kind"), c.QueryParam("q"), ids, limit)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement lookup", err)
	}
	return c.JSON(http.StatusOK, achievementEditorLookupPage{Data: rows, Total: int64(len(rows)), Limit: limit})
}

func (a *AchievementEditorController) definitionAudit(c echo.Context) error {
	identityClause := "1 = 1"
	args := make([]interface{}, 0)
	if id, ok := achievementEditorIntQuery(c, "achievement_id", 1, int(^uint32(0))); ok {
		identityClause = "CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.achievement_id')) AS UNSIGNED) = ?"
		args = append(args, id)
	}
	events := []string{
		achievementEditorEventDefinitionCreate, achievementEditorEventDefinitionUpdate,
		achievementEditorEventDefinitionClone, achievementEditorEventDefinitionDelete,
		achievementEditorEventCategoryCreate, achievementEditorEventCategoryUpdate,
		achievementEditorEventCategoryDelete,
	}
	return listOperationalEditorAudit(c, a.db, a.auditLog, events, identityClause, args...)
}

func achievementEditorAuditPayload(action string, graph achievementEditorGraph, reason string) map[string]interface{} {
	return map[string]interface{}{
		"action": action, "achievement_id": graph.ID, "achievement_name": graph.Name,
		"definition_version": graph.DefinitionVersion, "enabled": graph.Enabled,
		"categories": len(graph.Associations), "components": len(graph.Components),
		"rewards": len(graph.Rewards), "restrictions": len(graph.Restrictions),
		"reason": strings.TrimSpace(reason),
	}
}

func achievementEditorMutationSuccess(c echo.Context, status int, definition achievementEditorGraph, auditID uint) error {
	return c.JSON(status, echo.Map{"definition": definition, "audit_id": auditID})
}

func achievementEditorDeleteConfirmation(id uint32) string {
	return fmt.Sprintf("DELETE %d", id)
}
