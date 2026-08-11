package controllers

import (
	"errors"
	"strings"
	"testing"
)

func TestAchievementEditorAdvisoryUnlockCannotReverseUpdateOutcome(t *testing.T) {
	unlockErr := errors.New("connection failed during RELEASE_LOCK")
	if err := achievementEditorAdvisoryUpdateOutcome(nil, unlockErr); err != nil {
		t.Fatalf("post-commit unlock failure escaped to caller: %v", err)
	}
	updateErr := errors.New("update rolled back")
	if got := achievementEditorAdvisoryUpdateOutcome(updateErr, unlockErr); !errors.Is(got, updateErr) {
		t.Fatalf("original update error = %v, want %v", got, updateErr)
	}
}

func TestAchievementEditorAdvisoryLockNamesMatchRuntimeContracts(t *testing.T) {
	if achievementEditorAuthoringLock != "eqemu_achievement_authoring" {
		t.Fatalf("authoring lock = %q", achievementEditorAuthoringLock)
	}
	if got := achievementEditorCharacterLockName(1015); got != "eqemu_achievement_state_update_1015" {
		t.Fatalf("character lock = %q", got)
	}
	if achievementEditorAuthoringLock == achievementEditorCharacterLockName(1015) {
		t.Fatal("content and character advisory locks must remain distinct")
	}
}

func TestAchievementEditorDurableIdentityGuardChecksAllCharacterStateTables(t *testing.T) {
	seen := make([]string, 0, len(achievementEditorDurableCharacterStateTables))
	err := achievementEditorRequireUnusedDurableIdentity(100, func(table string) (bool, error) {
		seen = append(seen, table)
		return false, nil
	})
	if err != nil {
		t.Fatalf("unused identity was rejected: %v", err)
	}
	if len(seen) != len(achievementEditorDurableCharacterStateTables) {
		t.Fatalf("checked tables = %v, want all %v", seen, achievementEditorDurableCharacterStateTables)
	}
	for index, table := range achievementEditorDurableCharacterStateTables {
		if seen[index] != table {
			t.Fatalf("checked table %d = %q, want %q", index, seen[index], table)
		}
	}
}

func TestAchievementEditorDurableIdentityGuardRejectsEveryCharacterStateTable(t *testing.T) {
	for _, occupiedTable := range achievementEditorDurableCharacterStateTables {
		t.Run(occupiedTable, func(t *testing.T) {
			err := achievementEditorRequireUnusedDurableIdentity(100, func(table string) (bool, error) {
				return table == occupiedTable, nil
			})
			var conflict operationalEditorConflictError
			if !errors.As(err, &conflict) {
				t.Fatalf("durable identity reuse error = %v, want conflict", err)
			}
			if !strings.Contains(err.Error(), occupiedTable) || !strings.Contains(err.Error(), "never-used stable ID") {
				t.Fatalf("conflict does not identify safe remediation: %v", err)
			}
		})
	}
}

func TestAchievementEditorDefinitionRevisionDetectsStalePresentationEdits(t *testing.T) {
	graph := validAchievementEditorGraph()
	first, err := achievementEditorDefinitionRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	graph.Name = "Changed by another editor"
	second, err := achievementEditorDefinitionRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if first == second {
		t.Fatal("definition revision did not change after a persisted field changed")
	}
}

func TestAchievementEditorRuntimePolicyRequiresVersionOnlyForRuntimeChanges(t *testing.T) {
	graph := validAchievementEditorGraph()
	baseline, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}

	presentation := graph
	presentation.Name = "Presentation-only rename"
	presentation.Components = append([]achievementEditorComponent(nil), graph.Components...)
	presentation.Components[0].Description = "New player-facing explanation"
	presentationRevision, err := achievementEditorRuntimePolicyRevision(presentation)
	if err != nil {
		t.Fatal(err)
	}
	if baseline != presentationRevision {
		t.Fatal("presentation-only fields unexpectedly changed the runtime policy revision")
	}

	runtime := graph
	runtime.Components = append([]achievementEditorComponent(nil), graph.Components...)
	runtime.Components[0].Criteria = append([]achievementEditorCriterion(nil), graph.Components[0].Criteria...)
	runtime.Components[0].Criteria[0].RequiredCount++
	runtimeRevision, err := achievementEditorRuntimePolicyRevision(runtime)
	if err != nil {
		t.Fatal(err)
	}
	if baseline == runtimeRevision {
		t.Fatal("criterion policy change did not change the runtime policy revision")
	}
}

func TestAchievementEditorRuntimePolicyFingerprintsResetOnVersionChange(t *testing.T) {
	graph := validAchievementEditorGraph()
	baseline, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}

	graph.ResetOnVersionChange = !graph.ResetOnVersionChange
	changed, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if baseline == changed {
		t.Fatal("reset_on_version_change toggle did not change the runtime policy revision")
	}
}

func TestAchievementEditorRuntimePolicyTreatsOrphansAsInertUntilRestore(t *testing.T) {
	graph := validAchievementEditorGraph()
	baseline, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	orphan := achievementEditorComponent{
		ComponentType: 0, ComponentID: 200, Sequence: 2, PresentationCount: 1,
		RecoveryOnly: true, RecoveryCriteriaCount: 1,
		Criteria: []achievementEditorCriterion{{
			ID: "900", ComponentType: 0, ComponentID: 200, ComponentSequence: 2,
			EventType: 1, ProgressMode: 3, Behavior: 0, TargetValue: "60", RequiredCount: 1, Enabled: true,
		}},
	}
	graph.Components = append(graph.Components, orphan)

	unresolved, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if unresolved != baseline {
		t.Fatal("unresolved orphan criteria must remain inert in the runtime policy")
	}
	graph.Components[1].RecoveryAction = achievementEditorRecoveryActionDelete
	deleted, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if deleted != baseline {
		t.Fatal("deleting already-inert orphan criteria must not change runtime policy")
	}
	graph.Components[1].RecoveryAction = achievementEditorRecoveryActionRestore
	restored, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if restored == baseline {
		t.Fatal("restoring orphan criteria must change runtime policy and require a version bump")
	}
}

