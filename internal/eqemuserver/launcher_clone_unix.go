//go:build !windows

package eqemuserver

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"syscall"
)

// Validate from the filesystem root down. Writable shared ancestors are safe
// only with the sticky bit and a trusted owner; otherwise a peer can rename a
// checked directory before it is used. Resolve only the system temp root, since
// macOS commonly reaches it through /var; our own two directories reject links.
func secureLauncherCloneDirectory(path string) (string, error) {
	parent := filepath.Dir(path)
	root, err := filepath.Abs(filepath.Dir(parent))
	if err != nil {
		return "", err
	}
	root, err = filepath.EvalSymlinks(root)
	if err != nil {
		return "", err
	}
	var ancestors []string
	for current := root; ; current = filepath.Dir(current) {
		ancestors = append(ancestors, current)
		if filepath.Dir(current) == current {
			break
		}
	}
	for i := len(ancestors) - 1; i >= 0; i-- {
		info, err := os.Lstat(ancestors[i])
		if err != nil {
			return "", err
		}
		stat, ok := info.Sys().(*syscall.Stat_t)
		if !info.IsDir() || !ok || (stat.Uid != 0 && stat.Uid != uint32(os.Geteuid())) ||
			(info.Mode().Perm()&0022 != 0 && info.Mode()&os.ModeSticky == 0) {
			return "", fmt.Errorf("untrusted launcher temporary ancestor %q", ancestors[i])
		}
	}
	parent = filepath.Join(root, filepath.Base(parent))
	path = filepath.Join(parent, filepath.Base(path))
	for _, directory := range []string{parent, path} {
		if err := os.Mkdir(directory, 0700); err != nil && !os.IsExist(err) {
			return "", err
		}
		info, err := os.Lstat(directory)
		if err != nil {
			return "", err
		}
		stat, ok := info.Sys().(*syscall.Stat_t)
		if !info.IsDir() || !ok || stat.Uid != uint32(os.Geteuid()) || info.Mode().Perm()&0022 != 0 {
			return "", fmt.Errorf("launcher directory %q must be owned by the current user and not writable by other users", directory)
		}
	}
	return path, nil
}

// The trusted hierarchy prevents another user from substituting the path.
// Publish a completed private file by rename so an existing clone, hard link,
// or running executable is never opened for truncation or chmodded in place.
func installLauncherClone(source, directory string) (string, error) {
	directory, err := secureLauncherCloneDirectory(directory)
	if err != nil {
		return "", err
	}
	target := filepath.Join(directory, filepath.Base(source)+"-launcher")
	if info, err := os.Lstat(target); err == nil {
		if !info.Mode().IsRegular() {
			return "", fmt.Errorf("launcher executable %q is not a regular file", target)
		}
	} else if !os.IsNotExist(err) {
		return "", err
	}
	input, err := os.Open(source)
	if err != nil {
		return "", err
	}
	defer input.Close()
	output, err := os.CreateTemp(directory, ".launcher-*")
	if err != nil {
		return "", err
	}
	defer os.Remove(output.Name())
	defer output.Close()
	if _, err := io.Copy(output, input); err != nil {
		return "", err
	}
	if err := output.Chmod(0700); err != nil {
		return "", err
	}
	if err := output.Sync(); err != nil {
		return "", err
	}
	if err := output.Close(); err != nil {
		return "", err
	}
	if err := os.Rename(output.Name(), target); err != nil {
		return "", err
	}
	return target, nil
}
