package controllers

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestAchievementEditorCharacterLockNameMatchesEQEmuRuntime(t *testing.T) {
	if got := achievementEditorCharacterLockName(1015); got != "eqemu_achievement_state_update_1015" {
		t.Fatalf("character lock name = %q, want EQEmu runtime lock name", got)
	}
}

func TestCharacterAchievementUpdateRequiresExplicitExpectedVersionAndAcceptsZero(t *testing.T) {
	character := achievementEditorCharacter{Name: "Lyric"}
	base := achievementEditorCharacterUpdateBase{
		Reason: "Review version-zero state safely", CharacterConfirmation: "Lyric", Confirmation: "SET PROGRESS",
	}
	if err := validateCharacterAchievementUpdateBase(base, character, "SET PROGRESS"); err == nil || !strings.Contains(err.Error(), "version 0 is valid") {
		t.Fatalf("missing expected_version error = %v", err)
	}
	zero := uint32(0)
	base.ExpectedVersion = &zero
	if err := validateCharacterAchievementUpdateBase(base, character, "SET PROGRESS"); err != nil {
		t.Fatalf("explicit expected version zero was rejected: %v", err)
	}
}

func TestAchievementEditorEffectiveRequiredCountUsesEnabledCriterionPolicy(t *testing.T) {
	got, err := achievementEditorEffectiveRequiredCount([]uint32{25, 25, 25})
	if err != nil {
		t.Fatalf("matching enabled criterion counts returned error: %v", err)
	}
	if got != 25 {
		t.Fatalf("effective required count = %d, want 25", got)
	}

	for name, counts := range map[string][]uint32{
		"no enabled criterion": nil,
		"zero requirement":     {0},
		"conflicting policy":   {25, 30},
	} {
		t.Run(name, func(t *testing.T) {
			if _, err := achievementEditorEffectiveRequiredCount(counts); err == nil {
				t.Fatal("unsafe runtime criterion policy was accepted")
			}
		})
	}
}

func TestAchievementEditorRuntimePolicyCriteriaUseCanonicalIDColumn(t *testing.T) {
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN:                       "user:pass@tcp(localhost:3306)/eqemu_content",
		SkipInitializeWithVersion: true,
	}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatalf("create dry-run GORM DB: %v", err)
	}
	requiredCounts := make([]uint32, 0)
	query := achievementEditorEnabledComponentCriteriaQuery(db, 10, 0, 100).
		Pluck("required_count", &requiredCounts)
	if query.Error != nil {
		t.Fatalf("build criterion policy query: %v", query.Error)
	}
	sql := query.Statement.SQL.String()
	if strings.Contains(sql, "row_id") || !strings.Contains(sql, "ORDER BY id") {
		t.Fatalf("criterion policy SQL must order by canonical id column: %s", sql)
	}
}

func TestAchievementEditorPositiveStateRequiresEnabledDefinition(t *testing.T) {
	enabled := achievementEditorDefinitionPolicy{ID: 10, Enabled: true}
	if err := validateAchievementEditorPositiveStatePolicy(enabled, "creating character progress"); err != nil {
		t.Fatalf("enabled definition was rejected: %v", err)
	}

	disabled := achievementEditorDefinitionPolicy{ID: 10, Enabled: false}
	err := validateAchievementEditorPositiveStatePolicy(disabled, "forcing character completion")
	if err == nil || !strings.Contains(err.Error(), "not part of the active server snapshot") {
		t.Fatalf("disabled definition error = %v", err)
	}
}

func TestAchievementEditorPositiveStateRequiresEveryStoredVersionToMatchExactly(t *testing.T) {
	if err := validateAchievementEditorStoredStateVersions([]uint32{0, 0}, 0); err != nil {
		t.Fatalf("valid version-zero state was rejected: %v", err)
	}
	err := validateAchievementEditorStoredStateVersions([]uint32{0, 7, 7}, 7)
	if err == nil || !strings.Contains(err.Error(), "reset the achievement") {
		t.Fatalf("mixed-version state error = %v", err)
	}
}

