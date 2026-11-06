package restartscheduler

import (
	"encoding/json"
	"errors"
	"os"
	"testing"
	"time"
)

func TestMissingActiveStateDoesNotLeaveServerPowerLocked(t *testing.T) {
	for _, deleted := range []bool{false, true} {
		t.Run(map[bool]string{false: "restored snapshot", true: "deleted file"}[deleted], func(t *testing.T) {
			r, e, now := newRunner(t)
			t.Cleanup(func() {
				if r.release != nil {
					r.release()
					r.release = nil
				}
			})
			step(t, r, now.Add(time.Minute))
			if deleted {
				if err := os.Remove(r.Store.Path); err != nil {
					t.Fatal(err)
				}
			} else {
				if err := r.Store.Update(func(s *State) (bool, error) { s.Active = nil; return true, nil }); err != nil {
					t.Fatal(err)
				}
			}
			step(t, r, now.Add(2*time.Minute))
			if e.restarts != 0 {
				t.Fatal("missing state caused an unexpected restart")
			}
			if unlock, err := e.Acquire(); err != nil {
				t.Fatalf("missing countdown left manual power actions blocked: %v", err)
			} else {
				unlock()
			}
			if e.clears == 0 {
				t.Fatal("lost countdown was not cleared from the UI")
			}
		})
	}
}

func TestWellFormedCorruptStateCannotTriggerRestart(t *testing.T) {
	for _, kind := range []string{"unknown phase", "missing deadline", "missing schedule", "missing next occurrence"} {
		t.Run(kind, func(t *testing.T) {
			r, e, now := newRunner(t)
			state := readState(t, r.Store)
			t.Cleanup(func() {
				if r.release != nil {
					r.release()
					r.release = nil
				}
			})
			due := now.Add(11 * time.Minute)
			state.Active = &Run{ID: "saved-run", ScheduleID: state.Schedules[0].ID, Name: "Saved restart", RestartAt: due, StartedAt: now, Status: "countdown"}
			switch kind {
			case "unknown phase":
				state.Active.Status = "unexpected"
			case "missing deadline":
				state.Active.RestartAt = time.Time{}
			case "missing schedule":
				state.Active.ScheduleID = "not-a-schedule"
			case "missing next occurrence":
				state.Active = nil
				state.Schedules[0].NextRun = nil
			}
			data, err := json.Marshal(state)
			if err != nil {
				t.Fatal(err)
			}
			if err = os.WriteFile(r.Store.Path, data, 0600); err != nil {
				t.Fatal(err)
			}
			if err = r.Step(now.Add(time.Minute)); err == nil {
				t.Errorf("invalid %s was accepted", kind)
			}
			if e.restarts != 0 || e.announcements != 0 {
				t.Fatal("invalid state caused a server side effect")
			}
		})
	}
}

func TestScheduleLimitStillAllowsUpdatesAndDeletion(t *testing.T) {
	store := testStore(t)
	now := instant("2026-11-05T00:00:00Z")
	var first Schedule
	for i := 0; i < 32; i++ {
		saved, err := store.Save(daily(), now)
		if err != nil {
			t.Fatal(err)
		}
		if i == 0 {
			first = saved
		}
	}
	if _, err := store.Save(daily(), now); !errors.Is(err, ErrLimit) {
		t.Fatalf("33rd schedule was accepted: %v", err)
	}
	first.Enabled = false
	updated, err := store.Save(first, now)
	if err != nil {
		t.Fatalf("editing at capacity was blocked: %v", err)
	}
	if err = store.Delete(updated.ID, updated.Revision); err != nil {
		t.Fatal(err)
	}
	if _, err = store.Save(daily(), now); err != nil {
		t.Fatalf("deleted capacity was not reusable: %v", err)
	}
	if len(readState(t, store).Schedules) != 32 {
		t.Fatal("schedule limit was not preserved")
	}
}
