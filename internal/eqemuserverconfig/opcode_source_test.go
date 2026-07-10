package eqemuserverconfig

import "testing"

func TestResolveOpcodeSourceBaseURL(t *testing.T) {
	tests := []struct {
		name      string
		source    string
		want      string
		wantError bool
	}{
		{
			name: "blank uses upstream default",
			want: DefaultOpcodeSourceBaseURL,
		},
		{
			name:   "repository root uses master",
			source: "https://github.com/Valorith/Server",
			want:   "https://raw.githubusercontent.com/Valorith/Server/master/utils/patches",
		},
		{
			name:   "git repository suffix is accepted",
			source: "https://github.com/Valorith/Server.git/",
			want:   "https://raw.githubusercontent.com/Valorith/Server/master/utils/patches",
		},
		{
			name:   "tree reference is preserved",
			source: "https://github.com/Valorith/Server/tree/opcode-testing",
			want:   "https://raw.githubusercontent.com/Valorith/Server/opcode-testing/utils/patches",
		},
		{
			name:   "tree reference may contain slashes",
			source: "https://github.com/Valorith/Server/tree/feature/opcode-testing",
			want:   "https://raw.githubusercontent.com/Valorith/Server/feature/opcode-testing/utils/patches",
		},
		{
			name:   "patch directory browser URL is accepted",
			source: "https://github.com/Valorith/Server/tree/master/utils/patches",
			want:   "https://raw.githubusercontent.com/Valorith/Server/master/utils/patches",
		},
		{
			name:   "commit reference is preserved",
			source: "https://github.com/Valorith/Server/commit/0123456789abcdef",
			want:   "https://raw.githubusercontent.com/Valorith/Server/0123456789abcdef/utils/patches",
		},
		{
			name:   "legacy raw URL remains supported",
			source: "https://raw.githubusercontent.com/Valorith/Server/master/utils/patches/",
			want:   "https://raw.githubusercontent.com/Valorith/Server/master/utils/patches",
		},
		{
			name:   "legacy direct patch directory remains supported",
			source: "https://patches.example.com/custom/utils/patches/",
			want:   "https://patches.example.com/custom/utils/patches",
		},
		{
			name:      "other repository is rejected",
			source:    "https://github.com/Valorith/spire",
			wantError: true,
		},
		{
			name:      "repository subpage is rejected",
			source:    "https://github.com/Valorith/Server/issues",
			wantError: true,
		},
		{
			name:      "non patch URL is rejected",
			source:    "https://example.com/patches",
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ResolveOpcodeSourceBaseURL(tt.source)
			if tt.wantError {
				if err == nil {
					t.Fatal("ResolveOpcodeSourceBaseURL() error = nil, want an error")
				}
				return
			}
			if err != nil {
				t.Fatalf("ResolveOpcodeSourceBaseURL() error = %v", err)
			}
			if got != tt.want {
				t.Fatalf("ResolveOpcodeSourceBaseURL() = %q, want %q", got, tt.want)
			}
		})
	}
}
