package restartscheduler

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"
)

func TestSuspendedCountdownDoesNotRestartLongAfterDeadline(t *testing.T) {
	r, e, now := newRunner(t)
	step(t, r, now.Add(time.Minute))
	step(t, r, now.Add(2*time.Hour))
	state := readState(t, r.Store)
	if e.restarts != 0 || state.Active != nil || len(state.History) != 1 || state.History[0].Status != "skipped" {
		t.Fatalf("suspended countdown ran late: restarts=%d, state=%+v", e.restarts, state)
	}
	if unlock, err := e.Acquire(); err != nil {
		t.Fatal("skipped countdown leaked power lock")
	} else {
		unlock()
	}
}

func TestCompletedRestartIsNotReplayedAfterHistoryWriteFails(t *testing.T) {
	r, e, now := newRunner(t)
	step(t, r, now.Add(time.Minute))
	backup := r.Store.Path + ".checkpoint"
	e.onRestart = func() {
		if err := os.Rename(r.Store.Path, backup); err != nil {
			t.Fatal(err)
		}
		if err := os.Mkdir(r.Store.Path, 0700); err != nil {
			t.Fatal(err)
		}
	}
	if err := r.Step(now.Add(11 * time.Minute)); err == nil {
		t.Fatal("history write failure was ignored")
	}
	if e.restarts != 1 {
		t.Fatal("expected one completed external restart")
	}
	if err := os.Remove(r.Store.Path); err != nil {
		t.Fatal(err)
	}
	if err := os.Rename(backup, r.Store.Path); err != nil {
		t.Fatal(err)
	}
	e.onRestart = nil
	step(t, r, now.Add(11*time.Minute+time.Second))
	state := readState(t, r.Store)
	if e.restarts != 1 || state.Active != nil || state.History[0].Status != "interrupted" {
		t.Fatalf("external restart replayed after failed history checkpoint: %+v", state)
	}
}

func TestOSLockReleasedAfterOwnerProcessDies(t *testing.T) {
	path := filepath.Join(t.TempDir(), "power.lock")
	cmd := exec.Command(os.Args[0], "-test.run=^TestRestartLockHelperProcess$", "-test.timeout=1m")
	cmd.Env = append(os.Environ(), "SPIRE_RESTART_TEST_LOCK="+path)
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	defer func() {
		if cmd.ProcessState == nil {
			_ = cmd.Process.Kill()
			_ = cmd.Wait()
		}
	}()
	deadline := time.Now().Add(5 * time.Second)
	for {
		if _, err := os.Stat(path + ".ready"); err == nil {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("helper did not acquire lock")
		}
		time.Sleep(5 * time.Millisecond)
	}
	if unlock, err := Lock(path); !errors.Is(err, ErrBusy) {
		if unlock != nil {
			unlock()
		}
		t.Fatalf("another process bypassed power lock: %v", err)
	}
	if err := cmd.Process.Kill(); err != nil {
		t.Fatal(err)
	}
	_ = cmd.Wait()
	if unlock, err := Lock(path); err != nil {
		t.Fatalf("dead process left a locked server: %v", err)
	} else {
		unlock()
	}
}

func TestRestartLockHelperProcess(t *testing.T) {
	path := os.Getenv("SPIRE_RESTART_TEST_LOCK")
	if path == "" {
		t.Skip("subprocess helper")
	}
	unlock, err := Lock(path)
	if err != nil {
		t.Fatal(err)
	}
	defer unlock()
	if err = os.WriteFile(path+".ready", []byte("ready"), 0600); err != nil {
		t.Fatal(err)
	}
	time.Sleep(time.Minute)
}

func TestRecoveryKeepsPowerLockForNewCountdown(t *testing.T) {
	for _, status := range []string{"countdown", "restarting"} {
		t.Run(status, func(t *testing.T) {
			r, e, now := newRunner(t)
			scheduleID := readState(t, r.Store).Schedules[0].ID
			if err := r.Store.Update(func(state *State) (bool, error) {
				state.Active = &Run{ID: "old-run", ScheduleID: scheduleID, Name: "Previous restart", RestartAt: now.Add(-time.Hour), StartedAt: now.Add(-2 * time.Hour), Status: status}
				return true, nil
			}); err != nil {
				t.Fatal(err)
			}
			claimed := false
			for i := 0; i < 2; i++ {
				step(t, r, now.Add(time.Minute+time.Duration(i)*time.Second))
				state := readState(t, r.Store)
				if state.Active == nil {
					continue
				}
				claimed = true
				if state.Active.Status != "countdown" {
					t.Fatalf("unexpected active run: %+v", state.Active)
				}
				if unlock, err := e.Acquire(); !errors.Is(err, ErrBusy) {
					if unlock != nil {
						unlock()
					}
					t.Fatalf("recovery released the new countdown's lock: %v", err)
				}
			}
			if !claimed {
				t.Fatal("new countdown was not claimed")
			}
			if r.release != nil {
				r.release()
				r.release = nil
			}
		})
	}
}
