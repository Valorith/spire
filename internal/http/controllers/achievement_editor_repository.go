package controllers

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type achievementEditorRepository struct {
	db *gorm.DB
}

var achievementEditorDurableCharacterStateTables = []string{
	"character_achievements",
	"character_achievement_progress",
	"character_achievement_rewards",
	"character_achievement_reward_selections",
	"character_achievement_pending_mutations",
}

type achievementEditorDefinitionFilters struct {
	Search     string
	Enabled    *bool
	CategoryID *uint32
	EventType  *uint8
	RewardType *uint8
	RewardMode string
	Sort       string
	Direction  string
	Page       int
	Limit      int
}

const achievementEditorDefinitionSummarySelect = `
		a.id, a.name, a.description, a.icon_id, a.points,
		a.definition_version, a.enabled,
		(SELECT COUNT(*) FROM achievement_category_associations ca WHERE ca.achievement_id = a.id) AS category_count,
		(SELECT COUNT(*) FROM achievement_components ac WHERE ac.achievement_id = a.id) AS component_count,
		(SELECT COUNT(*) FROM achievement_criteria cr WHERE cr.achievement_id = a.id) AS criterion_count,
		(SELECT COUNT(*) FROM achievement_rewards ar WHERE ar.achievement_id = a.id) AS reward_count,
		(SELECT COUNT(*) FROM achievement_cast_restrictions x WHERE x.achievement_id = a.id) AS restriction_count,
		(SELECT COUNT(*) FROM achievement_reward_sets rs WHERE rs.achievement_id = a.id) AS reward_set_count,
		COALESCE((
			SELECT GROUP_CONCAT(cat.name ORDER BY assoc.sequence, assoc.category_id SEPARATOR ', ')
			FROM achievement_category_associations assoc
			JOIN achievement_categories cat ON cat.id = assoc.category_id
			WHERE assoc.achievement_id = a.id
		), '') AS category_names`

func newAchievementEditorRepository(db *gorm.DB) *achievementEditorRepository {
	return &achievementEditorRepository{db: db}
}

func (r *achievementEditorRepository) listDefinitions(filters achievementEditorDefinitionFilters) ([]achievementEditorDefinitionSummary, int64, error) {
	base := r.db.Table("achievements a")
	search := strings.TrimSpace(filters.Search)
	if search != "" {
		like := "%" + search + "%"
		if id, err := strconv.ParseUint(search, 10, 32); err == nil {
			base = base.Where("a.id = ? OR a.name LIKE ? OR a.description LIKE ?", id, like, like)
		} else {
			base = base.Where("a.name LIKE ? OR a.description LIKE ?", like, like)
		}
	}
	if filters.Enabled != nil {
		base = base.Where("a.enabled = ?", boolToTinyInt(*filters.Enabled))
	}
	if filters.CategoryID != nil {
		base = base.Where(`EXISTS (
			SELECT 1 FROM achievement_category_associations ca
			WHERE ca.achievement_id = a.id AND ca.category_id = ?
		)`, *filters.CategoryID)
	}
	if filters.EventType != nil {
		base = base.Where(`EXISTS (
			SELECT 1 FROM achievement_criteria cr
			WHERE cr.achievement_id = a.id AND cr.event_type = ?
		)`, *filters.EventType)
	}
	if filters.RewardType != nil {
		base = base.Where(`EXISTS (
			SELECT 1 FROM achievement_rewards ar
			WHERE ar.achievement_id = a.id AND ar.reward_type = ?
		)`, *filters.RewardType)
	}
	switch filters.RewardMode {
	case "any":
		base = base.Where(`(
			EXISTS (SELECT 1 FROM achievement_rewards ar WHERE ar.achievement_id = a.id)
			OR EXISTS (SELECT 1 FROM achievement_reward_sets rs WHERE rs.achievement_id = a.id)
		)`)
	case "automatic":
		base = base.Where(`EXISTS (
			SELECT 1 FROM achievement_rewards ar
			WHERE ar.achievement_id = a.id
			AND NOT EXISTS (
				SELECT 1 FROM achievement_reward_option_entries entry
				WHERE entry.reward_id = ar.reward_id
			)
		)`)
	case "selectable":
		base = base.Where("EXISTS (SELECT 1 FROM achievement_reward_sets rs WHERE rs.achievement_id = a.id)")
	case "none":
		base = base.Where(`
			NOT EXISTS (SELECT 1 FROM achievement_rewards ar WHERE ar.achievement_id = a.id)
			AND NOT EXISTS (SELECT 1 FROM achievement_reward_sets rs WHERE rs.achievement_id = a.id)
		`)
	}

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sorts := map[string]string{
		"id": "a.id", "name": "a.name", "points": "a.points",
		"definition_version": "a.definition_version", "enabled": "a.enabled",
		"categories": "category_count", "components": "component_count",
		"criteria": "criterion_count", "rewards": "reward_count",
	}
	sortColumn, ok := sorts[filters.Sort]
	if !ok {
		sortColumn = "a.name"
	}
	direction := "ASC"
	if strings.EqualFold(filters.Direction, "desc") {
		direction = "DESC"
	}
	rows := make([]achievementEditorDefinitionSummary, 0)
	if err := base.Select(achievementEditorDefinitionSummarySelect).
		Order(sortColumn + " " + direction + ", a.id ASC").
		Limit(filters.Limit).Offset((filters.Page - 1) * filters.Limit).
		Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

// loadDefinitionSummaries hydrates the count-heavy catalog projection for a
// bounded page of IDs. Character-state filtering deliberately works from a
// lightweight definition projection first so these correlated counts never run
// across the entire achievement catalog.
func (r *achievementEditorRepository) loadDefinitionSummaries(ids []uint32) (map[uint32]achievementEditorDefinitionSummary, error) {
	result := make(map[uint32]achievementEditorDefinitionSummary, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	rows := make([]achievementEditorDefinitionSummary, 0, len(ids))
	if err := r.db.Table("achievements a").
		Select(achievementEditorDefinitionSummarySelect).
		Where("a.id IN ?", ids).
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.ID] = row
	}
	return result, nil
}

