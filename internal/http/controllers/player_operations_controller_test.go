package controllers

import (
	"errors"
	"fmt"
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

func TestPlayerOperationsGuildLeaderChanged(t *testing.T) {
	tests := []struct {
		name      string
		current   int
		requested int
		want      bool
	}{
		{name: "unchanged unassigned leader", current: 0, requested: 0, want: false},
		{name: "unchanged assigned leader", current: 910001, requested: 910001, want: false},
		{name: "assign leader", current: 0, requested: 910001, want: true},
		{name: "clear leader", current: 910001, requested: 0, want: true},
		{name: "replace leader", current: 910001, requested: 910002, want: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := playerOperationsGuildLeaderChanged(test.current, test.requested); got != test.want {
				t.Fatalf("playerOperationsGuildLeaderChanged(%d, %d) = %v, want %v", test.current, test.requested, got, test.want)
			}
		})
	}
}

func TestPlayerOperationsSanctionPlan(t *testing.T) {
	until := time.Date(2035, time.January, 2, 18, 45, 0, 0, time.UTC)
	banned := "Indefinite ban"
	plan := func(mode string, status int, banReason *string) (map[string]interface{}, error) {
		return playerOperationsSanctionPlan(mode, playerOperationsSanctionAccount{Status: status, BanReason: banReason}, &until, " Policy violation ")
	}
	for _, status := range []int{-2, -1, 0, 5, 255} {
		suspend, suspendErr := plan("suspend", status, nil)
		ban, banErr := plan("ban", status, nil)
		clear, clearErr := plan("clear", status, nil)
		if clearErr != nil {
			t.Fatalf("clear on status %d: %v", status, clearErr)
		}
		if clear["ban_reason"] != "" || clear["suspend_reason"] != "" || clear["suspendeduntil"] != nil {
			t.Fatalf("clear on status %d = %#v", status, clear)
		}
		switch status {
		case -2:
			if suspendErr == nil || suspendErr.Error() != "Clear the existing indefinite ban before applying a temporary suspension" {
				t.Fatalf("suspend on a ban = %v", suspendErr)
			}
		case -1, 0:
			if suspendErr != nil || suspend["status"] != -1 || suspend["suspendeduntil"] != &until || suspend["suspend_reason"] != "Policy violation" {
				t.Fatalf("suspend on status %d = %#v, %v", status, suspend, suspendErr)
			}
			if _, overwrites := suspend["ban_reason"]; overwrites {
				t.Fatal("a suspension must not touch the ban reason")
			}
		default:
			want := fmt.Sprintf("This account has status %d. Spire suspends and bans player accounts only; change the status in the account editor first if you mean to restrict it.", status)
			if suspendErr == nil || suspendErr.Error() != want || banErr == nil || banErr.Error() != want {
				t.Fatalf("staff status %d: suspend %v, ban %v", status, suspendErr, banErr)
			}
		}
		if status <= 0 {
			farDate, _ := ban["suspendeduntil"].(*time.Time)
			if banErr != nil || ban["status"] != -2 || farDate == nil || !farDate.Equal(playerOperationsBanUntil) ||
				ban["ban_reason"] != "Policy violation" || ban["suspend_reason"] != "" {
				t.Fatalf("ban on status %d = %#v, %v", status, ban, banErr)
			}
		}
		if _, sets := clear["status"]; sets != (status == -1 || status == -2) {
			t.Fatalf("clear on status %d changes status: %#v", status, clear)
		}
		if status < 0 && clear["status"] != 0 {
			t.Fatalf("clear on status %d = %#v", status, clear)
		}
	}
	if _, err := plan("suspend", 0, &banned); err == nil {
		t.Fatal("a suspension must not replace a stored ban reason")
	}
	if _, err := plan("ban", -3, nil); err == nil {
		t.Fatal("unknown negative statuses are not player accounts")
	}
	// The connections send times in local time; the ban date must stay a
	// valid DATETIME in every zone, including those east of UTC.
	if local := playerOperationsBanUntil.In(time.Local); local.Year() != 9999 || local.Month() != time.December || local.Day() != 31 {
		t.Fatalf("ban date in local time = %v", local)
	}
}

func TestPlayerOperationsOnlineRefusal(t *testing.T) {
	want := map[string]string{
		"profile":  "This character is online. Log them out, or kick them from Player Support, before editing the profile; the game would overwrite the change.",
		"relocate": "This character is online. Use Move in Player Support, or log them out first; the game would overwrite the change.",
		"currency": "This character is online. Log them out before changing balances; the game would overwrite the change.",
		"transfer": "This character is online. Log them out before transferring it; the game would overwrite the change.",
		"retire":   "This character is online. Log them out before retiring it; the game would overwrite the change.",
	}
	for operation, message := range want {
		if err := playerOperationsOnlineRefusal(operation, 0); err != nil {
			t.Fatalf("%s offline: %v", operation, err)
		}
		err := playerOperationsOnlineRefusal(operation, 1)
		var conflict playerOperationsConflictError
		if !errors.As(err, &conflict) || conflict.Error() != message {
			t.Fatalf("%s online = %v", operation, err)
		}
	}
}

func TestPlayerOperationsHasBanReason(t *testing.T) {
	blank := " "
	reason := "Policy violation"
	if playerOperationsHasBanReason(nil) || playerOperationsHasBanReason(&blank) {
		t.Fatal("blank ban reason reported as active")
	}
	if !playerOperationsHasBanReason(&reason) {
		t.Fatal("stored ban reason was not detected")
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
