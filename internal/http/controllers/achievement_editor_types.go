package controllers

import "time"

const (
	achievementEditorMaxAssociations             = 100
	achievementEditorMaxComponents               = 1000
	achievementEditorMaxCriteria                 = 2000
	achievementEditorMaxRewards                  = 500
	achievementEditorMaxRequirements             = 500
	achievementEditorMaxRewardOptions            = 500
	achievementEditorMaxRewardMappings           = 500
	achievementEditorMaxGraphBytes         int64 = 2 * 1024 * 1024
	achievementEditorSkillWildcard               = uint32(4294967295)
	achievementEditorRecoveryActionRestore       = "restore"
	achievementEditorRecoveryActionDelete        = "delete"
)

// achievementEditorDefinition is the complete, transactional definition
// graph exchanged by the editor. Keeping the graph flat mirrors the source
// schema while the nested component criteria and reward-set children make it
// impossible for a caller to save only an accidental fragment.
type achievementEditorDefinition struct {
	ID                   uint32                             `json:"id"`
	Name                 string                             `json:"name"`
	Description          string                             `json:"description"`
	IconID               uint32                             `json:"icon_id"`
	Points               uint32                             `json:"points"`
	HasReward            bool                               `json:"has_reward"`
	ClientFlag           uint8                              `json:"client_flag"`
	Version              uint32                             `json:"version"`
	ResetOnVersionChange bool                               `json:"reset_on_version_change"`
	Enabled              bool                               `json:"enabled"`
	Associations         []achievementEditorAssociation     `json:"associations" gorm:"-"`
	Components           []achievementEditorComponent       `json:"components" gorm:"-"`
	Rewards              []achievementEditorReward          `json:"rewards" gorm:"-"`
	RewardSet            *achievementEditorRewardSet        `json:"reward_set" gorm:"-"`
	Requirements         []achievementEditorCastRequirement `json:"requirements" gorm:"-"`
}

type achievementEditorGraph = achievementEditorDefinition

type achievementEditorAssociation struct {
	AchievementID uint32 `json:"achievement_id,omitempty"`
	CategoryID    uint32 `json:"category_id"`
	Sequence      uint32 `json:"sequence"`
	DisplayText   string `json:"display_text"`
	CategoryName  string `json:"category_name,omitempty"`
}

type achievementEditorComponent struct {
	AchievementID     uint32                       `json:"achievement_id,omitempty"`
	ComponentType     uint8                        `json:"component_type"`
	Sequence          uint32                       `json:"sequence"`
	ComponentID       uint32                       `json:"component_id"`
	Name              string                       `json:"name"`
	Description       string                       `json:"description"`
	PresentationCount uint32                       `json:"presentation_count"`
	Criteria          []achievementEditorCriterion `json:"criteria" gorm:"-"`
	// RecoveryOnly marks a synthetic component emitted when criteria survived
	// after their owning achievement_components row disappeared. These fields
	// are editor protocol state only; they are never persisted directly.
	RecoveryOnly          bool   `json:"recovery_only,omitempty" gorm:"-"`
	RecoveryAction        string `json:"recovery_action,omitempty" gorm:"-"`
	RecoveryReason        string `json:"recovery_reason,omitempty" gorm:"-"`
	RecoveryCriteriaCount int    `json:"recovery_criteria_count,omitempty" gorm:"-"`
}

type achievementEditorCriterion struct {
	ID                string `json:"id,omitempty"`
	AchievementID     uint32 `json:"achievement_id,omitempty"`
	ComponentType     uint8  `json:"component_type"`
	ComponentSequence uint32 `json:"component_sequence"`
	ComponentID       uint32 `json:"component_id"`
	EventType         uint8  `json:"event_type"`
	ProgressMode      uint8  `json:"progress_mode"`
	Behavior          uint8  `json:"behavior"`
	TargetID          uint32 `json:"target_id"`
	TargetID2         uint32 `json:"target_id2"`
	TargetValue       string `json:"target_value"`
	RequiredCount     uint32 `json:"required_count"`
	Enabled           bool   `json:"enabled"`
}

// Amount is a string because it is an unsigned BIGINT and must round-trip
// through JavaScript without losing precision. RewardID remains a string at the
// API boundary so it can also be compared directly with durable BIGINT ledger
// values, even though the canonical rewards.reward_id is unsigned INT.
type achievementEditorReward struct {
	RewardID     string `json:"reward_id,omitempty"`
	SourceID     uint32 `json:"source_id,omitempty" gorm:"column:source_id"`
	Sequence     uint32 `json:"sequence"`
	RewardType   uint8  `json:"reward_type"`
	RewardDataID uint32 `json:"reward_data_id"`
	Amount       string `json:"amount"`
	Description  string `json:"description"`
	Enabled      bool   `json:"enabled"`
}

