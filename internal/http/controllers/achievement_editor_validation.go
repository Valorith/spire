package controllers

import (
	"fmt"
	"strconv"
	"strings"
)

const (
	achievementEditorValidationError   = "error"
	achievementEditorValidationWarning = "warning"
	achievementEditorTextMaxBytes      = 65535
)

type achievementEditorValidationFinding struct {
	Path     string `json:"path"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type achievementEditorValidationResult struct {
	Findings []achievementEditorValidationFinding `json:"findings"`
}

func (r achievementEditorValidationResult) Valid() bool {
	for _, finding := range r.Findings {
		if finding.Severity == achievementEditorValidationError {
			return false
		}
	}
	return true
}

func (r *achievementEditorValidationResult) add(path, message string) {
	r.Findings = append(r.Findings, achievementEditorValidationFinding{Path: path, Message: message, Severity: achievementEditorValidationError})
}

func (r *achievementEditorValidationResult) warn(path, message string) {
	r.Findings = append(r.Findings, achievementEditorValidationFinding{Path: path, Message: message, Severity: achievementEditorValidationWarning})
}

// achievementEditorValidationContext contains facts loaded by the repository.
// Validators remain pure and deterministic; callbacks are hooks over an
// already-resolved catalog and must not mutate state.
type achievementEditorValidationContext struct {
	ExistingAchievementID           *uint32
	KnownCategoryIDs                map[uint32]struct{}
	CategoryParentByID              map[uint32]uint32
	KnownAchievementIDs             map[uint32]struct{}
	DependencyEdges                 map[uint32][]uint32
	KnownRestrictionIDs             map[uint32]struct{}
	KnownRewardSetIDs               map[uint32]struct{}
	KnownRewardIDs                  map[string]struct{}
	GlobalComponentCounts           map[uint32]uint32
	AllowGlobalComponentCountChange map[uint32]bool
	ExistingComponentIdentities     map[string]struct{}
	ExistingOrphanCriterionIDs      map[string]map[string]struct{}
	ExistingRewardIDs               map[string]struct{}
	ExistingRewardSetID             *uint32
	ExistingRewardOptionIDs         map[uint32]struct{}
	KnownNPCTypeIDs                 map[uint32]struct{}
	KnownNPCRaceIDs                 map[uint32]struct{}
	KnownTaskIDs                    map[uint32]struct{}
	KnownZoneIDs                    map[uint32]struct{}
	KnownItemIDs                    map[uint32]struct{}
	KnownRecipeIDs                  map[uint32]struct{}
	KnownSkillCaps                  map[achievementEditorSkillCapReference]struct{}
	KnownAlternateCurrencyIDs       map[uint32]struct{}
	KnownTitleSetIDs                map[uint32]struct{}
	ReferenceCatalogIssues          map[string]string
	RequireDatabaseContext          bool
	CategoryExists                  func(uint32) bool
	AchievementExists               func(uint32) bool
	RestrictionExists               func(uint32) bool
	DependencyWouldCycle            func(uint32, []uint32) bool
}

type achievementEditorCategoryValidationContext struct {
	ExistingCategoryID     *uint32
	KnownCategoryIDs       map[uint32]struct{}
	CategoryParentByID     map[uint32]uint32
	RequireDatabaseContext bool
	CategoryExists         func(uint32) bool
	ParentWouldCycle       func(uint32, uint32) bool
}

func validateAchievementEditorGraph(graph achievementEditorGraph, context achievementEditorValidationContext) achievementEditorValidationResult {
	result := achievementEditorValidationResult{Findings: make([]achievementEditorValidationFinding, 0)}
	validateAchievementEditorDefinitionHeader(graph, context, &result)
	validateAchievementEditorAssociations(graph, context, &result)
	validateAchievementEditorComponents(graph, context, &result)
	validateAchievementEditorRewards(graph, context, &result)
	validateAchievementEditorRestrictions(graph, context, &result)
	return result
}

func validateAchievementEditorDefinitionHeader(graph achievementEditorGraph, context achievementEditorValidationContext, result *achievementEditorValidationResult) {
	if graph.ID == 0 {
		result.add("id", "Achievement ID must be greater than zero.")
	}
	if context.ExistingAchievementID != nil && graph.ID != *context.ExistingAchievementID {
		result.add("id", "The stable achievement ID cannot be changed after creation.")
	}
	if strings.TrimSpace(graph.Name) == "" {
		result.add("name", "Achievement name is required.")
	}
	if len([]rune(graph.Name)) > 255 {
		result.add("name", "Achievement name may not exceed 255 characters.")
	}
	if len([]byte(graph.Description)) > achievementEditorTextMaxBytes {
		result.add("description", "Achievement description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).")
	}
	if graph.DefinitionVersion == 0 {
		result.add("definition_version", "Definition version must be greater than zero.")
	}
	if graph.Associations == nil {
		result.add("associations", "Category associations must be supplied as a list, even when empty.")
	}
	if graph.Components == nil {
		result.add("components", "Components must be supplied as a list, even when empty.")
	}
	if graph.Rewards == nil {
		result.add("rewards", "Rewards must be supplied as a list, even when empty.")
	}
	if graph.Restrictions == nil {
		result.add("restrictions", "Cast restrictions must be supplied as a list, even when empty.")
	}
	if context.RequireDatabaseContext && context.ExistingAchievementID != nil {
		if context.ExistingComponentIdentities == nil {
			result.add("components", "Stable component identities could not be verified against the stored definition.")
		}
		if context.ExistingOrphanCriterionIDs == nil {
			result.add("components", "Orphan criterion recovery state could not be verified against the stored definition.")
		}
		if context.ExistingRewardIDs == nil {
			result.add("rewards", "Stable reward identities could not be verified against the stored definition.")
		}
		if context.ExistingRewardOptionIDs == nil {
			result.add("reward_set.options", "Stable reward-option identities could not be verified against the stored definition.")
		}
	}
}

func validateAchievementEditorAssociations(graph achievementEditorGraph, context achievementEditorValidationContext, result *achievementEditorValidationResult) {
	if len(graph.Associations) > achievementEditorMaxAssociations {
		result.add("associations", fmt.Sprintf("A definition may contain at most %d category associations.", achievementEditorMaxAssociations))
	}
	seen := make(map[uint32]struct{}, len(graph.Associations))
	valid := 0
	for index, association := range graph.Associations {
		path := fmt.Sprintf("associations.%d", index)
		if association.AchievementID != 0 && association.AchievementID != graph.ID {
			result.add(path+".achievement_id", "The association must belong to the achievement being edited.")
		}
		if association.CategoryID == 0 {
			result.add(path+".category_id", "Select a nonzero category ID.")
			continue
		}
		if _, duplicate := seen[association.CategoryID]; duplicate {
			result.add(path+".category_id", "An achievement may be associated with a category only once.")
			continue
		}
		seen[association.CategoryID] = struct{}{}
		if !achievementEditorCategoryKnown(association.CategoryID, context) {
			result.add(path+".category_id", fmt.Sprintf("Category %d does not exist.", association.CategoryID))
			continue
		}
		if cycleInCategoryLineage(context.CategoryParentByID, association.CategoryID) {
			result.add(path+".category_id", "The selected category hierarchy contains a parent cycle.")
			continue
		}
		if len([]rune(association.DisplayText)) > 255 {
			result.add(path+".display_text", "Category display text may not exceed 255 characters.")
		}
		valid++
	}
	if graph.Enabled && valid == 0 {
		result.add("associations", "An enabled achievement must have at least one valid category association.")
	}
	if context.RequireDatabaseContext && context.KnownCategoryIDs == nil && context.CategoryExists == nil {
		result.add("associations", "Category references could not be verified against the active content database.")
	}
}

func validateAchievementEditorComponents(graph achievementEditorGraph, context achievementEditorValidationContext, result *achievementEditorValidationResult) {
	if len(graph.Components) > achievementEditorMaxComponents {
		result.add("components", fmt.Sprintf("A definition may contain at most %d components.", achievementEditorMaxComponents))
	}
	componentIdentities := make(map[string]struct{}, len(graph.Components))
	sequences := make(map[string]struct{}, len(graph.Components))
	presentationCounts := make(map[uint32]uint32)
	criterionRowIDs := make(map[string]struct{})
	requiredClasses := make(map[uint32]struct{})
	dependencies := make(map[uint32]struct{})
	resolvedOrphanGroups := make(map[string]struct{})
	totalCriteria := 0
	hasEnabledCriterion := false
	hasRequiredCriterion := false

	for componentIndex, component := range graph.Components {
		path := fmt.Sprintf("components.%d", componentIndex)
		if component.AchievementID != 0 && component.AchievementID != graph.ID {
			result.add(path+".achievement_id", "The component must belong to the achievement being edited.")
		}
		if component.ComponentType > 3 {
			result.add(path+".component_type", "Component type must be from 0 through 3.")
		}
		if len([]byte(component.Description)) > achievementEditorTextMaxBytes {
			result.add(path+".description", "Component primary description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).")
		}
		if len([]byte(component.Description2)) > achievementEditorTextMaxBytes {
			result.add(path+".description_2", "Component secondary description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).")
		}
		identity := achievementEditorComponentIdentity(component.ComponentType, component.ComponentID)
		if _, duplicate := componentIdentities[identity]; duplicate {
			result.add(path+".component_id", "Component identity (wire type plus component ID) must be unique within the achievement.")
		}
		componentIdentities[identity] = struct{}{}
		if skip := validateAchievementEditorRecoveryComponent(
			graph.ID,
			component,
			componentIndex,
			identity,
			context,
			criterionRowIDs,
			resolvedOrphanGroups,
			result,
		); skip {
			totalCriteria += len(component.Criteria)
			continue
		}
		sequenceKey := fmt.Sprintf("%d:%d", component.ComponentType, component.Sequence)
		if _, duplicate := sequences[sequenceKey]; duplicate {
			result.warn(path+".sequence", "Another component in this wire type uses the same client order; RoF2 breaks ties by component ID.")
		}
		sequences[sequenceKey] = struct{}{}
		if component.Sequence > 255 {
			result.warn(path+".sequence", "RoF2 clamps component display order above 255.")
		}
		if component.PresentationCount == 0 {
			result.add(path+".presentation_count", "Presentation count must be greater than zero.")
		} else if prior, found := presentationCounts[component.ComponentID]; found && prior != component.PresentationCount {
			result.add(path+".presentation_count", "Components sharing a component ID must share one global presentation count.")
		} else {
			presentationCounts[component.ComponentID] = component.PresentationCount
		}
		if stored, found := context.GlobalComponentCounts[component.ComponentID]; found && stored != component.PresentationCount && !context.AllowGlobalComponentCountChange[component.ComponentID] {
			result.add(path+".presentation_count", fmt.Sprintf("Component ID %d already has global presentation count %d. Changing it would affect other definitions.", component.ComponentID, stored))
		}
		if component.Criteria == nil {
			result.add(path+".criteria", "Criteria must be supplied as a list, even when empty.")
		}
		totalCriteria += len(component.Criteria)
		validateAchievementEditorComponentCriteria(graph.ID, graph.Enabled, component, componentIndex, context, criterionRowIDs, requiredClasses, dependencies, &hasEnabledCriterion, &hasRequiredCriterion, result)
	}

	if totalCriteria > achievementEditorMaxCriteria {
		result.add("components", fmt.Sprintf("A definition may contain at most %d criteria across all components.", achievementEditorMaxCriteria))
	}
	for identity := range context.ExistingComponentIdentities {
		if _, retained := componentIdentities[identity]; !retained {
			result.add("components", fmt.Sprintf("Stable component %s cannot be removed because durable character progress may reference it. Disable its criteria instead.", identity))
		}
	}
	for identity := range context.ExistingOrphanCriterionIDs {
		if _, resolved := resolvedOrphanGroups[identity]; !resolved {
			result.add("components", fmt.Sprintf("Stored orphan criteria for missing component %s were omitted. Reload and explicitly restore the component or delete the orphan criteria.", identity))
		}
	}
	if len(requiredClasses) > 1 {
		result.add("components", "Required, Unlock, and Visibility class criteria must agree on one EQ class.")
	}
	if graph.Enabled && len(graph.Components) == 0 {
		result.warn("components", "This enabled definition has no visible components. Direct completion can work, but the client has no authored steps.")
	}
	if graph.Enabled && hasEnabledCriterion && !hasRequiredCriterion {
		result.warn("components", "No enabled criterion uses Required behavior, so criteria alone cannot complete this achievement.")
	}
	validateAchievementDependencies(graph.ID, dependencies, context, result)
	if context.RequireDatabaseContext && context.GlobalComponentCounts == nil {
		result.add("components", "Global component counts could not be verified against the active content database.")
	}
}

// validateAchievementEditorRecoveryComponent returns true when ordinary
// component validation must be skipped. Orphan criteria are deliberately
// read-only until the author chooses one whole-group recovery action. This
// prevents an older or partial client from silently adopting or deleting rows
// merely by round-tripping an incomplete graph.
func validateAchievementEditorRecoveryComponent(
	achievementID uint32,
	component achievementEditorComponent,
	componentIndex int,
	identity string,
	context achievementEditorValidationContext,
	criterionRowIDs map[string]struct{},
	resolved map[string]struct{},
	result *achievementEditorValidationResult,
) bool {
	storedIDs, storedOrphan := context.ExistingOrphanCriterionIDs[identity]
	markedRecovery := component.RecoveryOnly || component.RecoveryAction != "" || component.RecoveryCriteriaCount != 0
	if !storedOrphan && !markedRecovery {
		return false
	}

	path := fmt.Sprintf("components.%d", componentIndex)
	if !storedOrphan {
		result.add(path+".recovery_only", "Recovery components may only resolve orphan criteria verified in the stored definition.")
		return true
	}
	resolved[identity] = struct{}{}
	if !component.RecoveryOnly {
		result.add(path+".recovery_only", "This missing-component criterion group must retain its recovery marker until it is explicitly restored or deleted.")
	}
	if component.AchievementID != 0 && component.AchievementID != achievementID {
		result.add(path+".achievement_id", "The recovery group must belong to the achievement being edited.")
	}
	if component.RecoveryCriteriaCount != len(storedIDs) {
		result.add(path+".recovery_criteria_count", fmt.Sprintf("This recovery group must retain its stored count of %d orphan criteria.", len(storedIDs)))
	}

	willRestore := component.RecoveryAction == achievementEditorRecoveryActionRestore
	submittedIDs := make(map[string]struct{}, len(component.Criteria))
	for criterionIndex, criterion := range component.Criteria {
		criterionPath := fmt.Sprintf("%s.criteria.%d", path, criterionIndex)
		id, valid := parseUnsignedDecimal(criterion.ID, 64, false)
		if !valid {
			result.add(criterionPath+".id", "Recovery criteria must retain their nonzero stored row IDs.")
			continue
		}
		if _, duplicate := criterionRowIDs[id]; duplicate {
			result.add(criterionPath+".id", "A criterion row ID may appear only once in the submitted graph.")
		} else if !willRestore {
			criterionRowIDs[id] = struct{}{}
		}
		if _, expected := storedIDs[id]; !expected {
			result.add(criterionPath+".id", "New or moved criteria cannot be added to a recovery-only component. Restore it first, save, and then edit the real component.")
		}
		submittedIDs[id] = struct{}{}
	}
	for id := range storedIDs {
		if _, retained := submittedIDs[id]; !retained {
			result.add(path+".criteria", "Recovery criterion row "+id+" was omitted. Use the explicit whole-group Delete action instead of dropping rows from the payload.")
		}
	}

	switch component.RecoveryAction {
	case achievementEditorRecoveryActionRestore:
		return false
	case achievementEditorRecoveryActionDelete:
		return true
	case "":
		result.add(path+".recovery_action", "Choose Restore missing component to preserve these criteria, or Delete orphan criteria to remove them explicitly.")
	default:
		result.add(path+".recovery_action", "Recovery action must be restore or delete.")
	}
	return true
}

func validateAchievementEditorComponentCriteria(
	achievementID uint32,
	definitionEnabled bool,
	component achievementEditorComponent,
	componentIndex int,
	context achievementEditorValidationContext,
	criterionRowIDs map[string]struct{},
	requiredClasses map[uint32]struct{},
	dependencies map[uint32]struct{},
	hasEnabledCriterion *bool,
	hasRequiredCriterion *bool,
	result *achievementEditorValidationResult,
) {
	identities := make(map[string]struct{})
	enabledPolicy := ""
	for criterionIndex, criterion := range component.Criteria {
		path := fmt.Sprintf("components.%d.criteria.%d", componentIndex, criterionIndex)
		if criterion.ID != "" {
			id, valid := parseUnsignedDecimal(criterion.ID, 64, false)
			if !valid {
				result.add(path+".id", "Criterion row ID must be a nonzero unsigned 64-bit decimal string.")
			} else if _, duplicate := criterionRowIDs[id]; duplicate {
				result.add(path+".id", "A criterion row ID may appear only once in the submitted graph.")
			} else {
				criterionRowIDs[id] = struct{}{}
			}
		}
		if criterion.AchievementID != 0 && criterion.AchievementID != achievementID {
			result.add(path+".achievement_id", "The criterion must belong to the achievement being edited.")
		}
		if criterion.ComponentType != component.ComponentType {
			result.add(path+".component_type", "The criterion wire type must match its containing component.")
		}
		if criterion.ComponentID != component.ComponentID {
			result.add(path+".component_id", "The criterion component ID must match its containing component.")
		}
		if criterion.ComponentSequence != component.Sequence {
			result.warn(path+".component_sequence", "Keep the criterion component-order copy synchronized with the containing component.")
		}
		if criterion.EventType > 13 {
			result.add(path+".event_type", "Criterion event type must be from 0 through 13.")
			continue
		}
		if criterion.ProgressMode > 3 {
			result.add(path+".progress_mode", "Progress mode must be from 0 through 3.")
		}
		if criterion.Behavior > 5 {
			result.add(path+".behavior", "Behavior must be from 0 through 5.")
		}
		targetValue, targetValueValid := achievementEditorCriterionTargetValue(criterion.TargetValue)
		if !targetValueValid {
			result.add(path+".target_value", "Target value must be a nonnegative signed 64-bit integer.")
		}
		if criterion.RequiredCount == 0 {
			result.add(path+".required_count", "Required count must be greater than zero.")
		}
		identity := fmt.Sprintf("%d:%d:%d", criterion.EventType, criterion.TargetID, criterion.TargetID2)
		if _, duplicate := identities[identity]; duplicate {
			result.add(path+".target_id", "Criterion event and target identity must be unique for this component.")
		}
		identities[identity] = struct{}{}
		validateAchievementCriterionEvent(criterion, targetValue, targetValueValid, path, result)

		if criterion.Enabled {
			validateAchievementCriterionReference(criterion, targetValue, targetValueValid, path, definitionEnabled, context, result)
			*hasEnabledCriterion = true
			if component.ComponentType == 3 {
				result.add(path+".enabled", "RoF2 component type 3 is presentation-only and cannot have an enabled criterion.")
			}
			policy := fmt.Sprintf("%d:%d:%d:%d", criterion.EventType, criterion.ProgressMode, criterion.Behavior, criterion.RequiredCount)
			if enabledPolicy != "" && enabledPolicy != policy {
				result.add(path, "Enabled alternative criteria for one component must agree on event, progress mode, behavior, and required count.")
			}
			enabledPolicy = policy
			if criterion.Behavior == 0 {
				*hasRequiredCriterion = true
			}
			if (criterion.Behavior == 0 || criterion.Behavior == 2 || criterion.Behavior == 3) && (criterion.EventType == 7 || criterion.EventType == 13) && criterion.TargetID2 >= 1 && criterion.TargetID2 <= 16 {
				requiredClasses[criterion.TargetID2] = struct{}{}
			}
			if criterion.EventType == 11 && criterion.TargetID != 0 {
				dependencies[criterion.TargetID] = struct{}{}
				if criterion.TargetID == achievementID {
					result.add(path+".target_id", "An enabled achievement cannot depend on its own completion.")
				}
			}
		}
	}
}

func validateAchievementCriterionReference(
	criterion achievementEditorCriterion,
	targetValue uint64,
	targetValueValid bool,
	path string,
	definitionEnabled bool,
	context achievementEditorValidationContext,
	result *achievementEditorValidationResult,
) {
	switch criterion.EventType {
	case 2:
		if criterion.TargetID != 0 {
			validateAchievementEditorIDReference(path+".target_id", "NPC type", criterion.TargetID, achievementEditorReferenceNPCType, context.KnownNPCTypeIDs, definitionEnabled, context, result)
		}
	case 3:
		if criterion.TargetID != 0 {
			validateAchievementEditorAdvisoryIDReference(path+".target_id", "NPC race", criterion.TargetID, achievementEditorReferenceNPCRace, context.KnownNPCRaceIDs, context, result)
		}
	case 4:
		if criterion.TargetID != 0 {
			validateAchievementEditorIDReference(path+".target_id", "Task", criterion.TargetID, achievementEditorReferenceTask, context.KnownTaskIDs, definitionEnabled, context, result)
		}
	case 5:
		if criterion.TargetID != 0 {
			validateAchievementEditorIDReference(path+".target_id", "Zone", criterion.TargetID, achievementEditorReferenceZone, context.KnownZoneIDs, definitionEnabled, context, result)
		}
	case 6, 7:
		if criterion.TargetID != 0 {
			validateAchievementEditorIDReference(path+".target_id", "Item", criterion.TargetID, achievementEditorReferenceItem, context.KnownItemIDs, definitionEnabled, context, result)
		}
	case 8:
		if criterion.TargetID != 0 {
			validateAchievementEditorIDReference(path+".target_id", "Tradeskill recipe", criterion.TargetID, achievementEditorReferenceRecipe, context.KnownRecipeIDs, definitionEnabled, context, result)
		}
	case 12:
		if criterion.TargetID2 != 0 {
			validateAchievementEditorIDReference(path+".target_id2", "Zone", criterion.TargetID2, achievementEditorReferenceZone, context.KnownZoneIDs, definitionEnabled, context, result)
		}
	case 13:
		if !targetValueValid || criterion.TargetID > 77 || criterion.TargetID2 < 1 || criterion.TargetID2 > 16 || targetValue < 1 || targetValue > 255 {
			return
		}
		reference := achievementEditorSkillCapReference{SkillID: criterion.TargetID, ClassID: criterion.TargetID2, Level: uint32(targetValue)}
		if context.KnownSkillCaps == nil {
			if context.RequireDatabaseContext {
				addAchievementEditorPublicationFinding(
					result,
					path+".target_value",
					achievementEditorReferenceUnavailableMessage("Skill-cap tuple", achievementEditorReferenceSkillCap, context),
					definitionEnabled,
				)
			}
			return
		}
		if _, found := context.KnownSkillCaps[reference]; !found {
			message := fmt.Sprintf("Skill-cap tuple skill %d, class %d, level %d does not exist.", reference.SkillID, reference.ClassID, reference.Level)
			addAchievementEditorPublicationFinding(result, path+".target_value", message, definitionEnabled)
		}
	}
}

func validateAchievementEditorIDReference(
	path string,
	label string,
	id uint32,
	catalog string,
	known map[uint32]struct{},
	definitionEnabled bool,
	context achievementEditorValidationContext,
	result *achievementEditorValidationResult,
) {
	if known == nil {
		if context.RequireDatabaseContext {
			addAchievementEditorPublicationFinding(
				result,
				path,
				achievementEditorReferenceUnavailableMessage(label, catalog, context),
				definitionEnabled,
			)
		}
		return
	}
	if _, found := known[id]; !found {
		message := fmt.Sprintf("%s %d does not exist.", label, id)
		addAchievementEditorPublicationFinding(result, path, message, definitionEnabled)
	}
}

// Race IDs are engine-level numeric identities and custom race IDs remain
// valid even when no current npc_types row uses them. Catalog presence is
// therefore educational, not an authoring gate.
func validateAchievementEditorAdvisoryIDReference(
	path string,
	label string,
	id uint32,
	catalog string,
	known map[uint32]struct{},
	context achievementEditorValidationContext,
	result *achievementEditorValidationResult,
) {
	if known == nil {
		if context.RequireDatabaseContext {
			result.warn(path, achievementEditorReferenceUnavailableMessage(label, catalog, context))
		}
		return
	}
	if _, found := known[id]; !found {
		result.warn(path, fmt.Sprintf("%s %d is not used by any current npc_types row; custom race IDs remain authorable.", label, id))
	}
}

func achievementEditorReferenceUnavailableMessage(label string, catalog string, context achievementEditorValidationContext) string {
	diagnostic := strings.TrimSpace(context.ReferenceCatalogIssues[catalog])
	if diagnostic == "" {
		diagnostic = "the active content catalog was not loaded"
	}
	return fmt.Sprintf("%s could not be verified because %s.", label, diagnostic)
}

func achievementEditorCriterionTargetValue(raw string) (uint64, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" || strings.HasPrefix(raw, "+") || strings.HasPrefix(raw, "-") {
		return 0, false
	}
	value, err := strconv.ParseUint(raw, 10, 63)
	return value, err == nil
}

func validateAchievementCriterionEvent(criterion achievementEditorCriterion, targetValue uint64, targetValueValid bool, path string, result *achievementEditorValidationResult) {
	if achievementEditorAbsoluteEvent(criterion.EventType) && criterion.ProgressMode == 0 {
		result.add(path+".progress_mode", "This replayed or absolute event cannot safely use Increment. Choose Highest, Set, or Boolean.")
	}
	if criterion.TargetID2 != 0 && criterion.EventType != 7 && criterion.EventType != 12 && criterion.EventType != 13 {
		result.add(path+".target_id2", "This event does not support a secondary target; use 0.")
	}
	if (criterion.EventType == 1 || criterion.EventType == 10) && criterion.TargetID != 0 {
		result.add(path+".target_id", "Level and Alternate Advancement criteria must use target ID 0.")
	}
	if criterion.EventType == 4 && criterion.TargetID == 0 {
		result.add(path+".target_id", "Task Complete requires a specific nonzero task ID so completion can be reconciled.")
	}
	if criterion.EventType == 7 && criterion.TargetID2 > 16 {
		result.add(path+".target_id2", "Own Item class must be 0 (any class) or an EQ class ID from 1 through 16.")
	}
	if criterion.EventType == 9 && criterion.TargetID != achievementEditorSkillWildcard && criterion.TargetID > 77 {
		result.add(path+".target_id", "Skill Value requires skill ID 0 through 77, or 4294967295 for the wildcard.")
	}
	if criterion.EventType == 12 && criterion.TargetID == 0 {
		result.add(path+".target_id", "NPC Name Kill requires a nonzero canonical-name hash.")
	}
	if criterion.EventType == 13 {
		if criterion.TargetID > 77 {
			result.add(path+".target_id", "Skill Cap requires a canonical skill ID from 0 through 77.")
		}
		if criterion.TargetID2 < 1 || criterion.TargetID2 > 16 {
			result.add(path+".target_id2", "Skill Cap requires an EQ class ID from 1 through 16.")
		}
		if targetValueValid && (targetValue < 1 || targetValue > 255) {
			result.add(path+".target_value", "Skill Cap milestone level must be from 1 through 255.")
		}
	}
	if targetValueValid && (criterion.EventType == 4 || criterion.EventType == 8 || criterion.EventType == 11) && targetValue > 1 {
		result.add(path+".target_value", "This completion event target value must be 0 or 1.")
	}
	if targetValueValid && criterion.ProgressMode == 3 && achievementEditorBooleanNeedsPositiveTarget(criterion.EventType) && targetValue == 0 {
		result.add(path+".target_value", "Boolean mode requires a positive target value for this absolute event.")
	}
}

func validateAchievementDependencies(id uint32, dependencySet map[uint32]struct{}, context achievementEditorValidationContext, result *achievementEditorValidationResult) {
	dependencies := make([]uint32, 0, len(dependencySet))
	for target := range dependencySet {
		dependencies = append(dependencies, target)
		if target != id && !achievementEditorAchievementKnown(target, context) {
			result.add("components", fmt.Sprintf("Achievement Complete criterion references missing achievement %d.", target))
		}
	}
	if len(dependencies) == 0 {
		return
	}
	if context.DependencyWouldCycle != nil && context.DependencyWouldCycle(id, dependencies) {
		result.add("components", "Enabled achievement-completion criteria would create a dependency cycle.")
		return
	}
	if context.DependencyEdges != nil {
		edges := cloneDependencyEdges(context.DependencyEdges)
		edges[id] = dependencies
		if achievementDependencyHasCycle(edges, id) {
			result.add("components", "Enabled achievement-completion criteria would create a dependency cycle.")
		}
	} else if context.RequireDatabaseContext && context.DependencyWouldCycle == nil {
		result.add("components", "Achievement dependency cycles could not be verified against the active content database.")
	}
	if context.RequireDatabaseContext && context.KnownAchievementIDs == nil && context.AchievementExists == nil {
		result.add("components", "Achievement dependency targets could not be verified against the active content database.")
	}
}

func validateAchievementEditorRewards(graph achievementEditorGraph, context achievementEditorValidationContext, result *achievementEditorValidationResult) {
	if len(graph.Rewards) > achievementEditorMaxRewards {
		result.add("rewards", fmt.Sprintf("A definition may contain at most %d rewards.", achievementEditorMaxRewards))
	}
	rewardPaths := make(map[string]string)
	rewardEnabled := make(map[string]bool)
	rewardSequences := make(map[uint32]struct{})
	if context.RequireDatabaseContext && context.ExistingAchievementID == nil && context.KnownRewardIDs == nil {
		for _, reward := range graph.Rewards {
			if strings.TrimSpace(reward.RewardID) != "" {
				result.add("rewards", "Submitted reward IDs could not be checked for collisions in the active content database.")
				break
			}
		}
	}

	for index, reward := range graph.Rewards {
		path := fmt.Sprintf("rewards.%d", index)
		if reward.AchievementID != 0 && reward.AchievementID != graph.ID {
			result.add(path+".achievement_id", "The reward must belong to the achievement being edited.")
		}
		id := ""
		transientID := fmt.Sprintf("@%d", index)
		if reward.RewardID != "" {
			var valid bool
			id, valid = parseUnsignedDecimal(reward.RewardID, 64, false)
			if !valid {
				result.add(path+".reward_id", "Reward ID must be a nonzero unsigned 64-bit decimal string.")
				id = ""
			} else if prior, duplicate := rewardPaths[id]; duplicate {
				result.add(path+".reward_id", fmt.Sprintf("Reward ID is already used by %s.", prior))
			} else {
				rewardPaths[id] = path
				rewardEnabled[id] = reward.Enabled
			}
			if context.ExistingAchievementID != nil {
				if _, owned := context.ExistingRewardIDs[id]; !owned {
					result.add(path+".reward_id", "Existing definitions cannot adopt a reward ID. Leave a new reward ID empty so the database allocates it.")
				}
			} else if _, used := context.KnownRewardIDs[id]; used {
				result.add(path+".reward_id", "This reward ID is already used by another definition.")
			}
			if reward.Enabled && !decimalFitsUint32(id) {
				result.add(path+".reward_id", "Enabled reward IDs must fit the unsigned 32-bit RoF2 wire field.")
			}
		} else {
			// Blank canonical IDs are allocated transactionally. The transient
			// index token lets selectable-option mappings follow that row until
			// the database returns its durable identity.
			rewardPaths[transientID] = path
			rewardEnabled[transientID] = reward.Enabled
		}
		if _, duplicate := rewardSequences[reward.Sequence]; duplicate {
			result.add(path+".sequence", "Reward sequence must be unique within the achievement.")
		}
		rewardSequences[reward.Sequence] = struct{}{}
		if reward.RewardType > 5 {
			result.add(path+".reward_type", "Reward type must be from 0 through 5.")
		}
		amount, amountValid := parseUnsignedDecimal(reward.Amount, 64, false)
		if !amountValid {
			result.add(path+".amount", "Reward amount must be a positive unsigned 64-bit decimal string.")
		}
		if len([]rune(reward.Description)) > 255 {
			result.add(path+".description", "Reward description may not exceed 255 characters.")
		}
		if reward.Enabled && (reward.RewardType == 0 || reward.RewardType == 4 || reward.RewardType == 5) && reward.RewardDataID == 0 {
			result.add(path+".reward_data_id", "Enabled item, alternate-currency, and title rewards require a nonzero referenced data ID.")
		}
		if reward.RewardType == 1 && reward.RewardDataID > 1 {
			result.add(path+".reward_data_id", "Experience mode must be 0 (normal handling) or 1 (normal-only raw XP).")
		}
		if reward.Enabled {
			validateAchievementEditorRewardReference(reward, path, graph.Enabled, context, result)
			if amountValid {
				validateAchievementEditorRewardDeliveryBounds(reward, amount, path, graph.Enabled, result)
			}
		}
	}
	for id := range context.ExistingRewardIDs {
		if _, retained := rewardPaths[id]; !retained {
			result.add("rewards", fmt.Sprintf("Stable reward ID %s cannot be removed because character delivery ledgers may reference it. Disable it instead.", id))
		}
	}
	validateAchievementEditorRewardSet(graph, context, rewardPaths, rewardEnabled, result)
}

func validateAchievementEditorRewardReference(reward achievementEditorReward, path string, definitionEnabled bool, context achievementEditorValidationContext, result *achievementEditorValidationResult) {
	switch reward.RewardType {
	case 0:
		if reward.RewardDataID != 0 {
			validateAchievementEditorIDReference(path+".reward_data_id", "Item", reward.RewardDataID, achievementEditorReferenceItem, context.KnownItemIDs, definitionEnabled, context, result)
		}
	case 4:
		if reward.RewardDataID != 0 {
			validateAchievementEditorIDReference(path+".reward_data_id", "Alternate currency", reward.RewardDataID, achievementEditorReferenceCurrency, context.KnownAlternateCurrencyIDs, definitionEnabled, context, result)
		}
	case 5:
		if reward.RewardDataID != 0 {
			validateAchievementEditorIDReference(path+".reward_data_id", "Title set", reward.RewardDataID, achievementEditorReferenceTitleSet, context.KnownTitleSetIDs, definitionEnabled, context, result)
		}
	}
}

func validateAchievementEditorRewardDeliveryBounds(reward achievementEditorReward, amount string, path string, definitionEnabled bool, result *achievementEditorValidationResult) {
	switch reward.RewardType {
	case 0:
		if !decimalFitsMaximum(amount, "32767") {
			addAchievementEditorPublicationFinding(result, path+".amount", "Item reward amount cannot exceed 32,767, the runtime item-summon limit.", definitionEnabled)
		}
	case 1:
		if !decimalFitsMaximum(amount, "4294967295") {
			addAchievementEditorPublicationFinding(result, path+".amount", "Experience reward amount cannot exceed 4,294,967,295.", definitionEnabled)
		}
	case 2:
		if reward.RewardDataID != 0 {
			addAchievementEditorPublicationFinding(result, path+".reward_data_id", "Alternate Advancement rewards must use data ID 0; the runtime ignores other values.", definitionEnabled)
		}
		if !decimalFitsMaximum(amount, "2147483647") {
			addAchievementEditorPublicationFinding(result, path+".amount", "Alternate Advancement reward amount cannot exceed 2,147,483,647.", definitionEnabled)
		}
	case 3:
		if reward.RewardDataID != 0 {
			addAchievementEditorPublicationFinding(result, path+".reward_data_id", "Copper rewards must use data ID 0; the runtime ignores other values.", definitionEnabled)
		}
		if !decimalFitsMaximum(amount, "2147483647999") {
			addAchievementEditorPublicationFinding(result, path+".amount", "Copper reward amount cannot exceed 2,147,483,647,999, the runtime denomination limit.", definitionEnabled)
		}
	case 4:
		if !decimalFitsMaximum(amount, "2147483647") {
			addAchievementEditorPublicationFinding(result, path+".amount", "Alternate-currency reward amount cannot exceed 2,147,483,647.", definitionEnabled)
		}
	case 5:
		if reward.RewardDataID > 2147483647 {
			addAchievementEditorPublicationFinding(result, path+".reward_data_id", "Title-set ID cannot exceed 2,147,483,647, the runtime signed title limit.", definitionEnabled)
		}
		if amount != "1" {
			addAchievementEditorPublicationFinding(result, path+".amount", "Title rewards must use amount 1; the title set is unlocked once.", definitionEnabled)
		}
	}
}

func addAchievementEditorPublicationFinding(result *achievementEditorValidationResult, path string, message string, definitionEnabled bool) {
	if definitionEnabled {
		result.add(path, message)
	} else {
		result.warn(path, message)
	}
}

func validateAchievementEditorRewardSet(graph achievementEditorGraph, context achievementEditorValidationContext, rewardPaths map[string]string, rewardEnabled map[string]bool, result *achievementEditorValidationResult) {
	set := graph.RewardSet
	if set == nil {
		if context.ExistingRewardSetID != nil {
			result.add("reward_set", "The stable reward-set ID cannot be cleared after creation. Disable the set instead.")
		}
		return
	}
	if set.RewardSetID == 0 && context.ExistingAchievementID != nil {
		result.add("reward_set.reward_set_id", "Reward set ID must be greater than zero.")
	}
	if set.AchievementID != 0 && set.AchievementID != graph.ID {
		result.add("reward_set.achievement_id", "The reward set must belong to the achievement being edited.")
	}
	if set.Enabled && !graph.Enabled {
		result.add("reward_set.enabled", "Disable the selectable reward set before disabling its achievement; an enabled set owned by a disabled definition makes the runtime snapshot fail to load.")
	}
	if len([]rune(set.Title)) > 255 {
		result.add("reward_set.title", "Reward-set title may not exceed 255 characters.")
	}
	if context.ExistingRewardSetID != nil && set.RewardSetID != *context.ExistingRewardSetID {
		result.add("reward_set.reward_set_id", "The stable reward-set ID cannot be changed after creation.")
	} else if context.ExistingRewardSetID == nil && set.RewardSetID != 0 {
		if context.RequireDatabaseContext && context.KnownRewardSetIDs == nil {
			result.add("reward_set.reward_set_id", "Reward-set identity could not be checked for collisions in the active content database.")
		}
		if _, used := context.KnownRewardSetIDs[set.RewardSetID]; used {
			result.add("reward_set.reward_set_id", "This reward-set ID is already used by another definition.")
		}
	}
	if set.Options == nil {
		result.add("reward_set.options", "Reward options must be supplied as a list.")
	}
	if set.Mappings == nil {
		result.add("reward_set.mappings", "Reward mappings must be supplied as a list.")
	}
	if len(set.Options) > achievementEditorMaxRewardOptions {
		result.add("reward_set.options", fmt.Sprintf("A reward set may contain at most %d options.", achievementEditorMaxRewardOptions))
	}
	if len(set.Mappings) > achievementEditorMaxRewardMappings {
		result.add("reward_set.mappings", fmt.Sprintf("A reward set may contain at most %d mappings.", achievementEditorMaxRewardMappings))
	}

	optionPaths := make(map[uint32]string)
	optionEnabled := make(map[uint32]bool)
	optionCommon := make(map[uint32]bool)
	optionSequences := make(map[uint32]struct{})
	for index, option := range set.Options {
		path := fmt.Sprintf("reward_set.options.%d", index)
		if option.RewardSetID != 0 && option.RewardSetID != set.RewardSetID {
			result.add(path+".reward_set_id", "The option must belong to the containing reward set.")
		}
		if option.OptionID == 0 {
			result.add(path+".option_id", "Option ID must be greater than zero.")
		} else if _, duplicate := optionPaths[option.OptionID]; duplicate {
			result.add(path+".option_id", "Option IDs must be unique within a reward set.")
		} else {
			optionPaths[option.OptionID] = path
			optionEnabled[option.OptionID] = option.Enabled
			optionCommon[option.OptionID] = option.CommonToAll
		}
		if _, duplicate := optionSequences[option.Sequence]; duplicate {
			result.warn(path+".sequence", "Another option uses this display order; the client breaks ties by option ID.")
		}
		optionSequences[option.Sequence] = struct{}{}
		if len([]rune(option.Label)) > 255 {
			result.add(path+".label", "Reward option label may not exceed 255 characters.")
		}
	}
	for id := range context.ExistingRewardOptionIDs {
		if _, retained := optionPaths[id]; !retained {
			result.add("reward_set.options", fmt.Sprintf("Stable reward option %d cannot be removed because character selections may reference it. Disable it instead.", id))
		}
	}

	mappedRewards := make(map[string]uint32)
	enabledGrants := make(map[uint32]int)
	for index, mapping := range set.Mappings {
		path := fmt.Sprintf("reward_set.mappings.%d", index)
		if mapping.RewardSetID != 0 && mapping.RewardSetID != set.RewardSetID {
			result.add(path+".reward_set_id", "The mapping must belong to the containing reward set.")
		}
		if _, found := optionPaths[mapping.OptionID]; !found {
			result.add(path+".option_id", "The mapped reward option does not exist in this reward set.")
		}
		rewardID := mapping.RewardID
		valid := false
		if strings.HasPrefix(rewardID, "@") {
			_, valid = rewardPaths[rewardID]
		} else {
			rewardID, valid = parseUnsignedDecimal(mapping.RewardID, 64, false)
		}
		if !valid {
			result.add(path+".reward_id", "Select a valid nonzero reward ID.")
			continue
		}
		if _, found := rewardPaths[rewardID]; !found {
			result.add(path+".reward_id", fmt.Sprintf("Mapped reward %s does not exist in this achievement.", rewardID))
		}
		if prior, duplicate := mappedRewards[rewardID]; duplicate {
			if prior == mapping.OptionID {
				result.add(path+".reward_id", "A canonical reward may be mapped only once.")
			} else {
				result.add(path+".reward_id", "A canonical reward may belong to only one selectable option.")
			}
		}
		mappedRewards[rewardID] = mapping.OptionID
		if rewardEnabled[rewardID] {
			enabledGrants[mapping.OptionID]++
			if enabled, found := optionEnabled[mapping.OptionID]; found && !enabled {
				if graph.Enabled {
					result.add(path+".option_id", "This enabled reward is excluded from automatic delivery by its mapping, but the owning option is disabled. Enable the option, disable the reward, or remove the mapping.")
				} else {
					result.warn(path+".option_id", "This enabled reward is mapped to a disabled option and will not fall back to automatic delivery.")
				}
			}
			if graph.Enabled && !set.Enabled {
				result.add(path+".reward_id", "This enabled reward is excluded from automatic delivery by its mapping, but the selectable reward set is disabled. Enable the set, disable the reward, or remove the mapping.")
			}
		}
	}
	if set.Enabled {
		hasSelectable := false
		for id, path := range optionPaths {
			if !optionEnabled[id] {
				continue
			}
			if !optionCommon[id] {
				hasSelectable = true
			}
			if enabledGrants[id] == 0 {
				result.add(path, "Every enabled reward option must contain at least one enabled grant.")
			}
		}
		if !hasSelectable {
			result.add("reward_set.options", "An enabled reward set requires at least one enabled, non-common selectable option.")
		}
	}
}

func validateAchievementEditorRestrictions(graph achievementEditorGraph, context achievementEditorValidationContext, result *achievementEditorValidationResult) {
	if len(graph.Restrictions) > achievementEditorMaxRestrictions {
		result.add("restrictions", fmt.Sprintf("A definition may contain at most %d cast restrictions.", achievementEditorMaxRestrictions))
	}
	seen := make(map[uint32]struct{}, len(graph.Restrictions))
	for index, restriction := range graph.Restrictions {
		path := fmt.Sprintf("restrictions.%d", index)
		if restriction.AchievementID != 0 && restriction.AchievementID != graph.ID {
			result.add(path+".achievement_id", "The cast restriction must belong to the achievement being edited.")
		}
		if restriction.RestrictionID == 0 {
			result.add(path+".restriction_id", "Restriction ID must be greater than zero.")
			continue
		}
		if _, duplicate := seen[restriction.RestrictionID]; duplicate {
			result.add(path+".restriction_id", "A restriction ID may be attached only once; duplicate or contradictory rows are unsafe.")
		}
		seen[restriction.RestrictionID] = struct{}{}
		if !achievementEditorRestrictionKnown(restriction.RestrictionID, context) {
			result.add(path+".restriction_id", fmt.Sprintf("Spell restriction %d does not exist.", restriction.RestrictionID))
		}
	}
	if !graph.Enabled && len(graph.Restrictions) > 0 {
		result.warn("restrictions", "Cast restrictions for a disabled achievement remain inactive until the definition is enabled.")
	}
	if len(graph.Restrictions) > 0 && context.RequireDatabaseContext && context.KnownRestrictionIDs == nil && context.RestrictionExists == nil {
		result.add("restrictions", "Spell restriction identities could not be verified against the active content database.")
	}
}

func validateAchievementEditorCategory(category achievementEditorCategory, context achievementEditorCategoryValidationContext) achievementEditorValidationResult {
	result := achievementEditorValidationResult{Findings: make([]achievementEditorValidationFinding, 0)}
	if category.ID == 0 {
		result.add("id", "Category ID must be greater than zero.")
	}
	if context.ExistingCategoryID != nil && category.ID != *context.ExistingCategoryID {
		result.add("id", "The stable category ID cannot be changed after creation.")
	}
	if context.ExistingCategoryID == nil && category.ID != 0 && achievementEditorCategoryKnownForCategory(category.ID, context) {
		result.add("id", fmt.Sprintf("Category ID %d is already in use.", category.ID))
	}
	if strings.TrimSpace(category.Name) == "" {
		result.add("name", "Category name is required.")
	}
	if len([]rune(category.Name)) > 255 {
		result.add("name", "Category name may not exceed 255 characters.")
	}
	if len([]rune(category.Icon)) > 255 {
		result.add("icon", "Category icon resource may not exceed 255 characters.")
	}
	if len([]byte(category.Description)) > achievementEditorTextMaxBytes {
		result.add("description", "Category description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).")
	}
	if category.ParentID == category.ID && category.ID != 0 {
		result.add("parent_id", "A category cannot be its own parent.")
	}
	if category.ParentID != 0 && !achievementEditorCategoryKnownForCategory(category.ParentID, context) {
		result.add("parent_id", "The selected parent category does not exist.")
	}
	parents := make(map[uint32]uint32, len(context.CategoryParentByID)+1)
	for id, parent := range context.CategoryParentByID {
		parents[id] = parent
	}
	parents[category.ID] = category.ParentID
	if cycleInCategoryLineage(parents, category.ID) || (context.ParentWouldCycle != nil && context.ParentWouldCycle(category.ID, category.ParentID)) {
		result.add("parent_id", "The selected parent would create a category cycle.")
	}
	if context.RequireDatabaseContext && context.KnownCategoryIDs == nil && context.CategoryExists == nil {
		result.add("parent_id", "Category lineage could not be verified against the active content database.")
	}
	return result
}

func achievementEditorAbsoluteEvent(event uint8) bool {
	return event == 1 || event == 4 || event == 7 || event == 9 || event == 10 || event == 11 || event == 13
}

func achievementEditorBooleanNeedsPositiveTarget(event uint8) bool {
	return event == 1 || event == 7 || event == 9 || event == 10 || event == 13
}

func achievementEditorComponentIdentity(componentType uint8, componentID uint32) string {
	return fmt.Sprintf("%d:%d", componentType, componentID)
}

func achievementEditorCategoryKnown(id uint32, context achievementEditorValidationContext) bool {
	if context.CategoryExists != nil {
		return context.CategoryExists(id)
	}
	if context.KnownCategoryIDs == nil {
		return !context.RequireDatabaseContext
	}
	_, found := context.KnownCategoryIDs[id]
	return found
}

func achievementEditorAchievementKnown(id uint32, context achievementEditorValidationContext) bool {
	if context.AchievementExists != nil {
		return context.AchievementExists(id)
	}
	if context.KnownAchievementIDs == nil {
		return !context.RequireDatabaseContext
	}
	_, found := context.KnownAchievementIDs[id]
	return found
}

func achievementEditorRestrictionKnown(id uint32, context achievementEditorValidationContext) bool {
	if context.RestrictionExists != nil {
		return context.RestrictionExists(id)
	}
	if context.KnownRestrictionIDs == nil {
		return !context.RequireDatabaseContext
	}
	_, found := context.KnownRestrictionIDs[id]
	return found
}

func achievementEditorCategoryKnownForCategory(id uint32, context achievementEditorCategoryValidationContext) bool {
	if context.CategoryExists != nil {
		return context.CategoryExists(id)
	}
	if context.KnownCategoryIDs == nil {
		return false
	}
	_, found := context.KnownCategoryIDs[id]
	return found
}

func cycleInCategoryLineage(parents map[uint32]uint32, start uint32) bool {
	seen := make(map[uint32]struct{})
	current := start
	for current != 0 {
		if _, duplicate := seen[current]; duplicate {
			return true
		}
		seen[current] = struct{}{}
		parent, found := parents[current]
		if !found {
			return false
		}
		current = parent
	}
	return false
}

func cloneDependencyEdges(source map[uint32][]uint32) map[uint32][]uint32 {
	result := make(map[uint32][]uint32, len(source))
	for id, targets := range source {
		result[id] = append([]uint32(nil), targets...)
	}
	return result
}

func achievementDependencyHasCycle(edges map[uint32][]uint32, start uint32) bool {
	visiting := make(map[uint32]bool)
	visited := make(map[uint32]bool)
	var walk func(uint32) bool
	walk = func(node uint32) bool {
		if visiting[node] {
			return true
		}
		if visited[node] {
			return false
		}
		visiting[node] = true
		for _, target := range edges[node] {
			if walk(target) {
				return true
			}
		}
		delete(visiting, node)
		visited[node] = true
		return false
	}
	return walk(start)
}

func parseUnsignedDecimal(value string, bits int, allowZero bool) (string, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", false
	}
	for _, character := range value {
		if character < '0' || character > '9' {
			return "", false
		}
	}
	value = strings.TrimLeft(value, "0")
	if value == "" {
		value = "0"
	}
	if !allowZero && value == "0" {
		return "", false
	}
	if _, err := strconv.ParseUint(value, 10, bits); err != nil {
		return "", false
	}
	return value, true
}

func decimalFitsUint32(value string) bool {
	_, err := strconv.ParseUint(value, 10, 32)
	return err == nil
}

func decimalFitsMaximum(value string, maximum string) bool {
	value = strings.TrimLeft(strings.TrimSpace(value), "0")
	if value == "" {
		value = "0"
	}
	return len(value) < len(maximum) || (len(value) == len(maximum) && value <= maximum)
}

// achievementCanonicalNPCName reproduces common/achievements.h exactly:
// ASCII letters survive, letters are lowercased, spaces and underscores fold
// to a single pending separator, and all other bytes are discarded.
func achievementCanonicalNPCName(name string) string {
	canonical := make([]byte, 0, len(name))
	hasLetter := false
	separatorPending := false
	for index := 0; index < len(name); index++ {
		character := name[index]
		if character == ' ' || character == '_' {
			separatorPending = hasLetter
			continue
		}
		if character >= 'A' && character <= 'Z' {
			character += 'a' - 'A'
		}
		if character < 'a' || character > 'z' {
			continue
		}
		if separatorPending {
			canonical = append(canonical, ' ')
			separatorPending = false
		}
		canonical = append(canonical, character)
		hasLetter = true
	}
	return string(canonical)
}

func achievementCanonicalNPCNameHash(name string) uint32 {
	canonical := achievementCanonicalNPCName(name)
	if canonical == "" {
		return 0
	}
	hash := uint32(2166136261)
	for index := 0; index < len(canonical); index++ {
		hash ^= uint32(canonical[index])
		hash *= 16777619
	}
	if hash == 0 {
		return 0
	}
	return hash
}
