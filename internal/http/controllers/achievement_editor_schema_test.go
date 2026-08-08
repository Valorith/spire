package controllers

import "testing"

func TestAchievementEditorSchemaPrecisionCriticalShapes(t *testing.T) {
	content := achievementEditorContentSchemaSpec()
	criteriaValue := content["achievement_criteria"].Shapes["target_value"]
	if criteriaValue.BaseType != "bigint" || !criteriaValue.Signed || criteriaValue.Unsigned || !criteriaValue.NotNull {
		t.Fatalf("unexpected achievement_criteria.target_value shape: %+v", criteriaValue)
	}
	rewardID := content["achievement_rewards"].Shapes["reward_id"]
	if rewardID.BaseType != "bigint" || !rewardID.Unsigned || !rewardID.AutoIncrement {
		t.Fatalf("unexpected achievement_rewards.reward_id shape: %+v", rewardID)
	}

	character := achievementEditorCharacterSchemaSpec()
	currentCount := character["character_achievement_progress"].Shapes["current_count"]
	if currentCount.BaseType != "bigint" || !currentCount.Unsigned || !currentCount.NotNull {
		t.Fatalf("unexpected character_achievement_progress.current_count shape: %+v", currentCount)
	}
	mutationID := character["character_achievement_pending_mutations"].Shapes["mutation_id"]
	if mutationID.BaseType != "bigint" || !mutationID.Unsigned || !mutationID.AutoIncrement {
		t.Fatalf("unexpected character_achievement_pending_mutations.mutation_id shape: %+v", mutationID)
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
