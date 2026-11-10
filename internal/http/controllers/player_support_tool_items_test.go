package controllers

import (
	"regexp"
	"strings"
	"sync"
	"testing"

	"gorm.io/gorm/schema"
)

func TestItemEventPattern(t *testing.T) {
	pattern := regexp.MustCompile(supportItemEventPattern(2730))
	for data, want := range map[string]bool{
		`{"item_id": 2730, "charges": 1}`: true,
		`{"item_id":2730}`:                true,
		`{"item_id" :	2730,"x":1}`:        true,
		`{"item_id": 2730`:                true,
		`{"item_id": 27301}`:              false,
		`{"item_id": 12730}`:              false,
		`{"augment_item_id": 999}`:        false,
		`{"name": "2730"}`:                false,
	} {
		if got := pattern.MatchString(data); got != want {
			t.Errorf("match %s = %v, want %v", data, got, want)
		}
	}
	if got := supportItemEventPattern(5); got != `"item_id"[[:space:]]*:[[:space:]]*5([^0-9]|$)` {
		t.Errorf("pattern = %s", got)
	}
}

// TestToolScanColumns guards the structs the tools scan raw SQL into: gorm
// fills only the fields it maps, and it skips unexported embedded structs,
// which once left every inventory slot and instance zone at zero.
func TestToolScanColumns(t *testing.T) {
	for _, test := range []struct {
		model   interface{}
		columns []string
	}{
		{&toolItemRow{}, []string{"owner", "slot", "item_id", "charges", "a1", "a2", "a3", "a4", "a5", "a6"}},
		{&supportInstanceRow{}, []string{"instance_id", "zone_id", "version", "never_expires", "dz_name", "expires"}},
		{&supportBugReportRow{}, []string{"id", "character_name", "category", "zone", "reported_at", "status", "reviewed_by", "body"}},
		{&supportLockout{}, []string{"id", "expedition", "event", "expires_at", "remaining_seconds"}},
		{&supportSafeReturn{}, []string{"zone_id", "instance_zone_id"}},
		{&supportTaskContent{}, []string{"id", "type", "duration", "title", "reward_text", "reward_id_list", "cash_reward", "exp_reward", "reward_points", "reward_method"}},
		{&supportActivityContent{}, []string{"taskid", "activityid", "step", "target_name", "goalcount", "description_override", "optional"}},
		{&supportCorpseExp{}, []string{"id", "zone_id", "instance_id", "is_rezzed", "exp"}},
		{&supportIPUse{}, []string{"account_id", "ip", "last_used"}},
		{&supportZoneFlag{}, []string{"zone_id"}},
		{&supportKey{}, []string{"item_id"}},
		{&toolCharacter{}, []string{"id", "name"}},
	} {
		parsed, err := schema.Parse(test.model, &sync.Map{}, schema.NamingStrategy{})
		if err != nil {
			t.Fatal(err)
		}
		for _, column := range test.columns {
			if parsed.LookUpField(column) == nil {
				t.Errorf("%s does not map column %q", parsed.Name, column)
			}
		}
	}

	// Every item table's select aliases are columns toolItemRow maps, for
	// both EQEmu inventory namings, corpse items, parcels and the shared bank.
	row, err := schema.Parse(&toolItemRow{}, &sync.Map{}, schema.NamingStrategy{})
	if err != nil {
		t.Fatal(err)
	}
	alias := regexp.MustCompile(` AS (\w+)`)
	for owner, cols := range map[string]supportInventoryColumns{
		"character_id": {"character_id", "slot_id", "item_id", "charges", [6]string{"augment_one", "augment_two", "augment_three", "augment_four", "augment_five", "augment_six"}},
		"charid":       {"charid", "slotid", "itemid", "charges", [6]string{"augslot1", "augslot2", "augslot3", "augslot4", "augslot5", "augslot6"}},
		"corpse_id":    toolCorpseItemColumns,
		"id":           toolParcelColumns,
		"acctid":       {Slot: "slotid", Item: "itemid", Charges: "charges", Augments: [6]string{"augslot1", "augslot2", "augslot3", "augslot4", "augslot5", "augslot6"}},
	} {
		selects := toolItemSelect(owner, cols)
		matches := alias.FindAllStringSubmatch(selects, -1)
		if len(matches) != 10 || !strings.HasPrefix(selects, owner+" AS owner, "+cols.Slot+" AS slot, "+cols.Item+" AS item_id") {
			t.Errorf("select for %s = %s", owner, selects)
		}
		for _, match := range matches {
			if row.LookUpField(match[1]) == nil {
				t.Errorf("select for %s aliases %q, which toolItemRow does not map", owner, match[1])
			}
		}
	}
}
