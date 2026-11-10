package controllers

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestSnapshotAccounting(t *testing.T) {
	tunic := supportItemKey{ID: 2730}
	arrows := supportItemKey{ID: 8005}
	ring := supportItemKey{ID: 5001, Augments: [6]uint{9001}}
	stackable := map[uint]bool{8005: true}
	missing := map[supportItemKey][2]int{
		tunic:  {3, 0},
		arrows: {40, 10},
		ring:   {1, 0},
	}

	// Each place in its own right.
	for name, places := range map[string]supportItemPlaces{
		"corpse":      {Corpse: map[supportItemKey]int{tunic: 3}},
		"parcel":      {Parcel: map[supportItemKey]int{tunic: 3}},
		"shared bank": {SharedBank: map[supportItemKey]int{tunic: 3}},
		"alt":         {Alt: map[supportItemKey]int{tunic: 3}},
		"restored":    {Restored: map[supportItemKey]int{tunic: 3}},
	} {
		got := supportAccountMissing(missing, places)[tunic]
		if got.total() != 3 {
			t.Errorf("%s: accounted %+v, want all 3 tunics", name, got)
		}
	}

	// Places are used in order and never beyond what is missing.
	got := supportAccountMissing(missing, supportItemPlaces{
		Corpse:     map[supportItemKey]int{tunic: 1},
		Parcel:     map[supportItemKey]int{tunic: 1},
		SharedBank: map[supportItemKey]int{arrows: 100},
		Alt:        map[supportItemKey]int{tunic: 5, arrows: 5},
		Restored:   map[supportItemKey]int{tunic: 1, ring: 2},
	})
	if want := (supportElsewhere{Corpse: 1, Parcel: 1, Alt: 1}); got[tunic] != want {
		t.Errorf("tunic = %+v, want %+v", got[tunic], want)
	}
	if want := (supportElsewhere{SharedBank: 30}); got[arrows] != want {
		t.Errorf("arrows = %+v, want %+v", got[arrows], want)
	}
	if want := (supportElsewhere{Restored: 1}); got[ring] != want {
		t.Errorf("ring = %+v, want %+v", got[ring], want)
	}
	// Negative counts never add back to what is missing.
	if got := supportAccountMissing(missing, supportItemPlaces{Corpse: map[supportItemKey]int{tunic: -4}})[tunic]; got.total() != 0 {
		t.Errorf("negative count accounted %+v", got)
	}

	// Stackables count by stack, other items once per slot, and only the
	// exact item and augments match.
	counted := supportCountItems([]supportInventoryRow{
		{ItemID: 8005, Charges: 20}, {ItemID: 8005, Charges: 5},
		{ItemID: 2730, Charges: 4}, {ItemID: 2730},
		{ItemID: 5001}, {ItemID: 5001, A1: 9001},
		{ItemID: 13006},
	}, stackable, missing)
	if counted[arrows] != 25 || counted[tunic] != 2 || counted[ring] != 1 || len(counted) != 3 {
		t.Errorf("counted = %v", counted)
	}

	// Restored batches count by quantity for stackables and keep augments.
	restored := supportRestoredItems([]supportRestore{{Items: []supportRestoreItem{
		{ItemID: 8005, Quantity: 15}, {ItemID: 2730, Quantity: 3}, {ItemID: 5001, Quantity: 1, AugmentIDs: []uint{9001, 0, 0, 0, 0, 0}},
	}}}, stackable, missing)
	if restored[arrows] != 15 || restored[tunic] != 1 || restored[ring] != 1 {
		t.Errorf("restored = %v", restored)
	}

	// A GM parcel counts as restored; its parcel ID is left out of the
	// parcel search so it is not counted twice.
	restore, ok := supportParseRestore(`{"character_id":22,"record_ids":[90,91],"details":{"items":[
		{"parcel_id":90,"item_id":2730,"quantity":1,"augment_ids":[0,0,0,0,0,0]},
		{"item_id":8005,"quantity":20}]}}`, map[uint]string{22: "Aranel"})
	if !ok || restore.Character != "Aranel" || restore.Quantity != 21 {
		t.Fatalf("parsed restore = %+v, %v", restore, ok)
	}
	if ids := restore.parcelIDs(); len(ids) != 2 || ids[0] != 90 || ids[1] != 91 {
		t.Errorf("ledger parcel IDs = %v, want [90 91]", ids)
	}
	if _, ok := supportParseRestore(`{"character_id":23,"details":{"items":[]}}`, map[uint]string{22: "Aranel"}); ok {
		t.Error("a batch to another account's character was counted")
	}
}

