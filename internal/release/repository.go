package release

import (
	"encoding/json"
	"regexp"
	"strings"
)

const DefaultRepository = "Valorith/spire"

var githubRepoRegexp = regexp.MustCompile(`github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?$`)

type packageJSON struct {
	Spire struct {
		ReleaseRepository string `json:"release_repository"`
	} `json:"spire"`
	Repository struct {
		URL string `json:"url"`
	} `json:"repository"`
}

type RemoteLookup func(name string) (string, error)

type Resolution struct {
	Repository string
	Source     string
}

func NormalizeGitHubRepository(value string) string {
	repo := strings.TrimSpace(value)
	if repo == "" {
		return ""
	}

	if strings.Count(repo, "/") == 1 && !strings.Contains(repo, "://") && !strings.Contains(repo, "@") {
		return strings.TrimSuffix(repo, ".git")
	}

	match := githubRepoRegexp.FindStringSubmatch(repo)
	if len(match) != 3 {
		return ""
	}

	return strings.TrimSuffix(match[1]+"/"+match[2], ".git")
}

func RepositoryFromPackageJSON(raw []byte) string {
	if len(raw) == 0 {
		return ""
	}

	var pkg packageJSON
	if err := json.Unmarshal(raw, &pkg); err != nil {
		return ""
	}

	if repo := NormalizeGitHubRepository(pkg.Spire.ReleaseRepository); repo != "" {
		return repo
	}

	return ""
}

func ResolveRepositoryDetailsWithConfig(envOverride string, configOverride string, packageJSONRaw []byte, remoteLookup RemoteLookup) Resolution {
	if repo := NormalizeGitHubRepository(envOverride); repo != "" {
		return Resolution{
			Repository: repo,
			Source:     "env",
		}
	}

	if repo := NormalizeGitHubRepository(configOverride); repo != "" {
		return Resolution{
			Repository: repo,
			Source:     "config",
		}
	}

	if repo := RepositoryFromPackageJSON(packageJSONRaw); repo != "" {
		return Resolution{
			Repository: repo,
			Source:     "package_json",
		}
	}

	if remoteLookup != nil {
		for _, remoteName := range []string{"upstream", "origin"} {
			remoteURL, err := remoteLookup(remoteName)
			if err != nil {
				continue
			}

			if repo := NormalizeGitHubRepository(remoteURL); repo != "" {
				return Resolution{
					Repository: repo,
					Source:     "git_remote_" + remoteName,
				}
			}
		}
	}

	return Resolution{
		Repository: DefaultRepository,
		Source:     "default",
	}
}

func ResolveRepositoryDetails(override string, packageJSONRaw []byte, remoteLookup RemoteLookup) Resolution {
	return ResolveRepositoryDetailsWithConfig(override, "", packageJSONRaw, remoteLookup)
}

func ResolveRepository(override string, packageJSONRaw []byte, remoteLookup RemoteLookup) string {
	return ResolveRepositoryDetails(override, packageJSONRaw, remoteLookup).Repository
}
