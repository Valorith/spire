package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"testing"
)

func TestAchievementEditorReasonCountsUnicodeCharacters(t *testing.T) {
	if err := validateAchievementEditorReason(strings.Repeat("界", achievementEditorMinimumReasonLength)); err != nil {
		t.Fatalf("minimum-length Unicode reason was rejected: %v", err)
	}
	if err := validateAchievementEditorReason(strings.Repeat("界", operationalEditorReasonMaxLength+1)); err == nil {
		t.Fatal("over-limit Unicode reason was accepted")
	}
}

func TestAchievementEditorUpdateRoutesUseExplicitNonPostVerbs(t *testing.T) {
	want := map[string]struct{}{
		http.MethodPut + " achievement-editor/definition":                                {},
		http.MethodPatch + " achievement-editor/definition/:id":                          {},
		http.MethodPut + " achievement-editor/definition/:id/clone":                      {},
		http.MethodDelete + " achievement-editor/definition/:id":                         {},
		http.MethodPut + " achievement-editor/category":                                  {},
		http.MethodPatch + " achievement-editor/category/:id":                            {},
		http.MethodDelete + " achievement-editor/category/:id":                           {},
		http.MethodPatch + " character-achievement-editor/character/:id/progress":        {},
		http.MethodPatch + " character-achievement-editor/character/:id/complete":        {},
		http.MethodPatch + " character-achievement-editor/character/:id/reset":           {},
		http.MethodPatch + " character-achievement-editor/character/:id/reward/retry":    {},
		http.MethodPatch + " character-achievement-editor/character/:id/selection/retry": {},
		http.MethodPatch + " character-achievement-editor/character/:id/update/retry":    {},
		http.MethodDelete + " character-achievement-editor/character/:id/update":         {},
	}
	seen := make(map[string]bool, len(want))
	for _, route := range (&AchievementEditorController{}).Routes() {
		path := route.Route()
		method := route.Method()
		if strings.Contains(path, "achievement-editor/") && method == http.MethodPost {
			t.Errorf("achievement editor route %q must not use POST", path)
		}
		key := method + " " + path
		if _, found := want[key]; found {
			seen[key] = true
			if len(route.Middlewares()) == 0 {
				t.Errorf("update route %s has no request body limit", key)
			}
		}
	}
	for key := range want {
		if !seen[key] {
			t.Errorf("missing update route %s", key)
		}
	}
}

func TestAchievementEditorRequestGraphAcceptsDefinitionAndLegacyGraphShapes(t *testing.T) {
	legacy := achievementEditorGraph{ID: 10, Name: "Legacy graph"}
	if got := achievementEditorRequestGraph(achievementEditorGraphUpdateRequest{Graph: legacy}); got.ID != legacy.ID {
		t.Fatalf("legacy graph ID = %d, want %d", got.ID, legacy.ID)
	}
	definition := achievementEditorGraph{ID: 11, Name: "Definition graph"}
	got := achievementEditorRequestGraph(achievementEditorGraphUpdateRequest{Graph: legacy, Definition: &definition})
	if got.ID != definition.ID || got.Name != definition.Name {
		t.Fatalf("definition graph = %+v, want %+v", got, definition)
	}
}

func TestAchievementEditorDefinitionMutationSchemaScopeFailsClosedBeforeDurableIdentityChecks(t *testing.T) {
	for _, operation := range []string{"create", "clone"} {
		if !achievementEditorDefinitionMutationUsesCharacterSchema(operation) {
			t.Fatalf("%s must require the combined content and character schema before durable ID checks", operation)
		}
	}
	for _, operation := range []string{"update", "delete"} {
		if achievementEditorDefinitionMutationUsesCharacterSchema(operation) {
			t.Fatalf("%s unexpectedly requires character schema despite not checking durable identity reuse", operation)
		}
	}
}

func TestAchievementEditorMetadataUsesCanonicalSkillsAndCompleteHelp(t *testing.T) {
	metadata := getAchievementEditorMetadata()
	if len(metadata.Skills) != 78 {
		t.Fatalf("skill count = %d, want 78", len(metadata.Skills))
	}
	if metadata.Skills[22].Value != 22 || metadata.Skills[22].Label != "Dual Wield" {
		t.Fatalf("skill 22 = %+v, want Dual Wield", metadata.Skills[22])
	}
	if metadata.Skills[56].Value != 56 || metadata.Skills[56].Label != "Make Poison" {
		t.Fatalf("skill 56 = %+v, want Make Poison", metadata.Skills[56])
	}
	if metadata.Skills[77].Label != "2H Piercing" {
		t.Fatalf("skill 77 = %+v, want 2H Piercing", metadata.Skills[77])
	}
	if len(metadata.Events) != 14 || len(metadata.Classes) != 16 {
		t.Fatalf("metadata events/classes = %d/%d, want 14/16", len(metadata.Events), len(metadata.Classes))
	}
	if metadata.Events[13].Target1Label != "Skill ID" || metadata.Events[13].Target2Label != "Required class" {
		t.Fatalf("frontend event aliases are incomplete: %+v", metadata.Events[13])
	}
	if metadata.Events[12].Lookup != "npc-name" {
		t.Fatalf("NPC Name Kill lookup = %q, want npc-name", metadata.Events[12].Lookup)
	}
	for _, key := range []string{"payload_bytes", "text_bytes", "associations", "components", "criteria", "rewards", "requirements", "options", "mappings"} {
		if strings.TrimSpace(metadata.Limits[key]) == "" {
			t.Errorf("frontend limit %q is missing", key)
		}
	}
	if metadata.Limits["payload_bytes"] != "2097152" || metadata.Limits["max_graph_bytes"] != "2097152" {
		t.Fatalf("graph body envelope changed from 2 MiB: %+v", metadata.Limits)
	}
	for _, table := range []string{
		"achievement_categories", "achievements", "achievement_category_associations",
		"achievement_components", "achievement_associations", "achievement_criteria",
		"rewards", "achievement_cast_requirements", "reward_sets",
		"reward_options", "reward_option_entries", "reward_sources", "reward_source_entries",
		"character_achievements", "character_achievement_progress", "character_achievement_rewards",
		"character_achievement_reward_selections", "character_achievement_pending_updates",
	} {
		fields, found := metadata.Fields[table]
		if !found || len(fields) == 0 {
			t.Errorf("field help missing for %s", table)
		}
		for name, help := range fields {
			if strings.TrimSpace(help.Label) == "" || strings.TrimSpace(help.Help) == "" {
				t.Errorf("field help %s.%s is incomplete: %+v", table, name, help)
			}
		}
	}
	for _, field := range []achievementEditorFieldHelp{
		metadata.Fields["achievements"]["description"],
		metadata.Fields["achievement_components"]["name"],
		metadata.Fields["achievement_components"]["description"],
	} {
		if !strings.Contains(field.Help, "65,535 UTF-8 bytes") {
			t.Errorf("TEXT field help does not explain the byte limit: %+v", field)
		}
	}
}

