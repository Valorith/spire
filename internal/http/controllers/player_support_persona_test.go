package controllers

import (
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/models"
	"gorm.io/gorm"
)

// A tell's persona is kept on its entry, so Live chat can show "as (GM) …".
func TestRecordChatSendKeepsPersona(t *testing.T) {
	state := &chatTestState{caseStatus: "open"}
	db := chatTestDB(t, state)
	entry, _, err := recordChatSend(supportScope{spire: db, eqemu: db}, chatTestView(), strings.Repeat("a", 32), "Looking now.", "Aranel", "Aranwen", nil)
	if err != nil || entry.Persona != "Aranwen" {
		t.Fatalf("entry %+v, %v", entry, err)
	}
}

// One persona per Spire user; a local install without a user keeps it under 0.
func TestSavePersonaPerUser(t *testing.T) {
	for _, user := range []models.User{{ID: 9, UserName: "Guide"}, {}} {
		state := &chatTestState{caseStatus: "open"}
		db := chatTestDB(t, state)
		if err := savePersona(supportScope{spire: db, eqemu: db, user: user}, "Aranwen"); err != nil {
			t.Fatal(err)
		}
		if len(state.created) != 1 {
			t.Fatalf("user %d: created %v", user.ID, state.kinds())
		}
		row, ok := state.created[0].(*models.PlayerSupportPersona)
		if !ok || row.UserID != user.ID || row.Persona != "Aranwen" {
			t.Errorf("user %d: row %+v", user.ID, state.created[0])
		}
	}
}

func TestPersonaReadAndAnswer(t *testing.T) {
	db := chatTestDB(t, &chatTestState{caseStatus: "open"})
	if err := db.Callback().Query().After("gorm:query").Register("test:persona", func(tx *gorm.DB) {
		if row, ok := tx.Statement.Dest.(*models.PlayerSupportPersona); ok {
			*row = models.PlayerSupportPersona{UserID: 9, Persona: "Aranwen"}
		}
	}); err != nil {
		t.Fatal(err)
	}
	scope := supportScope{spire: db, eqemu: db, user: models.User{ID: 9}}
	if got := scope.persona(); got != "Aranwen" {
		t.Fatalf("persona = %q", got)
	}
	// Without the World Spire runs beside, a persona is kept but not sent.
	p := &PlayerSupportController{}
	if got := p.personaArgument(scope); got != "" {
		t.Errorf("persona argument without World = %q", got)
	}
	answer := p.personaAnswer(scope, "")
	if answer.Display != "Game Master" || answer.Available || answer.Reason != "Needs the game server this Spire runs beside" {
		t.Errorf("answer %+v", answer)
	}
	if answer := p.personaAnswer(scope, "Guide Vayle"); answer.Display != "Guide Vayle" || answer.Persona != "Guide Vayle" || answer.Warning != "" {
		t.Errorf("answer %+v", answer)
	}
}
