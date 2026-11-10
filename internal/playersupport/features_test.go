package playersupport

import (
	"encoding/json"
	"errors"
	"testing"
)

func TestClassifyFeatures(t *testing.T) {
	six := Features{Patch: 3, ClosePetition: true, Lockouts: true, Tasks: true, Revoke: true, CorpseExp: true, Unbury: true}
	all := six
	all.Marquee = true
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
		{"patch 3 before marquee", `{"status":"ok","patch":3,"features":["close_petition","lockouts","tasks","revoke","corpse_exp","unbury"]}`, nil, CompanionReady, six},
		{"new patch", `{"status":"ok","patch":3,"features":["close_petition","lockouts","tasks","revoke","corpse_exp","unbury","marquee"]}`, nil, CompanionReady, all},
		{"marquee only", `{"status":"ok","patch":3,"features":["marquee"]}`, nil, CompanionReady, Features{Patch: 3, Marquee: true}},
		{"older chat protocol ignores marquee", "Command not found: supportfeatures", nil, CompanionOutdated, Features{Patch: 1}},
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

// The page reads each feature by its JSON name.
func TestFeaturesJSON(t *testing.T) {
	data, err := json.Marshal(Features{Patch: 3, Revoke: true, Marquee: true})
	if err != nil {
		t.Fatal(err)
	}
	want := `{"patch":3,"close_petition":false,"lockouts":false,"tasks":false,"revoke":true,"corpse_exp":false,"unbury":false,"marquee":true}`
	if string(data) != want {
		t.Errorf("JSON = %s, want %s", data, want)
	}
}
