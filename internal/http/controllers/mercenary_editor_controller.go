package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
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
	mercenaryEditorDefaultPageSize = 30
	mercenaryEditorMaxPageSize     = 100
	mercenaryEditorSearchLimit     = 20
	mercenaryDeleteReasonMinLength = 8

	mercenaryEventCreate     = "MERCENARY_CREATE"
	mercenaryEventUpdate     = "MERCENARY_UPDATE"
	mercenaryEventCopy       = "MERCENARY_COPY"
	mercenaryEventDelete     = "MERCENARY_DELETE"
	mercenaryEventBuffCreate = "MERCENARY_BUFF_CREATE"
	mercenaryEventBuffUpdate = "MERCENARY_BUFF_UPDATE"
	mercenaryEventBuffDelete = "MERCENARY_BUFF_DELETE"
)

type MercenaryEditorController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type mercenaryEditorPage struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type mercenaryEditorRecord struct {
	MercID           uint    `json:"merc_id" gorm:"column:merc_id"`
	OwnerCharacterID uint    `json:"owner_character_id" gorm:"column:owner_character_id"`
	OwnerName        string  `json:"owner_name" gorm:"column:owner_name"`
	OwnerAccountID   int     `json:"owner_account_id" gorm:"column:owner_account_id"`
	OwnerLevel       uint    `json:"owner_level" gorm:"column:owner_level"`
	OwnerClass       uint8   `json:"owner_class" gorm:"column:owner_class"`
	OwnerRace        uint16  `json:"owner_race" gorm:"column:owner_race"`
	OwnerGender      uint8   `json:"owner_gender" gorm:"column:owner_gender"`
	Slot             uint8   `json:"slot" gorm:"column:slot"`
	Name             string  `json:"name" gorm:"column:name"`
	TemplateID       uint    `json:"template_id" gorm:"column:template_id"`
	SuspendedTime    uint    `json:"suspended_time" gorm:"column:suspended_time"`
	IsSuspended      bool    `json:"is_suspended" gorm:"column:is_suspended"`
	TimerRemaining   uint    `json:"timer_remaining" gorm:"column:timer_remaining"`
	Gender           uint8   `json:"gender" gorm:"column:gender"`
	MercSize         float32 `json:"merc_size" gorm:"column:merc_size"`
	StanceID         uint8   `json:"stance_id" gorm:"column:stance_id"`
	HP               uint    `json:"hp" gorm:"column:hp"`
	Mana             uint    `json:"mana" gorm:"column:mana"`
	Endurance        uint    `json:"endurance" gorm:"column:endurance"`
	Face             uint    `json:"face" gorm:"column:face"`
	LuclinHairStyle  uint    `json:"luclin_hair_style" gorm:"column:luclin_hair_style"`
	LuclinHairColor  uint    `json:"luclin_hair_color" gorm:"column:luclin_hair_color"`
	LuclinEyeColor   uint    `json:"luclin_eye_color" gorm:"column:luclin_eye_color"`
	LuclinEyeColor2  uint    `json:"luclin_eye_color_2" gorm:"column:luclin_eye_color_2"`
	LuclinBeardColor uint    `json:"luclin_beard_color" gorm:"column:luclin_beard_color"`
	LuclinBeard      uint    `json:"luclin_beard" gorm:"column:luclin_beard"`
	DrakkinHeritage  uint    `json:"drakkin_heritage" gorm:"column:drakkin_heritage"`
	DrakkinTattoo    uint    `json:"drakkin_tattoo" gorm:"column:drakkin_tattoo"`
	DrakkinDetails   uint    `json:"drakkin_details" gorm:"column:drakkin_details"`
	BuffCount        int64   `json:"buff_count" gorm:"column:buff_count"`
}

type mercenaryEditorInput struct {
	OwnerCharacterID uint    `json:"owner_character_id"`
	Slot             uint8   `json:"slot"`
	Name             string  `json:"name"`
	TemplateID       uint    `json:"template_id"`
	SuspendedTime    uint    `json:"suspended_time"`
	IsSuspended      bool    `json:"is_suspended"`
	TimerRemaining   uint    `json:"timer_remaining"`
	Gender           uint8   `json:"gender"`
	MercSize         float32 `json:"merc_size"`
	StanceID         uint8   `json:"stance_id"`
	HP               uint    `json:"hp"`
	Mana             uint    `json:"mana"`
	Endurance        uint    `json:"endurance"`
	Face             uint    `json:"face"`
	LuclinHairStyle  uint    `json:"luclin_hair_style"`
	LuclinHairColor  uint    `json:"luclin_hair_color"`
	LuclinEyeColor   uint    `json:"luclin_eye_color"`
	LuclinEyeColor2  uint    `json:"luclin_eye_color_2"`
	LuclinBeardColor uint    `json:"luclin_beard_color"`
	LuclinBeard      uint    `json:"luclin_beard"`
	DrakkinHeritage  uint    `json:"drakkin_heritage"`
	DrakkinTattoo    uint    `json:"drakkin_tattoo"`
	DrakkinDetails   uint    `json:"drakkin_details"`
}

