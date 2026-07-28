package updater

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/release"
	"github.com/google/go-github/v41/github"
	version "github.com/hashicorp/go-version"
)

type UpdateChannel string

const (
	UpdateChannelStable UpdateChannel = "stable"
	UpdateChannelBeta   UpdateChannel = "beta"
)

func NormalizeUpdateChannel(value string) UpdateChannel {
	if strings.EqualFold(strings.TrimSpace(value), string(UpdateChannelBeta)) {
		return UpdateChannelBeta
	}

	return UpdateChannelStable
}

func ParseUpdateChannel(value string) (UpdateChannel, error) {
	channel := UpdateChannel(strings.ToLower(strings.TrimSpace(value)))
	switch channel {
	case UpdateChannelStable, UpdateChannelBeta:
		return channel, nil
	default:
		return "", fmt.Errorf("update channel must be %q or %q", UpdateChannelStable, UpdateChannelBeta)
	}
}

type ReleaseInfo struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	HTMLURL     string `json:"html_url"`
	Prerelease  bool   `json:"prerelease"`
	ReleaseType string `json:"release_type"`
	AssetName   string `json:"asset_name"`
}

type UpdateStatus struct {
	Channel        UpdateChannel `json:"channel"`
	Repository     string        `json:"repository"`
	CurrentVersion string        `json:"current_version"`
	Available      bool          `json:"available"`
	Release        *ReleaseInfo  `json:"release,omitempty"`
}

type selectedRelease struct {
	release *github.RepositoryRelease
	asset   *github.ReleaseAsset
	version *version.Version
}

func targetReleaseAssetName(goos string, goarch string) string {
	if goos == "windows" {
		return fmt.Sprintf("spire-%s-%s.exe.zip", goos, goarch)
	}

	return fmt.Sprintf("spire-%s-%s.zip", goos, goarch)
}

func selectBestRelease(
	releases []*github.RepositoryRelease,
	currentVersion string,
	channel UpdateChannel,
	goos string,
	goarch string,
) (*selectedRelease, error) {
	current, err := version.NewVersion(strings.TrimPrefix(strings.TrimSpace(currentVersion), "v"))
	if err != nil {
		return nil, fmt.Errorf("invalid installed Spire version %q: %w", currentVersion, err)
	}

	channel = NormalizeUpdateChannel(string(channel))
	targetAsset := targetReleaseAssetName(goos, goarch)
	var selected *selectedRelease

	for _, candidate := range releases {
		if candidate == nil || candidate.GetDraft() {
			continue
		}
		if channel == UpdateChannelStable && candidate.GetPrerelease() {
			continue
		}

		candidateVersion, parseErr := version.NewVersion(strings.TrimPrefix(strings.TrimSpace(candidate.GetTagName()), "v"))
		if parseErr != nil || candidateVersion.Compare(current) <= 0 {
			continue
		}

		var matchingAsset *github.ReleaseAsset
		for _, asset := range candidate.Assets {
			if asset != nil && asset.GetName() == targetAsset && asset.GetBrowserDownloadURL() != "" {
				matchingAsset = asset
				break
			}
		}
		if matchingAsset == nil {
			continue
		}

		if selected == nil || candidateVersion.GreaterThan(selected.version) {
			selected = &selectedRelease{
				release: candidate,
				asset:   matchingAsset,
				version: candidateVersion,
			}
		}
	}

	return selected, nil
}

func (s *Updater) ResolveUpdateStatus(ctx context.Context) (UpdateStatus, error) {
	status, _, err := s.resolveUpdate(ctx)
	return status, err
}

func (s *Updater) resolveUpdate(ctx context.Context) (UpdateStatus, *selectedRelease, error) {
	err, appEnv := s.getAppVersion()
	if err != nil {
		return UpdateStatus{}, nil, err
	}

	config, configErr := s.serverconfig.Get()
	configReleaseRepository := ""
	channel := UpdateChannelStable
	if configErr == nil {
		configReleaseRepository = config.Spire.ReleaseRepository
		channel = NormalizeUpdateChannel(config.Spire.UpdateChannel)
	}

	releaseRepo := release.ResolveRepositoryDetailsWithConfig(
		s.releaseRepositoryOverride,
		configReleaseRepository,
		s.packageJson,
		nil,
	).Repository

	status := UpdateStatus{
		Channel:        channel,
		Repository:     releaseRepo,
		CurrentVersion: appEnv.Version,
		Available:      false,
	}

	repoParts := strings.SplitN(releaseRepo, "/", 2)
	if len(repoParts) != 2 {
		return status, nil, fmt.Errorf("invalid Spire release repository %q", releaseRepo)
	}

	releases, _, err := s.githubClient.Repositories.ListReleases(
		ctx,
		repoParts[0],
		repoParts[1],
		&github.ListOptions{PerPage: 100},
	)
	if err != nil {
		return status, nil, fmt.Errorf("load GitHub releases: %w", err)
	}

	selected, err := selectBestRelease(releases, appEnv.Version, channel, s.goos, s.goarch)
	if err != nil {
		return status, nil, err
	}
	if selected == nil {
		return status, nil, nil
	}

	releaseType := "Stable"
	if selected.release.GetPrerelease() {
		releaseType = "Beta"
	}

	status.Available = true
	status.Release = &ReleaseInfo{
		TagName:     selected.release.GetTagName(),
		Name:        selected.release.GetName(),
		Body:        selected.release.GetBody(),
		HTMLURL:     selected.release.GetHTMLURL(),
		Prerelease:  selected.release.GetPrerelease(),
		ReleaseType: releaseType,
		AssetName:   selected.asset.GetName(),
	}

	return status, selected, nil
}

func newDefaultGitHubClient() *github.Client {
	return github.NewClient(&http.Client{Timeout: 5 * time.Second})
}
