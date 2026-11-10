package controllers

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// chatTestState is what a dry-run chat database holds and what it saw.
type chatTestState struct {
	caseStatus string
	// repliesOn is a reply route (spire_player_support_chats row) for the
	// account to case 12.
	repliesOn bool
	// existing is an outgoing entry already recorded for the request key.
	existing *models.PlayerSupportEntry
	created  []interface{}
}

func (s *chatTestState) kinds() []string {
	var kinds []string
	for _, row := range s.created {
		switch value := row.(type) {
		case *models.PlayerSupportEntry:
			kinds = append(kinds, value.Kind)
		case *models.PlayerSupportChat:
			kinds = append(kinds, "route")
		default:
			kinds = append(kinds, "other")
		}
	}
	return kinds
}

// chatTestDB is a dry-run database for the case, the reply route, the
// petition and the sending character; inserts are captured.
func chatTestDB(t *testing.T, state *chatTestState) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(gormMysql.New(gormMysql.Config{
		DSN: "qa@tcp(127.0.0.1:1)/qa", SkipInitializeWithVersion: true,
	}), &gorm.Config{
		DryRun: true, DisableAutomaticPing: true, DisableNestedTransaction: true, Logger: gormLogger.Default.LogMode(gormLogger.Silent),
	})
	if err != nil {
		t.Fatal(err)
	}
	pool, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = pool.Close() })
	db.Statement.ConnPool = committedPool{db.Statement.ConnPool}
	err = db.Callback().Query().After("gorm:query").Register("test:chat", func(tx *gorm.DB) {
		switch dest := tx.Statement.Dest.(type) {
		case *models.PlayerSupportCase:
			*dest = models.PlayerSupportCase{ID: 12, SourceKey: "731-1794116400", Status: state.caseStatus}
		case *models.PlayerSupportEntry:
			if state.existing == nil {
				_ = tx.AddError(gorm.ErrRecordNotFound)
			} else {
				*dest = *state.existing
			}
		case *models.PlayerSupportChat:
			if state.repliesOn {
				*dest = models.PlayerSupportChat{AccountID: 5, CaseID: 12}
			} else {
				_ = tx.AddError(gorm.ErrRecordNotFound)
			}
		case *models.Petition:
			*dest = models.Petition{Dib: 731, Senttime: 1794116400}
		case *int64:
			// Count keeps the value only when one row was read.
			*dest = 1
			tx.RowsAffected = 1
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	err = db.Callback().Create().After("gorm:create").Register("test:chat", func(tx *gorm.DB) {
		// persist inserts a case seen for the first time; that is not a
		// change to the conversation.
		if _, ok := tx.Statement.Dest.(*models.PlayerSupportCase); !ok {
			state.created = append(state.created, tx.Statement.Dest)
		}
		tx.RowsAffected = 1
	})
	if err != nil {
		t.Fatal(err)
	}
	return db
}

func chatTestView() supportCaseView {
	return supportView(models.PlayerSupportCase{SourceKey: "731-1794116400", Status: "open", CharacterID: 100, Character: "Aranel", Account: "norrathguide"}, models.Petition{}, 0)
}

// A message sent while player replies are off is recorded and never turns
// replies on, whether it goes as a tell or by mail.
func TestRecordChatSendLeavesRepliesOff(t *testing.T) {
	requestID := strings.Repeat("a", 32)
	for _, repliesOn := range []bool{false, true} {
		state := &chatTestState{caseStatus: "open", repliesOn: repliesOn}
		db := chatTestDB(t, state)
		entry, duplicate, err := recordChatSend(supportScope{spire: db, eqemu: db}, chatTestView(), requestID, "I am looking into this now.", "Aranel", "", nil)
		if err != nil || duplicate {
			t.Fatalf("replies on %v: duplicate %v, %v", repliesOn, duplicate, err)
		}
		if got := state.kinds(); len(got) != 1 || got[0] != "chat_out" {
			t.Fatalf("replies on %v: created %v, want only the outgoing message", repliesOn, got)
		}
		if entry.Kind != "chat_out" || entry.Delivery != "pending" || entry.Recipient != "Aranel" || *entry.RequestKey != "chat-12-"+requestID {
			t.Errorf("entry %+v", entry)
		}
	}
}

func TestRecordChatSendRefusals(t *testing.T) {
	requestID := strings.Repeat("b", 32)
	state := &chatTestState{caseStatus: "resolved"}
	db := chatTestDB(t, state)
	_, _, err := recordChatSend(supportScope{spire: db, eqemu: db}, chatTestView(), requestID, "Hello", "Aranel", "", nil)
	if toolHTTPCode(err) != http.StatusConflict || err.(*echo.HTTPError).Message != "Reopen this case to message the player" || len(state.created) != 0 {
		t.Fatalf("resolved: %v, created %v", err, state.kinds())
	}

	state = &chatTestState{caseStatus: "open"}
	db = chatTestDB(t, state)
	tellsOff := echo.NewHTTPError(http.StatusConflict, "Aranel has tells turned off")
	if _, _, err = recordChatSend(supportScope{spire: db, eqemu: db}, chatTestView(), requestID, "Hello", "Aranel", "", tellsOff); err != tellsOff || len(state.created) != 0 {
		t.Fatalf("tells off: %v, created %v", err, state.kinds())
	}

	// A repeated request returns the first send without recording again.
	key := "chat-12-" + requestID
	state = &chatTestState{caseStatus: "open", existing: &models.PlayerSupportEntry{ID: 40, Kind: "chat_out", Delivery: "sent", RequestKey: &key}}
	db = chatTestDB(t, state)
	entry, duplicate, err := recordChatSend(supportScope{spire: db, eqemu: db}, chatTestView(), requestID, "Hello", "Aranel", "", tellsOff)
	if err != nil || !duplicate || entry.ID != 40 || entry.Delivery != "sent" || len(state.created) != 0 {
		t.Fatalf("repeat: %+v duplicate %v, %v, created %v", entry, duplicate, err, state.kinds())
	}
}

func TestAcceptChatFollowsReplies(t *testing.T) {
	frame := playersupport.Frame{Kind: "tell", RequestID: "6f1c2d3e-0000-4000-8000-000000000001", AccountID: 5, CharacterID: 100, Character: "Aranel", Text: "Thanks, it is back now."}

	// Replies off: World tells the player messages are not on, nothing is recorded.
	state := &chatTestState{caseStatus: "open"}
	db := chatTestDB(t, state)
	decision, recorded := acceptChat(context.Background(), db, db, frame)
	if decision != playersupport.TellMessagesOff || recorded || len(state.created) != 0 {
		t.Fatalf("replies off: %s recorded %v, created %v", decision, recorded, state.kinds())
	}

	// Replies on: the reply joins the case.
	state = &chatTestState{caseStatus: "open", repliesOn: true}
	db = chatTestDB(t, state)
	decision, recorded = acceptChat(context.Background(), db, db, frame)
	if decision != playersupport.TellAccepted || !recorded {
		t.Fatalf("replies on: %s recorded %v", decision, recorded)
	}
	if len(state.created) != 1 {
		t.Fatalf("replies on: created %v", state.kinds())
	}
	entry := state.created[0].(*models.PlayerSupportEntry)
	if entry.Kind != "chat_in" || entry.CaseID != 12 || entry.Actor != "Aranel" || entry.Text != "Thanks, it is back now." || *entry.RequestKey != "tell-"+frame.RequestID {
		t.Errorf("entry %+v", entry)
	}

	// Replies on, but the case was resolved: not recorded.
	state = &chatTestState{caseStatus: "resolved", repliesOn: true}
	db = chatTestDB(t, state)
	if decision, recorded = acceptChat(context.Background(), db, db, frame); decision != playersupport.TellMessagesOff || recorded || len(state.created) != 0 {
		t.Fatalf("resolved: %s recorded %v, created %v", decision, recorded, state.kinds())
	}
}

func TestEnableChatRecordsPlayerReplies(t *testing.T) {
	state := &chatTestState{caseStatus: "open"}
	db := chatTestDB(t, state)
	if err := enableChat(db, models.PlayerSupportCase{ID: 12, SourceKey: "731-1794116400", Status: "open"}, 5, "Guide"); err != nil {
		t.Fatal(err)
	}
	if got := state.kinds(); len(got) != 2 || got[0] != "route" || got[1] != "chat_on" {
		t.Fatalf("created %v", got)
	}
	if entry := state.created[1].(*models.PlayerSupportEntry); entry.Text != "Turned on player replies" || entry.Actor != "Guide" {
		t.Errorf("timeline entry %+v", entry)
	}
	err := enableChat(db, models.PlayerSupportCase{ID: 12, Status: "resolved"}, 5, "Guide")
	if toolHTTPCode(err) != http.StatusConflict || err.(*echo.HTTPError).Message != "Reopen this case to turn on player replies" {
		t.Errorf("resolved: %v", err)
	}
}
