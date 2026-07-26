package controllers

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestValidateMailInput(t *testing.T) {
	valid := mailEditorInput{
		CharacterID: 1,
		From:        "Server Staff",
		Subject:     "Welcome",
		Body:        "Welcome to the server.",
		To:          "Alder",
		Status:      mailStatusUnread,
		Reason:      "Initial welcome message",
	}
	if err := validateMailInput(valid, nil); err != nil {
		t.Fatalf("validateMailInput(valid) error = %v", err)
	}

	for name, mutate := range map[string]func(*mailEditorInput){
		"recipient": func(input *mailEditorInput) { input.CharacterID = 0 },
		"sender":    func(input *mailEditorInput) { input.From = "" },
		"subject":   func(input *mailEditorInput) { input.Subject = "" },
		"status":    func(input *mailEditorInput) { input.Status = 0 },
		"reason":    func(input *mailEditorInput) { input.Reason = "short" },
	} {
		t.Run(name, func(t *testing.T) {
			input := valid
			mutate(&input)
			if err := validateMailInput(input, nil); err == nil {
				t.Fatalf("validateMailInput(%s) expected an error", name)
			}
		})
	}

	legacy := valid
	legacy.Status = 9
	currentStatus := int8(9)
	if err := validateMailInput(legacy, &currentStatus); err != nil {
		t.Fatalf("validateMailInput(unchanged legacy status) error = %v", err)
	}
}

func TestValidateParcelInput(t *testing.T) {
	valid := parcelEditorInput{
		CharacterID:  1,
		ItemID:       1001,
		SlotID:       1,
		Quantity:     1,
		FromName:     "Server Staff",
		Note:         "Restored item",
		SentDate:     "2026-07-26 20:00:00",
		Reason:       "Restoring a lost item",
		EvolveAmount: 5,
	}
	if err := validateParcelInput(valid); err != nil {
		t.Fatalf("validateParcelInput(valid) error = %v", err)
	}

	for name, mutate := range map[string]func(*parcelEditorInput){
		"recipient": func(input *parcelEditorInput) { input.CharacterID = 0 },
		"item":      func(input *parcelEditorInput) { input.ItemID = 0 },
		"quantity":  func(input *parcelEditorInput) { input.Quantity = 0 },
		"sender":    func(input *parcelEditorInput) { input.FromName = strings.Repeat("x", 65) },
		"note":      func(input *parcelEditorInput) { input.Note = strings.Repeat("x", 1025) },
		"date":      func(input *parcelEditorInput) { input.SentDate = "July 26" },
		"reason":    func(input *parcelEditorInput) { input.Reason = "short" },
	} {
		t.Run(name, func(t *testing.T) {
			input := valid
			mutate(&input)
			if err := validateParcelInput(input); err == nil {
				t.Fatalf("validateParcelInput(%s) expected an error", name)
			}
		})
	}
}

func TestMailAndParcelSemanticConstants(t *testing.T) {
	if mailStatusUnread != 1 || mailStatusRead != 3 || mailStatusTrash != 4 {
		t.Fatalf(
			"mail status semantics changed: unread=%d read=%d trash=%d",
			mailStatusUnread,
			mailStatusRead,
			mailStatusTrash,
		)
	}
	if mailParcelsDefaultCapacity < 1 {
		t.Fatal("default parcel capacity must be positive")
	}
}

func TestParcelAugmentMapping(t *testing.T) {
	input := parcelEditorInput{
		Augment1: 1,
		Augment2: 2,
		Augment3: 3,
		Augment4: 4,
		Augment5: 5,
		Augment6: 6,
	}
	got := parcelAugments(input)
	if len(got) != 6 {
		t.Fatalf("parcelAugments() len = %d, want 6", len(got))
	}
	for index, value := range got {
		if value != uint(index+1) {
			t.Fatalf("parcelAugments()[%d] = %d, want %d", index, value, index+1)
		}
	}
}

func TestValidateGMMailInputAndConfirmations(t *testing.T) {
	valid := gmMailSendInput{
		From:    "Server Staff",
		Subject: "Server message",
		Body:    "This is an authoritative player-visible message.",
		Reason:  "Planned GM announcement",
	}
	if err := validateGMMailInput(valid); err != nil {
		t.Fatalf("validateGMMailInput(valid) error = %v", err)
	}
	for name, mutate := range map[string]func(*gmMailSendInput){
		"sender":  func(input *gmMailSendInput) { input.From = "" },
		"subject": func(input *gmMailSendInput) { input.Subject = "" },
		"body":    func(input *gmMailSendInput) { input.Body = "" },
		"reason":  func(input *gmMailSendInput) { input.Reason = "short" },
	} {
		t.Run(name, func(t *testing.T) {
			input := valid
			mutate(&input)
			if err := validateGMMailInput(input); err == nil {
				t.Fatalf("validateGMMailInput(%s) expected an error", name)
			}
		})
	}
	if got := gmMailConfirmation("direct", 1); got != "SEND TO 1 CHARACTER" {
		t.Fatalf("direct confirmation = %q", got)
	}
	if got := gmMailConfirmation("broadcast", 12); got != "BROADCAST TO 12 CHARACTERS" {
		t.Fatalf("broadcast confirmation = %q", got)
	}
}

