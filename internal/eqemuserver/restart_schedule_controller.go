package eqemuserver

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/restartscheduler"
	"github.com/labstack/echo/v4"
)

func scheduleError(c echo.Context, err error) error {
	status := http.StatusInternalServerError
	if errors.Is(err, restartscheduler.ErrLimit) {
		status = http.StatusBadRequest
	}
	if errors.Is(err, restartscheduler.ErrNotFound) {
		status = http.StatusNotFound
	}
	if errors.Is(err, restartscheduler.ErrBusy) || errors.Is(err, restartscheduler.ErrConflict) {
		status = http.StatusConflict
	}
	return c.JSON(status, echo.Map{"error": err.Error()})
}

func (a *Controller) getRestartSchedules(c echo.Context) error {
	store, err := a.launcher.RestartScheduleStore()
	if err != nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": err.Error()})
	}
	state, err := store.View()
	if err != nil {
		return scheduleError(c, err)
	}
	return c.JSON(http.StatusOK, state)
}

func (a *Controller) saveRestartSchedule(c echo.Context) error {
	var schedule restartscheduler.Schedule
	if err := c.Bind(&schedule); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid restart schedule"})
	}
	if err := schedule.Validate(time.Now()); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	store, err := a.launcher.RestartScheduleStore()
	if err != nil {
		return scheduleError(c, err)
	}
	saved, err := store.Save(schedule, time.Now())
	if err != nil {
		return scheduleError(c, err)
	}
	a.userevent.LogUserEvent(c, auditlog.EventServerUpdateConfig, "Saved restart schedule: "+saved.Name)
	return c.JSON(http.StatusOK, saved)
}

func (a *Controller) previewRestartSchedule(c echo.Context) error {
	var schedule restartscheduler.Schedule
	if err := c.Bind(&schedule); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid restart schedule"})
	}
	now := time.Now()
	if err := schedule.Validate(now); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	times := []time.Time{}
	schedule.Enabled = true
	for i := 0; i < 3; i++ {
		next := schedule.Next(now)
		if next == nil {
			break
		}
		times = append(times, *next)
		now = *next
	}
	return c.JSON(http.StatusOK, echo.Map{"next_runs": times})
}

func (a *Controller) deleteRestartSchedule(c echo.Context) error {
	revision, err := strconv.ParseUint(c.QueryParam("revision"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "A schedule revision is required"})
	}
	store, err := a.launcher.RestartScheduleStore()
	if err != nil {
		return scheduleError(c, err)
	}
	if err = store.Delete(c.Param("id"), revision); err != nil {
		return scheduleError(c, err)
	}
	a.userevent.LogUserEvent(c, auditlog.EventServerUpdateConfig, "Deleted restart schedule: "+c.Param("id"))
	return c.NoContent(http.StatusNoContent)
}

func (a *Controller) cancelScheduledRestart(c echo.Context) error {
	store, err := a.launcher.RestartScheduleStore()
	if err != nil {
		return scheduleError(c, err)
	}
	if err = store.Cancel(c.Param("id")); err != nil {
		return scheduleError(c, err)
	}
	a.userevent.LogUserEvent(c, auditlog.EventServerCancelRestart, "Cancelled scheduled restart: "+c.Param("id"))
	return c.NoContent(http.StatusNoContent)
}
