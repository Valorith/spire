package controllers

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestValidateDataBucketEditorInput(t *testing.T) {
	valid := dataBucketEditorInput{
		dataBucketEditorSnapshot: dataBucketEditorSnapshot{
			Key: "season.progress", Value: `{"stage":3}`, CharacterID: 42, ZoneID: 202,
		},
		Reason: "Correcting progression state",
	}
	if err := validateDataBucketEditorInput(valid); err != nil {
		t.Fatalf("validateDataBucketEditorInput(valid) error = %v", err)
	}

	tests := []dataBucketEditorInput{
		{dataBucketEditorSnapshot: dataBucketEditorSnapshot{Key: ""}, Reason: "Missing key"},
		{dataBucketEditorSnapshot: dataBucketEditorSnapshot{Key: "valid", ZoneID: 70000}, Reason: "Bad zone"},
		{dataBucketEditorSnapshot: dataBucketEditorSnapshot{Key: "valid"}, Reason: "   "},
	}
	for _, input := range tests {
		if err := validateDataBucketEditorInput(input); err == nil {
			t.Fatalf("validateDataBucketEditorInput(%+v) expected an error", input)
		}
	}
}

func TestDataBucketScopeClassification(t *testing.T) {
	kind, labels := dataBucketRecordScope(dataBucketEditorRecord{})
	if kind != "global" || len(labels) != 1 {
		t.Fatalf("global scope = %q %#v", kind, labels)
	}
	kind, labels = dataBucketRecordScope(dataBucketEditorRecord{
		CharacterID: 42, CharacterName: "Tester", ZoneID: 202, ZoneName: "Plane of Knowledge",
	})
	if kind != "composite" || len(labels) != 2 {
		t.Fatalf("composite scope = %q %#v", kind, labels)
	}
}

func TestQGlobalIdentityRoundTrip(t *testing.T) {
	original := qGlobalEditorIdentity{CharID: 42, NpcID: 7, ZoneID: 202, Name: "flag:name/with spaces"}
	encoded := encodeQGlobalIdentity(original)
	decoded, err := decodeQGlobalIdentity(encoded)
	if err != nil {
		t.Fatalf("decodeQGlobalIdentity() error = %v", err)
	}
	if decoded != original {
		t.Fatalf("decodeQGlobalIdentity() = %+v, want %+v", decoded, original)
	}
	if _, err := decodeQGlobalIdentity("not-base64"); err == nil {
		t.Fatal("decodeQGlobalIdentity(invalid) expected an error")
	}
}

func TestQGlobalSnapshotTreatsLegacyPermanentValuesEqually(t *testing.T) {
	zero := int64(0)
	base := qGlobalEditorSnapshot{
		qGlobalEditorIdentity: qGlobalEditorIdentity{Name: "legacy_permanent"},
		Value:                 "1",
	}
	withZero := base
	withZero.Expdate = &zero
	if !qGlobalSnapshotsEqual(base, withZero) {
		t.Fatal("expected NULL and zero QGlobal expirations to share permanent semantics")
	}
}

func TestQGlobalScopeOverlap(t *testing.T) {
	tests := []struct {
		name  string
		left  qGlobalEditorRecord
		right qGlobalEditorRecord
		want  bool
	}{
		{
			name:  "wildcard intersects specific",
			left:  qGlobalEditorRecord{},
			right: qGlobalEditorRecord{CharID: 42, NpcID: 7, ZoneID: 202},
			want:  true,
		},
		{
			name:  "shared character intersects narrower zone",
			left:  qGlobalEditorRecord{CharID: 42},
			right: qGlobalEditorRecord{CharID: 42, ZoneID: 202},
			want:  true,
		},
		{
			name:  "different specific characters cannot intersect",
			left:  qGlobalEditorRecord{CharID: 42},
			right: qGlobalEditorRecord{CharID: 43},
			want:  false,
		},
		{
			name:  "different specific zones cannot intersect",
			left:  qGlobalEditorRecord{NpcID: 7, ZoneID: 202},
			right: qGlobalEditorRecord{NpcID: 7, ZoneID: 203},
			want:  false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := qGlobalScopesOverlap(test.left, test.right); got != test.want {
				t.Fatalf("qGlobalScopesOverlap() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestValidateQGlobalEditorInput(t *testing.T) {
	expires := int64(2_000_000_000)
	valid := qGlobalEditorInput{
		qGlobalEditorSnapshot: qGlobalEditorSnapshot{
			qGlobalEditorIdentity: qGlobalEditorIdentity{Name: "raid_access", CharID: 42},
			Value:                 "enabled",
			Expdate:               &expires,
		},
		Reason: "Granting scheduled raid access",
	}
	if err := validateQGlobalEditorInput(valid); err != nil {
		t.Fatalf("validateQGlobalEditorInput(valid) error = %v", err)
	}
	valid.Name = ""
	if err := validateQGlobalEditorInput(valid); err == nil {
		t.Fatal("validateQGlobalEditorInput(empty name) expected an error")
	}
}

func TestChatChannelPasswordNeverEntersAuditPayload(t *testing.T) {
	input := chatChannelInput{
		ID: 8, Name: "Guides", Owner: "*System*", MinStatus: 50,
		PasswordMode: "replace", Password: "highly-secret", Reason: "Rotating staff access",
	}
	payload := chatChannelAuditPayload("update", input, &chatChannelSnapshot{
		Name: "Guides", Owner: "*System*", MinStatus: 50, HasPassword: true,
	})
	encoded, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	if strings.Contains(string(encoded), input.Password) {
		t.Fatalf("audit payload contains channel password: %s", encoded)
	}
	if err := validateChatChannelInput(input, false); err != nil {
		t.Fatalf("validateChatChannelInput(valid) error = %v", err)
	}
}

func TestChatAdministrationValidation(t *testing.T) {
	if owner := normalizedChatOwner("  "); owner != "*System*" {
		t.Fatalf("normalizedChatOwner(blank) = %q", owner)
	}
	if err := validateChatChannelInput(chatChannelInput{
		Name: "Public", MinStatus: 251, Reason: "Testing invalid status",
	}, true); err == nil {
		t.Fatal("validateChatChannelInput(status 251) expected an error")
	}
	if err := validateReservedNameInput(chatReservedNameInput{
		Name: "Support", Reason: "Protecting the support channel",
	}); err != nil {
		t.Fatalf("validateReservedNameInput(valid) error = %v", err)
	}
	if err := validateSaylinkInput(chatSaylinkInput{
		Phrase: "hail", Reason: "Adding a reusable greeting",
	}); err != nil {
		t.Fatalf("validateSaylinkInput(valid) error = %v", err)
	}
}
