package controllers

import (
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

func TestValidatePlayerOperationsCharacter(t *testing.T) {
	valid := playerOperationsCharacterInput{
		Name:   "Alder",
		Gender: 0,
		Race:   1,
		Class:  3,
		Level:  65,
		Deity:  208,
		Anon:   0,
		GM:     0,
	}
	if err := validatePlayerOperationsCharacter(valid); err != nil {
		t.Fatalf("validatePlayerOperationsCharacter(valid) error = %v", err)
	}
	padded := valid
	padded.Name = "  Alder  "
	normalized := normalizePlayerOperationsCharacterInput(padded)
	if normalized.Name != "Alder" {
		t.Fatalf("normalizePlayerOperationsCharacterInput() name = %q, want Alder", normalized.Name)
	}

	for _, test := range []struct {
		name  string
		input playerOperationsCharacterInput
		want  string
	}{
		{name: "missing name", input: playerOperationsCharacterInput{Race: 1, Class: 1, Level: 1}, want: "name"},
		{name: "retirement marker", input: playerOperationsCharacterInput{Name: "Alder-deleted", Race: 1, Class: 1, Level: 1}, want: "retirement"},
		{name: "invalid level", input: playerOperationsCharacterInput{Name: "Alder", Race: 1, Class: 1, Level: 0}, want: "level"},
		{name: "invalid race", input: playerOperationsCharacterInput{Name: "Alder", Race: 0, Class: 1, Level: 1}, want: "race"},
		{name: "invalid visibility", input: playerOperationsCharacterInput{Name: "Alder", Race: 1, Class: 1, Level: 1, Gender: 3}, want: "visibility"},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := validatePlayerOperationsCharacter(test.input)
			if err == nil || !strings.Contains(strings.ToLower(err.Error()), test.want) {
				t.Fatalf("validatePlayerOperationsCharacter() error = %v, want %q", err, test.want)
			}
		})
	}
}

func TestValidatePlayerOperationsAccountAndGuild(t *testing.T) {
	if err := validatePlayerOperationsAccount(playerOperationsAccountInput{
		Status:  100,
		FlyMode: 2,
	}); err != nil {
		t.Fatalf("validatePlayerOperationsAccount(valid) error = %v", err)
	}
	if err := validatePlayerOperationsAccount(playerOperationsAccountInput{Status: 256}); err == nil {
		t.Fatal("validatePlayerOperationsAccount() expected a status error")
	}
	if err := validatePlayerOperationsAccount(playerOperationsAccountInput{FlyMode: 3}); err == nil {
		t.Fatal("validatePlayerOperationsAccount() expected a fly-mode error")
	}

	if err := validatePlayerOperationsGuild(playerOperationsGuildInput{
		Name:      "Keepers of the Spire",
		LeaderID:  910001,
		MinStatus: 0,
	}); err != nil {
		t.Fatalf("validatePlayerOperationsGuild(valid) error = %v", err)
	}
	if err := validatePlayerOperationsGuild(playerOperationsGuildInput{}); err == nil {
		t.Fatal("validatePlayerOperationsGuild() expected a name error")
	}
}

func TestValidatePlayerOperationsGuildAccess(t *testing.T) {
	valid := playerOperationsGuildAccessInput{
		Reason: "Updating guild access after an officer review",
		Ranks: []playerOperationsGuildRank{
			{Rank: 1, Title: "Guild Leader"},
			{Rank: 2, Title: "Officer"},
		},
		Permissions: []playerOperationsGuildPermission{
			{ID: 1, Permission: 3},
			{ID: 2, Permission: 1},
		},
	}
	if err := validatePlayerOperationsGuildAccess(valid); err != nil {
		t.Fatalf("validatePlayerOperationsGuildAccess(valid) error = %v", err)
	}

	invalid := []struct {
		name  string
		input playerOperationsGuildAccessInput
		want  string
	}{
		{name: "short reason", input: playerOperationsGuildAccessInput{Reason: "too few"}, want: "reason"},
		{name: "invalid rank", input: playerOperationsGuildAccessInput{Reason: valid.Reason, Ranks: []playerOperationsGuildRank{{Rank: 9, Title: "Invalid"}}}, want: "rank"},
		{name: "duplicate rank", input: playerOperationsGuildAccessInput{Reason: valid.Reason, Ranks: []playerOperationsGuildRank{{Rank: 2, Title: "Officer"}, {Rank: 2, Title: "Duplicate"}}}, want: "duplicated"},
		{name: "invalid permission", input: playerOperationsGuildAccessInput{Reason: valid.Reason, Permissions: []playerOperationsGuildPermission{{ID: 31, Permission: 1}}}, want: "permission"},
		{name: "duplicate permission", input: playerOperationsGuildAccessInput{Reason: valid.Reason, Permissions: []playerOperationsGuildPermission{{ID: 2, Permission: 1}, {ID: 2, Permission: 2}}}, want: "duplicated"},
	}
	for _, test := range invalid {
		t.Run(test.name, func(t *testing.T) {
			err := validatePlayerOperationsGuildAccess(test.input)
			if err == nil || !strings.Contains(strings.ToLower(err.Error()), test.want) {
				t.Fatalf("validatePlayerOperationsGuildAccess() error = %v, want %q", err, test.want)
			}
		})
	}
}

