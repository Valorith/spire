//go:build !windows

package eqemuserver

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLauncherCloneKeepsInstallationIdentity(t *testing.T) {
	for _, alias := range []bool{false, true} {
		t.Run(map[bool]string{false: "physical temp root", true: "symlinked temp root"}[alias], func(t *testing.T) {
			root, other, temp := t.TempDir(), t.TempDir(), t.TempDir()
			if alias {
				link := filepath.Join(t.TempDir(), "temp-alias")
				if err := os.Symlink(temp, link); err != nil {
					t.Fatal(err)
				}
				temp = link
			}
			t.Setenv("TMPDIR", temp)
			source := filepath.Join(root, "spire")
			if err := os.WriteFile(source, []byte("test executable"), 0600); err != nil {
				t.Fatal(err)
			}
			clone, err := installLauncherClone(source, serverLauncherDirectory(root))
			if err != nil {
				t.Fatal(err)
			}
			proc := ProcessDetails{Exe: clone}
			if !belongsToServer(proc, root) || belongsToServer(proc, other) {
				t.Fatal("private clone lost its installation identity when Cwd is unavailable")
			}
		})
	}
}
