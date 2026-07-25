package controllers

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestFactionModifierNameRoundTrip(t *testing.T) {
	tests := []struct {
		kind    string
		valueID int
		want    string
	}{
		{kind: "race", valueID: 1, want: "r1"},
		{kind: "class", valueID: 16, want: "c16"},
		{kind: "deity", valueID: 396, want: "d396"},
	}

	for _, test := range tests {
		t.Run(test.want, func(t *testing.T) {
			name, err := formatFactionModifierName(test.kind, test.valueID)
			if err != nil {
				t.Fatalf("formatFactionModifierName() error = %v", err)
			}
			if name != test.want {
				t.Fatalf("formatFactionModifierName() = %q, want %q", name, test.want)
			}

			kind, valueID, err := parseFactionModifierName(name)
			if err != nil {
				t.Fatalf("parseFactionModifierName() error = %v", err)
			}
			if kind != test.kind || valueID != test.valueID {
				t.Fatalf("parseFactionModifierName() = (%q, %d), want (%q, %d)", kind, valueID, test.kind, test.valueID)
			}
		})
	}
}

func TestFactionModifierNameRejectsInvalidValues(t *testing.T) {
	for _, name := range []string{"", "x1", "r0", "c-nope"} {
		if _, _, err := parseFactionModifierName(name); err == nil {
			t.Errorf("parseFactionModifierName(%q) unexpectedly succeeded", name)
		}
	}

	for _, test := range []struct {
		kind    string
		valueID int
	}{
		{kind: "raw", valueID: 1},
		{kind: "race", valueID: 0},
	} {
		if _, err := formatFactionModifierName(test.kind, test.valueID); err == nil {
			t.Errorf("formatFactionModifierName(%q, %d) unexpectedly succeeded", test.kind, test.valueID)
		}
	}
}

func TestValidateFactionInput(t *testing.T) {
	minimum := int16(-2000)
	maximum := int16(2000)
	valid := factionEditorFactionInput{
		ID:   10,
		Name: "Guards of Qeynos",
		Base: 0,
		BaseData: &factionEditorBaseData{
			Min: &minimum,
			Max: &maximum,
		},
		Modifiers: []factionEditorModifier{
			{Kind: "race", ValueID: 1, Amount: 10},
			{Kind: "class", ValueID: 1, Amount: -5},
		},
	}
	if err := validateFactionInput(valid, true); err != nil {
		t.Fatalf("validateFactionInput(valid) error = %v", err)
	}

	duplicate := valid
	duplicate.Modifiers = append(duplicate.Modifiers, factionEditorModifier{Kind: "race", ValueID: 1})
	if err := validateFactionInput(duplicate, true); err == nil || !strings.Contains(err.Error(), "Duplicate modifier") {
		t.Fatalf("validateFactionInput(duplicate) error = %v, want duplicate error", err)
	}

	badBounds := valid
	badMin, badMax := int16(100), int16(-100)
	badBounds.BaseData = &factionEditorBaseData{Min: &badMin, Max: &badMax}
	if err := validateFactionInput(badBounds, true); err == nil || !strings.Contains(err.Error(), "minimum") {
		t.Fatalf("validateFactionInput(bad bounds) error = %v, want bounds error", err)
	}
}

func TestValidateNpcTemplateInput(t *testing.T) {
	valid := factionEditorNpcTemplateInput{
		ID:             15,
		Name:           "Qeynos Guards",
		PrimaryFaction: 9,
		Entries: []factionEditorNpcEntry{
			{FactionID: 9, Value: 10},
			{FactionID: 10, Value: -5},
		},
	}
	if err := validateNpcTemplateInput(valid, true); err != nil {
		t.Fatalf("validateNpcTemplateInput(valid) error = %v", err)
	}

	duplicate := valid
	duplicate.Entries = append(duplicate.Entries, factionEditorNpcEntry{FactionID: 9})
	if err := validateNpcTemplateInput(duplicate, true); err == nil || !strings.Contains(err.Error(), "more than once") {
		t.Fatalf("validateNpcTemplateInput(duplicate) error = %v, want duplicate error", err)
	}

	missingFaction := valid
	missingFaction.Entries = []factionEditorNpcEntry{{FactionID: 0}}
	if err := validateNpcTemplateInput(missingFaction, true); err == nil || !strings.Contains(err.Error(), "select a player faction") {
		t.Fatalf("validateNpcTemplateInput(missing faction) error = %v, want faction error", err)
	}
}

func TestFactionEditorNpcEntryTempPreservesSemanticModes(t *testing.T) {
	for _, test := range []struct {
		name  string
		entry factionEditorNpcEntry
		want  int8
	}{
		{name: "permanent with message", entry: factionEditorNpcEntry{Temp: 0}, want: 0},
		{name: "temporary without message", entry: factionEditorNpcEntry{Temp: 1}, want: 1},
		{name: "temporary with message", entry: factionEditorNpcEntry{Temp: 2}, want: 2},
		{name: "permanent without message", entry: factionEditorNpcEntry{Temp: 3}, want: 3},
		{name: "legacy temporary boolean", entry: factionEditorNpcEntry{Temporary: true}, want: 1},
		{name: "unknown legacy mode", entry: factionEditorNpcEntry{Temp: 7}, want: 7},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := factionEditorNpcEntryTemp(test.entry); got != test.want {
				t.Fatalf("factionEditorNpcEntryTemp() = %d, want %d", got, test.want)
			}
		})
	}
}

func TestFactionEditorPagination(t *testing.T) {
	e := echo.New()
	request := httptest.NewRequest("GET", "/?page=0&limit=500", nil)
	context := e.NewContext(request, nil)

	page, limit := factionEditorPagination(context)
	if page != 1 || limit != factionEditorMaxPageSize {
		t.Fatalf("factionEditorPagination() = (%d, %d), want (1, %d)", page, limit, factionEditorMaxPageSize)
	}
}
