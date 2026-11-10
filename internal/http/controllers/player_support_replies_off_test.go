package controllers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

func TestRepliesOffWording(t *testing.T) {
	open, closed := supportRepliesOffTell(true), supportRepliesOffTell(false)
	if open != "Replies to the Game Master on your petition are now closed. A Game Master will contact you if more is needed. Once your petition is closed, file a new one with #petition for more help." {
		t.Errorf("open tell %q", open)
	}
	if closed != "Your petition is closed, and replies to the Game Master are now closed. If you need more help, please file a new petition with #petition." {
		t.Errorf("closed tell %q", closed)
	}
	for _, tell := range []string{open, closed} {
		if !playersupport.ValidateMessage(tell) {
			t.Errorf("%q does not fit in a tell (%d characters)", tell, len(tell))
		}
	}
	wantOpen := "Hello Aranel,\n\nThis is a notice from the Game Master team about your petition.\n\n" +
		"Replies to the Game Master on your petition are now closed, so messages you send to the Game Master will not reach the team for now. If more information is needed, a Game Master will contact you.\n\n" +
		"Your petition is still open. Once it has been closed, please file a new petition in game with #petition if you need more help.\n\n" +
		"The Game Master team"
	if got := supportRepliesOffMail("Aranel", true); got != wantOpen {
		t.Errorf("open mail:\n%q\nwant\n%q", got, wantOpen)
	}
	wantClosed := "Hello Aranel,\n\nThis is a notice from the Game Master team about your petition.\n\n" +
		"Your petition has been closed, and replies to the Game Master are now closed.\n\n" +
		"If you need more help, please file a new petition in game with #petition.\n\n" +
		"The Game Master team"
	if got := supportRepliesOffMail("Aranel", false); got != wantClosed {
		t.Errorf("closed mail:\n%q\nwant\n%q", got, wantClosed)
	}
	for _, text := range []string{open, closed, wantOpen, wantClosed} {
		if strings.Contains(text, "/petition") || strings.Contains(text, "!") {
			t.Errorf("%q names /petition or exclaims", text)
		}
		if err := validateGMMailInput(gmMailSendInput{From: playersupport.Identity, Subject: supportRepliesOffSubject, Body: text, Reason: "Replies closed notice for Player Support case 731-1794116400"}); err != nil {
			t.Errorf("mail limits: %v", err)
		}
	}
}

func TestRepliesOffSummary(t *testing.T) {
	cases := []struct {
		tell   string
		mailed bool
		want   string
	}{
		{"sent", true, "The player was told in game and mailed a notice."},
		{"", true, "The player was mailed a notice."},
		{"sent", false, "The player was told in game, but the notice could not be mailed."},
		{"", false, "The notice could not be mailed to the player."},
		{"failed", true, "The player was mailed a notice. The tell to Bramble was not delivered."},
		{"unconfirmed", false, "The notice could not be mailed to the player. The tell to Bramble was not confirmed."},
	}
	for _, test := range cases {
		if got := supportRepliesOffSummary("Bramble", test.tell, test.mailed); got != test.want {
			t.Errorf("%q mailed %v: %q, want %q", test.tell, test.mailed, got, test.want)
		}
	}
}

// repliesOffTestDB is a dry-run database for the replies-closed notice: the
// account id, the account's newest petition, the reply route and the
// chat_off entry. routes is how many reply routes a delete removes.
type repliesOffTestDB struct {
	petition *supportPetitionRef
	routes   int64
	created  []*models.PlayerSupportEntry
	text     string
}

