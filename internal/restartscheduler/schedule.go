// Package restartscheduler owns durable restart schedules for one physical server.
package restartscheduler

import (
	"errors"
	"sort"
	"strings"
	"time"
	_ "time/tzdata" // Servers and Windows installs need not provide zoneinfo files.

	"github.com/google/uuid"
)

var (
	ErrBusy     = errors.New("a server power action is already in progress")
	ErrNotFound = errors.New("restart schedule not found")
	ErrConflict = errors.New("this schedule changed; reload it before saving")
	ErrLimit    = errors.New("a maximum of 32 restart schedules is allowed")
)

type Schedule struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	Enabled        bool       `json:"enabled"`
	Timezone       string     `json:"timezone"`
	Time           string     `json:"time"`
	Days           []int      `json:"days"` // Sunday = 0. Empty for a one-time restart.
	OnceAt         *time.Time `json:"once_at,omitempty"`
	WarningMinutes int        `json:"warning_minutes"`
	NextRun        *time.Time `json:"next_run,omitempty"`
	Revision       uint64     `json:"revision"`
}

type Run struct {
	ID              string     `json:"id"`
	ScheduleID      string     `json:"schedule_id"`
	Name            string     `json:"name"`
	RestartAt       time.Time  `json:"restart_at"`
	StartedAt       time.Time  `json:"started_at"`
	FinishedAt      *time.Time `json:"finished_at,omitempty"`
	Status          string     `json:"status"`
	Message         string     `json:"message,omitempty"`
	CancelRequested bool       `json:"cancel_requested,omitempty"`
}

type State struct {
	Version   int        `json:"version"`
	Schedules []Schedule `json:"schedules"`
	History   []Run      `json:"history"`
	Active    *Run       `json:"active,omitempty"`
}

func (s *Schedule) Validate(now time.Time) error {
	s.Name = strings.TrimSpace(s.Name)
	if s.Name == "" || len(s.Name) > 80 {
		return errors.New("name must contain 1 to 80 characters")
	}
	if s.Timezone == "" || s.Timezone == "Local" {
		return errors.New("choose an IANA time zone, such as America/New_York")
	}
	if _, err := time.LoadLocation(s.Timezone); err != nil {
		return errors.New("unknown time zone")
	}
	if s.WarningMinutes < 0 || s.WarningMinutes > 60 {
		return errors.New("player warning must be between 0 and 60 minutes")
	}
	if s.OnceAt != nil {
		if s.Enabled && !s.OnceAt.After(now) {
			return errors.New("restart time must be in the future")
		}
		s.Days = nil
		s.Time = ""
		return nil
	}
	if len(s.Time) != 5 {
		return errors.New("time must use HH:MM format")
	}
	if _, err := time.Parse("15:04", s.Time); err != nil {
		return errors.New("choose a valid restart time")
	}
	if len(s.Days) == 0 || len(s.Days) > 7 {
		return errors.New("choose at least one day")
	}
	seen := map[int]bool{}
	for _, d := range s.Days {
		if d < 0 || d > 6 || seen[d] {
			return errors.New("days must be unique values from 0 to 6")
		}
		seen[d] = true
	}
	sort.Ints(s.Days)
	return nil
}

// Next returns one occurrence per local calendar day. Nonexistent wall times
// during spring-forward are skipped; repeated fall-back times run only once.
func (s Schedule) Next(after time.Time) *time.Time {
	if !s.Enabled {
		return nil
	}
	if s.OnceAt != nil {
		if s.OnceAt.After(after) {
			t := s.OnceAt.UTC()
			return &t
		}
		return nil
	}
	loc, err := time.LoadLocation(s.Timezone)
	if err != nil {
		return nil
	}
	clock, err := time.Parse("15:04", s.Time)
	if err != nil {
		return nil
	}
	local := after.In(loc)
	day := time.Date(local.Year(), local.Month(), local.Day(), 12, 0, 0, 0, loc)
	for i := 0; i < 15; i++ {
		d := day.AddDate(0, 0, i)
		selected := false
		for _, weekday := range s.Days {
			selected = selected || int(d.Weekday()) == weekday
		}
		if !selected {
			continue
		}
		candidate := time.Date(d.Year(), d.Month(), d.Day(), clock.Hour(), clock.Minute(), 0, 0, loc)
		matches := func(t time.Time) bool {
			return t.Year() == d.Year() && t.Month() == d.Month() && t.Day() == d.Day() && t.Hour() == clock.Hour() && t.Minute() == clock.Minute()
		}
		if !matches(candidate) {
			continue
		}
		_, offset := candidate.Zone()
		_, priorOffset := candidate.Add(-3 * time.Hour).Zone()
		earlier := candidate.Add(time.Duration(offset-priorOffset) * time.Second)
		if earlier.Before(candidate) && matches(earlier) {
			candidate = earlier
		}
		if candidate.After(after) {
			t := candidate.UTC()
			return &t
		}
	}
	return nil
}

func finish(state *State, status, message string, now time.Time) {
	if state.Active == nil {
		return
	}
	run := *state.Active
	run.Status, run.Message, run.FinishedAt = status, message, &now
	state.History = append([]Run{run}, state.History...)
	if len(state.History) > 100 {
		state.History = state.History[:100]
	}
	state.Active = nil
}

func newID(_ time.Time) string { return uuid.NewString() }