func TestAchievementCanonicalNPCNameAndHashMatchServer(t *testing.T) {
	if got := achievementCanonicalNPCName("  ORC__Warlord_01!!  "); got != "orc warlord" {
		t.Fatalf("canonical name = %q, want orc warlord", got)
	}
	if got := achievementCanonicalNPCName("orc-warlord"); got != "orcwarlord" {
		t.Fatalf("punctuation canonical name = %q, want orcwarlord", got)
	}
	if got := achievementCanonicalNPCName("123_!!!"); got != "" {
		t.Fatalf("empty identity canonical name = %q", got)
	}
	if got := achievementCanonicalNPCNameHash("  ORC__Warlord_01!!  "); got != 1660326528 {
		t.Fatalf("canonical hash = %d, want 1660326528", got)
	}
	if got := achievementCanonicalNPCNameHash("123_!!!"); got != 0 {
		t.Fatalf("empty identity hash = %d, want 0", got)
	}
}

func TestValidateAchievementEditorGraphAcceptsSafeGraph(t *testing.T) {
	graph := validAchievementEditorGraph()
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	if !result.Valid() {
		t.Fatalf("valid graph findings = %+v", result.Findings)
	}
	graph.Version = 0
	result = validateAchievementEditorGraph(graph, validAchievementEditorContext())
	if !result.Valid() {
		t.Fatalf("valid version-zero graph findings = %+v", result.Findings)
	}
}

func TestValidateAchievementEditorGraphBoundsTextColumnsByUTF8Bytes(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Description = strings.Repeat("a", achievementEditorTextMaxBytes)
	graph.Components[0].Name = strings.Repeat("b", achievementEditorTextMaxBytes)
	graph.Components[0].Description = strings.Repeat("c", achievementEditorTextMaxBytes)
	if result := validateAchievementEditorGraph(graph, validAchievementEditorContext()); !result.Valid() {
		t.Fatalf("exact MySQL TEXT byte boundaries were rejected: %+v", result.Findings)
	}

	oversized := strings.Repeat("\u00e9", achievementEditorTextMaxBytes/2+1)
	graph = validAchievementEditorGraph()
	graph.Description = oversized
	assertAchievementFinding(t, validateAchievementEditorGraph(graph, validAchievementEditorContext()), "description", "65,535 UTF-8 bytes")

	graph = validAchievementEditorGraph()
	graph.Components[0].Name = oversized
	assertAchievementFinding(t, validateAchievementEditorGraph(graph, validAchievementEditorContext()), "components.0.name", "65,535 UTF-8 bytes")

	graph = validAchievementEditorGraph()
	graph.Components[0].Description = oversized
	assertAchievementFinding(t, validateAchievementEditorGraph(graph, validAchievementEditorContext()), "components.0.description", "65,535 UTF-8 bytes")
}

func TestValidateAchievementEditorGraphRequiresExplicitOrphanRecovery(t *testing.T) {
	graph, context := achievementEditorGraphWithOrphanRecovery(t)

	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "recovery_action", "Choose Restore")

	omitted := graph
	omitted.Components = omitted.Components[:1]
	result = validateAchievementEditorGraph(omitted, context)
	assertAchievementFinding(t, result, "components", "were omitted")

	forged := graph
	forged.Components = append([]achievementEditorComponent(nil), graph.Components...)
	forged.Components[1].RecoveryOnly = false
	forged.Components[1].RecoveryAction = achievementEditorRecoveryActionRestore
	result = validateAchievementEditorGraph(forged, context)
	assertAchievementFinding(t, result, "recovery_only", "retain its recovery marker")
}

func TestAchievementEditorLoadGroupingRetainsCriteriaWhoseComponentIsMissing(t *testing.T) {
	criteria := []achievementEditorCriterion{
		{ID: "10", ComponentType: 0, ComponentID: 100},
		{ID: "20", ComponentType: 1, ComponentID: 200},
		{ID: "21", ComponentType: 1, ComponentID: 200},
	}
	groups, orphanOrder := achievementEditorGroupCriteriaForLoad(criteria, map[string]struct{}{"0:100": {}})
	if len(orphanOrder) != 1 || orphanOrder[0] != "1:200" {
		t.Fatalf("orphan component order = %v, want [1:200]", orphanOrder)
	}
	if got := groups["1:200"]; len(got) != 2 || got[0].ID != "20" || got[1].ID != "21" {
		t.Fatalf("orphan criteria were not preserved in load order: %+v", got)
	}
	if got := groups["0:100"]; len(got) != 1 || got[0].ID != "10" {
		t.Fatalf("real component criteria changed: %+v", got)
	}
}

func TestValidateAchievementEditorGraphAcceptsWholeGroupOrphanRestoreOrDelete(t *testing.T) {
	graph, context := achievementEditorGraphWithOrphanRecovery(t)

	restore := graph
	restore.Components = append([]achievementEditorComponent(nil), graph.Components...)
	restore.Components[1].RecoveryAction = achievementEditorRecoveryActionRestore
	if result := validateAchievementEditorGraph(restore, context); !result.Valid() {
		t.Fatalf("restore recovery findings = %+v", result.Findings)
	}

	deleteGroup := graph
	deleteGroup.Components = append([]achievementEditorComponent(nil), graph.Components...)
	deleteGroup.Components[1].RecoveryAction = achievementEditorRecoveryActionDelete
	if result := validateAchievementEditorGraph(deleteGroup, context); !result.Valid() {
		t.Fatalf("delete recovery findings = %+v", result.Findings)
	}
}

