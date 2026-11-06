package eqemuserver

import (
	"fmt"
	"os"
	"strings"

	"github.com/shirou/gopsutil/v3/process"
)

func (l *Launcher) launcherProcesses() ([]ProcessDetails, error) {
	if l.processList != nil {
		return l.processList()
	}
	processes, err := process.Processes()
	if err != nil {
		return nil, fmt.Errorf("cannot inspect launcher processes: %w", err)
	}
	details := make([]ProcessDetails, 0, len(processes))
	for _, p := range processes {
		cmdline, err := p.Cmdline()
		if err != nil || !strings.Contains(cmdline, "eqemu-server:launcher start") {
			continue
		}
		details = append(details, l.getProcessDetails(p))
	}
	return details, nil
}

// An old shared-temp launcher cannot be assigned to an installation without Cwd.
// Reject it before stopping an installation or deciding to start a new launcher.
func rejectUnscopedLaunchers(processes []ProcessDetails) error {
	for _, p := range processes {
		if p.Pid != int32(os.Getpid()) && unscopedLegacyLauncher(p) {
			return fmt.Errorf("cannot identify legacy launcher PID %d; stop that launcher before changing this installation", p.Pid)
		}
	}
	return nil
}

func (l *Launcher) launcherIsRunning() (bool, error) {
	processes, err := l.launcherProcesses()
	if err != nil {
		return false, err
	}
	if err := rejectUnscopedLaunchers(processes); err != nil {
		return false, err
	}
	for _, p := range processes {
		if p.Pid == int32(os.Getpid()) || !strings.Contains(p.Cmdline, "eqemu-server:launcher start") ||
			strings.Contains(p.Cmdline, "go run") || p.BaseProcessName == "air" {
			continue
		}
		if belongsToServer(p, l.pathmgmt.GetEQEmuServerPath()) {
			return true, nil
		}
	}
	return false, nil
}
