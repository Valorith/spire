package spirechangelog

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	gocache "github.com/patrickmn/go-cache"
)

func TestReadChangelogFallsBackToEmbeddedCache(t *testing.T) {
	dir := t.TempDir()
	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}

	svc := NewService(gocache.New(0, 0))
	svc.cache.Set("changelog", "## [1.0.0] 1/1/2026\n\n* Cached entry", 0)
	svc.cache.Set("packageJson", []byte(`{"version":"1.0.0"}`), 0)

	content, source, err := svc.ReadChangelog()
	if err != nil {
		t.Fatalf("ReadChangelog returned error: %v", err)
	}

	if source != "embedded" {
		t.Fatalf("expected embedded source, got %s", source)
	}
	if !strings.Contains(content, "Cached entry") {
		t.Fatalf("expected cached changelog content, got %q", content)
	}
}

func TestReadChangelogPrefersLiveFile(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Live entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.0"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))
	svc.cache.Set("changelog", "## [0.9.0] 1/1/2025\n\n* Cached entry", 0)
	svc.cache.Set("packageJson", []byte(`{"version":"0.9.0"}`), 0)

	content, source, err := svc.ReadChangelog()
	if err != nil {
		t.Fatalf("ReadChangelog returned error: %v", err)
	}

	if source != "live" {
		t.Fatalf("expected live source, got %s", source)
	}
	if !strings.Contains(content, "Live entry") {
		t.Fatalf("expected live changelog content, got %q", content)
	}
}

func TestReadChangelogUsesEmbeddedFallbackInProduction(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Live entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.0"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "production")

	svc := NewService(gocache.New(0, 0))
	svc.cache.Set("changelog", "## [0.9.0] 1/1/2025\n\n* Embedded entry", 0)
	svc.cache.Set("packageJson", []byte(`{"version":"0.9.0"}`), 0)

	content, source, err := svc.ReadChangelog()
	if err != nil {
		t.Fatalf("ReadChangelog returned error: %v", err)
	}

	if source != "embedded" {
		t.Fatalf("expected embedded source in production, got %s", source)
	}
	if !strings.Contains(content, "Embedded entry") {
		t.Fatalf("expected embedded changelog content, got %q", content)
	}
	if svc.IsWritable() {
		t.Fatalf("expected production changelog service to be read-only")
	}
}

func TestSaveReleasePrependsNewTopSection(t *testing.T) {
	dir := t.TempDir()
	original := "## [1.0.0] 1/1/2026\n\n* Existing entry\n"
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), original)
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.1"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))

	state, err := svc.SaveRelease(SaveRequest{
		Version:     "1.0.1",
		ReleaseDate: "3/25/2026",
		Body:        "* Added release notes",
	})
	if err != nil {
		t.Fatalf("SaveRelease returned error: %v", err)
	}

	if state.TopRelease.Version != "1.0.1" {
		t.Fatalf("expected top release version 1.0.1, got %s", state.TopRelease.Version)
	}
	if state.ReleasePayload.TagName != "v1.0.1" {
		t.Fatalf("expected release payload tag v1.0.1, got %s", state.ReleasePayload.TagName)
	}

	body, err := os.ReadFile(filepath.Join(dir, "CHANGELOG.md"))
	if err != nil {
		t.Fatalf("failed reading changelog: %v", err)
	}

	content := string(body)
	if !strings.HasPrefix(content, "## [1.0.1] 3/25/2026") {
		t.Fatalf("expected new release at top, got %q", content)
	}
	if !strings.Contains(content, "## [1.0.0] 1/1/2026") {
		t.Fatalf("expected original content to remain, got %q", content)
	}
}

