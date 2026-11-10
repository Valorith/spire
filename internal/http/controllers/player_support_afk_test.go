package controllers

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

func TestSupportAFKReply(t *testing.T) {
	sent := time.Date(2026, 11, 10, 12, 0, 0, 0, time.UTC)
	cases := []struct {
		name string
		text string
		gap  time.Duration
		want supportAFKAnswer
	}{
		{"stock text at once", "Sorry, I am A.F.K. (Away From Keyboard) right now.", 0, supportAFKStock},
		{"stock text, other case and spaces", "  sorry, i am a.f.k. (away from keyboard) right now. ", 20 * time.Second, supportAFKStock},
		{"stock prefix", "Sorry, I am A.F.K. Back soon", 10 * time.Second, supportAFKStock},
		{"stock text too late", "Sorry, I am A.F.K. (Away From Keyboard) right now.", 31 * time.Second, supportAFKNone},
		{"custom AFK text within 2 seconds", "brb, dinner", 2 * time.Second, supportAFKFast},
		{"a person answering", "Thanks, it is back now.", 3 * time.Second, supportAFKNone},
		{"database clock slightly ahead", "anything", -500 * time.Millisecond, supportAFKFast},
	}
	for _, test := range cases {
		if got := supportAFKReply(test.text, sent, sent.Add(test.gap)); got != test.want {
			t.Errorf("%s: %v, want %v", test.name, got, test.want)
		}
	}
	if supportAFKTextWindow != 30*time.Second || supportAFKFastWindow != 2*time.Second {
		t.Error("the AFK windows changed")
	}
}

// afkTestDB is a dry-run database with the account, the recent tells, the
// claim of a tell and the inserts.
type afkTestDB struct {
	tells    []models.PlayerSupportEntry
	claims   int // how many claims succeed
	mailFail bool

	mails    []*gmMailInsert
	timeline []*models.PlayerSupportEntry
	states   []string
}

