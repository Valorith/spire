package controllers

import (
	"strings"
	"testing"
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
