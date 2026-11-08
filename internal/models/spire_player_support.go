package models

import "time"

// PlayerSupportCase keeps the original petition and the Spire workflow state
// after EQEmu removes the native queue entry.
type PlayerSupportCase struct {
	ID           uint      `json:"-"`
	ConnectionID uint      `json:"-" gorm:"uniqueIndex:idx_support_source;index:idx_support_status"`
	SourceKey    string    `json:"key" gorm:"size:48;uniqueIndex:idx_support_source"`
	PetitionID   uint      `json:"petition_id"`
	CharacterID  uint      `json:"character_id"`
	Character    string    `json:"character" gorm:"column:character_name;size:64"`
	Account      string    `json:"account" gorm:"size:64"`
	Zone         string    `json:"zone" gorm:"size:64"`
	Message      string    `json:"message" gorm:"type:text"`
	Urgency      int       `json:"urgency"`
	SubmittedAt  int64     `json:"submitted_at"`
	Status       string    `json:"status" gorm:"size:16;index:idx_support_status"`
	OwnerID      uint      `json:"-"`
	Owner        string    `json:"owner" gorm:"size:100"`
	Revision     uint      `json:"revision"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (PlayerSupportCase) TableName() string       { return "spire_player_support_cases" }
func (PlayerSupportCase) Relationships() []string { return nil }
func (PlayerSupportCase) Connection() string      { return "spire" }

type PlayerSupportEntry struct {
	ID         uint      `json:"id"`
	CaseID     uint      `json:"-" gorm:"index"`
	Kind       string    `json:"kind" gorm:"size:16"`
	Actor      string    `json:"actor" gorm:"size:100"`
	Text       string    `json:"text" gorm:"type:text"`
	Delivery   string    `json:"delivery,omitempty" gorm:"size:16"`
	RequestKey *string   `json:"-" gorm:"size:96;uniqueIndex"`
	CreatedAt  time.Time `json:"created_at"`
}

func (PlayerSupportEntry) TableName() string       { return "spire_player_support_entries" }
func (PlayerSupportEntry) Relationships() []string { return nil }
func (PlayerSupportEntry) Connection() string      { return "spire" }

// One live conversation per character on the local World prevents a reply
// from being recorded against two separate petitions.
type PlayerSupportChat struct {
	CharacterID uint `gorm:"primaryKey;autoIncrement:false"`
	AccountID   uint
	CaseID      uint   `gorm:"uniqueIndex"`
	Character   string `gorm:"size:64"`
}

func (PlayerSupportChat) TableName() string       { return "spire_player_support_chats" }
func (PlayerSupportChat) Relationships() []string { return nil }
func (PlayerSupportChat) Connection() string      { return "spire" }
