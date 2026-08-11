package controllers

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

func (a *AchievementEditorController) listAchievementCharacters(c echo.Context) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievements", err)
	}
	page, limit := achievementEditorPagination(c, achievementEditorMaximumLimit)
	presence := strings.ToLower(strings.TrimSpace(c.QueryParam("presence")))
	if presence != "online" && presence != "offline" {
		presence = "all"
	}
	rows, total, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).
		listCharacters(c.QueryParam("q"), presence, page, limit)
	if err != nil {
		return achievementEditorRespondError(c, "Character achievement summaries", err)
	}
	return c.JSON(http.StatusOK, achievementEditorPage{Data: rows, Total: total, Page: page, Limit: limit})
}

func (a *AchievementEditorController) getCharacterAchievements(c echo.Context) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievements", err)
	}
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	page, limit := achievementEditorPagination(c, achievementEditorMaximumLimit)
	state := strings.ToLower(strings.TrimSpace(c.QueryParam("state")))
	validStates := map[string]bool{
		"all": true, "completed": true, "not_completed": true, "in_progress": true,
		"not_started": true, "version_mismatch": true, "reward_attention": true,
		"pending_update": true, "orphaned": true,
	}
	if !validStates[state] {
		state = "all"
	}
	filters := characterAchievementEditorDetailFilters{
		Search: c.QueryParam("q"), State: state, Page: page, Limit: limit,
	}
	if value, ok := achievementEditorIntQuery(c, "category_id", 1, int(^uint32(0))); ok {
		converted := uint32(value)
		filters.CategoryID = &converted
	}
	detail, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).
		loadDetail(characterID, filters)
	if err != nil {
		return achievementEditorRespondError(c, "Character achievement detail", err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (a *AchievementEditorController) characterAudit(c echo.Context) error {
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	events := []string{
		achievementEditorEventProgressSet, achievementEditorEventForceComplete,
		achievementEditorEventReset, achievementEditorEventRewardRetry,
		achievementEditorEventSelectionRetry, achievementEditorEventUpdateRetry,
		achievementEditorEventUpdateDiscard,
	}
	return listOperationalEditorAudit(
		c, a.db, a.auditLog, events,
		"CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.character_id')) AS UNSIGNED) = ?", characterID,
	)
}
