package eqemuserver

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net"
	"path/filepath"
	"strconv"
	"time"

	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/restartscheduler"
	"github.com/EQEmuTools/spire/internal/telnet"
)

func (l *Launcher) RestartScheduleStore() (restartscheduler.Store, error) {
	root := l.pathmgmt.GetEQEmuServerPath()
	if root == "" {
		return restartscheduler.Store{}, errors.New("no local EQEmu server configuration was found")
	}
	return restartscheduler.Store{Path: filepath.Join(root, "spire-restart-schedules.json")}, nil
}

func (l *Launcher) RunRestartScheduler(ctx context.Context) {
	store, err := l.RestartScheduleStore()
	// The HTTP server can be started before a local EQEmu installation exists.
	// Start scheduling as soon as its configuration becomes available.
	for err != nil {
		timer := time.NewTimer(15 * time.Second)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
		}
		store, err = l.RestartScheduleStore()
	}
	world := telnet.NewClient(l.logger)
	executor := &restartExecutor{launcher: l, world: world, ctx: ctx}
	defer func() { executor.world.Close() }()
	runner := restartscheduler.Runner{
		Store: store, Executor: executor,
		LogError: func(err error) { l.logger.Error().Err(err).Msg("Restart scheduler") },
		LogInfo:  func(message string) { l.logger.Info().Msg(message) },
	}
	runner.Run(ctx)
}

type restartExecutor struct {
	launcher *Launcher
	world    restartWorld
	address  string
	ctx      context.Context
}

type restartWorld interface {
	Command(telnet.CommandConfig) (string, error)
	Close()
}

func (e *restartExecutor) Acquire() (func(), error) { return e.launcher.lockPowerAction() }
func (e *restartExecutor) Ready() error {
	cfg, err := e.launcher.serverconfig.Get()
	if err != nil {
		return err
	}
	if cfg.WebAdmin != nil && cfg.WebAdmin.Launcher != nil && cfg.WebAdmin.Launcher.DistributedNodeType == "leaf" {
		return errors.New("restart schedules run on the root server only")
	}
	if !cfg.Spire.LauncherStart {
		return errors.New("server launcher is stopped")
	}
	address, err := restartWorldAddress(cfg)
	if err != nil {
		return err
	}
	if address != e.address {
		e.world.Close()
		e.world = telnet.NewClientWithAddress(e.launcher.logger, address)
		e.address = address
	}
	return nil
}
func (e *restartExecutor) Countdown(at time.Time, announce bool) {
	e.launcher.SetStopTypeRestarting()
	e.emitCountdown(at)
	if announce {
		e.messageWorld(fmt.Sprintf("[SERVER MESSAGE] Scheduled server restart in %d minute(s). Please log out before this time.", max(0, int(math.Ceil(time.Until(at).Minutes())))))
	}
}
func (e *restartExecutor) ClearCountdown(cancelled bool) {
	e.emitCountdown(time.Time{})
	if cancelled {
		e.messageWorld("[SERVER MESSAGE] Scheduled server restart cancelled")
	}
}
func (e *restartExecutor) Restart() error {
	// The runner already holds the power lock and has persisted its claim.
	e.launcher.SetStopTimer(0)
	e.messageWorld("[SERVER MESSAGE] Server is restarting now")
	e.world.Close()
	if err := e.launcher.restartUnlocked(); err != nil {
		return err
	}
	// A spawned launcher is not proof that world came back online. Hold the
	// power lock until the new world responds, or report the failed health check.
	return verifyRestartWorld(e.ctx, e.world, 2*time.Minute, 2*time.Second)
}

func verifyRestartWorld(ctx context.Context, world restartWorld, timeout, interval time.Duration) error {
	verificationContext, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	verificationError := func() error {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return errors.New("launcher started, but world did not respond within two minutes")
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		if verificationContext.Err() != nil {
			return verificationError()
		}
		response, err := world.Command(telnet.CommandConfig{Command: "uptime 0"})
		if verificationContext.Err() != nil {
			return verificationError()
		}
		if err == nil && response != "" {
			return nil
		}
		select {
		case <-verificationContext.Done():
			return verificationError()
		case <-ticker.C:
		}
	}
}

func restartWorldAddress(cfg eqemuserverconfig.EQEmuConfigJson) (string, error) {
	host, port := cfg.Server.World.Telnet.IP, cfg.Server.World.Telnet.Port
	if host == "" || host == "0.0.0.0" {
		host = "127.0.0.1"
	}
	if host == "::" {
		host = "::1"
	}
	if port == "" {
		port = "9000"
	}
	n, err := strconv.Atoi(port)
	if err != nil || n < 1 || n > 65535 {
		return "", errors.New("invalid world telnet port")
	}
	return net.JoinHostPort(host, port), nil
}

func (e *restartExecutor) emitCountdown(at time.Time) {
	e.launcher.websocketMgr.TryBroadcast("stopTimer", fmt.Sprintf(`{"time":%d,"type":"restarting"}`, at.Unix()))
}

func (e *restartExecutor) messageWorld(message string) {
	e.launcher.websocketMgr.TryBroadcast("notification", message)
	e.launcher.logger.Info().Str("message", message).Msg("Scheduled restart announcement")
	for _, command := range []string{"emote world 15 " + message, "wwmarquee 15 " + message} {
		if _, err := e.world.Command(telnet.CommandConfig{Command: command}); err != nil {
			e.launcher.logger.Warn().Err(err).Msg("Could not send scheduled restart announcement to world")
			return
		}
	}
}

func (l *Launcher) lockPowerAction() (func(), error) {
	store, err := l.RestartScheduleStore()
	if err != nil {
		return nil, err
	}
	return restartscheduler.Lock(store.Path + ".power.lock")
}

// PowerAction claims the same OS lock used by scheduled restarts, including
// their warning period. Manual requests cannot replace a running countdown.
func (l *Launcher) PowerAction(restart bool, timer int) error {
	return l.powerAction(restart, timer, nil)
}

func (l *Launcher) powerAction(restart bool, timer int, onClaim func()) error {
	if timer < 0 || timer > 86400 {
		return errors.New("timer must be between 0 and 86400 seconds")
	}
	unlock, err := l.lockPowerAction()
	if err != nil {
		return err
	}
	defer unlock()
	l.SetStopTimer(timer)
	defer l.SetStopTimer(0)
	if onClaim != nil {
		onClaim()
	}
	if restart {
		l.SetStopTypeRestarting()
		return l.restartUnlocked()
	}
	l.SetStopTypeStopping()
	err = l.stopUnlocked()
	if errors.Is(err, errPowerActionCancelled) {
		return nil
	}
	return err
}

var errPowerActionCancelled = errors.New("server power action cancelled")
