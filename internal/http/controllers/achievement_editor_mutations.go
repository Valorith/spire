package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func achievementEditorRequestGraph(request achievementEditorGraphMutationRequest) achievementEditorGraph {
	if request.Definition != nil {
		return *request.Definition
	}
	return request.Graph
}

func (a *AchievementEditorController) createDefinition(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	request := achievementEditorGraphMutationRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The definition graph is not valid JSON"})
	}
	if err := validateAchievementEditorReason(request.Reason); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "reason"})
	}
	graph := achievementEditorRequestGraph(request)
	if graph.Enabled {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{
			"error": "A new definition must be saved disabled, reviewed, and then enabled in a later update",
			"field": "enabled",
		})
	}
	context, err := buildAchievementEditorValidationContext(a.contentDB(c), graph, false)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement validation context", err)
	}
	validation := validateAchievementEditorGraph(graph, context)
	if !validation.Valid() {
		return achievementEditorValidationResponse(c, validation)
	}
	payload := achievementEditorAuditPayload("create", graph, request.Reason)
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, achievementEditorEventDefinitionCreate, payload)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement audit record", err)
	}
	if _, err = newAchievementEditorRepository(a.contentDB(c)).createDefinition(graph, a.characterDB(c)); err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	saved, err := newAchievementEditorRepository(a.contentDB(c)).loadDefinition(graph.ID)
	if err != nil {
		return achievementEditorRespondError(c, "Saved achievement definition", err)
	}
	revision, err := achievementEditorDefinitionRevision(saved)
	if err != nil {
		return achievementEditorRespondError(c, "Saved achievement definition revision", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"definition": saved, "revision": revision, "validation": validation.Findings, "audit_id": auditID})
}

func (a *AchievementEditorController) updateDefinition(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	id, err := achievementEditorParamID(c, "id", "Achievement ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorGraphMutationRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The definition graph is not valid JSON"})
	}
	if err := validateAchievementEditorReason(request.Reason); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "reason"})
	}
	graph := achievementEditorRequestGraph(request)
	if graph.ID != id {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "The route and stable achievement IDs do not match", "field": "id"})
	}
	context, err := buildAchievementEditorValidationContext(a.contentDB(c), graph, true)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement validation context", err)
	}
	validation := validateAchievementEditorGraph(graph, context)
	if !validation.Valid() {
		return achievementEditorValidationResponse(c, validation)
	}
	payload := achievementEditorAuditPayload("update", graph, request.Reason)
	payload["expected_definition_version"] = request.ExpectedDefinitionVersion
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, achievementEditorEventDefinitionUpdate, payload)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement audit record", err)
	}
	if err = newAchievementEditorRepository(a.contentDB(c)).updateDefinition(graph, request.ExpectedDefinitionVersion, request.ExpectedRevision); err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	saved, err := newAchievementEditorRepository(a.contentDB(c)).loadDefinition(id)
	if err != nil {
		return achievementEditorRespondError(c, "Saved achievement definition", err)
	}
	revision, err := achievementEditorDefinitionRevision(saved)
	if err != nil {
		return achievementEditorRespondError(c, "Saved achievement definition revision", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"definition": saved, "revision": revision, "validation": validation.Findings, "audit_id": auditID})
}

func (a *AchievementEditorController) cloneDefinition(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	sourceID, err := achievementEditorParamID(c, "id", "Achievement ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorCloneRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The clone request is not valid JSON"})
	}
	if err := validateAchievementEditorReason(request.Reason); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "reason"})
	}
	if request.NewID == 0 || request.NewID == sourceID {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Choose a new, nonzero achievement ID", "field": "new_id"})
	}
	if err := achievementEditorConfirmation(request.Confirmation, fmt.Sprintf("CLONE %d", sourceID)); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "confirmation"})
	}
	source, err := newAchievementEditorRepository(a.contentDB(c)).loadDefinition(sourceID)
	if err != nil {
		return achievementEditorRespondError(c, "Source achievement definition", err)
	}
	payload := map[string]interface{}{
		"action": "clone", "achievement_id": sourceID, "new_achievement_id": request.NewID,
		"achievement_name": source.Name, "new_name": strings.TrimSpace(request.Name), "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, achievementEditorEventDefinitionClone, payload)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement audit record", err)
	}
	clonedID, err := newAchievementEditorRepository(a.contentDB(c)).cloneDefinition(sourceID, request.NewID, request.Name, request.ExpectedRevision, a.characterDB(c))
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return achievementEditorRespondError(c, "Achievement clone", err)
	}
	cloned, err := newAchievementEditorRepository(a.contentDB(c)).loadDefinition(clonedID)
	if err != nil {
		return achievementEditorRespondError(c, "Cloned achievement definition", err)
	}
	revision, err := achievementEditorDefinitionRevision(cloned)
	if err != nil {
		return achievementEditorRespondError(c, "Cloned achievement definition revision", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"definition": cloned, "revision": revision, "audit_id": auditID})
}

