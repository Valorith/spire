package release

import "testing"

func TestNormalizeGitHubRepository(t *testing.T) {
	cases := map[string]string{
		"EQEmuTools/spire":                          "EQEmuTools/spire",
		"https://github.com/EQEmuTools/spire":       "EQEmuTools/spire",
		"https://github.com/EQEmuTools/spire.git":   "EQEmuTools/spire",
		"git@github.com:EQEmuTools/spire.git":       "EQEmuTools/spire",
		"ssh://git@github.com/EQEmuTools/spire.git": "EQEmuTools/spire",
	}

	for input, expected := range cases {
		if got := NormalizeGitHubRepository(input); got != expected {
			t.Fatalf("NormalizeGitHubRepository(%q) = %q, want %q", input, got, expected)
		}
	}
}

func TestResolveRepositoryFallsBackToPackageJSON(t *testing.T) {
	raw := []byte(`{"spire":{"release_repository":"Valorith/spire"},"repository":{"url":"https://github.com/EQEmuTools/spire.git"}}`)
	if got := ResolveRepository("", raw, nil); got != "Valorith/spire" {
		t.Fatalf("ResolveRepository() = %q, want %q", got, "Valorith/spire")
	}
}

func TestResolveRepositoryPrefersConfigOverride(t *testing.T) {
	raw := []byte(`{"spire":{"release_repository":"Valorith/spire"}}`)

	details := ResolveRepositoryDetailsWithConfig("", "ConfiguredOrg/spire", raw, nil)
	if details.Repository != "ConfiguredOrg/spire" {
		t.Fatalf("ResolveRepositoryDetailsWithConfig().Repository = %q, want %q", details.Repository, "ConfiguredOrg/spire")
	}
	if details.Source != "config" {
		t.Fatalf("ResolveRepositoryDetailsWithConfig().Source = %q, want %q", details.Source, "config")
	}
}

func TestResolveRepositoryFallsBackToGitRemotes(t *testing.T) {
	lookup := func(name string) (string, error) {
		if name == "upstream" {
			return "git@github.com:ExampleOrg/spire.git", nil
		}
		return "", nil
	}

	details := ResolveRepositoryDetails("", nil, lookup)
	if details.Repository != "ExampleOrg/spire" {
		t.Fatalf("ResolveRepositoryDetails().Repository = %q, want %q", details.Repository, "ExampleOrg/spire")
	}
	if details.Source != "git_remote_upstream" {
		t.Fatalf("ResolveRepositoryDetails().Source = %q, want %q", details.Source, "git_remote_upstream")
	}
}

func TestResolveRepositoryPrefersEnvOverride(t *testing.T) {
	raw := []byte(`{"spire":{"release_repository":"Valorith/spire"}}`)
	lookup := func(name string) (string, error) {
		return "git@github.com:ExampleOrg/spire.git", nil
	}

	details := ResolveRepositoryDetails("CustomOrg/custom-spire", raw, lookup)
	if details.Repository != "CustomOrg/custom-spire" {
		t.Fatalf("ResolveRepositoryDetails().Repository = %q, want %q", details.Repository, "CustomOrg/custom-spire")
	}
	if details.Source != "env" {
		t.Fatalf("ResolveRepositoryDetails().Source = %q, want %q", details.Source, "env")
	}
}

func TestResolveRepositoryDefaultIsValorithSpire(t *testing.T) {
	if got := ResolveRepository("", nil, nil); got != "Valorith/spire" {
		t.Fatalf("ResolveRepository() = %q, want %q", got, "Valorith/spire")
	}
}
