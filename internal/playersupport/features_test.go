package playersupport

import (
	"errors"
	"testing"
)

func TestClassifyFeatures(t *testing.T) {
	all := Features{Patch: 3, ClosePetition: true, Lockouts: true, Tasks: true, Revoke: true, CorpseExp: true, Unbury: true}
	cases := []struct {
		name      string
		reply     string
		err       error
		companion CompanionStatus
		want      Features
	}{
		{"no answer", "", errors.New("connection refused"), CompanionReady, Features{}},
		{"stock World", "Command not found: supportfeatures", nil, CompanionMissing, Features{}},
		{"unknown companion", `{"status":"ok","patch":3,"features":["revoke"]}`, nil, CompanionUnknown, Features{}},
		{"current patch", "Command not found: supportfeatures", nil, CompanionReady, Features{Patch: 2}},
		{"older chat protocol", "Command not found: supportfeatures", nil, CompanionOutdated, Features{Patch: 1}},
		{"new patch", `{"status":"ok","patch":3,"features":["close_petition","lockouts","tasks","revoke","corpse_exp","unbury"]}`, nil, CompanionReady, all},
		{"unknown names ignored", `{"status":"ok","patch":4,"features":["revoke","teleport_everyone"]}`, nil, CompanionReady, Features{Patch: 4, Revoke: true}},
		{"not local admin", `{"status":"stale","patch":0,"features":[]}`, nil, CompanionReady, Features{Patch: 2}},
		{"garbage", "Login failed", nil, CompanionReady, Features{Patch: 2}},
	}
	for _, test := range cases {
		if got := classifyFeatures(test.reply, test.err, test.companion); got != test.want {
			t.Errorf("%s: classifyFeatures() = %+v, want %+v", test.name, got, test.want)
		}
	}
}
