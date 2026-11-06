package eqemuserver

import (
	"errors"
	"testing"
)

func TestPowerActionPreservesCancellationBeforeCountdownLoop(t *testing.T) {
	for _, restart := range []bool{false, true} {
		t.Run(map[bool]string{false: "stop", true: "restart"}[restart], func(t *testing.T) {
			l := preflightTestLauncher(t, true)
			reachedProcesses := false
			l.processList = func() ([]ProcessDetails, error) {
				reachedProcesses = true
				return nil, errors.New("cancelled action reached process control")
			}
			err := l.powerAction(restart, 60, func() {
				if err := l.StopCancel(); err != nil {
					t.Fatal(err)
				}
			})
			if reachedProcesses {
				t.Fatal("cancellation between timer setup and countdown caused process control")
			}
			if restart && !errors.Is(err, errPowerActionCancelled) || !restart && err != nil {
				t.Fatalf("unexpected cancellation outcome: %v", err)
			}
			cfg, cfgErr := l.serverconfig.Get()
			if cfgErr != nil || !cfg.Spire.LauncherStart || !cfg.WebAdmin.Launcher.IsRunning {
				t.Fatalf("cancelled action changed running flags: %v", cfgErr)
			}
		})
	}
}

func TestImmediatePowerActionDoesNotInheritEarlierCancellation(t *testing.T) {
	l := preflightTestLauncher(t, true)
	if err := l.StopCancel(); err != nil {
		t.Fatal(err)
	}
	expected := errors.New("immediate action reached preflight")
	l.processList = func() ([]ProcessDetails, error) { return nil, expected }
	if err := l.PowerAction(false, 0); !errors.Is(err, expected) {
		t.Fatalf("an intentional immediate action inherited cancellation: %v", err)
	}
}
