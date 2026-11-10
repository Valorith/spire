package controllers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func TestSupportNoticeText(t *testing.T) {
	until := time.Date(2030, 1, 2, 10, 30, 0, 0, time.FixedZone("EST", -5*3600))
	cases := []struct {
		name, body, statement string
	}{
		{"kick", supportKickNotice("Aranel", "Thornalt"), "Your character Thornalt was disconnected from the game by a Game Master."},
		{"suspend", supportSanctionNotice("Aranel", "suspend", &until), "Your account has been suspended until January 2, 2030 at 15:30 UTC. You can log in again after that time."},
		{"suspend without end", supportSanctionNotice("Aranel", "suspend", nil), "Your account has been suspended."},
		{"ban", supportSanctionNotice("Aranel", "ban", nil), "Your account has been banned. Its characters can no longer log in."},
		{"clear", supportSanctionNotice("Aranel", "clear", nil), "The restriction on your account has been lifted. You can log in again."},
		{"revoke", supportRevokeNotice("Aranel", true), "Your chat privileges have been restricted by a Game Master."},
		{"restore", supportRevokeNotice("Aranel", false), "Your chat privileges have been restored."},
	}
	for _, test := range cases {
		want := "Hello Aranel,\n\nThis is a notice from the Game Master team about your account.\n\n" + test.statement +
			"\n\nIf you have questions about this action, please file a petition in game with #petition.\n\nThe Game Master team"
		if test.body != want {
			t.Errorf("%s:\n%q\nwant\n%q", test.name, test.body, want)
		}
		for _, r := range test.body {
			if r > 126 || (r < 32 && r != '\n') {
				t.Errorf("%s: %q is not plain ASCII", test.name, r)
			}
		}
		if strings.Contains(test.body, "!") {
			t.Errorf("%s: contains an exclamation mark", test.name)
		}
		// The revoked flag's reach depends on server settings, so no notice
		// names channels or promises that tells work.
		for _, claim := range []string{"Tells", "tells", "OOC", "auction", "shout", "/petition", "guidehelp"} {
			if strings.Contains(test.body, claim) {
				t.Errorf("%s: mentions %q", test.name, claim)
			}
		}
		input := gmMailSendInput{From: playersupport.Identity, Subject: supportNoticeSubject, Body: test.body, Reason: "Account action notice for Player Support case 731-1794116400"}
		if err := validateGMMailInput(input); err != nil {
			t.Errorf("%s: %v", test.name, err)
		}
	}
}

// finishSupportActionForTest completes a recorded action whose work returned
// result. The case entry update reports one row; its new text is returned.
func finishSupportActionForTest(t *testing.T, p *PlayerSupportController, action supportAction, result supportActionResult) (*httptest.ResponseRecorder, string) {
	t.Helper()
	db := supportActionTestDB(t, "open", nil)
	var text string
	err := db.Callback().Update().After("gorm:update").Register("test:rows", func(tx *gorm.DB) {
		if values, ok := tx.Statement.Dest.(map[string]interface{}); ok {
			text, _ = values["text"].(string)
		}
		tx.RowsAffected = 1
	})
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	c := echo.New().NewContext(httptest.NewRequest(http.MethodPut, "/api/v1/player-support/cases/731-1794116400/kick", nil), recorder)
	entry := models.PlayerSupportEntry{ID: 5, CaseID: 12, Text: action.Summary + "\n" + action.Reason}
	if err := p.finishSupportAction(c, supportScope{spire: db, eqemu: db}, supportNoticeView(), action, entry, result); err != nil {
		t.Fatal(err)
	}
	return recorder, text
}

func supportNoticeView() supportCaseView {
	return supportView(models.PlayerSupportCase{
		SourceKey: "731-1794116400", Status: "open", CharacterID: 100, Character: "Aranel", Account: "norrathguide",
	}, models.Petition{}, 0)
}

func supportActionResponse(t *testing.T, recorder *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var body map[string]interface{}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	return body
}

