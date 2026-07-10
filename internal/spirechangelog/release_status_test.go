package spirechangelog

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	gocache "github.com/patrickmn/go-cache"
)

func TestSplitGitHubRepositoryAcceptsOwnerRepoAndURL(t *testing.T) {
	cases := map[string]string{
		"Valorith/spire":                    "Valorith/spire",
		"https://github.com/Valorith/spire": "Valorith/spire",
		"git@github.com:Valorith/spire.git": "Valorith/spire",
	}

	for input, expected := range cases {
		owner, repo, err := splitGitHubRepository(input)
		if err != nil {
			t.Fatalf("splitGitHubRepository(%q) returned error: %v", input, err)
		}
		if got := owner + "/" + repo; got != expected {
			t.Fatalf("splitGitHubRepository(%q) = %q, want %q", input, got, expected)
		}
	}
}

func TestSplitGitHubRepositoryRejectsInvalidValue(t *testing.T) {
	if _, _, err := splitGitHubRepository("not-a-github-repo"); err == nil {
		t.Fatalf("expected invalid repository error")
	}
}

func TestReleaseStatusExtractGitHubToken(t *testing.T) {
	classicToken := "ghp_" + strings.Repeat("A", 24)
	fineGrainedToken := "github_pat_" + strings.Repeat("B", 32)

	cases := map[string]string{
		classicToken: classicToken,
		"Copied token: " + fineGrainedToken + "\n": fineGrainedToken,
		"Authorization: Bearer " + classicToken:    classicToken,
		"plain-non-token-value":                    "plain-non-token-value",
		" \n\t":                                    "",
	}

	for input, expected := range cases {
		if got := releaseStatusExtractGitHubToken(input); got != expected {
			t.Fatalf("releaseStatusExtractGitHubToken(%q) = %q, want %q", input, got, expected)
		}
	}
}

func TestReleaseStatusPersistedGitHubTokenRoundTrip(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HOME", dir)
	t.Setenv("XDG_CONFIG_HOME", filepath.Join(dir, "xdg-config"))
	t.Setenv("APPDATA", filepath.Join(dir, "appdata"))

	token := "github_pat_" + strings.Repeat("C", 32)
	if err := releaseStatusPersistGitHubToken(token); err != nil {
		t.Fatalf("releaseStatusPersistGitHubToken() returned error: %v", err)
	}

	got, err := releaseStatusReadPersistedGitHubToken()
	if err != nil {
		t.Fatalf("releaseStatusReadPersistedGitHubToken() returned error: %v", err)
	}
	if got != token {
		t.Fatalf("releaseStatusReadPersistedGitHubToken() = %q, want %q", got, token)
	}

	path, err := releaseStatusGitHubTokenPath()
	if err != nil {
		t.Fatalf("releaseStatusGitHubTokenPath() returned error: %v", err)
	}
	if strings.Contains(path, "Documents/GitHub/spire") {
		t.Fatalf("expected persistent token path outside the repository, got %s", path)
	}

	if runtime.GOOS != "windows" {
		fileInfo, err := os.Stat(path)
		if err != nil {
			t.Fatalf("stat token file failed: %v", err)
		}
		if fileInfo.Mode().Perm() != 0600 {
			t.Fatalf("token file permissions = %o, want 0600", fileInfo.Mode().Perm())
		}

		dirInfo, err := os.Stat(filepath.Dir(path))
		if err != nil {
			t.Fatalf("stat token dir failed: %v", err)
		}
		if dirInfo.Mode().Perm() != 0700 {
			t.Fatalf("token dir permissions = %o, want 0700", dirInfo.Mode().Perm())
		}
	}
}

