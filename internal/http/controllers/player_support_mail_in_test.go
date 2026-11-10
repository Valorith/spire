package controllers

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/go-sql-driver/mysql"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// mailInTestDB is a dry-run game and Spire database for mail to GameMaster.
type mailInTestDB struct {
	mails     []supportMailIn
	claimable map[uint]bool
	senders   map[string]supportMailSender
	petition  bool
	repliesOn bool
	// recent is an automatic answer to the sender in the last ten minutes.
	recent   int64
	keys     map[string]bool
	mailFail bool
	// entryFail and auditFail fail those inserts with a database error.
	entryFail, auditFail error
	// bucket is the petition's shared status ("status|messages|owner") that
	// the Spire holding the case publishes; "" when there is none.
	bucket string
	// bindingElsewhere: this Spire's conversation for the account is on
	// another (older) case.
	bindingElsewhere bool

	claimed  []uint
	returned []*gmMailInsert
	// New-mail alerts asked for: senders and characters.
	alerts  []string
	alerted []uint
	entries []*models.PlayerSupportEntry
	audits  []*models.UserEventLog
	sent    []*gmMailInsert
}

func (s *mailInTestDB) open(t *testing.T) *gorm.DB {
	t.Helper()
	if s.keys == nil {
		s.keys = map[string]bool{}
	}
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
	must(db.Callback().Query().After("gorm:query").Register("test:mail", func(tx *gorm.DB) {
		switch dest := tx.Statement.Dest.(type) {
		case *[]supportMailIn:
			*dest = append([]supportMailIn(nil), s.mails...)
		case *supportMailSender:
			name, _ := tx.Statement.Vars[0].(string)
			if sender, ok := s.senders[name]; ok {
				*dest = sender
			} else {
				_ = tx.AddError(gorm.ErrRecordNotFound)
			}
		case *models.Petition:
			if s.petition {
				*dest = models.Petition{Dib: 731, Senttime: 1794116400}
			} else {
				_ = tx.AddError(gorm.ErrRecordNotFound)
			}
		case *models.PlayerSupportChat:
			switch {
			case s.repliesOn:
				*dest = models.PlayerSupportChat{AccountID: 5, CaseID: 12}
			case s.bindingElsewhere:
				*dest = models.PlayerSupportChat{AccountID: 5, CaseID: 3}
			default:
				_ = tx.AddError(gorm.ErrRecordNotFound)
			}
		case *models.PlayerSupportCase:
			if id, _ := tx.Statement.Vars[0].(uint); id == 3 {
				*dest = models.PlayerSupportCase{ID: 3, SourceKey: "600-1793000000", Status: "open"}
			} else {
				*dest = models.PlayerSupportCase{ID: 12, SourceKey: "731-1794116400", Status: "open"}
			}
		case *supportBucketValue:
			key, _ := tx.Statement.Vars[0].(string)
			if key != "spire:petition:731-1794116400" {
				t.Errorf("bucket key %q", key)
			}
			*dest = supportBucketValue{Value: s.bucket}
		case *int64:
			*dest = s.recent
			tx.RowsAffected = 1
		}
	}))
	must(db.Callback().Raw().After("gorm:raw").Register("test:mail", func(tx *gorm.DB) {
		if !strings.HasPrefix(tx.Statement.SQL.String(), "DELETE FROM mail") {
			return
		}
		id, _ := tx.Statement.Vars[0].(uint)
		if s.claimable[id] {
			s.claimable[id] = false
			s.claimed = append(s.claimed, id)
			tx.RowsAffected = 1
		}
	}))
	must(db.Callback().Create().After("gorm:create").Register("test:mail", func(tx *gorm.DB) {
		switch row := tx.Statement.Dest.(type) {
		case *models.PlayerSupportEntry:
			if s.entryFail != nil {
				_ = tx.AddError(s.entryFail)
				return
			}
			s.entries = append(s.entries, row)
		case *models.UserEventLog:
			if s.auditFail != nil {
				_ = tx.AddError(s.auditFail)
				return
			}
			if s.keys[*row.SupportDeliveryKey] {
				_ = tx.AddError(&mysql.MySQLError{Number: 1062, Message: "Duplicate entry"})
				return
			}
			s.keys[*row.SupportDeliveryKey] = true
			row.ID = uint(70 + len(s.audits))
			s.audits = append(s.audits, row)
		case *gmMailInsert:
			if row.CharID == 0 {
				// A mail put back for the next poll.
				s.returned = append(s.returned, row)
				break
			}
			if s.mailFail {
				_ = tx.AddError(&mysql.MySQLError{Number: 1205, Message: "Lock wait timeout"})
				return
			}
			s.sent = append(s.sent, row)
		}
		tx.RowsAffected = 1
	}))
	return db
}

