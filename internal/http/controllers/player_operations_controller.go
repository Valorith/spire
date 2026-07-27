package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	playerOperationsDefaultPageSize = 30
	playerOperationsMaxPageSize     = 100
	playerOperationsMaxPage         = 1000
	playerOperationsLookupLimit     = 20
	playerOperationsReasonMinLength = 8
	playerOperationsReasonMaxLength = 240
	playerOperationsMaxCurrency     = uint64(2147483647)
)

const (
	playerOperationsEventCharacterUpdate   = "PLAYER_OPERATIONS_CHARACTER_UPDATE"
	playerOperationsEventCharacterTransfer = "PLAYER_OPERATIONS_CHARACTER_TRANSFER"
	playerOperationsEventCharacterRelocate = "PLAYER_OPERATIONS_CHARACTER_RELOCATE"
	playerOperationsEventCharacterGuild    = "PLAYER_OPERATIONS_CHARACTER_GUILD"
	playerOperationsEventCharacterCurrency = "PLAYER_OPERATIONS_CHARACTER_CURRENCY"
	playerOperationsEventCharacterRetire   = "PLAYER_OPERATIONS_CHARACTER_RETIRE"
	playerOperationsEventCharacterRestore  = "PLAYER_OPERATIONS_CHARACTER_RESTORE"
	playerOperationsEventAccountUpdate     = "PLAYER_OPERATIONS_ACCOUNT_UPDATE"
	playerOperationsEventAccountSanction   = "PLAYER_OPERATIONS_ACCOUNT_SANCTION"
	playerOperationsEventAccountDelete     = "PLAYER_OPERATIONS_ACCOUNT_DELETE"
	playerOperationsEventGuildCreate       = "PLAYER_OPERATIONS_GUILD_CREATE"
	playerOperationsEventGuildUpdate       = "PLAYER_OPERATIONS_GUILD_UPDATE"
	playerOperationsEventGuildDelete       = "PLAYER_OPERATIONS_GUILD_DELETE"
	playerOperationsEventGuildMember       = "PLAYER_OPERATIONS_GUILD_MEMBER"
	playerOperationsEventGuildAccess       = "PLAYER_OPERATIONS_GUILD_ACCESS"
)

type PlayerOperationsController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type playerOperationsPage struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type playerOperationsSummary struct {
	Accounts          int64 `json:"accounts"`
	SuspendedAccounts int64 `json:"suspended_accounts"`
	Characters        int64 `json:"characters"`
	OnlineCharacters  int64 `json:"online_characters"`
	RetiredCharacters int64 `json:"retired_characters"`
	Guilds            int64 `json:"guilds"`
	GuildMembers      int64 `json:"guild_members"`
}