func TestAchievementEditorPendingUpdateRetryRequiresExactVersionIncludingZero(t *testing.T) {
	if err := validateAchievementEditorPendingUpdateRetryVersion(0, 0); err != nil {
		t.Fatalf("matching version-zero queued update was rejected: %v", err)
	}
	if err := validateAchievementEditorPendingUpdateRetryVersion(0, 7); err == nil {
		t.Fatal("stale version-zero queued update was accepted")
	}
	if err := validateAchievementEditorPendingUpdateRetryVersion(6, 7); err == nil {
		t.Fatal("stale queued update version was accepted")
	}
	if err := validateAchievementEditorPendingUpdateRetryVersion(7, 7); err != nil {
		t.Fatalf("matching queued update version was rejected: %v", err)
	}
}

func TestAchievementEditorSelectionRetryRequiresChosenOption(t *testing.T) {
	valid := achievementEditorCharacterRewardSelection{Status: 0, SelectedOptionID: 7}
	if err := validateAchievementEditorSelectionRetryLedger(valid, 0); err != nil {
		t.Fatalf("ambiguous selection with a locked option should remain explicitly retryable: %v", err)
	}

	missingChoice := achievementEditorCharacterRewardSelection{Status: 0, SelectedOptionID: 0}
	err := validateAchievementEditorSelectionRetryLedger(missingChoice, 0)
	if err == nil || !strings.Contains(err.Error(), "no chosen option") {
		t.Fatalf("pending unselected choice error = %v", err)
	}

	granted := achievementEditorCharacterRewardSelection{Status: 1, SelectedOptionID: 7}
	if err := validateAchievementEditorSelectionRetryLedger(granted, 1); err == nil {
		t.Fatal("granted selection was accepted for retry")
	}

	changed := achievementEditorCharacterRewardSelection{Status: 2, SelectedOptionID: 7}
	if err := validateAchievementEditorSelectionRetryLedger(changed, 0); err == nil {
		t.Fatal("stale expected status was accepted")
	}

	unknown := achievementEditorCharacterRewardSelection{Status: 9, SelectedOptionID: 7}
	if err := validateAchievementEditorSelectionRetryLedger(unknown, 9); err == nil {
		t.Fatal("unknown selection status was accepted for retry")
	}
}

func TestAchievementEditorRewardRetryWhitelistsRuntimeStatuses(t *testing.T) {
	for _, status := range []uint8{0, 2} {
		if err := validateAchievementEditorRewardRetryLedger(
			achievementEditorCharacterRewardLedger{Status: status}, status,
		); err != nil {
			t.Fatalf("runtime reward status %d should be retryable: %v", status, err)
		}
	}
	for _, status := range []uint8{1, 3, 255} {
		if err := validateAchievementEditorRewardRetryLedger(
			achievementEditorCharacterRewardLedger{Status: status}, status,
		); err == nil {
			t.Fatalf("unsafe reward status %d was accepted for retry", status)
		}
	}
}

func TestAchievementEditorIndividualRewardRetryRejectsSelectableGrant(t *testing.T) {
	if err := validateAchievementEditorIndividualRewardRetryMapping(0); err != nil {
		t.Fatalf("automatic reward was rejected: %v", err)
	}
	err := validateAchievementEditorIndividualRewardRetryMapping(1)
	if err == nil || !strings.Contains(err.Error(), "owning reward selection") {
		t.Fatalf("mapped reward retry error = %v", err)
	}
}

func TestAchievementEditorSelectionRetryIncludesSelectedAndEnabledCommonGrants(t *testing.T) {
	options := []achievementEditorRewardOption{
		{OptionID: 1, Enabled: true, CommonToAll: true},
		{OptionID: 2, Enabled: true},
		{OptionID: 3, Enabled: true},
		{OptionID: 4, Enabled: false, CommonToAll: true},
	}
	mappings := []achievementEditorRewardMapping{
		{OptionID: 1, RewardID: "100"},
		{OptionID: 2, RewardID: "200"},
		{OptionID: 3, RewardID: "300"},
		{OptionID: 4, RewardID: "400"},
	}
	enabledRewards := map[string]struct{}{"100": {}, "200": {}, "300": {}, "400": {}}

	got, err := achievementEditorSelectionRetryRewardIDs(2, options, mappings, enabledRewards, enabledRewards)
	if err != nil {
		t.Fatalf("selection retry content was rejected: %v", err)
	}
	want := []string{"100", "200"}
	if strings.Join(got, ",") != strings.Join(want, ",") {
		t.Fatalf("retry reward IDs = %v, want %v", got, want)
	}
}

