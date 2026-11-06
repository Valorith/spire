package eqemuserver

import (
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
		{"own cloned launcher", ProcessDetails{Cwd: root, Exe: filepath.Join(other, "spire-launcher")}, true},
		{"own shared executable", ProcessDetails{Cwd: root, Exe: filepath.Join(other, "bin", "world")}, true},
		{"other world", ProcessDetails{Cwd: other, Exe: filepath.Join(other, "bin", "world")}, false},
		{"other cloned launcher", ProcessDetails{Cwd: other, Exe: filepath.Join(other, "spire-launcher")}, false},
		{"other root sharing binaries", ProcessDetails{Cwd: other, Exe: filepath.Join(root, "bin", "world")}, false},
		{"nested installation", ProcessDetails{Cwd: filepath.Join(root, "another-server"), Exe: filepath.Join(root, "another-server", "bin", "world")}, false},
		{"unknown cwd own bin", ProcessDetails{Exe: filepath.Join(root, "bin", "world")}, true},
		{"unknown cwd own root", ProcessDetails{Exe: filepath.Join(root, "world")}, true},
		{"unknown cwd other bin", ProcessDetails{Exe: filepath.Join(other, "bin", "world")}, false},
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
