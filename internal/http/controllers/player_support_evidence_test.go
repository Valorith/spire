package controllers

import (
	"errors"
	"net/http"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func toolDryRunDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(mysql.New(mysql.Config{DSN: "qa@tcp(127.0.0.1:1)/qa", SkipInitializeWithVersion: true}),
		&gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatal(err)
	}
	pool, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = pool.Close() })
	return db
}

func toolHTTPCode(err error) int {
	var response *echo.HTTPError
	if errors.As(err, &response) {
		return response.Code
	}
	return 0
}

func TestEventGroupQuery(t *testing.T) {
	db := toolDryRunDB(t)
	sql := func(group string, canReadChat bool) (string, []interface{}) {
		t.Helper()
		query, err := supportEventQuery(db, []uint{22, 23}, 1000, group, canReadChat)
		if err != nil {
			t.Fatal(err)
		}
		statement := query.Find(&[]supportEvent{}).Statement
		return statement.SQL.String(), statement.Vars
	}
	hasChat := func(vars []interface{}) bool {
		for _, value := range vars {
			if value == "Say" || value == "Player Speech" {
				return true
			}
		}
		return false
	}

	// Without the grant, every view leaves chat out.
	for _, group := range []string{"", "items", "tasks", "hack", "unknown"} {
		text, vars := sql(group, false)
		if !strings.Contains(text, "e.event_type_name NOT IN") || !hasChat(vars) {
			t.Errorf("group %q without chat access: %s %v", group, text, vars)
		}
	}
	// With it, "All" has no event filter and chat selects the two events.
	if text, _ := sql("", true); strings.Contains(text, "event_type_name") {
		t.Errorf("All with chat access is filtered: %s", text)
	}
	if text, vars := sql("chat", true); !strings.Contains(text, "e.event_type_name IN") || strings.Contains(text, "NOT IN") || !hasChat(vars) {
		t.Errorf("chat group: %s %v", text, vars)
	}
	if _, vars := sql("tasks", true); hasChat(vars) {
		t.Errorf("tasks group includes chat: %v", vars)
	}
	for group, names := range map[string][]string{
		"tasks": {"Task Accept", "Task Update", "Task Complete"},
		"chat":  {"Say", "Player Speech"},
		"hack":  {"Possible Hack"},
	} {
		if strings.Join(supportEventGroups[group], ",") != strings.Join(names, ",") {
			t.Errorf("group %s = %v, want %v", group, supportEventGroups[group], names)
		}
	}

	// Asking for chat without the grant is refused.
	if _, err := supportEventQuery(db, []uint{22}, 1000, "chat", false); toolHTTPCode(err) != http.StatusForbidden {
		t.Errorf("chat without access = %v, want 403", err)
	}
	// The reported player's events need a reported player.
	_, _, err := supportEventCharacters(supportScope{}, supportCaseView{}, "reported", 7)
	if toolHTTPCode(err) != http.StatusConflict || err.(*echo.HTTPError).Message != "Set a reported player first" {
		t.Errorf("reported without a subject = %v, want 409", err)
	}
}

func TestChatViewIsRecordedWheneverChatIsShown(t *testing.T) {
	say := supportEvent{EventTypeName: "Say"}
	speech := supportEvent{EventTypeName: "Player Speech"}
	loot := supportEvent{EventTypeName: "Looted Item"}
	for _, test := range []struct {
		name   string
		group  string
		events []supportEvent
		want   bool
	}{
		// Any page of the Chat group, even an empty one.
		{"chat group", "chat", nil, true},
		{"chat group, later page", "chat", []supportEvent{say}, true},
		// "All" (or an unknown group) for a GM with the chat grant includes
		// chat events, which must leave the same record.
		{"all with say", "", []supportEvent{loot, say}, true},
		{"all with speech", "", []supportEvent{speech}, true},
		{"unknown group with chat", "everything", []supportEvent{speech}, true},
		{"all without chat", "", []supportEvent{loot}, false},
		{"items", "items", []supportEvent{loot}, false},
	} {
		if got := supportShowsChat(test.group, test.events); got != test.want {
			t.Errorf("%s: %v, want %v", test.name, got, test.want)
		}
	}
}