func (s *repliesOffTestDB) open(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(gormMysql.New(gormMysql.Config{DSN: "qa@tcp(127.0.0.1:1)/qa", SkipInitializeWithVersion: true}),
		&gorm.Config{DryRun: true, DisableAutomaticPing: true, DisableNestedTransaction: true, Logger: gormLogger.Default.LogMode(gormLogger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	pool, _ := db.DB()
	t.Cleanup(func() { _ = pool.Close() })
	db.Statement.ConnPool = committedPool{db.Statement.ConnPool}
	must := func(err error) {
		if err != nil {
			t.Fatal(err)
		}
	}
	must(db.Callback().Query().After("gorm:query").Register("test:off", func(tx *gorm.DB) {
		switch dest := tx.Statement.Dest.(type) {
		case *supportAccountRef:
			*dest = supportAccountRef{ID: 5}
		case *supportPetitionRef:
			if s.petition != nil {
				*dest = *s.petition
			}
		case *models.PlayerSupportCase:
			*dest = models.PlayerSupportCase{ID: 12, SourceKey: "731-1794116400", Status: "open"}
		}
	}))
	must(db.Callback().Delete().After("gorm:delete").Register("test:off", func(tx *gorm.DB) {
		tx.RowsAffected = s.routes
		s.routes = 0
	}))
	must(db.Callback().Create().After("gorm:create").Register("test:off", func(tx *gorm.DB) {
		if entry, ok := tx.Statement.Dest.(*models.PlayerSupportEntry); ok {
			entry.ID = uint(40 + len(s.created))
			s.created = append(s.created, entry)
		}
		tx.RowsAffected = 1
	}))
	must(db.Callback().Update().After("gorm:update").Register("test:off", func(tx *gorm.DB) {
		if values, ok := tx.Statement.Dest.(map[string]interface{}); ok {
			s.text, _ = values["text"].(string)
		}
		tx.RowsAffected = 1
	}))
	return db
}

// Turning replies off once records one chat_off entry; a repeated request
// finds them off and records nothing, so no second notice goes out.
func TestTurnOffRepliesOnlyOnChange(t *testing.T) {
	state := &repliesOffTestDB{routes: 1}
	db := state.open(t)
	view := supportView(models.PlayerSupportCase{ID: 12, SourceKey: "731-1794116400", Status: "open"}, models.Petition{}, 0)
	id, err := turnOffReplies(supportScope{spire: db, eqemu: db}, view)
	if err != nil || id == 0 || len(state.created) != 1 || state.created[0].Kind != "chat_off" || state.created[0].Text != "Turned off player replies" {
		t.Fatalf("first: id %d, %v, created %+v", id, err, state.created)
	}
	id, err = turnOffReplies(supportScope{spire: db, eqemu: db}, view)
	if err != nil || id != 0 || len(state.created) != 1 {
		t.Fatalf("repeat: id %d, %v, created %d", id, err, len(state.created))
	}
}

func TestNotifyRepliesOff(t *testing.T) {
	for _, test := range []struct {
		name     string
		petition *supportPetitionRef
		tell     string
		mailErr  error
		wantTell string
		wantMail string
		summary  string
	}{
		{"petition open, in game", &supportPetitionRef{Dib: 731, Senttime: 1794116400}, "sent", nil,
			supportRepliesOffTell(true), supportRepliesOffMail("Aranel", true), "The player was told in game and mailed a notice."},
		{"petition closed, offline", nil, "", nil,
			supportRepliesOffTell(false), supportRepliesOffMail("Aranel", false), "The player was mailed a notice."},
		{"another petition filed since", &supportPetitionRef{Dib: 900, Senttime: 1794200000}, "", nil,
			supportRepliesOffTell(false), supportRepliesOffMail("Aranel", false), "The player was mailed a notice."},
		{"mail fails", &supportPetitionRef{Dib: 731, Senttime: 1794116400}, "sent", errors.New("mail table is locked"),
			supportRepliesOffTell(true), supportRepliesOffMail("Aranel", true), "The player was told in game, but the notice could not be mailed."},
	} {
		state := &repliesOffTestDB{petition: test.petition}
		db := state.open(t)
		var tells []string
		var tellIDs []string
		var mails []supportNotice
		p := &PlayerSupportController{
			tellPlayer: func(_ supportScope, accountID uint, id, text string) (string, string) {
				if accountID != 5 {
					t.Errorf("%s: tell to account %d", test.name, accountID)
				}
				tells, tellIDs = append(tells, text), append(tellIDs, id)
				if test.tell == "" {
					return "", ""
				}
				return "Aranel", test.tell
			},
			mailNotice: func(_ echo.Context, _ supportScope, _ supportCaseView, notice supportNotice) error {
				mails = append(mails, notice)
				return test.mailErr
			},
		}
		c := echo.New().NewContext(httptest.NewRequest(http.MethodPut, "/", nil), httptest.NewRecorder())
		view := supportView(models.PlayerSupportCase{ID: 12, SourceKey: "731-1794116400", CharacterID: 100, Character: "Aranel", Account: "norrathguide"}, models.Petition{}, 0)
		summary := p.notifyRepliesOff(c, supportScope{spire: db, eqemu: db}, view, 12, 40)
		if summary != test.summary {
			t.Errorf("%s: summary %q, want %q", test.name, summary, test.summary)
		}
		if len(tells) != 1 || tells[0] != test.wantTell || tellIDs[0] != "replies-off-12-40" {
			t.Errorf("%s: tells %q ids %q", test.name, tells, tellIDs)
		}
		if len(mails) != 1 {
			t.Fatalf("%s: %d mails", test.name, len(mails))
		}
		mail := mails[0]
		if mail.Body != test.wantMail || mail.Subject != "Replies to your petition are closed" || mail.Key != "12-replies-off-40" ||
			mail.CaseID != 12 || mail.AccountID != 5 || mail.Reason != "Replies closed notice for Player Support case 731-1794116400" {
			t.Errorf("%s: mail %+v", test.name, mail)
		}
		// A delivered tell already showed a marquee: no second one for the mail.
		if mail.NoAlert != (test.tell == "sent") {
			t.Errorf("%s: NoAlert %v with tell %q", test.name, mail.NoAlert, test.tell)
		}
		if state.text != "Turned off player replies\n"+test.summary {
			t.Errorf("%s: timeline %q", test.name, state.text)
		}
	}
}
