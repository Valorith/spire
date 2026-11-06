package restartscheduler

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

func instant(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic(err)
	}
	return t
}
func daily() Schedule {
	return Schedule{Name: "Daily restart", Enabled: true, Timezone: "America/New_York", Time: "04:00", Days: []int{0, 1, 2, 3, 4, 5, 6}, WarningMinutes: 10}
}
func testStore(t *testing.T) Store {
	t.Helper()
	return Store{Path: filepath.Join(t.TempDir(), "schedules.json")}
}
func readState(t *testing.T, s Store) State {
	t.Helper()
	state, err := s.View()
	if err != nil {
		t.Fatal(err)
	}
	return state
}
func step(t *testing.T, r *Runner, at time.Time) {
	t.Helper()
	if err := r.Step(at); err != nil {
		t.Fatal(err)
	}
}

func TestNextLocalCalendarTime(t *testing.T) {
	for _, tc := range []struct {
		name, zone, clock, after, want string
		days                           []int
	}{
		{"daily", "America/New_York", "04:00", "2026-11-05T08:00:00Z", "2026-11-05T09:00:00Z", []int{0, 1, 2, 3, 4, 5, 6}},
		{"exact occurrence advances", "UTC", "04:00", "2026-11-05T04:00:00Z", "2026-11-06T04:00:00Z", []int{0, 1, 2, 3, 4, 5, 6}},
		{"weekends skipped", "UTC", "04:00", "2026-11-06T05:00:00Z", "2026-11-09T04:00:00Z", []int{1, 2, 3, 4, 5}},
		{"spring missing hour skipped", "America/New_York", "02:30", "2027-03-14T05:00:00Z", "2027-03-15T06:30:00Z", []int{0, 1, 2, 3, 4, 5, 6}},
		{"fall first occurrence", "America/New_York", "01:30", "2026-11-01T04:00:00Z", "2026-11-01T05:30:00Z", []int{0, 1, 2, 3, 4, 5, 6}},
		{"fall no duplicate", "America/New_York", "01:30", "2026-11-01T05:30:00Z", "2026-11-02T06:30:00Z", []int{0, 1, 2, 3, 4, 5, 6}},
		{"half hour DST first occurrence", "Australia/Lord_Howe", "01:45", "2026-04-04T13:00:00Z", "2026-04-04T14:45:00Z", []int{0, 1, 2, 3, 4, 5, 6}},
		{"weekly spring gap", "America/New_York", "02:30", "2027-03-14T05:00:00Z", "2027-03-21T06:30:00Z", []int{0}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := Schedule{Enabled: true, Timezone: tc.zone, Time: tc.clock, Days: tc.days}
			got := s.Next(instant(tc.after))
			if got == nil || !got.Equal(instant(tc.want)) {
				t.Fatalf("Next = %v, want %s", got, tc.want)
			}
		})
	}
}

func TestValidationRejectsInvalidSchedules(t *testing.T) {
	now := instant("2026-11-05T00:00:00Z")
	for _, change := range []func(*Schedule){
		func(s *Schedule) { s.Name = " " }, func(s *Schedule) { s.Time = "4:00" }, func(s *Schedule) { s.Time = "24:00" },
		func(s *Schedule) { s.Timezone = "Not/AZone" }, func(s *Schedule) { s.Timezone = "Local" },
		func(s *Schedule) { s.Days = nil }, func(s *Schedule) { s.Days = []int{1, 1} }, func(s *Schedule) { s.Days = []int{7} },
		func(s *Schedule) { s.WarningMinutes = -1 }, func(s *Schedule) { s.WarningMinutes = 61 },
		func(s *Schedule) { s.OnceAt = &now },
	} {
		s := daily()
		change(&s)
		if err := s.Validate(now); err == nil {
			t.Errorf("accepted invalid schedule: %+v", s)
		}
	}
}

func TestStorePersistsConflictsAndPause(t *testing.T) {
	store := testStore(t)
	now := instant("2026-11-05T00:00:00Z")
	saved, err := store.Save(daily(), now)
	if err != nil {
		t.Fatal(err)
	}
	if saved.NextRun == nil || saved.ID == "" {
		t.Fatal("missing durable identity or occurrence")
	}
	paused := saved
	paused.Enabled = false
	paused, err = store.Save(paused, now)
	if err != nil {
		t.Fatal(err)
	}
	if paused.NextRun != nil {
		t.Fatal("paused schedule has next run")
	}
	if _, err = store.Save(saved, now); !errors.Is(err, ErrConflict) {
		t.Fatalf("stale save: %v", err)
	}
	if err = store.Delete(saved.ID, saved.Revision); !errors.Is(err, ErrConflict) {
		t.Fatalf("stale delete: %v", err)
	}
	if state := readState(t, Store{Path: store.Path}); len(state.Schedules) != 1 || state.Schedules[0].Enabled {
		t.Fatalf("bad reload: %+v", state)
	}
	if err = store.Delete(paused.ID, paused.Revision); err != nil {
		t.Fatal(err)
	}
}

