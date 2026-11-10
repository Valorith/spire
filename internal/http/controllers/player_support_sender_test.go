package controllers

import (
	"context"
	"testing"

	"github.com/EQEmuTools/spire/internal/playersupport"
)

// A case's Reply by mail comes from the Game Master's in-game name, so the
// player's Reply in the mail window is addressed to GameMaster and reaches
// the case.
func TestSupportReplyMailIsFromGameMaster(t *testing.T) {
	input := supportReplyMail(gmMailSendInput{
		CharacterIDs: []uint{1, 2}, From: "Server Support", Timestamp: 99,
		Subject: "Response to your petition", Body: "Your tunic is at the parcel merchant.",
	}, 100, "731-1794116400")
	if input.From != playersupport.Identity || playersupport.Identity != "GameMaster" {
		t.Errorf("from = %q, want the in-game name GameMaster", input.From)
	}
	if len(input.CharacterIDs) != 1 || input.CharacterIDs[0] != 100 || input.Timestamp != 0 || input.Reason != "Player Support case 731-1794116400" {
		t.Errorf("reply = %+v", input)
	}
	if err := validateGMMailInput(gmMailSendInput{From: input.From, Subject: input.Subject, Body: input.Body, Reason: input.Reason}); err != nil {
		t.Errorf("mail limits: %v", err)
	}
}

// A parcel's sender is shown only, so it reads as words.
func TestSupportCaseParcelSender(t *testing.T) {
	input := supportCaseParcel(gmParcelSendInput{CharacterID: 5, FromName: "Server Support", SentDate: "2026-11-01 00:00:00"}, 100)
	if input.FromName != "Game Master" || input.CharacterID != 100 || input.SentDate != "" {
		t.Errorf("parcel = %+v", input)
	}
}

// The new-mail alert reads "...from a Game Master." for GameMaster; other
// senders keep their name, cleaned for World.
func TestSupportMailAlertSender(t *testing.T) {
	for from, want := range map[string]string{
		playersupport.Identity: "a Game Master",
		"Server Staff":         "Server Staff",
		"100% Loot":            "100 Loot",
		"":                     "",
	} {
		if got := supportMailAlertSender(from); got != want {
			t.Errorf("supportMailAlertSender(%q) = %q, want %q", from, got, want)
		}
	}
}

// The player's Reply to a case mail ("RE: ..." to GameMaster) joins the case
// with its subject.
func TestGameMasterMailReplyToCaseMail(t *testing.T) {
	state := mailInState(supportMailIn{
		MsgID: 9, Timestamp: mailInNow.Unix() - 60, From: "Aranel", To: "SOE.EQ.qa.GameMaster", Status: 1,
		Subject: "RE: Response to your petition", Body: "Thanks, I have it now.",
	})
	state.petition, state.repliesOn = true, true
	db := state.open(t)
	outcomes, err := (&PlayerSupportController{}).collectGameMasterMail(context.Background(), db, db, mailInNow)
	if err != nil || outcomes[9] != supportMailAccepted || len(state.entries) != 1 {
		t.Fatalf("%v %v, entries %d", outcomes, err, len(state.entries))
	}
	if entry := state.entries[0]; entry.Subject != "RE: Response to your petition" || entry.Text != "Thanks, I have it now." || entry.Delivery != "mail" {
		t.Errorf("entry %+v", entry)
	}
}
