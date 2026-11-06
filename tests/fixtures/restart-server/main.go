// This loopback-only QA fixture runs the real restart API, storage and runner.
// Its executor never starts, stops, or messages game processes.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/eqemuserver"
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
	"github.com/EQEmuTools/spire/internal/restartscheduler"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/patrickmn/go-cache"
)

type simulator struct{ store restartscheduler.Store }

func (s simulator) Ready() error { return nil }
func (s simulator) Acquire() (func(), error) {
	return restartscheduler.Lock(s.store.Path + ".power.lock")
}
func (s simulator) Countdown(time.Time, bool) {}
func (s simulator) ClearCountdown(bool)       {}
func (s simulator) Restart() error            { return nil }

func main() {
	port := flag.Int("port", 3021, "loopback port")
	flag.Parse()
	if err := run(*port, os.TempDir()); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(port int, tempDir string) error {
	root, err := os.MkdirTemp(tempDir, "spire-restart-qa-*")
	if err != nil {
		return err
	}
	defer os.RemoveAll(root)
	log := logger.NewAppLogger()
	paths := pathmgmt.NewPathManagement(log)
	paths.SetServerPath(root)
	config := eqemuserverconfig.NewConfig(log, paths)
	launcher := eqemuserver.NewLauncher(log, config, nil, paths, nil, nil, nil)
	store := restartscheduler.Store{Path: filepath.Join(root, "spire-restart-schedules.json")}
	cache := cache.New(time.Minute, time.Minute)
	controller := eqemuserver.NewController(nil, nil, log, config, paths, nil, nil, launcher, cache, auditlog.NewUserEvent(nil, cache))
	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{AllowOrigins: []string{"http://127.0.0.1:8081", "http://localhost:8081"}}))
	for _, r := range controller.Routes() {
		if strings.HasPrefix(r.Route(), "eqemuserver/server/restart-schedules") {
			e.Add(r.Method(), "/api/v1/"+r.Route(), r.Handler())
		}
	}
	e.GET("/api/v1/app/env", func(c echo.Context) error {
		return c.JSON(http.StatusOK, echo.Map{"data": echo.Map{"env": "local", "version": "5.7.3", "os": "linux", "is_spire_initialized": true, "features": echo.Map{}, "settings": []any{echo.Map{"setting": "AUTH_ENABLED", "value": "false"}}}})
	})
	e.GET("/api/v1/eqemuserver/server-stats", func(c echo.Context) error {
		return c.JSON(http.StatusOK, echo.Map{"server_name": "Restart QA", "zone_count": 0, "players_online": 0, "uptime": "", "main_process_stats": []any{}})
	})
	e.GET("/api/v1/eqemuserver/get-lock-status", func(c echo.Context) error { return c.JSON(http.StatusOK, echo.Map{"locked": false}) })
	e.Any("/api/v1/*", func(c echo.Context) error { return c.JSON(http.StatusOK, []any{}) })
	ctx, cancel := context.WithCancel(context.Background())
	runner := restartscheduler.Runner{Store: store, Executor: simulator{store: store}, LogError: func(err error) { log.Error().Err(err).Msg("QA scheduler") }}
	runnerDone := make(chan struct{})
	go func() { defer close(runnerDone); runner.Run(ctx) }()
	defer func() { cancel(); <-runnerDone }()
	metadata, _ := json.Marshal(map[string]string{"url": fmt.Sprintf("http://127.0.0.1:%d", port), "root": root})
	fmt.Println(string(metadata))
	return e.Start(fmt.Sprintf("127.0.0.1:%d", port))
}
