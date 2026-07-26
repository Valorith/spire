package controllers

import (
	"net/http/httptest"
	"strings"
	"testing"

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

	invalid := []playerOperationsGuildAccessInput{
		{Reason: "too few"},
		{Reason: valid.Reason, Ranks: []playerOperationsGuildRank{{Rank: 9, Title: "Invalid"}}},
		{Reason: valid.Reason, Ranks: []playerOperationsGuildRank{{Rank: 2, Title: "Officer"}, {Rank: 2, Title: "Duplicate"}}},
		{Reason: valid.Reason, Permissions: []playerOperationsGuildPermission{{ID: 31, Permission: 1}}},
		{Reason: valid.Reason, Permissions: []playerOperationsGuildPermission{{ID: 2, Permission: 1}, {ID: 2, Permission: 2}}},
	}
	for _, input := range invalid {
		if err := validatePlayerOperationsGuildAccess(input); err == nil {
			t.Fatalf("validatePlayerOperationsGuildAccess(%+v) expected an error", input)
		}
	}
}

func TestPlayerOperationsRetirementNames(t *testing.T) {
	if got := playerOperationsRetiredName("Alder", 910001); got != "Alder-deleted-910001" {
		t.Fatalf("playerOperationsRetiredName() = %q", got)
	}
	longName := strings.Repeat("a", 64)
	if got := playerOperationsRetiredName(longName, 910001); len(got) != 64 || !strings.HasSuffix(got, "-deleted-910001") {
		t.Fatalf("playerOperationsRetiredName(long) = %q", got)
	}
	if got := playerOperationsRestoreName("Alder-DeLeTeD-910001"); got != "Alder" {
		t.Fatalf("playerOperationsRestoreName() = %q", got)
	}
}

func TestPlayerOperationsPagination(t *testing.T) {
	e := echo.New()
	request := httptest.NewRequest("GET", "/?page=0&limit=500", nil)
	context := e.NewContext(request, nil)

	page, limit := playerOperationsPagination(context)
	if page != 1 || limit != playerOperationsMaxPageSize {
		t.Fatalf(
			"playerOperationsPagination() = (%d, %d), want (1, %d)",
			page,
			limit,
			playerOperationsMaxPageSize,
		)
	}
}
