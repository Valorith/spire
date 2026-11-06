package eqemuserver

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/restartscheduler"
	"github.com/EQEmuTools/spire/internal/telnet"
	"github.com/shirou/gopsutil/v3/process"
)

// The copied test executable stands in for shared_memory. It never starts a
// game server, and always exits even if the parent test fails to release it.
func TestMain(m *testing.M) {
	if root := os.Getenv("SPIRE_TEST_BOOTSTRAP_DIR"); root != "" {
		if err := os.WriteFile(filepath.Join(root, "ready"), []byte("ready"), 0600); err != nil {
			os.Exit(2)
		}
		deadline := time.Now().Add(20 * time.Second)
		for time.Now().Before(deadline) {
			if _, err := os.Stat(filepath.Join(root, "release")); err == nil {
				os.Exit(0)
			}
			time.Sleep(10 * time.Millisecond)
		}
		os.Exit(2)
	}
	os.Exit(m.Run())
}

func prepareBootstrapFixture(t *testing.T) (*Launcher, string) {
	t.Helper()
	t.Setenv("APP_MODE", "webserver")
	l := preflightTestLauncher(t, false)
	l.processScan = func() ([]*process.Process, error) { return nil, nil }
	cfg, err := l.serverconfig.Get()
	if err != nil {
		t.Fatal(err)
	}
	cfg.WebAdmin.Launcher.RunSharedMemory = true
	cfg.WebAdmin.Launcher.DeleteLogFilesOlderThanDays = 7
	if err := l.serverconfig.Save(cfg); err != nil {
		t.Fatal(err)
	}
	world := telnet.NewClientWithAddress(l.logger, "127.0.0.1:0")
	t.Cleanup(world.Close)
	l.serverApi = &Client{logger: l.logger, pool: []*telnet.Client{world}}
	root := t.TempDir()
	t.Setenv("SPIRE_TEST_BOOTSTRAP_DIR", root)
	binary, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	input, err := os.Open(binary)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	binDir := filepath.Join(l.pathmgmt.GetEQEmuServerPath(), "bin")
	if err := os.MkdirAll(binDir, 0700); err != nil {
		t.Fatal(err)
	}
	name := sharedMemoryProcessName
	if runtime.GOOS == "windows" {
		name += ".exe"
	}
	output, err := os.OpenFile(filepath.Join(binDir, name), os.O_CREATE|os.O_WRONLY|os.O_EXCL, 0700)
	if err != nil {
		t.Fatal(err)
	}
	_, copyErr := io.Copy(output, input)
	closeErr := output.Close()
	if copyErr != nil {
		t.Fatal(copyErr)
	}
	if closeErr != nil {
		t.Fatal(closeErr)
	}
	return l, root
}