func TestAchievementEditorRuntimePolicyFingerprintsMappingsThatSuppressAutomaticDelivery(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{{RewardID: "600", Sequence: 1, RewardType: 2, Amount: "1", Enabled: true}}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID: 50,
		Enabled:     false,
		Options:     []achievementEditorRewardOption{{RewardSetID: 50, OptionID: 1, Enabled: false}},
		Mappings:    []achievementEditorRewardMapping{},
	}
	withoutMapping, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	graph.RewardSet.Mappings = []achievementEditorRewardMapping{{RewardSetID: 50, OptionID: 1, RewardID: "600"}}
	withMapping, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if withoutMapping == withMapping {
		t.Fatal("mapping an enabled reward through a disabled set/option must change the runtime policy because automatic delivery is suppressed")
	}
}

func TestAchievementEditorRuntimePolicyIgnoresSubmittedSliceOrder(t *testing.T) {
	graph := validAchievementEditorGraph()
	secondComponent := graph.Components[0]
	secondComponent.ComponentID++
	secondComponent.Sequence++
	secondComponent.Criteria = append([]achievementEditorCriterion(nil), graph.Components[0].Criteria...)
	secondComponent.Criteria[0].ComponentID = secondComponent.ComponentID
	secondComponent.Criteria[0].TargetID++
	graph.Components = append(graph.Components, secondComponent)
	graph.Rewards = []achievementEditorReward{
		{RewardID: "600", Sequence: 1, RewardType: 2, Amount: "1", Enabled: true},
		{RewardID: "601", Sequence: 2, RewardType: 4, RewardDataID: 7, Amount: "2", Enabled: true},
	}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID: 50,
		Enabled:     true,
		Options: []achievementEditorRewardOption{
			{RewardSetID: 50, OptionID: 2, Sequence: 2, Enabled: true},
			{RewardSetID: 50, OptionID: 1, Sequence: 1, Enabled: true},
		},
		Mappings: []achievementEditorRewardMapping{
			{RewardSetID: 50, OptionID: 2, RewardID: "601"},
			{RewardSetID: 50, OptionID: 1, RewardID: "600"},
		},
	}
	baseline, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}

	graph.Components[0], graph.Components[1] = graph.Components[1], graph.Components[0]
	graph.Rewards[0], graph.Rewards[1] = graph.Rewards[1], graph.Rewards[0]
	graph.RewardSet.Options[0], graph.RewardSet.Options[1] = graph.RewardSet.Options[1], graph.RewardSet.Options[0]
	graph.RewardSet.Mappings[0], graph.RewardSet.Mappings[1] = graph.RewardSet.Mappings[1], graph.RewardSet.Mappings[0]
	reordered, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if baseline != reordered {
		t.Fatal("presentation-only slice reordering changed the runtime policy revision")
	}
}

func TestAchievementEditorRuntimePolicyCanonicalizesTransientRewardTokens(t *testing.T) {
	graph := validAchievementEditorGraph()
	graph.Rewards = []achievementEditorReward{
		{Sequence: 1, RewardType: 2, Amount: "1", Enabled: true},
		{Sequence: 2, RewardType: 4, RewardDataID: 7, Amount: "2", Enabled: true},
	}
	graph.RewardSet = &achievementEditorRewardSet{
		RewardSetID: 50,
		Enabled:     true,
		Options: []achievementEditorRewardOption{
			{RewardSetID: 50, OptionID: 1, Enabled: true},
			{RewardSetID: 50, OptionID: 2, Enabled: true},
		},
		Mappings: []achievementEditorRewardMapping{
			{RewardSetID: 50, OptionID: 1, RewardID: "@0"},
			{RewardSetID: 50, OptionID: 2, RewardID: "@1"},
		},
	}
	baseline, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}

	graph.Rewards[0], graph.Rewards[1] = graph.Rewards[1], graph.Rewards[0]
	graph.RewardSet.Mappings[0].RewardID = "@1"
	graph.RewardSet.Mappings[1].RewardID = "@0"
	reordered, err := achievementEditorRuntimePolicyRevision(graph)
	if err != nil {
		t.Fatal(err)
	}
	if baseline != reordered {
		t.Fatal("transient @index tokens changed runtime policy after preserving reward-to-option semantics")
	}
}

func TestAchievementEditorCategoryRevisionIgnoresDerivedCounts(t *testing.T) {
	category := achievementEditorCategory{ID: 10, Name: "World", AssociationCount: 1, ChildrenCount: 2, Depth: 3}
	first, err := achievementEditorCategoryRevision(category)
	if err != nil {
		t.Fatal(err)
	}
	category.AssociationCount = 99
	category.ChildrenCount = 88
	category.Depth = 77
	second, err := achievementEditorCategoryRevision(category)
	if err != nil {
		t.Fatal(err)
	}
	if first != second {
		t.Fatal("derived category counts changed the optimistic revision")
	}
}