func mailInState(mails ...supportMailIn) *mailInTestDB {
	claimable := map[uint]bool{}
	for _, mail := range mails {
		claimable[mail.MsgID] = true
	}
	return &mailInTestDB{
		mails: mails, claimable: claimable,
		senders: map[string]supportMailSender{
			"Aranel":  {ID: 100, Name: "Aranel", AccountID: 5},
			"Bramble": {ID: 101, Name: "Bramble", AccountID: 5},
		},
	}
}

var mailInNow = time.Unix(1794120000, 0)

func collectForTest(t *testing.T, state *mailInTestDB) map[uint]string {
	t.Helper()
	db := state.open(t)
	p := &PlayerSupportController{notifyMail: func(_ *gorm.DB, ids []uint, from string) {
		state.alerts = append(state.alerts, from)
		state.alerted = append(state.alerted, ids...)
	}}
	outcomes, err := p.collectGameMasterMail(context.Background(), db, db, mailInNow)
	if err != nil {
		t.Fatal(err)
	}
	return outcomes
}

func TestGameMasterMailJoinsTheCase(t *testing.T) {
	state := mailInState(supportMailIn{MsgID: 9, Timestamp: 1794119000, From: "Bramble", Subject: "  Re:\tmy tunic \r\n", Body: "It is back now.\r\nThanks!\x07", To: "SOE.EQ.qa.GameMaster", Status: 1})
	state.petition, state.repliesOn = true, true
	outcomes := collectForTest(t, state)
	if outcomes[9] != supportMailAccepted || len(state.claimed) != 1 {
		t.Fatalf("outcomes %v, claimed %v", outcomes, state.claimed)
	}
	if len(state.entries) != 1 || len(state.sent) != 0 || len(state.audits) != 0 {
		t.Fatalf("entries %d, answers %d, audits %d", len(state.entries), len(state.sent), len(state.audits))
	}
	if len(state.alerts) != 0 {
		t.Errorf("a mail filed on the case alerted %v", state.alerted)
	}
	entry := state.entries[0]
	if entry.Kind != "chat_in" || entry.CaseID != 12 || entry.Actor != "Bramble" || entry.Delivery != "mail" ||
		entry.Subject != "Re: my tunic" || entry.Text != "It is back now. \nThanks!" || *entry.RequestKey != "mail-9-1794119000" {
		t.Errorf("entry %+v", entry)
	}
}

func TestGameMasterMailAnswers(t *testing.T) {
	for _, test := range []struct {
		name       string
		petition   bool
		repliesOn  bool
		outcome    string
		reason     string
		reasonText string
	}{
		{"no petition", false, false, supportMailAnsweredNoCase, `"reason":"no_petition"`, "no_petition"},
		{"replies off", true, false, supportMailAnsweredOff, `"reason":"replies_off"`, "replies_off"},
	} {
		state := mailInState(supportMailIn{MsgID: 9, Timestamp: 1794119000, From: "Aranel", Subject: "Help", Body: "Where is my corpse?", Status: 1})
		state.petition, state.repliesOn = test.petition, test.repliesOn
		outcomes := collectForTest(t, state)
		if outcomes[9] != test.outcome || len(state.entries) != 0 {
			t.Fatalf("%s: outcomes %v, entries %d", test.name, outcomes, len(state.entries))
		}
		if len(state.audits) != 1 || len(state.sent) != 1 {
			t.Fatalf("%s: audits %d, answers %d", test.name, len(state.audits), len(state.sent))
		}
		audit := state.audits[0]
		window := mailInNow.Unix() / 600
		if audit.EventName != "PLAYER_SUPPORT_MAIL_ANSWER" || *audit.SupportDeliveryKey != supportMailAnswerKey(100, window) ||
			!strings.Contains(audit.Data, test.reason) || audit.SupportCaseID != nil {
			t.Errorf("%s: audit %+v", test.name, audit)
		}
		answer := state.sent[0]
		if answer.CharID != 100 || answer.To != "Aranel" || answer.From != "GameMaster" || answer.Subject != "Your message was not delivered" ||
			answer.Body != supportMailAnswerBody("Aranel", test.reasonText) || answer.Status != mailStatusUnread {
			t.Errorf("%s: answer %+v", test.name, answer)
		}
		if strings.Contains(answer.Body, "Where is my corpse") {
			t.Errorf("%s: the answer quotes the player's mail", test.name)
		}
		if len(state.alerts) != 1 || state.alerts[0] != "GameMaster" || len(state.alerted) != 1 || state.alerted[0] != 100 {
			t.Errorf("%s: alerts %v for %v", test.name, state.alerts, state.alerted)
		}
	}
}