func TestReleaseStatusGitHubTokenPrefersPersistedToken(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HOME", dir)
	t.Setenv("XDG_CONFIG_HOME", filepath.Join(dir, "xdg-config"))
	t.Setenv("APPDATA", filepath.Join(dir, "appdata"))
	t.Setenv("GH_TOKEN", "ghp_"+strings.Repeat("E", 24))

	token := "ghp_" + strings.Repeat("D", 24)
	if err := releaseStatusPersistGitHubToken(token); err != nil {
		t.Fatalf("releaseStatusPersistGitHubToken() returned error: %v", err)
	}

	svc := NewService(gocache.New(0, 0))
	got, source := svc.releaseStatusGitHubToken(context.Background())
	if got != token {
		t.Fatalf("releaseStatusGitHubToken() token = %q, want persisted token", got)
	}
	if source != "provided" {
		t.Fatalf("releaseStatusGitHubToken() source = %q, want provided", source)
	}
}

func TestDeriveReleaseStatusSummary(t *testing.T) {
	cases := []struct {
		name     string
		signal   releaseStatusSignal
		expected string
	}{
		{
			name:     "local issues win",
			signal:   releaseStatusSignal{LocalIssues: []string{"CHANGELOG.md is read-only."}},
			expected: "needs_attention",
		},
		{
			name:     "running workflow",
			signal:   releaseStatusSignal{WorkflowStatus: "in_progress"},
			expected: "running",
		},
		{
			name:     "failed workflow",
			signal:   releaseStatusSignal{WorkflowStatus: "completed", WorkflowConclusion: "failure"},
			expected: "failed",
		},
		{
			name:     "published expected tag",
			signal:   releaseStatusSignal{ExpectedTag: "v4.23.6", LatestReleaseTag: "v4.23.6"},
			expected: "published",
		},
		{
			name: "successful release ahead of checkout",
			signal: releaseStatusSignal{
				LocalPackageVersion: "4.23.5",
				WorkflowStatus:      "completed",
				WorkflowConclusion:  "success",
				LatestReleaseTag:    "v5.0.0",
			},
			expected: "sync_required",
		},
		{
			name: "previous successful release does not block newer local notes",
			signal: releaseStatusSignal{
				LocalPackageVersion: "4.23.6",
				WorkflowStatus:      "completed",
				WorkflowConclusion:  "success",
				LatestReleaseTag:    "v4.23.5",
			},
			expected: "ready",
		},
		{
			name:     "github unavailable",
			signal:   releaseStatusSignal{GitHubError: "rate limited"},
			expected: "unknown",
		},
		{
			name:     "ready",
			signal:   releaseStatusSignal{ExpectedTag: "v4.23.6", LatestReleaseTag: "v4.23.5"},
			expected: "ready",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			summary, _ := deriveReleaseStatusSummary(tc.signal)
			if summary != tc.expected {
				t.Fatalf("deriveReleaseStatusSummary() = %q, want %q", summary, tc.expected)
			}
		})
	}
}

func TestReleaseStatusGitHubNeedsTokenForUnauthenticatedRateLimit(t *testing.T) {
	needsToken := releaseStatusGitHubNeedsToken(
		ReleaseStatusGitHubAuth{Source: "none", Authenticated: false},
		&ReleaseStatusGitHubRate{Limit: 60, Remaining: 0},
		"API rate limit exceeded",
	)
	if !needsToken {
		t.Fatalf("expected unauthenticated rate limit to require a token")
	}
}

func TestReleaseStatusGitHubNeedsTokenForBadCredentials(t *testing.T) {
	needsToken := releaseStatusGitHubNeedsToken(
		ReleaseStatusGitHubAuth{Source: "environment", Authenticated: true},
		&ReleaseStatusGitHubRate{Limit: 60, Remaining: 42},
		"Bad credentials",
	)
	if !needsToken {
		t.Fatalf("expected bad credentials to require a replacement token")
	}
}

func TestReleaseStatusGitHubDoesNotNeedTokenForMissingWorkflow(t *testing.T) {
	needsToken := releaseStatusGitHubNeedsToken(
		ReleaseStatusGitHubAuth{Source: "gh_cli", Authenticated: true},
		&ReleaseStatusGitHubRate{Limit: 5000, Remaining: 4999},
		"Manual Release workflow unavailable: 404 Not Found",
	)
	if needsToken {
		t.Fatalf("expected missing workflow to avoid token prompt")
	}
}