func TestBuildReleasePayloadFromTopSection(t *testing.T) {
	svc := NewService(gocache.New(0, 0))

	payload := svc.BuildReleasePayload(ReleaseSection{
		Version:     "4.23.6",
		ReleaseDate: "3/25/2026",
		Body:        "* Added unified release notes",
	})

	if payload.TagName != "v4.23.6" {
		t.Fatalf("expected tag v4.23.6, got %s", payload.TagName)
	}
	if payload.Title != "Spire v4.23.6 (Stable)" {
		t.Fatalf("expected stable channel title, got %s", payload.Title)
	}
	if payload.Prerelease {
		t.Fatalf("expected stable payload to set prerelease false")
	}
	if !strings.Contains(payload.Body, "## [4.23.6] 3/25/2026") {
		t.Fatalf("expected payload body to include changelog heading, got %q", payload.Body)
	}
}

func TestParseTopReleaseRecognizesBetaHeadingWithoutLeakingHistory(t *testing.T) {
	svc := NewService(gocache.New(0, 0))
	content := "## [6.0.0] (Beta) 7/27/2026\n\n* Beta notes\n\n" +
		"## [5.4.1] 7/26/2026\n\n* Stable notes\n"

	release := svc.ParseTopRelease(content)
	if release.Version != "6.0.0" {
		t.Fatalf("expected version 6.0.0, got %s", release.Version)
	}
	if release.ReleaseDate != "7/27/2026" {
		t.Fatalf("expected beta heading date to round-trip, got %s", release.ReleaseDate)
	}
	if !release.IsBeta {
		t.Fatalf("expected beta heading to set IsBeta")
	}

	stableWithHistoricalBeta := "## [6.0.0] 7/27/2026\n\n* Stable notes\n\n" +
		"## [5.0.0] 7/10/2026\n\nRelease Type: **BETA**\n* Historical beta\n"
	stable := svc.ParseTopRelease(stableWithHistoricalBeta)
	if stable.IsBeta {
		t.Fatalf("historical beta marker must not affect the top stable release")
	}
}

func TestParseTopReleaseRecognizesLegacyBetaMarker(t *testing.T) {
	svc := NewService(gocache.New(0, 0))
	release := svc.ParseTopRelease("## [5.0.0] 7/10/2026\n\nRelease Type:  **BETA**\n* Legacy beta notes\n")

	if !release.IsBeta {
		t.Fatalf("expected legacy beta marker to remain supported")
	}
	if release.ReleaseDate != "7/10/2026" {
		t.Fatalf("expected legacy release date to remain unchanged, got %s", release.ReleaseDate)
	}
}

func TestBuildBetaReleasePayloadUsesCanonicalHeadingAndPrereleaseFlag(t *testing.T) {
	svc := NewService(gocache.New(0, 0))
	payload := svc.BuildReleasePayload(ReleaseSection{
		Version:     "6.0.0",
		ReleaseDate: "7/27/2026",
		Body:        "Release Type: **BETA**\n\n* Beta notes",
		IsBeta:      true,
	})

	if payload.TagName != "v6.0.0" {
		t.Fatalf("expected beta tag semantics to remain v6.0.0, got %s", payload.TagName)
	}
	if payload.Title != "Spire v6.0.0 (Beta)" {
		t.Fatalf("expected beta title, got %s", payload.Title)
	}
	if !payload.Prerelease {
		t.Fatalf("expected beta payload to set prerelease true")
	}
	if !strings.HasPrefix(payload.Body, "## [6.0.0] (Beta) 7/27/2026") {
		t.Fatalf("expected canonical beta heading, got %q", payload.Body)
	}
	if strings.Contains(payload.Body, "Release Type:") {
		t.Fatalf("expected legacy marker to be normalized out of the payload body, got %q", payload.Body)
	}
}

func TestUpdatePackageVersionWritesLivePackageJSON(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), "{\n  \"name\": \"spire\",\n  \"version\": \"1.0.0\"\n}\n")

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))

	state, err := svc.UpdatePackageVersion(UpdatePackageVersionRequest{Version: "1.0.1"})
	if err != nil {
		t.Fatalf("UpdatePackageVersion returned error: %v", err)
	}

	if state.PackageVersion != "1.0.1" {
		t.Fatalf("expected package version 1.0.1, got %s", state.PackageVersion)
	}

	body, err := os.ReadFile(filepath.Join(dir, "package.json"))
	if err != nil {
		t.Fatalf("failed reading package.json: %v", err)
	}

	if !strings.Contains(string(body), `"version": "1.0.1"`) {
		t.Fatalf("expected package.json version update, got %q", string(body))
	}
}