func TestConcurrentStoreTransactions(t *testing.T) {
	store := testStore(t)
	deadline := time.Now().Add(10 * time.Second)
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				_, err := store.Save(daily(), time.Now())
				// Busy is explicit backpressure, not an accepted write. Retry it
				// so slow synced filesystems do not turn this into a speed test.
				if errors.Is(err, ErrBusy) && time.Now().Before(deadline) {
					continue
				}
				if err != nil {
					t.Error(err)
				}
				return
			}
		}()
	}
	wg.Wait()
	state := readState(t, store)
	if len(state.Schedules) != 20 {
		t.Fatalf("persisted %d schedules, want 20", len(state.Schedules))
	}
	ids := map[string]bool{}
	for _, s := range state.Schedules {
		if ids[s.ID] {
			t.Fatal("duplicate identity")
		}
		ids[s.ID] = true
	}
}

type fakeExecutor struct {
	store                           Store
	restarts, announcements, clears int
	readyErr, restartErr            error
	onAcquire                       func()
	onRestart                       func()
}

func (e *fakeExecutor) Ready() error { return e.readyErr }
func (e *fakeExecutor) Acquire() (func(), error) {
	release, err := Lock(e.store.Path + ".power.lock")
	if err == nil && e.onAcquire != nil {
		e.onAcquire()
	}
	return release, err
}
func (e *fakeExecutor) Countdown(_ time.Time, announce bool) {
	if announce {
		e.announcements++
	}
}
func (e *fakeExecutor) ClearCountdown(_ bool) { e.clears++ }
func (e *fakeExecutor) Restart() error {
	e.restarts++
	if e.onRestart != nil {
		e.onRestart()
	}
	return e.restartErr
}
func newRunner(t *testing.T) (*Runner, *fakeExecutor, time.Time) {
	t.Helper()
	store := testStore(t)
	now := instant("2026-11-05T08:49:00Z")
	if _, err := store.Save(daily(), now); err != nil {
		t.Fatal(err)
	}
	e := &fakeExecutor{store: store}
	return &Runner{Store: store, Executor: e}, e, now
}

func TestCountdownDurableClaimAndExactlyOneRestart(t *testing.T) {
	r, e, now := newRunner(t)
	step(t, r, now)
	step(t, r, now.Add(time.Minute))
	state := readState(t, r.Store)
	if state.Active == nil || state.Active.Status != "countdown" {
		t.Fatal("countdown missing")
	}
	if unlock, err := e.Acquire(); err == nil {
		unlock()
		t.Fatal("manual operation bypassed countdown lock")
	}
	if _, err := r.Store.Save(state.Schedules[0], now); !errors.Is(err, ErrBusy) {
		t.Fatalf("edited active schedule: %v", err)
	}
	e.onRestart = func() {
		s := readState(t, r.Store)
		if s.Active == nil || s.Active.Status != "restarting" {
			t.Error("external restart occurred without a durable claim")
		}
	}
	step(t, r, now.Add(11*time.Minute))
	step(t, r, now.Add(12*time.Minute))
	state = readState(t, r.Store)
	if e.restarts != 1 || len(state.History) != 1 || state.History[0].Status != "succeeded" || state.Active != nil {
		t.Fatalf("bad result: restarts %d state %+v", e.restarts, state)
	}
	if state.Schedules[0].NextRun == nil || !state.Schedules[0].NextRun.Equal(instant("2026-11-06T09:00:00Z")) {
		t.Fatal("recurrence drifted")
	}
	if unlock, err := e.Acquire(); err != nil {
		t.Fatal("power lock leaked")
	} else {
		unlock()
	}
}

func TestCancelConsumesOccurrenceWithoutRestarting(t *testing.T) {
	r, e, now := newRunner(t)
	step(t, r, now.Add(time.Minute))
	active := readState(t, r.Store).Active
	if err := r.Store.Cancel(active.ID); err != nil {
		t.Fatal(err)
	}
	step(t, r, now.Add(2*time.Minute))
	step(t, r, now.Add(11*time.Minute))
	state := readState(t, r.Store)
	if e.restarts != 0 || state.History[0].Status != "cancelled" || state.Active != nil {
		t.Fatalf("cancelled restart executed: %+v", state)
	}
}

