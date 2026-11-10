package controllers

import (
	"fmt"
	"strings"
	"testing"
	"time"
)

func TestMaskIP(t *testing.T) {
	for address, want := range map[string]string{
		"203.0.113.57":                 "203.0.113.x",
		" 198.51.100.4 ":               "198.51.100.x",
		"2001:db8:85a3::8a2e:370:7334": "2001:db8:85a3:x",
		"2001:0db8:0000:0000::1":       "2001:db8:0:x",
		"::ffff:203.0.113.57":          "203.0.113.x",
		"":                             "hidden",
		"localhost":                    "hidden",
		"203.0.113":                    "hidden",
		"203.0.113.57; DROP":           "hidden",
	} {
		if got := supportMaskIP(address); got != want {
			t.Errorf("supportMaskIP(%q) = %q, want %q", address, got, want)
		}
	}
}

func TestLinkedAccountFilter(t *testing.T) {
	own := []string{"127.0.0.1", "::1", "", "0.0.0.0", "203.0.113.57", "203.0.113.57", "198.51.100.4", "192.0.2.10"}
	accounts := map[string]int{"203.0.113.57": 3, "198.51.100.4": supportSharedIPLimit + 1, "192.0.2.10": supportSharedIPLimit}
	usable, considered, hidden := supportUsableIPs(own, accounts)
	if strings.Join(usable, ",") != "203.0.113.57,192.0.2.10" || considered != 3 || hidden != 1 {
		t.Fatalf("usable = %v, considered %d, hidden %d", usable, considered, hidden)
	}

	now := time.Now()
	linked := supportGroupLinked([]supportIPUse{
		{AccountID: 7, IP: "203.0.113.57", LastUsed: now},
		{AccountID: 5, IP: "203.0.113.57", LastUsed: now.Add(-time.Hour)},
		{AccountID: 5, IP: "192.0.2.10", LastUsed: now.Add(-2 * time.Hour)},
		{AccountID: 6, IP: "192.0.2.10", LastUsed: now.Add(-time.Minute)},
		{AccountID: 8, IP: "127.0.0.1", LastUsed: now},
	}, 7)
	if len(linked) != 2 || linked[0].ID != 5 || linked[1].ID != 6 {
		t.Fatalf("linked = %+v", linked)
	}
	if len(linked[0].Shared) != 2 || linked[0].Shared[0].IP != "203.0.113.x" || linked[0].Shared[1].IP != "192.0.2.x" {
		t.Errorf("shared addresses = %+v", linked[0].Shared)
	}
	for _, account := range linked {
		for _, shared := range account.Shared {
			if !strings.HasSuffix(shared.IP, ".x") {
				t.Errorf("unmasked address %q", shared.IP)
			}
		}
	}

	many := []supportIPUse{}
	for id := uint(1); id <= supportLinkedLimit+10; id++ {
		many = append(many, supportIPUse{AccountID: id + 100, IP: fmt.Sprintf("192.0.2.%d", id), LastUsed: now})
	}
	if got := len(supportGroupLinked(many, 7)); got != supportLinkedLimit {
		t.Errorf("linked accounts = %d, want at most %d", got, supportLinkedLimit)
	}

	for _, test := range []struct {
		status int
		until  *time.Time
		ban    string
		want   string
	}{
		{0, nil, "", "none"},
		{-1, nil, "", "suspended"},
		{0, &[]time.Time{now.Add(time.Hour)}[0], "", "suspended"},
		{0, &[]time.Time{now.Add(-time.Hour)}[0], "", "none"},
		{-2, nil, "", "banned"},
		{0, nil, "Botting", "banned"},
	} {
		if got := supportRestriction(test.status, test.until, test.ban); got != test.want {
			t.Errorf("supportRestriction(%d, %v, %q) = %q, want %q", test.status, test.until, test.ban, got, test.want)
		}
	}
}