func TestBootstrapOwnsExtractionGateBeforeEnablingLauncher(t *testing.T) {
	for _, parentPower := range []bool{false, true} {
		t.Run(map[bool]string{false: "direct startup", true: "scheduled child handoff"}[parentPower], func(t *testing.T) {
			l, root := prepareBootstrapFixture(t)
			if parentPower {
				release, err := l.lockPowerAction()
				if err != nil {
					t.Fatal(err)
				}
				defer release()
			}
			done := make(chan struct{})
			var startErr error
			go func() { startErr = l.Start(); close(done) }()
			t.Cleanup(func() {
				_ = os.WriteFile(filepath.Join(root, "release"), []byte("release"), 0600)
				select {
				case <-done:
				case <-time.After(10 * time.Second):
					t.Error("bootstrap fixture did not stop")
				}
			})
			deadline := time.Now().Add(10 * time.Second)
			for {
				if _, err := os.Stat(filepath.Join(root, "ready")); err == nil {
					break
				}
				select {
				case <-done:
					t.Fatalf("bootstrap exited before shared-memory setup: %v", startErr)
				default:
				}
				if time.Now().After(deadline) {
					t.Fatal("bootstrap never reached shared-memory setup")
				}
				time.Sleep(10 * time.Millisecond)
			}
			cfg, err := l.serverconfig.Get()
			if err != nil || cfg.Spire.LauncherStart {
				t.Fatalf("bootstrap enabled launcher too soon: %v", err)
			}
			if release, err := l.lockStartup(); !errors.Is(err, restartscheduler.ErrBusy) {
				if err == nil {
					release()
				}
				t.Fatalf("bootstrap did not own extraction gate: %v", err)
			}
			if !parentPower {
				// No updater is supplied: extraction must not be reached even
				// though the startup flag is still false in this race window.
				command := &UpdateCommand{launcher: l}
				for _, online := range []bool{false, true} {
					if err := command.installRelease("unused", online); !errors.Is(err, restartscheduler.ErrBusy) {
						t.Fatalf("release installation overlapped bootstrap: %v", err)
					}
				}
				if release, err := l.lockPowerAction(); err != nil {
					t.Fatalf("rejected update leaked the power lock: %v", err)
				} else {
					release()
				}
			}
			if err := os.WriteFile(filepath.Join(root, "release"), []byte("release"), 0600); err != nil {
				t.Fatal(err)
			}
			select {
			case <-done:
			case <-time.After(10 * time.Second):
				t.Fatal("startup did not finish")
			}
			if startErr != nil {
				t.Fatal(startErr)
			}
			cfg, err = l.serverconfig.Get()
			if err != nil || !cfg.Spire.LauncherStart {
				t.Fatalf("startup was not enabled after setup: %v", err)
			}
			if release, err := l.lockStartup(); err != nil {
				t.Fatalf("bootstrap leaked the execution gate: %v", err)
			} else {
				release()
			}
		})
	}
}

func TestStartupAndProcessEntryPointsRespectExecutionGate(t *testing.T) {
	l := preflightTestLauncher(t, true)
	l.processList = func() ([]ProcessDetails, error) { return nil, nil }
	release, err := l.lockStartup()
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	for _, tc := range []struct {
		name  string
		start func() error
	}{
		{"direct CLI", l.Start},
		{"API and post-update spawn", l.StartLauncherProcess},
		{"watchdog", l.ensureLauncherRunning},
		{"supervisor process", func() error { return l.startServerProcess(worldProcessName) }},
		{"RPC shared memory", func() error { return l.startServerProcessSync(sharedMemoryProcessName) }},
		{"stop", l.stopUnlocked},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.start(); !errors.Is(err, restartscheduler.ErrBusy) {
				t.Fatalf("execution gate was bypassed: %v", err)
			}
			cfg, err := l.serverconfig.Get()
			if err != nil || !cfg.Spire.LauncherStart || !cfg.WebAdmin.Launcher.IsRunning {
				t.Fatalf("rejected startup changed flags: %+v, %v", cfg.Spire, err)
			}
			if unlock, err := l.lockPowerAction(); err != nil {
				t.Fatalf("rejected startup leaked power lock: %v", err)
			} else {
				unlock()
			}
		})
	}
}

func TestWatchdogAndManagedStartupHonorStoppedConfiguration(t *testing.T) {
	l := preflightTestLauncher(t, false)
	l.isRunning = true // A watchdog/supervisor can have a stale cached value.
	l.processList = func() ([]ProcessDetails, error) {
		t.Error("stopped watchdog attempted to inspect or spawn a launcher")
		return nil, nil
	}
	if err := l.ensureLauncherRunning(); err != nil {
		t.Fatal(err)
	}
	for _, start := range []func() error{
		func() error { return l.startServerProcess(worldProcessName) },
		func() error { return l.startServerProcessSync(sharedMemoryProcessName) },
	} {
		if err := start(); !errors.Is(err, errLauncherStopped) {
			t.Fatalf("stale state could start a process: %v", err)
		}
	}
}

func TestPublicStartupRejectsAnOwnedPowerLock(t *testing.T) {
	l := preflightTestLauncher(t, false)
	release, err := l.lockPowerAction()
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	if err := l.StartLauncherProcess(); !errors.Is(err, restartscheduler.ErrBusy) {
		t.Fatalf("startup bypassed scheduled power action: %v", err)
	}
	cfg, err := l.serverconfig.Get()
	if err != nil || cfg.Spire.LauncherStart {
		t.Fatalf("rejected startup changed state: %v", err)
	}
}
