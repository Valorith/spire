package controllers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
)

func TestPlayerSupportCaseTransitions(t *testing.T) {
	record := models.PlayerSupportCase{Status: "open"}
	apply := func(action string, user uint, text string) (string, error) {
		return applySupportUpdate(&record, supportUpdate{Action: action, Text: text}, user, "Operator")
	}
	if _, err := apply("claim", 7, ""); err != nil || record.OwnerID != 7 {
		t.Fatalf("claim = %+v, %v", record, err)
	}
	for _, action := range []string{"claim", "release"} {
		if _, err := apply(action, 8, ""); !isSupportConflict(err) || record.OwnerID != 7 {
			t.Fatalf("second GM %s = %+v, %v", action, record, err)
		}
	}
	if _, err := apply("wait", 7, ""); err != nil || record.Status != "waiting" {
		t.Fatalf("wait = %+v, %v", record, err)
	}
	if text, err := apply("resolve", 7, "  Restored the tunic.  "); err != nil || record.Status != "resolved" || text != "Resolved the case\nRestored the tunic." {
		t.Fatalf("resolve = %+v, %q, %v", record, text, err)
	}
	if _, err := apply("wait", 7, ""); !isSupportConflict(err) || record.Status != "resolved" {
		t.Fatalf("wait after resolve = %+v, %v", record, err)
	}
	if note, err := apply("note", 7, "  Followed up in game.  "); err != nil || note != "Followed up in game." {
		t.Fatalf("archived note = %q, %v", note, err)
	}
	if _, err := apply("reopen", 7, ""); err != nil || record.Status != "open" || record.OwnerID != 7 {
		t.Fatalf("reopen = %+v, %v", record, err)
	}
}

func TestPlayerSupportDistinguishesNewPetitionsFromSameCharacter(t *testing.T) {
	first := models.Petition{Dib: 12, Petid: 57, Senttime: 123}
	second := models.Petition{Dib: 13, Petid: 57, Senttime: 123}
	if supportSourceKey(first) == supportSourceKey(second) {
		t.Fatal("two submissions by the same character share a case")
	}
	if supportSourceKey(first) == supportSourceKey(models.Petition{Dib: 12, Petid: 57, Senttime: 124}) {
		t.Fatal("a reused petition row shares the previous case")
	}
}

func TestPlayerSupportRejectsAnonymousHostedRequests(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	context := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/api/v1/player-support/cases", nil), httptest.NewRecorder())
	_, err := (&PlayerSupportController{}).scope(context, true)
	var response *echo.HTTPError
	if !errors.As(err, &response) || response.Code != http.StatusForbidden {
		t.Fatalf("anonymous hosted request returned %v", err)
	}
}

func isSupportConflict(err error) bool {
	var response *echo.HTTPError
	return errors.As(err, &response) && response.Code == http.StatusConflict
}

func TestPlayerSupportMoveInputModes(t *testing.T) {
	base := supportMoveInput{SourceZone: 183, RequestID: "0123456789abcdef0123456789abcdef"}
	point := &supportCoordinates{X: 10, Y: -20, Z: 3.5, Heading: 128}
	cases := []struct {
		name  string
		edit  func(*supportMoveInput)
		valid bool
	}{
		{"safe point", func(in *supportMoveInput) { in.Destination = 202 }, true},
		{"safe point without zone", func(in *supportMoveInput) {}, false},
		{"coordinates", func(in *supportMoveInput) { in.Destination = 202; in.Coordinates = point }, true},
		{"coordinates without zone", func(in *supportMoveInput) { in.Coordinates = point }, false},
		{"coordinates for corpse", func(in *supportMoveInput) { in.Destination = 202; in.CorpseID = 4; in.Coordinates = point }, false},
		{"coordinates out of range", func(in *supportMoveInput) {
			in.Destination = 202
			in.Coordinates = &supportCoordinates{X: 200000}
		}, false},
		{"heading out of range", func(in *supportMoveInput) {
			in.Destination = 202
			in.Coordinates = &supportCoordinates{Heading: 512}
		}, false},
		{"player", func(in *supportMoveInput) { in.TargetCharacter = 9 }, true},
		{"player with zone", func(in *supportMoveInput) { in.TargetCharacter = 9; in.Destination = 202 }, false},
		{"player for corpse", func(in *supportMoveInput) { in.TargetCharacter = 9; in.CorpseID = 4 }, false},
		{"corpse to petitioner", func(in *supportMoveInput) { in.CorpseID = 4; in.ToPlayer = true }, true},
		{"corpse to petitioner with coordinates", func(in *supportMoveInput) {
			in.CorpseID = 4
			in.ToPlayer = true
			in.Coordinates = point
		}, false},
		{"bad request id", func(in *supportMoveInput) { in.Destination = 202; in.RequestID = "x" }, false},
	}
	for _, test := range cases {
		input := base
		test.edit(&input)
		if got := input.valid(); got != test.valid {
			t.Errorf("%s: valid() = %v, want %v", test.name, got, test.valid)
		}
	}
}

