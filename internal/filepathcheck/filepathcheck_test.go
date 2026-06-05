package filepathcheck

import (
	"path/filepath"
	"testing"
)

func TestIsWithinBaseDirNormalizesParentSegments(t *testing.T) {
	root := t.TempDir()
	baseDir := filepath.Join(root, "spire", "..", "bin")
	target := filepath.Join(root, "bin", "world")

	if !IsWithinBaseDir(baseDir, target) {
		t.Fatalf("expected %q to be within %q after normalization", target, baseDir)
	}
}

func TestIsWithinBaseDirRejectsEscapes(t *testing.T) {
	root := t.TempDir()
	baseDir := filepath.Join(root, "bin")
	target := filepath.Join(root, "logs", "world")

	if IsWithinBaseDir(baseDir, target) {
		t.Fatalf("expected %q to be outside %q", target, baseDir)
	}
}

func TestValidateSafePathAllowsNormalizedPathWithinBaseDir(t *testing.T) {
	root := t.TempDir()
	baseDir := filepath.Join(root, "spire", "..", "bin")
	target := filepath.Join(root, "bin", "world")

	if err := ValidateSafePath(baseDir, target); err != nil {
		t.Fatalf("expected path to validate, got %v", err)
	}
}