func (s *afkTestDB) open(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(gormMysql.New(gormMysql.Config{DSN: "qa@tcp(127.0.0.1:1)/qa", SkipInitializeWithVersion: true}),
		&gorm.Config{DryRun: true, DisableAutomaticPing: true, Logger: gormLogger.Default.LogMode(gormLogger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	pool, _ := db.DB()
	t.Cleanup(func() { _ = pool.Close() })
	db.Statement.ConnPool = committedPool{db.Statement.ConnPool}
	return s.install(t, db)
}

// install adds the AFK reads and writes to a dry-run database.
func (s *afkTestDB) install(t *testing.T, db *gorm.DB) *gorm.DB {
	t.Helper()
	must := func(err error) {
		if err != nil {
			t.Fatal(err)
		}
	}
	must(db.Callback().Query().After("gorm:query").Register("test:afk", func(tx *gorm.DB) {
		switch dest := tx.Statement.Dest.(type) {
		case *supportAccountName:
			*dest = supportAccountName{Name: "norrathguide"}
		case *[]models.PlayerSupportEntry:
			*dest = append([]models.PlayerSupportEntry(nil), s.tells...)
		}
	}))
	must(db.Callback().Update().After("gorm:update").Register("test:afk", func(tx *gorm.DB) {
		values, _ := tx.Statement.Dest.(map[string]interface{})
		state, _ := values["afk"].(string)
		if state == supportAFKPending {
			if s.claims > 0 {
				s.claims--
				tx.RowsAffected = 1
			}
			return
		}
		s.states = append(s.states, state)
		tx.RowsAffected = 1
	}))
	must(db.Callback().Create().After("gorm:create").Register("test:afk", func(tx *gorm.DB) {
		switch row := tx.Statement.Dest.(type) {
		case *gmMailInsert:
			if s.mailFail {
				_ = tx.AddError(errors.New("mail table is locked"))
				return
			}
			s.mails = append(s.mails, row)
		case *models.PlayerSupportEntry:
			s.timeline = append(s.timeline, row)
		}
		tx.RowsAffected = 1
	}))
	return db
}

var afkNow = time.Date(2026, 11, 10, 12, 0, 1, 0, time.UTC)

func afkFrame(text string) playersupport.Frame {
	return playersupport.Frame{Kind: "tell", RequestID: "6f1c2d3e-0000-4000-8000-000000000009", AccountID: 5, CharacterID: 100, Character: "Vayle", Text: text}
}

func afkTell(id uint, at time.Time, text string) models.PlayerSupportEntry {
	key := "chat-12-" + strings.Repeat("a", 32)
	return models.PlayerSupportEntry{ID: id, CaseID: 12, Kind: "chat_out", Actor: "Guide", Recipient: "Vayle", Text: text, Delivery: "sent", RequestKey: &key, CreatedAt: at}
}

func TestForwardAFKMailsTheTellOnce(t *testing.T) {
	state := &afkTestDB{tells: []models.PlayerSupportEntry{afkTell(40, afkNow.Add(-time.Second), "Your tunic is at the parcel merchant.")}, claims: 1}
	db := state.open(t)
	var alerted []uint
	p := &PlayerSupportController{notifyMail: func(_ *gorm.DB, ids []uint, from string) { alerted = append(alerted, ids...) }}
	if !p.forwardAFK(context.Background(), db, db, afkFrame(supportAFKText), afkNow) {
		t.Fatal("the stock AFK answer was not recognised")
	}
	if len(state.mails) != 1 {
		t.Fatalf("%d mails", len(state.mails))
	}
	mail := state.mails[0]
	if mail.CharID != 100 || mail.To != "Vayle" || mail.From != "GameMaster" || mail.Subject != "Message about your petition" ||
		mail.Body != "The following message was sent to you by a Game Master regarding your open petition, but you were AFK: Your tunic is at the parcel merchant." ||
		mail.Status != mailStatusUnread {
		t.Errorf("mail %+v", mail)
	}
	if len(alerted) != 1 || alerted[0] != 100 {
		t.Errorf("new-mail alert %v", alerted)
	}
	if len(state.states) != 1 || state.states[0] != supportAFKMailed {
		t.Errorf("tell state %v", state.states)
	}
	if len(state.timeline) != 1 || state.timeline[0].Kind != "afk_mail" || state.timeline[0].Delivery != "mail" || state.timeline[0].CaseID != 12 ||
		!strings.HasPrefix(state.timeline[0].Text, "Player was AFK: the Game Master tell was mailed to Vayle") || *state.timeline[0].RequestKey != "afk-40" {
		t.Errorf("timeline %+v", state.timeline)
	}

	// A second AFK answer, or one handled by another Spire: still not a
	// player message, and no second mail.
	forwarded := afkTell(40, afkNow.Add(-time.Second), "Your tunic is at the parcel merchant.")
	forwarded.Afk = supportAFKMailed
	state = &afkTestDB{tells: []models.PlayerSupportEntry{forwarded}, claims: 1}
	db = state.open(t)
	if !p.forwardAFK(context.Background(), db, db, afkFrame(supportAFKText), afkNow) || len(state.mails) != 0 {
		t.Fatalf("already forwarded: %d mails", len(state.mails))
	}
	state = &afkTestDB{tells: []models.PlayerSupportEntry{afkTell(40, afkNow.Add(-time.Second), "Hi")}, claims: 0}
	db = state.open(t)
	if !p.forwardAFK(context.Background(), db, db, afkFrame(supportAFKText), afkNow) || len(state.mails) != 0 || len(state.timeline) != 0 {
		t.Fatalf("claim lost: %d mails", len(state.mails))
	}
}

func TestForwardAFKOnlyForAutoReplies(t *testing.T) {
	p := &PlayerSupportController{notifyMail: func(*gorm.DB, []uint, string) {}}
	// A person answering three seconds later is a reply, not AFK.
	state := &afkTestDB{tells: []models.PlayerSupportEntry{afkTell(40, afkNow.Add(-3*time.Second), "Hi")}, claims: 1}
	db := state.open(t)
	if p.forwardAFK(context.Background(), db, db, afkFrame("Thanks, I see it."), afkNow) || len(state.mails) != 0 {
		t.Fatal("a real reply was taken for AFK")
	}
	// No recent tell to that character: a reply.
	state = &afkTestDB{claims: 1}
	db = state.open(t)
	if p.forwardAFK(context.Background(), db, db, afkFrame(supportAFKText), afkNow) {
		t.Fatal("an AFK text without a tell was taken for AFK")
	}
	// Any text within two seconds forwards the tell, but it is not the stock
	// text, so the caller still records it.
	state = &afkTestDB{tells: []models.PlayerSupportEntry{afkTell(40, afkNow.Add(-time.Second), "Hi")}, claims: 1}
	db = state.open(t)
	if p.forwardAFK(context.Background(), db, db, afkFrame("brb, dinner"), afkNow) || len(state.mails) != 1 {
		t.Fatalf("a fast reply: %d mails, or it was dropped", len(state.mails))
	}
	if len(state.states) != 1 || state.states[0] != supportAFKMailed {
		t.Errorf("tell state %v", state.states)
	}
}

// handleTell end to end: the stock AFK text is dropped and the tell mailed; a
// fast reply is mailed and recorded; a normal reply is recorded only.
func TestHandleTellAFK(t *testing.T) {
	tell := afkTell(40, afkNow.Add(-time.Second), "Your tunic is at the parcel merchant.")
	cases := []struct {
		name     string
		text     string
		tellAt   time.Time
		mails    int
		recorded bool
	}{
		{"stock AFK text", supportAFKText, afkNow.Add(-time.Second), 1, false},
		{"fast custom reply", "Yes, got it, thanks!", afkNow.Add(-time.Second), 1, true},
		{"normal reply", "Thanks, I see it.", afkNow.Add(-5 * time.Second), 0, true},
	}
	for _, test := range cases {
		tell.CreatedAt = test.tellAt
		afk := &afkTestDB{tells: []models.PlayerSupportEntry{tell}, claims: 1}
		chat := &chatTestState{caseStatus: "open", repliesOn: true}
		db := afk.install(t, chatTestDB(t, chat))
		p := &PlayerSupportController{notifyMail: func(*gorm.DB, []uint, string) {}}
		frame := afkFrame(test.text)
		if decision := p.handleTell(context.Background(), db, db, frame, afkNow); decision != playersupport.TellAccepted {
			t.Errorf("%s: decision %s", test.name, decision)
		}
		if len(afk.mails) != test.mails {
			t.Errorf("%s: %d mails, want %d", test.name, len(afk.mails), test.mails)
		}
		var replies []*models.PlayerSupportEntry
		for _, row := range chat.created {
			if entry, ok := row.(*models.PlayerSupportEntry); ok && entry.Kind == "chat_in" {
				replies = append(replies, entry)
			}
		}
		if !test.recorded {
			if len(replies) != 0 {
				t.Errorf("%s: recorded %+v", test.name, replies)
			}
			continue
		}
		if len(replies) != 1 || replies[0].Text != test.text || replies[0].Actor != "Vayle" || replies[0].CaseID != 12 || *replies[0].RequestKey != "tell-"+frame.RequestID {
			t.Errorf("%s: replies %+v", test.name, replies)
		}
	}

	// A fast reply while player replies are off still forwards the tell, and
	// World tells the player the reply was not sent rather than dropping it.
	tell.CreatedAt = afkNow.Add(-time.Second)
	afk := &afkTestDB{tells: []models.PlayerSupportEntry{tell}, claims: 1}
	chat := &chatTestState{caseStatus: "open"}
	db := afk.install(t, chatTestDB(t, chat))
	p := &PlayerSupportController{notifyMail: func(*gorm.DB, []uint, string) {}}
	if decision := p.handleTell(context.Background(), db, db, afkFrame("Yes, got it"), afkNow); decision != playersupport.TellMessagesOff || len(afk.mails) != 1 {
		t.Errorf("replies off: decision %s, %d mails", decision, len(afk.mails))
	}
}

// Each tell the answer can be for is mailed, one mail each, in order.
func TestForwardAFKSeveralTells(t *testing.T) {
	state := &afkTestDB{tells: []models.PlayerSupportEntry{
		afkTell(40, afkNow.Add(-20*time.Second), "First."),
		afkTell(41, afkNow.Add(-time.Second), "Second."),
	}, claims: 2}
	db := state.open(t)
	p := &PlayerSupportController{notifyMail: func(*gorm.DB, []uint, string) {}}
	if !p.forwardAFK(context.Background(), db, db, afkFrame(supportAFKText), afkNow) || len(state.mails) != 2 {
		t.Fatalf("%d mails", len(state.mails))
	}
	if !strings.HasSuffix(state.mails[0].Body, "First.") || !strings.HasSuffix(state.mails[1].Body, "Second.") {
		t.Errorf("mails %q, %q", state.mails[0].Body, state.mails[1].Body)
	}
}

func TestForwardAFKMailFailure(t *testing.T) {
	state := &afkTestDB{tells: []models.PlayerSupportEntry{afkTell(40, afkNow.Add(-time.Second), "Hi")}, claims: 1, mailFail: true}
	db := state.open(t)
	alerted := false
	p := &PlayerSupportController{notifyMail: func(*gorm.DB, []uint, string) { alerted = true }}
	if !p.forwardAFK(context.Background(), db, db, afkFrame(supportAFKText), afkNow) {
		t.Fatal("not recognised")
	}
	if alerted || len(state.states) != 1 || state.states[0] != supportAFKFailed {
		t.Errorf("alerted %v, state %v", alerted, state.states)
	}
	if len(state.timeline) != 1 || state.timeline[0].Delivery != "failed" ||
		!strings.HasPrefix(state.timeline[0].Text, "Player was AFK: the Game Master tell could not be mailed to Vayle") {
		t.Errorf("timeline %+v", state.timeline)
	}
}