func TestValidatePlayerOperationsGuildMembership(t *testing.T) {
	for _, test := range []struct {
		name    string
		guildID int
		rank    int
		wantErr bool
	}{
		{name: "member rank 1", guildID: 10, rank: 1},
		{name: "member rank 8", guildID: 10, rank: 8},
		{name: "membership removal", guildID: 0, rank: 0},
		{name: "member rank 0", guildID: 10, rank: 0, wantErr: true},
		{name: "member rank 9", guildID: 10, rank: 9, wantErr: true},
		{name: "removal with rank", guildID: 0, rank: 1, wantErr: true},
		{name: "negative guild", guildID: -1, rank: 1, wantErr: true},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := validatePlayerOperationsGuildMembership(test.guildID, test.rank)
			if (err != nil) != test.wantErr {
				t.Fatalf(
					"validatePlayerOperationsGuildMembership(%d, %d) error = %v, wantErr %v",
					test.guildID,
					test.rank,
					err,
					test.wantErr,
				)
			}
		})
	}
}

func TestPlayerOperationsRetirementNames(t *testing.T) {
	if got := playerOperationsRetiredName("Alder", 910001); got != "Alder-deleted-910001" {
		t.Fatalf("playerOperationsRetiredName() = %q", got)
	}
	longName := strings.Repeat("a", 64)
	if got := playerOperationsRetiredName(longName, 910001); got != "" {
		t.Fatalf("playerOperationsRetiredName(long) = %q, want an empty rejection marker", got)
	}
	if got := playerOperationsRestoreName("Alder-DeLeTeD-910001"); got != "Alder" {
		t.Fatalf("playerOperationsRestoreName() = %q", got)
	}
}

func TestPlayerOperationsTimesEqual(t *testing.T) {
	base := time.Date(2026, time.July, 26, 20, 40, 30, 100, time.UTC)
	sameInstant := base.In(time.FixedZone("EDT", -4*60*60))
	sameSecond := base.Add(800 * time.Millisecond)
	nextSecond := base.Add(time.Second)

	for _, test := range []struct {
		name        string
		left, right *time.Time
		want        bool
	}{
		{name: "both nil", want: true},
		{name: "left nil", right: &base, want: false},
		{name: "right nil", left: &base, want: false},
		{name: "same instant across zones", left: &base, right: &sameInstant, want: true},
		{name: "subsecond difference", left: &base, right: &sameSecond, want: true},
		{name: "different second", left: &base, right: &nextSecond, want: false},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := playerOperationsTimesEqual(test.left, test.right); got != test.want {
				t.Fatalf("playerOperationsTimesEqual() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestPlayerOperationsCurrencyWithinBounds(t *testing.T) {
	if !playerOperationsCurrencyWithinBounds(playerOperationsCurrency{Platinum: playerOperationsMaxCurrency}) {
		t.Fatal("playerOperationsCurrencyWithinBounds(max) = false, want true")
	}
	if playerOperationsCurrencyWithinBounds(playerOperationsCurrency{EbonCrystal: playerOperationsMaxCurrency + 1}) {
		t.Fatal("playerOperationsCurrencyWithinBounds(over max) = true, want false")
	}
}

func TestPlayerOperationsPagination(t *testing.T) {
	for _, test := range []struct {
		name      string
		target    string
		wantPage  int
		wantLimit int
	}{
		{name: "defaults", target: "/", wantPage: 1, wantLimit: playerOperationsDefaultPageSize},
		{name: "in range", target: "/?page=3&limit=10", wantPage: 3, wantLimit: 10},
		{name: "minimum page", target: "/?page=0&limit=500", wantPage: 1, wantLimit: playerOperationsMaxPageSize},
		{name: "maximum page", target: "/?page=5000&limit=500", wantPage: playerOperationsMaxPage, wantLimit: playerOperationsMaxPageSize},
	} {
		t.Run(test.name, func(t *testing.T) {
			e := echo.New()
			request := httptest.NewRequest("GET", test.target, nil)
			context := e.NewContext(request, nil)

			page, limit := playerOperationsPagination(context)
			if page != test.wantPage || limit != test.wantLimit {
				t.Fatalf(
					"playerOperationsPagination() = (%d, %d), want (%d, %d)",
					page,
					limit,
					test.wantPage,
					test.wantLimit,
				)
			}
		})
	}
}

func TestPlanPlayerOperationsGuildLeaderChange(t *testing.T) {
	for _, test := range []struct {
		name    string
		current int
		next    int
		want    playerOperationsGuildLeaderPlan
	}{
		{name: "assign leader", next: 22, want: playerOperationsGuildLeaderPlan{PromoteCharacterID: 22}},
		{name: "replace leader", current: 11, next: 22, want: playerOperationsGuildLeaderPlan{PromoteCharacterID: 22}},
		{name: "clear leader", current: 11, want: playerOperationsGuildLeaderPlan{DemoteCharacterID: 11}},
		{name: "save leaderless guild", want: playerOperationsGuildLeaderPlan{}},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := planPlayerOperationsGuildLeaderChange(test.current, test.next); got != test.want {
				t.Fatalf("planPlayerOperationsGuildLeaderChange() = %#v, want %#v", got, test.want)
			}
		})
	}
}