type achievementEditorRewardSet struct {
	RewardSetID   uint32                           `json:"reward_set_id"`
	SourceID      uint32                           `json:"source_id,omitempty" gorm:"column:source_id"`
	Title         string                           `json:"title"`
	Enabled       bool                             `json:"enabled"`
	SourceEnabled bool                             `json:"source_enabled"`
	Shared        bool                             `json:"shared,omitempty" gorm:"-"`
	SourceCount   int64                            `json:"source_count,omitempty" gorm:"-"`
	Options       []achievementEditorRewardOption  `json:"options" gorm:"-"`
	Mappings      []achievementEditorRewardMapping `json:"mappings" gorm:"-"`
}

type achievementEditorRewardOption struct {
	RewardSetID uint32 `json:"reward_set_id,omitempty"`
	OptionID    uint32 `json:"option_id"`
	Sequence    uint32 `json:"sequence"`
	Label       string `json:"label"`
	CommonToAll bool   `json:"common_to_all"`
	Flags       uint8  `json:"flags"`
	Enabled     bool   `json:"enabled"`
}

type achievementEditorRewardMapping struct {
	RewardSetID uint32 `json:"reward_set_id,omitempty"`
	OptionID    uint32 `json:"option_id"`
	Sequence    uint32 `json:"sequence"`
	RewardID    string `json:"reward_id"`
}

type achievementEditorCastRequirement struct {
	RestrictionID     uint32 `json:"restriction_id"`
	AchievementID     uint32 `json:"achievement_id,omitempty"`
	RequiresCompleted bool   `json:"requires_completed"`
}

type achievementEditorCategory struct {
	ID               uint32 `json:"id"`
	ParentID         uint32 `json:"parent_id"`
	Sequence         uint32 `json:"sequence"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	Icon             string `json:"icon"`
	AssociationCount int64  `json:"association_count,omitempty"`
	ChildrenCount    int64  `json:"children_count,omitempty"`
	Depth            int    `json:"depth,omitempty"`
}

type achievementEditorDefinitionSummary struct {
	ID               uint32 `json:"id"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	IconID           uint32 `json:"icon_id"`
	Points           uint32 `json:"points"`
	Version          uint32 `json:"version"`
	Enabled          bool   `json:"enabled"`
	CategoryCount    int64  `json:"category_count"`
	ComponentCount   int64  `json:"component_count"`
	CriterionCount   int64  `json:"criterion_count"`
	RewardCount      int64  `json:"reward_count"`
	RequirementCount int64  `json:"requirement_count"`
	RewardSetCount   int64  `json:"reward_set_count"`
	CategoryNames    string `json:"category_names"`
	State            string `json:"state,omitempty"`
	CompletedAt      uint64 `json:"completed_at,omitempty"`
	CharacterVersion uint32 `json:"character_version,omitempty"`
	ProgressRows     int64  `json:"progress_rows,omitempty"`
	ProgressTotal    string `json:"progress_total,omitempty"`
	VersionMismatch  bool   `json:"version_mismatch,omitempty"`
	RewardAttention  bool   `json:"reward_attention,omitempty"`
	PendingUpdate    bool   `json:"pending_update,omitempty"`
	Orphaned         bool   `json:"orphaned,omitempty"`
}

type achievementEditorPage struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type achievementEditorLookupOption struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Detail string `json:"detail,omitempty"`
	IconID uint32 `json:"icon_id,omitempty"`
}

type achievementEditorLookupPage struct {
	Data  []achievementEditorLookupOption `json:"data"`
	Total int64                           `json:"total"`
	Limit int                             `json:"limit"`
}

type achievementEditorGraphUpdateRequest struct {
	Graph            achievementEditorGraph  `json:"graph"`
	Definition       *achievementEditorGraph `json:"definition,omitempty"`
	ExpectedVersion  *uint32                 `json:"expected_version,omitempty"`
	ExpectedRevision string                  `json:"expected_revision,omitempty"`
	Reason           string                  `json:"reason"`
	Confirmation     string                  `json:"confirmation,omitempty"`
}

type achievementEditorCloneRequest struct {
	NewID            uint32 `json:"new_id"`
	Name             string `json:"name,omitempty"`
	Reason           string `json:"reason"`
	Confirmation     string `json:"confirmation"`
	ExpectedRevision string `json:"expected_revision"`
}

type achievementEditorDeleteRequest struct {
	Reason           string `json:"reason"`
	Confirmation     string `json:"confirmation"`
	ExpectedRevision string `json:"expected_revision"`
}

type achievementEditorCategoryUpdateRequest struct {
	Category         achievementEditorCategory `json:"category"`
	ExpectedParentID *uint32                   `json:"expected_parent_id,omitempty"`
	ExpectedRevision string                    `json:"expected_revision,omitempty"`
	Reason           string                    `json:"reason"`
}