type mercenaryOwnerReference struct {
	ID        uint   `json:"id" gorm:"column:id"`
	Name      string `json:"name" gorm:"column:name"`
	AccountID int    `json:"account_id" gorm:"column:account_id"`
	Level     uint   `json:"level" gorm:"column:level"`
	Class     uint8  `json:"class" gorm:"column:class"`
	Race      uint16 `json:"race" gorm:"column:race"`
	Gender    uint8  `json:"gender" gorm:"column:gender"`
	MercCount int64  `json:"merc_count" gorm:"column:merc_count"`
}

type mercenarySpellReference struct {
	ID              int    `json:"id" gorm:"column:id"`
	Name            string `json:"name" gorm:"column:name"`
	Icon            int    `json:"icon" gorm:"column:icon"`
	DurationFormula int    `json:"duration_formula" gorm:"column:duration_formula"`
	Duration        int    `json:"duration" gorm:"column:duration"`
	GoodEffect      int    `json:"good_effect" gorm:"column:good_effect"`
	ResistType      int    `json:"resist_type" gorm:"column:resist_type"`
	TargetType      int    `json:"target_type" gorm:"column:target_type"`
}

type mercenaryBuffRecord struct {
	MercBuffID         uint   `json:"merc_buff_id" gorm:"column:merc_buff_id"`
	MercID             uint   `json:"merc_id" gorm:"column:merc_id"`
	SpellID            uint   `json:"spell_id" gorm:"column:spell_id"`
	SpellName          string `json:"spell_name" gorm:"column:spell_name"`
	SpellIcon          int    `json:"spell_icon" gorm:"column:spell_icon"`
	CasterLevel        uint   `json:"caster_level" gorm:"column:caster_level"`
	DurationFormula    uint   `json:"duration_formula" gorm:"column:duration_formula"`
	TicsRemaining      int    `json:"tics_remaining" gorm:"column:tics_remaining"`
	PoisonCounters     uint   `json:"poison_counters" gorm:"column:poison_counters"`
	DiseaseCounters    uint   `json:"disease_counters" gorm:"column:disease_counters"`
	CurseCounters      uint   `json:"curse_counters" gorm:"column:curse_counters"`
	CorruptionCounters uint   `json:"corruption_counters" gorm:"column:corruption_counters"`
	HitCount           uint   `json:"hit_count" gorm:"column:hit_count"`
	MeleeRune          uint   `json:"melee_rune" gorm:"column:melee_rune"`
	MagicRune          uint   `json:"magic_rune" gorm:"column:magic_rune"`
	DotRune            int    `json:"dot_rune" gorm:"column:dot_rune"`
	CastOnX            int    `json:"cast_on_x" gorm:"column:cast_on_x"`
	Persistent         bool   `json:"persistent" gorm:"column:persistent"`
	CastOnY            int    `json:"cast_on_y" gorm:"column:cast_on_y"`
	CastOnZ            int    `json:"cast_on_z" gorm:"column:cast_on_z"`
	ExtraDIChance      int    `json:"extra_di_chance" gorm:"column:extra_di_chance"`
}

type mercenaryBuffInput struct {
	SpellID            uint `json:"spell_id"`
	CasterLevel        uint `json:"caster_level"`
	DurationFormula    uint `json:"duration_formula"`
	TicsRemaining      int  `json:"tics_remaining"`
	PoisonCounters     uint `json:"poison_counters"`
	DiseaseCounters    uint `json:"disease_counters"`
	CurseCounters      uint `json:"curse_counters"`
	CorruptionCounters uint `json:"corruption_counters"`
	HitCount           uint `json:"hit_count"`
	MeleeRune          uint `json:"melee_rune"`
	MagicRune          uint `json:"magic_rune"`
	DotRune            int  `json:"dot_rune"`
	CastOnX            int  `json:"cast_on_x"`
	Persistent         bool `json:"persistent"`
	CastOnY            int  `json:"cast_on_y"`
	CastOnZ            int  `json:"cast_on_z"`
	ExtraDIChance      int  `json:"extra_di_chance"`
}

type mercenaryEditorDetail struct {
	Mercenary mercenaryEditorRecord `json:"mercenary"`
	Buffs     []mercenaryBuffRecord `json:"buffs"`
}

type mercenaryDeleteRequest struct {
	Confirmation string `json:"confirmation"`
	Reason       string `json:"reason"`
}

type mercenaryAuditPayload struct {
	Action       string      `json:"action"`
	MercID       uint        `json:"merc_id"`
	SourceMercID uint        `json:"source_merc_id,omitempty"`
	BuffID       uint        `json:"buff_id,omitempty"`
	OwnerID      uint        `json:"owner_id,omitempty"`
	Name         string      `json:"name,omitempty"`
	Reason       string      `json:"reason,omitempty"`
	Before       interface{} `json:"before,omitempty"`
	After        interface{} `json:"after,omitempty"`
}

type mercenaryAuditRow struct {
	ID        uint      `gorm:"column:id"`
	UserID    uint      `gorm:"column:user_id"`
	UserName  string    `gorm:"column:user_name"`
	EventName string    `gorm:"column:event_name"`
	CreatedAt time.Time `gorm:"column:created_at"`
	RawData   string    `gorm:"column:data"`
}

