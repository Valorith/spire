package controllers

import (
	"testing"

	"gorm.io/gorm"
)

// Every Mail & Parcels send path hands its committed rows to the alert.
func TestMailAlertRows(t *testing.T) {
	var ids []uint
	var senders []string
	m := &MailParcelsEditorController{alertMail: func(_ *gorm.DB, characterIDs []uint, from string) {
		ids = append(ids, characterIDs...)
		senders = append(senders, from)
	}}
	m.alertRows(nil, []gmMailInsert{{CharID: 100, From: "GameMaster"}, {CharID: 101, From: "GameMaster"}})
	if len(ids) != 2 || ids[0] != 100 || ids[1] != 101 || len(senders) != 1 || senders[0] != "GameMaster" {
		t.Fatalf("alerted %v from %v", ids, senders)
	}
	m.alertRows(nil, nil)
	if len(senders) != 1 {
		t.Error("no rows must not alert")
	}
	(&MailParcelsEditorController{}).alertRows(nil, []gmMailInsert{{CharID: 100}})
}

// Without a World, or with a test hook, alertMail never blocks or panics.
func TestAlertMailWithoutWorld(t *testing.T) {
	(&PlayerSupportController{}).alertMail(nil, []uint{100}, "GameMaster")
	called := false
	(&PlayerSupportController{notifyMail: func(*gorm.DB, []uint, string) { called = true }}).alertMail(nil, []uint{100}, "GameMaster")
	if !called {
		t.Error("the hook was not called")
	}
}
