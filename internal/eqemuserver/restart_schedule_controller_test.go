package eqemuserver

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
	"github.com/EQEmuTools/spire/internal/restartscheduler"
	"github.com/labstack/echo/v4"
	"github.com/patrickmn/go-cache"
)

func restartTestServer(t *testing.T) (*echo.Echo, *Controller) {
	t.Helper()
	log := logger.NewAppLogger()
	paths := pathmgmt.NewPathManagement(log)
	paths.SetServerPath(t.TempDir())
	c := &Controller{logger: log, launcher: &Launcher{pathmgmt: paths}, userevent: auditlog.NewUserEvent(nil, cache.New(cache.NoExpiration, 0))}
	e := echo.New()
	for _, route := range c.Routes() {
		e.Add(route.Method(), "/api/v1/"+route.Route(), route.Handler())
	}
	return e, c
}

func scheduleRequest(t *testing.T, e *echo.Echo, method, path string, body any, want int) *httptest.ResponseRecorder {
	t.Helper()
	data, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(method, "/api/v1/eqemuserver/server/restart-schedules"+path, bytes.NewReader(data))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	if rec.Code != want {
		t.Fatalf("%s %s status %d, want %d: %s", method, path, rec.Code, want, rec.Body.String())
	}
	return rec
}

func TestRestartScheduleAPI(t *testing.T) {
	e, c := restartTestServer(t)
	input := restartscheduler.Schedule{Name: "Nightly restart", Enabled: true, Timezone: "America/New_York", Time: "04:00", Days: []int{0, 1, 2, 3, 4, 5, 6}, WarningMinutes: 10}
	scheduleRequest(t, e, http.MethodGet, "", nil, http.StatusOK)
	preview := scheduleRequest(t, e, http.MethodPost, "/preview", input, http.StatusOK)
	var times struct {
		NextRuns []time.Time `json:"next_runs"`
	}
	if err := json.Unmarshal(preview.Body.Bytes(), &times); err != nil {
		t.Fatal(err)
	}
	if len(times.NextRuns) != 3 {
		t.Fatal("missing next-run preview")
	}
	created := scheduleRequest(t, e, http.MethodPost, "", input, http.StatusOK)
	var saved restartscheduler.Schedule
	if err := json.Unmarshal(created.Body.Bytes(), &saved); err != nil {
		t.Fatal(err)
	}
	if saved.ID == "" || saved.Revision != 1 || saved.NextRun == nil {
		t.Fatalf("bad saved schedule: %+v", saved)
	}
	store, _ := c.launcher.RestartScheduleStore()
	state, err := store.View()
	if err != nil || len(state.Schedules) != 1 {
		t.Fatal("API did not persist schedule")
	}
	paused := saved
	paused.Enabled = false
	scheduleRequest(t, e, http.MethodPost, "", paused, http.StatusOK)
	scheduleRequest(t, e, http.MethodPost, "", saved, http.StatusConflict)
	scheduleRequest(t, e, http.MethodDelete, "/"+saved.ID+"?revision=1", nil, http.StatusConflict)
	scheduleRequest(t, e, http.MethodDelete, "/"+saved.ID, nil, http.StatusBadRequest)
	scheduleRequest(t, e, http.MethodDelete, "/"+saved.ID+"?revision=2", nil, http.StatusNoContent)
	scheduleRequest(t, e, http.MethodDelete, "/"+saved.ID+"?revision=2", nil, http.StatusNotFound)
	input.Days = nil
	scheduleRequest(t, e, http.MethodPost, "", input, http.StatusBadRequest)
	scheduleRequest(t, e, http.MethodPost, "/preview", input, http.StatusBadRequest)
}