type playerOperationsCharacterSummary struct {
	ID          int        `json:"id"`
	AccountID   int        `json:"account_id"`
	AccountName string     `json:"account_name"`
	Name        string     `json:"name"`
	Race        int        `json:"race"`
	Class       int        `json:"class"`
	Level       int        `json:"level"`
	ZoneID      int        `json:"zone_id"`
	ZoneName    string     `json:"zone_name"`
	GuildID     int        `json:"guild_id"`
	GuildName   string     `json:"guild_name"`
	GuildRank   int        `json:"guild_rank"`
	Online      bool       `json:"online"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

type playerOperationsAccountSummary struct {
	ID               int        `json:"id"`
	Name             string     `json:"name"`
	Status           int        `json:"status"`
	CharacterCount   int64      `json:"character_count"`
	OnlineCharacters int64      `json:"online_characters"`
	LastLogin        int64      `json:"last_login"`
	SuspendedUntil   *time.Time `json:"suspended_until,omitempty"`
}

type playerOperationsGuildSummary struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	LeaderID    int    `json:"leader_id"`
	LeaderName  string `json:"leader_name"`
	MemberCount int64  `json:"member_count"`
	BankItems   int64  `json:"bank_items"`
	Favor       uint   `json:"favor"`
}

type playerOperationsCharacter struct {
	ID                int        `json:"id"`
	AccountID         int        `json:"account_id"`
	Name              string     `json:"name"`
	LastName          string     `json:"last_name"`
	Title             string     `json:"title"`
	Suffix            string     `json:"suffix"`
	ZoneID            int        `json:"zone_id"`
	ZoneInstance      int        `json:"zone_instance"`
	X                 float64    `json:"x"`
	Y                 float64    `json:"y"`
	Z                 float64    `json:"z"`
	Heading           float64    `json:"heading"`
	Gender            int        `json:"gender"`
	Race              int        `json:"race"`
	Class             int        `json:"class"`
	Level             int        `json:"level"`
	Deity             int        `json:"deity"`
	LastLogin         int64      `json:"last_login"`
	TimePlayed        int64      `json:"time_played"`
	Anon              int        `json:"anon"`
	GM                int        `json:"gm"`
	Experience        uint64     `json:"experience"`
	ExperienceEnabled bool       `json:"experience_enabled"`
	AAPoints          uint64     `json:"aa_points"`
	AAPointsSpent     uint64     `json:"aa_points_spent"`
	AAExperience      uint64     `json:"aa_experience"`
	PracticePoints    uint64     `json:"practice_points"`
	PVP               bool       `json:"pvp"`
	ShowHelm          bool       `json:"show_helm"`
	GroupAutoConsent  bool       `json:"group_auto_consent"`
	RaidAutoConsent   bool       `json:"raid_auto_consent"`
	GuildAutoConsent  bool       `json:"guild_auto_consent"`
	Autosplit         bool       `json:"autosplit"`
	LookingForGroup   bool       `json:"looking_for_group"`
	LookingForPlayers bool       `json:"looking_for_players"`
	Online            bool       `json:"online"`
	DeletedAt         *time.Time `json:"deleted_at,omitempty"`
}

type playerOperationsCharacterContext struct {
	Account       playerOperationsAccountContext   `json:"account"`
	Guild         *playerOperationsGuildMembership `json:"guild,omitempty"`
	Zone          playerOperationsZone             `json:"zone"`
	Currency      playerOperationsCurrency         `json:"currency"`
	Binds         []playerOperationsBind           `json:"binds"`
	RelatedCounts map[string]int64                 `json:"related_counts"`
}

type playerOperationsCharacterDetail struct {
	Character playerOperationsCharacter        `json:"character"`
	Context   playerOperationsCharacterContext `json:"context"`
}

type playerOperationsAccountContext struct {
	ID             int        `json:"id"`
	Name           string     `json:"name"`
	Status         int        `json:"status"`
	SuspendedUntil *time.Time `json:"suspended_until,omitempty"`
}

type playerOperationsGuildMembership struct {
	CharacterID  int    `gorm:"column:character_id" json:"character_id"`
	GuildID      int    `json:"guild_id"`
	GuildName    string `json:"guild_name"`
	Rank         int    `json:"rank"`
	RankTitle    string `json:"rank_title"`
	Banker       bool   `json:"banker"`
	Alt          bool   `json:"alt"`
	Tribute      bool   `json:"tribute"`
	PublicNote   string `json:"public_note"`
	TotalTribute uint64 `json:"total_tribute"`
	Online       bool   `json:"online"`
}

type playerOperationsZone struct {
	ID        int     `json:"id"`
	Version   int     `json:"version"`
	ShortName string  `json:"short_name"`
	LongName  string  `json:"long_name"`
	SafeX     float64 `json:"safe_x"`
	SafeY     float64 `json:"safe_y"`
	SafeZ     float64 `json:"safe_z"`
	SafeH     float64 `json:"safe_heading"`
}

type playerOperationsCurrency struct {
	Platinum       uint64 `json:"platinum"`
	Gold           uint64 `json:"gold"`
	Silver         uint64 `json:"silver"`
	Copper         uint64 `json:"copper"`
	PlatinumBank   uint64 `gorm:"column:platinum_bank" json:"platinum_bank"`
	GoldBank       uint64 `gorm:"column:gold_bank" json:"gold_bank"`
	SilverBank     uint64 `gorm:"column:silver_bank" json:"silver_bank"`
	CopperBank     uint64 `gorm:"column:copper_bank" json:"copper_bank"`
	RadiantCrystal uint64 `gorm:"column:radiant_crystals" json:"radiant_crystals"`
	EbonCrystal    uint64 `gorm:"column:ebon_crystals" json:"ebon_crystals"`
}

type playerOperationsBind struct {
	Slot       int     `json:"slot"`
	ZoneID     int     `json:"zone_id"`
	InstanceID int     `json:"instance_id"`
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	Z          float64 `json:"z"`
	Heading    float64 `json:"heading"`
	ZoneName   string  `json:"zone_name"`
}

type playerOperationsAccount struct {
	ID               int        `json:"id"`
	Name             string     `json:"name"`
	CharacterName    string     `json:"character_name"`
	AutoLoginName    string     `json:"auto_login_name"`
	SharedPlatinum   uint64     `json:"shared_platinum"`
	Status           int        `json:"status"`
	LoginServer      string     `json:"login_server"`
	LoginServerID    *uint      `json:"login_server_id,omitempty"`
	GMSpeed          bool       `json:"gm_speed"`
	Invulnerable     bool       `json:"invulnerable"`
	FlyMode          int        `json:"fly_mode"`
	IgnoreTells      bool       `json:"ignore_tells"`
	Revoked          bool       `json:"revoked"`
	Karma            uint       `json:"karma"`
	MiniLoginIP      string     `json:"mini_login_ip"`
	Hidden           bool       `json:"hidden"`
	RulesAccepted    bool       `json:"rules_accepted"`
	SuspendedUntil   *time.Time `json:"suspended_until,omitempty"`
	CreatedAtUnix    uint64     `json:"created_at_unix"`
	BanReason        string     `json:"ban_reason"`
	SuspensionReason string     `json:"suspension_reason"`
}

type playerOperationsAccountIP struct {
	IP       string    `json:"ip"`
	Count    int       `json:"count"`
	LastUsed time.Time `json:"last_used"`
}

type playerOperationsAccountFlag struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type playerOperationsAccountReward struct {
	RewardID int `json:"reward_id"`
	Amount   int `json:"amount"`
}

type playerOperationsAccountDetail struct {
	Account    playerOperationsAccount            `json:"account"`
	Characters []playerOperationsCharacterSummary `json:"characters"`
	IPs        []playerOperationsAccountIP        `json:"ips"`
	Flags      []playerOperationsAccountFlag      `json:"flags"`
	Rewards    []playerOperationsAccountReward    `json:"rewards"`
}

type playerOperationsGuild struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	LeaderID   int    `json:"leader_id"`
	LeaderName string `json:"leader_name"`
	MinStatus  int    `json:"min_status"`
	MOTD       string `json:"motd"`
	MOTDSetter string `json:"motd_setter"`
	Channel    string `json:"channel"`
	URL        string `json:"url"`
	Tribute    uint64 `json:"tribute"`
	Favor      uint64 `json:"favor"`
}

type playerOperationsGuildRank struct {
	Rank  int    `json:"rank"`
	Title string `json:"title"`
}

type playerOperationsGuildPermission struct {
	ID         int `json:"id"`
	Permission int `json:"permission"`
}

type playerOperationsGuildBankSummary struct {
	ItemCount int64 `json:"item_count"`
	SlotsUsed int64 `json:"slots_used"`
}

type playerOperationsGuildRelation struct {
	Guild1 int `json:"guild_1"`
	Guild2 int `json:"guild_2"`
}

type playerOperationsGuildTribute struct {
	TributeID1    int  `json:"tribute_id_1"`
	TributeTier1  int  `json:"tribute_tier_1"`
	TributeID2    int  `json:"tribute_id_2"`
	TributeTier2  int  `json:"tribute_tier_2"`
	TimeRemaining int  `json:"time_remaining"`
	Enabled       bool `json:"enabled"`
}

type playerOperationsGuildDetail struct {
	Guild       playerOperationsGuild              `json:"guild"`
	Members     []playerOperationsCharacterSummary `json:"members"`
	Memberships []playerOperationsGuildMembership  `json:"memberships"`
	Ranks       []playerOperationsGuildRank        `json:"ranks"`
	Permissions []playerOperationsGuildPermission  `json:"permissions"`
	Bank        playerOperationsGuildBankSummary   `json:"bank"`
	Relations   []playerOperationsGuildRelation    `json:"relations"`
	Tribute     *playerOperationsGuildTribute      `json:"tribute,omitempty"`
}

type playerOperationsCharacterInput struct {
	Name              string `json:"name"`
	LastName          string `json:"last_name"`
	Title             string `json:"title"`
	Suffix            string `json:"suffix"`
	Gender            int    `json:"gender"`
	Race              int    `json:"race"`
	Class             int    `json:"class"`
	Level             int    `json:"level"`
	Deity             int    `json:"deity"`
	Anon              int    `json:"anon"`
	GM                int    `json:"gm"`
	ExperienceEnabled bool   `json:"experience_enabled"`
	AAPoints          uint64 `json:"aa_points"`
	PracticePoints    uint64 `json:"practice_points"`
	PVP               bool   `json:"pvp"`
	ShowHelm          bool   `json:"show_helm"`
	GroupAutoConsent  bool   `json:"group_auto_consent"`
	RaidAutoConsent   bool   `json:"raid_auto_consent"`
	GuildAutoConsent  bool   `json:"guild_auto_consent"`
	Autosplit         bool   `json:"autosplit"`
	LookingForGroup   bool   `json:"looking_for_group"`
	LookingForPlayers bool   `json:"looking_for_players"`
}

type playerOperationsCharacterTransferRequest struct {
	AccountID         int    `json:"account_id"`
	ExpectedAccountID int    `json:"expected_account_id"`
	Reason            string `json:"reason"`
}

type playerOperationsCharacterRelocateRequest struct {
	ZoneID             int     `json:"zone_id"`
	ZoneVersion        int     `json:"zone_version"`
	UseSafeCoordinates bool    `json:"use_safe_coordinates"`
	X                  float64 `json:"x"`
	Y                  float64 `json:"y"`
	Z                  float64 `json:"z"`
	Heading            float64 `json:"heading"`
	ExpectedZoneID     int     `json:"expected_zone_id"`
	Reason             string  `json:"reason"`
}

type playerOperationsCharacterGuildRequest struct {
	GuildID         int    `json:"guild_id"`
	Rank            int    `json:"rank"`
	Banker          bool   `json:"banker"`
	Alt             bool   `json:"alt"`
	TributeEnabled  bool   `json:"tribute_enabled"`
	PublicNote      string `json:"public_note"`
	ExpectedGuildID int    `json:"expected_guild_id"`
	Reason          string `json:"reason"`
}

type playerOperationsCharacterCurrencyRequest struct {
	Currency playerOperationsCurrency `json:"currency"`
	Expected playerOperationsCurrency `json:"expected"`
	Reason   string                   `json:"reason"`
}

type playerOperationsLifecycleRequest struct {
	Confirmation string `json:"confirmation"`
	Reason       string `json:"reason"`
}

type playerOperationsAccountInput struct {
	CharacterName  string `json:"character_name"`
	AutoLoginName  string `json:"auto_login_name"`
	SharedPlatinum uint64 `json:"shared_platinum"`
	Status         int    `json:"status"`
	GMSpeed        bool   `json:"gm_speed"`
	Invulnerable   bool   `json:"invulnerable"`
	FlyMode        int    `json:"fly_mode"`
	IgnoreTells    bool   `json:"ignore_tells"`
	Revoked        bool   `json:"revoked"`
	Karma          uint   `json:"karma"`
	MiniLoginIP    string `json:"mini_login_ip"`
	Hidden         bool   `json:"hidden"`
	RulesAccepted  bool   `json:"rules_accepted"`
}

type playerOperationsAccountSanctionRequest struct {
	Mode                string     `json:"mode"`
	Until               *time.Time `json:"until,omitempty"`
	Reason              string     `json:"reason"`
	ExpectedSuspendedAt *time.Time `json:"expected_suspended_until,omitempty"`
}

type playerOperationsConfirmedDeleteRequest struct {
	Confirmation string `json:"confirmation"`
	Reason       string `json:"reason"`
}

type playerOperationsGuildInput struct {
	Name      string `json:"name"`
	LeaderID  int    `json:"leader_id"`
	MinStatus int    `json:"min_status"`
	MOTD      string `json:"motd"`
	Channel   string `json:"channel"`
	URL       string `json:"url"`
	Tribute   uint64 `json:"tribute"`
	Favor     uint64 `json:"favor"`
}

type playerOperationsGuildMemberInput struct {
	CharacterID    int    `json:"character_id"`
	Rank           int    `json:"rank"`
	Banker         bool   `json:"banker"`
	Alt            bool   `json:"alt"`
	TributeEnabled bool   `json:"tribute_enabled"`
	PublicNote     string `json:"public_note"`
	Reason         string `json:"reason"`
}

type playerOperationsGuildAccessInput struct {
	Ranks       []playerOperationsGuildRank       `json:"ranks"`
	Permissions []playerOperationsGuildPermission `json:"permissions"`
	Reason      string                            `json:"reason"`
}

type playerOperationsConflictError struct {
	message string
}

func (e playerOperationsConflictError) Error() string {
	return e.message
}

func NewPlayerOperationsController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *PlayerOperationsController {
	return &PlayerOperationsController{db: db, auditLog: auditLog}
}

func (p *PlayerOperationsController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "player-operations/summary", p.summary, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/characters", p.listCharacters, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/character/:id", p.getCharacter, nil),
		routes.RegisterRoute(http.MethodPatch, "player-operations/character/:id", p.updateCharacter, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/character/:id/transfer", p.transferCharacter, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/character/:id/relocate", p.relocateCharacter, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/character/:id/guild", p.updateCharacterGuild, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/character/:id/currency", p.updateCharacterCurrency, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/character/:id/retire", p.retireCharacter, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/character/:id/restore", p.restoreCharacter, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/accounts", p.listAccounts, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/account/:id", p.getAccount, nil),
		routes.RegisterRoute(http.MethodPatch, "player-operations/account/:id", p.updateAccount, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/account/:id/sanction", p.sanctionAccount, nil),
		routes.RegisterRoute(http.MethodDelete, "player-operations/account/:id", p.deleteAccount, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/guilds", p.listGuilds, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/guild/:id", p.getGuild, nil),
		routes.RegisterRoute(http.MethodPut, "player-operations/guild", p.createGuild, nil),
		routes.RegisterRoute(http.MethodPatch, "player-operations/guild/:id", p.updateGuild, nil),
		routes.RegisterRoute(http.MethodDelete, "player-operations/guild/:id", p.deleteGuild, nil),
		routes.RegisterRoute(http.MethodPost, "player-operations/guild/:id/member", p.addGuildMember, nil),
		routes.RegisterRoute(http.MethodPatch, "player-operations/guild/:id/member/:character_id", p.updateGuildMember, nil),
		routes.RegisterRoute(http.MethodDelete, "player-operations/guild/:id/member/:character_id", p.removeGuildMember, nil),
		routes.RegisterRoute(http.MethodPatch, "player-operations/guild/:id/access", p.updateGuildAccess, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/lookup/accounts", p.lookupAccounts, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/lookup/characters", p.lookupCharacters, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/lookup/guilds", p.lookupGuilds, nil),
		routes.RegisterRoute(http.MethodGet, "player-operations/lookup/zones", p.lookupZones, nil),
	}
}

func (p *PlayerOperationsController) summary(c echo.Context) error {
	db := p.db.Get(models.CharacterDatum{}, c)
	var result playerOperationsSummary
	queries := []struct {
		table string
		where string
		dest  *int64
	}{
		{"account", "", &result.Accounts},
		{"account", "suspendeduntil IS NOT NULL AND suspendeduntil > NOW()", &result.SuspendedAccounts},
		{"character_data", "deleted_at IS NULL", &result.Characters},
		{"character_data", "deleted_at IS NULL AND ingame = 1", &result.OnlineCharacters},
		{"character_data", "deleted_at IS NOT NULL", &result.RetiredCharacters},
		{"guilds", "", &result.Guilds},
		{"guild_members", "", &result.GuildMembers},
	}
	for _, query := range queries {
		statement := db.Table(query.table)
		if query.where != "" {
			statement = statement.Where(query.where)
		}
		if err := statement.Count(query.dest).Error; err != nil {
			return playerOperationsDatabaseError(c, err)
		}
	}
	return c.JSON(http.StatusOK, result)
}

func (p *PlayerOperationsController) listCharacters(c echo.Context) error {
	db := p.db.Get(models.CharacterDatum{}, c)
	zoneDB := p.db.Get(models.Zone{}, c)
	page, limit := playerOperationsPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	state := strings.ToLower(strings.TrimSpace(c.QueryParam("state")))

	base := db.Table("character_data ch").
		Joins("LEFT JOIN account a ON a.id = ch.account_id").
		Joins("LEFT JOIN guild_members gm ON gm.char_id = ch.id").
		Joins("LEFT JOIN guilds g ON g.id = gm.guild_id")
	if search != "" {
		like := "%" + search + "%"
		base = base.Where(
			"ch.name LIKE ? OR a.name LIKE ? OR g.name LIKE ? OR CAST(ch.id AS CHAR) LIKE ?",
			like, like, like, like,
		)
	}
	switch state {
	case "online":
		base = base.Where("ch.deleted_at IS NULL AND ch.ingame = 1")
	case "retired":
		base = base.Where("ch.deleted_at IS NOT NULL")
	default:
		base = base.Where("ch.deleted_at IS NULL")
	}

	var total int64
	if err := base.Session(&gorm.Session{}).Distinct("ch.id").Count(&total).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	results := make([]playerOperationsCharacterSummary, 0)
	if err := base.Session(&gorm.Session{}).Select(`
		ch.id,
		ch.account_id,
		COALESCE(a.name, CONCAT('Unknown account #', ch.account_id)) AS account_name,
		ch.name,
		ch.race,
		ch.class,
		ch.level,
		ch.zone_id,
		CONCAT('Zone #', ch.zone_id) AS zone_name,
		COALESCE(gm.guild_id, 0) AS guild_id,
		COALESCE(g.name, '') AS guild_name,
		COALESCE(gm.rank, 0) AS guild_rank,
		ch.ingame = 1 AS online,
		ch.deleted_at
	`).Order("ch.name, ch.id").Limit(limit).Offset((page - 1) * limit).Scan(&results).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	if err := hydratePlayerOperationsCharacterZones(zoneDB, results); err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (p *PlayerOperationsController) listAccounts(c echo.Context) error {
	db := p.db.Get(models.Account{}, c)
	page, limit := playerOperationsPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	state := strings.ToLower(strings.TrimSpace(c.QueryParam("state")))

	base := db.Table("account a")
	if search != "" {
		like := "%" + search + "%"
		base = base.Where("a.name LIKE ? OR CAST(a.id AS CHAR) LIKE ? OR CAST(a.lsaccount_id AS CHAR) LIKE ?", like, like, like)
	}
	switch state {
	case "suspended":
		base = base.Where("a.suspendeduntil IS NOT NULL AND a.suspendeduntil > NOW()")
	case "privileged":
		base = base.Where("a.status > 0")
	}
	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	results := make([]playerOperationsAccountSummary, 0)
	if err := base.Session(&gorm.Session{}).Select(`
		a.id,
		a.name,
		a.status,
		(SELECT COUNT(*) FROM character_data ch WHERE ch.account_id = a.id) AS character_count,
		(SELECT COUNT(*) FROM character_data ch WHERE ch.account_id = a.id AND ch.deleted_at IS NULL AND ch.ingame = 1) AS online_characters,
		COALESCE((SELECT MAX(ch.last_login) FROM character_data ch WHERE ch.account_id = a.id), 0) AS last_login,
		a.suspendeduntil AS suspended_until
	`).Order("a.name, a.id").Limit(limit).Offset((page - 1) * limit).Scan(&results).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (p *PlayerOperationsController) listGuilds(c echo.Context) error {
	db := p.db.Get(models.Guild{}, c)
	page, limit := playerOperationsPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	base := db.Table("guilds g").Joins("LEFT JOIN character_data leader ON leader.id = g.leader")
	if search != "" {
		like := "%" + search + "%"
		base = base.Where("g.name LIKE ? OR leader.name LIKE ? OR CAST(g.id AS CHAR) LIKE ?", like, like, like)
	}
	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	results := make([]playerOperationsGuildSummary, 0)
	if err := base.Session(&gorm.Session{}).Select(`
		g.id,
		g.name,
		g.leader AS leader_id,
		COALESCE(leader.name, '') AS leader_name,
		(SELECT COUNT(*) FROM guild_members gm WHERE gm.guild_id = g.id) AS member_count,
		(SELECT COUNT(*) FROM guild_bank gb WHERE gb.guildid = g.id) AS bank_items,
		g.favor
	`).Order("g.name, g.id").Limit(limit).Offset((page - 1) * limit).Scan(&results).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (p *PlayerOperationsController) getCharacter(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := loadPlayerOperationsCharacterDetail(
		p.db.Get(models.CharacterDatum{}, c),
		p.db.Get(models.Zone{}, c),
		id,
	)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (p *PlayerOperationsController) getAccount(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Account")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := loadPlayerOperationsAccountDetail(
		p.db.Get(models.Account{}, c),
		p.db.Get(models.Zone{}, c),
		id,
	)
	if err != nil {
		return playerOperationsLoadError(c, "Account", err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (p *PlayerOperationsController) getGuild(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Guild")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := loadPlayerOperationsGuildDetail(
		p.db.Get(models.Guild{}, c),
		p.db.Get(models.Zone{}, c),
		id,
	)
	if err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (p *PlayerOperationsController) updateCharacter(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input playerOperationsCharacterInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid character payload"})
	}
	input = normalizePlayerOperationsCharacterInput(input)
	if err := validatePlayerOperationsCharacter(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.CharacterDatum{}, c)
	beforeDetail, err := loadPlayerOperationsCharacterDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	before := beforeDetail.Character
	if before.DeletedAt != nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Restore the character before editing its profile"})
	}
	payload := map[string]interface{}{
		"action": "update", "character_id": id, "character_name": before.Name,
		"before": before, "after": input,
	}
	auditID, err := p.writeAudit(c, playerOperationsEventCharacterUpdate, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	updates := map[string]interface{}{
		"name": input.Name, "last_name": input.LastName, "title": input.Title, "suffix": input.Suffix,
		"gender": input.Gender, "race": input.Race, "class": input.Class, "level": input.Level, "deity": input.Deity,
		"anon": input.Anon, "gm": input.GM, "exp_enabled": boolInt(input.ExperienceEnabled),
		"aa_points": input.AAPoints, "points": input.PracticePoints, "pvp_status": boolInt(input.PVP),
		"show_helm": boolInt(input.ShowHelm), "group_auto_consent": boolInt(input.GroupAutoConsent),
		"raid_auto_consent": boolInt(input.RaidAutoConsent), "guild_auto_consent": boolInt(input.GuildAutoConsent),
		"autosplit_enabled": boolInt(input.Autosplit), "lfg": boolInt(input.LookingForGroup),
		"lfp": boolInt(input.LookingForPlayers),
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct {
			ID        int
			Name      string
			DeletedAt *time.Time `gorm:"column:deleted_at"`
		}
		if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id, name, deleted_at").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		if locked.DeletedAt != nil {
			return playerOperationsConflict("Restore the character before editing its profile")
		}
		if input.Name != locked.Name {
			var duplicate int64
			if err := tx.Table("character_data").Where("name = ? AND id <> ?", input.Name, id).Count(&duplicate).Error; err != nil {
				return err
			}
			if duplicate > 0 {
				return playerOperationsConflict("Cannot rename %s because that name is already in use", input.Name)
			}
		}
		if err := tx.Table("character_data").Where("id = ?", id).Updates(updates).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Character", err)
	}
	detail, err := loadPlayerOperationsCharacterDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) transferCharacter(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsCharacterTransferRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid transfer payload"})
	}
	if request.AccountID <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Select a destination account"})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.CharacterDatum{}, c)
	var character struct {
		ID        int
		Name      string
		AccountID int `gorm:"column:account_id"`
	}
	if err := db.Table("character_data").Where("id = ?", id).Take(&character).Error; err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	if request.ExpectedAccountID != character.AccountID {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Character account changed; refresh before transferring"})
	}
	if request.AccountID == character.AccountID {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Destination account is already assigned"})
	}
	var destination playerOperationsAccountContext
	if err := db.Table("account").Select("id, name, status, suspendeduntil AS suspended_until").Where("id = ?", request.AccountID).Take(&destination).Error; err != nil {
		return playerOperationsLoadError(c, "Destination account", err)
	}
	payload := map[string]interface{}{
		"action": "transfer", "character_id": id, "character_name": character.Name,
		"from_account_id": character.AccountID, "to_account_id": destination.ID,
		"to_account_name": destination.Name, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventCharacterTransfer, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var current struct {
			AccountID int `gorm:"column:account_id"`
		}
		if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).Select("account_id").Where("id = ?", id).Take(&current).Error; err != nil {
			return err
		}
		if current.AccountID != request.ExpectedAccountID {
			return playerOperationsConflict("Character account changed; refresh before transferring")
		}
		var count int64
		if err := tx.Table("account").Where("id = ?", request.AccountID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return gorm.ErrRecordNotFound
		}
		return tx.Table("character_data").Where("id = ?", id).Update("account_id", request.AccountID).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Character", err)
	}
	detail, err := loadPlayerOperationsCharacterDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) relocateCharacter(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsCharacterRelocateRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid relocation payload"})
	}
	if request.ZoneID <= 0 || request.ZoneVersion != 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Select a valid base zone"})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.CharacterDatum{}, c)
	zoneDB := p.db.Get(models.Zone{}, c)
	var zone playerOperationsZone
	if err := zoneDB.Table("zone").Select(`
		zoneidnumber AS id, version, COALESCE(short_name, '') AS short_name, long_name,
		safe_x, safe_y, safe_z, safe_heading
	`).Where("zoneidnumber = ? AND version = ?", request.ZoneID, request.ZoneVersion).Take(&zone).Error; err != nil {
		return playerOperationsLoadError(c, "Zone", err)
	}
	var character struct {
		ID           int
		Name         string
		ZoneID       int `gorm:"column:zone_id"`
		ZoneInstance int `gorm:"column:zone_instance"`
	}
	if err := db.Table("character_data").Where("id = ?", id).Take(&character).Error; err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	if request.ExpectedZoneID != character.ZoneID {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Character location changed; refresh before moving"})
	}
	x, y, z, heading := request.X, request.Y, request.Z, request.Heading
	if request.UseSafeCoordinates {
		x, y, z, heading = zone.SafeX, zone.SafeY, zone.SafeZ, zone.SafeH
	}
	payload := map[string]interface{}{
		"action": "relocate", "character_id": id, "character_name": character.Name,
		"from_zone_id": character.ZoneID, "to_zone_id": zone.ID, "zone_name": zone.LongName,
		"zone_version": zone.Version, "x": x, "y": y, "z": z, "heading": heading,
		"safe_coordinates": request.UseSafeCoordinates, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventCharacterRelocate, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var current struct {
			ZoneID int `gorm:"column:zone_id"`
		}
		if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).Select("zone_id").Where("id = ?", id).Take(&current).Error; err != nil {
			return err
		}
		if current.ZoneID != request.ExpectedZoneID {
			return playerOperationsConflict("Character location changed; refresh before moving")
		}
		return tx.Table("character_data").Where("id = ?", id).Updates(map[string]interface{}{
			"zone_id": request.ZoneID, "zone_instance": 0,
			"x": x, "y": y, "z": z, "heading": heading,
		}).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Character", err)
	}
	detail, err := loadPlayerOperationsCharacterDetail(db, zoneDB, id)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) updateCharacterGuild(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsCharacterGuildRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid guild membership payload"})
	}
	if err := validatePlayerOperationsGuildMembership(request.GuildID, request.Rank); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.GuildMember{}, c)
	var character struct {
		ID   int
		Name string
	}
	if err := db.Table("character_data").Select("id, name").Where("id = ?", id).Take(&character).Error; err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	var current struct {
		GuildID int `gorm:"column:guild_id"`
	}
	err = db.Table("guild_members").Select("guild_id").Where("char_id = ?", id).Take(&current).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		current.GuildID = 0
	} else if err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	if current.GuildID != request.ExpectedGuildID {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Guild membership changed; refresh before editing"})
	}
	payload := map[string]interface{}{
		"action": "membership", "character_id": id, "character_name": character.Name,
		"from_guild_id": current.GuildID, "to_guild_id": request.GuildID, "rank": request.Rank,
		"banker": request.Banker, "alt": request.Alt, "tribute_enabled": request.TributeEnabled,
		"reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventCharacterGuild, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct {
			GuildID int `gorm:"column:guild_id"`
		}
		err := tx.Table("guild_members").Clauses(clause.Locking{Strength: "UPDATE"}).Select("guild_id").Where("char_id = ?", id).Take(&locked).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			locked.GuildID = 0
		} else if err != nil {
			return err
		}
		if locked.GuildID != request.ExpectedGuildID {
			return playerOperationsConflict("Guild membership changed; refresh before editing")
		}
		if request.GuildID == 0 {
			if locked.GuildID > 0 {
				if err := tx.Table("guilds").Where("id = ? AND leader = ?", locked.GuildID, id).Update("leader", 0).Error; err != nil {
					return err
				}
			}
			return tx.Table("guild_members").Where("char_id = ?", id).Delete(nil).Error
		}
		var guildCount int64
		if err := tx.Table("guilds").Where("id = ?", request.GuildID).Count(&guildCount).Error; err != nil {
			return err
		}
		if guildCount == 0 {
			return gorm.ErrRecordNotFound
		}
		values := map[string]interface{}{
			"char_id": id, "guild_id": request.GuildID, "rank": request.Rank,
			"banker": boolInt(request.Banker), "alt": boolInt(request.Alt),
			"tribute_enable": boolInt(request.TributeEnabled), "public_note": request.PublicNote,
		}
		if locked.GuildID != request.GuildID {
			if err := tx.Table("guilds").Where("id = ? AND leader = ?", locked.GuildID, id).Update("leader", 0).Error; err != nil {
				return err
			}
		}
		if request.Rank == 1 {
			if err := tx.Table("guild_members").Where("guild_id = ? AND rank = 1 AND char_id <> ?", request.GuildID, id).Update("rank", 2).Error; err != nil {
				return err
			}
			if err := tx.Table("guilds").Where("id = ?", request.GuildID).Update("leader", id).Error; err != nil {
				return err
			}
		} else if locked.GuildID == request.GuildID {
			if err := tx.Table("guilds").Where("id = ? AND leader = ?", request.GuildID, id).Update("leader", 0).Error; err != nil {
				return err
			}
		}
		if locked.GuildID == 0 {
			return tx.Table("guild_members").Create(values).Error
		}
		return tx.Table("guild_members").Where("char_id = ?", id).Updates(values).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Guild membership", err)
	}
	detail, err := loadPlayerOperationsCharacterDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) updateCharacterCurrency(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsCharacterCurrencyRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid currency payload"})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if !playerOperationsCurrencyWithinBounds(request.Currency) || !playerOperationsCurrencyWithinBounds(request.Expected) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Currency values cannot exceed %d", playerOperationsMaxCurrency)})
	}
	db := p.db.Get(models.CharacterCurrency{}, c)
	var character struct{ Name string }
	if err := db.Table("character_data").Select("name").Where("id = ? AND deleted_at IS NULL", id).Take(&character).Error; err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	payload := map[string]interface{}{
		"action": "currency", "character_id": id, "character_name": character.Name,
		"before": request.Expected, "after": request.Currency, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventCharacterCurrency, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		current, err := loadPlayerOperationsCurrency(tx, id, true)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if current != request.Expected {
			return playerOperationsConflict("Character currency changed; refresh before saving")
		}
		values := playerOperationsCurrencyValues(id, request.Currency)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return tx.Table("character_currency").Create(values).Error
		}
		return tx.Table("character_currency").Where("id = ?", id).Updates(values).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Character currency", err)
	}
	detail, err := loadPlayerOperationsCharacterDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) retireCharacter(c echo.Context) error {
	return p.changeCharacterLifecycle(c, true)
}

func (p *PlayerOperationsController) restoreCharacter(c echo.Context) error {
	return p.changeCharacterLifecycle(c, false)
}

func (p *PlayerOperationsController) changeCharacterLifecycle(c echo.Context, retire bool) error {
	id, err := playerOperationsPositiveParam(c, "id", "Character")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsLifecycleRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid lifecycle payload"})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.CharacterDatum{}, c)
	var character struct {
		ID        int
		Name      string
		DeletedAt *time.Time `gorm:"column:deleted_at"`
	}
	if err := db.Table("character_data").Where("id = ?", id).Take(&character).Error; err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	if request.Confirmation != character.Name {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Type the exact character name to confirm"})
	}
	if retire && character.DeletedAt != nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Character is already retired"})
	}
	if !retire && character.DeletedAt == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Character is already active"})
	}
	action := "restore"
	event := playerOperationsEventCharacterRestore
	if retire {
		action = "retire"
		event = playerOperationsEventCharacterRetire
	}
	payload := map[string]interface{}{
		"action": action, "character_id": id, "character_name": character.Name,
		"reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, event, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct {
			Name      string
			DeletedAt *time.Time `gorm:"column:deleted_at"`
		}
		if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).Select("name, deleted_at").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		if retire {
			if locked.DeletedAt != nil {
				return playerOperationsConflict("Character is already retired")
			}
			retiredName := playerOperationsRetiredName(locked.Name, id)
			if retiredName == "" {
				return playerOperationsConflict("Cannot retire %s because its name is too long for the reversible retirement marker", locked.Name)
			}
			return tx.Table("character_data").Where("id = ?", id).Updates(map[string]interface{}{
				"name": retiredName, "deleted_at": time.Now(), "ingame": 0,
			}).Error
		}
		if locked.DeletedAt == nil {
			return playerOperationsConflict("Character is already active")
		}
		restoredName := playerOperationsRestoreName(locked.Name)
		var count int64
		if err := tx.Table("character_data").Where("name = ? AND id <> ?", restoredName, id).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return playerOperationsConflict("Cannot restore %s because that name is already in use", restoredName)
		}
		return tx.Table("character_data").Where("id = ?", id).Updates(map[string]interface{}{
			"name": restoredName, "deleted_at": nil,
		}).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Character", err)
	}
	detail, err := loadPlayerOperationsCharacterDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) updateAccount(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Account")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input playerOperationsAccountInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid account payload"})
	}
	if err := validatePlayerOperationsAccount(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.Account{}, c)
	beforeDetail, err := loadPlayerOperationsAccountDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Account", err)
	}
	before := beforeDetail.Account
	payload := map[string]interface{}{
		"action": "update", "account_id": id, "account_name": before.Name,
		"before": before, "after": input,
	}
	auditID, err := p.writeAudit(c, playerOperationsEventAccountUpdate, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct{ ID int }
		if err := tx.Table("account").Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		return tx.Table("account").Where("id = ?", id).Updates(map[string]interface{}{
			"charname": input.CharacterName, "auto_login_charname": input.AutoLoginName,
			"sharedplat": input.SharedPlatinum, "status": input.Status, "gmspeed": boolInt(input.GMSpeed),
			"invulnerable": boolInt(input.Invulnerable), "flymode": input.FlyMode,
			"ignore_tells": boolInt(input.IgnoreTells), "revoked": boolInt(input.Revoked),
			"karma": input.Karma, "minilogin_ip": input.MiniLoginIP, "hideme": boolInt(input.Hidden),
			"rulesflag": boolInt(input.RulesAccepted),
		}).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Account", err)
	}
	detail, err := loadPlayerOperationsAccountDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Account", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) sanctionAccount(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Account")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsAccountSanctionRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid sanction payload"})
	}
	request.Mode = strings.ToLower(strings.TrimSpace(request.Mode))
	if request.Mode != "suspend" && request.Mode != "ban" && request.Mode != "clear" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Sanction mode must be suspend, ban, or clear"})
	}
	if request.Mode == "suspend" && (request.Until == nil || !request.Until.After(time.Now())) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Suspension end must be in the future"})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.Account{}, c)
	var account struct {
		Name             string
		SuspendedUntil   *time.Time `gorm:"column:suspendeduntil"`
		BanReason        *string    `gorm:"column:ban_reason"`
		SuspensionReason *string    `gorm:"column:suspend_reason"`
	}
	if err := db.Table("account").Where("id = ?", id).Take(&account).Error; err != nil {
		return playerOperationsLoadError(c, "Account", err)
	}
	if !playerOperationsTimesEqual(account.SuspendedUntil, request.ExpectedSuspendedAt) {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Account sanction changed; refresh before applying"})
	}
	if request.Mode == "suspend" && playerOperationsHasBanReason(account.BanReason) {
		return c.JSON(http.StatusConflict, echo.Map{"error": "Clear the existing indefinite ban before applying a temporary suspension"})
	}
	until := request.Until
	if request.Mode == "ban" {
		farFuture := time.Date(9999, 12, 31, 23, 59, 59, 0, time.UTC)
		until = &farFuture
	} else if request.Mode == "clear" {
		until = nil
	}
	payload := map[string]interface{}{
		"action": request.Mode, "account_id": id, "account_name": account.Name,
		"previous_until": account.SuspendedUntil, "until": until, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventAccountSanction, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var current struct {
			SuspendedUntil *time.Time `gorm:"column:suspendeduntil"`
			BanReason      *string    `gorm:"column:ban_reason"`
		}
		if err := tx.Table("account").Clauses(clause.Locking{Strength: "UPDATE"}).Select("suspendeduntil, ban_reason").Where("id = ?", id).Take(&current).Error; err != nil {
			return err
		}
		if !playerOperationsTimesEqual(current.SuspendedUntil, request.ExpectedSuspendedAt) {
			return playerOperationsConflict("Account sanction changed; refresh before applying")
		}
		if request.Mode == "suspend" && playerOperationsHasBanReason(current.BanReason) {
			return playerOperationsConflict("Clear the existing indefinite ban before applying a temporary suspension")
		}
		return tx.Table("account").Where("id = ?", id).
			Updates(playerOperationsSanctionUpdates(request.Mode, until, request.Reason)).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Account", err)
	}
	detail, err := loadPlayerOperationsAccountDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Account", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func playerOperationsHasBanReason(reason *string) bool {
	return strings.TrimSpace(stringValue(reason)) != ""
}

func playerOperationsSanctionUpdates(mode string, until *time.Time, reason string) map[string]interface{} {
	updates := map[string]interface{}{"suspendeduntil": until}
	switch mode {
	case "ban":
		updates["ban_reason"] = strings.TrimSpace(reason)
		updates["suspend_reason"] = ""
	case "suspend":
		updates["suspend_reason"] = strings.TrimSpace(reason)
	case "clear":
		updates["ban_reason"] = ""
		updates["suspend_reason"] = ""
	}
	return updates
}

func (p *PlayerOperationsController) deleteAccount(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Account")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsConfirmedDeleteRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid account deletion payload"})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.Account{}, c)
	var account struct {
		ID   int
		Name string
	}
	if err := db.Table("account").Select("id, name").Where("id = ?", id).Take(&account).Error; err != nil {
		return playerOperationsLoadError(c, "Account", err)
	}
	if request.Confirmation != account.Name {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Type the exact account name to confirm"})
	}
	payload := map[string]interface{}{
		"action": "delete", "account_id": id, "account_name": account.Name,
		"reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventAccountDelete, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct{ ID int }
		if err := tx.Table("account").Clauses(clause.Locking{Strength: "UPDATE"}).Select("id").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		var characterCount int64
		if err := tx.Table("character_data").Where("account_id = ?", id).Count(&characterCount).Error; err != nil {
			return err
		}
		if characterCount > 0 {
			return playerOperationsConflict("Account still owns %d character(s); transfer every character, including retired records, before deletion", characterCount)
		}
		for _, table := range []string{"account_flags", "account_ip", "account_rewards", "gm_ips", "sharedbank"} {
			column := "account_id"
			if table == "account_flags" {
				column = "p_accid"
			} else if table == "account_ip" {
				column = "accid"
			}
			if tx.Migrator().HasTable(table) {
				if err := tx.Table(table).Where(column+" = ?", id).Delete(nil).Error; err != nil {
					return err
				}
			}
		}
		return tx.Table("account").Where("id = ?", id).Delete(nil).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Account", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted_id": id, "audit_id": auditID})
}

func (p *PlayerOperationsController) createGuild(c echo.Context) error {
	var input playerOperationsGuildInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid guild payload"})
	}
	if err := validatePlayerOperationsGuild(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.Guild{}, c)
	payload := map[string]interface{}{"action": "create", "guild": input}
	auditID, err := p.writeAudit(c, playerOperationsEventGuildCreate, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	var guildID int
	if err := db.Transaction(func(tx *gorm.DB) error {
		var duplicate int64
		if err := tx.Table("guilds").Where("name = ?", strings.TrimSpace(input.Name)).Count(&duplicate).Error; err != nil {
			return err
		}
		if duplicate > 0 {
			return playerOperationsConflict("A guild named %s already exists", strings.TrimSpace(input.Name))
		}
		if input.LeaderID > 0 {
			if err := playerOperationsEnsureCharacter(tx, input.LeaderID); err != nil {
				return err
			}
		}
		values := map[string]interface{}{
			"name": strings.TrimSpace(input.Name), "leader": input.LeaderID, "minstatus": input.MinStatus,
			"motd": input.MOTD, "motd_setter": "", "channel": input.Channel, "url": input.URL,
			"tribute": input.Tribute, "favor": input.Favor,
		}
		if err := tx.Table("guilds").Create(values).Error; err != nil {
			return err
		}
		var created struct {
			ID int `gorm:"column:id"`
		}
		if err := tx.Raw("SELECT LAST_INSERT_ID() AS id").Scan(&created).Error; err != nil {
			return err
		}
		guildID = created.ID
		defaults := []string{"Leader", "Senior Officer", "Officer", "Senior Member", "Member", "Junior Member", "Initiate", "Recruit"}
		for rank, title := range defaults {
			if err := tx.Table("guild_ranks").Create(map[string]interface{}{
				"guild_id": guildID, "rank": rank + 1, "title": title,
			}).Error; err != nil {
				return err
			}
		}
		if input.LeaderID > 0 {
			if err := tx.Table("guilds").Where("leader = ? AND id <> ?", input.LeaderID, guildID).Update("leader", 0).Error; err != nil {
				return err
			}
			if err := tx.Table("guild_members").Where("char_id = ?", input.LeaderID).Delete(nil).Error; err != nil {
				return err
			}
			if err := tx.Table("guild_members").Create(map[string]interface{}{
				"char_id": input.LeaderID, "guild_id": guildID, "rank": 1, "public_note": "",
			}).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Guild", err)
	}
	detail, err := loadPlayerOperationsGuildDetail(db, p.db.Get(models.Zone{}, c), guildID)
	if err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) updateGuild(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Guild")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input playerOperationsGuildInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid guild payload"})
	}
	if err := validatePlayerOperationsGuild(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.Guild{}, c)
	var before playerOperationsGuild
	if err := db.Table("guilds g").Select(`
		g.id, g.name, g.leader AS leader_id, g.minstatus AS min_status, g.motd,
		g.motd_setter, g.channel, g.url, g.tribute, g.favor
	`).Where("g.id = ?", id).Take(&before).Error; err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	payload := map[string]interface{}{"action": "update", "guild_id": id, "before": before, "after": input}
	auditID, err := p.writeAudit(c, playerOperationsEventGuildUpdate, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct {
			ID       int
			LeaderID int `gorm:"column:leader_id"`
		}
		if err := tx.Table("guilds").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id, leader AS leader_id").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		var duplicate int64
		if err := tx.Table("guilds").Where("name = ? AND id <> ?", strings.TrimSpace(input.Name), id).Count(&duplicate).Error; err != nil {
			return err
		}
		if duplicate > 0 {
			return playerOperationsConflict("A guild named %s already exists", strings.TrimSpace(input.Name))
		}
		if playerOperationsGuildLeaderChanged(locked.LeaderID, input.LeaderID) {
			leaderPlan := planPlayerOperationsGuildLeaderChange(locked.LeaderID, input.LeaderID)
			if input.LeaderID > 0 {
				if err := playerOperationsEnsureCharacter(tx, input.LeaderID); err != nil {
					return err
				}
				var membership int64
				if err := tx.Table("guild_members").Where("char_id = ? AND guild_id = ?", input.LeaderID, id).Count(&membership).Error; err != nil {
					return err
				}
				if membership == 0 {
					return playerOperationsConflict("Select a current guild member as leader")
				}
				if err := tx.Table("guild_members").
					Where("guild_id = ? AND rank = 1 AND char_id <> ?", id, leaderPlan.PromoteCharacterID).
					Update("rank", 2).Error; err != nil {
					return err
				}
				if err := tx.Table("guild_members").Where("guild_id = ? AND char_id = ?", id, input.LeaderID).Update("rank", 1).Error; err != nil {
					return err
				}
			} else if leaderPlan.DemoteCharacterID > 0 {
				if err := tx.Table("guild_members").
					Where("guild_id = ? AND char_id = ? AND rank = 1", id, leaderPlan.DemoteCharacterID).
					Update("rank", 2).Error; err != nil {
					return err
				}
			}
		}
		return tx.Table("guilds").Where("id = ?", id).Updates(map[string]interface{}{
			"name": strings.TrimSpace(input.Name), "leader": input.LeaderID, "minstatus": input.MinStatus,
			"motd": input.MOTD, "channel": input.Channel, "url": input.URL,
			"tribute": input.Tribute, "favor": input.Favor,
		}).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Guild", err)
	}
	detail, err := loadPlayerOperationsGuildDetail(db, p.db.Get(models.Zone{}, c), id)
	if err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func playerOperationsGuildLeaderChanged(currentLeaderID, requestedLeaderID int) bool {
	return currentLeaderID != requestedLeaderID
}

func (p *PlayerOperationsController) deleteGuild(c echo.Context) error {
	id, err := playerOperationsPositiveParam(c, "id", "Guild")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request playerOperationsConfirmedDeleteRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid guild deletion payload"})
	}
	if err := validatePlayerOperationsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.Guild{}, c)
	var guild struct {
		ID   int
		Name string
	}
	if err := db.Table("guilds").Select("id, name").Where("id = ?", id).Take(&guild).Error; err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	if request.Confirmation != guild.Name {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Type the exact guild name to confirm"})
	}
	payload := map[string]interface{}{
		"action": "delete", "guild_id": id, "guild_name": guild.Name, "reason": strings.TrimSpace(request.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventGuildDelete, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct{ ID int }
		if err := tx.Table("guilds").Clauses(clause.Locking{Strength: "UPDATE"}).Select("id").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		var bankCount int64
		if err := tx.Table("guild_bank").Where("guildid = ?", id).Count(&bankCount).Error; err != nil {
			return err
		}
		if bankCount > 0 {
			return playerOperationsConflict("Guild bank contains %d item(s); clear or transfer them before disbanding", bankCount)
		}
		for _, table := range []string{"guild_members", "guild_ranks", "guild_permissions"} {
			if err := tx.Table(table).Where("guild_id = ?", id).Delete(nil).Error; err != nil {
				return err
			}
		}
		if tx.Migrator().HasTable("guild_tributes") {
			if err := tx.Table("guild_tributes").Where("guild_id = ?", id).Delete(nil).Error; err != nil {
				return err
			}
		}
		if tx.Migrator().HasTable("guild_relations") {
			if err := tx.Table("guild_relations").Where("guild1 = ? OR guild2 = ?", id, id).Delete(nil).Error; err != nil {
				return err
			}
		}
		return tx.Table("guilds").Where("id = ?", id).Delete(nil).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Guild", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted_id": id, "audit_id": auditID})
}

func (p *PlayerOperationsController) addGuildMember(c echo.Context) error {
	return p.changeGuildMember(c, "add")
}

func (p *PlayerOperationsController) updateGuildMember(c echo.Context) error {
	return p.changeGuildMember(c, "update")
}

func (p *PlayerOperationsController) removeGuildMember(c echo.Context) error {
	return p.changeGuildMember(c, "remove")
}

func (p *PlayerOperationsController) changeGuildMember(c echo.Context, action string) error {
	guildID, err := playerOperationsPositiveParam(c, "id", "Guild")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input playerOperationsGuildMemberInput
	if action == "remove" {
		if err := c.Bind(&input); err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid member removal payload"})
		}
	} else if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid guild member payload"})
	}
	if action == "remove" || action == "update" {
		input.CharacterID, err = playerOperationsPositiveParam(c, "character_id", "Character")
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
	}
	if input.CharacterID <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Character is invalid"})
	}
	if action != "remove" {
		if err := validatePlayerOperationsGuildMembership(guildID, input.Rank); err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
	}
	if err := validatePlayerOperationsReason(input.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.GuildMember{}, c)
	var guild struct {
		ID     int
		Name   string
		Leader int
	}
	if err := db.Table("guilds").Select("id, name, leader").Where("id = ?", guildID).Take(&guild).Error; err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	var character struct {
		ID   int
		Name string
	}
	if err := db.Table("character_data").Select("id, name").Where("id = ? AND deleted_at IS NULL", input.CharacterID).Take(&character).Error; err != nil {
		return playerOperationsLoadError(c, "Character", err)
	}
	payload := map[string]interface{}{
		"action": action, "guild_id": guildID, "guild_name": guild.Name,
		"character_id": character.ID, "character_name": character.Name, "rank": input.Rank,
		"reason": strings.TrimSpace(input.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventGuildMember, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var existing struct {
			GuildID int `gorm:"column:guild_id"`
			Rank    int `gorm:"column:rank"`
		}
		err := tx.Table("guild_members").Clauses(clause.Locking{Strength: "UPDATE"}).Select("guild_id, rank").Where("char_id = ?", input.CharacterID).Take(&existing).Error
		if action == "add" {
			if err == nil {
				return playerOperationsConflict("%s already belongs to a guild", character.Name)
			}
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
			if input.Rank == 1 {
				if err := tx.Table("guild_members").Where("guild_id = ? AND rank = 1", guildID).Update("rank", 2).Error; err != nil {
					return err
				}
				if err := tx.Table("guilds").Where("id = ?", guildID).Update("leader", input.CharacterID).Error; err != nil {
					return err
				}
			}
			return tx.Table("guild_members").Create(map[string]interface{}{
				"char_id": input.CharacterID, "guild_id": guildID, "rank": input.Rank,
				"banker": boolInt(input.Banker), "alt": boolInt(input.Alt),
				"tribute_enable": boolInt(input.TributeEnabled), "public_note": input.PublicNote,
			}).Error
		}
		if err != nil {
			return err
		}
		if existing.GuildID != guildID {
			return playerOperationsConflict("%s no longer belongs to this guild", character.Name)
		}
		if action == "remove" {
			if guild.Leader == input.CharacterID {
				if err := tx.Table("guilds").Where("id = ?", guildID).Update("leader", 0).Error; err != nil {
					return err
				}
			}
			return tx.Table("guild_members").Where("char_id = ? AND guild_id = ?", input.CharacterID, guildID).Delete(nil).Error
		}
		if input.Rank == 1 {
			if err := tx.Table("guild_members").Where("guild_id = ? AND rank = 1 AND char_id <> ?", guildID, input.CharacterID).Update("rank", 2).Error; err != nil {
				return err
			}
			if err := tx.Table("guilds").Where("id = ?", guildID).Update("leader", input.CharacterID).Error; err != nil {
				return err
			}
		} else if guild.Leader == input.CharacterID {
			if err := tx.Table("guilds").Where("id = ?", guildID).Update("leader", 0).Error; err != nil {
				return err
			}
		}
		return tx.Table("guild_members").Where("char_id = ? AND guild_id = ?", input.CharacterID, guildID).Updates(map[string]interface{}{
			"rank": input.Rank, "banker": boolInt(input.Banker), "alt": boolInt(input.Alt),
			"tribute_enable": boolInt(input.TributeEnabled), "public_note": input.PublicNote,
		}).Error
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Guild member", err)
	}
	detail, err := loadPlayerOperationsGuildDetail(db, p.db.Get(models.Zone{}, c), guildID)
	if err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) updateGuildAccess(c echo.Context) error {
	guildID, err := playerOperationsPositiveParam(c, "id", "Guild")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input playerOperationsGuildAccessInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid guild access payload"})
	}
	if err := validatePlayerOperationsGuildAccess(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := p.db.Get(models.Guild{}, c)
	var guild struct {
		ID   int
		Name string
	}
	if err := db.Table("guilds").Select("id, name").Where("id = ?", guildID).Take(&guild).Error; err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	payload := map[string]interface{}{
		"action": "access", "guild_id": guildID, "guild_name": guild.Name,
		"ranks": input.Ranks, "permissions": input.Permissions, "reason": strings.TrimSpace(input.Reason),
	}
	auditID, err := p.writeAudit(c, playerOperationsEventGuildAccess, payload)
	if err != nil {
		return playerOperationsAuditError(c, err)
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		var locked struct{ ID int }
		if err := tx.Table("guilds").Clauses(clause.Locking{Strength: "UPDATE"}).Select("id").Where("id = ?", guildID).Take(&locked).Error; err != nil {
			return err
		}
		for _, rank := range input.Ranks {
			result := tx.Table("guild_ranks").Where("guild_id = ? AND rank = ?", guildID, rank.Rank).
				Update("title", strings.TrimSpace(rank.Title))
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				var existing int64
				if err := tx.Table("guild_ranks").Where("guild_id = ? AND rank = ?", guildID, rank.Rank).Count(&existing).Error; err != nil {
					return err
				}
				if existing == 0 {
					if err := tx.Table("guild_ranks").Create(map[string]interface{}{
						"guild_id": guildID, "rank": rank.Rank, "title": strings.TrimSpace(rank.Title),
					}).Error; err != nil {
						return err
					}
				}
			}
		}
		for _, permission := range input.Permissions {
			result := tx.Table("guild_permissions").Where("guild_id = ? AND perm_id = ?", guildID, permission.ID).
				Update("permission", permission.Permission)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				var existing int64
				if err := tx.Table("guild_permissions").Where("guild_id = ? AND perm_id = ?", guildID, permission.ID).Count(&existing).Error; err != nil {
					return err
				}
				if existing == 0 {
					if err := tx.Table("guild_permissions").Create(map[string]interface{}{
						"guild_id": guildID, "perm_id": permission.ID, "permission": permission.Permission,
					}).Error; err != nil {
						return err
					}
				}
			}
		}
		return nil
	}); err != nil {
		p.discardAudit(c, auditID)
		return playerOperationsMutationError(c, "Guild access", err)
	}
	detail, err := loadPlayerOperationsGuildDetail(db, p.db.Get(models.Zone{}, c), guildID)
	if err != nil {
		return playerOperationsLoadError(c, "Guild", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"detail": detail, "audit_id": auditID})
}

func (p *PlayerOperationsController) lookupAccounts(c echo.Context) error {
	db := p.db.Get(models.Account{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	results := make([]playerOperationsAccountSummary, 0)
	if len(search) < 2 {
		return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: 0, Page: 1, Limit: playerOperationsLookupLimit})
	}
	like := "%" + search + "%"
	query := db.Table("account a").Where("a.name LIKE ?", like)
	if id, err := strconv.Atoi(search); err == nil && id > 0 {
		query = db.Table("account a").Where("a.name LIKE ? OR a.id = ?", like, id)
	}
	if err := query.Select(`
		a.id, a.name, a.status,
		(SELECT COUNT(*) FROM character_data ch WHERE ch.account_id = a.id AND ch.deleted_at IS NULL) AS character_count,
		(SELECT COUNT(*) FROM character_data ch WHERE ch.account_id = a.id AND ch.deleted_at IS NULL AND ch.ingame = 1) AS online_characters,
		COALESCE((SELECT MAX(ch.last_login) FROM character_data ch WHERE ch.account_id = a.id), 0) AS last_login,
		a.suspendeduntil AS suspended_until
	`).Order("a.name, a.id").Limit(playerOperationsLookupLimit).Scan(&results).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: int64(len(results)), Page: 1, Limit: playerOperationsLookupLimit})
}

func (p *PlayerOperationsController) lookupCharacters(c echo.Context) error {
	db := p.db.Get(models.CharacterDatum{}, c)
	zoneDB := p.db.Get(models.Zone{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	results := make([]playerOperationsCharacterSummary, 0)
	if len(search) < 2 {
		return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: 0, Page: 1, Limit: playerOperationsLookupLimit})
	}
	like := "%" + search + "%"
	query := db.Table("character_data ch").
		Joins("LEFT JOIN account a ON a.id = ch.account_id").
		Joins("LEFT JOIN guild_members gm ON gm.char_id = ch.id").
		Joins("LEFT JOIN guilds g ON g.id = gm.guild_id").
		Where("ch.deleted_at IS NULL")
	if id, err := strconv.Atoi(search); err == nil && id > 0 {
		query = query.Where("(ch.id = ? OR ch.name LIKE ?)", id, like)
	} else {
		query = query.Where("ch.name LIKE ?", like)
	}
	if err := query.Select(`
		ch.id, ch.account_id, COALESCE(a.name, '') AS account_name, ch.name, ch.race, ch.class,
		ch.level, ch.zone_id, CONCAT('Zone #', ch.zone_id) AS zone_name,
		COALESCE(gm.guild_id, 0) AS guild_id, COALESCE(g.name, '') AS guild_name,
		COALESCE(gm.rank, 0) AS guild_rank, ch.ingame = 1 AS online, ch.deleted_at
	`).Order("ch.name, ch.id").Limit(playerOperationsLookupLimit).Scan(&results).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	if err := hydratePlayerOperationsCharacterZones(zoneDB, results); err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: int64(len(results)), Page: 1, Limit: playerOperationsLookupLimit})
}

func (p *PlayerOperationsController) lookupGuilds(c echo.Context) error {
	db := p.db.Get(models.Guild{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	results := make([]playerOperationsGuildSummary, 0)
	query := db.Table("guilds g").Joins("LEFT JOIN character_data leader ON leader.id = g.leader")
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("g.name LIKE ? OR CAST(g.id AS CHAR) LIKE ?", like, like)
	}
	if err := query.Select(`
		g.id, g.name, g.leader AS leader_id, COALESCE(leader.name, '') AS leader_name,
		(SELECT COUNT(*) FROM guild_members gm WHERE gm.guild_id = g.id) AS member_count,
		(SELECT COUNT(*) FROM guild_bank gb WHERE gb.guildid = g.id) AS bank_items, g.favor
	`).Order("g.name, g.id").Limit(playerOperationsLookupLimit).Scan(&results).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: int64(len(results)), Page: 1, Limit: playerOperationsLookupLimit})
}

func (p *PlayerOperationsController) lookupZones(c echo.Context) error {
	db := p.db.Get(models.Zone{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	results := make([]playerOperationsZone, 0)
	query := db.Table("zone").Where("version = 0")
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("short_name LIKE ? OR long_name LIKE ? OR CAST(zoneidnumber AS CHAR) LIKE ?", like, like, like)
	}
	if err := query.Select(`
		zoneidnumber AS id, version, COALESCE(short_name, '') AS short_name, long_name,
		safe_x, safe_y, safe_z, safe_heading
	`).Order("long_name, version, zoneidnumber").Limit(playerOperationsLookupLimit).Scan(&results).Error; err != nil {
		return playerOperationsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, playerOperationsPage{Data: results, Total: int64(len(results)), Page: 1, Limit: playerOperationsLookupLimit})
}

func loadPlayerOperationsZoneNames(db *gorm.DB, zoneIDs []int) (map[int]string, error) {
	names := make(map[int]string)
	uniqueIDs := make([]int, 0, len(zoneIDs))
	seen := make(map[int]bool)
	for _, zoneID := range zoneIDs {
		if zoneID <= 0 || seen[zoneID] {
			continue
		}
		seen[zoneID] = true
		uniqueIDs = append(uniqueIDs, zoneID)
	}
	if len(uniqueIDs) == 0 {
		return names, nil
	}
	var zones []struct {
		ID   int
		Name string
	}
	if err := db.Table("zone").Select(`
		zoneidnumber AS id,
		COALESCE(long_name, short_name, CONCAT('Zone #', zoneidnumber)) AS name
	`).Where("version = 0 AND zoneidnumber IN ?", uniqueIDs).Scan(&zones).Error; err != nil {
		return nil, err
	}
	for _, zone := range zones {
		names[zone.ID] = zone.Name
	}
	return names, nil
}

func hydratePlayerOperationsCharacterZones(db *gorm.DB, characters []playerOperationsCharacterSummary) error {
	zoneIDs := make([]int, 0, len(characters))
	for _, character := range characters {
		zoneIDs = append(zoneIDs, character.ZoneID)
	}
	names, err := loadPlayerOperationsZoneNames(db, zoneIDs)
	if err != nil {
		return err
	}
	for index := range characters {
		if name, ok := names[characters[index].ZoneID]; ok {
			characters[index].ZoneName = name
		}
	}
	return nil
}

func hydratePlayerOperationsBindZones(db *gorm.DB, binds []playerOperationsBind) error {
	zoneIDs := make([]int, 0, len(binds))
	for _, bind := range binds {
		zoneIDs = append(zoneIDs, bind.ZoneID)
	}
	names, err := loadPlayerOperationsZoneNames(db, zoneIDs)
	if err != nil {
		return err
	}
	for index := range binds {
		if name, ok := names[binds[index].ZoneID]; ok {
			binds[index].ZoneName = name
		}
	}
	return nil
}

func loadPlayerOperationsCharacterDetail(db *gorm.DB, zoneDB *gorm.DB, id int) (playerOperationsCharacterDetail, error) {
	var detail playerOperationsCharacterDetail
	if err := db.Table("character_data").Select(`
		id, account_id, name, last_name, title, suffix, zone_id, zone_instance,
		x, y, z, heading, gender, race, class, level, deity, last_login, time_played,
		anon, gm, exp AS experience, exp_enabled = 1 AS experience_enabled,
		aa_points, aa_points_spent, aa_exp AS aa_experience, points AS practice_points,
		pvp_status = 1 AS pvp, show_helm = 1 AS show_helm,
		group_auto_consent = 1 AS group_auto_consent,
		raid_auto_consent = 1 AS raid_auto_consent,
		guild_auto_consent = 1 AS guild_auto_consent,
		autosplit_enabled = 1 AS autosplit, lfg = 1 AS looking_for_group,
		lfp = 1 AS looking_for_players, ingame = 1 AS online, deleted_at
	`).Where("id = ?", id).Take(&detail.Character).Error; err != nil {
		return detail, err
	}
	if err := db.Table("account").Select("id, name, status, suspendeduntil AS suspended_until").
		Where("id = ?", detail.Character.AccountID).Take(&detail.Context.Account).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return detail, err
	}
	var membership playerOperationsGuildMembership
	err := db.Table("guild_members gm").
		Select(`
			gm.char_id AS character_id, gm.guild_id, COALESCE(g.name, '') AS guild_name, gm.rank,
			COALESCE(gr.title, CONCAT('Rank ', gm.rank)) AS rank_title,
			gm.banker = 1 AS banker, gm.alt = 1 AS alt, gm.tribute_enable = 1 AS tribute,
			gm.public_note, gm.total_tribute, gm.online = 1 AS online
		`).
		Joins("LEFT JOIN guilds g ON g.id = gm.guild_id").
		Joins("LEFT JOIN guild_ranks gr ON gr.guild_id = gm.guild_id AND gr.rank = gm.rank").
		Where("gm.char_id = ?", id).Take(&membership).Error
	if err == nil {
		detail.Context.Guild = &membership
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return detail, err
	}
	zoneVersion := 0
	if detail.Character.ZoneInstance > 0 {
		var instance struct {
			Zone    int
			Version int
		}
		err := db.Table("instance_list").Select("zone, version").Where("id = ?", detail.Character.ZoneInstance).Take(&instance).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return detail, err
		}
		if err == nil && instance.Zone == detail.Character.ZoneID {
			zoneVersion = instance.Version
		}
	}
	if err := zoneDB.Table("zone").Select(`
		zoneidnumber AS id, version, COALESCE(short_name, '') AS short_name, long_name,
		safe_x, safe_y, safe_z, safe_heading
	`).Where("zoneidnumber = ? AND version = ?", detail.Character.ZoneID, zoneVersion).
		Take(&detail.Context.Zone).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return detail, err
	}
	currency, err := loadPlayerOperationsCurrency(db, id, false)
	if err != nil {
		return detail, err
	}
	detail.Context.Currency = currency
	detail.Context.Binds = make([]playerOperationsBind, 0)
	if err := db.Table("character_bind cb").
		Select(`
			cb.slot, cb.zone_id, cb.instance_id, cb.x, cb.y, cb.z, cb.heading,
			CONCAT('Zone #', cb.zone_id) AS zone_name
		`).
		Where("cb.id = ?", id).Order("cb.slot").Scan(&detail.Context.Binds).Error; err != nil {
		return detail, err
	}
	if err := hydratePlayerOperationsBindZones(zoneDB, detail.Context.Binds); err != nil {
		return detail, err
	}
	detail.Context.RelatedCounts = make(map[string]int64)
	references := []struct {
		key    string
		table  string
		column string
	}{
		{"inventory", "inventory", "character_id"},
		{"keyring", "keyring", "char_id"},
		{"mail", "mail", "charid"},
		{"parcels", "character_parcels", "char_id"},
		{"alternate_currencies", "character_alt_currency", "char_id"},
		{"tasks", "character_tasks", "charid"},
		{"expedition_lockouts", "character_expedition_lockouts", "character_id"},
		{"data_buckets", "data_buckets", "character_id"},
	}
	for _, reference := range references {
		if !db.Migrator().HasTable(reference.table) {
			continue
		}
		var count int64
		if err := db.Table(reference.table).Where(reference.column+" = ?", id).Count(&count).Error; err != nil {
			return detail, err
		}
		detail.Context.RelatedCounts[reference.key] = count
	}
	return detail, nil
}

func loadPlayerOperationsAccountDetail(db *gorm.DB, zoneDB *gorm.DB, id int) (playerOperationsAccountDetail, error) {
	var detail playerOperationsAccountDetail
	var accountRow struct {
		ID               int
		Name             string
		Charname         string
		AutoLogin        string `gorm:"column:auto_login_charname"`
		SharedPlat       uint64 `gorm:"column:sharedplat"`
		Status           int
		LoginServer      *string `gorm:"column:ls_id"`
		LoginServerID    *uint   `gorm:"column:lsaccount_id"`
		GMSpeed          int     `gorm:"column:gmspeed"`
		Invulnerable     *int    `gorm:"column:invulnerable"`
		FlyMode          *int    `gorm:"column:flymode"`
		IgnoreTells      *int    `gorm:"column:ignore_tells"`
		Revoked          int
		Karma            uint
		MiniLoginIP      string     `gorm:"column:minilogin_ip"`
		Hidden           int        `gorm:"column:hideme"`
		RulesAccepted    int        `gorm:"column:rulesflag"`
		SuspendedUntil   *time.Time `gorm:"column:suspendeduntil"`
		CreatedAtUnix    uint64     `gorm:"column:time_creation"`
		BanReason        *string    `gorm:"column:ban_reason"`
		SuspensionReason *string    `gorm:"column:suspend_reason"`
	}
	if err := db.Table("account").Where("id = ?", id).Take(&accountRow).Error; err != nil {
		return detail, err
	}
	detail.Account = playerOperationsAccount{
		ID: accountRow.ID, Name: accountRow.Name, CharacterName: accountRow.Charname,
		AutoLoginName: accountRow.AutoLogin, SharedPlatinum: accountRow.SharedPlat,
		Status: accountRow.Status, LoginServer: stringValue(accountRow.LoginServer),
		LoginServerID: accountRow.LoginServerID, GMSpeed: accountRow.GMSpeed != 0,
		Invulnerable: intValue(accountRow.Invulnerable) != 0, FlyMode: intValue(accountRow.FlyMode),
		IgnoreTells: intValue(accountRow.IgnoreTells) != 0, Revoked: accountRow.Revoked != 0,
		Karma: accountRow.Karma, MiniLoginIP: accountRow.MiniLoginIP, Hidden: accountRow.Hidden != 0,
		RulesAccepted: accountRow.RulesAccepted != 0, SuspendedUntil: accountRow.SuspendedUntil,
		CreatedAtUnix: accountRow.CreatedAtUnix, BanReason: stringValue(accountRow.BanReason),
		SuspensionReason: stringValue(accountRow.SuspensionReason),
	}
	detail.Characters = make([]playerOperationsCharacterSummary, 0)
	if err := db.Table("character_data ch").
		Joins("LEFT JOIN account a ON a.id = ch.account_id").
		Joins("LEFT JOIN guild_members gm ON gm.char_id = ch.id").
		Joins("LEFT JOIN guilds g ON g.id = gm.guild_id").
		Select(`
			ch.id, ch.account_id, COALESCE(a.name, '') AS account_name, ch.name, ch.race, ch.class,
			ch.level, ch.zone_id, CONCAT('Zone #', ch.zone_id) AS zone_name,
			COALESCE(gm.guild_id, 0) AS guild_id, COALESCE(g.name, '') AS guild_name,
			COALESCE(gm.rank, 0) AS guild_rank, ch.ingame = 1 AS online, ch.deleted_at
		`).Where("ch.account_id = ?", id).Order("ch.deleted_at, ch.name").Scan(&detail.Characters).Error; err != nil {
		return detail, err
	}
	if err := hydratePlayerOperationsCharacterZones(zoneDB, detail.Characters); err != nil {
		return detail, err
	}
	detail.IPs = make([]playerOperationsAccountIP, 0)
	if db.Migrator().HasTable("account_ip") {
		if err := db.Table("account_ip").Select("ip, count, lastused AS last_used").Where("accid = ?", id).Order("lastused DESC").Scan(&detail.IPs).Error; err != nil {
			return detail, err
		}
	}
	detail.Flags = make([]playerOperationsAccountFlag, 0)
	if db.Migrator().HasTable("account_flags") {
		if err := db.Table("account_flags").Select("p_flag AS name, p_value AS value").Where("p_accid = ?", id).Order("p_flag").Scan(&detail.Flags).Error; err != nil {
			return detail, err
		}
	}
	detail.Rewards = make([]playerOperationsAccountReward, 0)
	if db.Migrator().HasTable("account_rewards") {
		if err := db.Table("account_rewards").Select("reward_id, amount").Where("account_id = ?", id).Order("reward_id").Scan(&detail.Rewards).Error; err != nil {
			return detail, err
		}
	}
	return detail, nil
}

func loadPlayerOperationsGuildDetail(db *gorm.DB, zoneDB *gorm.DB, id int) (playerOperationsGuildDetail, error) {
	var detail playerOperationsGuildDetail
	if err := db.Table("guilds g").
		Select(`
			g.id, g.name, g.leader AS leader_id, COALESCE(leader.name, '') AS leader_name,
			g.minstatus AS min_status, g.motd, g.motd_setter, g.channel, g.url, g.tribute, g.favor
		`).
		Joins("LEFT JOIN character_data leader ON leader.id = g.leader").
		Where("g.id = ?", id).Take(&detail.Guild).Error; err != nil {
		return detail, err
	}
	detail.Members = make([]playerOperationsCharacterSummary, 0)
	if err := db.Table("guild_members gm").
		Select(`
			ch.id, ch.account_id, COALESCE(a.name, '') AS account_name, ch.name, ch.race, ch.class,
			ch.level, ch.zone_id, CONCAT('Zone #', ch.zone_id) AS zone_name,
			gm.guild_id, g.name AS guild_name, gm.rank AS guild_rank,
			(ch.ingame = 1 OR gm.online = 1) AS online, ch.deleted_at
		`).
		Joins("JOIN character_data ch ON ch.id = gm.char_id").
		Joins("LEFT JOIN account a ON a.id = ch.account_id").
		Joins("LEFT JOIN guilds g ON g.id = gm.guild_id").
		Where("gm.guild_id = ?", id).Order("gm.rank, ch.name").Scan(&detail.Members).Error; err != nil {
		return detail, err
	}
	if err := hydratePlayerOperationsCharacterZones(zoneDB, detail.Members); err != nil {
		return detail, err
	}
	detail.Memberships = make([]playerOperationsGuildMembership, 0)
	if err := db.Table("guild_members gm").
		Select(`
			gm.char_id AS character_id, gm.guild_id, COALESCE(g.name, '') AS guild_name, gm.rank,
			COALESCE(gr.title, CONCAT('Rank ', gm.rank)) AS rank_title,
			gm.banker = 1 AS banker, gm.alt = 1 AS alt, gm.tribute_enable = 1 AS tribute,
			gm.public_note, gm.total_tribute, gm.online = 1 AS online
		`).
		Joins("LEFT JOIN guilds g ON g.id = gm.guild_id").
		Joins("LEFT JOIN guild_ranks gr ON gr.guild_id = gm.guild_id AND gr.rank = gm.rank").
		Where("gm.guild_id = ?", id).Order("gm.rank, gm.char_id").Scan(&detail.Memberships).Error; err != nil {
		return detail, err
	}
	detail.Ranks = make([]playerOperationsGuildRank, 0)
	if err := db.Table("guild_ranks").Select("rank, title").Where("guild_id = ?", id).Order("rank").Scan(&detail.Ranks).Error; err != nil {
		return detail, err
	}
	detail.Permissions = make([]playerOperationsGuildPermission, 0)
	if err := db.Table("guild_permissions").Select("perm_id AS id, permission").Where("guild_id = ?", id).Order("perm_id").Scan(&detail.Permissions).Error; err != nil {
		return detail, err
	}
	if err := db.Table("guild_bank").Select("COUNT(*) AS item_count, COUNT(DISTINCT CONCAT(area, ':', slot)) AS slots_used").
		Where("guildid = ?", id).Scan(&detail.Bank).Error; err != nil {
		return detail, err
	}
	detail.Relations = make([]playerOperationsGuildRelation, 0)
	if db.Migrator().HasTable("guild_relations") {
		if err := db.Table("guild_relations").Select("guild1 AS guild_1, guild2 AS guild_2").
			Where("guild1 = ? OR guild2 = ?", id, id).Scan(&detail.Relations).Error; err != nil {
			return detail, err
		}
	}
	if db.Migrator().HasTable("guild_tributes") {
		var tribute playerOperationsGuildTribute
		err := db.Table("guild_tributes").Select(`
			tribute_id_1, tribute_id_1_tier AS tribute_tier_1,
			tribute_id_2, tribute_id_2_tier AS tribute_tier_2,
			time_remaining, enabled = 1 AS enabled
		`).Where("guild_id = ?", id).Take(&tribute).Error
		if err == nil {
			detail.Tribute = &tribute
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return detail, err
		}
	}
	return detail, nil
}

func loadPlayerOperationsCurrency(db *gorm.DB, id int, lock bool) (playerOperationsCurrency, error) {
	var currency playerOperationsCurrency
	query := db.Table("character_currency").Select(`
		platinum, gold, silver, copper, platinum_bank, gold_bank, silver_bank, copper_bank,
		radiant_crystals, ebon_crystals
	`).Where("id = ?", id)
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := query.Take(&currency).Error
	if errors.Is(err, gorm.ErrRecordNotFound) && !lock {
		return playerOperationsCurrency{}, nil
	}
	return currency, err
}

func playerOperationsCurrencyValues(id int, currency playerOperationsCurrency) map[string]interface{} {
	return map[string]interface{}{
		"id": id, "platinum": currency.Platinum, "gold": currency.Gold,
		"silver": currency.Silver, "copper": currency.Copper,
		"platinum_bank": currency.PlatinumBank, "gold_bank": currency.GoldBank,
		"silver_bank": currency.SilverBank, "copper_bank": currency.CopperBank,
		"radiant_crystals": currency.RadiantCrystal, "ebon_crystals": currency.EbonCrystal,
	}
}

func validatePlayerOperationsCharacter(input playerOperationsCharacterInput) error {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return errors.New("Character name is required")
	}
	if len(name) > 64 || len(input.LastName) > 64 || len(input.Title) > 32 || len(input.Suffix) > 32 {
		return errors.New("Character identity text exceeds the live schema limit")
	}
	if strings.Contains(strings.ToLower(name), "-deleted") {
		return errors.New("Active character names cannot contain the retirement marker")
	}
	if input.Level < 1 || input.Level > 255 {
		return errors.New("Level must be between 1 and 255")
	}
	if input.Race <= 0 || input.Class <= 0 || input.Deity < 0 {
		return errors.New("Select valid race, class, and deity values")
	}
	if input.Gender < 0 || input.Gender > 2 || input.Anon < 0 || input.Anon > 2 || input.GM < 0 || input.GM > 255 {
		return errors.New("Character visibility values are invalid")
	}
	return nil
}

func normalizePlayerOperationsCharacterInput(input playerOperationsCharacterInput) playerOperationsCharacterInput {
	input.Name = strings.TrimSpace(input.Name)
	return input
}

func validatePlayerOperationsAccount(input playerOperationsAccountInput) error {
	if len(input.CharacterName) > 64 || len(input.AutoLoginName) > 64 || len(input.MiniLoginIP) > 32 {
		return errors.New("Account text exceeds the live schema limit")
	}
	if input.Status < -1 || input.Status > 255 {
		return errors.New("Account status must be between -1 and 255")
	}
	if input.FlyMode < 0 || input.FlyMode > 2 {
		return errors.New("Fly mode must be Off, Levitate, or Fly")
	}
	return nil
}

func validatePlayerOperationsGuild(input playerOperationsGuildInput) error {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return errors.New("Guild name is required")
	}
	if len(name) > 32 || len(input.Channel) > 128 || len(input.URL) > 512 {
		return errors.New("Guild text exceeds the live schema limit")
	}
	if input.LeaderID < 0 || input.MinStatus < -1 || input.MinStatus > 255 {
		return errors.New("Guild leader or minimum status is invalid")
	}
	return nil
}

type playerOperationsGuildLeaderPlan struct {
	DemoteCharacterID  int
	PromoteCharacterID int
}

func planPlayerOperationsGuildLeaderChange(currentLeaderID int, nextLeaderID int) playerOperationsGuildLeaderPlan {
	if nextLeaderID > 0 {
		return playerOperationsGuildLeaderPlan{PromoteCharacterID: nextLeaderID}
	}
	if currentLeaderID > 0 {
		return playerOperationsGuildLeaderPlan{DemoteCharacterID: currentLeaderID}
	}
	return playerOperationsGuildLeaderPlan{}
}

func validatePlayerOperationsGuildMembership(guildID int, rank int) error {
	if guildID < 0 {
		return errors.New("Guild is invalid")
	}
	if guildID == 0 {
		if rank != 0 {
			return errors.New("Rank must be 0 when removing guild membership")
		}
		return nil
	}
	if rank < 1 || rank > 8 {
		return errors.New("Guild rank must be between 1 and 8")
	}
	return nil
}

func validatePlayerOperationsGuildAccess(input playerOperationsGuildAccessInput) error {
	if err := validatePlayerOperationsReason(input.Reason); err != nil {
		return err
	}
	seenRanks := make(map[int]bool)
	for _, rank := range input.Ranks {
		if rank.Rank < 1 || rank.Rank > 8 {
			return errors.New("Guild ranks must be between 1 and 8")
		}
		if seenRanks[rank.Rank] {
			return fmt.Errorf("Guild rank %d is duplicated", rank.Rank)
		}
		seenRanks[rank.Rank] = true
		if strings.TrimSpace(rank.Title) == "" || len(rank.Title) > 128 {
			return fmt.Errorf("Guild rank %d needs a title within 128 characters", rank.Rank)
		}
	}
	seenPermissions := make(map[int]bool)
	for _, permission := range input.Permissions {
		if permission.ID < 1 || permission.ID > 30 || permission.Permission < 0 || permission.Permission > 255 {
			return errors.New("Guild permission values are invalid")
		}
		if seenPermissions[permission.ID] {
			return fmt.Errorf("Guild permission %d is duplicated", permission.ID)
		}
		seenPermissions[permission.ID] = true
	}
	return nil
}

func validatePlayerOperationsReason(reason string) error {
	length := len(strings.TrimSpace(reason))
	if length < playerOperationsReasonMinLength {
		return fmt.Errorf("Reason must be at least %d characters", playerOperationsReasonMinLength)
	}
	if length > playerOperationsReasonMaxLength {
		return fmt.Errorf("Reason must be %d characters or fewer", playerOperationsReasonMaxLength)
	}
	return nil
}

func playerOperationsEnsureCharacter(db *gorm.DB, id int) error {
	var count int64
	if err := db.Table("character_data").Where("id = ? AND deleted_at IS NULL", id).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return playerOperationsConflict("Character #%d was not found or is retired", id)
	}
	return nil
}

func playerOperationsRetiredName(name string, id int) string {
	base := strings.TrimSpace(name)
	suffix := fmt.Sprintf("-deleted-%d", id)
	if len(base)+len(suffix) > 64 {
		return ""
	}
	return base + suffix
}

func playerOperationsCurrencyWithinBounds(currency playerOperationsCurrency) bool {
	values := []uint64{
		currency.Platinum,
		currency.Gold,
		currency.Silver,
		currency.Copper,
		currency.PlatinumBank,
		currency.GoldBank,
		currency.SilverBank,
		currency.CopperBank,
		currency.RadiantCrystal,
		currency.EbonCrystal,
	}
	for _, value := range values {
		if value > playerOperationsMaxCurrency {
			return false
		}
	}
	return true
}

func playerOperationsRestoreName(name string) string {
	lower := strings.ToLower(name)
	index := strings.Index(lower, "-deleted")
	if index < 0 {
		return strings.TrimSpace(name)
	}
	return strings.TrimSpace(name[:index])
}

func playerOperationsTimesEqual(left, right *time.Time) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return left.UTC().Truncate(time.Second).Equal(right.UTC().Truncate(time.Second))
}

func playerOperationsPagination(c echo.Context) (int, int) {
	page := 1
	limit := playerOperationsDefaultPageSize
	if parsed, err := strconv.Atoi(c.QueryParam("page")); err == nil && parsed > 0 {
		page = parsed
	}
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if limit > playerOperationsMaxPageSize {
		limit = playerOperationsMaxPageSize
	}
	if page > playerOperationsMaxPage {
		page = playerOperationsMaxPage
	}
	return page, limit
}

func playerOperationsPositiveParam(c echo.Context, key, label string) (int, error) {
	value, err := strconv.Atoi(c.Param(key))
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("%s ID must be a positive number", label)
	}
	return value, nil
}

func playerOperationsConflict(format string, args ...interface{}) error {
	return playerOperationsConflictError{message: fmt.Sprintf(format, args...)}
}

func playerOperationsMutationError(c echo.Context, label string, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": label + " was not found"})
	}
	var conflict playerOperationsConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	return playerOperationsDatabaseError(c, err)
}

func playerOperationsLoadError(c echo.Context, label string, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": label + " was not found"})
	}
	return playerOperationsDatabaseError(c, err)
}

func playerOperationsAuditError(c echo.Context, err error) error {
	c.Logger().Errorf("Required player operations audit could not be saved: %v", err)
	return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "Required operation audit could not be saved"})
}

func playerOperationsDatabaseError(c echo.Context, err error) error {
	c.Logger().Errorf("Player operations database error: %v", err)
	return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Player operations database error"})
}

func (p *PlayerOperationsController) writeAudit(c echo.Context, event string, payload interface{}) (uint, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return 0, err
	}
	id, err := p.auditLog.LogEditorEvent(c, event, string(data))
	if err != nil {
		return 0, fmt.Errorf("could not persist the required audit record: %w", err)
	}
	if id == 0 {
		return 0, errors.New("could not persist the required audit record")
	}
	return id, nil
}

func (p *PlayerOperationsController) discardAudit(c echo.Context, id uint) {
	if id == 0 || p.db.GetSpireDb() == nil {
		return
	}
	if err := p.db.GetSpireDb().Table("spire_user_event_log").Where("id = ?", id).Delete(nil).Error; err != nil {
		c.Logger().Errorf("Could not discard rolled-back Player Operations audit event %d: %v", id, err)
	}
}

func boolInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func intValue(value *int) int {
	if value == nil {
		return 0
	}
	return *value
}
