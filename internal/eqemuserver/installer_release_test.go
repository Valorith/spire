package eqemuserver

import (
	"testing"

	spirerelease "github.com/EQEmuTools/spire/internal/release"
)

func TestSpireInstallerReleaseRepositoryUsesValorithFork(t *testing.T) {
	owner, repo, err := spireInstallerReleaseRepository()
	if err != nil {
		t.Fatalf("spireInstallerReleaseRepository() returned error: %v", err)
	}

	got := owner + "/" + repo
	if got != spirerelease.DefaultRepository {
		t.Fatalf("spireInstallerReleaseRepository() = %q, want configured default %q", got, spirerelease.DefaultRepository)
	}
	if got != "Valorith/spire" {
		t.Fatalf("spireInstallerReleaseRepository() = %q, want Valorith/spire", got)
	}
}
