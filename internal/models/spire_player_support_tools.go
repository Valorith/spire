package models

import "time"

// PlayerSupportCaseLink ties an EQEmu record, such as a /bug report, to a case.
type PlayerSupportCaseLink struct {
	ID     uint `json:"-"`
	CaseID uint `json:"-" gorm:"uniqueIndex:idx_support_case_link"`
	// Kind is "bug_report".
	Kind      string    `json:"kind" gorm:"size:16;uniqueIndex:idx_support_case_link"`
	RefID     uint      `json:"ref_id" gorm:"uniqueIndex:idx_support_case_link"`
	Actor     string    `json:"actor" gorm:"size:100"`
	CreatedAt time.Time `json:"created_at"`
}

func (PlayerSupportCaseLink) TableName() string       { return "spire_player_support_case_links" }
func (PlayerSupportCaseLink) Relationships() []string { return nil }
func (PlayerSupportCaseLink) Connection() string      { return "spire" }