func TestGameMasterMailAnswerText(t *testing.T) {
	noPetition := "Hello Aranel,\n\nThank you for your message to the Game Master. It was not delivered to the Game Master team.\n\n" +
		"The Game Master mailbox is only read while you have an open petition. If you need help, please file a petition in game with #petition.\n\n" +
		"The Game Master team"
	repliesOff := "Hello Aranel,\n\nThank you for your message to the Game Master. It was not delivered to the Game Master team.\n\n" +
		"Replies to the Game Master are not open on your petition right now. A Game Master will open them when they need your answer.\n\n" +
		"The Game Master team"
	if got := supportMailAnswerBody("Aranel", "no_petition"); got != noPetition {
		t.Errorf("no petition:\n%q", got)
	}
	if got := supportMailAnswerBody("Aranel", "replies_off"); got != repliesOff {
		t.Errorf("replies off:\n%q", got)
	}
	for _, body := range []string{noPetition, repliesOff} {
		if strings.Contains(body, "/petition") || strings.Contains(body, "!") {
			t.Errorf("%q", body)
		}
	}
}

func TestGameMasterMailRateLimit(t *testing.T) {
	// An answer in the last ten minutes: dropped without another.
	state := mailInState(supportMailIn{MsgID: 9, From: "Aranel", Body: "Hello?", Status: 1})
	state.recent = 1
	if outcomes := collectForTest(t, state); outcomes[9] != supportMailDroppedRate || len(state.sent) != 0 || len(state.audits) != 0 {
		t.Fatalf("recent answer: %v, answers %d, audits %d", outcomes, len(state.sent), len(state.audits))
	}

	// Two mails in one window, as from two Spire processes: one answer.
	state = mailInState(
		supportMailIn{MsgID: 9, From: "Aranel", Body: "Hello?", Status: 1},
		supportMailIn{MsgID: 10, From: "Aranel", Body: "Anyone?", Status: 1},
	)
	outcomes := collectForTest(t, state)
	if outcomes[9] != supportMailAnsweredNoCase || outcomes[10] != supportMailDroppedRate || len(state.sent) != 1 || len(state.claimed) != 2 {
		t.Fatalf("same window: %v, answers %d, claimed %v", outcomes, len(state.sent), state.claimed)
	}
}

func TestGameMasterMailClaims(t *testing.T) {
	// Another Spire claimed the row first: nothing happens here.
	state := mailInState(supportMailIn{MsgID: 9, From: "Aranel", Body: "Hello?", Status: 1})
	state.claimable[9] = false
	if outcomes := collectForTest(t, state); len(outcomes) != 0 || len(state.sent) != 0 || len(state.entries) != 0 || len(state.audits) != 0 {
		t.Fatalf("claimed elsewhere: %v", outcomes)
	}

	// Unknown sender: claimed and dropped.
	state = mailInState(supportMailIn{MsgID: 9, From: "Nobody", Body: "Hello?", Status: 1})
	if outcomes := collectForTest(t, state); outcomes[9] != supportMailDroppedUnknown || len(state.sent) != 0 || len(state.audits) != 0 {
		t.Fatalf("unknown sender: %v", outcomes)
	}

	// At most three per sender in one poll; the rest wait.
	var mails []supportMailIn
	for id := uint(1); id <= 5; id++ {
		mails = append(mails, supportMailIn{MsgID: id, From: "Aranel", Body: "Hello?", Status: 1})
	}
	mails = append(mails, supportMailIn{MsgID: 6, From: "Bramble", Body: "Hi", Status: 1})
	state = mailInState(mails...)
	state.petition, state.repliesOn = true, true
	outcomes := collectForTest(t, state)
	if len(state.claimed) != 4 || state.claimable[4] != true || state.claimable[5] != true || outcomes[6] != supportMailAccepted || len(state.entries) != 4 {
		t.Fatalf("per sender: claimed %v, outcomes %v, entries %d", state.claimed, outcomes, len(state.entries))
	}
}

