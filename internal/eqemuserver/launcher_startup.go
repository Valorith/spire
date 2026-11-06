package eqemuserver

import (
	"errors"

	"github.com/EQEmuTools/spire/internal/restartscheduler"
)

// A child must bootstrap while its parent still owns the scheduled power lock
// for world-health verification. Executable access uses a separate gate shared
// with release extraction instead of reacquiring that parent-owned lock.
func (l *Launcher) lockStartup() (func(), error) {
	store, err := l.RestartScheduleStore()
	if err != nil {
		return nil, err
	}
	return restartscheduler.Lock(store.Path + ".startup.lock")
}

var errLauncherStopped = errors.New("server launcher is stopped")

// Check desired state under the gate, rather than trusting the supervisor's
// cached isRunning value after a stop or release update changed the config.
func (l *Launcher) runManagedStartup(start func() error) error {
	unlock, err := l.lockStartup()
	if err != nil {
		return err
	}
	defer unlock()
	if err := l.requireLauncherRunning(); err != nil {
		return err
	}
	return start()
}

func (l *Launcher) requireLauncherRunning() error {
	cfg, err := l.serverconfig.Get()
	if err != nil {
		return err
	}
	if !cfg.Spire.LauncherStart {
		return errLauncherStopped
	}
	return nil
}

func (l *Launcher) startServerProcess(name string, args ...string) error {
	return l.runManagedStartup(func() error { return l.startServerProcessUnlocked(name, args...) })
}

func (l *Launcher) startServerProcessSync(name string, args ...string) error {
	return l.runManagedStartup(func() error { return l.startServerProcessSyncUnlocked(name, args...) })
}

func (l *Launcher) ensureLauncherRunning() error {
	unlock, err := l.lockPowerAction()
	if err != nil {
		return err
	}
	defer unlock()
	cfg, err := l.serverconfig.Get()
	if err != nil {
		return err
	}
	if !cfg.Spire.LauncherStart {
		return nil
	}
	running, err := l.launcherIsRunning()
	if err != nil || running {
		return err
	}
	return l.startLauncherUnlocked()
}