func TestOverlappingSchedulesAreNotReplayed(t *testing.T) {
	r, e, now := newRunner(t)
	second := daily()
	second.Name = "Another restart"
	if _, err := r.Store.Save(second, now); err != nil {
		t.Fatal(err)
	}
	step(t, r, now.Add(time.Minute))
	step(t, r, now.Add(11*time.Minute))
	step(t, r, now.Add(12*time.Minute))
	state := readState(t, r.Store)
	if e.restarts != 1 || len(state.History) != 2 {
		t.Fatalf("overlapping restarts: %d, %+v", e.restarts, state)
	}
	if state.History[1].Status != "skipped" {
		t.Fatal("overlap was not recorded")
	}
}

func TestRecoveryResumesFutureCountdownAndNeverRepeatsRestart(t *testing.T) {
	r, e, now := newRunner(t)
	step(t, r, now.Add(time.Minute))
	r.release()
	r.release = nil
	recovered := &Runner{Store: r.Store, Executor: e}
	step(t, recovered, now.Add(5*time.Minute))
	if readState(t, r.Store).Active == nil {
		t.Fatal("future countdown was discarded")
	}
	// Simulate the process dying immediately after its durable execution claim.
	if err := r.Store.Update(func(s *State) (bool, error) { s.Active.Status = "restarting"; return true, nil }); err != nil {
		t.Fatal(err)
	}
	recovered.release()
	recovered.release = nil
	last := &Runner{Store: r.Store, Executor: e}
	step(t, last, now.Add(12*time.Minute))
	state := readState(t, r.Store)
	if e.restarts != 0 || state.Active != nil || state.History[0].Status != "interrupted" {
		t.Fatalf("ambiguous restart replayed: %+v", state)
	}
}

func TestOfflineBusyAndFailedRuns(t *testing.T) {
	for _, kind := range []string{"offline", "busy", "missed", "failed", "stopped-during-countdown"} {
		t.Run(kind, func(t *testing.T) {
			r, e, now := newRunner(t)
			switch kind {
			case "offline":
				e.readyErr = errors.New("server stopped")
			case "busy":
				unlock, err := e.Acquire()
				if err != nil {
					t.Fatal(err)
				}
				defer unlock()
			case "missed":
				now = now.Add(2 * time.Hour)
			case "failed":
				e.restartErr = errors.New("startup failed")
			}
			step(t, r, now.Add(time.Minute))
			if kind == "stopped-during-countdown" {
				e.readyErr = errors.New("server stopped")
			}
			if kind == "failed" {
				if err := r.Step(now.Add(11 * time.Minute)); err == nil {
					t.Fatal("restart failure swallowed")
				}
			} else {
				step(t, r, now.Add(11*time.Minute))
			}
			state := readState(t, r.Store)
			want := "skipped"
			if kind == "failed" {
				want = "failed"
			}
			if state.Active != nil || len(state.History) != 1 || state.History[0].Status != want {
				t.Fatalf("bad state %+v", state)
			}
			if kind != "failed" && e.restarts != 0 {
				t.Fatal("unexpected restart")
			}
		})
	}
}

func TestOneTimeRestartDisablesItself(t *testing.T) {
	r, e, now := newRunner(t)
	at := now.Add(11 * time.Minute)
	s := daily()
	s.OnceAt = &at
	state := readState(t, r.Store)
	if err := r.Store.Delete(state.Schedules[0].ID, state.Schedules[0].Revision); err != nil {
		t.Fatal(err)
	}
	if _, err := r.Store.Save(s, now); err != nil {
		t.Fatal(err)
	}
	step(t, r, now.Add(time.Minute))
	step(t, r, at)
	step(t, r, at.Add(24*time.Hour))
	state = readState(t, r.Store)
	if e.restarts != 1 || state.Schedules[0].Enabled || state.Schedules[0].NextRun != nil {
		t.Fatal("one-time restart repeated")
	}
}

