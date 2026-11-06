package eqemuserver

import (
	"os"
	"path/filepath"
	"testing"
)

func TestServerPowerActionsRespectInstallation(t *testing.T) {
	root := t.TempDir()
	other := t.TempDir()
	for _, tc := range []struct {
		name string
		proc ProcessDetails
		want bool
	}{
		{"own world", ProcessDetails{Cwd: root, Exe: filepath.Join(root, "bin", "world")}, true},
		{"own bin working directory", ProcessDetails{Cwd: filepath.Join(root, "bin"), Exe: filepath.Join(root, "bin", "world")}, true},
		{"own cloned launcher", ProcessDetails{Cwd: root, Exe: filepath.Join(other, "spire-launcher")}, true},
		{"own shared executable", ProcessDetails{Cwd: root, Exe: filepath.Join(other, "bin", "world")}, true},
		{"other world", ProcessDetails{Cwd: other, Exe: filepath.Join(other, "bin", "world")}, false},
		{"other cloned launcher", ProcessDetails{Cwd: other, Exe: filepath.Join(other, "spire-launcher")}, false},
		{"other root sharing binaries", ProcessDetails{Cwd: other, Exe: filepath.Join(root, "bin", "world")}, false},
		{"nested installation", ProcessDetails{Cwd: filepath.Join(root, "another-server"), Exe: filepath.Join(root, "another-server", "bin", "world")}, false},
		{"unknown cwd own bin", ProcessDetails{Exe: filepath.Join(root, "bin", "world")}, true},
		{"unknown cwd own root", ProcessDetails{Exe: filepath.Join(root, "world")}, true},
		{"unknown cwd other bin", ProcessDetails{Exe: filepath.Join(other, "bin", "world")}, false},
		{"unknown cwd own cloned launcher", ProcessDetails{Exe: filepath.Join(serverLauncherDirectory(root), "spire-launcher")}, true},
		{"unknown cwd other cloned launcher", ProcessDetails{Exe: filepath.Join(serverLauncherDirectory(other), "spire-launcher")}, false},
		{"inaccessible process", ProcessDetails{}, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if got := belongsToServer(tc.proc, root); got != tc.want {
				t.Fatalf("belongsToServer = %v, want %v", got, tc.want)
			}
		})
	}
	if belongsToServer(ProcessDetails{Cwd: root}, "") {
		t.Fatal("missing installation path matched a process")
	}
}

func TestServerPowerScopeResolvesSymlinkedInstallation(t *testing.T) {
	root := t.TempDir()
	alias := filepath.Join(t.TempDir(), "server-alias")
	if err := os.Symlink(root, alias); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	if !belongsToServer(ProcessDetails{Cwd: root}, alias) || !belongsToServer(ProcessDetails{Cwd: alias}, root) {
		t.Fatal("physical and symlinked installation paths did not match")
	}
	if serverLauncherDirectory(alias) != serverLauncherDirectory(root) {
		t.Fatal("a symlink selected a different launcher clone directory")
	}
}

func TestUnscopedLegacyLauncherIsNotSilentlyIgnored(t *testing.T) {
	legacy := ProcessDetails{Exe: filepath.Join(os.TempDir(), "spire-launcher"), Cmdline: "spire-launcher eqemu-server:launcher start"}
	if !unscopedLegacyLauncher(legacy) {
		t.Fatal("unidentifiable legacy launcher was accepted as stopped")
	}
	legacy.Cwd = t.TempDir()
	if unscopedLegacyLauncher(legacy) {
		t.Fatal("identified launcher was treated as ambiguous")
	}
}
