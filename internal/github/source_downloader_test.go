package github

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestGetSourcedDirPathIncludesOrganizationAndEscapesRef(t *testing.T) {
	downloader := &SourceDownloader{}
	path := downloader.GetSourcedDirPath("Valorith", "Server", "feature/quest-api")

	if !strings.HasSuffix(path, filepath.Join("Valorith-Server-feature%2Fquest-api")) {
		t.Fatalf("GetSourcedDirPath() = %q, expected organization-specific escaped cache path", path)
	}
}