func TestRestartScheduleAPICancellationAndActiveGuards(t *testing.T) {
	e, c := restartTestServer(t)
	store, _ := c.launcher.RestartScheduleStore()
	saved, err := store.Save(restartscheduler.Schedule{Name: "Weekly", Enabled: true, Timezone: "UTC", Time: "04:00", Days: []int{0}}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if err = store.Update(func(s *restartscheduler.State) (bool, error) {
		s.Active = &restartscheduler.Run{ID: "run-1", ScheduleID: saved.ID, Name: saved.Name, RestartAt: time.Now().Add(time.Minute), Status: "countdown"}
		return true, nil
	}); err != nil {
		t.Fatal(err)
	}
	scheduleRequest(t, e, http.MethodPost, "", saved, http.StatusConflict)
	scheduleRequest(t, e, http.MethodDelete, "/"+saved.ID+"?revision="+strconv.FormatUint(saved.Revision, 10), nil, http.StatusConflict)
	scheduleRequest(t, e, http.MethodPost, "/runs/not-found/cancel", nil, http.StatusNotFound)
	scheduleRequest(t, e, http.MethodPost, "/runs/run-1/cancel", nil, http.StatusNoContent)
	state, err := store.View()
	if err != nil || state.Active == nil || !state.Active.CancelRequested {
		t.Fatal("cancellation was not durable")
	}
	if err = store.Update(func(s *restartscheduler.State) (bool, error) { s.Active.Status = "restarting"; return true, nil }); err != nil {
		t.Fatal(err)
	}
	scheduleRequest(t, e, http.MethodPost, "/runs/run-1/cancel", nil, http.StatusConflict)
}

func TestRejectedPowerActionDoesNotReportAnAcceptedRequest(t *testing.T) {
	_, controller := restartTestServer(t)
	release, err := controller.launcher.lockPowerAction()
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	claimed := false
	for _, restart := range []bool{false, true} {
		err := controller.launcher.powerAction(restart, 60, func() { claimed = true })
		if !errors.Is(err, restartscheduler.ErrBusy) || claimed {
			t.Fatalf("rejected action was audited as accepted: %v, claimed=%v", err, claimed)
		}
	}
}

func TestReleaseUpdateRejectsBusyPowerBeforeTouchingFiles(t *testing.T) {
	_, controller := restartTestServer(t)
	release, err := controller.launcher.lockPowerAction()
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	// No updater or config reader is supplied: neither may be reached while
	// another process owns the countdown or power-action lock.
	command := &UpdateCommand{launcher: controller.launcher}
	for _, online := range []bool{false, true} {
		if err := command.installRelease("unused", online); !errors.Is(err, restartscheduler.ErrBusy) {
			t.Fatalf("release installation was allowed during a power action: %v", err)
		}
	}
}

func TestManualCountdownCanCancelWithUnreadableScheduleStore(t *testing.T) {
	for _, locked := range []bool{false, true} {
		t.Run(strconv.FormatBool(locked), func(t *testing.T) {
			e, controller := restartTestServer(t)
			store, _ := controller.launcher.RestartScheduleStore()
			if locked {
				release, err := restartscheduler.Lock(store.Path + ".lock")
				if err != nil {
					t.Fatal(err)
				}
				defer release()
			} else if err := os.WriteFile(store.Path, []byte("{corrupt"), 0600); err != nil {
				t.Fatal(err)
			}
			controller.launcher.SetStopTimer(60)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/eqemuserver/server/stop-cancel", nil)
			recorder := httptest.NewRecorder()
			e.ServeHTTP(recorder, req)
			if recorder.Code != http.StatusOK || controller.launcher.GetStopTimer() != 0 {
				t.Fatalf("manual cancellation failed: status=%d, timer=%d", recorder.Code, controller.launcher.GetStopTimer())
			}
		})
	}
}

func TestScheduledCountdownCancellationDoesNotClaimSuccessWhenStoreLocked(t *testing.T) {
	e, controller := restartTestServer(t)
	store, _ := controller.launcher.RestartScheduleStore()
	saved, err := store.Save(restartscheduler.Schedule{Name: "Scheduled", Enabled: true, Timezone: "UTC", Time: "04:00", Days: []int{0}}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Update(func(s *restartscheduler.State) (bool, error) {
		s.Active = &restartscheduler.Run{ID: "scheduled-run", ScheduleID: saved.ID, Name: saved.Name, RestartAt: time.Now().Add(time.Minute), Status: "countdown"}
		return true, nil
	}); err != nil {
		t.Fatal(err)
	}
	release, err := restartscheduler.Lock(store.Path + ".lock")
	if err != nil {
		t.Fatal(err)
	}
	request := func() *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		e.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/eqemuserver/server/stop-cancel", nil))
		return recorder
	}
	recorder := request()
	release()
	if recorder.Code != http.StatusConflict {
		t.Fatalf("unconfirmed scheduled cancellation reported status %d: %s", recorder.Code, recorder.Body.String())
	}
	state, err := store.View()
	if err != nil || state.Active == nil || state.Active.CancelRequested {
		t.Fatalf("failed cancellation changed the countdown: %+v, %v", state.Active, err)
	}
	if recorder = request(); recorder.Code != http.StatusOK {
		t.Fatalf("retry failed after lock release: %d: %s", recorder.Code, recorder.Body.String())
	}
	state, err = store.View()
	if err != nil || state.Active == nil || !state.Active.CancelRequested {
		t.Fatalf("successful retry was not persisted: %+v, %v", state.Active, err)
	}
}