func (r *achievementEditorRepository) loadDefinition(id uint32) (achievementEditorGraph, error) {
	graph := achievementEditorGraph{
		Associations: make([]achievementEditorAssociation, 0),
		Components:   make([]achievementEditorComponent, 0),
		Rewards:      make([]achievementEditorReward, 0),
		Restrictions: make([]achievementEditorCastRestriction, 0),
	}
	if err := r.db.Table("achievements").Where("id = ?", id).Take(&graph).Error; err != nil {
		return graph, err
	}
	if err := r.db.Table("achievement_category_associations association").
		Select("association.achievement_id, association.category_id, association.sequence, association.display_text, category.name AS category_name").
		Joins("LEFT JOIN achievement_categories category ON category.id = association.category_id").
		Where("association.achievement_id = ?", id).
		Order("association.sequence, association.category_id").
		Scan(&graph.Associations).Error; err != nil {
		return graph, err
	}

	type componentRow struct {
		AchievementID     uint32 `gorm:"column:achievement_id"`
		ComponentType     uint8  `gorm:"column:component_type"`
		Sequence          uint32 `gorm:"column:sequence"`
		ComponentID       uint32 `gorm:"column:component_id"`
		Description       string `gorm:"column:description"`
		Description2      string `gorm:"column:description_2"`
		PresentationCount uint32 `gorm:"column:presentation_count"`
	}
	componentRows := make([]componentRow, 0)
	if err := r.db.Table("achievement_components component").
		Select(`component.achievement_id, component.component_type, component.sequence,
			component.component_id, component.description, component.description_2,
			COALESCE(component_count.required_count, 1) AS presentation_count`).
		Joins("LEFT JOIN achievement_component_counts component_count ON component_count.component_id = component.component_id").
		Where("component.achievement_id = ?", id).
		Order("component.component_type, component.sequence, component.component_id").
		Scan(&componentRows).Error; err != nil {
		return graph, err
	}
	criteria := make([]achievementEditorCriterion, 0)
	if err := r.db.Table("achievement_criteria").Where("achievement_id = ?", id).
		Order("component_type, component_sequence, component_id, id").Scan(&criteria).Error; err != nil {
		return graph, err
	}
	realComponentKeys := make(map[string]struct{}, len(componentRows))
	for _, row := range componentRows {
		realComponentKeys[achievementEditorComponentKey(row.ComponentType, row.ComponentID)] = struct{}{}
	}
	criteriaByComponent, orphanComponentOrder := achievementEditorGroupCriteriaForLoad(criteria, realComponentKeys)
	componentCountByID := make(map[uint32]uint32, len(componentRows))
	for _, row := range componentRows {
		count := row.PresentationCount
		if count == 0 {
			count = 1
		}
		componentCountByID[row.ComponentID] = count
		key := achievementEditorComponentKey(row.ComponentType, row.ComponentID)
		component := achievementEditorComponent{
			AchievementID: row.AchievementID, ComponentType: row.ComponentType,
			Sequence: row.Sequence, ComponentID: row.ComponentID,
			Description: row.Description, Description2: row.Description2,
			PresentationCount: count,
			Criteria:          criteriaByComponent[key],
		}
		if component.Criteria == nil {
			component.Criteria = make([]achievementEditorCriterion, 0)
		}
		graph.Components = append(graph.Components, component)
	}
	if len(orphanComponentOrder) > 0 {
		orphanComponentIDs := make([]uint32, 0, len(orphanComponentOrder))
		seenComponentIDs := make(map[uint32]struct{}, len(orphanComponentOrder))
		for _, key := range orphanComponentOrder {
			rows := criteriaByComponent[key]
			if len(rows) == 0 {
				continue
			}
			componentID := rows[0].ComponentID
			if _, seen := seenComponentIDs[componentID]; !seen {
				seenComponentIDs[componentID] = struct{}{}
				orphanComponentIDs = append(orphanComponentIDs, componentID)
			}
		}
		countRows := make([]struct {
			ComponentID   uint32 `gorm:"column:component_id"`
			RequiredCount uint32 `gorm:"column:required_count"`
		}, 0)
		if err := r.db.Table("achievement_component_counts").
			Select("component_id, required_count").
			Where("component_id IN ?", orphanComponentIDs).
			Scan(&countRows).Error; err != nil {
			return graph, err
		}
		for _, row := range countRows {
			if row.RequiredCount == 0 {
				componentCountByID[row.ComponentID] = 1
			} else {
				componentCountByID[row.ComponentID] = row.RequiredCount
			}
		}
		for _, key := range orphanComponentOrder {
			rows := criteriaByComponent[key]
			if len(rows) == 0 {
				continue
			}
			first := rows[0]
			count := componentCountByID[first.ComponentID]
			if count == 0 {
				count = 1
			}
			graph.Components = append(graph.Components, achievementEditorComponent{
				AchievementID:         id,
				ComponentType:         first.ComponentType,
				Sequence:              first.ComponentSequence,
				ComponentID:           first.ComponentID,
				Description:           "Missing component row — recovery required",
				Description2:          "These criteria are preserved but cannot be evaluated until an editor explicitly restores their component.",
				PresentationCount:     count,
				Criteria:              rows,
				RecoveryOnly:          true,
				RecoveryReason:        "The achievement_components row for these stored criteria is missing. Restore the component to keep the criteria, or explicitly delete the orphan criteria.",
				RecoveryCriteriaCount: len(rows),
			})
		}
	}

	type rewardRow struct {
		RewardID      string `gorm:"column:reward_id"`
		AchievementID uint32 `gorm:"column:achievement_id"`
		Sequence      uint32 `gorm:"column:sequence"`
		RewardType    uint8  `gorm:"column:reward_type"`
		RewardDataID  uint32 `gorm:"column:reward_data_id"`
		Amount        string `gorm:"column:amount"`
		Description   string `gorm:"column:description"`
		Enabled       bool   `gorm:"column:enabled"`
	}
	rewardRows := make([]rewardRow, 0)
	if err := r.db.Table("achievement_rewards").Where("achievement_id = ?", id).
		Order("sequence, reward_id").Scan(&rewardRows).Error; err != nil {
		return graph, err
	}
	for _, row := range rewardRows {
		graph.Rewards = append(graph.Rewards, achievementEditorReward{
			RewardID: row.RewardID, AchievementID: row.AchievementID,
			Sequence: row.Sequence, RewardType: row.RewardType,
			RewardDataID: row.RewardDataID, Amount: row.Amount,
			Description: row.Description, Enabled: row.Enabled,
		})
	}

	set := achievementEditorRewardSet{Options: make([]achievementEditorRewardOption, 0), Mappings: make([]achievementEditorRewardMapping, 0)}
	setResult := r.db.Table("achievement_reward_sets").Where("achievement_id = ?", id).Take(&set)
	if setResult.Error == nil {
		if err := r.db.Table("achievement_reward_options").Where("reward_set_id = ?", set.RewardSetID).
			Order("sequence, option_id").Scan(&set.Options).Error; err != nil {
			return graph, err
		}
		if err := r.db.Table("achievement_reward_option_entries").Where("reward_set_id = ?", set.RewardSetID).
			Order("option_id, reward_id").Scan(&set.Mappings).Error; err != nil {
			return graph, err
		}
		graph.RewardSet = &set
	} else if !errors.Is(setResult.Error, gorm.ErrRecordNotFound) {
		return graph, setResult.Error
	}
	if err := r.db.Table("achievement_cast_restrictions").Where("achievement_id = ?", id).
		Order("restriction_id").Scan(&graph.Restrictions).Error; err != nil {
		return graph, err
	}
	return graph, nil
}

func achievementEditorGroupCriteriaForLoad(
	criteria []achievementEditorCriterion,
	realComponentKeys map[string]struct{},
) (map[string][]achievementEditorCriterion, []string) {
	criteriaByComponent := make(map[string][]achievementEditorCriterion)
	orphanComponentOrder := make([]string, 0)
	for _, criterion := range criteria {
		key := achievementEditorComponentKey(criterion.ComponentType, criterion.ComponentID)
		if _, real := realComponentKeys[key]; !real && len(criteriaByComponent[key]) == 0 {
			orphanComponentOrder = append(orphanComponentOrder, key)
		}
		criteriaByComponent[key] = append(criteriaByComponent[key], criterion)
	}
	return criteriaByComponent, orphanComponentOrder
}

func achievementEditorComponentKey(componentType uint8, componentID uint32) string {
	return fmt.Sprintf("%d:%d", componentType, componentID)
}