func TestValidateAchievementEditorGraphRecoveryRetainsEveryStoredCriterionID(t *testing.T) {
	graph, context := achievementEditorGraphWithOrphanRecovery(t)
	graph.Components[1].RecoveryAction = achievementEditorRecoveryActionDelete
	graph.Components[1].Criteria = nil

	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "criteria", "was omitted")
}

func TestValidateAchievementEditorGraphRejectsRecoveryMarkersOnCreateOrClone(t *testing.T) {
	graph, _ := achievementEditorGraphWithOrphanRecovery(t)
	graph.ID = 55
	graph.Associations[0].AchievementID = 55
	for index := range graph.Components {
		graph.Components[index].AchievementID = 55
		for criterionIndex := range graph.Components[index].Criteria {
			graph.Components[index].Criteria[criterionIndex].AchievementID = 55
		}
	}
	graph.Components[1].RecoveryAction = achievementEditorRecoveryActionRestore
	context := validAchievementEditorContext()
	context.KnownAchievementIDs[55] = struct{}{}

	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "recovery_only", "verified in the stored definition")
}

func TestValidateAchievementEditorGraphFailsClosedWithoutReferenceContext(t *testing.T) {
	graph := validAchievementEditorGraph()
	context := validAchievementEditorContext()
	context.KnownCategoryIDs = nil
	context.CategoryExists = nil
	context.GlobalComponentCounts = nil
	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "associations", "could not be verified")
	assertAchievementFinding(t, result, "components", "could not be verified")
}

func TestValidateAchievementEditorGraphFailsClosedWithoutStableIdentityContext(t *testing.T) {
	graph := validAchievementEditorGraph()
	context := validAchievementEditorContext()
	existingID := graph.ID
	context.ExistingAchievementID = &existingID
	context.ExistingComponentIdentities = nil
	context.ExistingRewardIDs = nil
	context.ExistingRewardOptionIDs = nil
	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "components", "Stable component identities")
	assertAchievementFinding(t, result, "rewards", "Stable reward identities")
	assertAchievementFinding(t, result, "reward_set.options", "Stable reward-option identities")
}

func TestValidateAchievementEditorGraphFailsClosedOnUnverifiedAuthoredIDs(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{{RewardID: "600", Sequence: 1, RewardType: 2, Amount: "1", Enabled: true}}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID: 50,
		Options:     []achievementEditorRewardOption{},
		Mappings:    []achievementEditorRewardMapping{},
	}
	context := validAchievementEditorContext()
	context.KnownRewardIDs = nil
	context.KnownRewardSetIDs = nil
	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "rewards", "checked for collisions")
	assertAchievementFinding(t, result, "reward_set.reward_set_id", "checked for collisions")
}

func TestValidateAchievementEditorGraphEnforcesLimitsAndRequiredCollections(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Associations = make([]achievementEditorAssociation, achievementEditorMaxAssociations+1)
	graph.Components = nil
	graph.Rewards = nil
	graph.Requirements = nil
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, "associations", "at most")
	assertAchievementFinding(t, result, "components", "supplied as a list")
	assertAchievementFinding(t, result, "rewards", "supplied as a list")
	assertAchievementFinding(t, result, "requirements", "supplied as a list")
}

func TestValidateAchievementEditorGraphRejectsUnsafeEventPolicies(t *testing.T) {
	tests := []struct {
		name      string
		criterion achievementEditorCriterion
		path      string
		contains  string
	}{
		{name: "replayed increment", criterion: criterionForTest(1, 0, 0, 0, 0, 50), path: "progress_mode", contains: "cannot safely use Increment"},
		{name: "task wildcard", criterion: criterionForTest(4, 3, 0, 0, 0, 0), path: "target_id", contains: "specific nonzero task"},
		{name: "skill outside range", criterion: criterionForTest(9, 3, 0, 78, 0, 200), path: "target_id", contains: "0 through 77"},
		{name: "name hash zero", criterion: criterionForTest(12, 0, 0, 0, 202, 0), path: "target_id", contains: "nonzero canonical-name hash"},
		{name: "skill cap class", criterion: criterionForTest(13, 3, 0, 22, 0, 50), path: "target_id2", contains: "class ID"},
		{name: "skill cap level", criterion: criterionForTest(13, 3, 0, 22, 1, 256), path: "target_value", contains: "1 through 255"},
		{name: "unsupported secondary", criterion: criterionForTest(2, 0, 0, 1, 5, 0), path: "target_id2", contains: "does not support"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			graph := validAchievementEditorGraph()
			test.criterion.AchievementID = graph.ID
			test.criterion.ComponentType = graph.Components[0].ComponentType
			test.criterion.ComponentSequence = graph.Components[0].Sequence
			test.criterion.ComponentID = graph.Components[0].ComponentID
			graph.Components[0].Criteria = []achievementEditorCriterion{test.criterion}
			result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
			assertAchievementFinding(t, result, test.path, test.contains)
		})
	}
}

func TestValidateAchievementEditorTargetValuePreservesSignedBigIntPrecision(t *testing.T) {
	graph := validAchievementEditorGraph()
	criterion := &graph.Components[0].Criteria[0]
	criterion.EventType = 2
	criterion.ProgressMode = 0
	criterion.TargetValue = "9223372036854775807"
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	for _, finding := range result.Findings {
		if strings.Contains(finding.Path, "target_value") {
			t.Fatalf("signed BIGINT maximum unexpectedly rejected: %+v", result.Findings)
		}
	}

	criterion.TargetValue = "9223372036854775808"
	result = validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, "target_value", "signed 64-bit")
}

