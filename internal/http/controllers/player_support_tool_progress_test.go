package controllers

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func TestTaskActionRules(t *testing.T) {
	step := &supportActivityContent{Taskid: 140, Activityid: 1, Goalcount: 5}
	active := supportTaskTarget{Active: true, Title: "The Lost Tunic", Activity: step}
	type rule struct {
		name   string
		input  supportTaskInput
		target supportTaskTarget
		state  string
		patch  bool
		path   string
		code   int
		text   string
	}
	update := func(done, count int) supportTaskInput {
		return supportTaskInput{Action: "update_activity", TaskID: 140, ActivityID: 1, Count: count, ExpectedDone: done}
	}
	for _, test := range []rule{
		{"offline progress short of the goal", update(2, 2), active, "offline", false, "database", 0, ""},
		{"offline progress reaching the goal", update(2, 3), active, "offline", false, "", http.StatusConflict,
			"Completing a step offline would skip its reward. Do it while Aranel is in game."},
		{"in game progress reaching the goal", update(2, 3), active, "in_zone", true, "game", 0, ""},
		{"in game without the patch", update(2, 1), active, "in_zone", false, "", http.StatusConflict,
			"Aranel is in game. Changing tasks in game needs the updated Player Support patch; ask them to log out first."},
		{"zoning", update(0, 1), active, "zoning", true, "", http.StatusConflict, "Aranel is zoning. Try again in a moment."},
		{"unknown", update(0, 1), active, "unknown", true, "", http.StatusConflict,
			"Spire cannot confirm Aranel is offline. Check that the game server is running."},
		{"count above the goal", update(0, 6), active, "in_zone", true, "", http.StatusBadRequest, "Invalid task request"},
		{"zero count", update(0, 0), active, "offline", false, "", http.StatusBadRequest, "Invalid task request"},
		{"shared task", update(0, 1), supportTaskTarget{Active: true, Shared: true, Activity: step}, "offline", false, "", http.StatusConflict,
			"Shared tasks are managed by the shared task system. Use #task in game."},
		{"inactive task", supportTaskInput{Action: "remove_task", TaskID: 140}, supportTaskTarget{}, "offline", false, "", http.StatusNotFound,
			"That task is no longer active"},
		{"unknown step", supportTaskInput{Action: "reset_activity", TaskID: 140, ActivityID: 9}, supportTaskTarget{Active: true}, "offline", false, "",
			http.StatusBadRequest, "Invalid task request"},
		{"reset offline", supportTaskInput{Action: "reset_activity", TaskID: 140, ActivityID: 1, ExpectedDone: 3}, active, "offline", false, "database", 0, ""},
		{"remove in game", supportTaskInput{Action: "remove_task", TaskID: 140}, active, "in_zone", true, "game", 0, ""},
		{"clear completed offline", supportTaskInput{Action: "clear_completed", TaskID: 77}, supportTaskTarget{}, "offline", false, "database", 0, ""},
		{"clear completed in game", supportTaskInput{Action: "clear_completed", TaskID: 77}, supportTaskTarget{}, "in_zone", true, "", http.StatusConflict,
			"Clear completed records while Aranel is offline."},
		{"clear timer in game", supportTaskInput{Action: "clear_timer", TimerID: 3}, supportTaskTarget{}, "in_zone", true, "", http.StatusConflict,
			"Clear timers while Aranel is offline."},
		{"clear timer zoning", supportTaskInput{Action: "clear_timer", TimerID: 3}, supportTaskTarget{}, "zoning", false, "", http.StatusConflict,
			"Aranel is zoning. Try again in a moment."},
		{"clear timer offline", supportTaskInput{Action: "clear_timer", TimerID: 3}, supportTaskTarget{}, "offline", false, "database", 0, ""},
		{"assign is not an action", supportTaskInput{Action: "assign_task", TaskID: 1}, active, "offline", false, "", http.StatusBadRequest, "Unknown task action"},
	} {
		path, err := supportTaskPlan(test.input, test.target, test.state, test.patch, "Aranel")
		if test.code == 0 {
			if err != nil || path != test.path {
				t.Errorf("%s: path %q, err %v; want %q", test.name, path, err, test.path)
			}
			continue
		}
		if toolHTTPCode(err) != test.code || err.(*echo.HTTPError).Message != test.text {
			t.Errorf("%s: err %v, want %d %q", test.name, err, test.code, test.text)
		}
	}

	if got := supportTaskGameResult(playersupport.TaskResult{Status: "updated", DoneCount: 5, TaskCompleted: true}, "update_activity", 5, "Aranel"); got.Delivery != "sent" ||
		got.Message != "The task is complete and its reward was granted." {
		t.Errorf("completed update = %+v", got)
	}
	if got := supportTaskGameResult(playersupport.TaskResult{Status: "updated", DoneCount: 3, TaskActive: true}, "update_activity", 5, "Aranel"); got.Message != "Done (3/5)." {
		t.Errorf("partial update = %+v", got)
	}
	for status, message := range map[string]string{
		"stale":       "The task changed in game. Refresh and try again.",
		"gone":        "The task is no longer active.",
		"inactive":    "That step is not active yet.",
		"offline":     "Aranel left the game. Try again.",
		"shared":      "The game server did not confirm the change.",
		"busy":        "The game server did not confirm the change.",
		"unavailable": "The game server did not confirm the change.",
		"new_status":  "The game server did not confirm the change.",
	} {
		if got := supportTaskGameResult(playersupport.TaskResult{Status: status}, "reset_activity", 5, "Aranel"); got.Delivery != "failed" || got.Message != message {
			t.Errorf("zone status %q = %+v, want failed %q", status, got, message)
		}
	}
	for status, want := range map[string]supportActionResult{
		"removed":     {Delivery: "sent", Message: "Removed. Aranel can enter again."},
		"gone":        {Delivery: "sent", Message: "It had already been removed."},
		"offline":     {Delivery: "failed", Message: "Aranel left the game. Try again."},
		"stale":       {Delivery: "failed", Message: "The game server did not confirm the change."},
		"unavailable": {Delivery: "failed", Message: "The game server did not confirm the change."},
		"unconfirmed": {Delivery: "failed", Message: "The game server did not confirm the change."},
	} {
		if got := supportLockoutResult(status, "Aranel"); got.Delivery != want.Delivery || got.Message != want.Message {
			t.Errorf("lockout status %q = %+v, want %+v", status, got, want)
		}
	}
	if ids := supportRewardItemIDs("2730|56772,5| 0|x|42"); len(ids) != 3 || ids[0] != 2730 || ids[1] != 56772 || ids[2] != 42 {
		t.Errorf("reward IDs = %v", ids)
	}
	if ids := (supportTaskContent{RewardIDList: "2730", RewardMethod: 2}).rewardItemIDs(); len(ids) != 0 {
		t.Errorf("quest reward method items = %v", ids)
	}
	if got := (supportActivityContent{Activityid: 2}).description(); got != "Step 3" {
		t.Errorf("fallback description = %q", got)
	}
}

