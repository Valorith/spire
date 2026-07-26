package controllers

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestValidateContentFlagEditorInput(t *testing.T) {
	valid := contentFlagEditorInput{
		FlagName: "don_nest_unlocked",
		Enabled:  true,
		Notes:    "Unlocks the Accursed Nest.",
	}
	if err := validateContentFlagEditorInput(valid); err != nil {
		t.Fatalf("validateContentFlagEditorInput(valid) error = %v", err)
	}

	for _, test := range []struct {
		name  string
		input contentFlagEditorInput
		want  string
	}{
		{name: "missing name", input: contentFlagEditorInput{}, want: "required"},
		{name: "comma", input: contentFlagEditorInput{FlagName: "alpha,beta"}, want: "comma"},
		{
			name:  "too long",
			input: contentFlagEditorInput{FlagName: strings.Repeat("a", contentFlagEditorNameLimit+1)},
			want:  "characters",
		},
		{name: "control character", input: contentFlagEditorInput{FlagName: "alpha\nflag"}, want: "control"},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := validateContentFlagEditorInput(test.input)
			if err == nil || !strings.Contains(strings.ToLower(err.Error()), test.want) {
				t.Fatalf("validateContentFlagEditorInput() error = %v, want %q", err, test.want)
			}
		})
	}
}

func TestContentFlagEditorPagination(t *testing.T) {
	e := echo.New()
	request := httptest.NewRequest("GET", "/?page=0&limit=500", nil)
	context := e.NewContext(request, nil)

	page, limit := contentFlagEditorPagination(context)
	if page != 1 || limit != contentFlagEditorMaxPageSize {
		t.Fatalf(
			"contentFlagEditorPagination() = (%d, %d), want (1, %d)",
			page,
			limit,
			contentFlagEditorMaxPageSize,
		)
	}
}

func TestContentFlagReferenceDefinitionsAreSafeAndComplete(t *testing.T) {
	expectedTables := []string{
		"blocked_spells",
		"doors",
		"fishing",
		"forage",
		"global_loot",
		"ground_spawns",
		"lootdrop",
		"lootdrop_entries",
		"loottable",
		"merchantlist",
		"npc_spells_entries",
		"object",
		"spawn2",
		"spawnentry",
		"starting_items",
		"start_zones",
		"tradeskill_recipe",
		"traps",
		"zone",
		"zone_points",
	}
	seen := make(map[string]bool)
	for _, definition := range contentFlagReferenceDefinitions {
		if seen[definition.Table] {
			t.Fatalf("duplicate reference definition for table %q", definition.Table)
		}
		seen[definition.Table] = true
		if definition.TableLabel == "" ||
			definition.KeyExpression == "" ||
			definition.LabelExpression == "" ||
			definition.ContextExpression == "" {
			t.Fatalf("incomplete reference definition for table %q", definition.Table)
		}
	}
	for _, table := range expectedTables {
		if !seen[table] {
			t.Errorf("missing content flag reference definition for table %q", table)
		}
	}
	if len(seen) != len(expectedTables) {
		t.Fatalf("reference definition count = %d, want %d", len(seen), len(expectedTables))
	}
}

func TestContentFlagReplacementExpressionUsesExactCsvTokens(t *testing.T) {
	condition := contentFlagTokenCondition("content_flags")
	if !strings.Contains(condition, "FIND_IN_SET") || !strings.Contains(condition, "`content_flags`") {
		t.Fatalf("contentFlagTokenCondition() = %q, want exact token matching", condition)
	}

	expression := contentFlagReplacementExpression("content_flags_disabled")
	for _, fragment := range []string{
		"`content_flags_disabled`",
		"CONCAT(',', ?, ',')",
		"TRIM(BOTH ','",
	} {
		if !strings.Contains(expression, fragment) {
			t.Fatalf("contentFlagReplacementExpression() = %q, missing %q", expression, fragment)
		}
	}
}
