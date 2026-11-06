//go:build !windows

package eqemuserver

import (
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
)

func TestLauncherCloneRejectsUntrustedPaths(t *testing.T) {
	for _, kind := range []string{"parent link", "clone link", "writable parent", "writable clone", "unsafe temp root", "executable link"} {
		t.Run(kind, func(t *testing.T) {
			root := t.TempDir()
			parent := filepath.Join(root, "spire-server-launchers")
			clone := filepath.Join(parent, "installation")
			victim := filepath.Join(t.TempDir(), "victim")
			if err := os.WriteFile(victim, []byte("untouched"), 0600); err != nil {
				t.Fatal(err)
			}
			if err := os.Mkdir(parent, 0700); err != nil {
				t.Fatal(err)
			}
			switch kind {
			case "parent link":
				if err := os.Remove(parent); err != nil {
					t.Fatal(err)
				}
				if err := os.Symlink(filepath.Dir(victim), parent); err != nil {
					t.Fatal(err)
				}
			case "clone link":
				if err := os.Symlink(filepath.Dir(victim), clone); err != nil {
					t.Fatal(err)
				}
			case "writable parent":
				if err := os.Chmod(parent, 0777); err != nil {
					t.Fatal(err)
				}
			case "writable clone":
				if err := os.Mkdir(clone, 0700); err != nil {
					t.Fatal(err)
				}
				if err := os.Chmod(clone, 0777); err != nil {
					t.Fatal(err)
				}
			case "unsafe temp root":
				if err := os.Chmod(root, 0777); err != nil {
					t.Fatal(err)
				}
			case "executable link":
				if err := os.Mkdir(clone, 0700); err != nil {
					t.Fatal(err)
				}
				if err := os.Symlink(victim, filepath.Join(clone, "victim-launcher")); err != nil {
					t.Fatal(err)
				}
			}
			if _, err := installLauncherClone(victim, clone); err == nil {
				t.Fatal("accepted untrusted launcher path")
			}
			data, err := os.ReadFile(victim)
			if err != nil || string(data) != "untouched" {
				t.Fatalf("victim changed: %q, %v", data, err)
			}
		})
	}
}

func TestLauncherClonePublishesWithoutModifyingLinkedFile(t *testing.T) {
	root := t.TempDir()
	clone := filepath.Join(root, "spire-server-launchers", "installation")
	source := filepath.Join(root, "spire")
	if err := os.WriteFile(source, []byte("new executable"), 0600); err != nil {
		t.Fatal(err)
	}
	first, err := installLauncherClone(source, clone)
	if err != nil {
		t.Fatal(err)
	}
	old := filepath.Join(root, "old-executable")
	if err := os.Link(first, old); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(source, []byte("replacement executable"), 0600); err != nil {
		t.Fatal(err)
	}
	target, err := installLauncherClone(source, clone)
	if err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(target)
	if err != nil || string(data) != "replacement executable" {
		t.Fatalf("bad replacement: %q, %v", data, err)
	}
	data, err = os.ReadFile(old)
	if err != nil || string(data) != "new executable" {
		t.Fatalf("old inode was modified: %q, %v", data, err)
	}
	info, err := os.Stat(target)
	if err != nil || info.Mode().Perm() != 0700 {
		t.Fatalf("non-private executable: %v, %v", info, err)
	}
	files, err := os.ReadDir(clone)
	if err != nil || len(files) != 1 {
		t.Fatalf("temporary copies leaked: %v, %v", files, err)
	}
}

func TestLauncherCloneRejectsForeignOwnership(t *testing.T) {
	if os.Geteuid() != 0 {
		t.Skip("changing file ownership requires an isolated root test container")
	}
	for _, target := range []string{"parent", "clone"} {
		t.Run(target, func(t *testing.T) {
			root := t.TempDir()
			parent := filepath.Join(root, "spire-server-launchers")
			clone := filepath.Join(parent, "installation")
			if err := os.MkdirAll(clone, 0700); err != nil {
				t.Fatal(err)
			}
			path := parent
			if target == "clone" {
				path = clone
			}
			if err := os.Chown(path, 1001, 1001); err != nil {
				t.Fatal(err)
			}
			if _, err := secureLauncherCloneDirectory(clone); err == nil {
				t.Fatal("accepted foreign-owned directory")
			}
		})
	}
}

func TestLauncherCloneHierarchyResistsOtherUserReplacement(t *testing.T) {
	if os.Getenv("SPIRE_ISOLATED_CLONE_QA") != "1" || os.Geteuid() != 0 {
		t.Skip("requires isolated root Docker test")
	}
	if _, err := os.Stat("/.dockerenv"); err != nil {
		t.Fatal("refusing credential test outside Docker")
	}
	root := t.TempDir()
	if err := os.Chmod(root, 0755); err != nil {
		t.Fatal(err)
	}
	shared := filepath.Join(root, "shared")
	if err := os.Mkdir(shared, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(shared, 0777|os.ModeSticky); err != nil {
		t.Fatal(err)
	}
	clone, err := secureLauncherCloneDirectory(filepath.Join(shared, "spire-server-launchers", "installation"))
	if err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{filepath.Dir(clone), clone} {
		cmd := exec.Command("mv", path, filepath.Join(shared, "substituted"))
		cmd.SysProcAttr = &syscall.SysProcAttr{Credential: &syscall.Credential{Uid: 1001, Gid: 1001}}
		if err := cmd.Run(); err == nil {
			t.Fatalf("other user replaced %s", path)
		}
	}
	if _, err := os.Stat(clone); err != nil {
		t.Fatalf("protected path lost: %v", err)
	}
}