func (r *achievementEditorRepository) createDefinition(graph achievementEditorGraph, characterDB *gorm.DB) (uint32, error) {
	err := achievementEditorWithAdvisoryTransaction(r.db, achievementEditorAuthoringLock, 5, func(tx *gorm.DB) error {
		var count int64
		if err := tx.Table("achievements").Where("id = ?", graph.ID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return operationalEditorConflict("Achievement %d already exists", graph.ID)
		}
		// Deleted definitions intentionally leave durable character state behind.
		// Check the split character database while the content authoring lock is
		// held so another editor cannot recreate this stable identity between the
		// guard and the content commit.
		if err := achievementEditorRejectDurableIdentityReuse(characterDB, graph.ID); err != nil {
			return err
		}
		validationContext, err := buildAchievementEditorValidationContext(tx, graph, false)
		if err != nil {
			return err
		}
		validation := validateAchievementEditorGraph(graph, validationContext)
		if !validation.Valid() {
			return achievementEditorValidationFailure{result: validation}
		}
		if err := insertAchievementEditorDefinition(tx, graph, true); err != nil {
			return err
		}
		return syncAchievementEditorGraph(tx, graph, false)
	})
	return graph.ID, err
}

func (r *achievementEditorRepository) updateDefinition(graph achievementEditorGraph, expectedVersion *uint32, expectedRevision string) error {
	return achievementEditorWithAdvisoryTransaction(r.db, achievementEditorAuthoringLock, 5, func(tx *gorm.DB) error {
		var current struct {
			ID                uint32
			DefinitionVersion uint32 `gorm:"column:definition_version"`
		}
		if err := tx.Table("achievements").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id, definition_version").Where("id = ?", graph.ID).Take(&current).Error; err != nil {
			return err
		}
		if expectedVersion != nil && current.DefinitionVersion != *expectedVersion {
			return operationalEditorConflict(
				"Achievement %d changed from definition version %d to %d; reload before saving",
				graph.ID, *expectedVersion, current.DefinitionVersion,
			)
		}
		persisted, err := newAchievementEditorRepository(tx).loadDefinition(graph.ID)
		if err != nil {
			return err
		}
		currentRevision, err := achievementEditorDefinitionRevision(persisted)
		if err != nil {
			return err
		}
		if err := achievementEditorRequireRevision(expectedRevision, currentRevision, fmt.Sprintf("Achievement %d", graph.ID)); err != nil {
			return err
		}
		if graph.DefinitionVersion < current.DefinitionVersion {
			return achievementEditorFieldError(422, "definition_version", "Definition version cannot be decreased", nil)
		}
		// Character state and reward ledgers survive while a definition is
		// disabled. Therefore unpublished edits to an existing identity still
		// require a version bump whenever its enabled runtime policy changes;
		// otherwise disable-edit-enable could silently reinterpret deployed state.
		storedPolicy, err := achievementEditorRuntimePolicyRevision(persisted)
		if err != nil {
			return err
		}
		submittedPolicy, err := achievementEditorRuntimePolicyRevision(graph)
		if err != nil {
			return err
		}
		if storedPolicy != submittedPolicy && graph.DefinitionVersion <= current.DefinitionVersion {
			return achievementEditorFieldError(
				422,
				"definition_version",
				"Runtime evaluation or reward policy changed; increment the definition version before saving",
				nil,
			)
		}
		validationContext, err := buildAchievementEditorValidationContext(tx, graph, true)
		if err != nil {
			return err
		}
		validation := validateAchievementEditorGraph(graph, validationContext)
		if !validation.Valid() {
			return achievementEditorValidationFailure{result: validation}
		}
		if err := insertAchievementEditorDefinition(tx, graph, false); err != nil {
			return err
		}
		return syncAchievementEditorGraph(tx, graph, true)
	})
}

func insertAchievementEditorDefinition(tx *gorm.DB, graph achievementEditorGraph, create bool) error {
	values := map[string]interface{}{
		"name": graph.Name, "description": graph.Description, "icon_id": graph.IconID,
		"points": graph.Points, "reward_display": graph.RewardDisplay,
		"world_display_flag": graph.WorldDisplayFlag, "definition_version": graph.DefinitionVersion,
		"reset_on_version_change": boolToTinyInt(graph.ResetOnVersionChange), "enabled": boolToTinyInt(graph.Enabled),
	}
	if create {
		values["id"] = graph.ID
		return tx.Table("achievements").Create(values).Error
	}
	result := tx.Table("achievements").Where("id = ?", graph.ID).Updates(values)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		var count int64
		if err := tx.Table("achievements").Where("id = ?", graph.ID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return gorm.ErrRecordNotFound
		}
	}
	return nil
}

func syncAchievementEditorGraph(tx *gorm.DB, graph achievementEditorGraph, requireRetained bool) error {
	if err := syncAchievementEditorAssociations(tx, graph); err != nil {
		return err
	}
	if err := syncAchievementEditorComponents(tx, graph, requireRetained); err != nil {
		return err
	}
	if err := syncAchievementEditorRewards(tx, graph, requireRetained); err != nil {
		return err
	}
	return syncAchievementEditorRestrictions(tx, graph)
}

func syncAchievementEditorAssociations(tx *gorm.DB, graph achievementEditorGraph) error {
	if err := tx.Table("achievement_category_associations").Where("achievement_id = ?", graph.ID).Delete(nil).Error; err != nil {
		return err
	}
	for _, association := range graph.Associations {
		row := map[string]interface{}{
			"category_id": association.CategoryID, "sequence": association.Sequence,
			"achievement_id": graph.ID, "display_text": association.DisplayText,
		}
		if err := tx.Table("achievement_category_associations").Create(row).Error; err != nil {
			return err
		}
	}
	return nil
}

