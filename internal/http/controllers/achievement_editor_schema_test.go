package controllers

import (
	"strings"
	"testing"
)

func TestAchievementEditorSchemaGuidanceNamesFinalUpdatesAndOldDraftLimitation(t *testing.T) {
	for name, test := range map[string]struct {
		guidance string
		updates  []string
	}{
		"content":   {achievementEditorContentSchemaGuidance, []string{"9329"}},
		"character": {achievementEditorCharacterSchemaGuidance, []string{"9329", "9330"}},
	} {
		t.Run(name, func(t *testing.T) {
			for _, update := range test.updates {
				if !strings.Contains(test.guidance, update) {
					t.Fatalf("guidance %q does not identify update %s", test.guidance, update)
				}
			}
			if !strings.Contains(strings.ToLower(test.guidance), "older draft") {
				t.Fatalf("guidance %q does not explain that rewritten CREATE migrations cannot update draft tables", test.guidance)
			}
		})
	}
}

func TestAchievementEditorSchemaPrecisionCriticalShapes(t *testing.T) {
	content := achievementEditorContentSchemaSpec()
	criteriaValue := content["achievement_criteria"].Shapes["target_value"]
	if criteriaValue.BaseType != "bigint" || !criteriaValue.Signed || criteriaValue.Unsigned || !criteriaValue.NotNull {
		t.Fatalf("unexpected achievement_criteria.target_value shape: %+v", criteriaValue)
	}
	rewardID := content["rewards"].Shapes["reward_id"]
	if rewardID.BaseType != "int" || !rewardID.Unsigned || !rewardID.AutoIncrement {
		t.Fatalf("unexpected rewards.reward_id shape: %+v", rewardID)
	}

	character := achievementEditorCharacterSchemaSpec()
	currentCount := character["character_achievement_progress"].Shapes["current_count"]
	if currentCount.BaseType != "bigint" || !currentCount.Unsigned || !currentCount.NotNull {
		t.Fatalf("unexpected character_achievement_progress.current_count shape: %+v", currentCount)
	}
	updateID := character["character_achievement_pending_updates"].Shapes["update_id"]
	if updateID.BaseType != "bigint" || !updateID.Unsigned || !updateID.AutoIncrement {
		t.Fatalf("unexpected character_achievement_pending_updates.update_id shape: %+v", updateID)
	}
}

func TestAchievementEditorSchemaSpecFailsClosedAgainstOldDraftContract(t *testing.T) {
	content := achievementEditorContentSchemaSpec()
	if len(content) != 13 {
		t.Fatalf("content schema table count = %d, want the exact 13-table final contract", len(content))
	}
	for _, table := range []string{"achievement_associations", "achievement_cast_requirements", "rewards", "reward_sets", "reward_options", "reward_option_entries", "reward_sources", "reward_source_entries"} {
		if _, found := content[table]; !found {
			t.Fatalf("final content table %s is not required", table)
		}
	}
	for _, draftTable := range []string{"achievement_component_counts", "achievement_cast_restrictions", "achievement_rewards", "achievement_reward_sets", "achievement_reward_options", "achievement_reward_option_entries"} {
		if _, found := content[draftTable]; found {
			t.Fatalf("old draft table %s is still accepted", draftTable)
		}
	}
	achievements := content["achievements"]
	for _, column := range []string{"has_reward", "client_flag", "version"} {
		if _, found := achievements.Shapes[column]; !found {
			t.Fatalf("final achievements.%s shape is not enforced", column)
		}
	}
	components := content["achievement_components"]
	for _, column := range []string{"name", "description"} {
		found := false
		for _, required := range components.Columns {
			found = found || required == column
		}
		if !found {
			t.Fatalf("final achievement_components.%s column is not required", column)
		}
	}
	character := achievementEditorCharacterSchemaSpec()
	if _, found := character["character_achievement_pending_updates"]; !found {
		t.Fatal("final character pending-update table is not required")
	}
	if _, found := character["character_achievement_pending_mutations"]; found {
		t.Fatal("old draft pending-mutation table is still accepted")
	}
}

func TestAchievementEditorSchemaSpecMatchesFinalSourceIndexes(t *testing.T) {
	content := achievementEditorContentSchemaSpec()
	if got := len(content["reward_option_entries"].Indexes); got != 2 {
		t.Fatalf("reward_option_entries index count = %d, want primary plus exact set/reward unique key", got)
	}
	if got := len(content["reward_source_entries"].Indexes); got != 2 {
		t.Fatalf("reward_source_entries index count = %d, want primary plus exact source/sequence unique key", got)
	}
	character := achievementEditorCharacterSchemaSpec()
	if got := len(character["character_achievement_pending_updates"].Indexes); got != 3 {
		t.Fatalf("pending update index count = %d, want primary plus the two final supporting indexes", got)
	}
}

func TestAchievementEditorColumnBaseTypeIgnoresDisplayWidthAndAttributes(t *testing.T) {
	cases := map[string]string{
		"BIGINT(20) UNSIGNED": "bigint",
		"int unsigned":        "int",
		" tinyint(1) ":        "tinyint",
	}
	for input, expected := range cases {
		if actual := achievementEditorColumnBaseType(input); actual != expected {
			t.Fatalf("base type for %q: got %q, want %q", input, actual, expected)
		}
	}
}