func TestCorruptStateFailsClosed(t *testing.T) {
	r, e, now := newRunner(t)
	if err := os.WriteFile(r.Store.Path, []byte("{broken"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := r.Step(now.Add(time.Hour)); err == nil {
		t.Fatal("corruption ignored")
	}
	if e.restarts != 0 {
		t.Fatal("restarted with corrupt state")
	}
	data, _ := os.ReadFile(r.Store.Path)
	if string(data) != "{broken" {
		t.Fatal("corrupt state overwritten")
	}
}

func TestFailedCheckpointPreventsSideEffectsAndReleasesLock(t *testing.T) {
	r, e, now := newRunner(t)
	original, err := os.ReadFile(r.Store.Path)
	if err != nil {
		t.Fatal(err)
	}
	e.onAcquire = func() {
		if err := os.Remove(r.Store.Path); err != nil {
			t.Fatal(err)
		}
		if err := os.Mkdir(r.Store.Path, 0700); err != nil {
			t.Fatal(err)
		}
	}
	if err := r.Step(now.Add(time.Minute)); err == nil {
		t.Fatal("failed checkpoint accepted")
	}
	if e.restarts != 0 || e.announcements != 0 || r.release != nil {
		t.Fatal("side effect before checkpoint")
	}
	if err := os.Remove(r.Store.Path); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(r.Store.Path, original, 0600); err != nil {
		t.Fatal(err)
	}
	e.onAcquire = nil
	step(t, r, now.Add(2*time.Minute))
	step(t, r, now.Add(11*time.Minute))
	if e.restarts != 1 {
		t.Fatal("failed checkpoint prevented later recovery")
	}
}

func TestLeaderLockIsExclusiveAndContextReleasesIt(t *testing.T) {
	r, e, _ := newRunner(t)
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() { r.Run(ctx); close(done) }()
	deadline := time.Now().Add(2 * time.Second)
	for {
		unlock, err := Lock(r.Store.Path + ".runner.lock")
		if errors.Is(err, ErrBusy) {
			break
		}
		if err != nil {
			t.Fatal(err)
		}
		unlock()
		if time.Now().After(deadline) {
			cancel()
			t.Fatal("no leader")
		}
		time.Sleep(time.Millisecond)
	}
	cancel()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("runner did not stop")
	}
	if unlock, err := Lock(r.Store.Path + ".runner.lock"); err != nil {
		t.Fatal("leader lock leaked")
	} else {
		unlock()
	}
	if e.restarts != 0 {
		t.Fatal("unexpected restart")
	}
}

func TestImmediateRestartStillClaimsAndSkipsOverlaps(t *testing.T) {
	r, e, now := newRunner(t)
	state := readState(t, r.Store)
	s := state.Schedules[0]
	s.WarningMinutes = 0
	if _, err := r.Store.Save(s, now); err != nil {
		t.Fatal(err)
	}
	s.ID = ""
	s.Name = "Second immediate restart"
	if _, err := r.Store.Save(s, now); err != nil {
		t.Fatal(err)
	}
	step(t, r, now) // Establish that the scheduler was online before the deadline.
	step(t, r, now.Add(11*time.Minute))
	step(t, r, now.Add(11*time.Minute+time.Second))
	step(t, r, now.Add(11*time.Minute+2*time.Second))
	state = readState(t, r.Store)
	if e.restarts != 1 || len(state.History) != 2 || state.History[1].Status != "skipped" {
		t.Fatalf("duplicate immediate restart: %d %+v", e.restarts, state)
	}
}

func TestOverlapsDuringRestartHealthCheckAreConsumed(t *testing.T) {
	r, e, now := newRunner(t)
	step(t, r, now.Add(time.Minute))
	e.onRestart = func() {
		// A schedule can be added while the launcher is starting. Its occurrence
		// must not run again immediately after health verification completes.
		at := now.Add(11 * time.Minute)
		s := daily()
		s.Name = "During startup"
		s.OnceAt = &at
		s.WarningMinutes = 0
		if _, err := r.Store.Save(s, now); err != nil {
			t.Fatal(err)
		}
	}
	step(t, r, now.Add(11*time.Minute))
	step(t, r, now.Add(12*time.Minute))
	state := readState(t, r.Store)
	if e.restarts != 1 || len(state.History) != 2 || state.History[1].Status != "skipped" {
		t.Fatalf("startup overlap repeated: %+v", state)
	}
}

func TestIdleTicksDoNotWriteState(t *testing.T) {
	r, _, now := newRunner(t)
	before, err := os.Stat(r.Store.Path)
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 10; i++ {
		step(t, r, now.Add(time.Duration(i)*time.Second))
	}
	after, err := os.Stat(r.Store.Path)
	if err != nil {
		t.Fatal(err)
	}
	if !before.ModTime().Equal(after.ModTime()) {
		t.Fatal("idle ticks rewrote state")
	}
}

func BenchmarkIdleTick32Schedules(b *testing.B) {
	store := Store{Path: filepath.Join(b.TempDir(), "schedules.json")}
	now := instant("2026-11-05T08:00:00Z")
	for i := 0; i < 32; i++ {
		if _, err := store.Save(daily(), now); err != nil {
			b.Fatal(err)
		}
	}
	r := Runner{Store: store, Executor: &fakeExecutor{store: store}}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if err := r.Step(now); err != nil {
			b.Fatal(err)
		}
	}
}
