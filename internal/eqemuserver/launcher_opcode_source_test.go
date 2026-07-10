package eqemuserver

import "testing"

func TestGetOpcodeSourceBaseURL(t *testing.T) {
	tests := []struct {
		name       string
		configured string
		want       string
		wantError  bool
	}{
		{
			name: "defaults to upstream Server repository",
			want: "https://raw.githubusercontent.com/EQEmu/Server/master/utils/patches",
		},
		{
			name:       "resolves configured Server repository",
			configured: "https://github.com/Valorith/Server",
			want:       "https://raw.githubusercontent.com/Valorith/Server/master/utils/patches",
		},
		{
			name:       "rejects non Server repository",
			configured: "https://github.com/Valorith/spire",
			wantError:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			launcher := &Launcher{opcodeSource: tt.configured}
			got, err := launcher.getOpcodeSourceBaseURL()
			if tt.wantError {
				if err == nil {
					t.Fatal("getOpcodeSourceBaseURL() error = nil, want an error")
				}
				return
			}
			if err != nil {
				t.Fatalf("getOpcodeSourceBaseURL() error = %v", err)
			}
			if got != tt.want {
				t.Fatalf("getOpcodeSourceBaseURL() = %q, want %q", got, tt.want)
			}
		})
	}
}