func TestAchievementEditorSelectionRetrySkipsDisabledGrantsWhenEffectiveOptionsRemainValid(t *testing.T) {
	options := []achievementEditorRewardOption{
		{OptionID: 1, Enabled: true, CommonToAll: true},
		{OptionID: 2, Enabled: true},
	}
	mappings := []achievementEditorRewardMapping{
		{OptionID: 1, Sequence: 1, RewardID: "100"},
		{OptionID: 1, Sequence: 2, RewardID: "101"},
		{OptionID: 2, Sequence: 1, RewardID: "200"},
		{OptionID: 2, Sequence: 2, RewardID: "201"},
	}
	knownRewards := map[string]struct{}{"100": {}, "101": {}, "200": {}, "201": {}}
	enabledRewards := map[string]struct{}{"101": {}, "201": {}}

	got, err := achievementEditorSelectionRetryRewardIDs(2, options, mappings, knownRewards, enabledRewards)
	if err != nil {
		t.Fatalf("valid mixed enabled/disabled bundle was rejected: %v", err)
	}
	want := []string{"101", "201"}
	if strings.Join(got, ",") != strings.Join(want, ",") {
		t.Fatalf("retry reward IDs = %v, want only enabled grants %v", got, want)
	}
}

func TestAchievementEditorSelectionRetryRejectsAllDisabledEffectiveOption(t *testing.T) {
	options := []achievementEditorRewardOption{{OptionID: 2, Enabled: true}}
	mappings := []achievementEditorRewardMapping{{OptionID: 2, RewardID: "200"}}
	knownRewards := map[string]struct{}{"200": {}}

	_, err := achievementEditorSelectionRetryRewardIDs(2, options, mappings, knownRewards, map[string]struct{}{})
	if err == nil || !strings.Contains(err.Error(), "no enabled mapped grant") {
		t.Fatalf("all-disabled effective option error = %v", err)
	}
}

func TestAchievementEditorSelectionRetryFailsClosedOnInvalidBundleContent(t *testing.T) {
	baseOptions := []achievementEditorRewardOption{
		{OptionID: 1, Enabled: true, CommonToAll: true},
		{OptionID: 2, Enabled: true},
	}
	cases := []struct {
		name     string
		selected uint32
		options  []achievementEditorRewardOption
		mappings []achievementEditorRewardMapping
		known    map[string]struct{}
		rewards  map[string]struct{}
	}{
		{name: "missing selected option", selected: 9, options: baseOptions, mappings: []achievementEditorRewardMapping{{OptionID: 1, RewardID: "100"}}, known: map[string]struct{}{"100": {}}, rewards: map[string]struct{}{"100": {}}},
		{name: "selected common option", selected: 1, options: baseOptions, mappings: []achievementEditorRewardMapping{{OptionID: 1, RewardID: "100"}}, known: map[string]struct{}{"100": {}}, rewards: map[string]struct{}{"100": {}}},
		{name: "common option without grant", selected: 2, options: baseOptions, mappings: []achievementEditorRewardMapping{{OptionID: 2, RewardID: "200"}}, known: map[string]struct{}{"200": {}}, rewards: map[string]struct{}{"200": {}}},
		{name: "missing mapped reward", selected: 2, options: baseOptions, mappings: []achievementEditorRewardMapping{{OptionID: 1, RewardID: "100"}, {OptionID: 2, RewardID: "200"}}, known: map[string]struct{}{"200": {}}, rewards: map[string]struct{}{"200": {}}},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			if _, err := achievementEditorSelectionRetryRewardIDs(test.selected, test.options, test.mappings, test.known, test.rewards); err == nil {
				t.Fatal("unsafe selection content was accepted")
			}
		})
	}
}

