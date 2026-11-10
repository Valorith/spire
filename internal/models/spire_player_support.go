package models

import "time"

// PlayerSupportCase keeps the original petition and the Spire workflow state
// after EQEmu removes the native queue entry.
type PlayerSupportCase struct {
	ID           uint   `json:"-"`
	ConnectionID uint   `json:"-" gorm:"uniqueIndex:idx_support_source;index:idx_support_status"`
	SourceKey    string `json:"key" gorm:"size:48;uniqueIndex:idx_support_source"`
	PetitionID   uint   `json:"petition_id"`
	CharacterID  uint   `json:"character_id"`
	Character    string `json:"character" gorm:"column:character_name;size:64"`
	Account      string `json:"account" gorm:"size:64"`
	Zone         string `json:"zone" gorm:"size:64"`
	Message      string `json:"message" gorm:"type:text"`
	Urgency      int    `json:"urgency"`
	SubmittedAt  int64  `json:"submitted_at"`
	Status       string `json:"status" gorm:"size:16;index:idx_support_status"`
	OwnerID      uint   `json:"-"`
	Owner        string `json:"owner" gorm:"size:100"`
	Revision     uint   `json:"revision"`
	Category     string `json:"category" gorm:"size:24"`
	Escalated    bool   `json:"escalated"`
	// SubjectCharacterID is the reported player, when the petition is about
	// another character.
	SubjectCharacterID uint   `json:"subject_character_id"`
	SubjectCharacter   string `json:"subject_character" gorm:"size:64"`
	// MergedInto is the case this one was merged into; its history moved there.
	MergedInto uint      `json:"-" gorm:"index"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (PlayerSupportCase) TableName() string       { return "spire_player_support_cases" }
func (PlayerSupportCase) Relationships() []string { return nil }
func (PlayerSupportCase) Connection() string      { return "spire" }

type PlayerSupportEntry struct {
	ID       uint   `json:"id"`
	CaseID   uint   `json:"-" gorm:"index"`
	Kind     string `json:"kind" gorm:"size:16"`
	Actor    string `json:"actor" gorm:"size:100"`
	Text     string `json:"text" gorm:"type:text"`
	Delivery string `json:"delivery,omitempty" gorm:"size:16"`
	// Recipient is the character a Game Master tell reached. It can be any
	// character on the petitioning account.
	Recipient string `json:"recipient,omitempty" gorm:"size:64"`
	// Subject is set on a player's message that arrived by mail.
	Subject string `json:"subject,omitempty" gorm:"size:200"`
	// Persona is the name a Game Master's tell showed players, "(GM)
	// <persona>", when it was not the default.
	Persona string `json:"persona,omitempty" gorm:"size:24"`
	// Afk is set on a Game Master tell the player's client answered as AFK:
	// "pending", then "mailed" or "failed" once the tell was mailed to them.
	Afk string `json:"afk,omitempty" gorm:"size:16"`
	// AfkAt is when the AFK answer came and the tell was forwarded.
	AfkAt      *time.Time `json:"afk_at,omitempty"`
	RequestKey *string    `json:"-" gorm:"size:96;uniqueIndex"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (PlayerSupportEntry) TableName() string       { return "spire_player_support_entries" }
func (PlayerSupportEntry) Relationships() []string { return nil }
func (PlayerSupportEntry) Connection() string      { return "spire" }

// One live conversation per account on the local World. Petitions are one
// per account, so tells from any of the account's characters belong to the
// same case.
type PlayerSupportChat struct {
	AccountID uint `gorm:"primaryKey;autoIncrement:false"`
	CaseID    uint `gorm:"uniqueIndex"`
}

func (PlayerSupportChat) TableName() string       { return "spire_player_support_conversations" }
func (PlayerSupportChat) Relationships() []string { return nil }
func (PlayerSupportChat) Connection() string      { return "spire" }

// PlayerSupportReply is a saved reply that staff share on a server
// connection. Short plain-text replies also appear as Live chat quick replies.
type PlayerSupportReply struct {
	ID           uint      `json:"id"`
	ConnectionID uint      `json:"-" gorm:"index"`
	Title        string    `json:"title" gorm:"size:80"`
	Body         string    `json:"body" gorm:"type:text"`
	Resolves     bool      `json:"resolves"`
	UpdatedBy    string    `json:"updated_by" gorm:"size:100"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (PlayerSupportReply) TableName() string       { return "spire_player_support_replies" }
func (PlayerSupportReply) Relationships() []string { return nil }
func (PlayerSupportReply) Connection() string      { return "spire" }

// PlayerSupportAccountNote is a staff note about an EQEmu account, shown on
// every case from that account.
type PlayerSupportAccountNote struct {
	ID           uint      `json:"id"`
	ConnectionID uint      `json:"-" gorm:"index:idx_support_account_note"`
	AccountID    uint      `json:"-" gorm:"index:idx_support_account_note"`
	Account      string    `json:"-" gorm:"size:64;index"`
	Text         string    `json:"text" gorm:"type:text"`
	AuthorID     uint      `json:"-"`
	Author       string    `json:"author" gorm:"size:100"`
	CreatedAt    time.Time `json:"created_at"`
}

func (PlayerSupportAccountNote) TableName() string       { return "spire_player_support_account_notes" }
func (PlayerSupportAccountNote) Relationships() []string { return nil }
func (PlayerSupportAccountNote) Connection() string      { return "spire" }

// PlayerSupportPersona is the name players see on a Game Master's tells from
// Spire, one per Spire user. UserID 0 is a local install with authentication
// off.
type PlayerSupportPersona struct {
	UserID    uint      `json:"-" gorm:"primaryKey;autoIncrement:false"`
	Persona   string    `json:"persona" gorm:"size:24"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PlayerSupportPersona) TableName() string       { return "spire_player_support_personas" }
func (PlayerSupportPersona) Relationships() []string { return nil }
func (PlayerSupportPersona) Connection() string      { return "spire" }

// PlayerSupportSettings holds Player Support options for the game server this
// Spire runs beside. There is one row.
type PlayerSupportSettings struct {
	ID uint `json:"-"`
	// DiscordWebhookID names a row in EQEmu's discord_webhooks table that
	// receives a message for each new petition; 0 turns this off.
	DiscordWebhookID uint `json:"discord_webhook_id"`
	// AlertedThrough is the newest petition time already announced.
	AlertedThrough int64     `json:"-"`
	UpdatedBy      string    `json:"updated_by" gorm:"size:100"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (PlayerSupportSettings) TableName() string       { return "spire_player_support_settings" }
func (PlayerSupportSettings) Relationships() []string { return nil }
func (PlayerSupportSettings) Connection() string      { return "spire" }