func TestGMParcelValidationAndConfiguration(t *testing.T) {
	valid := gmParcelSendInput{
		CharacterID: 1,
		FromName:    "Server Staff",
		Reason:      "Replacing event rewards",
		Items: []gmParcelSendItem{{
			ClientKey: "parcel-1",
			ItemID:    1001,
			Quantity:  1,
		}},
	}
	if err := validateGMParcelSendInput(valid); err != nil {
		t.Fatalf("validateGMParcelSendInput(valid) error = %v", err)
	}
	if got := gmParcelConfirmation(2, "Alder"); got != "SEND 2 PARCELS TO Alder" {
		t.Fatalf("parcel confirmation = %q", got)
	}

	nonStackable := mailParcelsItemReference{ID: 1001, Stackable: 0, StackSize: 1}
	line := valid.Items[0]
	line.Quantity = 2
	if err := validateGMParcelItemConfiguration(nonStackable, line); err == nil {
		t.Fatal("non-stackable quantity greater than one expected an error")
	}

	stackable := mailParcelsItemReference{ID: 1002, Stackable: 1, StackSize: 20}
	line.Quantity = 20
	if err := validateGMParcelItemConfiguration(stackable, line); err != nil {
		t.Fatalf("valid stack quantity error = %v", err)
	}
	line.Quantity = 21
	if err := validateGMParcelItemConfiguration(stackable, line); err == nil {
		t.Fatal("quantity above stack size expected an error")
	}
}

func TestParcelAugmentSocketCompatibility(t *testing.T) {
	item := mailParcelsItemReference{
		AugmentSlot1: 1,
		AugmentSlot2: 2,
		AugmentSlot3: 4,
		AugmentSlot4: 8,
		AugmentSlot5: 16,
		AugmentSlot6: 20,
	}
	got := itemAugmentSlotTypes(item)
	want := []int{1, 2, 4, 8, 16, 20}
	for index := range want {
		if got[index] != want[index] {
			t.Fatalf("itemAugmentSlotTypes()[%d] = %d, want %d", index, got[index], want[index])
		}
	}
	if !augmentFitsSocket(1, 1) {
		t.Fatal("augment type bit 1 should fit socket type 1")
	}
	if !augmentFitsSocket(5, 1) || !augmentFitsSocket(5, 3) {
		t.Fatal("augment type bitmask 5 should fit socket types 1 and 3")
	}
	if augmentFitsSocket(5, 2) {
		t.Fatal("augment type bitmask 5 should not fit socket type 2")
	}
}

func TestParcelPlayerEventDataMatchesEQEmuParcelSend(t *testing.T) {
	sentDate := "2026-07-26 19:45:30"
	parcel := parcelEditorRecord{
		CharacterName: "CodexCourier",
		ItemID:        1001,
		Augment1:      2001,
		Augment3:      2003,
		Quantity:      4,
		FromName:      "Server Staff",
		SentDate:      sentDate,
	}
	item := mailParcelsItemReference{ID: 1001, Stackable: 1, StackSize: 20}
	event, err := parcelPlayerEventData(parcel, item)
	if err != nil {
		t.Fatalf("parcelPlayerEventData() error = %v", err)
	}
	if event.ItemID != 1001 || event.Augment1ID != 2001 || event.Augment3ID != 2003 {
		t.Fatalf("parcel player event item context = %#v", event)
	}
	if event.Quantity != 4 || event.Charges != 0 {
		t.Fatalf("parcel player event quantity/charges = %d/%d", event.Quantity, event.Charges)
	}
	if event.FromPlayerName != "Server Staff" || event.ToPlayerName != "CodexCourier" {
		t.Fatalf("parcel player event delivery context = %#v", event)
	}
	expectedTime, err := time.ParseInLocation("2006-01-02 15:04:05", sentDate, time.Local)
	if err != nil {
		t.Fatal(err)
	}
	if event.SentDate != uint(expectedTime.Unix()) {
		t.Fatalf("parcel player event sent date = %d, want %d", event.SentDate, expectedTime.Unix())
	}
	encoded, err := json.Marshal(event)
	if err != nil {
		t.Fatal(err)
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(encoded, &payload); err != nil {
		t.Fatal(err)
	}
	for _, key := range []string{
		"item_id", "item_unique_id", "augment_1_id", "augment_2_id", "augment_3_id",
		"augment_4_id", "augment_5_id", "augment_6_id", "quantity", "charges",
		"from_player_name", "to_player_name", "sent_date",
	} {
		if _, ok := payload[key]; !ok {
			t.Fatalf("EQEmu PlayerEvent::ParcelSend key %q is missing from %s", key, encoded)
		}
	}

	chargedItem := mailParcelsItemReference{ID: 1002, Stackable: 0, MaxCharges: 5}
	if got := parcelPlayerEventCharges(chargedItem, 3); got != 3 {
		t.Fatalf("charged parcel item event charges = %d, want 3", got)
	}
}

func TestUniquePositiveIDs(t *testing.T) {
	got := uniquePositiveIDs([]uint{3, 0, 2, 3, 2, 1})
	want := []uint{3, 2, 1}
	if len(got) != len(want) {
		t.Fatalf("uniquePositiveIDs() = %#v", got)
	}
	for index := range want {
		if got[index] != want[index] {
			t.Fatalf("uniquePositiveIDs()[%d] = %d, want %d", index, got[index], want[index])
		}
	}
}