type achievementEditorSchemaDiagnostics struct {
	Ready     bool                        `json:"ready"`
	Guidance  string                      `json:"guidance,omitempty"`
	Content   achievementEditorSchemaArea `json:"content"`
	Character achievementEditorSchemaArea `json:"character"`
}

type achievementEditorSchemaArea struct {
	Ready    bool                                    `json:"ready"`
	Database string                                  `json:"database,omitempty"`
	Tables   map[string]achievementEditorSchemaTable `json:"tables"`
	Issues   []achievementEditorSchemaIssue          `json:"issues"`
}

type achievementEditorSchemaTable struct {
	Present  bool     `json:"present"`
	Required bool     `json:"required"`
	Engine   string   `json:"engine,omitempty"`
	Columns  []string `json:"columns"`
}

type achievementEditorSchemaIssue struct {
	Area     string `json:"area"`
	Table    string `json:"table,omitempty"`
	Column   string `json:"column,omitempty"`
	Code     string `json:"code"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}

type achievementEditorCharacterSummary struct {
	ID                          uint32 `json:"id"`
	AccountID                   uint32 `json:"account_id"`
	Name                        string `json:"name"`
	Level                       uint32 `json:"level"`
	Class                       uint8  `json:"class"`
	InGame                      bool   `json:"ingame"`
	LastLogin                   uint64 `json:"last_login"`
	AchievementCompletionCount  int64  `json:"achievement_completion_count"`
	AchievementProgressCount    int64  `json:"achievement_progress_count"`
	AchievementProgressRowCount int64  `json:"achievement_progress_row_count"`
	AchievementProgressTotal    string `json:"achievement_progress_total"`
}

type achievementEditorCharacter struct {
	ID                          uint32     `json:"id"`
	AccountID                   uint32     `json:"account_id"`
	Name                        string     `json:"name"`
	Level                       uint32     `json:"level"`
	Class                       uint8      `json:"class"`
	InGame                      bool       `json:"ingame"`
	LastLogin                   uint64     `json:"last_login"`
	DeletedAt                   *time.Time `json:"deleted_at,omitempty"`
	AchievementCompletionCount  int64      `json:"achievement_completion_count"`
	AchievementProgressCount    int64      `json:"achievement_progress_count"`
	AchievementProgressRowCount int64      `json:"achievement_progress_row_count"`
	AchievementProgressTotal    string     `json:"achievement_progress_total"`
}

type achievementEditorCharacterCompletion struct {
	CharacterID   uint32 `json:"character_id"`
	AchievementID uint32 `json:"achievement_id"`
	Version       uint32 `json:"version"`
	CompletedAt   uint64 `json:"completed_at"`
}

type achievementEditorCharacterProgress struct {
	CharacterID       uint32 `json:"character_id"`
	AchievementID     uint32 `json:"achievement_id"`
	ComponentType     uint8  `json:"component_type"`
	ComponentSequence uint32 `json:"component_sequence"`
	ComponentID       uint32 `json:"component_id"`
	CurrentCount      string `json:"current_count"`
	Completed         bool   `json:"completed"`
	Version           uint32 `json:"version"`
	UpdatedAt         uint64 `json:"updated_at"`
}

type achievementEditorCharacterRewardLedger struct {
	CharacterID   uint32 `json:"character_id"`
	AchievementID uint32 `json:"achievement_id"`
	RewardID      string `json:"reward_id"`
	Status        uint8  `json:"status"`
	AttemptCount  uint32 `json:"attempt_count"`
	GrantedAt     uint64 `json:"granted_at"`
	LastAttemptAt uint64 `json:"last_attempt_at"`
	LastError     string `json:"last_error"`
}

type achievementEditorCharacterRewardSelection struct {
	CharacterID      uint32 `json:"character_id"`
	AchievementID    uint32 `json:"achievement_id"`
	RewardSetID      uint32 `json:"reward_set_id"`
	SelectedOptionID uint32 `json:"selected_option_id"`
	Status           uint8  `json:"status"`
	AttemptCount     uint32 `json:"attempt_count"`
	ClaimedAt        uint64 `json:"claimed_at"`
	LastAttemptAt    uint64 `json:"last_attempt_at"`
	LastError        string `json:"last_error"`
}

type achievementEditorCharacterPendingUpdate struct {
	UpdateID         string `json:"update_id"`
	CharacterID      uint32 `json:"character_id"`
	SourceTargetType uint8  `json:"source_target_type"`
	SourceTargetID   string `json:"source_target_id"`
	Operation        uint8  `json:"operation"`
	AchievementID    uint32 `json:"achievement_id"`
	ComponentType    uint8  `json:"component_type"`
	ComponentID      uint32 `json:"component_id"`
	RequestedValue   uint32 `json:"requested_value"`
	Version          uint32 `json:"version"`
	Status           uint8  `json:"status"`
	AttemptCount     uint32 `json:"attempt_count"`
	CreatedAt        uint64 `json:"created_at"`
	LastAttemptAt    uint64 `json:"last_attempt_at"`
	LastError        string `json:"last_error"`
}

type achievementEditorCharacterDetail struct {
	Character            achievementEditorCharacter                  `json:"character"`
	Definitions          []achievementEditorDefinitionSummary        `json:"definitions"`
	Associations         []achievementEditorAssociation              `json:"associations"`
	Components           []achievementEditorComponent                `json:"components"`
	Criteria             []achievementEditorCriterion                `json:"criteria"`
	Rewards              []achievementEditorReward                   `json:"rewards"`
	RewardSets           []achievementEditorRewardSet                `json:"reward_sets"`
	RewardOptions        []achievementEditorRewardOption             `json:"reward_options"`
	RewardOptionEntries  []achievementEditorRewardMapping            `json:"reward_option_entries"`
	Requirements         []achievementEditorCastRequirement          `json:"requirements"`
	Completions          []achievementEditorCharacterCompletion      `json:"completions"`
	Progress             []achievementEditorCharacterProgress        `json:"progress"`
	RewardLedgers        []achievementEditorCharacterRewardLedger    `json:"reward_ledgers"`
	RewardSelections     []achievementEditorCharacterRewardSelection `json:"reward_selections"`
	PendingUpdates       []achievementEditorCharacterPendingUpdate   `json:"pending_updates"`
	OrphanAchievementIDs []uint32                                    `json:"orphan_achievement_ids"`
}

type achievementEditorCharacterUpdateBase struct {
	Reason                string  `json:"reason"`
	Confirmation          string  `json:"confirmation"`
	CharacterConfirmation string  `json:"character_confirmation"`
	ExpectedVersion       *uint32 `json:"expected_version"`
}

type achievementEditorProgressRequest struct {
	achievementEditorCharacterUpdateBase
	AchievementID        uint32  `json:"achievement_id"`
	ComponentType        uint8   `json:"component_type"`
	ComponentID          uint32  `json:"component_id"`
	CurrentCount         uint32  `json:"current_count"`
	ExpectedCurrentCount *string `json:"expected_current_count,omitempty"`
}

type achievementEditorForceCompleteRequest struct {
	achievementEditorCharacterUpdateBase
	AchievementID uint32 `json:"achievement_id"`
}

type achievementEditorResetRequest struct {
	achievementEditorCharacterUpdateBase
	AchievementID                   uint32 `json:"achievement_id"`
	ClearRewardHistory              bool   `json:"clear_reward_history"`
	AcknowledgeRegrantRisk          bool   `json:"acknowledge_regrant_risk"`
	AcknowledgeStaleProcessingLease bool   `json:"acknowledge_stale_processing_lease"`
}

type achievementEditorRewardRetryRequest struct {
	achievementEditorCharacterUpdateBase
	AchievementID            uint32 `json:"achievement_id"`
	RewardID                 string `json:"reward_id"`
	ExpectedStatus           uint8  `json:"expected_status"`
	AcknowledgeDuplicateRisk bool   `json:"acknowledge_duplicate_risk"`
}

type achievementEditorSelectionRetryRequest struct {
	achievementEditorCharacterUpdateBase
	AchievementID            uint32 `json:"achievement_id"`
	RewardSetID              uint32 `json:"reward_set_id"`
	ExpectedStatus           uint8  `json:"expected_status"`
	AcknowledgeDuplicateRisk bool   `json:"acknowledge_duplicate_risk"`
}

type achievementEditorPendingUpdateRequest struct {
	Reason                          string `json:"reason"`
	Confirmation                    string `json:"confirmation"`
	CharacterConfirmation           string `json:"character_confirmation"`
	UpdateID                        string `json:"update_id"`
	Action                          string `json:"action"`
	ExpectedStatus                  uint8  `json:"expected_status"`
	ExpectedAttemptCount            uint32 `json:"expected_attempt_count"`
	AcknowledgeStaleProcessingLease bool   `json:"acknowledge_stale_processing_lease"`
}

type achievementEditorCharacterUpdateResponse struct {
	Detail  achievementEditorCharacterDetail `json:"detail"`
	AuditID uint                             `json:"audit_id"`
}

type achievementEditorCharacterDetailPage struct {
	Detail achievementEditorCharacterDetail `json:"detail"`
	Total  int64                            `json:"total"`
	Page   int                              `json:"page"`
	Limit  int                              `json:"limit"`
}