func TestSupportActionNotice(t *testing.T) {
	action := supportAction{
		Kind: "kick", RequestID: strings.Repeat("b", 32), Summary: "Kicked Aranel from the game",
		Reason: "Harassing other players in OOC", Event: "PLAYER_SUPPORT_KICK",
		Notice: supportKickNotice("Aranel", "Aranel"), AccountID: 731,
	}
	var mailed []supportNotice
	var mailErr error
	p := &PlayerSupportController{mailNotice: func(_ echo.Context, _ supportScope, view supportCaseView, notice supportNotice) error {
		if view.CharacterID != 100 || view.Character != "Aranel" {
			t.Errorf("notice went to %d %q, want the petition character", view.CharacterID, view.Character)
		}
		mailed = append(mailed, notice)
		return mailErr
	}}

	// A failed action sends nothing.
	recorder, text := finishSupportActionForTest(t, p, action, supportActionResult{Delivery: "failed", Message: "World did not accept the kick."})
	if recorder.Code != http.StatusConflict || len(mailed) != 0 || strings.Contains(text, "mail") {
		t.Fatalf("failed action: %d, %d mails, entry %q", recorder.Code, len(mailed), text)
	}

	// A successful action mails the notice once and says so.
	recorder, text = finishSupportActionForTest(t, p, action, supportActionResult{Delivery: "sent", Message: "Kick sent."})
	body := supportActionResponse(t, recorder)
	if recorder.Code != http.StatusOK || body["status"] != "sent" || body["message"] != "Kick sent. The player was notified by mail." || body["notice"] != "mailed" {
		t.Fatalf("mailed: %d %v", recorder.Code, body)
	}
	if text != "Kicked Aranel from the game\nHarassing other players in OOC\nKick sent. The player was notified by mail." {
		t.Errorf("entry text %q", text)
	}
	if len(mailed) != 1 {
		t.Fatalf("%d mails, want 1", len(mailed))
	}
	notice := mailed[0]
	if notice.CaseID != 12 || notice.AccountID != 731 || notice.RequestID != action.RequestID || notice.Body != action.Notice {
		t.Errorf("notice %+v", notice)
	}
	if strings.Contains(notice.Body, action.Reason) || strings.Contains(notice.Body, "Harassing") {
		t.Error("the notice must not include the staff reason")
	}

	// A mail failure leaves the action standing.
	mailErr = errors.New("mail table is locked")
	recorder, text = finishSupportActionForTest(t, p, action, supportActionResult{Delivery: "sent", Message: "Kick sent.", Data: map[string]interface{}{"kick": "sent"}})
	body = supportActionResponse(t, recorder)
	if recorder.Code != http.StatusOK || body["status"] != "sent" || body["message"] != "Kick sent. The notice could not be mailed to the player." ||
		body["notice"] != "failed" || body["kick"] != "sent" || !strings.HasSuffix(text, "The notice could not be mailed to the player.") {
		t.Fatalf("mail failed: %d %v, entry %q", recorder.Code, body, text)
	}

	// Without Mail & Parcels the real sender fails, with the same answer.
	recorder, _ = finishSupportActionForTest(t, &PlayerSupportController{}, action, supportActionResult{Delivery: "sent", Message: "Kick sent."})
	if body = supportActionResponse(t, recorder); recorder.Code != http.StatusOK || body["message"] != "Kick sent. The notice could not be mailed to the player." {
		t.Fatalf("no mail controller: %d %v", recorder.Code, body)
	}

	// Actions without a notice, such as lockout removal, send nothing.
	mailed, mailErr = nil, nil
	lockout := supportAction{Kind: "lockout", RequestID: action.RequestID, Summary: "Removed lockout", Reason: action.Reason}
	recorder, _ = finishSupportActionForTest(t, p, lockout, supportActionResult{Delivery: "sent", Message: "Done."})
	if body = supportActionResponse(t, recorder); len(mailed) != 0 || body["message"] != "Done." || body["notice"] != nil {
		t.Fatalf("no notice: %d mails, %v", len(mailed), body)
	}
}

func TestSupportActionRepeatSendsOneNotice(t *testing.T) {
	action := supportAction{
		Kind: "revoke", RequestID: strings.Repeat("c", 32), Summary: "Revoked OOC, auction and shout for norrathguide",
		Reason: "Spamming the auction channel", Event: "PLAYER_SUPPORT_REVOKE", Notice: supportRevokeNotice("Aranel", true), AccountID: 731,
	}
	mails := 0
	p := &PlayerSupportController{mailNotice: func(echo.Context, supportScope, supportCaseView, supportNotice) error {
		mails++
		return nil
	}}
	// The first request mails once.
	if recorder, _ := finishSupportActionForTest(t, p, action, supportActionResult{Delivery: "sent", Message: "Done."}); recorder.Code != http.StatusOK || mails != 1 {
		t.Fatalf("first request: %d, %d mails", recorder.Code, mails)
	}
	// The same request ID again is refused before the action or its notice.
	recorder := httptest.NewRecorder()
	c := echo.New().NewContext(httptest.NewRequest(http.MethodPut, "/api/v1/player-support/cases/731-1794116400/revoke", nil), recorder)
	db := supportActionTestDB(t, "open", &mysql.MySQLError{Number: 1062, Message: "Duplicate entry"})
	ran := false
	if err := p.runSupportAction(c, supportScope{spire: db, eqemu: db}, supportNoticeView(), action, func() supportActionResult {
		ran = true
		return supportActionResult{Delivery: "sent", Message: "Done."}
	}); err != nil {
		t.Fatal(err)
	}
	if ran || mails != 1 || recorder.Code != http.StatusConflict {
		t.Fatalf("repeat: ran %v, %d mails, %d %s", ran, mails, recorder.Code, recorder.Body.String())
	}
	// The notice's delivery key, unique in the audit log, follows the request.
	key := supportNoticeKey(12, action.RequestID)
	if key != "12-"+action.RequestID+"-notice" || key == supportNoticeKey(12, strings.Repeat("d", 32)) || len(key) > 96 {
		t.Errorf("notice key %q", key)
	}
}