type mercenaryAuditEntry struct {
	ID        uint                   `json:"id"`
	UserID    uint                   `json:"user_id"`
	UserName  string                 `json:"user_name"`
	EventName string                 `json:"event_name"`
	CreatedAt time.Time              `json:"created_at"`
	Data      map[string]interface{} `json:"data"`
}

func NewMercenaryEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *MercenaryEditorController {
	return &MercenaryEditorController{db: db, auditLog: auditLog}
}

func (m *MercenaryEditorController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "mercenary-editor/mercenaries", m.listMercenaries, nil),
		routes.RegisterRoute(http.MethodGet, "mercenary-editor/mercenary/:id", m.getMercenary, nil),
		routes.RegisterRoute(http.MethodPut, "mercenary-editor/mercenary", m.createMercenary, nil),
		routes.RegisterRoute(http.MethodPatch, "mercenary-editor/mercenary/:id", m.updateMercenary, nil),
		routes.RegisterRoute(http.MethodPost, "mercenary-editor/mercenary/:id/copy", m.copyMercenary, nil),
		routes.RegisterRoute(http.MethodDelete, "mercenary-editor/mercenary/:id", m.deleteMercenary, nil),
		routes.RegisterRoute(http.MethodGet, "mercenary-editor/mercenary/:id/audit", m.listAudit, nil),
		routes.RegisterRoute(http.MethodPut, "mercenary-editor/mercenary/:id/buff", m.createBuff, nil),
		routes.RegisterRoute(http.MethodPatch, "mercenary-editor/mercenary/:id/buff/:buffId", m.updateBuff, nil),
		routes.RegisterRoute(http.MethodDelete, "mercenary-editor/mercenary/:id/buff/:buffId", m.deleteBuff, nil),
		routes.RegisterRoute(http.MethodGet, "mercenary-editor/references/characters", m.searchCharacters, nil),
		routes.RegisterRoute(http.MethodGet, "mercenary-editor/references/spells", m.searchSpells, nil),
	}
}