func syncAchievementEditorComponents(tx *gorm.DB, graph achievementEditorGraph, requireRetained bool) error {
	componentsToPersist := make([]achievementEditorComponent, 0, len(graph.Components))
	for index, component := range graph.Components {
		if component.RecoveryOnly {
			switch component.RecoveryAction {
			case achievementEditorRecoveryActionRestore:
				componentsToPersist = append(componentsToPersist, component)
			case achievementEditorRecoveryActionDelete:
				// The transaction deletes the old orphan rows below and deliberately
				// does not recreate either the missing component or its criteria.
			default:
				return achievementEditorFieldError(422, fmt.Sprintf("components.%d.recovery_action", index), "An unresolved recovery-only component cannot be saved", nil)
			}
			continue
		}
		if component.RecoveryAction != "" {
			return achievementEditorFieldError(422, fmt.Sprintf("components.%d.recovery_action", index), "Recovery actions are valid only for server-identified orphan criteria", nil)
		}
		componentsToPersist = append(componentsToPersist, component)
	}

	type identity struct {
		ComponentType uint8  `gorm:"column:component_type"`
		ComponentID   uint32 `gorm:"column:component_id"`
	}
	existingRows := make([]identity, 0)
	if err := tx.Table("achievement_components").Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("component_type, component_id").Where("achievement_id = ?", graph.ID).Scan(&existingRows).Error; err != nil {
		return err
	}
	if requireRetained {
		submitted := make(map[string]bool)
		for _, component := range componentsToPersist {
			submitted[achievementEditorComponentKey(component.ComponentType, component.ComponentID)] = true
		}
		for _, row := range existingRows {
			if !submitted[achievementEditorComponentKey(row.ComponentType, row.ComponentID)] {
				return achievementEditorFieldError(
					422, "components",
					fmt.Sprintf("Persisted component %d:%d cannot be removed; disable all of its criteria to retire it safely", row.ComponentType, row.ComponentID),
					nil,
				)
			}
		}
	}

	for index, component := range componentsToPersist {
		var sharedCount int64
		if err := tx.Table("achievement_components").Where("component_id = ? AND achievement_id <> ?", component.ComponentID, graph.ID).
			Count(&sharedCount).Error; err != nil {
			return err
		}
		if sharedCount == 0 {
			continue
		}
		var stored struct {
			RequiredCount uint32 `gorm:"column:required_count"`
		}
		if err := tx.Table("achievement_component_counts").Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("component_id = ?", component.ComponentID).Take(&stored).Error; err != nil {
			return err
		}
		if stored.RequiredCount != component.PresentationCount {
			return achievementEditorFieldError(
				422, fmt.Sprintf("components.%d.presentation_count", index),
				fmt.Sprintf("Component ID %d is shared and its global presentation count is %d", component.ComponentID, stored.RequiredCount), nil,
			)
		}
	}
	if err := tx.Table("achievement_criteria").Where("achievement_id = ?", graph.ID).Delete(nil).Error; err != nil {
		return err
	}
	if err := tx.Table("achievement_components").Where("achievement_id = ?", graph.ID).Delete(nil).Error; err != nil {
		return err
	}
	for _, component := range componentsToPersist {
		componentRow := map[string]interface{}{
			"achievement_id": graph.ID, "component_type": component.ComponentType,
			"sequence": component.Sequence, "component_id": component.ComponentID,
			"description": component.Description, "description_2": component.Description2,
		}
		if err := tx.Table("achievement_components").Create(componentRow).Error; err != nil {
			return err
		}
		countRow := map[string]interface{}{"component_id": component.ComponentID, "required_count": component.PresentationCount}
		if err := tx.Table("achievement_component_counts").Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "component_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"required_count"}),
		}).Create(countRow).Error; err != nil {
			return err
		}
		for _, criterion := range component.Criteria {
			criterionRow := map[string]interface{}{
				"achievement_id": graph.ID, "component_type": component.ComponentType,
				"component_sequence": component.Sequence, "component_id": component.ComponentID,
				"event_type": criterion.EventType, "progress_mode": criterion.ProgressMode,
				"behavior": criterion.Behavior, "target_id": criterion.TargetID,
				"target_id2": criterion.TargetID2, "target_value": criterion.TargetValue,
				"required_count": criterion.RequiredCount, "enabled": boolToTinyInt(criterion.Enabled),
			}
			if err := tx.Table("achievement_criteria").Create(criterionRow).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func syncAchievementEditorRewards(tx *gorm.DB, graph achievementEditorGraph, requireRetained bool) error {
	type idRow struct {
		RewardID string `gorm:"column:reward_id"`
	}
	existingRows := make([]idRow, 0)
	if err := tx.Table("achievement_rewards").Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("reward_id").Where("achievement_id = ?", graph.ID).Scan(&existingRows).Error; err != nil {
		return err
	}
	existing := make(map[string]bool)
	for _, row := range existingRows {
		existing[row.RewardID] = true
	}
	if requireRetained {
		submitted := make(map[string]bool)
		for _, reward := range graph.Rewards {
			if reward.RewardID != "" {
				submitted[reward.RewardID] = true
				if !existing[reward.RewardID] {
					return achievementEditorFieldError(422, "rewards", "Existing reward IDs cannot be adopted from another achievement", nil)
				}
			}
		}
		for rewardID := range existing {
			if !submitted[rewardID] {
				return achievementEditorFieldError(422, "rewards", "Persisted reward "+rewardID+" cannot be removed; disable it to retire it safely", nil)
			}
		}
	}

	type setIdentity struct {
		RewardSetID uint32 `gorm:"column:reward_set_id"`
	}
	var existingSet setIdentity
	setResult := tx.Table("achievement_reward_sets").Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("reward_set_id").Where("achievement_id = ?", graph.ID).Take(&existingSet)
	hasExistingSet := setResult.Error == nil
	if setResult.Error != nil && !errors.Is(setResult.Error, gorm.ErrRecordNotFound) {
		return setResult.Error
	}
	if requireRetained && hasExistingSet && graph.RewardSet == nil {
		return achievementEditorFieldError(422, "reward_set", "A persisted reward set cannot be removed; disable it to retire it safely", nil)
	}
	if graph.RewardSet != nil && hasExistingSet && graph.RewardSet.RewardSetID != existingSet.RewardSetID {
		return achievementEditorFieldError(422, "reward_set.reward_set_id", "The stable reward-set ID cannot be changed", nil)
	}
	if requireRetained && hasExistingSet && graph.RewardSet != nil {
		existingOptions := make([]struct {
			OptionID uint32 `gorm:"column:option_id"`
		}, 0)
		if err := tx.Table("achievement_reward_options").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("option_id").Where("reward_set_id = ?", existingSet.RewardSetID).Scan(&existingOptions).Error; err != nil {
			return err
		}
		submitted := make(map[uint32]bool)
		for _, option := range graph.RewardSet.Options {
			submitted[option.OptionID] = true
		}
		for _, option := range existingOptions {
			if !submitted[option.OptionID] {
				return achievementEditorFieldError(422, "reward_set.options", fmt.Sprintf("Persisted option %d cannot be removed; disable it to retire it safely", option.OptionID), nil)
			}
		}
	}

	existingIDs := make([]string, 0, len(existing))
	for id := range existing {
		existingIDs = append(existingIDs, id)
	}
	if len(existingIDs) > 0 {
		if err := tx.Table("achievement_reward_option_entries").Where("reward_id IN ?", existingIDs).Delete(nil).Error; err != nil {
			return err
		}
	}
	if hasExistingSet {
		if err := tx.Table("achievement_reward_option_entries").Where("reward_set_id = ?", existingSet.RewardSetID).Delete(nil).Error; err != nil {
			return err
		}
		if err := tx.Table("achievement_reward_options").Where("reward_set_id = ?", existingSet.RewardSetID).Delete(nil).Error; err != nil {
			return err
		}
		if err := tx.Table("achievement_reward_sets").Where("reward_set_id = ?", existingSet.RewardSetID).Delete(nil).Error; err != nil {
			return err
		}
	}
	if err := tx.Table("achievement_rewards").Where("achievement_id = ?", graph.ID).Delete(nil).Error; err != nil {
		return err
	}

	resolvedRewardIDs := make(map[string]string)
	for index, reward := range graph.Rewards {
		amount, err := strconv.ParseUint(reward.Amount, 10, 64)
		if err != nil || amount == 0 {
			return achievementEditorFieldError(422, fmt.Sprintf("rewards.%d.amount", index), "Reward amount must be a positive unsigned 64-bit integer", nil)
		}
		rewardID, err := achievementEditorInsertReward(tx, graph.ID, reward, amount)
		if err != nil {
			return err
		}
		if reward.RewardID != "" {
			resolvedRewardIDs[reward.RewardID] = rewardID
		}
		resolvedRewardIDs[fmt.Sprintf("@%d", index)] = rewardID
	}
	if graph.RewardSet == nil {
		return nil
	}
	setID := graph.RewardSet.RewardSetID
	if setID == 0 {
		allocated, err := achievementEditorAllocateUint32(tx, "achievement_reward_sets", "reward_set_id")
		if err != nil {
			return err
		}
		setID = allocated
	}
	setRow := map[string]interface{}{
		"reward_set_id": setID, "achievement_id": graph.ID,
		"title": graph.RewardSet.Title, "enabled": boolToTinyInt(graph.RewardSet.Enabled),
	}
	if err := tx.Table("achievement_reward_sets").Create(setRow).Error; err != nil {
		return err
	}
	optionIDs := make(map[uint32]bool)
	for _, option := range graph.RewardSet.Options {
		optionIDs[option.OptionID] = true
		optionRow := map[string]interface{}{
			"reward_set_id": setID, "option_id": option.OptionID, "sequence": option.Sequence,
			"label": option.Label, "common_to_all": boolToTinyInt(option.CommonToAll),
			"flags": option.Flags, "enabled": boolToTinyInt(option.Enabled),
		}
		if err := tx.Table("achievement_reward_options").Create(optionRow).Error; err != nil {
			return err
		}
	}
	for _, mapping := range graph.RewardSet.Mappings {
		if !optionIDs[mapping.OptionID] {
			return achievementEditorFieldError(422, "reward_set.mappings", "A reward mapping references a missing option", nil)
		}
		resolvedID := mapping.RewardID
		if replacement, ok := resolvedRewardIDs[resolvedID]; ok {
			resolvedID = replacement
		}
		if resolvedID == "" {
			return achievementEditorFieldError(422, "reward_set.mappings", "A reward mapping references an unsaved reward", nil)
		}
		entry := map[string]interface{}{"reward_set_id": setID, "option_id": mapping.OptionID, "reward_id": resolvedID}
		if err := tx.Table("achievement_reward_option_entries").Create(entry).Error; err != nil {
			return err
		}
	}
	return nil
}

func achievementEditorInsertReward(tx *gorm.DB, achievementID uint32, reward achievementEditorReward, amount uint64) (string, error) {
	type rewardInsert struct {
		RewardID      uint64 `gorm:"column:reward_id;primaryKey;autoIncrement"`
		AchievementID uint32 `gorm:"column:achievement_id"`
		Sequence      uint32 `gorm:"column:sequence"`
		RewardType    uint8  `gorm:"column:reward_type"`
		RewardDataID  uint32 `gorm:"column:reward_data_id"`
		Amount        uint64 `gorm:"column:amount"`
		Description   string `gorm:"column:description"`
		Enabled       uint8  `gorm:"column:enabled"`
	}
	row := rewardInsert{
		AchievementID: achievementID, Sequence: reward.Sequence, RewardType: reward.RewardType,
		RewardDataID: reward.RewardDataID, Amount: amount, Description: reward.Description,
		Enabled: boolToTinyInt(reward.Enabled),
	}
	if reward.RewardID != "" {
		parsed, err := strconv.ParseUint(reward.RewardID, 10, 64)
		if err != nil || parsed == 0 {
			return "", achievementEditorFieldError(422, "rewards.reward_id", "Reward ID must be a positive unsigned 64-bit integer", nil)
		}
		row.RewardID = parsed
	}
	if err := tx.Table("achievement_rewards").Create(&row).Error; err != nil {
		return "", err
	}
	if reward.Enabled && row.RewardID > uint64(^uint32(0)) {
		return "", achievementEditorFieldError(422, "rewards.reward_id", "The allocated enabled reward ID exceeds the unsigned 32-bit client wire field", nil)
	}
	return strconv.FormatUint(row.RewardID, 10), nil
}

func syncAchievementEditorRestrictions(tx *gorm.DB, graph achievementEditorGraph) error {
	if err := tx.Table("achievement_cast_restrictions").Where("achievement_id = ?", graph.ID).Delete(nil).Error; err != nil {
		return err
	}
	for _, restriction := range graph.Restrictions {
		row := map[string]interface{}{
			"restriction_id": restriction.RestrictionID, "achievement_id": graph.ID,
			"requires_completed": boolToTinyInt(restriction.RequiresCompleted),
		}
		if err := tx.Table("achievement_cast_restrictions").Create(row).Error; err != nil {
			return err
		}
	}
	return nil
}

func achievementEditorAllocateUint32(tx *gorm.DB, table string, column string) (uint32, error) {
	allowed := map[string]string{
		"achievements:id":                       "achievements:id",
		"achievement_categories:id":             "achievement_categories:id",
		"achievement_reward_sets:reward_set_id": "achievement_reward_sets:reward_set_id",
	}
	if allowed[table+":"+column] == "" {
		return 0, errors.New("unsupported achievement identity allocation")
	}
	var result struct {
		Next uint64 `gorm:"column:next_id"`
	}
	query := fmt.Sprintf("SELECT COALESCE(MAX(`%s`), 0) + 1 AS next_id FROM `%s` FOR UPDATE", column, table)
	if err := tx.Raw(query).Scan(&result).Error; err != nil {
		return 0, err
	}
	if result.Next == 0 || result.Next > uint64(^uint32(0)) {
		return 0, errors.New("no unsigned 32-bit achievement identity remains")
	}
	return uint32(result.Next), nil
}

func (r *achievementEditorRepository) cloneDefinition(sourceID uint32, newID uint32, name string, expectedRevision string, characterDB *gorm.DB) (uint32, error) {
	var clonedID uint32
	err := achievementEditorWithAdvisoryTransaction(r.db, achievementEditorAuthoringLock, 5, func(tx *gorm.DB) error {
		var sourceLock struct {
			ID uint32
		}
		if err := tx.Table("achievements").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id").Where("id = ?", sourceID).Take(&sourceLock).Error; err != nil {
			return err
		}
		txRepository := newAchievementEditorRepository(tx)
		graph, err := txRepository.loadDefinition(sourceID)
		if err != nil {
			return err
		}
		sourceRevision, err := achievementEditorDefinitionRevision(graph)
		if err != nil {
			return err
		}
		if err := achievementEditorRequireRevision(expectedRevision, sourceRevision, fmt.Sprintf("Achievement %d", sourceID)); err != nil {
			return err
		}
		if newID == 0 {
			newID, err = achievementEditorAllocateUint32(tx, "achievements", "id")
			if err != nil {
				return err
			}
		}
		var duplicate int64
		if err := tx.Table("achievements").Where("id = ?", newID).Count(&duplicate).Error; err != nil {
			return err
		}
		if duplicate > 0 {
			return operationalEditorConflict("Achievement %d already exists", newID)
		}
		if err := achievementEditorRejectDurableIdentityReuse(characterDB, newID); err != nil {
			return err
		}

		graph.ID = newID
		graph.Enabled = false
		graph.DefinitionVersion = 1
		if strings.TrimSpace(name) == "" {
			graph.Name = strings.TrimSpace(graph.Name + " (Copy)")
		} else {
			graph.Name = strings.TrimSpace(name)
		}
		graph.Restrictions = make([]achievementEditorCastRestriction, 0)
		for associationIndex := range graph.Associations {
			graph.Associations[associationIndex].AchievementID = newID
		}
		for componentIndex := range graph.Components {
			graph.Components[componentIndex].AchievementID = newID
			for criterionIndex := range graph.Components[componentIndex].Criteria {
				criterion := &graph.Components[componentIndex].Criteria[criterionIndex]
				criterion.ID = ""
				criterion.AchievementID = newID
			}
		}

		// Preserve option semantics while allocating fresh canonical grant IDs.
		optionByOldReward := make(map[string]uint32)
		if graph.RewardSet != nil {
			for _, mapping := range graph.RewardSet.Mappings {
				optionByOldReward[mapping.RewardID] = mapping.OptionID
			}
			graph.RewardSet.RewardSetID = 0
			graph.RewardSet.AchievementID = newID
			graph.RewardSet.Mappings = make([]achievementEditorRewardMapping, 0)
			for optionIndex := range graph.RewardSet.Options {
				graph.RewardSet.Options[optionIndex].RewardSetID = 0
			}
		}
		for rewardIndex := range graph.Rewards {
			oldID := graph.Rewards[rewardIndex].RewardID
			graph.Rewards[rewardIndex].RewardID = ""
			graph.Rewards[rewardIndex].AchievementID = newID
			if graph.RewardSet != nil {
				if optionID, ok := optionByOldReward[oldID]; ok {
					graph.RewardSet.Mappings = append(graph.RewardSet.Mappings, achievementEditorRewardMapping{
						OptionID: optionID, RewardID: fmt.Sprintf("@%d", rewardIndex),
					})
				}
			}
		}
		validationContext, err := buildAchievementEditorValidationContext(tx, graph, false)
		if err != nil {
			return err
		}
		validation := validateAchievementEditorGraph(graph, validationContext)
		if !validation.Valid() {
			return achievementEditorFieldError(422, "graph", "The cloned definition failed authoritative validation", validation.Findings)
		}
		if err := insertAchievementEditorDefinition(tx, graph, true); err != nil {
			return err
		}
		if err := syncAchievementEditorGraph(tx, graph, false); err != nil {
			return err
		}
		clonedID = newID
		return nil
	})
	return clonedID, err
}

