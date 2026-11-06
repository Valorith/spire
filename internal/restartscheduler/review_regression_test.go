package restartscheduler

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"
)

func TestScheduleNameUsesUnicodeCharacters(t *testing.T) {
	for _, name := range []string{strings.Repeat("é", 80), strings.Repeat("界", 80), strings.Repeat("🙂", 80)} {
		s := daily()
		s.Name = name
		if err := s.Validate(time.Now()); err != nil {
			t.Fatalf("80-character Unicode name rejected: %v", err)
		}
		s.Name += "界"
		if err := s.Validate(time.Now()); err == nil {
			t.Fatal("81-character name was accepted")
		}
	}
}

func TestChangedTimeZoneRulesDoNotBlockManagementOrExecuteStaleTime(t *testing.T) {
	r, executor, now := newRunner(t)
	state := readState(t, r.Store)
	expected := *state.Schedules[0].NextRun
	revision := state.Schedules[0].Revision
	// A saved UTC instant computed with older zone rules no longer matches the
	// current wall-clock recurrence. Its old instant falls inside the warning.
	stale := expected.Add(-time.Hour)
	state.Schedules[0].NextRun = &stale
	data, err := json.Marshal(state)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(r.Store.Path, data, 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := r.Store.View(); err != nil {
		t.Fatalf("time zone change made schedule management unreadable: %v", err)
	}
	var notices []string
	r.LogInfo = func(message string) { notices = append(notices, message) }
	if err := r.Step(now); err != nil {
		t.Fatal(err)
	}
	updated := readState(t, r.Store)
	if updated.Schedules[0].NextRun == nil || !updated.Schedules[0].NextRun.Equal(expected) || updated.Schedules[0].Revision != revision+1 {
		t.Fatalf("stale occurrence was not reconciled: %+v", updated.Schedules[0])
	}
	if executor.announcements != 0 || executor.restarts != 0 || updated.Active != nil || len(notices) != 1 {
		t.Fatal("reconciliation acted on the stale occurrence or failed to report the change")
	}
	if err := r.Store.Delete(updated.Schedules[0].ID, updated.Schedules[0].Revision); err != nil {
		t.Fatalf("repaired schedule cannot be deleted: %v", err)
	}
}
