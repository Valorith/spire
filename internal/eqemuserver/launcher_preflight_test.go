package eqemuserver

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
)

func preflightTestLauncher(t *testing.T, running bool) *Launcher {
	t.Helper()
	_, controller := restartTestServer(t)
	l := controller.launcher
	l.logger = controller.logger
	l.serverconfig = eqemuserverconfig.NewConfig(l.logger, l.pathmgmt)
	cfg := eqemuserverconfig.EQEmuConfigJson{WebAdmin: &eqemuserverconfig.WebAdminConfig{
		Version: "1.0.0", Launcher: &eqemuserverconfig.WebAdminLauncherConfig{IsRunning: true},
	}}
	cfg.Spire.LauncherStart = running
	if err := l.serverconfig.Save(cfg); err != nil {
		t.Fatal(err)
	}
	return l
}

func TestLegacyLauncherPreflightPreservesState(t *testing.T) {
	for _, tc := range []struct {
		name    string
		running bool
		action  func(*Launcher) error
	}{
		{"stop", true, (*Launcher).stopUnlocked},
		{"spawn", false, (*Launcher).StartLauncherProcess},
		{"direct startup", false, (*Launcher).Start},
		{"watchdog detection", true, func(l *Launcher) error { _, err := l.launcherIsRunning(); return err }},
	} {
		t.Run(tc.name, func(t *testing.T) {
			l := preflightTestLauncher(t, tc.running)
			l.processList = func() ([]ProcessDetails, error) {
				return []ProcessDetails{{Pid: int32(os.Getpid() + 1), Exe: filepath.Join(os.TempDir(), "spire-launcher"), Cmdline: "spire-launcher eqemu-server:launcher start"}}, nil
			}
			if err := tc.action(l); err == nil || !strings.Contains(err.Error(), "cannot identify legacy launcher PID") {
				t.Fatalf("ambiguous launcher did not block %s: %v", tc.name, err)
			}
			cfg, err := l.serverconfig.Get()
			if err != nil || cfg.Spire.LauncherStart != tc.running || !cfg.WebAdmin.Launcher.IsRunning {
				t.Fatalf("rejected %s changed server flags: %+v, %v", tc.name, cfg.Spire, err)
			}
		})
	}
}

func TestLauncherDetectionKeepsInstallationOwnership(t *testing.T) {
	l := preflightTestLauncher(t, true)
	root := l.pathmgmt.GetEQEmuServerPath()
	other := t.TempDir()
	for _, tc := range []struct {
		name  string
		procs []ProcessDetails
		want  bool
	}{
		{"own clone without cwd", []ProcessDetails{{Pid: int32(os.Getpid() + 1), Cmdline: "spire eqemu-server:launcher start", Exe: filepath.Join(serverLauncherDirectory(root), "spire-launcher")}}, true},
		{"identified legacy from another installation", []ProcessDetails{{Pid: int32(os.Getpid() + 1), Cmdline: "spire eqemu-server:launcher start", Cwd: other, Exe: filepath.Join(os.TempDir(), "spire-launcher")}}, false},
		{"ordinary directory containing air", []ProcessDetails{{Pid: int32(os.Getpid() + 1), Cmdline: "/fair/spire eqemu-server:launcher start", Cwd: root, Exe: filepath.Join(root, "spire")}}, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			l.processList = func() ([]ProcessDetails, error) { return tc.procs, nil }
			got, err := l.launcherIsRunning()
			if err != nil || got != tc.want {
				t.Fatalf("running=%v, want=%v, error=%v", got, tc.want, err)
			}
		})
	}
}

func TestLauncherPreflightPropagatesScanErrors(t *testing.T) {
	l := preflightTestLauncher(t, true)
	want := errors.New("process enumeration denied")
	l.processList = func() ([]ProcessDetails, error) { return nil, want }
	for _, action := range []func() error{l.stopUnlocked, l.StartLauncherProcess, l.Start} {
		if err := action(); !errors.Is(err, want) {
			t.Fatalf("process scan failure was ignored: %v", err)
		}
	}
	cfg, err := l.serverconfig.Get()
	if err != nil || !cfg.Spire.LauncherStart || !cfg.WebAdmin.Launcher.IsRunning {
		t.Fatalf("failed process inspection changed server flags: %+v, %v", cfg.Spire, err)
	}
}