func achievementEditorRequireUnusedDurableIdentity(id uint32, exists func(string) (bool, error)) error {
	for _, table := range achievementEditorDurableCharacterStateTables {
		found, err := exists(table)
		if err != nil {
			return fmt.Errorf("verify durable character state in %s for achievement %d: %w", table, id, err)
		}
		if found {
			return operationalEditorConflict(
				"Achievement ID %d cannot be reused because durable character state remains in %s; choose a new, never-used stable ID",
				id,
				table,
			)
		}
	}
	return nil
}

func achievementEditorRejectDurableIdentityReuse(characterDB *gorm.DB, id uint32) error {
	if characterDB == nil {
		return fmt.Errorf("verify durable character state for achievement %d: character database is unavailable", id)
	}
	return achievementEditorRequireUnusedDurableIdentity(id, func(table string) (bool, error) {
		var marker uint8
		query := characterDB.Table(table).
			Select("1").
			Where("achievement_id = ?", id).
			Limit(1).
			Scan(&marker)
		return query.RowsAffected > 0, query.Error
	})
}

func (r *achievementEditorRepository) deleteDefinition(id uint32, expectedRevision string) error {
	return achievementEditorWithAdvisoryTransaction(r.db, achievementEditorAuthoringLock, 5, func(tx *gorm.DB) error {
		var existing struct{ ID uint32 }
		if err := tx.Table("achievements").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id").Where("id = ?", id).Take(&existing).Error; err != nil {
			return err
		}
		persisted, err := newAchievementEditorRepository(tx).loadDefinition(id)
		if err != nil {
			return err
		}
		currentRevision, err := achievementEditorDefinitionRevision(persisted)
		if err != nil {
			return err
		}
		if err := achievementEditorRequireRevision(expectedRevision, currentRevision, fmt.Sprintf("Achievement %d", id)); err != nil {
			return err
		}
		var dependent struct {
			AchievementID uint32 `gorm:"column:achievement_id"`
		}
		result := tx.Table("achievement_criteria").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("achievement_id").
			Where("event_type = ? AND target_id = ? AND achievement_id <> ?", 11, id, id).
			Limit(1).Take(&dependent)
		if result.Error == nil {
			return operationalEditorConflict("Achievement %d is required by achievement %d", id, dependent.AchievementID)
		}
		if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return result.Error
		}
		type rewardIDRow struct {
			RewardID string `gorm:"column:reward_id"`
		}
		rewardIDs := make([]rewardIDRow, 0)
		if err := tx.Table("achievement_rewards").Select("reward_id").Where("achievement_id = ?", id).Scan(&rewardIDs).Error; err != nil {
			return err
		}
		ids := make([]string, 0, len(rewardIDs))
		for _, row := range rewardIDs {
			ids = append(ids, row.RewardID)
		}
		if len(ids) > 0 {
			if err := tx.Table("achievement_reward_option_entries").Where("reward_id IN ?", ids).Delete(nil).Error; err != nil {
				return err
			}
		}
		var setIDs []uint32
		if err := tx.Table("achievement_reward_sets").Where("achievement_id = ?", id).Pluck("reward_set_id", &setIDs).Error; err != nil {
			return err
		}
		if len(setIDs) > 0 {
			if err := tx.Table("achievement_reward_option_entries").Where("reward_set_id IN ?", setIDs).Delete(nil).Error; err != nil {
				return err
			}
			if err := tx.Table("achievement_reward_options").Where("reward_set_id IN ?", setIDs).Delete(nil).Error; err != nil {
				return err
			}
			if err := tx.Table("achievement_reward_sets").Where("reward_set_id IN ?", setIDs).Delete(nil).Error; err != nil {
				return err
			}
		}
		for _, table := range []string{
			"achievement_cast_restrictions", "achievement_category_associations",
			"achievement_criteria", "achievement_components", "achievement_rewards",
		} {
			if err := tx.Table(table).Where("achievement_id = ?", id).Delete(nil).Error; err != nil {
				return err
			}
		}
		// achievement_component_counts is deliberately preserved: component IDs
		// are global presentation identities and orphan history must remain legible.
		return tx.Table("achievements").Where("id = ?", id).Delete(nil).Error
	})
}

