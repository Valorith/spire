package controllers

import (
	"strings"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestCharacterAchievementSummaryQueryUsesNonReservedCharacterAlias(t *testing.T) {
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN:                       "user:pass@tcp(localhost:3306)/peq",
		SkipInitializeWithVersion: true,
	}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatalf("create dry-run GORM DB: %v", err)
	}

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		var total int64
		return characterAchievementEditorCharacterSummaryQuery(tx, "Lyric", "online").Count(&total)
	})
	for _, fragment := range []string{
		"character_data character_record",
		"character_record.deleted_at IS NULL",
		"character_record.name LIKE",
		"character_record.ingame = 1",
	} {
		if !strings.Contains(sql, fragment) {
			t.Fatalf("character summary SQL is missing %q: %s", fragment, sql)
		}
	}
	if strings.Contains(sql, "character_data character WHERE") {
		t.Fatalf("character summary SQL reused MariaDB-reserved alias character: %s", sql)
	}
}

func TestCharacterAchievementDefinitionResolutionBoundsOrphanLookup(t *testing.T) {
	definitions := []achievementEditorDefinitionSummary{{ID: 10}, {ID: 20}}
	stateIDs := map[uint32]bool{20: true, 40: true, 30: true}
	known, unresolved := characterAchievementEditorDefinitionResolution(definitions, stateIDs)
	if !known[10] || !known[20] || known[30] || known[40] {
		t.Fatalf("known definition set = %+v", known)
	}
	if len(unresolved) != 2 || unresolved[0] != 30 || unresolved[1] != 40 {
		t.Fatalf("unresolved state IDs = %+v, want [30 40]", unresolved)
	}
}

func TestCharacterAchievementSelectionRewardAttentionSemantics(t *testing.T) {
	tests := []struct {
		name       string
		selection  achievementEditorCharacterRewardSelection
		attention  bool
		notStarted bool
	}{
		{
			name:       "normal pending player choice",
			selection:  achievementEditorCharacterRewardSelection{Status: 0, SelectedOptionID: 0},
			attention:  false,
			notStarted: true,
		},
		{
			name:       "interrupted selected choice",
			selection:  achievementEditorCharacterRewardSelection{Status: 0, SelectedOptionID: 4},
			attention:  true,
			notStarted: true,
		},
		{
			name:       "retryable selection failure",
			selection:  achievementEditorCharacterRewardSelection{Status: 2, SelectedOptionID: 4},
			attention:  true,
			notStarted: true,
		},
		{
			name:       "ambiguous selection delivery",
			selection:  achievementEditorCharacterRewardSelection{Status: 3, SelectedOptionID: 4},
			attention:  true,
			notStarted: true,
		},
		{
			name:       "fully granted selection",
			selection:  achievementEditorCharacterRewardSelection{Status: 1, SelectedOptionID: 4},
			attention:  false,
			notStarted: true,
		},
		{
			name:       "unknown selection status",
			selection:  achievementEditorCharacterRewardSelection{Status: 255, SelectedOptionID: 4},
			attention:  true,
			notStarted: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			definition := achievementEditorDefinitionSummary{ID: 10, DefinitionVersion: 2}
			decorated := characterAchievementEditorDecorateDefinition(
				definition,
				achievementEditorCharacterCompletion{},
				nil,
				nil,
				[]achievementEditorCharacterRewardSelection{test.selection},
				nil,
			)
			if decorated.RewardAttention != test.attention {
				t.Fatalf("RewardAttention = %t, want %t", decorated.RewardAttention, test.attention)
			}
			if characterAchievementEditorStateMatches(decorated, "reward_attention") != test.attention {
				t.Fatalf("reward_attention filter disagrees with decoration: %+v", decorated)
			}
			notStarted := characterAchievementEditorStateMatches(decorated, "not_started")
			if notStarted != test.notStarted {
				t.Fatalf("not_started filter = %t, want %t", notStarted, test.notStarted)
			}
		})
	}
}