func TestCollectAchievementEditorReferenceRequestsDeduplicatesAndPreservesWildcards(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Components[0].Criteria = []achievementEditorCriterion{
		{EventType: 2, TargetID: 700, Enabled: true},
		{EventType: 2, TargetID: 700, Enabled: true},
		{EventType: 2, TargetID: 0, Enabled: true},
		{EventType: 3, TargetID: 0, Enabled: true},
		{EventType: 4, TargetID: 55, Enabled: true},
		{EventType: 5, TargetID: 407, Enabled: true},
		{EventType: 6, TargetID: 1001, Enabled: true},
		{EventType: 6, TargetID: 9999, Enabled: false},
		{EventType: 8, TargetID: 88, Enabled: true},
		{EventType: 10, TargetID: 0, TargetValue: "100", Enabled: true},
		{EventType: 12, TargetID: 123456, TargetID2: 407, Enabled: true},
		{EventType: 13, TargetID: 0, TargetID2: 1, TargetValue: "50", Enabled: true},
	}
	graph.Rewards = []achievementEditorReward{
		{RewardType: 0, RewardDataID: 1001, Enabled: true},
		{RewardType: 4, RewardDataID: 9, Enabled: true},
		{RewardType: 5, RewardDataID: 10, Enabled: true},
		{RewardType: 2, RewardDataID: 0, Enabled: true},
		{RewardType: 0, RewardDataID: 9999, Enabled: false},
	}
	requests := collectAchievementEditorReferenceRequests(graph)
	assertAchievementReferenceSet(t, requests.NPCTypeIDs, 700)
	assertAchievementReferenceSet(t, requests.TaskIDs, 55)
	assertAchievementReferenceSet(t, requests.ZoneIDs, 407)
	assertAchievementReferenceSet(t, requests.ItemIDs, 1001)
	assertAchievementReferenceSet(t, requests.RecipeIDs, 88)
	assertAchievementReferenceSet(t, requests.CurrencyIDs, 9)
	assertAchievementReferenceSet(t, requests.TitleSetIDs, 10)
	if len(requests.NPCRaceIDs) != 0 {
		t.Fatalf("wildcard race IDs were added to the query plan: %+v", requests.NPCRaceIDs)
	}
	if _, found := requests.ItemIDs[9999]; found {
		t.Fatal("disabled item reference entered the query plan")
	}
	if _, found := requests.SkillCaps[achievementEditorSkillCapReference{SkillID: 0, ClassID: 1, Level: 50}]; !found {
		t.Fatal("exact Skill Cap skill 0 tuple was mistaken for a wildcard")
	}
	if got := len(requests.usedCatalogs()); got != 8 {
		t.Fatalf("used catalog count = %d, want 8 batched catalogs", got)
	}
}

func TestAchievementEditorReferenceCatalogsReuseBoundedLookupSpecs(t *testing.T) {
	specs := achievementEditorLookupSpecs()
	want := map[string]struct {
		table  string
		column string
	}{
		"npc":       {table: "npc_types", column: "id"},
		"task":      {table: "tasks", column: "id"},
		"zone":      {table: "zone", column: "zoneidnumber"},
		"item":      {table: "items", column: "id"},
		"recipe":    {table: "tradeskill_recipe", column: "id"},
		"currency":  {table: "alternate_currency", column: "id"},
		"title-set": {table: "titles", column: "title_set"},
	}
	for kind, expected := range want {
		spec, found := specs[kind]
		if !found || spec.from != expected.table || spec.idColumn != expected.column {
			t.Errorf("lookup %q = %+v, want table %s column %s", kind, spec, expected.table, expected.column)
		}
	}
	if specs["zone"].baseWhere != "version = 0" {
		t.Fatalf("zone lookup lost its bounded base-version policy: %+v", specs["zone"])
	}
	if specs["item"].iconExpr != "icon" {
		t.Fatalf("item lookup must return the item sprite icon ID: %+v", specs["item"])
	}
	if validationSpec := achievementEditorReferenceLookupSpec("zone"); validationSpec.baseWhere != "" {
		t.Fatalf("zone existence validation rejected nonzero-only versions: %+v", validationSpec)
	}
	zoneRequirement := achievementEditorReferenceCatalogRequirements()[achievementEditorReferenceZone]
	if len(zoneRequirement.columns) != 1 || zoneRequirement.columns[0] != "zoneidnumber" {
		t.Fatalf("zone existence validation must accept any version: %+v", zoneRequirement)
	}
}

func TestValidateAchievementEditorGraphVerifiesEnabledCriterionReferences(t *testing.T) {
	tests := []struct {
		name        string
		criterion   achievementEditorCriterion
		path        string
		message     string
		warningOnly bool
	}{
		{name: "NPC type", criterion: criterionForTest(2, 0, 0, 700, 0, 1), path: "target_id", message: "NPC type 700"},
		{name: "custom NPC race", criterion: criterionForTest(3, 0, 0, 222, 0, 1), path: "target_id", message: "custom race IDs", warningOnly: true},
		{name: "task", criterion: criterionForTest(4, 3, 0, 55, 0, 1), path: "target_id", message: "Task 55"},
		{name: "zone", criterion: criterionForTest(5, 3, 0, 407, 0, 1), path: "target_id", message: "Zone 407"},
		{name: "loot item", criterion: criterionForTest(6, 0, 0, 2000, 0, 1), path: "target_id", message: "Item 2000"},
		{name: "own item", criterion: criterionForTest(7, 3, 0, 2001, 0, 1), path: "target_id", message: "Item 2001"},
		{name: "recipe", criterion: criterionForTest(8, 3, 0, 88, 0, 1), path: "target_id", message: "Tradeskill recipe 88"},
		{name: "NPC-name zone", criterion: criterionForTest(12, 0, 0, 123456, 407, 1), path: "target_id2", message: "Zone 407"},
		{name: "skill-cap tuple", criterion: criterionForTest(13, 3, 0, 22, 1, 50), path: "target_value", message: "skill 22, class 1, level 50"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			graph := validAchievementEditorGraph()
			setAchievementCriterionForTest(&graph, test.criterion)
			result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
			finding := findAchievementFinding(t, result, test.path, test.message)
			wantSeverity := achievementEditorValidationError
			if test.warningOnly {
				wantSeverity = achievementEditorValidationWarning
			}
			if finding.Severity != wantSeverity {
				t.Fatalf("finding severity = %q, want %q: %+v", finding.Severity, wantSeverity, finding)
			}
			if test.warningOnly && !result.Valid() {
				t.Fatalf("custom race advisory blocked publication: %+v", result.Findings)
			}
		})
	}
}

