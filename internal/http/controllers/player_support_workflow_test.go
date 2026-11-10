package controllers

import (
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
)

func TestApplySupportUpdateWorkflow(t *testing.T) {
	apply := func(record *models.PlayerSupportCase, input supportUpdate, user uint) (string, error) {
		return applySupportUpdate(record, input, user, map[uint]string{7: "Guide", 8: "Pat"}[user])
	}
	record := models.PlayerSupportCase{Status: "open"}
	if text, err := apply(&record, supportUpdate{Action: "take"}, 7); err != nil || text != "Took the case" || record.OwnerID != 7 || record.Owner != "Guide" {
		t.Fatalf("take unowned = %+v, %q, %v", record, text, err)
	}
	if _, err := apply(&record, supportUpdate{Action: "take"}, 7); !isSupportConflict(err) {
		t.Fatalf("take own case = %v", err)
	}
	if text, err := apply(&record, supportUpdate{Action: "take"}, 8); err != nil || text != "Took over the case from Guide" || record.OwnerID != 8 {
		t.Fatalf("take over = %+v, %q, %v", record, text, err)
	}
	if _, err := apply(&record, supportUpdate{Action: "release"}, 7); !isSupportConflict(err) || record.OwnerID != 8 {
		t.Fatalf("release by a former owner = %+v, %v", record, err)
	}

	if _, err := apply(&record, supportUpdate{Action: "assign", AssigneeID: 9}, 7); !isSupportConflict(err) {
		t.Fatalf("assign to non-staff = %v", err)
	}
	if _, err := apply(&record, supportUpdate{Action: "assign", AssigneeID: 8, assigneeName: "Pat"}, 7); !isSupportConflict(err) {
		t.Fatalf("assign to the current owner = %v", err)
	}
	if text, err := apply(&record, supportUpdate{Action: "assign", AssigneeID: 7, assigneeName: "Guide"}, 8); err != nil || text != "Assigned the case to Guide" || record.OwnerID != 7 {
		t.Fatalf("assign = %+v, %q, %v", record, text, err)
	}
	if text, err := apply(&record, supportUpdate{Action: "assign"}, 8); err != nil || text != "Unassigned the case" || record.Owner != "" {
		t.Fatalf("unassign = %+v, %q, %v", record, text, err)
	}

	if _, err := apply(&record, supportUpdate{Action: "escalate", Text: "  "}, 7); !isSupportStatus(err, http.StatusBadRequest) {
		t.Fatalf("escalate without a reason = %v", err)
	}
	if _, err := apply(&record, supportUpdate{Action: "escalate", Text: strings.Repeat("x", 501)}, 7); !isSupportStatus(err, http.StatusBadRequest) {
		t.Fatalf("escalate with a long reason = %v", err)
	}
	if _, err := apply(&record, supportUpdate{Action: "deescalate"}, 7); !isSupportConflict(err) {
		t.Fatalf("deescalate when not escalated = %v", err)
	}
	if text, err := apply(&record, supportUpdate{Action: "escalate", Text: " Possible duplication exploit "}, 7); err != nil || !record.Escalated || text != "Escalated the case\nPossible duplication exploit" {
		t.Fatalf("escalate = %+v, %q, %v", record, text, err)
	}
	if _, err := apply(&record, supportUpdate{Action: "escalate", Text: "Again"}, 7); !isSupportConflict(err) {
		t.Fatalf("escalate twice = %v", err)
	}
	if text, err := apply(&record, supportUpdate{Action: "deescalate"}, 7); err != nil || record.Escalated || text != "Cleared the escalation" {
		t.Fatalf("deescalate = %+v, %q, %v", record, text, err)
	}

	if _, err := apply(&record, supportUpdate{Action: "categorize", Category: "pets"}, 7); !isSupportStatus(err, http.StatusBadRequest) {
		t.Fatalf("unknown category = %v", err)
	}
	if text, err := apply(&record, supportUpdate{Action: "categorize", Category: "corpse"}, 7); err != nil || record.Category != "corpse" || text != "Category: Corpse or death" {
		t.Fatalf("categorize = %+v, %q, %v", record, text, err)
	}
	if _, err := apply(&record, supportUpdate{Action: "categorize", Category: "corpse"}, 7); !isSupportConflict(err) {
		t.Fatalf("same category = %v", err)
	}
	if text, err := apply(&record, supportUpdate{Action: "categorize"}, 7); err != nil || record.Category != "" || text != "Cleared the category" {
		t.Fatalf("clear category = %+v, %q, %v", record, text, err)
	}

	if text, err := apply(&record, supportUpdate{Action: "subject", subjectID: 41, subjectName: "Badguy"}, 7); err != nil || record.SubjectCharacterID != 41 || text != "Reported player: Badguy" {
		t.Fatalf("subject = %+v, %q, %v", record, text, err)
	}
	if text, err := apply(&record, supportUpdate{Action: "subject"}, 7); err != nil || record.SubjectCharacterID != 0 || record.SubjectCharacter != "" || text != "Cleared the reported player" {
		t.Fatalf("clear subject = %+v, %q, %v", record, text, err)
	}
	if _, err := apply(&record, supportUpdate{Action: "subject"}, 7); !isSupportConflict(err) {
		t.Fatalf("clear a missing subject = %v", err)
	}

	record.Escalated = true
	if _, err := apply(&record, supportUpdate{Action: "resolve"}, 7); err != nil || record.Status != "resolved" || record.Escalated {
		t.Fatalf("resolve = %+v, %v", record, err)
	}
	for _, action := range []string{"take", "assign", "escalate", "categorize", "subject"} {
		if _, err := apply(&record, supportUpdate{Action: action, Text: "reason", Category: "items"}, 7); !isSupportConflict(err) {
			t.Fatalf("%s on a resolved case = %v", action, err)
		}
	}
}

