//go:build !windows

package atomicfile

import (
	"os"
	"path/filepath"
)

func readFile(path string) ([]byte, error) { return os.ReadFile(path) }

func replace(from, to string) error {
	if err := os.Rename(from, to); err != nil {
		return err
	}
	dir, err := os.Open(filepath.Dir(to))
	if err != nil {
		return err
	}
	defer dir.Close()
	return dir.Sync()
}
