package eqemuserverconfig

import (
	"fmt"
	"net/url"
	"strings"
)

const (
	DefaultOpcodeRepositoryURL = "https://github.com/EQEmu/Server"
	DefaultOpcodeSourceBaseURL = "https://raw.githubusercontent.com/EQEmu/Server/master/utils/patches"
)

// ResolveOpcodeSourceBaseURL converts a GitHub Server repository reference into
// the raw utils/patches directory used by the launcher. Existing direct patch
// directory URLs remain supported for backwards compatibility.
func ResolveOpcodeSourceBaseURL(source string) (string, error) {
	source = strings.TrimSpace(source)
	if source == "" {
		return DefaultOpcodeSourceBaseURL, nil
	}

	source = strings.TrimRight(source, "/")
	parsed, err := url.Parse(source)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", invalidOpcodeRepositoryError()
	}
	if parsed.Scheme != "https" && parsed.Scheme != "http" {
		return "", invalidOpcodeRepositoryError()
	}

	parts := splitURLPath(parsed.Path)
	host := strings.ToLower(parsed.Hostname())
	switch host {
	case "github.com", "www.github.com":
		return resolveGitHubOpcodeRepository(parts)
	case "raw.githubusercontent.com":
		if len(parts) >= 5 && strings.EqualFold(strings.TrimSuffix(parts[1], ".git"), "Server") && hasPatchDirectorySuffix(parts) {
			return source, nil
		}
		return "", invalidOpcodeRepositoryError()
	default:
		if hasPatchDirectorySuffix(parts) {
			return source, nil
		}
		return "", invalidOpcodeRepositoryError()
	}
}

func resolveGitHubOpcodeRepository(parts []string) (string, error) {
	if len(parts) < 2 {
		return "", invalidOpcodeRepositoryError()
	}

	owner := parts[0]
	repository := strings.TrimSuffix(parts[1], ".git")
	if owner == "" || !strings.EqualFold(repository, "Server") {
		return "", invalidOpcodeRepositoryError()
	}

	refParts := []string{"master"}
	if len(parts) > 2 {
		switch parts[2] {
		case "tree":
			if len(parts) < 4 {
				return "", invalidOpcodeRepositoryError()
			}
			refParts = parts[3:]
			if hasPatchDirectorySuffix(refParts) {
				refParts = refParts[:len(refParts)-2]
			}
		case "commit":
			if len(parts) != 4 {
				return "", invalidOpcodeRepositoryError()
			}
			refParts = parts[3:]
		default:
			return "", invalidOpcodeRepositoryError()
		}
	}

	if len(refParts) == 0 {
		return "", invalidOpcodeRepositoryError()
	}
	for _, part := range append([]string{owner, repository}, refParts...) {
		if part == "" || part == "." || part == ".." || strings.ContainsAny(part, "\\?#") {
			return "", invalidOpcodeRepositoryError()
		}
	}

	rawPath := strings.Join(append([]string{owner, repository}, refParts...), "/") + "/utils/patches"
	return (&url.URL{
		Scheme: "https",
		Host:   "raw.githubusercontent.com",
		Path:   "/" + rawPath,
	}).String(), nil
}

func splitURLPath(path string) []string {
	trimmed := strings.Trim(path, "/")
	if trimmed == "" {
		return nil
	}
	return strings.Split(trimmed, "/")
}

func hasPatchDirectorySuffix(parts []string) bool {
	return len(parts) >= 2 && parts[len(parts)-2] == "utils" && parts[len(parts)-1] == "patches"
}

func invalidOpcodeRepositoryError() error {
	return fmt.Errorf("opcode update repository must be a GitHub Server repository URL such as %s", DefaultOpcodeRepositoryURL)
}