func TestBuildReleaseStatusStepsMarksPublishedRelease(t *testing.T) {
	state := &LoadState{
		Source:            "live",
		Writable:          true,
		ReleaseRepository: "Valorith/spire",
		CurrentBranch:     spireReleaseBranch,
		TopRelease: ReleaseSection{
			Version:     "4.23.6",
			ReleaseDate: "3/25/2026",
			Body:        "* Release note",
		},
	}
	status := &ReleaseStatus{
		Summary:     "published",
		ExpectedTag: "v4.23.6",
		Workflow: &ReleaseStatusWorkflow{
			Status:     "completed",
			Conclusion: "success",
		},
		LatestRelease: &ReleaseStatusLatestRelease{TagName: "v4.23.6"},
	}

	steps := buildReleaseStatusSteps(state, status)
	if steps[len(steps)-1].Status != "done" {
		t.Fatalf("expected verify step done, got %s", steps[len(steps)-1].Status)
	}
	if steps[4].Status != "done" {
		t.Fatalf("expected workflow step done, got %s", steps[4].Status)
	}
}

func TestBuildReleaseStatusStepsDoesNotAutoCompletePreflight(t *testing.T) {
	state := &LoadState{
		Source:            "live",
		Writable:          true,
		ReleaseRepository: "Valorith/spire",
		CurrentBranch:     spireReleaseBranch,
		TopRelease: ReleaseSection{
			Version:     "4.23.6",
			ReleaseDate: "3/25/2026",
			Body:        "* Release note",
		},
	}
	status := &ReleaseStatus{Summary: "ready"}

	steps := buildReleaseStatusSteps(state, status)
	for i := 0; i < 4; i++ {
		if steps[i].Status != "pending" {
			t.Fatalf("expected step %d to remain pending, got %s", i, steps[i].Status)
		}
	}
}

func TestBuildReleaseStatusStepsMarksPublishedMetadataSync(t *testing.T) {
	state := &LoadState{
		Source:            "live",
		Writable:          true,
		ReleaseRepository: "Valorith/spire",
		CurrentBranch:     spireReleaseBranch,
		TopRelease: ReleaseSection{
			Version:     "Unreleased",
			ReleaseDate: "7/9/2026",
			Body:        "* Release note",
		},
	}
	status := &ReleaseStatus{
		Summary: "sync_required",
		Workflow: &ReleaseStatusWorkflow{
			Status:     "completed",
			Conclusion: "success",
		},
		LatestRelease: &ReleaseStatusLatestRelease{TagName: "v5.0.0"},
	}

	steps := buildReleaseStatusSteps(state, status)
	if steps[0].Status != "attention" {
		t.Fatalf("expected checkout sync step attention, got %s", steps[0].Status)
	}
	if !strings.Contains(steps[0].Title, "Pull") || !strings.Contains(steps[0].Detail, "v5.0.0") {
		t.Fatalf("expected checkout sync guidance, got %#v", steps[0])
	}
	if steps[4].Status != "done" {
		t.Fatalf("expected workflow step done, got %s", steps[4].Status)
	}
	if steps[5].Status != "done" {
		t.Fatalf("expected publish step done, got %s", steps[5].Status)
	}
}

func TestReleaseStatusLocalIssuesRequireMasterBranch(t *testing.T) {
	issues := releaseStatusLocalIssues(&LoadState{
		Source:            "live",
		Writable:          true,
		ReleaseRepository: "Valorith/spire",
		CurrentBranch:     "dev",
	})

	if len(issues) != 1 || !strings.Contains(issues[0], "master") || !strings.Contains(issues[0], "dev") {
		t.Fatalf("expected master branch issue, got %#v", issues)
	}
}