func TestSaveReleaseRejectsDuplicateVersion(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.0"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))

	_, err := svc.SaveRelease(SaveRequest{
		Version:     "1.0.0",
		ReleaseDate: "3/25/2026",
		Body:        "* Duplicate version",
	})
	if err == nil || !strings.Contains(err.Error(), "already exists") {
		t.Fatalf("expected duplicate version error, got %v", err)
	}
}

func TestSaveReleaseUpdatesPackageVersionWhenNeeded(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.2"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))

	state, err := svc.SaveRelease(SaveRequest{
		Version:     "1.0.1",
		ReleaseDate: "3/25/2026",
		Body:        "* Mismatch version",
	})
	if err != nil {
		t.Fatalf("expected save to update package version, got %v", err)
	}
	if state.PackageVersion != "1.0.1" {
		t.Fatalf("expected package version to update to 1.0.1, got %s", state.PackageVersion)
	}

	body, err := os.ReadFile(filepath.Join(dir, "package.json"))
	if err != nil {
		t.Fatalf("failed reading package.json: %v", err)
	}
	if !strings.Contains(string(body), `"version":"1.0.1"`) {
		t.Fatalf("expected package.json version update, got %q", string(body))
	}
}

func TestSaveReleaseRejectsInvalidVersion(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.0"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))

	_, err := svc.SaveRelease(SaveRequest{
		Version:     "next-release",
		ReleaseDate: "3/25/2026",
		Body:        "* Invalid version",
	})
	if err == nil || !strings.Contains(err.Error(), "semantic version format") {
		t.Fatalf("expected invalid version error, got %v", err)
	}
}