func TestCharacterAchievementPageSummaryHydrationPreservesStateDecoration(t *testing.T) {
	completion := achievementEditorCharacterCompletion{AchievementID: 10, DefinitionVersion: 6, CompletedAt: 1234}
	progress := []achievementEditorCharacterProgress{
		{AchievementID: 10, DefinitionVersion: 6, CurrentCount: "18446744073709551615"},
		{AchievementID: 10, DefinitionVersion: 6, CurrentCount: "5"},
	}
	rewards := []achievementEditorCharacterRewardLedger{{AchievementID: 10, Status: 2}}
	mutations := []achievementEditorCharacterPendingMutation{{AchievementID: 10, Status: 1}}

	lightweight := achievementEditorDefinitionSummary{ID: 10, Name: "Lightweight", DefinitionVersion: 7, Enabled: true}
	hydrated := lightweight
	hydrated.CategoryCount = 3
	hydrated.ComponentCount = 8
	hydrated.CriterionCount = 13
	hydrated.RewardCount = 2
	hydrated.CategoryNames = "Raids, Exploration"

	lightweight = characterAchievementEditorDecorateDefinition(lightweight, completion, progress, rewards, nil, mutations)
	hydrated = characterAchievementEditorDecorateDefinition(hydrated, completion, progress, rewards, nil, mutations)

	if hydrated.State != lightweight.State ||
		hydrated.CompletedAt != lightweight.CompletedAt ||
		hydrated.CharacterDefinitionVersion != lightweight.CharacterDefinitionVersion ||
		hydrated.ProgressRows != lightweight.ProgressRows ||
		hydrated.ProgressTotal != lightweight.ProgressTotal ||
		hydrated.VersionMismatch != lightweight.VersionMismatch ||
		hydrated.RewardAttention != lightweight.RewardAttention ||
		hydrated.PendingMutation != lightweight.PendingMutation {
		t.Fatalf("bounded summary hydration changed character-state decoration:\nlightweight=%+v\nhydrated=%+v", lightweight, hydrated)
	}
	if hydrated.CategoryCount != 3 || hydrated.ComponentCount != 8 || hydrated.CategoryNames == "" {
		t.Fatalf("hydrated catalog projection was not preserved: %+v", hydrated)
	}
	if hydrated.ProgressTotal != "18446744073709551620" {
		t.Fatalf("large progress total = %q, want exact uint64-safe sum", hydrated.ProgressTotal)
	}
}

func TestCharacterAchievementAggregateDecorationPreservesFilterSemantics(t *testing.T) {
	definition := achievementEditorDefinitionSummary{ID: 77, DefinitionVersion: 9, Enabled: true}
	decorated := characterAchievementEditorDecorateAggregate(
		definition,
		achievementEditorCharacterCompletion{},
		characterAchievementEditorProgressAggregate{
			AchievementID: 77, RowCount: 2500, Total: "18446744073709551615000", HasPositive: true,
			MinimumDefinitionVersion: 8, MaximumDefinitionVersion: 9,
		},
		characterAchievementEditorAttentionAggregate{AchievementID: 77},
		characterAchievementEditorAttentionAggregate{AchievementID: 77, Attention: true},
		characterAchievementEditorMutationAggregate{AchievementID: 77, MinimumDefinitionVersion: 9, MaximumDefinitionVersion: 9},
	)
	if decorated.State != "in_progress" || decorated.ProgressRows != 2500 || decorated.ProgressTotal != "18446744073709551615000" {
		t.Fatalf("aggregate progress decoration = %+v", decorated)
	}
	if !decorated.RewardAttention || !decorated.PendingMutation || !decorated.VersionMismatch {
		t.Fatalf("aggregate safety flags = %+v", decorated)
	}
	for _, filter := range []string{"in_progress", "version_mismatch", "reward_attention", "pending_mutation"} {
		if !characterAchievementEditorStateMatches(decorated, filter) {
			t.Fatalf("aggregate row did not match %q: %+v", filter, decorated)
		}
	}
}

func TestCharacterAchievementLegacyZeroVersionsAreNotReportedAsMismatches(t *testing.T) {
	definition := achievementEditorDefinitionSummary{ID: 88, DefinitionVersion: 12, Enabled: true}
	decorated := characterAchievementEditorDecorateAggregate(
		definition,
		achievementEditorCharacterCompletion{AchievementID: 88, DefinitionVersion: 0},
		characterAchievementEditorProgressAggregate{AchievementID: 88, RowCount: 1, Total: "4"},
		characterAchievementEditorAttentionAggregate{},
		characterAchievementEditorAttentionAggregate{},
		characterAchievementEditorMutationAggregate{AchievementID: 88},
	)
	if decorated.VersionMismatch {
		t.Fatalf("legacy version-zero state must remain compatible for repair: %+v", decorated)
	}
	if !decorated.PendingMutation {
		t.Fatalf("a version-zero pending mutation must still be visible: %+v", decorated)
	}
}

func TestCharacterAchievementOrphanCanMatchAttentionAndMutationFilters(t *testing.T) {
	orphan := characterAchievementEditorDecorateAggregate(
		achievementEditorDefinitionSummary{ID: 999, Orphaned: true},
		achievementEditorCharacterCompletion{},
		characterAchievementEditorProgressAggregate{},
		characterAchievementEditorAttentionAggregate{AchievementID: 999, Attention: true},
		characterAchievementEditorAttentionAggregate{},
		characterAchievementEditorMutationAggregate{AchievementID: 999},
	)
	if !characterAchievementEditorStateMatches(orphan, "reward_attention") || !characterAchievementEditorStateMatches(orphan, "pending_mutation") {
		t.Fatalf("orphan diagnostics disappeared from attention filters: %+v", orphan)
	}
}
