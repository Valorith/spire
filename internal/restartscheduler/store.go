package restartscheduler

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/EQEmuTools/spire/internal/atomicfile"
)

type Store struct{ Path string }

// Lock uses an OS lock, released even when Spire crashes. The file remains as
// a stable lock identity; deleting it would let separate processes bypass it.
func Lock(path string) (func(), error) {
	f, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, err
	}
	if err = lockFile(f); err != nil {
		f.Close()
		return nil, err
	}
	return func() { unlockFile(f); f.Close() }, nil
}

func (s Store) read() (State, error) {
	state := State{Version: 1, Schedules: []Schedule{}, History: []Run{}}
	data, err := atomicfile.Read(s.Path)
	if errors.Is(err, os.ErrNotExist) {
		return state, nil
	}
	if err != nil {
		return state, err
	}
	if err = json.Unmarshal(data, &state); err != nil {
		return state, fmt.Errorf("cannot read restart schedules: %w", err)
	}
	if state.Version != 1 {
		return state, errors.New("unsupported restart schedule file version")
	}
	if len(state.Schedules) > 32 || len(state.History) > 100 {
		return state, errors.New("restart schedule file exceeds limits")
	}
	ids := make(map[string]bool, len(state.Schedules))
	for _, schedule := range state.Schedules {
		if schedule.ID == "" || ids[schedule.ID] || schedule.Revision == 0 {
			return state, errors.New("invalid saved restart schedule identity or revision")
		}
		ids[schedule.ID] = true
		if err := schedule.Validate(time.Time{}); err != nil {
			return state, fmt.Errorf("invalid saved restart schedule: %w", err)
		}
		if schedule.Enabled != (schedule.NextRun != nil) {
			return state, errors.New("saved restart schedule has an inconsistent next occurrence")
		}
		if schedule.NextRun != nil {
			if schedule.NextRun.IsZero() {
				return state, errors.New("saved restart schedule has an empty next occurrence")
			}
		}
	}
	if run := state.Active; run != nil {
		if run.ID == "" || !ids[run.ScheduleID] || run.RestartAt.IsZero() || (run.Status != "countdown" && run.Status != "restarting") {
			return state, errors.New("invalid saved restart countdown")
		}
	}
	return state, nil
}

func (s Store) View() (State, error) {
	unlock, err := s.lock()
	if err != nil {
		return State{}, err
	}
	defer unlock()
	return s.read()
}

// Update serializes read/modify/write across both goroutines and processes.
// The callback returns false for read-only ticks, avoiding unnecessary writes.
func (s Store) Update(fn func(*State) (bool, error)) error {
	unlock, err := s.lock()
	if err != nil {
		return err
	}
	defer unlock()
	state, err := s.read()
	if err != nil {
		return err
	}
	changed, err := fn(&state)
	if err != nil || !changed {
		return err
	}
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	return atomicfile.Write(s.Path, data, 0600)
}

// Short contention is normal when an API request and the timer tick coincide.
// Power/leader locks remain nonblocking; data transactions wait briefly.
func (s Store) lock() (func(), error) {
	deadline := time.Now().Add(time.Second)
	for {
		unlock, err := Lock(s.Path + ".lock")
		if !errors.Is(err, ErrBusy) || time.Now().After(deadline) {
			return unlock, err
		}
		time.Sleep(5 * time.Millisecond)
	}
}

func (s Store) Save(input Schedule, now time.Time) (Schedule, error) {
	if err := input.Validate(now); err != nil {
		return Schedule{}, err
	}
	err := s.Update(func(state *State) (bool, error) {
		if input.ID == "" {
			if len(state.Schedules) >= 32 {
				return false, ErrLimit
			}
			input.ID, input.Revision = newID(now), 1
		} else {
			index := -1
			for i, existing := range state.Schedules {
				if existing.ID == input.ID {
					index = i
					break
				}
			}
			if index < 0 {
				return false, ErrNotFound
			}
			if state.Active != nil && state.Active.ScheduleID == input.ID {
				return false, ErrBusy
			}
			if state.Schedules[index].Revision != input.Revision {
				return false, ErrConflict
			}
			input.Revision++
			state.Schedules = append(state.Schedules[:index], state.Schedules[index+1:]...)
		}
		input.NextRun = input.Next(now)
		state.Schedules = append(state.Schedules, input)
		return true, nil
	})
	return input, err
}

func (s Store) Delete(id string, revision uint64) error {
	return s.Update(func(state *State) (bool, error) {
		if state.Active != nil && state.Active.ScheduleID == id {
			return false, ErrBusy
		}
		for i, existing := range state.Schedules {
			if existing.ID != id {
				continue
			}
			if existing.Revision != revision {
				return false, ErrConflict
			}
			state.Schedules = append(state.Schedules[:i], state.Schedules[i+1:]...)
			return true, nil
		}
		return false, ErrNotFound
	})
}

func (s Store) Cancel(id string) error {
	return s.Update(func(state *State) (bool, error) {
		if state.Active == nil || state.Active.ID != id {
			return false, ErrNotFound
		}
		if state.Active.Status != "countdown" {
			return false, ErrBusy
		}
		state.Active.CancelRequested = true
		return true, nil
	})
}
