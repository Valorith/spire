package filepathcheck

import (
	"errors"
	"path/filepath"
	"strings"
)

// NormalizePath returns a cleaned and absolute path
func NormalizePath(input string) (string, error) {
	if strings.TrimSpace(input) == "" {
		return "", errors.New("empty path is not allowed")
	}

	cleanedPath := filepath.Clean(input)           // Normalize path
	absolutePath, err := filepath.Abs(cleanedPath) // Get absolute path
	if err != nil {
		return "", errors.New("invalid path")
	}

	return absolutePath, nil
}

// IsWithinBaseDir ensures the path is within the allowed directory
func IsWithinBaseDir(baseDir, absPath string) bool {
	baseAbs, err := NormalizePath(baseDir)
	if err != nil {
		return false
	}

	targetAbs, err := NormalizePath(absPath)
	if err != nil {
		return false
	}

	rel, err := filepath.Rel(baseAbs, targetAbs)
	if err != nil {
		return false
	}

	return rel == "." || (rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)))
}

// IsHiddenFile checks if the file is hidden (starts with ".")
func IsHiddenFile(input string) bool {
	return strings.HasPrefix(filepath.Base(input), ".")
}

// ValidateSafePath checks if the given path is safe
func ValidateSafePath(baseDir, input string) error {
	absPath, err := NormalizePath(input)
	if err != nil {
		return err
	}

	if !IsWithinBaseDir(baseDir, absPath) {
		return errors.New("path traversal detected")
	}

	if IsHiddenFile(input) {
		return errors.New("hidden files are not allowed")
	}

	return nil
}