func TestValidateAchievementEditorGraphReferenceWildcardsDoNotRequireCatalogRows(t *testing.T) {
	tests := []achievementEditorCriterion{
		criterionForTest(2, 0, 0, 0, 0, 1),
		criterionForTest(3, 0, 0, 0, 0, 1),
		criterionForTest(5, 3, 0, 0, 0, 1),
		criterionForTest(6, 0, 0, 0, 0, 1),
		criterionForTest(7, 3, 0, 0, 0, 1),
		criterionForTest(8, 3, 0, 0, 0, 1),
		criterionForTest(12, 0, 0, 123456, 0, 1),
		criterionForTest(9, 3, 0, achievementEditorSkillWildcard, 0, 1),
	}
	for _, criterion := range tests {
		graph := validAchievementEditorGraph()
		setAchievementCriterionForTest(&graph, criterion)
		context := validAchievementEditorContext()
		context.KnownNPCTypeIDs = nil
		context.KnownNPCRaceIDs = nil
		context.KnownZoneIDs = nil
		context.KnownItemIDs = nil
		context.KnownRecipeIDs = nil
		result := validateAchievementEditorGraph(graph, context)
		for _, finding := range result.Findings {
			if strings.Contains(finding.Message, "could not be verified") || strings.Contains(finding.Message, "does not exist") {
				t.Fatalf("event %d wildcard produced a catalog finding: %+v", criterion.EventType, finding)
			}
		}
	}
}

func TestValidateAchievementEditorGraphStagesMissingAndUnavailableReferencesWhileDisabled(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Enabled = false
	setAchievementCriterionForTest(&graph, criterionForTest(6, 0, 0, 9999, 0, 1))
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	finding := findAchievementFinding(t, result, "target_id", "Item 9999 does not exist")
	if finding.Severity != achievementEditorValidationWarning || !result.Valid() {
		t.Fatalf("disabled definition could not stage a missing reference: %+v", result.Findings)
	}

	graph.Enabled = true
	context := validAchievementEditorContext()
	context.KnownItemIDs = nil
	context.ReferenceCatalogIssues[achievementEditorReferenceItem] = "table items is unavailable"
	result = validateAchievementEditorGraph(graph, context)
	finding = findAchievementFinding(t, result, "target_id", "table items is unavailable")
	if finding.Severity != achievementEditorValidationError || result.Valid() {
		t.Fatalf("an enabled definition published without a verified item catalog: %+v", result.Findings)
	}

	graph.Enabled = false
	result = validateAchievementEditorGraph(graph, context)
	finding = findAchievementFinding(t, result, "target_id", "table items is unavailable")
	if finding.Severity != achievementEditorValidationWarning || !result.Valid() {
		t.Fatalf("a disabled draft could not retain an unverified item reference for remediation: %+v", result.Findings)
	}
}

func TestValidateAchievementEditorGraphVerifiesEnabledRewardReferences(t *testing.T) {
	tests := []struct {
		name    string
		reward  achievementEditorReward
		message string
	}{
		{name: "item", reward: achievementEditorReward{RewardType: 0, RewardDataID: 2000, Amount: "1", Enabled: true}, message: "Item 2000"},
		{name: "currency", reward: achievementEditorReward{RewardType: 4, RewardDataID: 44, Amount: "1", Enabled: true}, message: "Alternate currency 44"},
		{name: "title set", reward: achievementEditorReward{RewardType: 5, RewardDataID: 90, Amount: "1", Enabled: true}, message: "Title set 90"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			graph := validAchievementEditorGraph()
			graph.Rewards = []achievementEditorReward{test.reward}
			result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
			finding := findAchievementFinding(t, result, "reward_data_id", test.message)
			if finding.Severity != achievementEditorValidationError {
				t.Fatalf("enabled missing reward reference was not blocking: %+v", finding)
			}
		})
	}
}

func TestValidateAchievementEditorRewardDeliveryBoundsMatchRuntime(t *testing.T) {
	tests := []struct {
		name    string
		reward  achievementEditorReward
		path    string
		message string
	}{
		{name: "item", reward: achievementEditorReward{RewardType: 0, RewardDataID: 1001, Amount: "32768", Enabled: true}, path: "amount", message: "32,767"},
		{name: "experience", reward: achievementEditorReward{RewardType: 1, Amount: "4294967296", Enabled: true}, path: "amount", message: "4,294,967,295"},
		{name: "AA", reward: achievementEditorReward{RewardType: 2, Amount: "2147483648", Enabled: true}, path: "amount", message: "2,147,483,647"},
		{name: "copper", reward: achievementEditorReward{RewardType: 3, Amount: "2147483648000", Enabled: true}, path: "amount", message: "2,147,483,647,999"},
		{name: "currency", reward: achievementEditorReward{RewardType: 4, RewardDataID: 44, Amount: "2147483648", Enabled: true}, path: "amount", message: "2,147,483,647"},
		{name: "title ID", reward: achievementEditorReward{RewardType: 5, RewardDataID: 2147483648, Amount: "1", Enabled: true}, path: "reward_data_id", message: "signed title limit"},
		{name: "title amount", reward: achievementEditorReward{RewardType: 5, RewardDataID: 90, Amount: "2", Enabled: true}, path: "amount", message: "must use amount 1"},
		{name: "AA data", reward: achievementEditorReward{RewardType: 2, RewardDataID: 7, Amount: "1", Enabled: true}, path: "reward_data_id", message: "must use data ID 0"},
		{name: "copper data", reward: achievementEditorReward{RewardType: 3, RewardDataID: 7, Amount: "1", Enabled: true}, path: "reward_data_id", message: "must use data ID 0"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			graph := validAchievementEditorGraph()
			graph.Rewards = []achievementEditorReward{test.reward}
			context := validAchievementEditorContext()
			context.KnownAlternateCurrencyIDs[44] = struct{}{}
			context.KnownTitleSetIDs[90] = struct{}{}
			context.KnownTitleSetIDs[2147483648] = struct{}{}
			result := validateAchievementEditorGraph(graph, context)
			finding := findAchievementFinding(t, result, test.path, test.message)
			if finding.Severity != achievementEditorValidationError {
				t.Fatalf("enabled delivery bound was not blocking: %+v", finding)
			}

			graph.Enabled = false
			result = validateAchievementEditorGraph(graph, context)
			finding = findAchievementFinding(t, result, test.path, test.message)
			if finding.Severity != achievementEditorValidationWarning || !result.Valid() {
				t.Fatalf("disabled delivery bound could not be staged: %+v", result.Findings)
			}
		})
	}
}