// supportOfflineTestDB is a dry-run database whose character row reports
// ingame and which records every statement it builds, in order.
func supportOfflineTestDB(t *testing.T, ingame int) (*gorm.DB, *[]string) {
	t.Helper()
	db := supportActionTestDB(t, "open", nil)
	statements := &[]string{}
	record := func(tx *gorm.DB) { *statements = append(*statements, tx.Statement.SQL.String()) }
	if err := db.Callback().Query().After("gorm:query").Register("test:ingame", func(tx *gorm.DB) {
		record(tx)
		if row, ok := tx.Statement.Dest.(*supportIngameRow); ok {
			row.InGame = ingame
		}
	}); err != nil {
		t.Fatal(err)
	}
	if err := db.Callback().Raw().After("gorm:raw").Register("test:raw", record); err != nil {
		t.Fatal(err)
	}
	return db, statements
}

func TestOfflineEditsRecheckIngame(t *testing.T) {
	for _, input := range []supportTaskInput{
		{Action: "reset_activity", TaskID: 140, ActivityID: 1, ExpectedDone: 2},
		{Action: "update_activity", TaskID: 140, ActivityID: 1, Count: 1},
		{Action: "remove_task", TaskID: 140},
		{Action: "clear_completed", TaskID: 140},
		{Action: "clear_timer", TimerID: 3},
	} {
		// A character that entered the game after the check is left alone.
		db, statements := supportOfflineTestDB(t, 1)
		got := supportTaskDatabase(db, 22, false, input, 5, "Aranel")
		if got.Delivery != "failed" || got.Message != "Aranel entered the game. Nothing was changed; refresh and try again." {
			t.Errorf("%s while in game = %+v", input.Action, got)
		}
		if len(*statements) != 1 || !strings.Contains((*statements)[0], "FROM `character_data`") ||
			!strings.Contains((*statements)[0], "FOR UPDATE") {
			t.Errorf("%s while in game ran %q", input.Action, *statements)
		}

		// Offline, the locked check comes before the change.
		db, statements = supportOfflineTestDB(t, 0)
		supportTaskDatabase(db, 22, false, input, 5, "Aranel")
		if len(*statements) < 2 || !strings.Contains((*statements)[0], "FOR UPDATE") {
			t.Errorf("%s offline ran %q", input.Action, *statements)
		}

		// A flag left set by a crash, which the roster already overruled,
		// does not block the edit.
		db, statements = supportOfflineTestDB(t, 1)
		if got := supportTaskDatabase(db, 22, true, input, 5, "Aranel"); got.Message == supportCameOnline("Aranel").Message || len(*statements) < 2 {
			t.Errorf("%s with a stale flag = %+v, ran %q", input.Action, got, *statements)
		}
	}
}

func TestProgressResponseReportsLocalWorld(t *testing.T) {
	for _, local := range []bool{true, false} {
		data, err := json.Marshal(supportProgressResponse("unknown", playersupport.Features{Patch: 3}, local))
		if err != nil {
			t.Fatal(err)
		}
		var body map[string]interface{}
		if err := json.Unmarshal(data, &body); err != nil {
			t.Fatal(err)
		}
		if got, ok := body["local_world"].(bool); !ok || got != local {
			t.Errorf("local %v: local_world = %v in %s", local, body["local_world"], data)
		}
		if body["state"] != "unknown" || body["features"] == nil {
			t.Errorf("local %v: %s", local, data)
		}
	}
}
