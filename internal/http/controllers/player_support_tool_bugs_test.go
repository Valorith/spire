package controllers

import (
	"net/http"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestBugReportAction(t *testing.T) {
	for _, test := range []struct {
		input supportBugReportInput
		want  string
	}{
		{supportBugReportInput{Action: "link"}, ""},
		{supportBugReportInput{Action: "unlink"}, ""},
		{supportBugReportInput{Action: "review", Note: strings.Repeat("é", 1000)}, ""},
		{supportBugReportInput{Action: "review", Note: "  " + strings.Repeat("x", 1000) + "  "}, ""},
		{supportBugReportInput{Action: "review", Note: strings.Repeat("x", 1001)}, "Keep the note to 1,000 characters"},
		{supportBugReportInput{Action: "delete"}, "Unknown bug report action"},
		{supportBugReportInput{}, "Unknown bug report action"},
	} {
		err := test.input.validate()
		if test.want == "" {
			if err != nil {
				t.Errorf("%+v: %v", test.input.Action, err)
			}
			continue
		}
		if toolHTTPCode(err) != http.StatusBadRequest || err.(*echo.HTTPError).Message != test.want {
			t.Errorf("%s: %v, want 400 %q", test.input.Action, err, test.want)
		}
	}

	db := toolDryRunDB(t)
	statement := supportBugReportOwner(db.Table("bug_reports"), 7, []uint{22, 23}).Where("id = ?", 12).
		Find(&[]supportBugReport{}).Statement
	if text := statement.SQL.String(); !strings.Contains(text, "(account_id = ? OR character_id IN (?,?))") || !strings.Contains(text, "id = ?") {
		t.Errorf("owner clause = %s", text)
	}
}