func TestAchievementEditorProcessingLeaseRecoveryMatchesRuntimeCutoff(t *testing.T) {
	const now = uint64(1_000)
	if achievementEditorProcessingLeaseExpired(941, now) {
		t.Fatal("59-second processing lease was treated as expired")
	}
	if !achievementEditorProcessingLeaseExpired(940, now) {
		t.Fatal("60-second processing lease was not treated as expired")
	}
	if achievementEditorProcessingLeaseExpired(1_001, now) {
		t.Fatal("future processing timestamp was treated as expired")
	}

	if err := achievementEditorAuthorizeStaleProcessingLeaseRecovery(941, now, true); err == nil {
		t.Fatal("active processing lease was authorized for recovery")
	}
	err := achievementEditorAuthorizeStaleProcessingLeaseRecovery(940, now, false)
	var fieldError achievementEditorHTTPError
	if !errors.As(err, &fieldError) || fieldError.field != "acknowledge_stale_processing_lease" {
		t.Fatalf("unacknowledged stale lease error = %#v", err)
	}
	if err := achievementEditorAuthorizeStaleProcessingLeaseRecovery(940, now, true); err != nil {
		t.Fatalf("acknowledged stale lease recovery failed: %v", err)
	}
}

func TestAchievementEditorStaleLeaseAcknowledgementRequestCompatibility(t *testing.T) {
	reset := achievementEditorResetRequest{}
	if err := json.Unmarshal([]byte(`{"achievement_id":10}`), &reset); err != nil {
		t.Fatalf("legacy reset request failed to decode: %v", err)
	}
	if reset.AcknowledgeStaleProcessingLease {
		t.Fatal("legacy reset request unexpectedly acknowledged stale lease recovery")
	}

	discard := achievementEditorPendingUpdateRequest{}
	if err := json.Unmarshal([]byte(`{"update_id":"42","acknowledge_stale_processing_lease":true}`), &discard); err != nil {
		t.Fatalf("stale-lease discard request failed to decode: %v", err)
	}
	if !discard.AcknowledgeStaleProcessingLease {
		t.Fatal("stale-lease acknowledgement was not decoded")
	}
}

func TestAchievementEditorExpectedProgressCountRoundTripsExactUint64String(t *testing.T) {
	request := achievementEditorProgressRequest{}
	if err := json.Unmarshal([]byte(`{"expected_current_count":"18446744073709551615","current_count":25}`), &request); err != nil {
		t.Fatalf("exact string request failed to decode: %v", err)
	}
	parsed, err := parseAchievementEditorExpectedCurrentCount(request.ExpectedCurrentCount)
	if err != nil || parsed == nil || *parsed != ^uint64(0) {
		t.Fatalf("parsed expected current count = %v, %v", parsed, err)
	}
	if err := validateAchievementEditorExpectedCurrentCount(parsed, ^uint64(0)); err != nil {
		t.Fatalf("exact maximum count was rejected: %v", err)
	}
	if err := validateAchievementEditorExpectedCurrentCount(parsed, uint64(^uint32(0))); err == nil {
		t.Fatal("uint64 expected count was truncated to uint32 during optimistic concurrency comparison")
	}

	request = achievementEditorProgressRequest{}
	if err := json.Unmarshal([]byte(`{"expected_current_count":4294967295}`), &request); err == nil {
		t.Fatal("numeric expected_current_count was accepted; the API must require a precision-safe decimal string")
	}

	request = achievementEditorProgressRequest{}
	parsed, err = parseAchievementEditorExpectedCurrentCount(request.ExpectedCurrentCount)
	if err == nil || parsed != nil {
		t.Fatalf("omitted expected_current_count was accepted: parsed=%v err=%v", parsed, err)
	}
	if err := validateAchievementEditorExpectedCurrentCount(nil, 0); err == nil {
		t.Fatal("nil expected_current_count bypassed authoritative optimistic concurrency")
	}
}
