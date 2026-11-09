package controllers

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestSupportMissingItems(t *testing.T) {
	sword := supportInventoryRow{Slot: 13, ItemID: 5001}
	augmented := supportInventoryRow{Slot: 14, ItemID: 5001, A1: 9001}
	arrows := supportInventoryRow{Slot: 23, ItemID: 8005, Charges: 40}
	had := []supportInventoryRow{sword, augmented, arrows, {Slot: 24, ItemID: 13006}}
	// The plain sword moved bags and 15 arrows were used; the augmented sword
	// and the ration are gone.
	has := []supportInventoryRow{{Slot: 251, ItemID: 5001}, {Slot: 23, ItemID: 8005, Charges: 25}}
	got := supportMissingItems(had, has, map[uint]bool{8005: true, 13006: true})
	want := map[supportItemKey][2]int{
		{ID: 5001, Augments: [6]uint{9001}}: {1, 0},
		{ID: 8005}:                          {40, 25},
		{ID: 13006}:                         {1, 0},
	}
	if len(got) != len(want) {
		t.Fatalf("missing = %v, want %v", got, want)
	}
	for key, counts := range want {
		if got[key] != counts {
			t.Errorf("%+v = %v, want %v", key, got[key], counts)
		}
	}
}

func TestSupportAlertMessage(t *testing.T) {
	body := supportAlertMessage([]supportAlertPetition{
		{Petid: 7, Charname: "Vayle", Zone: "tutorial", Urgency: 2, Petitiontext: "@everyone   I am\nstuck " + strings.Repeat("x", 400)},
	}, 3)
	var message struct {
		Content         string `json:"content"`
		AllowedMentions struct {
			Parse []string `json:"parse"`
		} `json:"allowed_mentions"`
	}
	if err := json.Unmarshal(body, &message); err != nil {
		t.Fatal(err)
	}
	if message.AllowedMentions.Parse == nil || len(message.AllowedMentions.Parse) != 0 {
		t.Error("mentions must be disabled")
	}
	for _, want := range []string{"**New petition #7** from Vayle in tutorial · urgent", "> @everyone I am stuck x", "...", "and 3 more"} {
		if !strings.Contains(message.Content, want) {
			t.Errorf("content %q is missing %q", message.Content, want)
		}
	}
	if len(message.Content) > 2000 {
		t.Errorf("content is %d characters; Discord allows 2,000", len(message.Content))
	}
}

func TestSupportDiscordURL(t *testing.T) {
	for url, ok := range map[string]bool{
		"https://discord.com/api/webhooks/1/abc":     true,
		"https://discordapp.com/api/webhooks/1/abc":  true,
		"http://discord.com/api/webhooks/1/abc":      false,
		"https://example.com/api/webhooks/1/abc":     false,
		"https://discord.com.evil.test/api/webhooks": false,
	} {
		if supportDiscordURL(url) != ok {
			t.Errorf("supportDiscordURL(%q) = %v, want %v", url, !ok, ok)
		}
	}
}

func TestSupportMedian(t *testing.T) {
	if supportMedian(nil) != nil {
		t.Error("median of nothing should be nil")
	}
	if got := *supportMedian([]float64{9, 1, 5}); got != 5 {
		t.Errorf("odd median = %v", got)
	}
	if got := *supportMedian([]float64{4, 1, 3, 2}); got != 2.5 {
		t.Errorf("even median = %v", got)
	}
}
