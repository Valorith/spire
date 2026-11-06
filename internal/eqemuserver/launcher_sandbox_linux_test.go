package eqemuserver

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
)

// This test exercises the actual stop routine and OS signals. Both the explicit
// opt-in and a Docker PID namespace are required so host game servers are safe.
func TestActualStopRespectsInstallationInSandbox(t *testing.T) {
	if os.Getenv("SPIRE_ISOLATED_LAUNCHER_QA") != "1" {
		t.Skip("requires isolated Docker QA")
	}
	if _, err := os.Stat("/.dockerenv"); err != nil {
		t.Fatal("refusing real process actions outside Docker")
	}
	appLog := logger.NewAppLogger()
	makeInstallation := func() (*Launcher, *eqemuserverconfig.Config, string) {
		root := t.TempDir()
		paths := pathmgmt.NewPathManagement(appLog)
		paths.SetServerPath(root)
		cfg := eqemuserverconfig.NewConfig(appLog, paths)
		initial := eqemuserverconfig.EQEmuConfigJson{WebAdmin: &eqemuserverconfig.WebAdminConfig{Version: "1.0.0", Launcher: &eqemuserverconfig.WebAdminLauncherConfig{MinZoneProcesses: 10}}}
		initial.Spire.LauncherStart = true
		if err := cfg.Save(initial); err != nil {
			t.Fatal(err)
		}
		return NewLauncher(appLog, cfg, nil, paths, nil, nil, nil), cfg, root
	}
	startProcess := func(root, binary string, launcher bool) (*exec.Cmd, chan struct{}) {
		if err := os.MkdirAll(filepath.Dir(binary), 0700); err != nil {
			t.Fatal(err)
		}
		exe, err := os.Executable()
		if err != nil {
			t.Fatal(err)
		}
		data, err := os.ReadFile(exe)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(binary, data, 0700); err != nil {
			t.Fatal(err)
		}
		cmd := exec.Command(binary, "-test.run=^TestSandboxWorldHelper$", "-test.timeout=1m")
		if launcher {
			cmd.Args = append(cmd.Args, "eqemu-server:launcher", "start")
		}
		cmd.Dir = root
		cmd.Env = append(os.Environ(), "SPIRE_SANDBOX_WORLD_HELPER=1")
		if err := cmd.Start(); err != nil {
			t.Fatal(err)
		}
		done := make(chan struct{})
		go func() { _ = cmd.Wait(); close(done) }()
		t.Cleanup(func() {
			select {
			case <-done:
			default:
				_ = cmd.Process.Kill()
				<-done
			}
		})
		deadline := time.Now().Add(5 * time.Second)
		for {
			if _, err := os.Stat(filepath.Join(root, filepath.Base(binary)+".ready")); err == nil {
				break
			}
			if time.Now().After(deadline) {
				t.Fatal("sandbox world did not start")
			}
			time.Sleep(5 * time.Millisecond)
		}
		return cmd, done
	}
	launcher, aConfig, aRoot := makeInstallation()
	_, bConfig, bRoot := makeInstallation()
	_, aDone := startProcess(aRoot, filepath.Join(aRoot, "bin", "world"), false)
	other, bDone := startProcess(bRoot, filepath.Join(bRoot, "bin", "world"), false)
	otherLauncher, otherLauncherDone := startProcess(bRoot, filepath.Join(serverLauncherDirectory(bRoot), "spire-launcher"), true)
	if err := launcher.checkIfLauncherIsRunning(); err != nil {
		t.Fatalf("another installation's launcher prevented startup: %v", err)
	}
	_, ownLauncherDone := startProcess(aRoot, filepath.Join(serverLauncherDirectory(aRoot), "spire-launcher"), true)
	if err := launcher.checkIfLauncherIsRunning(); err == nil {
		t.Fatal("own existing launcher was not detected")
	}
	if err := launcher.Stop(); err != nil {
		t.Fatal(err)
	}
	select {
	case <-aDone:
	case <-time.After(2 * time.Second):
		t.Fatal("selected installation was not stopped")
	}
	select {
	case <-ownLauncherDone:
	case <-time.After(2 * time.Second):
		t.Fatal("selected installation's cloned launcher was not stopped")
	}
	select {
	case <-bDone:
		t.Fatal("another installation's world was stopped")
	default:
	}
	if err := other.Process.Signal(syscall.Signal(0)); err != nil {
		t.Fatalf("other installation is not alive: %v", err)
	}
	select {
	case <-otherLauncherDone:
		t.Fatal("another installation's cloned launcher was stopped")
	default:
	}
	if err := otherLauncher.Process.Signal(syscall.Signal(0)); err != nil {
		t.Fatalf("other installation's launcher is not alive: %v", err)
	}
	a, err := aConfig.Get()
	if err != nil {
		t.Fatal(err)
	}
	b, err := bConfig.Get()
	if err != nil {
		t.Fatal(err)
	}
	if a.Spire.LauncherStart || !b.Spire.LauncherStart {
		t.Fatal("wrong installation's launcher state was changed")
	}
}

func TestSandboxWorldHelper(t *testing.T) {
	if os.Getenv("SPIRE_SANDBOX_WORLD_HELPER") != "1" {
		t.Skip("sandbox subprocess helper")
	}
	if err := os.WriteFile(filepath.Base(os.Args[0])+".ready", []byte("ready"), 0600); err != nil {
		t.Fatal(err)
	}
	time.Sleep(time.Minute)
}
