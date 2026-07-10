package questapi

import "testing"

func TestNormalizeRepositorySource(t *testing.T) {
	tests := []struct {
		name     string
		org      string
		repo     string
		branch   string
		defaults RepositorySource
		want     RepositorySource
		wantErr  bool
	}{
		{
			name:     "uses current definition defaults",
			defaults: DefaultDefinitionSource,
			want:     DefaultDefinitionSource,
		},
		{
			name:     "accepts a fork and feature branch",
			org:      "Valorith",
			repo:     "Server.git",
			branch:   "feature/quest-api",
			defaults: DefaultDefinitionSource,
			want: RepositorySource{
				Org:    "Valorith",
				Repo:   "Server",
				Branch: "feature/quest-api",
			},
		},
		{
			name:     "rejects path traversal in ref",
			org:      "Valorith",
			repo:     "Server",
			branch:   "../master",
			defaults: DefaultDefinitionSource,
			wantErr:  true,
		},
		{
			name:     "rejects invalid repository segment",
			org:      "Valorith",
			repo:     "Server/Other",
			branch:   "master",
			defaults: DefaultDefinitionSource,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeRepositorySource(tt.org, tt.repo, tt.branch, tt.defaults)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected an error, got source %+v", got)
				}
				return
			}

			if err != nil {
				t.Fatalf("normalizeRepositorySource() error = %v", err)
			}
			if got != tt.want {
				t.Fatalf("normalizeRepositorySource() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestHasQuestApiDefinitions(t *testing.T) {
	if hasQuestApiDefinitions(Response{}) {
		t.Fatal("empty response should not be considered a valid Quest API source")
	}

	response := Response{PerlApi: PerlApi{PerlMethods: map[string][]PerlMethod{
		"Mob": {},
	}}}
	if !hasQuestApiDefinitions(response) {
		t.Fatal("response with parsed Perl method types should be valid")
	}
}