func (a *AchievementEditorController) deleteDefinition(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	id, err := achievementEditorParamID(c, "id", "Achievement ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorDeleteRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The delete request is not valid JSON"})
	}
	if err := validateAchievementEditorReason(request.Reason); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "reason"})
	}
	if err := achievementEditorConfirmation(request.Confirmation, achievementEditorDeleteConfirmation(id)); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "confirmation"})
	}
	graph, err := newAchievementEditorRepository(a.contentDB(c)).loadDefinition(id)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	payload := achievementEditorAuditPayload("delete", graph, request.Reason)
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, achievementEditorEventDefinitionDelete, payload)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement audit record", err)
	}
	if err = newAchievementEditorRepository(a.contentDB(c)).deleteDefinition(id, request.ExpectedRevision); err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return achievementEditorRespondError(c, "Achievement definition", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted": true, "achievement_id": id, "audit_id": auditID})
}

func (a *AchievementEditorController) createCategory(c echo.Context) error {
	return a.mutateCategory(c, true)
}

func (a *AchievementEditorController) updateCategory(c echo.Context) error {
	return a.mutateCategory(c, false)
}

func (a *AchievementEditorController) mutateCategory(c echo.Context, create bool) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement category", err)
	}
	request := achievementEditorCategoryMutationRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The category request is not valid JSON"})
	}
	if err := validateAchievementEditorReason(request.Reason); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "reason"})
	}
	if !create {
		id, err := achievementEditorParamID(c, "id", "Category ID")
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
		if request.Category.ID != id {
			return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "The route and stable category IDs do not match", "field": "id"})
		}
	}
	context, err := buildAchievementEditorCategoryValidationContext(a.contentDB(c), request.Category, !create)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement category validation context", err)
	}
	validation := validateAchievementEditorCategory(request.Category, context)
	if !validation.Valid() {
		return achievementEditorValidationResponse(c, validation)
	}
	event := achievementEditorEventCategoryCreate
	action := "create"
	if !create {
		event = achievementEditorEventCategoryUpdate
		action = "update"
	}
	payload := map[string]interface{}{
		"action": action, "category_id": request.Category.ID, "category_name": request.Category.Name,
		"parent_id": request.Category.ParentID, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, event, payload)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement audit record", err)
	}
	repository := newAchievementEditorRepository(a.contentDB(c))
	if create {
		err = repository.createCategory(request.Category)
	} else {
		err = repository.updateCategory(request.Category, request.ExpectedParentID, request.ExpectedRevision)
	}
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return achievementEditorRespondError(c, "Achievement category", err)
	}
	saved, err := repository.loadCategory(request.Category.ID)
	if err != nil {
		return achievementEditorRespondError(c, "Saved achievement category", err)
	}
	status := http.StatusOK
	if create {
		status = http.StatusCreated
	}
	revision, err := achievementEditorCategoryRevision(saved)
	if err != nil {
		return achievementEditorRespondError(c, "Saved achievement category revision", err)
	}
	return c.JSON(status, echo.Map{"category": saved, "revision": revision, "validation": validation.Findings, "audit_id": auditID})
}

func (a *AchievementEditorController) deleteCategory(c echo.Context) error {
	if err := a.requireContentSchema(c); err != nil {
		return achievementEditorRespondError(c, "Achievement category", err)
	}
	id, err := achievementEditorParamID(c, "id", "Category ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorDeleteRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The delete request is not valid JSON"})
	}
	if err := validateAchievementEditorReason(request.Reason); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "reason"})
	}
	if err := achievementEditorConfirmation(request.Confirmation, achievementEditorDeleteConfirmation(id)); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": err.Error(), "field": "confirmation"})
	}
	category, err := newAchievementEditorRepository(a.contentDB(c)).loadCategory(id)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement category", err)
	}
	payload := map[string]interface{}{
		"action": "delete", "category_id": id, "category_name": category.Name,
		"parent_id": category.ParentID, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, achievementEditorEventCategoryDelete, payload)
	if err != nil {
		return achievementEditorRespondError(c, "Achievement audit record", err)
	}
	if err = newAchievementEditorRepository(a.contentDB(c)).deleteCategory(id, request.ExpectedRevision); err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return achievementEditorRespondError(c, "Achievement category", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted": true, "category_id": id, "audit_id": auditID})
}