func TestPlayerSupportQueueSummary(t *testing.T) {
	view := func(urgency int, owner string, ownerID uint, status string) supportCaseView {
		record := models.PlayerSupportCase{Urgency: urgency, Owner: owner, OwnerID: ownerID, Status: status}
		return supportView(record, models.Petition{}, 7)
	}
	got := supportQueueSummary([]supportCaseView{
		view(2, "", 0, "open"),
		view(0, "Guide", 7, "waiting"),
		view(1, "Other", 9, "open"),
		view(0, "", 0, "waiting"),
	}, 7)
	// The two open cases wait on staff; the waiting ones wait on the player.
	want := supportSummary{Active: 4, Urgent: 1, Unassigned: 2, Waiting: 2, Mine: 1, Pending: 2}
	got.NewestAt, got.NewestKey, got.NewestCharacter = 0, "", ""
	if got != want {
		t.Fatalf("summary = %+v, want %+v", got, want)
	}

	// A waiting case the player answered since needs staff again.
	replied := view(0, "", 0, "waiting")
	replied.PlayerReplied = true
	if got := supportQueueSummary([]supportCaseView{view(0, "", 0, "waiting"), replied}, 7); got.Pending != 1 || got.Waiting != 2 {
		t.Fatalf("replied while waiting: %+v", got)
	}
}

func TestPlayerSupportQueueFilters(t *testing.T) {
	view := func(urgency int, owner string, ownerID uint, status string) supportCaseView {
		record := models.PlayerSupportCase{Urgency: urgency, Owner: owner, OwnerID: ownerID, Status: status}
		return supportView(record, models.Petition{}, 7)
	}
	cases := []supportCaseView{view(2, "", 0, "open"), view(3, "Guide", 7, "waiting"), view(1, "Other", 9, "open"), view(0, "", 0, "waiting")}
	escalated := view(0, "", 0, "open")
	escalated.Escalated = true
	cases = append(cases, escalated)
	count := func(filter string) int {
		matched := 0
		for _, record := range cases {
			if supportFilterMatches(filter, record) {
				matched++
			}
		}
		return matched
	}
	summary := supportQueueSummary(cases, 7)
	// Each summary card that filters matches the cases it counts.
	for _, test := range []struct {
		filter string
		want   int
	}{
		{"", summary.Active}, {"open", summary.Active}, {"urgent", summary.Urgent}, {"unassigned", summary.Unassigned},
		{"waiting", summary.Waiting}, {"mine", summary.Mine}, {"attention", summary.Attention},
	} {
		if got := count(test.filter); got != test.want {
			t.Errorf("filter %q matched %d, want %d", test.filter, got, test.want)
		}
	}
	if summary.Urgent != 2 {
		t.Fatalf("urgent = %d, want 2 (urgency 2 and 3)", summary.Urgent)
	}
}

func TestSupportPlayerReplied(t *testing.T) {
	waited := time.Date(2026, 11, 8, 12, 0, 0, 0, time.UTC)
	before, after := waited.Add(-time.Minute), waited.Add(time.Minute)
	cases := []struct {
		name   string
		status string
		times  supportCaseTimes
		want   bool
	}{
		{"open case", "open", supportCaseTimes{LastChatIn: &after}, false},
		{"waiting, no reply", "waiting", supportCaseTimes{LastWait: &waited}, false},
		{"waiting, reply before the wait", "waiting", supportCaseTimes{LastWait: &waited, LastChatIn: &before}, false},
		{"waiting, reply since", "waiting", supportCaseTimes{LastWait: &waited, LastChatIn: &after}, true},
		{"waiting from an import, with a reply", "waiting", supportCaseTimes{LastChatIn: &after}, true},
	}
	for _, test := range cases {
		if got := supportPlayerReplied(test.status, test.times); got != test.want {
			t.Errorf("%s: %v, want %v", test.name, got, test.want)
		}
	}
}

func TestPlayerSupportActorName(t *testing.T) {
	if got := supportActor(models.User{}); got != "Game Master" {
		t.Fatalf("anonymous staff name = %q", got)
	}
	if got := supportActor(models.User{UserName: "Vayle"}); got != "Vayle" {
		t.Fatalf("named staff = %q", got)
	}
}