func (m *MercenaryEditorController) listMercenaries(c echo.Context) error {
	db := m.eqemuDB(c)
	page, limit := mercenaryPagination(c)
	search := strings.TrimSpace(c.QueryParam("search"))
	state := strings.ToLower(strings.TrimSpace(c.QueryParam("state")))

	query := db.Table("mercs m").
		Joins("LEFT JOIN character_data owner ON owner.id = m.OwnerCharacterID").
		Where("owner.deleted_at IS NULL OR owner.id IS NULL")
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("m.Name LIKE ? OR owner.name LIKE ? OR CAST(m.MercID AS CHAR) = ? OR CAST(m.OwnerCharacterID AS CHAR) = ?", like, like, search, search)
	}
	switch state {
	case "active":
		query = query.Where("m.IsSuspended = 0")
	case "suspended":
		query = query.Where("m.IsSuspended = 1")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return mercenaryDatabaseError(c, err)
	}

	results := make([]mercenaryEditorRecord, 0)
	if err := query.Select(mercenaryRecordSelect()).
		Order("m.Name ASC, m.MercID ASC").
		Limit(limit).
		Offset((page - 1) * limit).
		Scan(&results).Error; err != nil {
		return mercenaryDatabaseError(c, err)
	}

	return c.JSON(http.StatusOK, mercenaryEditorPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (m *MercenaryEditorController) getMercenary(c echo.Context) error {
	id, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := loadMercenaryDetail(m.eqemuDB(c), id)
	if err != nil {
		return mercenaryLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (m *MercenaryEditorController) createMercenary(c echo.Context) error {
	request := new(mercenaryEditorInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid mercenary payload: %v", err)})
	}
	request.Name = strings.TrimSpace(request.Name)
	if err := validateMercenaryInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := m.eqemuDB(c)
	var createdID uint
	var auditID uint
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := ensureMercenaryOwner(tx, request.OwnerCharacterID); err != nil {
			return err
		}
		if err := ensureMercenarySlotAvailable(tx, request.OwnerCharacterID, request.Slot, 0); err != nil {
			return err
		}
		result := tx.Table("mercs").Create(mercenaryColumns(*request))
		if result.Error != nil {
			return result.Error
		}
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&createdID).Error; err != nil {
			return err
		}
		var err error
		auditID, err = m.writeAudit(c, mercenaryEventCreate, mercenaryAuditPayload{
			Action: "create", MercID: createdID, OwnerID: request.OwnerCharacterID, Name: request.Name, After: request,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mercenaryMutationError(c, err)
	}
	detail, err := loadMercenaryDetail(db, createdID)
	if err != nil {
		return mercenaryLoadError(c, err)
	}
	return c.JSON(http.StatusCreated, detail)
}

func (m *MercenaryEditorController) updateMercenary(c echo.Context) error {
	id, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(mercenaryEditorInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid mercenary payload: %v", err)})
	}
	request.Name = strings.TrimSpace(request.Name)
	if err := validateMercenaryInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := m.eqemuDB(c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := lockMercenary(tx, id)
		if err != nil {
			return err
		}
		if err := ensureMercenaryOwner(tx, request.OwnerCharacterID); err != nil {
			return err
		}
		if err := ensureMercenarySlotAvailable(tx, request.OwnerCharacterID, request.Slot, id); err != nil {
			return err
		}
		if err := tx.Table("mercs").Where("MercID = ?", id).Updates(mercenaryColumns(*request)).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mercenaryEventUpdate, mercenaryAuditPayload{
			Action: "update", MercID: id, OwnerID: request.OwnerCharacterID, Name: request.Name,
			Before: current, After: request,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mercenaryMutationError(c, err)
	}
	detail, err := loadMercenaryDetail(db, id)
	if err != nil {
		return mercenaryLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (m *MercenaryEditorController) copyMercenary(c echo.Context) error {
	id, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.eqemuDB(c)
	var createdID uint
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		source, err := lockMercenary(tx, id)
		if err != nil {
			return err
		}
		slot, err := nextMercenarySlot(tx, source.OwnerCharacterID)
		if err != nil {
			return err
		}
		copyInput := mercenaryInputFromRecord(source)
		copyInput.Slot = slot
		copyInput.Name = mercenaryCopyName(source.Name)
		if err := tx.Table("mercs").Create(mercenaryColumns(copyInput)).Error; err != nil {
			return err
		}
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&createdID).Error; err != nil {
			return err
		}
		if err := tx.Exec(`
			INSERT INTO merc_buffs (
				MercId, SpellId, CasterLevel, DurationFormula, TicsRemaining,
				PoisonCounters, DiseaseCounters, CurseCounters, CorruptionCounters,
				HitCount, MeleeRune, MagicRune, dot_rune, caston_x, Persistent,
				caston_y, caston_z, ExtraDIChance
			)
			SELECT ?, SpellId, CasterLevel, DurationFormula, TicsRemaining,
				PoisonCounters, DiseaseCounters, CurseCounters, CorruptionCounters,
				HitCount, MeleeRune, MagicRune, dot_rune, caston_x, Persistent,
				caston_y, caston_z, ExtraDIChance
			FROM merc_buffs WHERE MercId = ?
		`, createdID, id).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mercenaryEventCopy, mercenaryAuditPayload{
			Action: "copy", MercID: createdID, SourceMercID: id,
			OwnerID: source.OwnerCharacterID, Name: copyInput.Name,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mercenaryMutationError(c, err)
	}
	detail, err := loadMercenaryDetail(db, createdID)
	if err != nil {
		return mercenaryLoadError(c, err)
	}
	return c.JSON(http.StatusCreated, detail)
}

func (m *MercenaryEditorController) deleteMercenary(c echo.Context) error {
	id, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(mercenaryDeleteRequest)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid deletion payload: %v", err)})
	}
	request.Confirmation = strings.TrimSpace(request.Confirmation)
	request.Reason = strings.TrimSpace(request.Reason)
	if len(request.Reason) < mercenaryDeleteReasonMinLength {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Deletion reason must be at least %d characters", mercenaryDeleteReasonMinLength)})
	}

	db := m.eqemuDB(c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := lockMercenary(tx, id)
		if err != nil {
			return err
		}
		if request.Confirmation != current.Name {
			return mercenaryConflictError{"Type the exact mercenary name to confirm deletion"}
		}
		if err := tx.Table("merc_buffs").Where("MercId = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		if err := tx.Table("mercs").Where("MercID = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mercenaryEventDelete, mercenaryAuditPayload{
			Action: "delete", MercID: id, OwnerID: current.OwnerCharacterID, Name: current.Name,
			Reason: request.Reason, Before: current,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mercenaryMutationError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func (m *MercenaryEditorController) createBuff(c echo.Context) error {
	mercID, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(mercenaryBuffInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid mercenary buff payload: %v", err)})
	}
	if err := validateMercenaryBuffInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := m.eqemuDB(c)
	var buffID uint
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		if _, err := lockMercenary(tx, mercID); err != nil {
			return err
		}
		if err := ensureMercenarySpell(tx, request.SpellID); err != nil {
			return err
		}
		columns := mercenaryBuffColumns(mercID, *request)
		if err := tx.Table("merc_buffs").Create(columns).Error; err != nil {
			return err
		}
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&buffID).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mercenaryEventBuffCreate, mercenaryAuditPayload{
			Action: "buff_create", MercID: mercID, BuffID: buffID, After: request,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mercenaryMutationError(c, err)
	}
	buff, err := loadMercenaryBuff(db, mercID, buffID)
	if err != nil {
		return mercenaryLoadError(c, err)
	}
	return c.JSON(http.StatusCreated, buff)
}

func (m *MercenaryEditorController) updateBuff(c echo.Context) error {
	mercID, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	buffID, err := mercenaryID(c, "buffId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(mercenaryBuffInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid mercenary buff payload: %v", err)})
	}
	if err := validateMercenaryBuffInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := m.eqemuDB(c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := lockMercenaryBuff(tx, mercID, buffID)
		if err != nil {
			return err
		}
		if err := ensureMercenarySpell(tx, request.SpellID); err != nil {
			return err
		}
		if err := tx.Table("merc_buffs").Where("MercBuffId = ? AND MercId = ?", buffID, mercID).
			Updates(mercenaryBuffColumns(mercID, *request)).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mercenaryEventBuffUpdate, mercenaryAuditPayload{
			Action: "buff_update", MercID: mercID, BuffID: buffID, Before: current, After: request,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mercenaryMutationError(c, err)
	}
	buff, err := loadMercenaryBuff(db, mercID, buffID)
	if err != nil {
		return mercenaryLoadError(c, err)
	}
	return c.JSON(http.StatusOK, buff)
}

func (m *MercenaryEditorController) deleteBuff(c echo.Context) error {
	mercID, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	buffID, err := mercenaryID(c, "buffId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := m.eqemuDB(c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := lockMercenaryBuff(tx, mercID, buffID)
		if err != nil {
			return err
		}
		if err := tx.Table("merc_buffs").Where("MercBuffId = ? AND MercId = ?", buffID, mercID).Delete(nil).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mercenaryEventBuffDelete, mercenaryAuditPayload{
			Action: "buff_delete", MercID: mercID, BuffID: buffID, Before: current,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mercenaryMutationError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func (m *MercenaryEditorController) searchCharacters(c echo.Context) error {
	search := strings.TrimSpace(c.QueryParam("search"))
	if search == "" {
		return c.JSON(http.StatusOK, mercenaryEditorPage{Data: []mercenaryOwnerReference{}, Page: 1, Limit: mercenaryEditorSearchLimit})
	}
	db := m.eqemuDB(c)
	like := "%" + search + "%"
	query := db.Table("character_data characters").
		Joins("LEFT JOIN mercs m ON m.OwnerCharacterID = characters.id").
		Where("characters.deleted_at IS NULL").
		Where("characters.name LIKE ?", like)
	if id, err := strconv.ParseUint(search, 10, 32); err == nil {
		query = db.Table("character_data characters").
			Joins("LEFT JOIN mercs m ON m.OwnerCharacterID = characters.id").
			Where("characters.deleted_at IS NULL").
			Where("characters.name LIKE ? OR characters.id = ?", like, id)
	}
	results := make([]mercenaryOwnerReference, 0)
	if err := query.Select(`
		characters.id,
		characters.name,
		characters.account_id,
		characters.level,
		characters.class,
		characters.race,
		characters.gender,
		COUNT(m.MercID) AS merc_count
	`).Group("characters.id").
		Order("characters.name ASC").
		Limit(mercenaryEditorSearchLimit).
		Scan(&results).Error; err != nil {
		return mercenaryDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, mercenaryEditorPage{Data: results, Total: int64(len(results)), Page: 1, Limit: mercenaryEditorSearchLimit})
}

func (m *MercenaryEditorController) searchSpells(c echo.Context) error {
	search := strings.TrimSpace(c.QueryParam("search"))
	if search == "" {
		return c.JSON(http.StatusOK, mercenaryEditorPage{Data: []mercenarySpellReference{}, Page: 1, Limit: mercenaryEditorSearchLimit})
	}
	db := m.eqemuDB(c)
	like := "%" + search + "%"
	query := db.Table("spells_new").Where("name LIKE ?", like)
	if id, err := strconv.Atoi(search); err == nil && id > 0 {
		query = db.Table("spells_new").Where("name LIKE ? OR id = ?", like, id)
	}
	results := make([]mercenarySpellReference, 0)
	if err := query.Select(`
		id,
		COALESCE(name, '') AS name,
		new_icon AS icon,
		buffdurationformula AS duration_formula,
		buffduration AS duration,
		goodEffect AS good_effect,
		resisttype AS resist_type,
		targettype AS target_type
	`).Order("name ASC").Limit(mercenaryEditorSearchLimit).Scan(&results).Error; err != nil {
		return mercenaryDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, mercenaryEditorPage{Data: results, Total: int64(len(results)), Page: 1, Limit: mercenaryEditorSearchLimit})
}

func (m *MercenaryEditorController) listAudit(c echo.Context) error {
	id, err := mercenaryID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if m.db.GetSpireDb() == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "Spire audit database is unavailable"})
	}
	page, limit := mercenaryPagination(c)
	if limit > 50 {
		limit = 50
	}
	connectionID := m.auditLog.ActiveConnectionID(c)
	query := m.db.GetSpireDb().Table("spire_user_event_log logs").
		Joins("LEFT JOIN spire_users users ON users.id = logs.user_id").
		Where("logs.server_database_connection_id = ?", connectionID).
		Where("logs.event_name LIKE 'MERCENARY_%'").
		Where("JSON_VALID(logs.data) = 1").
		Where(`
			CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.merc_id')) AS UNSIGNED) = ?
			OR CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.source_merc_id')) AS UNSIGNED) = ?
		`, id, id)
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return mercenaryDatabaseError(c, err)
	}
	rows := make([]mercenaryAuditRow, 0)
	if err := query.Select(`
		logs.id,
		logs.user_id,
		COALESCE(NULLIF(users.user_name, ''), NULLIF(users.full_name, ''), CONCAT('User ', logs.user_id)) AS user_name,
		logs.event_name,
		logs.created_at,
		logs.data
	`).Order("logs.id DESC").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
		return mercenaryDatabaseError(c, err)
	}
	results := make([]mercenaryAuditEntry, 0, len(rows))
	for _, row := range rows {
		payload := make(map[string]interface{})
		if err := json.Unmarshal([]byte(row.RawData), &payload); err != nil {
			payload["raw"] = row.RawData
		}
		results = append(results, mercenaryAuditEntry{
			ID: row.ID, UserID: row.UserID, UserName: row.UserName,
			EventName: row.EventName, CreatedAt: row.CreatedAt, Data: payload,
		})
	}
	return c.JSON(http.StatusOK, mercenaryEditorPage{Data: results, Total: total, Page: page, Limit: limit})
}

func (m *MercenaryEditorController) eqemuDB(c echo.Context) *gorm.DB {
	return m.db.Get(models.CharacterDatum{}, c)
}

func loadMercenaryDetail(db *gorm.DB, id uint) (mercenaryEditorDetail, error) {
	record, err := loadMercenaryRecord(db, id)
	if err != nil {
		return mercenaryEditorDetail{}, err
	}
	buffs := make([]mercenaryBuffRecord, 0)
	if err := db.Table("merc_buffs b").
		Joins("LEFT JOIN spells_new spells ON spells.id = b.SpellId").
		Select(mercenaryBuffSelect()).
		Where("b.MercId = ?", id).
		Order("b.MercBuffId ASC").
		Scan(&buffs).Error; err != nil {
		return mercenaryEditorDetail{}, err
	}
	return mercenaryEditorDetail{Mercenary: record, Buffs: buffs}, nil
}

func loadMercenaryRecord(db *gorm.DB, id uint) (mercenaryEditorRecord, error) {
	var record mercenaryEditorRecord
	err := db.Table("mercs m").
		Joins("LEFT JOIN character_data owner ON owner.id = m.OwnerCharacterID").
		Select(mercenaryRecordSelect()).
		Where("m.MercID = ?", id).
		Take(&record).Error
	return record, err
}

func lockMercenary(db *gorm.DB, id uint) (mercenaryEditorRecord, error) {
	var record mercenaryEditorRecord
	err := db.Table("mercs").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Select(`
			MercID AS merc_id,
			OwnerCharacterID AS owner_character_id,
			Slot AS slot,
			Name AS name,
			TemplateID AS template_id,
			SuspendedTime AS suspended_time,
			IsSuspended AS is_suspended,
			TimerRemaining AS timer_remaining,
			Gender AS gender,
			MercSize AS merc_size,
			StanceID AS stance_id,
			HP AS hp,
			Mana AS mana,
			Endurance AS endurance,
			Face AS face,
			LuclinHairStyle AS luclin_hair_style,
			LuclinHairColor AS luclin_hair_color,
			LuclinEyeColor AS luclin_eye_color,
			LuclinEyeColor2 AS luclin_eye_color_2,
			LuclinBeardColor AS luclin_beard_color,
			LuclinBeard AS luclin_beard,
			DrakkinHeritage AS drakkin_heritage,
			DrakkinTattoo AS drakkin_tattoo,
			DrakkinDetails AS drakkin_details
		`).Where("MercID = ?", id).Take(&record).Error
	return record, err
}

func loadMercenaryBuff(db *gorm.DB, mercID, buffID uint) (mercenaryBuffRecord, error) {
	var buff mercenaryBuffRecord
	err := db.Table("merc_buffs b").
		Joins("LEFT JOIN spells_new spells ON spells.id = b.SpellId").
		Select(mercenaryBuffSelect()).
		Where("b.MercId = ? AND b.MercBuffId = ?", mercID, buffID).
		Take(&buff).Error
	return buff, err
}

func lockMercenaryBuff(db *gorm.DB, mercID, buffID uint) (mercenaryBuffRecord, error) {
	var buff mercenaryBuffRecord
	err := db.Table("merc_buffs b").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Joins("LEFT JOIN spells_new spells ON spells.id = b.SpellId").
		Select(mercenaryBuffSelect()).
		Where("b.MercBuffId = ? AND b.MercId = ?", buffID, mercID).
		Take(&buff).Error
	return buff, err
}

func mercenaryRecordSelect() string {
	return `
		m.MercID AS merc_id,
		m.OwnerCharacterID AS owner_character_id,
		COALESCE(owner.name, '') AS owner_name,
		COALESCE(owner.account_id, 0) AS owner_account_id,
		COALESCE(owner.level, 0) AS owner_level,
		COALESCE(owner.class, 0) AS owner_class,
		COALESCE(owner.race, 0) AS owner_race,
		COALESCE(owner.gender, 0) AS owner_gender,
		m.Slot AS slot,
		m.Name AS name,
		m.TemplateID AS template_id,
		m.SuspendedTime AS suspended_time,
		m.IsSuspended AS is_suspended,
		m.TimerRemaining AS timer_remaining,
		m.Gender AS gender,
		m.MercSize AS merc_size,
		m.StanceID AS stance_id,
		m.HP AS hp,
		m.Mana AS mana,
		m.Endurance AS endurance,
		m.Face AS face,
		m.LuclinHairStyle AS luclin_hair_style,
		m.LuclinHairColor AS luclin_hair_color,
		m.LuclinEyeColor AS luclin_eye_color,
		m.LuclinEyeColor2 AS luclin_eye_color_2,
		m.LuclinBeardColor AS luclin_beard_color,
		m.LuclinBeard AS luclin_beard,
		m.DrakkinHeritage AS drakkin_heritage,
		m.DrakkinTattoo AS drakkin_tattoo,
		m.DrakkinDetails AS drakkin_details,
		(SELECT COUNT(*) FROM merc_buffs b WHERE b.MercId = m.MercID) AS buff_count
	`
}

func mercenaryBuffSelect() string {
	return `
		b.MercBuffId AS merc_buff_id,
		b.MercId AS merc_id,
		b.SpellId AS spell_id,
		COALESCE(spells.name, '') AS spell_name,
		COALESCE(spells.new_icon, 0) AS spell_icon,
		b.CasterLevel AS caster_level,
		b.DurationFormula AS duration_formula,
		b.TicsRemaining AS tics_remaining,
		b.PoisonCounters AS poison_counters,
		b.DiseaseCounters AS disease_counters,
		b.CurseCounters AS curse_counters,
		b.CorruptionCounters AS corruption_counters,
		b.HitCount AS hit_count,
		b.MeleeRune AS melee_rune,
		b.MagicRune AS magic_rune,
		b.dot_rune AS dot_rune,
		b.caston_x AS cast_on_x,
		b.Persistent AS persistent,
		b.caston_y AS cast_on_y,
		b.caston_z AS cast_on_z,
		b.ExtraDIChance AS extra_di_chance
	`
}

func mercenaryColumns(input mercenaryEditorInput) map[string]interface{} {
	return map[string]interface{}{
		"OwnerCharacterID": input.OwnerCharacterID,
		"Slot":             input.Slot,
		"Name":             input.Name,
		"TemplateID":       input.TemplateID,
		"SuspendedTime":    input.SuspendedTime,
		"IsSuspended":      input.IsSuspended,
		"TimerRemaining":   input.TimerRemaining,
		"Gender":           input.Gender,
		"MercSize":         input.MercSize,
		"StanceID":         input.StanceID,
		"HP":               input.HP,
		"Mana":             input.Mana,
		"Endurance":        input.Endurance,
		"Face":             input.Face,
		"LuclinHairStyle":  input.LuclinHairStyle,
		"LuclinHairColor":  input.LuclinHairColor,
		"LuclinEyeColor":   input.LuclinEyeColor,
		"LuclinEyeColor2":  input.LuclinEyeColor2,
		"LuclinBeardColor": input.LuclinBeardColor,
		"LuclinBeard":      input.LuclinBeard,
		"DrakkinHeritage":  input.DrakkinHeritage,
		"DrakkinTattoo":    input.DrakkinTattoo,
		"DrakkinDetails":   input.DrakkinDetails,
	}
}

func mercenaryBuffColumns(mercID uint, input mercenaryBuffInput) map[string]interface{} {
	return map[string]interface{}{
		"MercId":             mercID,
		"SpellId":            input.SpellID,
		"CasterLevel":        input.CasterLevel,
		"DurationFormula":    input.DurationFormula,
		"TicsRemaining":      input.TicsRemaining,
		"PoisonCounters":     input.PoisonCounters,
		"DiseaseCounters":    input.DiseaseCounters,
		"CurseCounters":      input.CurseCounters,
		"CorruptionCounters": input.CorruptionCounters,
		"HitCount":           input.HitCount,
		"MeleeRune":          input.MeleeRune,
		"MagicRune":          input.MagicRune,
		"dot_rune":           input.DotRune,
		"caston_x":           input.CastOnX,
		"Persistent":         input.Persistent,
		"caston_y":           input.CastOnY,
		"caston_z":           input.CastOnZ,
		"ExtraDIChance":      input.ExtraDIChance,
	}
}

func mercenaryInputFromRecord(record mercenaryEditorRecord) mercenaryEditorInput {
	return mercenaryEditorInput{
		OwnerCharacterID: record.OwnerCharacterID,
		Slot:             record.Slot,
		Name:             record.Name,
		TemplateID:       record.TemplateID,
		SuspendedTime:    record.SuspendedTime,
		IsSuspended:      record.IsSuspended,
		TimerRemaining:   record.TimerRemaining,
		Gender:           record.Gender,
		MercSize:         record.MercSize,
		StanceID:         record.StanceID,
		HP:               record.HP,
		Mana:             record.Mana,
		Endurance:        record.Endurance,
		Face:             record.Face,
		LuclinHairStyle:  record.LuclinHairStyle,
		LuclinHairColor:  record.LuclinHairColor,
		LuclinEyeColor:   record.LuclinEyeColor,
		LuclinEyeColor2:  record.LuclinEyeColor2,
		LuclinBeardColor: record.LuclinBeardColor,
		LuclinBeard:      record.LuclinBeard,
		DrakkinHeritage:  record.DrakkinHeritage,
		DrakkinTattoo:    record.DrakkinTattoo,
		DrakkinDetails:   record.DrakkinDetails,
	}
}

func validateMercenaryInput(input mercenaryEditorInput) error {
	if input.OwnerCharacterID == 0 {
		return errors.New("Select an owner character")
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return errors.New("Mercenary name is required")
	}
	if len(name) > 64 {
		return errors.New("Mercenary name cannot exceed 64 characters")
	}
	if math.IsNaN(float64(input.MercSize)) || math.IsInf(float64(input.MercSize), 0) || input.MercSize <= 0 || input.MercSize > 255 {
		return errors.New("Mercenary size must be greater than 0 and no more than 255")
	}
	return nil
}

func validateMercenaryBuffInput(input mercenaryBuffInput) error {
	if input.SpellID == 0 {
		return errors.New("Select a spell for this buff")
	}
	if input.CasterLevel > 255 {
		return errors.New("Caster level cannot exceed 255")
	}
	return nil
}

func ensureMercenaryOwner(db *gorm.DB, ownerID uint) error {
	var count int64
	if err := db.Table("character_data").Where("id = ? AND deleted_at IS NULL", ownerID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return mercenaryConflictError{"The selected owner character no longer exists"}
	}
	return nil
}

func ensureMercenarySlotAvailable(db *gorm.DB, ownerID uint, slot uint8, excludeMercID uint) error {
	query := db.Table("mercs").Where("OwnerCharacterID = ? AND Slot = ?", ownerID, slot)
	if excludeMercID > 0 {
		query = query.Where("MercID <> ?", excludeMercID)
	}
	var count int64
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return mercenaryConflictError{fmt.Sprintf("Owner already has a mercenary in slot %d", slot)}
	}
	return nil
}

func ensureMercenarySpell(db *gorm.DB, spellID uint) error {
	var count int64
	if err := db.Table("spells_new").Where("id = ?", spellID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return mercenaryConflictError{"The selected spell no longer exists"}
	}
	return nil
}

func nextMercenarySlot(db *gorm.DB, ownerID uint) (uint8, error) {
	var slots []uint8
	if err := db.Table("mercs").Where("OwnerCharacterID = ?", ownerID).Order("Slot ASC").Pluck("Slot", &slots).Error; err != nil {
		return 0, err
	}
	used := make(map[uint8]bool, len(slots))
	for _, slot := range slots {
		used[slot] = true
	}
	for i := 0; i <= 255; i++ {
		if !used[uint8(i)] {
			return uint8(i), nil
		}
	}
	return 0, mercenaryConflictError{"Owner has no available mercenary slots"}
}

func mercenaryCopyName(name string) string {
	suffix := " Copy"
	name = strings.TrimSpace(name)
	if len(name)+len(suffix) <= 64 {
		return name + suffix
	}
	if len(name) > 64-len(suffix) {
		name = name[:64-len(suffix)]
	}
	return strings.TrimSpace(name) + suffix
}

func mercenaryPagination(c echo.Context) (int, int) {
	page := 1
	limit := mercenaryEditorDefaultPageSize
	if parsed, err := strconv.Atoi(c.QueryParam("page")); err == nil && parsed > 0 {
		page = parsed
	}
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if limit > mercenaryEditorMaxPageSize {
		limit = mercenaryEditorMaxPageSize
	}
	return page, limit
}

func mercenaryID(c echo.Context, name string) (uint, error) {
	id, err := strconv.ParseUint(c.Param(name), 10, 32)
	if err != nil || id == 0 {
		return 0, fmt.Errorf("invalid mercenary identifier")
	}
	return uint(id), nil
}

type mercenaryConflictError struct {
	message string
}

func (e mercenaryConflictError) Error() string {
	return e.message
}

func mercenaryLoadError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Mercenary record was not found"})
	}
	return mercenaryDatabaseError(c, err)
}

func mercenaryMutationError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Mercenary record was not found"})
	}
	var conflict mercenaryConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	return mercenaryDatabaseError(c, err)
}

func mercenaryDatabaseError(c echo.Context, err error) error {
	return c.JSON(http.StatusInternalServerError, echo.Map{"error": fmt.Sprintf("Mercenary editor database error: %v", err)})
}

func (m *MercenaryEditorController) writeAudit(
	c echo.Context,
	eventName string,
	payload mercenaryAuditPayload,
) (uint, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return 0, err
	}
	id, err := m.auditLog.LogEditorEvent(c, eventName, string(data))
	if err != nil {
		return 0, fmt.Errorf("could not persist the required audit record: %w", err)
	}
	if id == 0 {
		return 0, errors.New("could not persist the required audit record")
	}
	return id, nil
}

func (m *MercenaryEditorController) discardAudit(id uint) {
	if id == 0 || m.db.GetSpireDb() == nil {
		return
	}
	_ = m.db.GetSpireDb().Table("spire_user_event_log").Where("id = ?", id).Delete(nil).Error
}