func achievementEditorValidationResponse(c echo.Context, validation achievementEditorValidationResult) error {
	return c.JSON(http.StatusUnprocessableEntity, echo.Map{
		"error":      "The achievement graph did not pass authoritative validation",
		"validation": validation.Findings,
	})
}

func buildAchievementEditorValidationContext(db *gorm.DB, graph achievementEditorGraph, existing bool) (achievementEditorValidationContext, error) {
	context := achievementEditorValidationContext{
		KnownCategoryIDs: make(map[uint32]struct{}), CategoryParentByID: make(map[uint32]uint32),
		KnownAchievementIDs: make(map[uint32]struct{}), DependencyEdges: make(map[uint32][]uint32),
		KnownRestrictionIDs: make(map[uint32]struct{}), KnownRewardSetIDs: make(map[uint32]struct{}),
		KnownRewardIDs: make(map[string]struct{}), GlobalComponentCounts: make(map[uint32]uint32),
		AllowGlobalComponentCountChange: make(map[uint32]bool), ExistingComponentIdentities: make(map[string]struct{}),
		ExistingOrphanCriterionIDs: make(map[string]map[string]struct{}),
		ExistingRewardIDs:          make(map[string]struct{}), ExistingRewardOptionIDs: make(map[uint32]struct{}),
		RequireDatabaseContext: true,
	}
	categoryRows := make([]struct {
		ID       uint32
		ParentID uint32 `gorm:"column:parent_id"`
	}, 0)
	if err := db.Table("achievement_categories").Select("id, parent_id").Scan(&categoryRows).Error; err != nil {
		return context, err
	}
	for _, row := range categoryRows {
		context.KnownCategoryIDs[row.ID] = struct{}{}
		context.CategoryParentByID[row.ID] = row.ParentID
	}
	var achievementIDs []uint32
	if err := db.Table("achievements").Pluck("id", &achievementIDs).Error; err != nil {
		return context, err
	}
	for _, id := range achievementIDs {
		context.KnownAchievementIDs[id] = struct{}{}
	}
	dependencyRows := make([]struct {
		AchievementID uint32 `gorm:"column:achievement_id"`
		TargetID      uint32 `gorm:"column:target_id"`
	}, 0)
	if err := db.Table("achievement_criteria").Select("achievement_id, target_id").
		Where("event_type = 11 AND enabled = 1").Scan(&dependencyRows).Error; err != nil {
		return context, err
	}
	for _, row := range dependencyRows {
		context.DependencyEdges[row.AchievementID] = append(context.DependencyEdges[row.AchievementID], row.TargetID)
	}
	var restrictionIDs []uint32
	if err := db.Table("achievement_cast_restrictions").Distinct("restriction_id").Pluck("restriction_id", &restrictionIDs).Error; err != nil {
		return context, err
	}
	for _, id := range restrictionIDs {
		context.KnownRestrictionIDs[id] = struct{}{}
	}
	// The server's legacy spell-restriction switch is not represented by a
	// catalog table. Nonzero IDs submitted by the author are therefore the only
	// additional identities that can be verified here.
	for _, restriction := range graph.Restrictions {
		if restriction.RestrictionID != 0 {
			context.KnownRestrictionIDs[restriction.RestrictionID] = struct{}{}
		}
	}
	setRows := make([]struct {
		RewardSetID uint32 `gorm:"column:reward_set_id"`
	}, 0)
	if err := db.Table("achievement_reward_sets").Select("reward_set_id").Scan(&setRows).Error; err != nil {
		return context, err
	}
	for _, row := range setRows {
		context.KnownRewardSetIDs[row.RewardSetID] = struct{}{}
	}
	rewardRows := make([]struct {
		RewardID      string `gorm:"column:reward_id"`
		AchievementID uint32 `gorm:"column:achievement_id"`
	}, 0)
	if err := db.Table("achievement_rewards").Select("reward_id, achievement_id").Scan(&rewardRows).Error; err != nil {
		return context, err
	}
	for _, row := range rewardRows {
		context.KnownRewardIDs[row.RewardID] = struct{}{}
		if existing && row.AchievementID == graph.ID {
			context.ExistingRewardIDs[row.RewardID] = struct{}{}
		}
	}
	countRows := make([]struct {
		ComponentID   uint32 `gorm:"column:component_id"`
		RequiredCount uint32 `gorm:"column:required_count"`
	}, 0)
	if err := db.Table("achievement_component_counts").Select("component_id, required_count").Scan(&countRows).Error; err != nil {
		return context, err
	}
	for _, row := range countRows {
		context.GlobalComponentCounts[row.ComponentID] = row.RequiredCount
	}
	componentRows := make([]struct {
		AchievementID uint32 `gorm:"column:achievement_id"`
		ComponentType uint8  `gorm:"column:component_type"`
		ComponentID   uint32 `gorm:"column:component_id"`
	}, 0)
	if err := db.Table("achievement_components").Select("achievement_id, component_type, component_id").Scan(&componentRows).Error; err != nil {
		return context, err
	}
	componentOwners := make(map[uint32]map[uint32]struct{})
	for _, row := range componentRows {
		if componentOwners[row.ComponentID] == nil {
			componentOwners[row.ComponentID] = make(map[uint32]struct{})
		}
		componentOwners[row.ComponentID][row.AchievementID] = struct{}{}
		if existing && row.AchievementID == graph.ID {
			context.ExistingComponentIdentities[achievementEditorComponentIdentity(row.ComponentType, row.ComponentID)] = struct{}{}
		}
	}
	if existing {
		id := graph.ID
		context.ExistingAchievementID = &id
		realIdentities := make(map[string]struct{})
		for _, row := range componentRows {
			if row.AchievementID == graph.ID {
				realIdentities[achievementEditorComponentIdentity(row.ComponentType, row.ComponentID)] = struct{}{}
			}
		}
		criterionRows := make([]struct {
			ID            string `gorm:"column:id"`
			ComponentType uint8  `gorm:"column:component_type"`
			ComponentID   uint32 `gorm:"column:component_id"`
		}, 0)
		if err := db.Table("achievement_criteria").
			Select("id, component_type, component_id").
			Where("achievement_id = ?", graph.ID).
			Order("id").
			Scan(&criterionRows).Error; err != nil {
			return context, err
		}
		for _, row := range criterionRows {
			identity := achievementEditorComponentIdentity(row.ComponentType, row.ComponentID)
			if _, real := realIdentities[identity]; real {
				continue
			}
			if context.ExistingOrphanCriterionIDs[identity] == nil {
				context.ExistingOrphanCriterionIDs[identity] = make(map[string]struct{})
			}
			context.ExistingOrphanCriterionIDs[identity][row.ID] = struct{}{}
		}
		for componentID, owners := range componentOwners {
			if len(owners) == 1 {
				if _, owned := owners[graph.ID]; owned {
					context.AllowGlobalComponentCountChange[componentID] = true
				}
			}
		}
		var set struct {
			RewardSetID uint32 `gorm:"column:reward_set_id"`
		}
		result := db.Table("achievement_reward_sets").Select("reward_set_id").Where("achievement_id = ?", graph.ID).Take(&set)
		if result.Error == nil {
			context.ExistingRewardSetID = &set.RewardSetID
			var optionIDs []uint32
			if err := db.Table("achievement_reward_options").Where("reward_set_id = ?", set.RewardSetID).Pluck("option_id", &optionIDs).Error; err != nil {
				return context, err
			}
			for _, optionID := range optionIDs {
				context.ExistingRewardOptionIDs[optionID] = struct{}{}
			}
		} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return context, result.Error
		}
	}
	loadAchievementEditorReferenceContext(db, graph, &context)
	return context, nil
}

func buildAchievementEditorCategoryValidationContext(db *gorm.DB, category achievementEditorCategory, existing bool) (achievementEditorCategoryValidationContext, error) {
	context := achievementEditorCategoryValidationContext{
		KnownCategoryIDs: make(map[uint32]struct{}), CategoryParentByID: make(map[uint32]uint32), RequireDatabaseContext: true,
	}
	rows := make([]struct {
		ID       uint32
		ParentID uint32 `gorm:"column:parent_id"`
	}, 0)
	if err := db.Table("achievement_categories").Select("id, parent_id").Scan(&rows).Error; err != nil {
		return context, err
	}
	for _, row := range rows {
		context.KnownCategoryIDs[row.ID] = struct{}{}
		context.CategoryParentByID[row.ID] = row.ParentID
	}
	if existing {
		if _, found := context.KnownCategoryIDs[category.ID]; !found {
			return context, gorm.ErrRecordNotFound
		}
		id := category.ID
		context.ExistingCategoryID = &id
	}
	return context, nil
}
