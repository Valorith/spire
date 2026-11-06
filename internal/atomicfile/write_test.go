package atomicfile

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestReplacementPreservesContentsPermissionsAndSymlink(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "config.json")
	if err := Write(path, []byte("original"), 0640); err != nil {
		t.Fatal(err)
	}
	if err := Write(path, []byte("replacement"), 0600); err != nil {
		t.Fatal(err)
	}
	data, err := Read(path)
	if err != nil || string(data) != "replacement" {
		t.Fatalf("replacement failed: %q %v", data, err)
	}
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS != "windows" && info.Mode().Perm() != 0640 {
		t.Fatalf("file permissions changed: %v", info.Mode())
	}
	link := filepath.Join(root, "linked-config.json")
	if err := os.Symlink(path, link); err != nil {
		t.Skip("symlinks unavailable:", err)
	}
	if err := Write(link, []byte("through symlink"), 0600); err != nil {
		t.Fatal(err)
	}
	info, err = os.Lstat(link)
	if err != nil || info.Mode()&os.ModeSymlink == 0 {
		t.Fatal("configuration symlink was replaced")
	}
	data, err = Read(path)
	if err != nil || string(data) != "through symlink" {
		t.Fatalf("symlink target was not updated: %q %v", data, err)
	}
}

func TestFailedReplacementCleansTemporaryFile(t *testing.T) {
	root := t.TempDir()
	target := filepath.Join(root, "directory")
	if err := os.Mkdir(target, 0700); err != nil {
		t.Fatal(err)
	}
	if err := Write(target, []byte("invalid replacement"), 0600); err == nil {
		t.Fatal("directory was overwritten")
	}
	files, err := filepath.Glob(filepath.Join(root, ".spire-write-*"))
	if err != nil {
		t.Fatal(err)
	}
	if len(files) != 0 {
		t.Fatalf("temporary files leaked: %v", files)
	}
}
