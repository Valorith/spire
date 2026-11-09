package controllers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

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
