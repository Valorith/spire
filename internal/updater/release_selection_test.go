package updater

import (
	"testing"

	"github.com/google/go-github/v41/github"
)

func releaseFixture(tag string, prerelease bool, draft bool, assetName string) *github.RepositoryRelease {
	release := &github.RepositoryRelease{
		TagName:    github.String(tag),
		Name:       github.String("Spire " + tag),
		Body:       github.String("Release notes"),
		HTMLURL:    github.String("https://github.com/Valorith/spire/releases/tag/" + tag),
		Prerelease: github.Bool(prerelease),
		Draft:      github.Bool(draft),
	}
	if assetName != "" {
		release.Assets = []*github.ReleaseAsset{{
			Name:               github.String(assetName),
			BrowserDownloadURL: github.String("https://example.test/" + assetName),
		}}
	}
	return release
}

func TestNormalizeUpdateChannelDefaultsToStable(t *testing.T) {
	for _, input := range []string{"", "stable", "STABLE", "legacy", " beta-ish "} {
		if got := NormalizeUpdateChannel(input); got != UpdateChannelStable {
			t.Fatalf("NormalizeUpdateChannel(%q) = %q, want stable", input, got)
		}
	}
	if got := NormalizeUpdateChannel(" BETA "); got != UpdateChannelBeta {
		t.Fatalf("NormalizeUpdateChannel(beta) = %q, want beta", got)
	}
}

func TestParseUpdateChannelRejectsUnknownValues(t *testing.T) {
	if _, err := ParseUpdateChannel("preview"); err == nil {
		t.Fatal("ParseUpdateChannel(preview) error = nil, want validation error")
	}
}

func TestStableChannelIgnoresDraftsAndPrereleases(t *testing.T) {
	releases := []*github.RepositoryRelease{
		releaseFixture("v5.6.0", false, true, "spire-linux-amd64.zip"),
		releaseFixture("v5.5.0", true, false, "spire-linux-amd64.zip"),
		releaseFixture("v5.4.1", false, false, "spire-linux-amd64.zip"),
	}

	selected, err := selectBestRelease(releases, "5.4.0", UpdateChannelStable, "linux", "amd64")
	if err != nil {
		t.Fatalf("select stable release: %v", err)
	}
	if selected == nil || selected.release.GetTagName() != "v5.4.1" {
		t.Fatalf("stable selection = %#v, want v5.4.1", selected)
	}
}

func TestStable541DoesNotOfferPublished550Prerelease(t *testing.T) {
	releases := []*github.RepositoryRelease{
		releaseFixture("v5.5.0", true, false, "spire-linux-amd64.zip"),
		releaseFixture("v5.4.1", false, false, "spire-linux-amd64.zip"),
	}

	selected, err := selectBestRelease(releases, "5.4.1", UpdateChannelStable, "linux", "amd64")
	if err != nil {
		t.Fatalf("select stable release: %v", err)
	}
	if selected != nil {
		t.Fatalf("stable selection = %s, want none for installed v5.4.1", selected.release.GetTagName())
	}
}

func TestBetaChannelSelectsPublishedPrereleaseAboveStable(t *testing.T) {
	releases := []*github.RepositoryRelease{
		releaseFixture("v5.4.1", false, false, "spire-linux-amd64.zip"),
		releaseFixture("v5.5.0", true, false, "spire-linux-amd64.zip"),
	}

	selected, err := selectBestRelease(releases, "5.4.1", UpdateChannelBeta, "linux", "amd64")
	if err != nil {
		t.Fatalf("select beta release: %v", err)
	}
	if selected == nil || selected.release.GetTagName() != "v5.5.0" || !selected.release.GetPrerelease() {
		t.Fatalf("beta selection = %#v, want v5.5.0 prerelease", selected)
	}
}

func TestBetaChannelStillSelectsHigherStableRelease(t *testing.T) {
	releases := []*github.RepositoryRelease{
		releaseFixture("v5.5.0", true, false, "spire-linux-amd64.zip"),
		releaseFixture("v5.6.0", false, false, "spire-linux-amd64.zip"),
	}

	selected, err := selectBestRelease(releases, "5.4.1", UpdateChannelBeta, "linux", "amd64")
	if err != nil {
		t.Fatalf("select beta channel release: %v", err)
	}
	if selected == nil || selected.release.GetTagName() != "v5.6.0" || selected.release.GetPrerelease() {
		t.Fatalf("beta channel selection = %#v, want stable v5.6.0", selected)
	}
}

func TestReleaseSelectionNeverDowngradesOrRepeatsInstalledVersion(t *testing.T) {
	releases := []*github.RepositoryRelease{
		releaseFixture("v5.5.0", true, false, "spire-linux-amd64.zip"),
		releaseFixture("v5.4.1", false, false, "spire-linux-amd64.zip"),
	}

	for _, installed := range []string{"5.5.0", "5.6.0"} {
		selected, err := selectBestRelease(releases, installed, UpdateChannelBeta, "linux", "amd64")
		if err != nil {
			t.Fatalf("select release for %s: %v", installed, err)
		}
		if selected != nil {
			t.Fatalf("selection for installed %s = %s, want none", installed, selected.release.GetTagName())
		}
	}
}

func TestReleaseSelectionRequiresCompatiblePlatformAsset(t *testing.T) {
	releases := []*github.RepositoryRelease{
		releaseFixture("v5.6.0", true, false, "spire-windows-amd64.exe.zip"),
		releaseFixture("v5.5.0", true, false, "spire-linux-amd64.zip"),
		releaseFixture("not-a-version", false, false, "spire-linux-amd64.zip"),
	}

	selected, err := selectBestRelease(releases, "5.4.1", UpdateChannelBeta, "linux", "amd64")
	if err != nil {
		t.Fatalf("select compatible release: %v", err)
	}
	if selected == nil || selected.release.GetTagName() != "v5.5.0" {
		t.Fatalf("compatible selection = %#v, want v5.5.0", selected)
	}
}
