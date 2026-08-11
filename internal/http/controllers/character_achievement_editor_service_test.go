package controllers

import (
	"encoding/json"
	"reflect"
	"strings"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestCharacterAchievementHydrationPreservesMultiDefinitionRewardOwnership(t *testing.T) {
	detail := achievementEditorCharacterDetail{
		Rewards: []achievementEditorReward{
			{RewardID: "101", SourceID: 10, Amount: "1"},
			{RewardID: "202", SourceID: 20, Amount: "1"},
		},
		RewardSets: []achievementEditorRewardSet{
			{RewardSetID: 1001, SourceID: 10},
			{RewardSetID: 2002, SourceID: 20},
		},
	}
	payload, err := json.Marshal(detail)
	if err != nil {
		t.Fatal(err)
	}
	decoded := achievementEditorCharacterDetail{}
	if err := json.Unmarshal(payload, &decoded); err != nil {
		t.Fatal(err)
	}
	if len(decoded.Rewards) != 2 || decoded.Rewards[0].SourceID != 10 || decoded.Rewards[1].SourceID != 20 {
		t.Fatalf("hydrated reward ownership collapsed across definitions: %+v", decoded.Rewards)
	}
	if len(decoded.RewardSets) != 2 || decoded.RewardSets[0].SourceID != 10 || decoded.RewardSets[1].SourceID != 20 {
		t.Fatalf("hydrated reward-set ownership collapsed across definitions: %+v", decoded.RewardSets)
	}
	for _, value := range []interface{}{achievementEditorReward{}, achievementEditorRewardSet{}} {
		field, found := reflect.TypeOf(value).FieldByName("SourceID")
		if !found || !strings.Contains(field.Tag.Get("gorm"), "column:source_id") {
			t.Fatalf("%T cannot receive the source_id projection from multi-definition hydration", value)
		}
	}
}

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

func TestCharacterAchievementDefinitionQuerySupportsDatabasePagination(t *testing.T) {
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN:                       "user:pass@tcp(localhost:3306)/eqemu_content",
		SkipInitializeWithVersion: true,
	}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatalf("create dry-run GORM DB: %v", err)
	}

	categoryID := uint32(7)
	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		rows := make([]achievementEditorDefinitionSummary, 0)
		return characterAchievementEditorDefinitionQuery(tx, characterAchievementEditorDetailFilters{
			Search: "hero", CategoryID: &categoryID,
		}).Select("a.id, a.name").Order("a.name ASC, a.id ASC").Limit(25).Offset(50).Scan(&rows)
	})
	for _, fragment := range []string{"a.description LIKE", "search_category.name LIKE", "ca.category_id = 7", "LIMIT 25 OFFSET 50"} {
		if !strings.Contains(sql, fragment) {
			t.Fatalf("definition page SQL is missing %q: %s", fragment, sql)
		}
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
			definition := achievementEditorDefinitionSummary{ID: 10, Version: 2}
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
	completion := achievementEditorCharacterCompletion{AchievementID: 10, Version: 6, CompletedAt: 1234}
	progress := []achievementEditorCharacterProgress{
		{AchievementID: 10, Version: 6, CurrentCount: "18446744073709551615"},
		{AchievementID: 10, Version: 6, CurrentCount: "5"},
	}
	rewards := []achievementEditorCharacterRewardLedger{{AchievementID: 10, Status: 2}}
	updates := []achievementEditorCharacterPendingUpdate{{AchievementID: 10, Status: 1}}

	lightweight := achievementEditorDefinitionSummary{ID: 10, Name: "Lightweight", Version: 7, Enabled: true}
	hydrated := lightweight
	hydrated.CategoryCount = 3
	hydrated.ComponentCount = 8
	hydrated.CriterionCount = 13
	hydrated.RewardCount = 2
	hydrated.CategoryNames = "Raids, Exploration"

	lightweight = characterAchievementEditorDecorateDefinition(lightweight, completion, progress, rewards, nil, updates)
	hydrated = characterAchievementEditorDecorateDefinition(hydrated, completion, progress, rewards, nil, updates)

	if hydrated.State != lightweight.State ||
		hydrated.CompletedAt != lightweight.CompletedAt ||
		hydrated.CharacterVersion != lightweight.CharacterVersion ||
		hydrated.ProgressRows != lightweight.ProgressRows ||
		hydrated.ProgressTotal != lightweight.ProgressTotal ||
		hydrated.VersionMismatch != lightweight.VersionMismatch ||
		hydrated.RewardAttention != lightweight.RewardAttention ||
		hydrated.PendingUpdate != lightweight.PendingUpdate {
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
	definition := achievementEditorDefinitionSummary{ID: 77, Version: 9, Enabled: true}
	decorated := characterAchievementEditorDecorateAggregate(
		definition,
		achievementEditorCharacterCompletion{},
		characterAchievementEditorProgressAggregate{
			AchievementID: 77, RowCount: 2500, Total: "18446744073709551615000", HasPositive: true,
			MinimumVersion: 8, MaximumVersion: 9,
		},
		characterAchievementEditorAttentionAggregate{AchievementID: 77},
		characterAchievementEditorAttentionAggregate{AchievementID: 77, Attention: true},
		characterAchievementEditorUpdateAggregate{AchievementID: 77, RowCount: 1, MinimumVersion: 9, MaximumVersion: 9},
	)
	if decorated.State != "in_progress" || decorated.ProgressRows != 2500 || decorated.ProgressTotal != "18446744073709551615000" {
		t.Fatalf("aggregate progress decoration = %+v", decorated)
	}
	if !decorated.RewardAttention || !decorated.PendingUpdate || !decorated.VersionMismatch {
		t.Fatalf("aggregate safety flags = %+v", decorated)
	}
	for _, filter := range []string{"in_progress", "version_mismatch", "reward_attention", "pending_update"} {
		if !characterAchievementEditorStateMatches(decorated, filter) {
			t.Fatalf("aggregate row did not match %q: %+v", filter, decorated)
		}
	}
}

func TestCharacterAchievementVersionZeroIsComparedExactlyAndPendingRowsRemainVisible(t *testing.T) {
	definition := achievementEditorDefinitionSummary{ID: 88, Version: 12, Enabled: true}
	decorated := characterAchievementEditorDecorateAggregate(
		definition,
		achievementEditorCharacterCompletion{AchievementID: 88, Version: 0},
		characterAchievementEditorProgressAggregate{AchievementID: 88, RowCount: 1, Total: "4"},
		characterAchievementEditorAttentionAggregate{},
		characterAchievementEditorAttentionAggregate{},
		characterAchievementEditorUpdateAggregate{AchievementID: 88, RowCount: 1, MinimumVersion: 0, MaximumVersion: 0},
	)
	if !decorated.VersionMismatch {
		t.Fatalf("version-zero state must mismatch a version-12 definition: %+v", decorated)
	}
	if !decorated.PendingUpdate {
		t.Fatalf("a pending update with version zero must still be visible: %+v", decorated)
	}
}

func TestCharacterAchievementOrphanCanMatchAttentionAndUpdateFilters(t *testing.T) {
	orphan := characterAchievementEditorDecorateAggregate(
		achievementEditorDefinitionSummary{ID: 999, Orphaned: true},
		achievementEditorCharacterCompletion{},
		characterAchievementEditorProgressAggregate{},
		characterAchievementEditorAttentionAggregate{AchievementID: 999, Attention: true},
		characterAchievementEditorAttentionAggregate{},
		characterAchievementEditorUpdateAggregate{AchievementID: 999, RowCount: 1},
	)
	if !characterAchievementEditorStateMatches(orphan, "reward_attention") || !characterAchievementEditorStateMatches(orphan, "pending_update") {
		t.Fatalf("orphan diagnostics disappeared from attention filters: %+v", orphan)
	}
	if orphan.State != "orphaned" || !characterAchievementEditorStateMatches(orphan, "orphaned") {
		t.Fatalf("orphan decoration lost its explicit state: %+v", orphan)
	}
}
