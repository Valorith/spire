package controllers

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
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

// TestSupportMoveCaseLinks runs the merge's link move against a dry-run
// database whose callbacks keep the links table, unique index included, in memory.
func TestSupportMoveCaseLinks(t *testing.T) {
	type link struct {
		caseID uint
		kind   string
		ref    uint
	}
	setup := func(table *[]link, deleteErr error) (*gorm.DB, *[]string) {
		t.Helper()
		db := toolDryRunDB(t)
		var statements []string
		query := func(tx *gorm.DB) {
			statements = append(statements, tx.Statement.SQL.String())
			rows, ok := tx.Statement.Dest.(*[]models.PlayerSupportCaseLink)
			if !ok {
				return
			}
			for _, row := range *table {
				if row.caseID == tx.Statement.Vars[0].(uint) {
					*rows = append(*rows, models.PlayerSupportCaseLink{CaseID: row.caseID, Kind: row.kind, RefID: row.ref})
				}
			}
		}
		remove := func(tx *gorm.DB) {
			statements = append(statements, tx.Statement.SQL.String())
			if deleteErr != nil {
				_ = tx.AddError(deleteErr)
				return
			}
			vars := tx.Statement.Vars
			refs := map[uint]bool{}
			for _, ref := range vars[2:] {
				refs[ref.(uint)] = true
			}
			var kept []link
			for _, row := range *table {
				if row.caseID != vars[0].(uint) || row.kind != vars[1].(string) || !refs[row.ref] {
					kept = append(kept, row)
				}
			}
			*table = kept
		}
		update := func(tx *gorm.DB) {
			statements = append(statements, tx.Statement.SQL.String())
			to, from := tx.Statement.Vars[0].(uint), tx.Statement.Vars[1].(uint)
			for i, row := range *table {
				if row.caseID != from {
					continue
				}
				for _, other := range *table {
					if other.caseID == to && other.kind == row.kind && other.ref == row.ref {
						_ = tx.AddError(errors.New("duplicate entry for idx_support_case_link"))
						return
					}
				}
				(*table)[i].caseID = to
			}
		}
		for _, err := range []error{
			db.Callback().Query().After("gorm:query").Register("test:links", query),
			db.Callback().Delete().After("gorm:delete").Register("test:links", remove),
			db.Callback().Update().After("gorm:update").Register("test:links", update),
		} {
			if err != nil {
				t.Fatal(err)
			}
		}
		// The merge runs this inside its own transaction; skip gorm's default
		// one, which would dial the dry-run server.
		return db.Session(&gorm.Session{SkipDefaultTransaction: true, Logger: logger.Default.LogMode(logger.Silent)}), &statements
	}

	// Case 4 merges into case 9. Report 11 is linked only to case 4, report 12
	// to both, report 13 only to case 9; case 5 is another case.
	table := []link{{4, "bug_report", 11}, {4, "bug_report", 12}, {9, "bug_report", 12}, {9, "bug_report", 13}, {5, "bug_report", 11}}
	db, statements := setup(&table, nil)
	if err := supportMoveCaseLinks(db, 4, 9); err != nil {
		t.Fatal(err)
	}
	count := map[link]int{}
	for _, row := range table {
		count[row]++
		if row.caseID == 4 {
			t.Errorf("link %+v is still on the merged case", row)
		}
	}
	for _, want := range []link{{9, "bug_report", 11}, {9, "bug_report", 12}, {9, "bug_report", 13}, {5, "bug_report", 11}} {
		if count[want] != 1 {
			t.Errorf("link %+v appears %d times, want once (table %+v)", want, count[want], table)
		}
	}
	if len(table) != 4 {
		t.Errorf("table = %+v, want 4 links", table)
	}
	for _, statement := range *statements {
		if strings.Contains(strings.ToUpper(statement), "(SELECT") {
			t.Errorf("statement uses a subquery MySQL rejects on the table it changes: %s", statement)
		}
	}

	// Nothing on the surviving case: no delete, only the move.
	table = []link{{4, "bug_report", 11}}
	db, statements = setup(&table, nil)
	if err := supportMoveCaseLinks(db, 4, 9); err != nil || len(table) != 1 || table[0].caseID != 9 {
		t.Fatalf("move without overlap = %v, %+v", err, table)
	}
	if len(*statements) != 2 {
		t.Errorf("statements = %q, want the read and the move", *statements)
	}

	// A failed delete aborts before the move, so the transaction rolls back.
	table = []link{{4, "bug_report", 12}, {9, "bug_report", 12}}
	db, _ = setup(&table, errors.New("lock wait timeout"))
	if err := supportMoveCaseLinks(db, 4, 9); err == nil || table[0].caseID != 4 {
		t.Fatalf("failed delete = %v, %+v", err, table)
	}
}
