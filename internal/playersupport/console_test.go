package playersupport

import (
	"errors"
	"strings"
	"testing"
)

func TestKickName(t *testing.T) {
	for _, name := range []string{"Aranel", "a", strings.Repeat("x", 63)} {
		if !kickName.MatchString(name) {
			t.Errorf("%q should be accepted", name)
		}
	}
	for _, name := range []string{"", "Aranel2", "Aranel Smith", "Aranel\nworldshutdown", strings.Repeat("x", 64), "Ärnel"} {
		if kickName.MatchString(name) {
			t.Errorf("%q should be rejected", name)
		}
		if got := kick("127.0.0.1:1", nil, name); got != KickInvalid {
			t.Errorf("kick(%q) = %q, want invalid before contacting World", name, got)
		}
	}
	if got := kick("", nil, "Aranel"); got != KickUnavailable {
		t.Errorf("kick without a local World = %q", got)
	}
}

func TestClassifyPetitionClose(t *testing.T) {
	cases := []struct {
		reply string
		err   error
		want  string
	}{
		{`{"status":"closed"}`, nil, PetitionClosed},
		{`{"status":"checked_out"}`, nil, PetitionCheckedOut},
		{`{"status":"gone"}`, nil, PetitionGone},
		{`{"status":"stale"}`, nil, PetitionStale},
		{`{"status":"unavailable"}`, nil, PetitionUnavailable},
		{`{"status":"something"}`, nil, PetitionUnavailable},
		{"Command not found: supportpetition", nil, PetitionNoCommand},
		{"", errors.New("timeout"), PetitionUnconfirmed},
		{"garbage", nil, PetitionUnavailable},
	}
	for _, test := range cases {
		if got := classifyPetitionClose(test.reply, test.err); got != test.want {
			t.Errorf("classifyPetitionClose(%q, %v) = %q, want %q", test.reply, test.err, got, test.want)
		}
	}
}
