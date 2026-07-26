package controllers

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestValidateMercenaryInput(t *testing.T) {
	valid := mercenaryEditorInput{
		OwnerCharacterID: 10,
		Name:             "Darian",
		MercSize:         1,
	}
	if err := validateMercenaryInput(valid); err != nil {
		t.Fatalf("expected valid mercenary input, got %v", err)
	}

	tests := []struct {
		name    string
		mutate  func(*mercenaryEditorInput)
		message string
	}{
		{
			name:    "missing owner",
			mutate:  func(input *mercenaryEditorInput) { input.OwnerCharacterID = 0 },
			message: "Select an owner character",
		},
		{
			name:    "missing name",
			mutate:  func(input *mercenaryEditorInput) { input.Name = " " },
			message: "Mercenary name is required",
		},
		{
			name:    "oversized name",
			mutate:  func(input *mercenaryEditorInput) { input.Name = strings.Repeat("a", 65) },
			message: "Mercenary name cannot exceed 64 characters",
		},
		{
			name:    "invalid size",
			mutate:  func(input *mercenaryEditorInput) { input.MercSize = 0 },
			message: "Mercenary size must be greater than 0 and no more than 255",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			input := valid
			test.mutate(&input)
			if err := validateMercenaryInput(input); err == nil || err.Error() != test.message {
				t.Fatalf("expected %q, got %v", test.message, err)
			}
		})
	}
}

func TestMercenaryCopyName(t *testing.T) {
	if got := mercenaryCopyName("Darian"); got != "Darian Copy" {
		t.Fatalf("expected copy suffix, got %q", got)
	}
	got := mercenaryCopyName(strings.Repeat("a", 64))
	if len(got) != 64 || !strings.HasSuffix(got, " Copy") {
		t.Fatalf("expected bounded copy name, got %q (%d characters)", got, len(got))
	}
}

func TestValidateMercenaryBuffInput(t *testing.T) {
	if err := validateMercenaryBuffInput(mercenaryBuffInput{SpellID: 3, CasterLevel: 65}); err != nil {
		t.Fatalf("expected valid buff input, got %v", err)
	}
	if err := validateMercenaryBuffInput(mercenaryBuffInput{}); err == nil {
		t.Fatal("expected missing spell to be rejected")
	}
	if err := validateMercenaryBuffInput(mercenaryBuffInput{SpellID: 3, CasterLevel: 256}); err == nil {
		t.Fatal("expected caster level over 255 to be rejected")
	}
}

func TestMercenaryPaginationBounds(t *testing.T) {
	tests := []struct {
		name      string
		query     string
		wantPage  int
		wantLimit int
	}{
		{name: "defaults", wantPage: 1, wantLimit: mercenaryEditorDefaultPageSize},
		{name: "valid values", query: "?page=3&limit=50", wantPage: 3, wantLimit: 50},
		{name: "limit clamp", query: "?page=2&limit=999", wantPage: 2, wantLimit: mercenaryEditorMaxPageSize},
		{name: "page clamp", query: "?page=100001", wantPage: mercenaryEditorMaxPage, wantLimit: mercenaryEditorDefaultPageSize},
		{name: "non-positive fallback", query: "?page=0&limit=-1", wantPage: 1, wantLimit: mercenaryEditorDefaultPageSize},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			e := echo.New()
			request := httptest.NewRequest("GET", "/mercenary-editor/mercenaries"+test.query, nil)
			context := e.NewContext(request, httptest.NewRecorder())
			page, limit := mercenaryPagination(context)
			if page != test.wantPage || limit != test.wantLimit {
				t.Fatalf("expected page %d and limit %d, got page %d and limit %d", test.wantPage, test.wantLimit, page, limit)
			}
		})
	}
}
