package controllers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// committedPool lets a dry-run database run Transaction without a server:
// gorm treats a pool that can commit as an open transaction.
type committedPool struct{ gorm.ConnPool }

func (committedPool) Commit() error   { return nil }
func (committedPool) Rollback() error { return nil }

// supportActionTestDB is a dry-run database whose stored case has the given
// status and whose entry inserts fail with insertErr.
func supportActionTestDB(t *testing.T, status string, insertErr error) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(gormMysql.New(gormMysql.Config{
		DSN: "qa@tcp(127.0.0.1:1)/qa", SkipInitializeWithVersion: true,
	}), &gorm.Config{
		DryRun: true, DisableAutomaticPing: true, DisableNestedTransaction: true, Logger: gormLogger.Default.LogMode(gormLogger.Silent),
	})
	if err != nil {
		t.Fatal(err)
	}
	pool, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = pool.Close() })
	db.Statement.ConnPool = committedPool{db.Statement.ConnPool}
	err = db.Callback().Query().After("gorm:query").Register("test:case", func(tx *gorm.DB) {
		if record, ok := tx.Statement.Dest.(*models.PlayerSupportCase); ok {
			*record = models.PlayerSupportCase{ID: 12, ConnectionID: 0, SourceKey: "731-1794116400", Status: status}
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	err = db.Callback().Create().After("gorm:create").Register("test:entry", func(tx *gorm.DB) {
		if _, ok := tx.Statement.Dest.(*models.PlayerSupportEntry); ok && insertErr != nil {
			_ = tx.AddError(insertErr)
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	return db
}

func runSupportActionForTest(t *testing.T, db *gorm.DB, action supportAction) (*httptest.ResponseRecorder, bool) {
	t.Helper()
	recorder := httptest.NewRecorder()
	c := echo.New().NewContext(httptest.NewRequest(http.MethodPut, "/api/v1/player-support/cases/731-1794116400/kick", nil), recorder)
	scope := supportScope{spire: db, eqemu: db}
	view := supportView(models.PlayerSupportCase{SourceKey: "731-1794116400", Status: "open"}, models.Petition{}, 0)
	ran := false
	err := (&PlayerSupportController{}).runSupportAction(c, scope, view, action, func() supportActionResult {
		ran = true
		return supportActionResult{Delivery: "sent", Message: "Done."}
	})
	if err != nil {
		t.Fatal(err)
	}
	return recorder, ran
}

func supportResponseError(t *testing.T, recorder *httptest.ResponseRecorder) string {
	t.Helper()
	var body struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	return body.Error
}

func TestRunSupportActionRefusesResolved(t *testing.T) {
	action := supportAction{
		Kind: "kick", RequestID: strings.Repeat("a", 32), Summary: "Kicked Aranel from the game",
		Reason: "Harassing other players", Event: "PLAYER_SUPPORT_KICK",
	}
	recorder, ran := runSupportActionForTest(t, supportActionTestDB(t, "resolved", nil), action)
	if ran || recorder.Code != http.StatusConflict || supportResponseError(t, recorder) != "Reopen the case before changing the player's data" {
		t.Fatalf("resolved case: ran %v, %d %s", ran, recorder.Code, recorder.Body.String())
	}

	duplicate := &mysql.MySQLError{Number: 1062, Message: "Duplicate entry"}
	recorder, ran = runSupportActionForTest(t, supportActionTestDB(t, "open", duplicate), action)
	if ran || recorder.Code != http.StatusConflict || supportResponseError(t, recorder) != "This action was already recorded. Check the case timeline." {
		t.Fatalf("duplicate request: ran %v, %d %s", ran, recorder.Code, recorder.Body.String())
	}

	short := action
	short.Reason = "short"
	recorder, ran = runSupportActionForTest(t, supportActionTestDB(t, "open", nil), short)
	if ran || recorder.Code != http.StatusBadRequest || supportResponseError(t, recorder) != "Reason must be at least 8 characters" {
		t.Fatalf("short reason: ran %v, %d %s", ran, recorder.Code, recorder.Body.String())
	}

	badID := action
	badID.RequestID = "not-a-request"
	recorder, ran = runSupportActionForTest(t, supportActionTestDB(t, "open", nil), badID)
	if ran || recorder.Code != http.StatusBadRequest || supportResponseError(t, recorder) != "Invalid request ID" {
		t.Fatalf("bad request ID: ran %v, %d %s", ran, recorder.Code, recorder.Body.String())
	}
}

func TestSupportPresenceState(t *testing.T) {
	roster := playersupport.Presence{
		Known:    true,
		Accounts: map[uint]bool{5: true, 6: true, 7: true},
		InZone:   map[uint]playersupport.OnlineCharacter{5: {ID: 50, Name: "Aranel"}, 7: {ID: 71, Name: "Alt"}},
	}
	cases := []struct {
		name      string
		roster    playersupport.Presence
		account   uint
		character uint
		inGame    bool
		want      string
	}{
		{"in zone", roster, 5, 50, true, "in_zone"},
		{"between zones", roster, 6, 60, true, "zoning"},
		{"character select", roster, 6, 60, false, "offline"},
		{"alt in zone", roster, 7, 70, true, "offline"},
		{"logged out", roster, 8, 80, true, "offline"},
		{"no roster, in game", playersupport.Presence{}, 5, 50, true, "unknown"},
		{"no roster, offline", playersupport.Presence{}, 5, 50, false, "offline"},
	}
	for _, test := range cases {
		if got := supportPresenceState(test.roster, test.account, test.character, test.inGame); got != test.want {
			t.Errorf("%s: %q, want %q", test.name, got, test.want)
		}
	}
}

func TestRevokeSummary(t *testing.T) {
	updated := playersupport.Features{Patch: 3, Revoke: true}
	cases := []struct {
		revoked  bool
		features playersupport.Features
		want     string
	}{
		{true, updated, "Revoked OOC, auction and shout for norrathguide"},
		{false, updated, "Restored OOC, auction and shout for norrathguide"},
		{true, playersupport.Features{Patch: 2}, "Revoked chat for norrathguide"},
		{false, playersupport.Features{}, "Restored chat for norrathguide"},
	}
	for _, test := range cases {
		if got := supportRevokeSummary("norrathguide", test.revoked, test.features); got != test.want {
			t.Errorf("revoked %v, %+v: %q, want %q", test.revoked, test.features, got, test.want)
		}
	}
}

func TestRevokeAppliedInGame(t *testing.T) {
	if got := supportRevokeAppliedInGame(true); got != "OOC, auction and shout are blocked now. Tells still work." {
		t.Errorf("revoke: %q", got)
	}
	if got := supportRevokeAppliedInGame(false); got != "OOC, auction and shout are allowed again." {
		t.Errorf("restore: %q", got)
	}
}

func TestRevokeRefusal(t *testing.T) {
	patched := playersupport.Features{Patch: 3, Revoke: true}
	cases := []struct {
		name     string
		state    string
		inGame   bool
		local    bool
		features playersupport.Features
		want     string
	}{
		{"in zone, patched", "in_zone", true, true, patched, ""},
		{"offline", "offline", false, true, playersupport.Features{}, ""},
		{"offline, remote World", "offline", false, false, playersupport.Features{}, ""},
		{"marked in game, remote World", "unknown", true, false, playersupport.Features{},
			"Aranel is marked in game. Revoking chat for a player in game needs the game server this Spire runs beside; wait until they log out."},
		{"in zone without the feature", "in_zone", true, true, playersupport.Features{Patch: 2},
			"Aranel is in game. Revoking chat for a player in game needs the updated Player Support patch; kick them first or wait until they log out."},
		{"World down", "unknown", true, true, patched, "Spire cannot confirm Aranel is offline. Check that the game server is running."},
		{"zoning", "zoning", false, true, patched, "Aranel is zoning. Try again in a moment."},
	}
	for _, test := range cases {
		err := supportRevokeRefusal(test.state, test.inGame, test.local, test.features, "Aranel")
		if test.want == "" {
			if err != nil {
				t.Errorf("%s: %v", test.name, err)
			}
			continue
		}
		if toolHTTPCode(err) != http.StatusConflict || err.(*echo.HTTPError).Message != test.want {
			t.Errorf("%s: %v, want 409 %q", test.name, err, test.want)
		}
	}
}