func TestValidateAchievementEditorGraphRejectsTypeThreeStateAndClassConflicts(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Components[0].ComponentType = 3
	graph.Components[0].Criteria[0].ComponentType = 3
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, ".enabled", "presentation-only")

	graph = validAchievementEditorGraph()
	second := graph.Components[0]
	second.ComponentID = 101
	second.Sequence = 2
	second.Criteria = []achievementEditorCriterion{criterionForTest(13, 3, 2, 22, 2, 50)}
	second.Criteria[0].AchievementID = graph.ID
	second.Criteria[0].ComponentType = second.ComponentType
	second.Criteria[0].ComponentSequence = second.Sequence
	second.Criteria[0].ComponentID = second.ComponentID
	graph.Components[0].Criteria[0] = criterionForTest(13, 3, 0, 22, 1, 50)
	graph.Components[0].Criteria[0].AchievementID = graph.ID
	graph.Components[0].Criteria[0].ComponentType = 0
	graph.Components[0].Criteria[0].ComponentSequence = 1
	graph.Components[0].Criteria[0].ComponentID = 100
	graph.Components = append(graph.Components, second)
	context := validAchievementEditorContext()
	context.GlobalComponentCounts[101] = 1
	result = validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "components", "must agree on one EQ class")
}

func TestValidateAchievementEditorGraphDetectsDependencyCycles(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Components[0].Criteria[0] = criterionForTest(11, 3, 0, 2, 0, 0)
	graph.Components[0].Criteria[0].AchievementID = graph.ID
	graph.Components[0].Criteria[0].ComponentType = 0
	graph.Components[0].Criteria[0].ComponentSequence = 1
	graph.Components[0].Criteria[0].ComponentID = 100
	context := validAchievementEditorContext()
	context.KnownAchievementIDs[2] = struct{}{}
	context.DependencyEdges = map[uint32][]uint32{2: {1}}
	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "components", "dependency cycle")

	graph.Components[0].Criteria[0].TargetID = 1
	result = validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, ".target_id", "own completion")
}

func TestValidateAchievementEditorGraphRetainsStableIdentitiesAndGlobalCounts(t *testing.T) {
	graph := validAchievementEditorGraph()
	context := validAchievementEditorContext()
	existingID := uint32(1)
	setID := uint32(50)
	context.ExistingAchievementID = &existingID
	context.ExistingComponentIdentities = map[string]struct{}{"0:100": {}, "0:999": {}}
	context.ExistingRewardIDs = map[string]struct{}{"600": {}}
	context.ExistingRewardSetID = &setID
	context.ExistingRewardOptionIDs = map[uint32]struct{}{5: {}}
	graph.RewardSet = nil
	graph.Components[0].PresentationCount = 2
	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "components", "Stable component 0:999")
	assertAchievementFinding(t, result, "presentation_count", "global presentation count")
	assertAchievementFinding(t, result, "rewards", "Stable reward ID 600")
	assertAchievementFinding(t, result, "reward_set", "cannot be cleared")
}

func TestValidateAchievementEditorRewardsRequireSelectableGrants(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{{RewardID: "600", Sequence: 1, RewardType: 0, RewardDataID: 1001, Amount: "1", Enabled: true}}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID:   50,
		Enabled:       true,
		SourceEnabled: true,
		Options: []achievementEditorRewardOption{
			{OptionID: 1, Sequence: 1, Label: "All choices", CommonToAll: true, Enabled: true},
			{OptionID: 2, Sequence: 2, Label: "Choice", Enabled: true},
		},
		Mappings: []achievementEditorRewardMapping{},
	}
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, "reward_set.options.0", "enabled grant")
	assertAchievementFinding(t, result, "reward_set.options.1", "enabled grant")
	if hasAchievementFinding(result, "requires at least one enabled, non-common") {
		t.Fatal("enabled non-common option should satisfy selectable-option requirement")
	}

	graph.RewardSet.Mappings = []achievementEditorRewardMapping{{OptionID: 2, RewardID: "600"}}
	graph.RewardSet.Options[0].Enabled = false
	result = validateAchievementEditorGraph(graph, validAchievementEditorContext())
	if !result.Valid() {
		t.Fatalf("valid selectable reward findings = %+v", result.Findings)
	}
}

func TestAchievementEditorSharedSetCatalogComparisonSeparatesSourceAndSetEnablement(t *testing.T) {
	persisted := achievementEditorRewardSet{
		RewardSetID: 50, Title: "Shared choice", Enabled: true, SourceEnabled: true,
		Options:  []achievementEditorRewardOption{{OptionID: 1, Sequence: 1, Enabled: true}},
		Mappings: []achievementEditorRewardMapping{{OptionID: 1, Sequence: 10, RewardID: "600"}},
	}
	submitted := persisted
	submitted.SourceEnabled = false
	if !achievementEditorRewardSetCatalogEqual(persisted, submitted) {
		t.Fatal("changing only this achievement's reward_sources.enabled link was treated as a shared catalog edit")
	}
	submitted = persisted
	submitted.Enabled = false
	if achievementEditorRewardSetCatalogEqual(persisted, submitted) {
		t.Fatal("changing shared reward_sets.enabled was not detected as a provider-independent catalog edit")
	}
	submitted = persisted
	submitted.Mappings = append([]achievementEditorRewardMapping(nil), persisted.Mappings...)
	submitted.Mappings[0].Sequence++
	if achievementEditorRewardSetCatalogEqual(persisted, submitted) {
		t.Fatal("changing reward_option_entries.sequence was not detected as a shared catalog edit")
	}
}

func TestValidateAchievementEditorGraphBlocksSuppressedRewardWithoutDeliveryPath(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{{Sequence: 1, RewardType: 2, Amount: "1", Enabled: true}}
	graph.RewardSet = &achievementEditorRewardSet{
		Title:    "Choice",
		Options:  []achievementEditorRewardOption{{OptionID: 1, Sequence: 1, Enabled: true}},
		Mappings: []achievementEditorRewardMapping{{OptionID: 1, RewardID: "@0"}},
	}

	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, "reward_id", "excluded from automatic delivery")

	graph.RewardSet.Enabled = true
	graph.RewardSet.SourceEnabled = true
	graph.RewardSet.Options[0].Enabled = false
	result = validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, "option_id", "excluded from automatic delivery")

	graph.RewardSet.Options[0].Enabled = true
	if result = validateAchievementEditorGraph(graph, validAchievementEditorContext()); !result.Valid() {
		t.Fatalf("enabled selectable delivery path findings = %+v", result.Findings)
	}
}