func TestSnapshotElsewhereNamesAltAndRestoreDate(t *testing.T) {
	tunic := supportItemKey{ID: 2730}
	arrows := supportItemKey{ID: 8005}
	ring := supportItemKey{ID: 5001, Augments: [6]uint{9001}}
	stackable := map[uint]bool{8005: true}
	missing := map[supportItemKey][2]int{tunic: {2, 0}, arrows: {40, 10}, ring: {1, 0}}

	// Alts are named in character order, and only for the items they hold.
	characters := []toolCharacter{{ID: 100, Name: "Aranel"}, {ID: 101, Name: "Thornalt"}, {ID: 102, Name: "Bramble"}, {ID: 103, Name: "Quill"}}
	names := supportAltNames([]toolItemRow{
		{Owner: 103, Row: supportInventoryRow{ItemID: 2730}},
		{Owner: 101, Row: supportInventoryRow{ItemID: 2730}},
		{Owner: 102, Row: supportInventoryRow{ItemID: 8005, Charges: 20}},
		{Owner: 101, Row: supportInventoryRow{ItemID: 5001}},
	}, characters, stackable, missing)
	if names[tunic] != "Thornalt and Quill" || names[arrows] != "Bramble" || len(names) != 2 {
		t.Errorf("alt names = %v", names)
	}
	if got := supportAltNames([]toolItemRow{
		{Owner: 101, Row: supportInventoryRow{ItemID: 2730}}, {Owner: 102, Row: supportInventoryRow{ItemID: 2730}},
		{Owner: 103, Row: supportInventoryRow{ItemID: 2730}},
	}, characters, stackable, missing)[tunic]; got != "Thornalt, Bramble and Quill" {
		t.Errorf("three alts = %q", got)
	}

	// The newest batch holding the exact item and augments dates it.
	older := time.Date(2026, 11, 2, 10, 0, 0, 0, time.UTC)
	newer := time.Date(2026, 11, 5, 18, 30, 0, 0, time.UTC)
	sent := supportRestoredAt([]supportRestore{
		{SentAt: newer, Items: []supportRestoreItem{{ItemID: 5001, Quantity: 1, AugmentIDs: []uint{9001}}}},
		{SentAt: older, Items: []supportRestoreItem{{ItemID: 5001, Quantity: 1, AugmentIDs: []uint{9001}}, {ItemID: 2730, Quantity: 1}}},
		{SentAt: newer, Items: []supportRestoreItem{{ItemID: 5001, Quantity: 1}, {ItemID: 13006, Quantity: 1}}},
	}, missing)
	if !sent[ring].Equal(newer) || !sent[tunic].Equal(older) || len(sent) != 2 {
		t.Errorf("restored at = %v", sent)
	}

	// Names and dates are kept only for a place that was counted.
	got := supportAccountMissing(missing, supportItemPlaces{
		Corpse:     map[supportItemKey]int{tunic: 2},
		Alt:        map[supportItemKey]int{tunic: 1, arrows: 5},
		Restored:   map[supportItemKey]int{ring: 1, tunic: 1},
		AltNames:   names,
		RestoredAt: sent,
	})
	if got[tunic].AltName != "" || got[tunic].RestoredAt != nil {
		t.Errorf("tunic found on a corpse = %+v", got[tunic])
	}
	if got[arrows].AltName != "Bramble" || got[arrows].Alt != 5 {
		t.Errorf("arrows = %+v", got[arrows])
	}
	if got[ring].RestoredAt == nil || !got[ring].RestoredAt.Equal(newer) {
		t.Errorf("ring = %+v", got[ring])
	}

	// The fields are left out when empty and use the names the page reads.
	plain, _ := json.Marshal(supportElsewhere{Corpse: 1})
	if strings.Contains(string(plain), "alt_name") || strings.Contains(string(plain), "restored_at") {
		t.Errorf("empty elsewhere = %s", plain)
	}
	full, _ := json.Marshal(got[arrows])
	dated, _ := json.Marshal(got[ring])
	if !strings.Contains(string(full), `"alt_name":"Bramble"`) || !strings.Contains(string(dated), `"restored_at":"2026-11-05T18:30:00Z"`) {
		t.Errorf("elsewhere = %s, %s", full, dated)
	}
}