func (r *achievementEditorRepository) listCategories() ([]achievementEditorCategory, error) {
	rows := make([]achievementEditorCategory, 0)
	if err := r.db.Table("achievement_categories category").Select(`
		category.id, category.parent_id, category.sequence, category.name,
		category.description, category.icon,
		(SELECT COUNT(*) FROM achievement_category_associations association WHERE association.category_id = category.id) AS association_count,
		(SELECT COUNT(*) FROM achievement_categories child WHERE child.parent_id = category.id) AS children_count
	`).Order("category.parent_id, category.sequence, category.id").Scan(&rows).Error; err != nil {
		return nil, err
	}
	return achievementEditorOrderCategories(rows), nil
}

func achievementEditorOrderCategories(rows []achievementEditorCategory) []achievementEditorCategory {
	children := make(map[uint32][]achievementEditorCategory)
	for _, row := range rows {
		children[row.ParentID] = append(children[row.ParentID], row)
	}
	ordered := make([]achievementEditorCategory, 0, len(rows))
	visited := make(map[uint32]bool)
	var walk func(uint32, int)
	walk = func(parentID uint32, depth int) {
		for _, row := range children[parentID] {
			if visited[row.ID] {
				continue
			}
			visited[row.ID] = true
			row.Depth = depth
			ordered = append(ordered, row)
			walk(row.ID, depth+1)
		}
	}
	walk(0, 0)
	for _, row := range rows {
		if visited[row.ID] {
			continue
		}
		row.Depth = 0
		ordered = append(ordered, row)
		visited[row.ID] = true
		walk(row.ID, 1)
	}
	return ordered
}