func TestGameMasterMailAnswerFailure(t *testing.T) {
	state := mailInState(supportMailIn{MsgID: 9, From: "Aranel", Body: "Hello?", Status: 1})
	state.mailFail = true
	if outcomes := collectForTest(t, state); outcomes[9] != supportMailAnswerFailed || len(state.audits) != 1 {
		t.Fatalf("answer failed: %v, audits %d", outcomes, len(state.audits))
	}
	if len(state.alerts) != 0 {
		t.Errorf("an answer that was not written alerted %v", state.alerted)
	}
}

func TestMailTextLimits(t *testing.T) {
	if got := supportMailText(" \r\n "); got != "(No message text)" {
		t.Errorf("empty body: %q", got)
	}
	long := supportMailText(strings.Repeat("é", 3000))
	if len(long) > supportMailBodyMax || !strings.HasSuffix(long, "...") || !strings.HasPrefix(long, "é") {
		t.Errorf("long body: %d bytes", len(long))
	}
	if got := supportMailSubject("a\nb\tc   d"); got != "a b c d" {
		t.Errorf("subject %q", got)
	}
	if got := supportMailSubject(strings.Repeat("x", 300)); len(got) != supportMailSubjectMax {
		t.Errorf("long subject: %d", len(got))
	}
	if supportMailAnswerKey(100, 2990200) != "mail-answer-100-2990200" {
		t.Error("answer key")
	}
}

// A database error never answers the player: the mail goes back for the next
// poll, and is given up after supportMailTries polls.
func TestGameMasterMailDatabaseErrors(t *testing.T) {
	unknownColumn := &mysql.MySQLError{Number: 1054, Message: "Unknown column 'subject' in 'field list'"}
	mail := supportMailIn{MsgID: 9, Timestamp: 1794119000, From: "Aranel", Subject: "Re: help", Body: "It worked.", To: "SOE.EQ.qa.GameMaster", Status: 1}
	p := &PlayerSupportController{}
	for poll := 1; poll <= supportMailTries; poll++ {
		state := mailInState(mail)
		state.petition, state.repliesOn, state.entryFail = true, true, unknownColumn
		db := state.open(t)
		outcomes, err := p.collectGameMasterMail(context.Background(), db, db, mailInNow)
		if err != nil {
			t.Fatal(err)
		}
		if len(state.sent) != 0 || len(state.audits) != 0 || len(state.entries) != 0 {
			t.Fatalf("poll %d: answered %d, audits %d, entries %d", poll, len(state.sent), len(state.audits), len(state.entries))
		}
		if poll < supportMailTries {
			if outcomes[9] != supportMailReturned || len(state.returned) != 1 {
				t.Fatalf("poll %d: %v, returned %d", poll, outcomes, len(state.returned))
			}
			back := state.returned[0]
			if back.CharID != 0 || back.From != mail.From || back.Subject != mail.Subject || back.Body != mail.Body ||
				back.Timestamp != mail.Timestamp || back.To != mail.To || back.Status != 1 {
				t.Errorf("poll %d: returned %+v", poll, back)
			}
			continue
		}
		if outcomes[9] != supportMailGivenUp || len(state.returned) != 0 {
			t.Fatalf("last poll: %v, returned %d", outcomes, len(state.returned))
		}
	}

	// The audit for an automatic answer cannot be written: no answer, retried.
	state := mailInState(mail)
	state.auditFail = &mysql.MySQLError{Number: 1205, Message: "Lock wait timeout exceeded"}
	db := state.open(t)
	outcomes, err := (&PlayerSupportController{}).collectGameMasterMail(context.Background(), db, db, mailInNow)
	if err != nil || outcomes[9] != supportMailReturned || len(state.sent) != 0 || len(state.returned) != 1 {
		t.Fatalf("audit error: %v %v, answered %d, returned %d", outcomes, err, len(state.sent), len(state.returned))
	}

	// A handled mail clears its count: a later failure starts again.
	state = mailInState(mail)
	state.petition, state.repliesOn = true, true
	db = state.open(t)
	p = &PlayerSupportController{}
	p.mailFailures.fail(mail)
	if outcomes, _ := p.collectGameMasterMail(context.Background(), db, db, mailInNow); outcomes[9] != supportMailAccepted {
		t.Fatalf("accepted: %v", outcomes)
	}
	if !p.mailFailures.fail(mail) {
		t.Error("the count was not cleared after the mail was handled")
	}
}