func TestValidateAchievementEditorRewardsAcceptTransactionalLocalReferences(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{{Sequence: 1, RewardType: 2, Amount: "1", Enabled: true}}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID:   50,
		Enabled:       true,
		SourceEnabled: true,
		Options:       []achievementEditorRewardOption{{OptionID: 1, Sequence: 1, Label: "Choice", Enabled: true}},
		Mappings:      []achievementEditorRewardMapping{{OptionID: 1, RewardID: "@0"}},
	}
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	if !result.Valid() {
		t.Fatalf("local reward mapping findings = %+v", result.Findings)
	}

	graph.RewardSet.Mappings[0].RewardID = "@1"
	result = validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, "reward_id", "valid nonzero reward ID")
}

func TestValidateAchievementEditorDisabledDefinitionMayRetainEnabledSourceAndSet(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Enabled = false
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID:   50,
		Enabled:       true,
		SourceEnabled: true,
		Options:       []achievementEditorRewardOption{},
		Mappings:      []achievementEditorRewardMapping{},
	}
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	if !result.Valid() {
		t.Fatalf("disabled definition could not retain its would-be selectable catalog policy: %+v", result.Findings)
	}
}

func TestValidateAchievementEditorDisabledRewardSetMayStageEmptyEnabledOptions(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID: 50,
		Enabled:     false,
		Options: []achievementEditorRewardOption{
			{OptionID: 1, Sequence: 1, Label: "Staged choice", Enabled: true},
		},
		Mappings: []achievementEditorRewardMapping{},
	}
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	if !result.Valid() {
		t.Fatalf("disabled reward set could not stage an empty enabled option: %+v", result.Findings)
	}
}

func TestValidateAchievementEditorMappedEnabledRewardNeedsActiveDeliveryPath(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{{RewardID: "600", RewardType: 0, RewardDataID: 1001, Amount: "1", Enabled: true}}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID: 50,
		Enabled:     false,
		Options:     []achievementEditorRewardOption{{OptionID: 1, Enabled: false}},
		Mappings:    []achievementEditorRewardMapping{{OptionID: 1, RewardID: "600"}},
	}
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	finding := findAchievementFinding(t, result, "option_id", "excluded from automatic delivery")
	if finding.Severity != achievementEditorValidationError {
		t.Fatalf("enabled definition could silently lose a mapped reward: %+v", finding)
	}

	graph.Enabled = false
	result = validateAchievementEditorGraph(graph, validAchievementEditorContext())
	finding = findAchievementFinding(t, result, "option_id", "will not fall back")
	if finding.Severity != achievementEditorValidationWarning || !result.Valid() {
		t.Fatalf("disabled definition could not stage delivery-path repair: %+v", result.Findings)
	}
}

func TestValidateAchievementEditorRewardsRejectsInvalidDataAndMappings(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{
		{RewardID: "18446744073709551616", Sequence: 1, RewardType: 0, Amount: "0", Enabled: true},
		{RewardID: "601", Sequence: 1, RewardType: 1, RewardDataID: 2, Amount: "1", Enabled: true},
	}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID: 50, Enabled: true,
		Options:  []achievementEditorRewardOption{{OptionID: 1, Enabled: true}},
		Mappings: []achievementEditorRewardMapping{{OptionID: 99, RewardID: "999"}},
	}
	result := validateAchievementEditorGraph(graph, validAchievementEditorContext())
	assertAchievementFinding(t, result, "reward_id", "unsigned 32-bit")
	assertAchievementFinding(t, result, "amount", "positive")
	assertAchievementFinding(t, result, "sequence", "unique")
	assertAchievementFinding(t, result, "reward_data_id", "Experience mode")
	assertAchievementFinding(t, result, "option_id", "does not exist")
	assertAchievementFinding(t, result, "reward_id", "does not exist")
}

func TestValidateAchievementEditorRequirements(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Requirements = []achievementEditorCastRequirement{{RestrictionID: 7}, {RestrictionID: 7}, {RestrictionID: 8}}
	context := validAchievementEditorContext()
	context.KnownRestrictionIDs = map[uint32]struct{}{7: {}}
	result := validateAchievementEditorGraph(graph, context)
	assertAchievementFinding(t, result, "restriction_id", "only once")
	assertAchievementFinding(t, result, "restriction_id", "does not exist")
}

func TestValidateAchievementEditorCategoryRejectsMissingParentAndCycles(t *testing.T) {
	category := achievementEditorCategory{ID: 10, ParentID: 11, Name: "Raids"}
	context := achievementEditorCategoryValidationContext{
		KnownCategoryIDs:       map[uint32]struct{}{11: {}, 12: {}},
		CategoryParentByID:     map[uint32]uint32{11: 12, 12: 10},
		RequireDatabaseContext: true,
	}
	result := validateAchievementEditorCategory(category, context)
	assertAchievementFinding(t, result, "parent_id", "cycle")

	category.ParentID = 99
	result = validateAchievementEditorCategory(category, context)
	assertAchievementFinding(t, result, "parent_id", "does not exist")

	existing := uint32(10)
	context.ExistingCategoryID = &existing
	category.ID = 13
	result = validateAchievementEditorCategory(category, context)
	assertAchievementFinding(t, result, "id", "cannot be changed")
}

func TestValidateAchievementEditorCategoryBoundsDescriptionByUTF8Bytes(t *testing.T) {
	category := achievementEditorCategory{ID: 10, Name: "Lore", Description: strings.Repeat("é", 32768)}
	context := achievementEditorCategoryValidationContext{KnownCategoryIDs: map[uint32]struct{}{}}
	result := validateAchievementEditorCategory(category, context)
	finding := findAchievementFinding(t, result, "description", "65,535 UTF-8 bytes")
	if finding.Severity != achievementEditorValidationError || result.Valid() {
		t.Fatalf("oversized category TEXT payload was accepted: %+v", result.Findings)
	}
}

func TestAchievementDependencyCycleHelper(t *testing.T) {
	if !achievementDependencyHasCycle(map[uint32][]uint32{1: {2}, 2: {3}, 3: {1}}, 1) {
		t.Fatal("expected dependency cycle")
	}
	if achievementDependencyHasCycle(map[uint32][]uint32{1: {2}, 2: {3}}, 1) {
		t.Fatal("acyclic dependency graph reported a cycle")
	}
}

