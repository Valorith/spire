package controllers

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// mailReplyTestDB answers the case's delivered mail audits and the mail rows.
func mailReplyTestDB(t *testing.T, audits []supportMailReplyAudit, bodies []supportMailReplyBody) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(gormMysql.New(gormMysql.Config{DSN: "qa@tcp(127.0.0.1:1)/qa", SkipInitializeWithVersion: true}),
		&gorm.Config{DryRun: true, DisableAutomaticPing: true, Logger: gormLogger.Default.LogMode(gormLogger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	pool, _ := db.DB()
	t.Cleanup(func() { _ = pool.Close() })
	err = db.Callback().Query().After("gorm:query").Register("test:mail-reply", func(tx *gorm.DB) {
		switch dest := tx.Statement.Dest.(type) {
		case *[]supportMailReplyAudit:
			*dest = append([]supportMailReplyAudit(nil), audits...)
		case *[]supportMailReplyBody:
			*dest = append([]supportMailReplyBody(nil), bodies...)
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	return db
}

func mailReplyAudit(t *testing.T, id uint, reason, subject string, msgID uint, at time.Time, actor string) supportMailReplyAudit {
	t.Helper()
	data, err := json.Marshal(mailParcelsAuditPayload{Action: "gm_send", Kind: "mail_batch", RecordID: msgID, RecordIDs: []uint{msgID}, Subject: subject, Reason: reason})
	if err != nil {
		t.Fatal(err)
	}
	return supportMailReplyAudit{ID: id, Data: string(data), CreatedAt: at, Actor: actor}
}

// A case's Reply by mail shows in Live chat as Game Master mail, in order
// with the conversation; the automatic notices do not.
func TestMailReplyMessages(t *testing.T) {
	base := time.Date(2026, 11, 8, 12, 0, 0, 0, time.UTC)
	audits := []supportMailReplyAudit{
		mailReplyAudit(t, 70, "Player Support case 731-1794116400", "Response to your petition", 501, base.Add(2*time.Minute), "Guide"),
		mailReplyAudit(t, 71, "Account action notice for Player Support case 731-1794116400", "Notice of account action", 502, base.Add(3*time.Minute), "Guide"),
		mailReplyAudit(t, 72, "Player Support case 731-1794116400", "About your corpse", 503, base.Add(4*time.Minute), ""),
	}
	// The player deleted the second reply's mail.
	db := mailReplyTestDB(t, audits, []supportMailReplyBody{{MsgID: 501, Body: "Your tunic is at the parcel merchant.\nCollect it soon."}})
	view := supportView(models.PlayerSupportCase{ID: 12, SourceKey: "731-1794116400", CharacterID: 100, Character: "Aranel"}, models.Petition{}, 0)
	replies, err := supportScope{spire: db, eqemu: db}.mailReplyMessages(view)
	if err != nil {
		t.Fatal(err)
	}
	if len(replies) != 2 {
		t.Fatalf("%d replies, want 2 (no notice): %+v", len(replies), replies)
	}
	first, second := replies[0], replies[1]
	if first.Kind != "chat_out" || first.Delivery != "mail" || first.Subject != "Response to your petition" || first.Actor != "Guide" ||
		first.Recipient != "Aranel" || first.Text != "Your tunic is at the parcel merchant.\nCollect it soon." || first.ID != supportMailReplyIDBase+70 {
		t.Errorf("first %+v", first)
	}
	if second.Subject != "About your corpse" || second.Text != "" || second.Actor != supportDefaultActor {
		t.Errorf("second %+v", second)
	}

	// Merged in time order with the player's mail and tells.
	entries := []models.PlayerSupportEntry{
		{ID: 5, Kind: "chat_in", Delivery: "mail", Subject: "Help", CreatedAt: base.Add(time.Minute)},
		{ID: 6, Kind: "chat_in", Text: "Thanks", CreatedAt: base.Add(5 * time.Minute)},
	}
	merged := mergeChatMessages(entries, replies)
	var order []uint
	for _, message := range merged {
		order = append(order, message.ID)
	}
	want := []uint{5, supportMailReplyIDBase + 70, supportMailReplyIDBase + 72, 6}
	if len(order) != len(want) {
		t.Fatalf("order %v", order)
	}
	for i := range want {
		if order[i] != want[i] {
			t.Fatalf("order %v, want %v", order, want)
		}
	}
	if supportMailReplyIDBase+72 >= 1<<53 {
		t.Error("message ids must stay exact in JavaScript")
	}
}

func TestMailReplyMessagesWithoutCase(t *testing.T) {
	replies, err := supportScope{}.mailReplyMessages(supportCaseView{})
	if err != nil || len(replies) != 0 {
		t.Fatalf("%v %v", replies, err)
	}
	if got := mergeChatMessages([]models.PlayerSupportEntry{{ID: 1}}, nil); len(got) != 1 {
		t.Fatal("no replies must leave the entries")
	}
}