func isSupportStatus(err error, code int) bool {
	response, ok := err.(*echo.HTTPError)
	return ok && response.Code == code
}

func TestSupportSuggestCategory(t *testing.T) {
	cases := []struct{ text, want string }{
		{"My corpse is stuck under the world", "stuck"},
		{"I died and lost my bag at the bank", "items"},
		{"I died and lost my sword", "corpse"},
		{"Someone keeps harassing me with spam", "conduct"},
		{"The game crashed and my bag is gone", "items"},
		{"I FORGOT MY PASSWORD", "account"},
		{"The Veeshan's Peak lockout did not reset", "quest"},
		{"Hello", ""},
		{"", ""},

		// Keywords match whole words, not letters inside other words.
		{"a kick request, someone is training mobs on me", "conduct"},
		{"thanks for the help", ""},
		{"both of my characters", ""},
		{"the urban bandit camp", ""},
		{"my keyboard stopped working in game", ""},
		{"my bodyguard pet wandered off", ""},
		{"the soldier attacked me", ""},
		{"the bugbear camp", ""},
		{"rezoning fixed it", ""},
		{"I put it in the bank", "items"},

		// Stems match their plurals and inflections.
		{"I lost my items", "items"},
		{"I can't find my corpses", "corpse"},
		{"I finished both quests but got no credit", "quest"},
		{"I was banned for no reason", "account"},
		{"someone is hacking", "conduct"},
		{"he is exploiting the boss", "conduct"},
		{"spamming the channel", "conduct"},
		{"harassment from a player", "conduct"},
		{"need a resurrection please", "corpse"},
		{"kill stealing my mobs", "conduct"},
		{"he ks my mobs", "conduct"},
		{"a group is botting", "conduct"},
		{"big exp loss", "corpse"},
		{"I can't log in", "account"},
		{"I need a name change", "account"},
		{"my key was taken", "quest"},
		{"the zone is bugged", "bug"},
		{"fell through the floor", "stuck"},
		{"I can\u2019t move", "stuck"},
	}
	for _, test := range cases {
		if got := supportSuggestCategory(test.text); got != test.want {
			t.Errorf("supportSuggestCategory(%q) = %q, want %q", test.text, got, test.want)
		}
	}
	for _, category := range supportCategoryKeywords {
		if _, known := supportCategoryLabel(category.ID); !known {
			t.Errorf("suggested category %q has no label", category.ID)
		}
	}
}

func TestSupportAgeState(t *testing.T) {
	now := time.Date(2026, time.November, 9, 12, 0, 0, 0, time.UTC)
	filed := func(age time.Duration) int64 { return now.Add(-age).Unix() }
	ages := []struct {
		age  time.Duration
		want string
	}{
		{29 * time.Minute, "fresh"},
		{31 * time.Minute, "aging"},
		{2 * time.Hour, "aging"},
		{2*time.Hour + time.Second, "overdue"},
	}
	for _, test := range ages {
		if got := supportAgeState("open", filed(test.age), supportCaseTimes{}, now); got != test.want {
			t.Errorf("open case at %v = %q, want %q", test.age, got, test.want)
		}
	}
	if got := supportAgeState("open", filed(3*time.Hour), supportCaseTimes{Responded: true}, now); got != "fresh" {
		t.Errorf("responded case = %q", got)
	}
	if got := supportAgeState("waiting", filed(3*time.Hour), supportCaseTimes{}, now); got != "fresh" {
		t.Errorf("waiting case = %q", got)
	}
	if got := supportAgeState("resolved", filed(3*time.Hour), supportCaseTimes{}, now); got != "fresh" {
		t.Errorf("resolved case = %q", got)
	}

	at := func(age time.Duration) *time.Time { value := now.Add(-age); return &value }
	follow := []struct {
		name   string
		status string
		times  supportCaseTimes
		want   bool
	}{
		{"47 hours", "waiting", supportCaseTimes{LastWait: at(47 * time.Hour)}, false},
		{"49 hours", "waiting", supportCaseTimes{LastWait: at(49 * time.Hour)}, true},
		{"reply after waiting", "waiting", supportCaseTimes{LastWait: at(49 * time.Hour), LastChatIn: at(20 * time.Hour)}, false},
		{"reply before waiting", "waiting", supportCaseTimes{LastWait: at(49 * time.Hour), LastChatIn: at(50 * time.Hour)}, true},
		{"open case", "open", supportCaseTimes{LastWait: at(49 * time.Hour)}, false},
		{"no wait entry", "waiting", supportCaseTimes{}, false},
	}
	for _, test := range follow {
		if got := supportFollowUp(test.status, test.times, now); got != test.want {
			t.Errorf("%s: supportFollowUp() = %v, want %v", test.name, got, test.want)
		}
	}
}