func validAchievementEditorGraph() achievementEditorGraph {
	return achievementEditorGraph{
		ID:           1,
		Name:         "Level Fifty",
		Description:  "Reach level fifty.",
		Version:      1,
		Enabled:      true,
		Associations: []achievementEditorAssociation{{AchievementID: 1, CategoryID: 10, Sequence: 1}},
		Components: []achievementEditorComponent{{
			AchievementID: 1, ComponentType: 0, Sequence: 1, ComponentID: 100,
			Name: "Reach level 50", Description: "Reach the required level.", PresentationCount: 1,
			Criteria: []achievementEditorCriterion{{
				AchievementID: 1, ComponentType: 0, ComponentSequence: 1, ComponentID: 100,
				EventType: 1, ProgressMode: 3, Behavior: 0, TargetValue: "50", RequiredCount: 1, Enabled: true,
			}},
		}},
		Rewards:      []achievementEditorReward{},
		RewardSet:    nil,
		Requirements: []achievementEditorCastRequirement{},
	}
}

func validAchievementEditorContext() achievementEditorValidationContext {
	return achievementEditorValidationContext{
		KnownCategoryIDs:            map[uint32]struct{}{10: {}},
		CategoryParentByID:          map[uint32]uint32{10: 0},
		KnownAchievementIDs:         map[uint32]struct{}{1: {}},
		DependencyEdges:             map[uint32][]uint32{},
		KnownRestrictionIDs:         map[uint32]struct{}{},
		KnownRewardSetIDs:           map[uint32]struct{}{},
		KnownRewardIDs:              map[string]struct{}{},
		GlobalComponentCounts:       map[uint32]uint32{100: 1},
		ExistingComponentIdentities: map[string]struct{}{},
		ExistingOrphanCriterionIDs:  map[string]map[string]struct{}{},
		ExistingRewardIDs:           map[string]struct{}{},
		ExistingRewardOptionIDs:     map[uint32]struct{}{},
		KnownNPCTypeIDs:             map[uint32]struct{}{},
		KnownNPCRaceIDs:             map[uint32]struct{}{},
		KnownTaskIDs:                map[uint32]struct{}{},
		KnownZoneIDs:                map[uint32]struct{}{},
		KnownItemIDs:                map[uint32]struct{}{1001: {}},
		KnownRecipeIDs:              map[uint32]struct{}{},
		KnownSkillCaps:              map[achievementEditorSkillCapReference]struct{}{},
		KnownAlternateCurrencyIDs:   map[uint32]struct{}{},
		KnownTitleSetIDs:            map[uint32]struct{}{},
		ReferenceCatalogIssues:      map[string]string{},
		RequireDatabaseContext:      true,
	}
}

func achievementEditorGraphWithOrphanRecovery(t *testing.T) (achievementEditorGraph, achievementEditorValidationContext) {
	t.Helper()
	graph := validAchievementEditorGraph()
	graph.Components = append(graph.Components, achievementEditorComponent{
		AchievementID:         graph.ID,
		ComponentType:         0,
		Sequence:              2,
		ComponentID:           200,
		Description:           "These criteria are preserved but cannot be evaluated until an editor explicitly restores their component.",
		Name:                  "Missing component row - recovery required",
		PresentationCount:     1,
		RecoveryOnly:          true,
		RecoveryReason:        "The achievement_components row for these stored criteria is missing. Restore the component to keep the criteria, or explicitly delete the orphan criteria.",
		RecoveryCriteriaCount: 1,
		Criteria: []achievementEditorCriterion{{
			ID: "900", AchievementID: graph.ID, ComponentType: 0, ComponentSequence: 2, ComponentID: 200,
			EventType: 1, ProgressMode: 3, Behavior: 0, TargetValue: "60", RequiredCount: 1, Enabled: true,
		}},
	})
	context := validAchievementEditorContext()
	existingID := graph.ID
	context.ExistingAchievementID = &existingID
	context.GlobalComponentCounts[200] = 1
	context.ExistingOrphanCriterionIDs = map[string]map[string]struct{}{
		"0:200": {"900": {}},
	}
	return graph, context
}

func criterionForTest(event, mode, behavior uint8, targetID, targetID2 uint32, targetValue int64) achievementEditorCriterion {
	return achievementEditorCriterion{
		EventType: event, ProgressMode: mode, Behavior: behavior,
		TargetID: targetID, TargetID2: targetID2, TargetValue: strconv.FormatInt(targetValue, 10),
		RequiredCount: 1, Enabled: true,
	}
}

func setAchievementCriterionForTest(graph *achievementEditorGraph, criterion achievementEditorCriterion) {
	criterion.AchievementID = graph.ID
	criterion.ComponentType = graph.Components[0].ComponentType
	criterion.ComponentSequence = graph.Components[0].Sequence
	criterion.ComponentID = graph.Components[0].ComponentID
	graph.Components[0].Criteria = []achievementEditorCriterion{criterion}
}

func assertAchievementReferenceSet(t *testing.T, values map[uint32]struct{}, expected ...uint32) {
	t.Helper()
	if len(values) != len(expected) {
		t.Fatalf("reference set = %+v, want exactly %+v", values, expected)
	}
	for _, value := range expected {
		if _, found := values[value]; !found {
			t.Fatalf("reference set %+v does not contain %d", values, value)
		}
	}
}

func findAchievementFinding(t *testing.T, result achievementEditorValidationResult, path, message string) achievementEditorValidationFinding {
	t.Helper()
	for _, finding := range result.Findings {
		if strings.Contains(finding.Path, path) && strings.Contains(finding.Message, message) {
			return finding
		}
	}
	t.Fatalf("finding path containing %q and message containing %q not found in %+v", path, message, result.Findings)
	return achievementEditorValidationFinding{}
}

func assertAchievementFinding(t *testing.T, result achievementEditorValidationResult, path, message string) {
	t.Helper()
	for _, finding := range result.Findings {
		if strings.Contains(finding.Path, path) && strings.Contains(finding.Message, message) {
			return
		}
	}
	t.Fatalf("finding path containing %q and message containing %q not found in %+v", path, message, result.Findings)
}

func hasAchievementFinding(result achievementEditorValidationResult, message string) bool {
	for _, finding := range result.Findings {
		if strings.Contains(finding.Message, message) {
			return true
		}
	}
	return false
}