func (r *achievementEditorRepository) loadCategory(id uint32) (achievementEditorCategory, error) {
	var category achievementEditorCategory
	err := r.db.Table("achievement_categories").Where("id = ?", id).Take(&category).Error
	return category, err
}

func (r *achievementEditorRepository) createCategory(category achievementEditorCategory) error {
	return achievementEditorWithAdvisoryTransaction(r.db, achievementEditorAuthoringLock, 5, func(tx *gorm.DB) error {
		var count int64
		if err := tx.Table("achievement_categories").Where("id = ?", category.ID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return operationalEditorConflict("Achievement category %d already exists", category.ID)
		}
		validationContext, err := buildAchievementEditorCategoryValidationContext(tx, category, false)
		if err != nil {
			return err
		}
		validation := validateAchievementEditorCategory(category, validationContext)
		if !validation.Valid() {
			return achievementEditorValidationFailure{result: validation}
		}
		if err := achievementEditorAssertCategoryParent(tx, category.ID, category.ParentID); err != nil {
			return err
		}
		return tx.Table("achievement_categories").Create(map[string]interface{}{
			"id": category.ID, "parent_id": category.ParentID, "sequence": category.Sequence,
			"name": category.Name, "description": category.Description, "icon": category.Icon,
		}).Error
	})
}

func (r *achievementEditorRepository) updateCategory(category achievementEditorCategory, expectedParentID *uint32, expectedRevision string) error {
	return achievementEditorWithAdvisoryTransaction(r.db, achievementEditorAuthoringLock, 5, func(tx *gorm.DB) error {
		var current struct {
			ID       uint32
			ParentID uint32 `gorm:"column:parent_id"`
		}
		if err := tx.Table("achievement_categories").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id, parent_id").Where("id = ?", category.ID).Take(&current).Error; err != nil {
			return err
		}
		if expectedParentID != nil && current.ParentID != *expectedParentID {
			return operationalEditorConflict("Category %d changed parent; reload before saving", category.ID)
		}
		persisted, err := newAchievementEditorRepository(tx).loadCategory(category.ID)
		if err != nil {
			return err
		}
		currentRevision, err := achievementEditorCategoryRevision(persisted)
		if err != nil {
			return err
		}
		if err := achievementEditorRequireRevision(expectedRevision, currentRevision, fmt.Sprintf("Category %d", category.ID)); err != nil {
			return err
		}
		validationContext, err := buildAchievementEditorCategoryValidationContext(tx, category, true)
		if err != nil {
			return err
		}
		validation := validateAchievementEditorCategory(category, validationContext)
		if !validation.Valid() {
			return achievementEditorValidationFailure{result: validation}
		}
		if err := achievementEditorAssertCategoryParent(tx, category.ID, category.ParentID); err != nil {
			return err
		}
		return tx.Table("achievement_categories").Where("id = ?", category.ID).Updates(map[string]interface{}{
			"parent_id": category.ParentID, "sequence": category.Sequence, "name": category.Name,
			"description": category.Description, "icon": category.Icon,
		}).Error
	})
}

func achievementEditorAssertCategoryParent(tx *gorm.DB, categoryID uint32, parentID uint32) error {
	rows := make([]struct {
		ID       uint32
		ParentID uint32 `gorm:"column:parent_id"`
	}, 0)
	if err := tx.Table("achievement_categories").Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("id, parent_id").Scan(&rows).Error; err != nil {
		return err
	}
	parents := make(map[uint32]uint32)
	for _, row := range rows {
		parents[row.ID] = row.ParentID
	}
	if parentID != 0 {
		if _, exists := parents[parentID]; !exists {
			return achievementEditorFieldError(422, "parent_id", "The selected parent category does not exist", nil)
		}
	}
	parents[categoryID] = parentID
	seen := make(map[uint32]bool)
	for cursor := categoryID; cursor != 0; cursor = parents[cursor] {
		if seen[cursor] {
			return achievementEditorFieldError(422, "parent_id", "The selected parent would create a category cycle", nil)
		}
		seen[cursor] = true
		if cursor != categoryID {
			if _, exists := parents[cursor]; !exists {
				return achievementEditorFieldError(422, "parent_id", fmt.Sprintf("Category hierarchy references missing category %d", cursor), nil)
			}
		}
	}
	return nil
}

func (r *achievementEditorRepository) deleteCategory(id uint32, expectedRevision string) error {
	return achievementEditorWithAdvisoryTransaction(r.db, achievementEditorAuthoringLock, 5, func(tx *gorm.DB) error {
		var current struct{ ID uint32 }
		if err := tx.Table("achievement_categories").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id").Where("id = ?", id).Take(&current).Error; err != nil {
			return err
		}
		persisted, err := newAchievementEditorRepository(tx).loadCategory(id)
		if err != nil {
			return err
		}
		currentRevision, err := achievementEditorCategoryRevision(persisted)
		if err != nil {
			return err
		}
		if err := achievementEditorRequireRevision(expectedRevision, currentRevision, fmt.Sprintf("Category %d", id)); err != nil {
			return err
		}
		var children int64
		if err := tx.Table("achievement_categories").Where("parent_id = ?", id).Count(&children).Error; err != nil {
			return err
		}
		if children > 0 {
			return operationalEditorConflict("Move or delete this category's children first")
		}
		var associations int64
		if err := tx.Table("achievement_category_associations").Where("category_id = ?", id).Count(&associations).Error; err != nil {
			return err
		}
		if associations > 0 {
			return operationalEditorConflict("Remove this category's achievement associations first")
		}
		return tx.Table("achievement_categories").Where("id = ?", id).Delete(nil).Error
	})
}

type achievementEditorLookupSpec struct {
	from       string
	idColumn   string
	labelExpr  string
	detailExpr string
	iconExpr   string
	baseWhere  string
	orderBy    string
}