// Two Spire processes on one game database: only the one holding the
// account's conversation files the mail; another leaves it while the
// petition's shared status says replies are on.
func TestGameMasterMailOwnership(t *testing.T) {
	mail := supportMailIn{MsgID: 9, Timestamp: mailInNow.Add(-time.Minute).Unix(), From: "Aranel", Subject: "Re: help", Body: "It worked.", Status: 1}

	// The owner files it.
	state := mailInState(mail)
	state.petition, state.repliesOn, state.bucket = true, true, "open|1|Guide"
	if outcomes := collectForTest(t, state); outcomes[9] != supportMailAccepted || len(state.entries) != 1 || len(state.claimed) != 1 {
		t.Fatalf("owner: %v, entries %d, claimed %v", outcomes, len(state.entries), state.claimed)
	}

	// Another Spire leaves it untouched while the bucket says replies are on,
	// whether it has no conversation for the account or one on an older case.
	for _, elsewhere := range []bool{false, true} {
		state = mailInState(mail)
		state.petition, state.bindingElsewhere, state.bucket = true, elsewhere, "open|1|Guide"
		db := state.open(t)
		p := &PlayerSupportController{}
		outcomes, err := p.collectGameMasterMail(context.Background(), db, db, mailInNow)
		if err != nil || outcomes[9] != supportMailLeft || len(state.claimed) != 0 || len(state.sent) != 0 || len(state.audits) != 0 || len(state.entries) != 0 {
			t.Fatalf("not the owner (binding elsewhere %v): %v %v, claimed %v, answers %d", elsewhere, outcomes, err, state.claimed, len(state.sent))
		}
		// It is not looked at again until the recheck time.
		if waiting := p.mailDeferred.waiting(mailInNow.Add(time.Minute)); len(waiting) != 1 || waiting[0] != 9 {
			t.Errorf("deferred %v", waiting)
		}
		if waiting := p.mailDeferred.waiting(mailInNow.Add(supportMailRecheck + time.Second)); len(waiting) != 0 {
			t.Errorf("still deferred after the recheck time: %v", waiting)
		}
	}

	// Another Spire answers "not open" when the bucket says off, or is missing.
	for _, bucket := range []string{"open|0|Guide", "waiting|0|", ""} {
		state = mailInState(mail)
		state.petition, state.bucket = true, bucket
		if outcomes := collectForTest(t, state); outcomes[9] != supportMailAnsweredOff || len(state.sent) != 1 ||
			state.sent[0].Body != supportMailAnswerBody("Aranel", supportMailReasonRepliesOff) {
			t.Fatalf("bucket %q: %v, answers %d", bucket, outcomes, len(state.sent))
		}
	}

	// A mail nobody took for a day is answered as undelivered.
	late := mail
	late.Timestamp = mailInNow.Add(-supportMailStaleAfter - time.Minute).Unix()
	state = mailInState(late)
	state.petition, state.bucket = true, "open|1|Guide"
	outcomes := collectForTest(t, state)
	if outcomes[9] != supportMailAnsweredLate || len(state.claimed) != 1 || len(state.sent) != 1 || len(state.audits) != 1 {
		t.Fatalf("late: %v, claimed %v, answers %d", outcomes, state.claimed, len(state.sent))
	}
	if state.sent[0].Body != supportMailAnswerBody("Aranel", supportMailReasonLate) || !strings.Contains(state.audits[0].Data, `"reason":"undelivered"`) {
		t.Errorf("late answer %q, audit %s", state.sent[0].Body, state.audits[0].Data)
	}

	// The row was claimed by another Spire between the plan and the claim.
	state = mailInState(mail)
	state.petition, state.repliesOn = true, true
	state.claimable[9] = false
	if outcomes := collectForTest(t, state); len(outcomes) != 0 || len(state.entries) != 0 || len(state.sent) != 0 {
		t.Fatalf("claimed elsewhere: %v", outcomes)
	}
}

func TestGameMasterMailUndeliveredText(t *testing.T) {
	want := "Hello Aranel,\n\nThank you for your message to the Game Master. It was not delivered to the Game Master team.\n\n" +
		"It could not be passed on in time. If you still need help, please send it again, or add to your petition in game with #petition.\n\n" +
		"The Game Master team"
	if got := supportMailAnswerBody("Aranel", supportMailReasonLate); got != want {
		t.Errorf("undelivered:\n%q", got)
	}
}
