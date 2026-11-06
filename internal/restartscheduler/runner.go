package restartscheduler

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"time"
)

type Executor interface {
	Ready() error
	Acquire() (func(), error)
	Countdown(time.Time, bool) // bool = announce to players as well as updating UI
	ClearCountdown(bool)       // bool = announce cancellation
	Restart() error
}

type Runner struct {
	Store            Store
	Executor         Executor
	LogError         func(error)
	LogInfo          func(string)
	release          func()
	recovered        bool
	startedAt        time.Time
	lastAnnouncement int
	lastError        string
	lastErrorAt      time.Time
}

// Run holds a separate leader lock: multiple Spire HTTP processes may edit the
// same store, but only one of them can drive server restarts.
func (r *Runner) Run(ctx context.Context) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		if ctx.Err() != nil {
			return
		}
		unlock, err := Lock(r.Store.Path + ".runner.lock")
		if err == nil {
			func() {
				defer unlock()
				defer func() {
					if r.release != nil {
						r.release()
						r.release = nil
					}
				}()
				for {
					if ctx.Err() != nil {
						return
					}
					if err := r.Step(time.Now()); err != nil {
						r.reportError(err)
					}
					select {
					case <-ctx.Done():
						return
					case <-ticker.C:
					}
				}
			}()
			return
		}
		if !errors.Is(err, ErrBusy) {
			r.reportError(err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// Step checkpoints every transition before its external side effect. A crash
// after "restarting" is never replayed, because repeating a restart is unsafe.
func (r *Runner) Step(now time.Time) error {
	stepStarted := time.Now()
	if r.startedAt.IsZero() {
		r.startedAt = now
	}
	var countdown *Run
	var execute bool
	var clear, cancelled bool
	var recalculated []string
	hadLock := r.release != nil
	err := r.Store.Update(func(state *State) (bool, error) {
		changed := false
		// A deleted file or restored snapshot can remove the countdown while
		// this process still owns its power lock. Clear that local operation
		// before considering any restored schedules on the following tick.
		if state.Active == nil && hadLock {
			clear, cancelled = true, true
			return false, nil
		}
		if state.Active != nil && state.Active.Status == "restarting" {
			finish(state, "interrupted", "Spire stopped during the restart; check server status", now)
			clear = true
			return true, nil
		} else if !r.recovered && state.Active != nil && !state.Active.RestartAt.After(now) {
			finish(state, "skipped", "Spire was offline at the restart time", now)
			clear = true
			return true, nil
		}
		// Consume overlapping schedules while a countdown is active. They must not
		// turn into a second immediate restart after the current one completes.
		if state.Active != nil {
			changed = skipOverlaps(state, now) || changed
		}
		if state.Active != nil {
			if state.Active.CancelRequested {
				finish(state, "cancelled", "Restart cancelled", now)
				clear, cancelled = true, true
				return true, nil
			}
			if now.Sub(state.Active.RestartAt) > 30*time.Second {
				finish(state, "skipped", "Restart deadline was missed while Spire was unavailable", now)
				clear = true
				return true, nil
			}
			if r.release == nil {
				var err error
				r.release, err = r.Executor.Acquire()
				if err != nil {
					finish(state, "skipped", err.Error(), now)
					return true, nil
				}
			}
			if !state.Active.RestartAt.After(now) {
				if err := r.Executor.Ready(); err != nil {
					finish(state, "skipped", err.Error(), now)
					clear = true
					return true, nil
				}
				state.Active.Status = "restarting"
				execute = true
				return true, nil
			}
			copy := *state.Active
			countdown = &copy
			return changed, nil
		}
		// Each due occurrence is consumed even when the server is stopped or busy.
		// Missed occurrences are recorded once, then advanced directly into the future.
		// Zoneinfo updates can move a previously valid UTC occurrence. Reconcile
		// it without executing the stale instant or blocking schedule management.
		for i := range state.Schedules {
			s := &state.Schedules[i]
			if s.NextRun == nil {
				continue
			}
			next := s.Next(s.NextRun.Add(-time.Nanosecond))
			if next == nil || !next.Equal(*s.NextRun) {
				s.NextRun = s.Next(now)
				s.Revision++
				recalculated = append(recalculated, s.Name)
			}
		}
		if len(recalculated) != 0 {
			return true, nil
		}
		sort.SliceStable(state.Schedules, func(i, j int) bool {
			a, b := state.Schedules[i].NextRun, state.Schedules[j].NextRun
			return a != nil && (b == nil || a.Before(*b))
		})
		for i := range state.Schedules {
			s := &state.Schedules[i]
			if !s.Enabled || s.NextRun == nil || s.NextRun.Add(-time.Duration(s.WarningMinutes)*time.Minute).After(now) {
				continue
			}
			due := *s.NextRun
			s.NextRun = s.Next(now.Add(time.Second))
			// Advance from this occurrence when the warning starts before restart time.
			if due.After(now) {
				s.NextRun = s.Next(due)
			}
			if s.OnceAt != nil {
				s.Enabled = false
			}
			s.Revision++
			state.Active = &Run{ID: newID(now), ScheduleID: s.ID, Name: s.Name, RestartAt: due, StartedAt: now, Status: "countdown"}
			changed = true
			if now.Sub(due) > 30*time.Second || !due.After(r.startedAt) {
				finish(state, "skipped", "Spire was offline at the restart time", now)
				continue
			}
			if err := r.Executor.Ready(); err != nil {
				finish(state, "skipped", err.Error(), now)
				continue
			}
			release, err := r.Executor.Acquire()
			if err != nil {
				finish(state, "skipped", err.Error(), now)
				continue
			}
			r.release = release
			r.lastAnnouncement = -1
			copy := *state.Active
			countdown = &copy
			break
		}
		return changed, nil
	})
	if err != nil {
		if !hadLock && r.release != nil {
			r.release()
			r.release = nil
		}
		return err
	}
	r.recovered = true
	if r.LogInfo != nil {
		for _, name := range recalculated {
			r.LogInfo(fmt.Sprintf("Recalculated restart schedule %q using current time zone rules", name))
		}
	}
	if clear {
		r.Executor.ClearCountdown(cancelled)
		if r.release != nil {
			r.release()
			r.release = nil
		}
	}
	if countdown != nil {
		minutes := int(math.Ceil(countdown.RestartAt.Sub(now).Minutes()))
		announce := minutes != r.lastAnnouncement
		r.lastAnnouncement = minutes
		r.Executor.Countdown(countdown.RestartAt, announce)
	}
	if execute {
		r.Executor.ClearCountdown(false)
		restartErr := r.Executor.Restart()
		status, message := "succeeded", "Server restarted"
		if restartErr != nil {
			status, message = "failed", restartErr.Error()
		}
		completedAt := now.Add(time.Since(stepStarted))
		err = r.Store.Update(func(state *State) (bool, error) {
			// Health verification may span other schedules' warning windows.
			// Consume those before releasing the power lock as well.
			skipOverlaps(state, completedAt)
			finish(state, status, message, completedAt)
			return true, nil
		})
		if r.release != nil {
			r.release()
			r.release = nil
		}
		if err != nil {
			return err
		}
		return restartErr
	}
	return nil
}

func skipOverlaps(state *State, now time.Time) bool {
	changed := false
	for i := range state.Schedules {
		s := &state.Schedules[i]
		if !s.Enabled || s.NextRun == nil || s.NextRun.Add(-time.Duration(s.WarningMinutes)*time.Minute).After(now) {
			continue
		}
		due := *s.NextRun
		s.NextRun = s.Next(maxTime(due, now))
		if s.OnceAt != nil {
			s.Enabled = false
		}
		s.Revision++
		run := Run{ID: newID(now), ScheduleID: s.ID, Name: s.Name, RestartAt: due, StartedAt: now, FinishedAt: &now, Status: "skipped", Message: ErrBusy.Error()}
		state.History = append([]Run{run}, state.History...)
		if len(state.History) > 100 {
			state.History = state.History[:100]
		}
		changed = true
	}
	return changed
}

func (r *Runner) reportError(err error) {
	if r.LogError == nil {
		return
	}
	if err.Error() != r.lastError || time.Since(r.lastErrorAt) >= time.Minute {
		r.LogError(err)
		r.lastError, r.lastErrorAt = err.Error(), time.Now()
	}
}

func maxTime(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}