func achievementEditorLookupSpecs() map[string]achievementEditorLookupSpec {
	return map[string]achievementEditorLookupSpec{
		"achievement": {from: "achievements", idColumn: "id", labelExpr: "name", detailExpr: "description", orderBy: "name, id"},
		"category":    {from: "achievement_categories", idColumn: "id", labelExpr: "name", detailExpr: "description", orderBy: "name, id"},
		"npc":         {from: "npc_types", idColumn: "id", labelExpr: "name", detailExpr: "CONCAT('Level ', level, ' race ', race)", orderBy: "name, id"},
		"task":        {from: "tasks", idColumn: "id", labelExpr: "title", detailExpr: "description", orderBy: "title, id"},
		"zone":        {from: "zone", idColumn: "zoneidnumber", labelExpr: "long_name", detailExpr: "short_name", baseWhere: "version = 0", orderBy: "long_name, zoneidnumber"},
		"item":        {from: "items", idColumn: "id", labelExpr: "Name", detailExpr: "CONCAT('Icon ', icon)", iconExpr: "icon", orderBy: "Name, id"},
		"recipe":      {from: "tradeskill_recipe", idColumn: "id", labelExpr: "name", detailExpr: "CONCAT('Tradeskill ', tradeskill, ', trivial ', trivial)", orderBy: "name, id"},
		"currency":    {from: "alternate_currency", idColumn: "id", labelExpr: "CONCAT('Currency ', id)", detailExpr: "CONCAT('Token item ', item_id)", orderBy: "id"},
		"title-set":   {from: "titles", idColumn: "title_set", labelExpr: "CONCAT_WS(' / ', NULLIF(prefix, ''), NULLIF(suffix, ''))", detailExpr: "CONCAT('Title row ', id)", baseWhere: "title_set > 0", orderBy: "title_set, id"},
	}
}

func (r *achievementEditorRepository) lookup(kind string, search string, ids []uint32, limit int) ([]achievementEditorLookupOption, error) {
	if limit < 1 {
		limit = 20
	}
	if limit > achievementEditorLookupLimit {
		limit = achievementEditorLookupLimit
	}
	search = strings.TrimSpace(search)
	if kind == "npc-name" {
		return r.lookupNPCNames(search, limit)
	}
	if kind == "race" {
		return r.lookupNPCRaces(search, ids, limit)
	}

	specs := achievementEditorLookupSpecs()
	spec, ok := specs[kind]
	if !ok {
		return nil, achievementEditorRequestError(400, "Unknown achievement lookup type")
	}
	if kind == "title-set" {
		return r.lookupTitleSets(search, ids, limit)
	}
	where := make([]string, 0)
	args := make([]interface{}, 0)
	if spec.baseWhere != "" {
		where = append(where, spec.baseWhere)
	}
	if len(ids) > 0 {
		where = append(where, spec.idColumn+" IN ?")
		args = append(args, ids)
	} else if search != "" {
		like := "%" + search + "%"
		if exactID, err := strconv.ParseUint(search, 10, 32); err == nil {
			where = append(where, "("+spec.idColumn+" = ? OR "+spec.labelExpr+" LIKE ?)")
			args = append(args, exactID, like)
		} else {
			where = append(where, spec.labelExpr+" LIKE ?")
			args = append(args, like)
		}
	} else {
		return make([]achievementEditorLookupOption, 0), nil
	}
	query := "SELECT CAST(" + spec.idColumn + " AS CHAR) AS id, " + spec.labelExpr + " AS label, " + spec.detailExpr + " AS detail"
	if spec.iconExpr != "" {
		query += ", " + spec.iconExpr + " AS icon_id"
	}
	query += " FROM " + spec.from
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}
	query += " ORDER BY " + spec.orderBy + " LIMIT ?"
	args = append(args, limit)
	rows := make([]achievementEditorLookupOption, 0)
	if err := r.db.Raw(query, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func achievementEditorTitleSetLookupQuery(db *gorm.DB, search string, ids []uint32) *gorm.DB {
	const labelExpression = "CONCAT_WS(' / ', NULLIF(prefix, ''), NULLIF(suffix, ''))"
	selected := db.Session(&gorm.Session{NewDB: true}).Table("titles").
		Select("title_set, MIN(id) AS id").
		Where("title_set > 0")
	if len(ids) > 0 {
		selected = selected.Where("title_set IN ?", ids)
	} else {
		like := "%" + search + "%"
		if exactID, err := strconv.ParseUint(search, 10, 32); err == nil {
			selected = selected.Where("title_set = ? OR "+labelExpression+" LIKE ?", exactID, like)
		} else {
			selected = selected.Where(labelExpression+" LIKE ?", like)
		}
	}
	selected = selected.Group("title_set")
	return db.Table("titles title_row").
		Select("CAST(title_row.title_set AS CHAR) AS id, "+
			"CONCAT_WS(' / ', NULLIF(title_row.prefix, ''), NULLIF(title_row.suffix, '')) AS label, "+
			"CONCAT('Title row ', title_row.id) AS detail").
		Joins("JOIN (?) selected_title_set ON selected_title_set.title_set = title_row.title_set AND selected_title_set.id = title_row.id", selected).
		Order("title_row.title_set, title_row.id")
}

func (r *achievementEditorRepository) lookupTitleSets(search string, ids []uint32, limit int) ([]achievementEditorLookupOption, error) {
	if len(ids) == 0 && search == "" {
		return make([]achievementEditorLookupOption, 0), nil
	}
	rows := make([]achievementEditorLookupOption, 0)
	if err := achievementEditorTitleSetLookupQuery(r.db, search, ids).Limit(limit).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *achievementEditorRepository) lookupNPCRaces(search string, ids []uint32, limit int) ([]achievementEditorLookupOption, error) {
	type row struct {
		ID    uint32 `gorm:"column:id"`
		Count int64  `gorm:"column:npc_count"`
	}
	query := r.db.Table("npc_types").Select("race AS id, COUNT(*) AS npc_count").Where("race > 0")
	if len(ids) > 0 {
		query = query.Where("race IN ?", ids)
	} else if search != "" {
		if id, err := strconv.ParseUint(search, 10, 32); err == nil {
			query = query.Where("race = ?", id)
		} else {
			return make([]achievementEditorLookupOption, 0), nil
		}
	} else {
		return make([]achievementEditorLookupOption, 0), nil
	}
	rows := make([]row, 0)
	if err := query.Group("race").Order("race").Limit(limit).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]achievementEditorLookupOption, 0, len(rows))
	for _, item := range rows {
		result = append(result, achievementEditorLookupOption{
			ID: strconv.FormatUint(uint64(item.ID), 10), Label: fmt.Sprintf("NPC race %d", item.ID),
			Detail: fmt.Sprintf("%d NPC type rows currently use this race", item.Count),
		})
	}
	return result, nil
}

func (r *achievementEditorRepository) lookupNPCNames(search string, limit int) ([]achievementEditorLookupOption, error) {
	if search == "" {
		return make([]achievementEditorLookupOption, 0), nil
	}
	type row struct {
		ID   uint32 `gorm:"column:id"`
		Name string `gorm:"column:name"`
		Race uint32 `gorm:"column:race"`
	}
	rows := make([]row, 0)
	like := "%" + search + "%"
	query := r.db.Table("npc_types").Select("id, name, race")
	if id, err := strconv.ParseUint(search, 10, 32); err == nil {
		query = query.Where("id = ? OR name LIKE ?", id, like)
	} else {
		query = query.Where("name LIKE ?", like)
	}
	if err := query.Order("name, id").Limit(limit).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]achievementEditorLookupOption, 0, len(rows))
	for _, item := range rows {
		canonical := achievementCanonicalNPCName(item.Name)
		hash := achievementCanonicalNPCNameHash(item.Name)
		result = append(result, achievementEditorLookupOption{
			ID: strconv.FormatUint(uint64(hash), 10), Label: item.Name,
			Detail: fmt.Sprintf("NPC %d · canonical %q · race %d", item.ID, canonical, item.Race),
		})
	}
	return result, nil
}