func TestGenerateDraftUsesLatestLocalTag(t *testing.T) {
	dir := t.TempDir()
	runGit(t, dir, "init")
	runGit(t, dir, "config", "user.name", "Codex")
	runGit(t, dir, "config", "user.email", "codex@example.com")

	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [0.1.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"0.1.1"}`)
	runGit(t, dir, "add", "CHANGELOG.md", "package.json")
	runGit(t, dir, "commit", "-m", "Initial release")
	runGit(t, dir, "tag", "v0.1.0")

	mustWriteFile(t, filepath.Join(dir, "feature.txt"), "feature")
	runGit(t, dir, "add", "feature.txt")
	runGit(t, dir, "commit", "-m", "Add exciting feature")

	mustWriteFile(t, filepath.Join(dir, "fix.txt"), "fix")
	runGit(t, dir, "add", "fix.txt")
	runGit(t, dir, "commit", "-m", "fix: correct changelog draft")

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))
	draft, err := svc.GenerateDraft()
	if err != nil {
		t.Fatalf("GenerateDraft returned error: %v", err)
	}

	if draft.LatestTag != "v0.1.0" {
		t.Fatalf("expected latest tag v0.1.0, got %s", draft.LatestTag)
	}
	if !strings.Contains(draft.Body, "* Add exciting feature") {
		t.Fatalf("expected latest commit subject in draft, got %q", draft.Body)
	}
	if !strings.Contains(draft.Body, "* Fix correct changelog draft") {
		t.Fatalf("expected normalized fix subject in draft, got %q", draft.Body)
	}
}

func TestLoadStateIncludesConfiguredReleaseRepositoryAndCandidates(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), "{\n  \"name\": \"spire\",\n  \"version\": \"1.0.0\",\n  \"spire\": {\n    \"release_repository\": \"ConfiguredOrg/spire\"\n  },\n  \"repository\": {\n    \"type\": \"git\",\n    \"url\": \"https://github.com/EQEmuTools/spire.git\"\n  }\n}\n")
	runGit(t, dir, "init")
	runGit(t, dir, "config", "user.name", "Codex")
	runGit(t, dir, "config", "user.email", "codex@example.com")
	runGit(t, dir, "remote", "add", "upstream", "git@github.com:UpstreamOrg/spire.git")
	runGit(t, dir, "remote", "add", "origin", "git@github.com:OriginOrg/spire.git")

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")
	t.Setenv("SPIRE_RELEASE_REPO", "OverrideOrg/spire")

	svc := NewService(gocache.New(0, 0))
	state, err := svc.LoadState()
	if err != nil {
		t.Fatalf("LoadState returned error: %v", err)
	}

	if state.ReleaseRepository != "OverrideOrg/spire" {
		t.Fatalf("expected active release repository OverrideOrg/spire, got %s", state.ReleaseRepository)
	}
	if state.ConfiguredReleaseRepository != "ConfiguredOrg/spire" {
		t.Fatalf("expected configured repository ConfiguredOrg/spire, got %s", state.ConfiguredReleaseRepository)
	}
	if state.ReleaseRepositorySource != "env" {
		t.Fatalf("expected release repository source env, got %s", state.ReleaseRepositorySource)
	}
	if len(state.ReleaseRepositoryCandidates) < 4 {
		t.Fatalf("expected release repository candidates to include env/package/remotes/default, got %v", state.ReleaseRepositoryCandidates)
	}
}

func TestUpdateReleaseRepositoryWritesLivePackageJSON(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), "{\n  \"name\": \"spire\",\n  \"version\": \"1.0.0\",\n  \"repository\": {\n    \"type\": \"git\",\n    \"url\": \"https://github.com/EQEmuTools/spire.git\"\n  }\n}\n")

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))

	state, err := svc.UpdateReleaseRepository(UpdateReleaseRepositoryRequest{Repository: "Valorith/spire"})
	if err != nil {
		t.Fatalf("UpdateReleaseRepository returned error: %v", err)
	}

	if state.ConfiguredReleaseRepository != "Valorith/spire" {
		t.Fatalf("expected configured repository Valorith/spire, got %s", state.ConfiguredReleaseRepository)
	}
	if state.ReleaseRepository != "Valorith/spire" {
		t.Fatalf("expected active repository Valorith/spire, got %s", state.ReleaseRepository)
	}

	body, err := os.ReadFile(filepath.Join(dir, "package.json"))
	if err != nil {
		t.Fatalf("failed reading package.json: %v", err)
	}

	if !strings.Contains(string(body), "\"release_repository\": \"Valorith/spire\"") {
		t.Fatalf("expected package.json repository update, got %q", string(body))
	}
}

func TestSaveContentWritesEntireChangelog(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), "{\n  \"name\": \"spire\",\n  \"version\": \"1.0.0\",\n  \"spire\": {\n    \"release_repository\": \"Valorith/spire\"\n  }\n}\n")

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))
	updated := "## [1.0.1] 1/2/2026\n\n* New entry\n\n## [1.0.0] 1/1/2026\n\n* Existing entry"
	state, err := svc.SaveContent(SaveContentRequest{Content: updated})
	if err != nil {
		t.Fatalf("SaveContent returned error: %v", err)
	}

	if state.TopRelease.Version != "1.0.1" {
		t.Fatalf("expected top release 1.0.1, got %s", state.TopRelease.Version)
	}

	body, err := os.ReadFile(filepath.Join(dir, "CHANGELOG.md"))
	if err != nil {
		t.Fatalf("failed reading CHANGELOG.md: %v", err)
	}
	if string(body) != updated+"\n" {
		t.Fatalf("expected full changelog rewrite, got %q", string(body))
	}
}

func TestSaveContentRoundTripsCanonicalBetaHeading(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.1"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))
	updated := "## [1.0.1] (Beta) 7/27/2026\n\n* Beta entry\n\n## [1.0.0] 1/1/2026\n\n* Existing entry"
	state, err := svc.SaveContent(SaveContentRequest{Content: updated})
	if err != nil {
		t.Fatalf("SaveContent returned error: %v", err)
	}

	if !state.TopRelease.IsBeta || !state.ReleasePayload.Prerelease {
		t.Fatalf("expected saved beta state and payload, got top=%+v payload=%+v", state.TopRelease, state.ReleasePayload)
	}
	if state.ReleasePayload.Title != "Spire v1.0.1 (Beta)" {
		t.Fatalf("expected saved beta title, got %s", state.ReleasePayload.Title)
	}

	reloaded, err := svc.LoadState()
	if err != nil {
		t.Fatalf("LoadState returned error: %v", err)
	}
	if reloaded.Content != updated+"\n" {
		t.Fatalf("expected beta heading to survive save/reload, got %q", reloaded.Content)
	}
	if !reloaded.TopRelease.IsBeta || reloaded.TopRelease.ReleaseDate != "7/27/2026" {
		t.Fatalf("expected reloaded beta metadata, got %+v", reloaded.TopRelease)
	}
}

func TestSaveContentRejectsTokenLikeSecret(t *testing.T) {
	dir := t.TempDir()
	mustWriteFile(t, filepath.Join(dir, "CHANGELOG.md"), "## [1.0.0] 1/1/2026\n\n* Existing entry\n")
	mustWriteFile(t, filepath.Join(dir, "package.json"), `{"version":"1.0.0"}`)

	oldWD, _ := os.Getwd()
	defer os.Chdir(oldWD)
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	t.Setenv("APP_ENV", "local")

	svc := NewService(gocache.New(0, 0))
	_, err := svc.SaveContent(SaveContentRequest{
		Content: "## [1.0.1] 1/2/2026\n\n* Do not publish " + "ghp_" + strings.Repeat("1", 36) + "\n",
	})
	if err == nil || !strings.Contains(err.Error(), "token-like secret") {
		t.Fatalf("expected token-like secret rejection, got %v", err)
	}
}

func TestValidateProposedReleaseRejectsTokenLikeSecret(t *testing.T) {
	svc := NewService(gocache.New(0, 0))
	issues := svc.ValidateProposedRelease(SaveRequest{
		Version:     "1.0.1",
		ReleaseDate: "1/2/2026",
		Body:        "* Do not publish " + "github_pat_" + strings.Repeat("1", 40),
	}, "## [1.0.0] 1/1/2026\n\n* Existing entry\n", "1.0.1", false)

	if len(issues) == 0 || !strings.Contains(strings.Join(issues, "\n"), "token-like secret") {
		t.Fatalf("expected token-like secret issue, got %v", issues)
	}
}

func TestValidateCurrentDocumentAllowsUnreleasedDraft(t *testing.T) {
	svc := NewService(gocache.New(0, 0))
	content := "## [Unreleased] 1/2/2026\n\n* New entry\n\n## [1.0.0] 1/1/2026\n\n* Existing entry\n"

	issues := svc.ValidateCurrentDocument(content, "1.0.0")
	if len(issues) > 0 {
		t.Fatalf("expected no validation issues for unreleased draft, got %v", issues)
	}
}

func TestValidateCurrentDocumentRejectsTokenLikeSecret(t *testing.T) {
	svc := NewService(gocache.New(0, 0))
	content := "## [1.0.0] 1/2/2026\n\n* Do not publish Authorization: Bearer " + strings.Repeat("a", 32) + "\n"

	issues := svc.ValidateCurrentDocument(content, "1.0.0")
	if len(issues) == 0 || !strings.Contains(strings.Join(issues, "\n"), "token-like secret") {
		t.Fatalf("expected token-like secret issue, got %v", issues)
	}
}

func mustWriteFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("write %s failed: %v", path, err)
	}
}

func runGit(t *testing.T, dir string, args ...string) {
	t.Helper()
	cmd := exec.Command("git", append([]string{"-C", dir}, args...)...)
	if output, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("git %v failed: %v\n%s", args, err, string(output))
	}
}