func TestSupportPresence(t *testing.T) {
	var presence supportPresence
	start := time.Date(2026, time.November, 9, 12, 0, 0, 0, time.UTC)
	key := supportPresenceKey(3, "731-1794116400")
	if viewers := presence.update(key, 7, "Guide", "viewing", start); len(viewers) != 0 {
		t.Fatalf("first viewer sees %+v", viewers)
	}
	viewers := presence.update(key, 8, "Pat", "composing", start.Add(10*time.Second))
	if len(viewers) != 1 || viewers[0] != (supportViewer{Name: "Guide"}) {
		t.Fatalf("second viewer sees %+v", viewers)
	}
	viewers = presence.viewers(key, 7, start.Add(20*time.Second))
	if len(viewers) != 1 || viewers[0] != (supportViewer{Name: "Pat", Composing: true}) {
		t.Fatalf("first viewer sees %+v", viewers)
	}
	if viewers := presence.viewers(supportPresenceKey(4, "731-1794116400"), 7, start); len(viewers) != 0 {
		t.Fatalf("another connection sees %+v", viewers)
	}
	// Guide was last seen 45 seconds ago.
	if viewers := presence.viewers(key, 8, start.Add(45*time.Second)); len(viewers) != 0 {
		t.Fatalf("expired viewer still listed: %+v", viewers)
	}
	presence.update(key, 7, "Guide", "viewing", start.Add(46*time.Second))
	if viewers := presence.update(key, 8, "Pat", "left", start.Add(47*time.Second)); len(viewers) != 1 || viewers[0].Name != "Guide" {
		t.Fatalf("leaving viewer sees %+v", viewers)
	}
	if viewers := presence.viewers(key, 7, start.Add(48*time.Second)); len(viewers) != 0 {
		t.Fatalf("a viewer who left is still listed: %+v", viewers)
	}
}

func TestSupportBatchInput(t *testing.T) {
	batch := func(action string, keys ...string) supportBatchInput {
		input := supportBatchInput{Action: action}
		for _, key := range keys {
			input.Cases = append(input.Cases, struct {
				Key      string `json:"key"`
				Revision uint   `json:"revision"`
			}{Key: key})
		}
		return input
	}
	many := make([]string, 51)
	for i := range many {
		many[i] = strings.Repeat("1", i+1) + "-1"
	}
	cases := []struct {
		name  string
		input supportBatchInput
		want  string
	}{
		{"no cases", batch("claim"), "Choose between 1 and 50 cases"},
		{"51 cases", batch("claim", many...), "Choose between 1 and 50 cases"},
		{"duplicate keys", batch("wait", "1-1", "2-2", "1-1"), "Choose each case only once"},
		{"unknown action", batch("delete", "1-1"), "Unknown batch action"},
		{"release is not a batch action", batch("release", "1-1"), "Unknown batch action"},
		{"50 cases", batch("resolve", many[:50]...), ""},
	}
	for _, test := range cases {
		err := validateSupportBatch(test.input)
		if test.want == "" {
			if err != nil {
				t.Errorf("%s: %v", test.name, err)
			}
			continue
		}
		response, ok := err.(*echo.HTTPError)
		if !ok || response.Code != http.StatusBadRequest || response.Message != test.want {
			t.Errorf("%s: %v, want 400 %q", test.name, err, test.want)
		}
	}
}

func TestPetitionCloseResult(t *testing.T) {
	cases := []struct {
		status       string
		currentPatch bool
		result       string
		delivery     string
		message      string
	}{
		{"closed", false, "closed", "sent", "Removed from the in-game queue. The player can file a new petition."},
		{"deleted", true, "deleted", "sent", "Removed from the database. Zones that loaded it keep it until the next petition is filed or withdrawn; #petition already sees the change."},
		{"deleted", false, "deleted", "sent", "Removed from the database. Zones that loaded it keep it until the next petition is filed or withdrawn, so the player may be told one is still open until then."},
		{"checked_out", false, "checked_out", "failed", "Not cleared: a Game Master checked it out in game. Clear it with #delpetition."},
		{"gone", false, "gone", "sent", "It was already cleared in game."},
		{"unavailable", false, "unconfirmed", "unconfirmed", "Spire could not confirm it was cleared. Check #listpetition."},
		{"unconfirmed", true, "unconfirmed", "unconfirmed", "Spire could not confirm it was cleared. Check #listpetition."},
		{"stale", false, "unconfirmed", "unconfirmed", "Spire could not confirm it was cleared. Check #listpetition."},
	}
	for _, test := range cases {
		result, delivery, message := supportPetitionCloseResult(test.status, test.currentPatch)
		if result != test.result || delivery != test.delivery || message != test.message {
			t.Errorf("%s (current patch %v) = %q, %q, %q", test.status, test.currentPatch, result, delivery, message)
		}
	}
}
