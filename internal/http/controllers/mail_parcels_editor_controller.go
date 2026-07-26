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
	mailParcelsDefaultPageSize = 30
	mailParcelsMaxPageSize     = 100
	mailParcelsReasonMinLength = 8
	mailParcelsReasonMaxLength = 240
	mailParcelsDefaultCapacity = 50

	mailStatusUnread = 1
	mailStatusRead   = 3
	mailStatusTrash  = 4

	mailParcelsEventMailCreate    = "MAIL_PARCELS_MAIL_CREATE"
	mailParcelsEventMailUpdate    = "MAIL_PARCELS_MAIL_UPDATE"
	mailParcelsEventMailDelete    = "MAIL_PARCELS_MAIL_DELETE"
	mailParcelsEventParcelCreate  = "MAIL_PARCELS_PARCEL_CREATE"
	mailParcelsEventParcelUpdate  = "MAIL_PARCELS_PARCEL_UPDATE"
	mailParcelsEventParcelDelete  = "MAIL_PARCELS_PARCEL_DELETE"
	mailParcelsEventContentCreate = "MAIL_PARCELS_CONTENT_CREATE"
	mailParcelsEventContentUpdate = "MAIL_PARCELS_CONTENT_UPDATE"
	mailParcelsEventContentDelete = "MAIL_PARCELS_CONTENT_DELETE"
)

type MailParcelsEditorController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type mailParcelsPage struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type mailParcelsSummary struct {
	MailCount       int64 `json:"mail_count"`
	UnreadCount     int64 `json:"unread_count"`
	TrashCount      int64 `json:"trash_count"`
	ParcelCount     int64 `json:"parcel_count"`
	ContainerCount  int64 `json:"container_count"`
	ParcelCapacity  int   `json:"parcel_capacity"`
	MoneyParcelItem uint  `json:"money_parcel_item"`
}

type mailParcelsCharacterReference struct {
	ID          uint   `json:"id" gorm:"column:id"`
	Name        string `json:"name" gorm:"column:name"`
	AccountID   int    `json:"account_id" gorm:"column:account_id"`
	Level       uint   `json:"level" gorm:"column:level"`
	Class       uint8  `json:"class" gorm:"column:class"`
	Race        uint16 `json:"race" gorm:"column:race"`
	ParcelCount int64  `json:"parcel_count" gorm:"column:parcel_count"`
	MailCount   int64  `json:"mail_count" gorm:"column:mail_count"`
}

type mailParcelsItemReference struct {
	ID            uint   `json:"id" gorm:"column:id"`
	Name          string `json:"name" gorm:"column:name"`
	Icon          int    `json:"icon" gorm:"column:icon"`
	Stackable     int    `json:"stackable" gorm:"column:stackable"`
	StackSize     int    `json:"stack_size" gorm:"column:stack_size"`
	MaxCharges    int    `json:"max_charges" gorm:"column:max_charges"`
	NoDrop        int    `json:"no_drop" gorm:"column:no_drop"`
	BagSlots      int    `json:"bag_slots" gorm:"column:bag_slots"`
	BagType       int    `json:"bag_type" gorm:"column:bag_type"`
	AugmentType   int    `json:"augment_type" gorm:"column:augment_type"`
	EvolvingLevel int    `json:"evolving_level" gorm:"column:evolving_level"`
}

type mailEditorRecord struct {
	MsgID         uint   `json:"msg_id" gorm:"column:msg_id"`
	CharacterID   uint   `json:"character_id" gorm:"column:character_id"`
	CharacterName string `json:"character_name" gorm:"column:character_name"`
	Timestamp     int64  `json:"timestamp" gorm:"column:timestamp"`
	From          string `json:"from" gorm:"column:from_name"`
	Subject       string `json:"subject" gorm:"column:subject"`
	Body          string `json:"body" gorm:"column:body"`
	To            string `json:"to" gorm:"column:to_line"`
	Status        int8   `json:"status" gorm:"column:status"`
}

type mailEditorInput struct {
	CharacterID uint   `json:"character_id"`
	Timestamp   int64  `json:"timestamp"`
	From        string `json:"from"`
	Subject     string `json:"subject"`
	Body        string `json:"body"`
	To          string `json:"to"`
	Status      int8   `json:"status"`
	Reason      string `json:"reason"`
}

type parcelEditorRecord struct {
	ID            uint   `json:"id" gorm:"column:id"`
	CharacterID   uint   `json:"character_id" gorm:"column:character_id"`
	CharacterName string `json:"character_name" gorm:"column:character_name"`
	ItemID        uint   `json:"item_id" gorm:"column:item_id"`
	ItemName      string `json:"item_name" gorm:"column:item_name"`
	ItemIcon      int    `json:"item_icon" gorm:"column:item_icon"`
	ItemNoDrop    int    `json:"item_no_drop" gorm:"column:item_no_drop"`
	ItemBagSlots  int    `json:"item_bag_slots" gorm:"column:item_bag_slots"`
	Augment1      uint   `json:"augment_1" gorm:"column:augment_1"`
	Augment2      uint   `json:"augment_2" gorm:"column:augment_2"`
	Augment3      uint   `json:"augment_3" gorm:"column:augment_3"`
	Augment4      uint   `json:"augment_4" gorm:"column:augment_4"`
	Augment5      uint   `json:"augment_5" gorm:"column:augment_5"`
	Augment6      uint   `json:"augment_6" gorm:"column:augment_6"`
	SlotID        uint   `json:"slot_id" gorm:"column:slot_id"`
	Quantity      uint   `json:"quantity" gorm:"column:quantity"`
	EvolveAmount  uint   `json:"evolve_amount" gorm:"column:evolve_amount"`
	FromName      string `json:"from_name" gorm:"column:from_name"`
	Note          string `json:"note" gorm:"column:note"`
	SentDate      string `json:"sent_date" gorm:"column:sent_date"`
	ContentCount  int64  `json:"content_count" gorm:"column:content_count"`
}

type parcelEditorInput struct {
	CharacterID  uint   `json:"character_id"`
	ItemID       uint   `json:"item_id"`
	Augment1     uint   `json:"augment_1"`
	Augment2     uint   `json:"augment_2"`
	Augment3     uint   `json:"augment_3"`
	Augment4     uint   `json:"augment_4"`
	Augment5     uint   `json:"augment_5"`
	Augment6     uint   `json:"augment_6"`
	SlotID       uint   `json:"slot_id"`
	Quantity     uint   `json:"quantity"`
	EvolveAmount uint   `json:"evolve_amount"`
	FromName     string `json:"from_name"`
	Note         string `json:"note"`
	SentDate     string `json:"sent_date"`
	Reason       string `json:"reason"`
}

type parcelContentRecord struct {
	ID           uint   `json:"id" gorm:"column:id"`
	ParcelID     uint   `json:"parcel_id" gorm:"column:parcel_id"`
	SlotID       uint   `json:"slot_id" gorm:"column:slot_id"`
	ItemID       uint   `json:"item_id" gorm:"column:item_id"`
	ItemName     string `json:"item_name" gorm:"column:item_name"`
	ItemIcon     int    `json:"item_icon" gorm:"column:item_icon"`
	ItemNoDrop   int    `json:"item_no_drop" gorm:"column:item_no_drop"`
	Augment1     uint   `json:"augment_1" gorm:"column:augment_1"`
	Augment2     uint   `json:"augment_2" gorm:"column:augment_2"`
	Augment3     uint   `json:"augment_3" gorm:"column:augment_3"`
	Augment4     uint   `json:"augment_4" gorm:"column:augment_4"`
	Augment5     uint   `json:"augment_5" gorm:"column:augment_5"`
	Augment6     uint   `json:"augment_6" gorm:"column:augment_6"`
	Quantity     uint   `json:"quantity" gorm:"column:quantity"`
	EvolveAmount uint   `json:"evolve_amount" gorm:"column:evolve_amount"`
}

type parcelContentInput struct {
	SlotID       uint   `json:"slot_id"`
	ItemID       uint   `json:"item_id"`
	Augment1     uint   `json:"augment_1"`
	Augment2     uint   `json:"augment_2"`
	Augment3     uint   `json:"augment_3"`
	Augment4     uint   `json:"augment_4"`
	Augment5     uint   `json:"augment_5"`
	Augment6     uint   `json:"augment_6"`
	Quantity     uint   `json:"quantity"`
	EvolveAmount uint   `json:"evolve_amount"`
	Reason       string `json:"reason"`
}

type parcelEditorDetail struct {
	Parcel  parcelEditorRecord    `json:"parcel"`
	Content []parcelContentRecord `json:"content"`
}

type mailParcelsDeleteRequest struct {
	Confirmation string `json:"confirmation"`
	Reason       string `json:"reason"`
}

type mailParcelsAuditEntry struct {
	ID        uint                   `json:"id"`
	UserID    uint                   `json:"user_id"`
	UserName  string                 `json:"user_name"`
	EventName string                 `json:"event_name"`
	CreatedAt time.Time              `json:"created_at"`
	Data      map[string]interface{} `json:"data"`
}

type mailParcelsAuditRow struct {
	ID        uint      `gorm:"column:id"`
	UserID    uint      `gorm:"column:user_id"`
	UserName  string    `gorm:"column:user_name"`
	EventName string    `gorm:"column:event_name"`
	CreatedAt time.Time `gorm:"column:created_at"`
	RawData   string    `gorm:"column:data"`
}

type mailParcelsAuditPayload struct {
	Action        string      `json:"action"`
	Kind          string      `json:"kind"`
	RecordID      uint        `json:"record_id"`
	ParentID      uint        `json:"parent_id,omitempty"`
	CharacterID   uint        `json:"character_id,omitempty"`
	CharacterName string      `json:"character_name,omitempty"`
	ItemID        uint        `json:"item_id,omitempty"`
	ItemName      string      `json:"item_name,omitempty"`
	Subject       string      `json:"subject,omitempty"`
	Reason        string      `json:"reason"`
	Before        interface{} `json:"before,omitempty"`
	After         interface{} `json:"after,omitempty"`
}

type mailParcelsConflictError struct {
	message string
}

func (e mailParcelsConflictError) Error() string {
	return e.message
}

func NewMailParcelsEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *MailParcelsEditorController {
	return &MailParcelsEditorController{db: db, auditLog: auditLog}
}

func (m *MailParcelsEditorController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/summary", m.summary, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/mail", m.listMail, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/mail/:id", m.getMail, nil),
		routes.RegisterRoute(http.MethodPut, "mail-parcels-editor/mail", m.createMail, nil),
		routes.RegisterRoute(http.MethodPatch, "mail-parcels-editor/mail/:id", m.updateMail, nil),
		routes.RegisterRoute(http.MethodDelete, "mail-parcels-editor/mail/:id", m.deleteMail, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/parcels", m.listParcels, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/parcel/:id", m.getParcel, nil),
		routes.RegisterRoute(http.MethodPut, "mail-parcels-editor/parcel", m.createParcel, nil),
		routes.RegisterRoute(http.MethodPatch, "mail-parcels-editor/parcel/:id", m.updateParcel, nil),
		routes.RegisterRoute(http.MethodDelete, "mail-parcels-editor/parcel/:id", m.deleteParcel, nil),
		routes.RegisterRoute(http.MethodPut, "mail-parcels-editor/parcel/:id/content", m.createParcelContent, nil),
		routes.RegisterRoute(http.MethodPatch, "mail-parcels-editor/parcel/:id/content/:contentId", m.updateParcelContent, nil),
		routes.RegisterRoute(http.MethodDelete, "mail-parcels-editor/parcel/:id/content/:contentId", m.deleteParcelContent, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/characters", m.searchCharacters, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/items", m.searchItems, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/audit", m.listAudit, nil),
	}
}

func (m *MailParcelsEditorController) summary(c echo.Context) error {
	db := m.db.Get(models.Mail{}, c)
	result := mailParcelsSummary{ParcelCapacity: m.parcelCapacity(db), MoneyParcelItem: 99990}
	queries := []struct {
		table string
		where string
		value *int64
	}{
		{"mail", "", &result.MailCount},
		{"mail", "status = 1", &result.UnreadCount},
		{"mail", "status = 4", &result.TrashCount},
		{"character_parcels", "", &result.ParcelCount},
		{"character_parcels_containers", "", &result.ContainerCount},
	}
	for _, query := range queries {
		q := db.Table(query.table)
		if query.where != "" {
			q = q.Where(query.where)
		}
		if err := q.Count(query.value).Error; err != nil {
			return mailParcelsDatabaseError(c, err)
		}
	}
	return c.JSON(http.StatusOK, result)
}

func (m *MailParcelsEditorController) listMail(c echo.Context) error {
	db := m.db.Get(models.Mail{}, c)
	page, limit := mailParcelsPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	status := strings.TrimSpace(strings.ToLower(c.QueryParam("status")))

	base := db.Table("mail m").
		Joins("LEFT JOIN character_data character_record ON character_record.id = m.charid")
	if search != "" {
		like := "%" + search + "%"
		base = base.Where(`
			m.subject LIKE ? OR m.from LIKE ? OR m.to LIKE ? OR character_record.name LIKE ?
			OR CAST(m.msgid AS CHAR) = ? OR CAST(m.charid AS CHAR) = ?
		`, like, like, like, like, search, search)
	}
	switch status {
	case "unread":
		base = base.Where("m.status = ?", mailStatusUnread)
	case "read":
		base = base.Where("m.status = ?", mailStatusRead)
	case "trash":
		base = base.Where("m.status = ?", mailStatusTrash)
	case "unknown":
		base = base.Where("m.status NOT IN ?", []int{mailStatusUnread, mailStatusRead, mailStatusTrash})
	}

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	records := make([]mailEditorRecord, 0)
	if err := base.Select(`
		m.msgid AS msg_id,
		m.charid AS character_id,
		COALESCE(character_record.name, CONCAT('Unknown character #', m.charid)) AS character_name,
		m.timestamp,
		COALESCE(m.from, '') AS from_name,
		COALESCE(m.subject, '') AS subject,
		COALESCE(m.body, '') AS body,
		COALESCE(m.to, '') AS to_line,
		m.status
	`).Order("m.timestamp DESC, m.msgid DESC").
		Limit(limit).Offset((page - 1) * limit).Scan(&records).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, mailParcelsPage{Data: records, Total: total, Page: page, Limit: limit})
}

func (m *MailParcelsEditorController) getMail(c echo.Context) error {
	id, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	record, err := loadMailRecord(m.db.Get(models.Mail{}, c), id, false)
	if err != nil {
		return mailParcelsLoadError(c, err, "Mail message")
	}
	return c.JSON(http.StatusOK, record)
}

func (m *MailParcelsEditorController) createMail(c echo.Context) error {
	var input mailEditorInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid mail payload: %v", err)})
	}
	if err := validateMailInput(input, nil); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.db.Get(models.Mail{}, c)
	var result mailEditorRecord
	var auditID uint
	err := db.Transaction(func(tx *gorm.DB) error {
		character, err := ensureMailParcelsCharacter(tx, input.CharacterID)
		if err != nil {
			return err
		}
		if input.Timestamp <= 0 {
			input.Timestamp = time.Now().Unix()
		}
		if strings.TrimSpace(input.To) == "" {
			input.To = character.Name
		}
		values := mailInputColumns(input)
		if err := tx.Table("mail").Create(values).Error; err != nil {
			return err
		}
		var id uint
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&id).Error; err != nil {
			return err
		}
		result, err = loadMailRecord(tx, id, false)
		if err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventMailCreate, mailParcelsAuditPayload{
			Action: "create", Kind: "mail", RecordID: id,
			CharacterID: result.CharacterID, CharacterName: result.CharacterName,
			Subject: result.Subject, Reason: strings.TrimSpace(input.Reason), After: result,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Mail message")
	}
	return c.JSON(http.StatusCreated, result)
}

func (m *MailParcelsEditorController) updateMail(c echo.Context) error {
	id, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input mailEditorInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid mail payload: %v", err)})
	}
	db := m.db.Get(models.Mail{}, c)
	var result mailEditorRecord
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := loadMailRecord(tx, id, true)
		if err != nil {
			return err
		}
		if err := validateMailInput(input, &current.Status); err != nil {
			return mailParcelsConflict("%s", err.Error())
		}
		if input.CharacterID != current.CharacterID {
			if _, err := ensureMailParcelsCharacter(tx, input.CharacterID); err != nil {
				return err
			}
		}
		if err := tx.Table("mail").Where("msgid = ?", id).Updates(mailInputColumns(input)).Error; err != nil {
			return err
		}
		result, err = loadMailRecord(tx, id, false)
		if err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventMailUpdate, mailParcelsAuditPayload{
			Action: "update", Kind: "mail", RecordID: id,
			CharacterID: result.CharacterID, CharacterName: result.CharacterName,
			Subject: result.Subject, Reason: strings.TrimSpace(input.Reason),
			Before: current, After: result,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Mail message")
	}
	return c.JSON(http.StatusOK, result)
}

func (m *MailParcelsEditorController) deleteMail(c echo.Context) error {
	id, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request mailParcelsDeleteRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid delete payload: %v", err)})
	}
	if err := validateMailParcelsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	expected := fmt.Sprintf("MAIL #%d", id)
	if strings.TrimSpace(request.Confirmation) != expected {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Type %s to confirm deletion", expected)})
	}
	db := m.db.Get(models.Mail{}, c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := loadMailRecord(tx, id, true)
		if err != nil {
			return err
		}
		if err := tx.Table("mail").Where("msgid = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventMailDelete, mailParcelsAuditPayload{
			Action: "delete", Kind: "mail", RecordID: id,
			CharacterID: current.CharacterID, CharacterName: current.CharacterName,
			Subject: current.Subject, Reason: strings.TrimSpace(request.Reason), Before: current,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Mail message")
	}
	return c.NoContent(http.StatusNoContent)
}

func (m *MailParcelsEditorController) listParcels(c echo.Context) error {
	db := m.db.Get(models.CharacterParcel{}, c)
	page, limit := mailParcelsPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	base := parcelBaseQuery(db)
	if search != "" {
		like := "%" + search + "%"
		base = base.Where(`
			character_record.name LIKE ? OR item_record.Name LIKE ? OR parcel.from_name LIKE ? OR parcel.note LIKE ?
			OR CAST(parcel.id AS CHAR) = ? OR CAST(parcel.char_id AS CHAR) = ? OR CAST(parcel.item_id AS CHAR) = ?
		`, like, like, like, like, search, search, search)
	}
	var total int64
	if err := base.Count(&total).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	records := make([]parcelEditorRecord, 0)
	if err := parcelSelect(base).Order("parcel.sent_date DESC, parcel.id DESC").
		Limit(limit).Offset((page - 1) * limit).Scan(&records).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, mailParcelsPage{Data: records, Total: total, Page: page, Limit: limit})
}

func (m *MailParcelsEditorController) getParcel(c echo.Context) error {
	id, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := loadParcelDetail(m.db.Get(models.CharacterParcel{}, c), id, false)
	if err != nil {
		return mailParcelsLoadError(c, err, "Parcel")
	}
	return c.JSON(http.StatusOK, detail)
}

func (m *MailParcelsEditorController) createParcel(c echo.Context) error {
	var input parcelEditorInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid parcel payload: %v", err)})
	}
	if err := validateParcelInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	var detail parcelEditorDetail
	var auditID uint
	err := db.Transaction(func(tx *gorm.DB) error {
		character, err := ensureMailParcelsCharacter(tx, input.CharacterID)
		if err != nil {
			return err
		}
		item, err := ensureParcelItemChanges(tx, input.ItemID, parcelAugments(input), 0, nil)
		if err != nil {
			return err
		}
		if input.SlotID == 0 {
			input.SlotID, err = nextParcelSlot(tx, input.CharacterID, m.parcelCapacity(tx))
			if err != nil {
				return err
			}
		}
		if err := ensureParcelSlotAvailable(tx, input.CharacterID, input.SlotID, 0, m.parcelCapacity(tx)); err != nil {
			return err
		}
		if input.SentDate == "" {
			input.SentDate = time.Now().Format("2006-01-02 15:04:05")
		}
		if err := tx.Table("character_parcels").Create(parcelInputColumns(input)).Error; err != nil {
			return err
		}
		var id uint
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&id).Error; err != nil {
			return err
		}
		detail, err = loadParcelDetail(tx, id, false)
		if err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventParcelCreate, mailParcelsAuditPayload{
			Action: "create", Kind: "parcel", RecordID: id,
			CharacterID: input.CharacterID, CharacterName: character.Name,
			ItemID: input.ItemID, ItemName: item.Name,
			Reason: strings.TrimSpace(input.Reason), After: detail.Parcel,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Parcel")
	}
	return c.JSON(http.StatusCreated, detail)
}

func (m *MailParcelsEditorController) updateParcel(c echo.Context) error {
	id, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input parcelEditorInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid parcel payload: %v", err)})
	}
	if err := validateParcelInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	var detail parcelEditorDetail
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		currentDetail, err := loadParcelDetail(tx, id, true)
		if err != nil {
			return err
		}
		current := currentDetail.Parcel
		character := mailParcelsCharacterReference{ID: current.CharacterID, Name: current.CharacterName}
		if input.CharacterID != current.CharacterID {
			character, err = ensureMailParcelsCharacter(tx, input.CharacterID)
			if err != nil {
				return err
			}
		}
		item, err := ensureParcelItemChanges(tx, input.ItemID, parcelAugments(input), current.ItemID, parcelRecordAugments(current))
		if err != nil {
			return err
		}
		if input.SlotID == 0 {
			return mailParcelsConflict("Parcel slot must be at least 1")
		}
		if err := ensureParcelSlotAvailable(tx, input.CharacterID, input.SlotID, id, m.parcelCapacity(tx)); err != nil {
			return err
		}
		if err := tx.Table("character_parcels").Where("id = ?", id).Updates(parcelInputColumns(input)).Error; err != nil {
			return err
		}
		detail, err = loadParcelDetail(tx, id, false)
		if err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventParcelUpdate, mailParcelsAuditPayload{
			Action: "update", Kind: "parcel", RecordID: id,
			CharacterID: input.CharacterID, CharacterName: character.Name,
			ItemID: input.ItemID, ItemName: item.Name,
			Reason: strings.TrimSpace(input.Reason), Before: current, After: detail.Parcel,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Parcel")
	}
	return c.JSON(http.StatusOK, detail)
}

func (m *MailParcelsEditorController) deleteParcel(c echo.Context) error {
	id, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request mailParcelsDeleteRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid delete payload: %v", err)})
	}
	if err := validateMailParcelsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	expected := fmt.Sprintf("PARCEL #%d", id)
	if strings.TrimSpace(request.Confirmation) != expected {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Type %s to confirm deletion", expected)})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := loadParcelDetail(tx, id, true)
		if err != nil {
			return err
		}
		if err := tx.Table("character_parcels").Where("id = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventParcelDelete, mailParcelsAuditPayload{
			Action: "delete", Kind: "parcel", RecordID: id,
			CharacterID: current.Parcel.CharacterID, CharacterName: current.Parcel.CharacterName,
			ItemID: current.Parcel.ItemID, ItemName: current.Parcel.ItemName,
			Reason: strings.TrimSpace(request.Reason), Before: current,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Parcel")
	}
	return c.NoContent(http.StatusNoContent)
}

func (m *MailParcelsEditorController) createParcelContent(c echo.Context) error {
	parcelID, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input parcelContentInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid parcel content payload: %v", err)})
	}
	if err := validateParcelContentInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	var result parcelContentRecord
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		parent, err := loadParcelDetail(tx, parcelID, true)
		if err != nil {
			return err
		}
		if parent.Parcel.ItemBagSlots <= 0 {
			return mailParcelsConflict("The selected parcel item is not a container")
		}
		if int(input.SlotID) >= parent.Parcel.ItemBagSlots {
			return mailParcelsConflict("Container slot %d is outside this item's %d available slots", input.SlotID, parent.Parcel.ItemBagSlots)
		}
		if err := ensureParcelContentSlotAvailable(tx, parcelID, input.SlotID, 0); err != nil {
			return err
		}
		item, err := ensureParcelItemChanges(tx, input.ItemID, contentAugments(input), 0, nil)
		if err != nil {
			return err
		}
		if err := tx.Table("character_parcels_containers").Create(contentInputColumns(parcelID, input)).Error; err != nil {
			return err
		}
		var id uint
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&id).Error; err != nil {
			return err
		}
		result, err = loadParcelContent(tx, parcelID, id, false)
		if err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventContentCreate, mailParcelsAuditPayload{
			Action: "create", Kind: "parcel_content", RecordID: id, ParentID: parcelID,
			CharacterID: parent.Parcel.CharacterID, CharacterName: parent.Parcel.CharacterName,
			ItemID: input.ItemID, ItemName: item.Name,
			Reason: strings.TrimSpace(input.Reason), After: result,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Parcel content")
	}
	return c.JSON(http.StatusCreated, result)
}

func (m *MailParcelsEditorController) updateParcelContent(c echo.Context) error {
	parcelID, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	contentID, err := mailParcelsID(c, "contentId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var input parcelContentInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid parcel content payload: %v", err)})
	}
	if err := validateParcelContentInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	var result parcelContentRecord
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		parent, err := loadParcelDetail(tx, parcelID, true)
		if err != nil {
			return err
		}
		current, err := loadParcelContent(tx, parcelID, contentID, true)
		if err != nil {
			return err
		}
		if parent.Parcel.ItemBagSlots > 0 && int(input.SlotID) >= parent.Parcel.ItemBagSlots {
			return mailParcelsConflict("Container slot %d is outside this item's %d available slots", input.SlotID, parent.Parcel.ItemBagSlots)
		}
		if input.SlotID != current.SlotID {
			if err := ensureParcelContentSlotAvailable(tx, parcelID, input.SlotID, contentID); err != nil {
				return err
			}
		}
		item, err := ensureParcelItemChanges(tx, input.ItemID, contentAugments(input), current.ItemID, contentRecordAugments(current))
		if err != nil {
			return err
		}
		if err := tx.Table("character_parcels_containers").
			Where("id = ? AND parcels_id = ?", contentID, parcelID).
			Updates(contentInputColumns(parcelID, input)).Error; err != nil {
			return err
		}
		result, err = loadParcelContent(tx, parcelID, contentID, false)
		if err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventContentUpdate, mailParcelsAuditPayload{
			Action: "update", Kind: "parcel_content", RecordID: contentID, ParentID: parcelID,
			CharacterID: parent.Parcel.CharacterID, CharacterName: parent.Parcel.CharacterName,
			ItemID: input.ItemID, ItemName: item.Name,
			Reason: strings.TrimSpace(input.Reason), Before: current, After: result,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Parcel content")
	}
	return c.JSON(http.StatusOK, result)
}

func (m *MailParcelsEditorController) deleteParcelContent(c echo.Context) error {
	parcelID, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	contentID, err := mailParcelsID(c, "contentId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request mailParcelsDeleteRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid delete payload: %v", err)})
	}
	if err := validateMailParcelsReason(request.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	expected := fmt.Sprintf("ITEM #%d", contentID)
	if strings.TrimSpace(request.Confirmation) != expected {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Type %s to confirm removal", expected)})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		parent, err := loadParcelDetail(tx, parcelID, true)
		if err != nil {
			return err
		}
		current, err := loadParcelContent(tx, parcelID, contentID, true)
		if err != nil {
			return err
		}
		if err := tx.Table("character_parcels_containers").
			Where("id = ? AND parcels_id = ?", contentID, parcelID).Delete(nil).Error; err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventContentDelete, mailParcelsAuditPayload{
			Action: "delete", Kind: "parcel_content", RecordID: contentID, ParentID: parcelID,
			CharacterID: parent.Parcel.CharacterID, CharacterName: parent.Parcel.CharacterName,
			ItemID: current.ItemID, ItemName: current.ItemName,
			Reason: strings.TrimSpace(request.Reason), Before: current,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Parcel content")
	}
	return c.NoContent(http.StatusNoContent)
}

func (m *MailParcelsEditorController) searchCharacters(c echo.Context) error {
	db := m.db.Get(models.CharacterDatum{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	if search == "" {
		return c.JSON(http.StatusOK, mailParcelsPage{Data: []mailParcelsCharacterReference{}, Total: 0, Page: 1, Limit: 12})
	}
	like := "%" + search + "%"
	query := db.Table("character_data character_record").
		Where("character_record.deleted_at IS NULL").
		Where("character_record.name LIKE ?", like)
	if id, err := strconv.Atoi(search); err == nil && id > 0 {
		query = db.Table("character_data character_record").
			Where("character_record.deleted_at IS NULL").
			Where("character_record.name LIKE ? OR character_record.id = ?", like, id)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	results := make([]mailParcelsCharacterReference, 0)
	if err := query.Select(`
		character_record.id,
		character_record.name,
		character_record.account_id,
		character_record.level,
		character_record.class,
		character_record.race,
		(SELECT COUNT(*) FROM character_parcels parcel WHERE parcel.char_id = character_record.id) AS parcel_count,
		(SELECT COUNT(*) FROM mail message WHERE message.charid = character_record.id) AS mail_count
	`).Order("character_record.name, character_record.id").Limit(12).Scan(&results).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, mailParcelsPage{Data: results, Total: total, Page: 1, Limit: 12})
}

func (m *MailParcelsEditorController) searchItems(c echo.Context) error {
	db := m.db.Get(models.Item{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	if search == "" {
		return c.JSON(http.StatusOK, mailParcelsPage{Data: []mailParcelsItemReference{}, Total: 0, Page: 1, Limit: 12})
	}
	like := "%" + search + "%"
	query := db.Table("items").Where("Name LIKE ?", like)
	if id, err := strconv.Atoi(search); err == nil && id > 0 {
		query = db.Table("items").Where("Name LIKE ? OR id = ?", like, id)
	}
	if strings.EqualFold(c.QueryParam("scope"), "augment") {
		query = query.Where("augtype > 0")
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	results := make([]mailParcelsItemReference, 0)
	if err := query.Select(`
		id,
		Name AS name,
		icon,
		stackable,
		stacksize AS stack_size,
		maxcharges AS max_charges,
		nodrop AS no_drop,
		bagslots AS bag_slots,
		bagtype AS bag_type,
		augtype AS augment_type,
		evolvinglevel AS evolving_level
	`).Order("Name, id").Limit(12).Scan(&results).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, mailParcelsPage{Data: results, Total: total, Page: 1, Limit: 12})
}

func (m *MailParcelsEditorController) listAudit(c echo.Context) error {
	kind := strings.TrimSpace(strings.ToLower(c.QueryParam("kind")))
	idValue := strings.TrimSpace(c.QueryParam("id"))
	id64, err := strconv.ParseUint(idValue, 10, 32)
	if err != nil || id64 == 0 || (kind != "mail" && kind != "parcel") {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Audit kind must be mail or parcel and ID must be positive"})
	}
	id := uint(id64)
	if m.db.GetSpireDb() == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "Spire audit database is unavailable"})
	}
	page, limit := mailParcelsPagination(c)
	if limit > 50 {
		limit = 50
	}
	connectionID := m.auditLog.ActiveConnectionID(c)
	query := m.db.GetSpireDb().Table("spire_user_event_log logs").
		Joins("LEFT JOIN spire_users users ON users.id = logs.user_id").
		Where("logs.server_database_connection_id = ?", connectionID).
		Where("logs.event_name LIKE 'MAIL_PARCELS_%'").
		Where("JSON_VALID(logs.data) = 1").
		Where(`
			(
				JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.kind')) = ?
				AND CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.record_id')) AS UNSIGNED) = ?
			)
			OR (
				? = 'parcel'
				AND JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.kind')) = 'parcel_content'
				AND CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.parent_id')) AS UNSIGNED) = ?
			)
		`, kind, id, kind, id)
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	rows := make([]mailParcelsAuditRow, 0)
	if err := query.Select(`
		logs.id,
		logs.user_id,
		COALESCE(NULLIF(users.user_name, ''), NULLIF(users.full_name, ''), CONCAT('User ', logs.user_id)) AS user_name,
		logs.event_name,
		logs.created_at,
		logs.data
	`).Order("logs.id DESC").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	results := make([]mailParcelsAuditEntry, 0, len(rows))
	for _, row := range rows {
		payload := make(map[string]interface{})
		if err := json.Unmarshal([]byte(row.RawData), &payload); err != nil {
			payload["raw"] = row.RawData
		}
		results = append(results, mailParcelsAuditEntry{
			ID: row.ID, UserID: row.UserID, UserName: row.UserName,
			EventName: row.EventName, CreatedAt: row.CreatedAt, Data: payload,
		})
	}
	return c.JSON(http.StatusOK, mailParcelsPage{Data: results, Total: total, Page: page, Limit: limit})
}

func loadMailRecord(db *gorm.DB, id uint, lock bool) (mailEditorRecord, error) {
	var result mailEditorRecord
	query := db.Table("mail m").
		Joins("LEFT JOIN character_data character_record ON character_record.id = m.charid")
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := query.Select(`
		m.msgid AS msg_id,
		m.charid AS character_id,
		COALESCE(character_record.name, CONCAT('Unknown character #', m.charid)) AS character_name,
		m.timestamp,
		COALESCE(m.from, '') AS from_name,
		COALESCE(m.subject, '') AS subject,
		COALESCE(m.body, '') AS body,
		COALESCE(m.to, '') AS to_line,
		m.status
	`).Where("m.msgid = ?", id).Take(&result).Error
	return result, err
}

func parcelBaseQuery(db *gorm.DB) *gorm.DB {
	return db.Table("character_parcels parcel").
		Joins("LEFT JOIN character_data character_record ON character_record.id = parcel.char_id").
		Joins("LEFT JOIN items item_record ON item_record.id = parcel.item_id")
}

func parcelSelect(query *gorm.DB) *gorm.DB {
	return query.Select(`
		parcel.id,
		parcel.char_id AS character_id,
		COALESCE(character_record.name, CONCAT('Unknown character #', parcel.char_id)) AS character_name,
		parcel.item_id,
		COALESCE(item_record.Name, CONCAT('Unknown item #', parcel.item_id)) AS item_name,
		COALESCE(item_record.icon, 0) AS item_icon,
		COALESCE(item_record.nodrop, 1) AS item_no_drop,
		COALESCE(item_record.bagslots, 0) AS item_bag_slots,
		parcel.aug_slot_1 AS augment_1,
		parcel.aug_slot_2 AS augment_2,
		parcel.aug_slot_3 AS augment_3,
		parcel.aug_slot_4 AS augment_4,
		parcel.aug_slot_5 AS augment_5,
		parcel.aug_slot_6 AS augment_6,
		parcel.slot_id,
		parcel.quantity,
		parcel.evolve_amount,
		COALESCE(parcel.from_name, '') AS from_name,
		COALESCE(parcel.note, '') AS note,
		COALESCE(DATE_FORMAT(parcel.sent_date, '%Y-%m-%d %H:%i:%s'), '') AS sent_date,
		(SELECT COUNT(*) FROM character_parcels_containers content WHERE content.parcels_id = parcel.id) AS content_count
	`)
}

func loadParcelDetail(db *gorm.DB, id uint, lock bool) (parcelEditorDetail, error) {
	var result parcelEditorDetail
	query := parcelBaseQuery(db)
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if err := parcelSelect(query).Where("parcel.id = ?", id).Take(&result.Parcel).Error; err != nil {
		return result, err
	}
	result.Content = make([]parcelContentRecord, 0)
	if err := db.Table("character_parcels_containers content").
		Joins("LEFT JOIN items item_record ON item_record.id = content.item_id").
		Select(`
			content.id,
			content.parcels_id AS parcel_id,
			content.slot_id,
			content.item_id,
			COALESCE(item_record.Name, CONCAT('Unknown item #', content.item_id)) AS item_name,
			COALESCE(item_record.icon, 0) AS item_icon,
			COALESCE(item_record.nodrop, 1) AS item_no_drop,
			content.aug_slot_1 AS augment_1,
			content.aug_slot_2 AS augment_2,
			content.aug_slot_3 AS augment_3,
			content.aug_slot_4 AS augment_4,
			content.aug_slot_5 AS augment_5,
			content.aug_slot_6 AS augment_6,
			content.quantity,
			content.evolve_amount
		`).Where("content.parcels_id = ?", id).Order("content.slot_id, content.id").Scan(&result.Content).Error; err != nil {
		return result, err
	}
	return result, nil
}

func loadParcelContent(db *gorm.DB, parcelID, contentID uint, lock bool) (parcelContentRecord, error) {
	var result parcelContentRecord
	query := db.Table("character_parcels_containers content").
		Joins("LEFT JOIN items item_record ON item_record.id = content.item_id")
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := query.Select(`
		content.id,
		content.parcels_id AS parcel_id,
		content.slot_id,
		content.item_id,
		COALESCE(item_record.Name, CONCAT('Unknown item #', content.item_id)) AS item_name,
		COALESCE(item_record.icon, 0) AS item_icon,
		COALESCE(item_record.nodrop, 1) AS item_no_drop,
		content.aug_slot_1 AS augment_1,
		content.aug_slot_2 AS augment_2,
		content.aug_slot_3 AS augment_3,
		content.aug_slot_4 AS augment_4,
		content.aug_slot_5 AS augment_5,
		content.aug_slot_6 AS augment_6,
		content.quantity,
		content.evolve_amount
	`).Where("content.parcels_id = ? AND content.id = ?", parcelID, contentID).Take(&result).Error
	return result, err
}

func ensureMailParcelsCharacter(db *gorm.DB, id uint) (mailParcelsCharacterReference, error) {
	var result mailParcelsCharacterReference
	err := db.Table("character_data").
		Select("id, name, account_id, level, class, race").
		Where("id = ? AND deleted_at IS NULL", id).Take(&result).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return result, mailParcelsConflict("Character #%d was not found", id)
	}
	return result, err
}

func loadMailParcelsItem(db *gorm.DB, id uint) (mailParcelsItemReference, error) {
	var result mailParcelsItemReference
	err := db.Table("items").Select(`
		id,
		Name AS name,
		icon,
		stackable,
		stacksize AS stack_size,
		maxcharges AS max_charges,
		nodrop AS no_drop,
		bagslots AS bag_slots,
		bagtype AS bag_type,
		augtype AS augment_type,
		evolvinglevel AS evolving_level
	`).Where("id = ?", id).Take(&result).Error
	return result, err
}

func ensureParcelItemChanges(
	db *gorm.DB,
	itemID uint,
	augments []uint,
	currentItemID uint,
	currentAugments []uint,
) (mailParcelsItemReference, error) {
	item, err := loadMailParcelsItem(db, itemID)
	if errors.Is(err, gorm.ErrRecordNotFound) && itemID == currentItemID {
		item.ID = itemID
		item.Name = fmt.Sprintf("Unknown item #%d", itemID)
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		return item, mailParcelsConflict("Item #%d was not found", itemID)
	} else if err != nil {
		return item, err
	}
	for index, augmentID := range augments {
		if augmentID == 0 {
			continue
		}
		augment, err := loadMailParcelsItem(db, augmentID)
		unchangedLegacy := index < len(currentAugments) && augmentID == currentAugments[index]
		if errors.Is(err, gorm.ErrRecordNotFound) && unchangedLegacy {
			continue
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return item, mailParcelsConflict("Augment slot %d item #%d was not found", index+1, augmentID)
		}
		if err != nil {
			return item, err
		}
		if augment.AugmentType <= 0 && !unchangedLegacy {
			return item, mailParcelsConflict("Item #%d is not an augment", augmentID)
		}
	}
	return item, nil
}

func ensureParcelSlotAvailable(db *gorm.DB, characterID, slotID, excludeID uint, capacity int) error {
	if slotID == 0 || (capacity > 0 && int(slotID) > capacity) {
		return mailParcelsConflict("Parcel slot must be between 1 and %d", capacity)
	}
	query := db.Table("character_parcels").Where("char_id = ? AND slot_id = ?", characterID, slotID)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	var count int64
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return mailParcelsConflict("Parcel slot %d is already occupied for this character", slotID)
	}
	return nil
}

func nextParcelSlot(db *gorm.DB, characterID uint, capacity int) (uint, error) {
	slots := make([]uint, 0)
	if err := db.Table("character_parcels").
		Where("char_id = ?", characterID).Order("slot_id").Pluck("slot_id", &slots).Error; err != nil {
		return 0, err
	}
	occupied := make(map[uint]bool, len(slots))
	for _, slot := range slots {
		occupied[slot] = true
	}
	for slot := 1; slot <= capacity; slot++ {
		if !occupied[uint(slot)] {
			return uint(slot), nil
		}
	}
	return 0, mailParcelsConflict("This character has reached the parcel capacity of %d", capacity)
}

func ensureParcelContentSlotAvailable(db *gorm.DB, parcelID, slotID, excludeID uint) error {
	query := db.Table("character_parcels_containers").Where("parcels_id = ? AND slot_id = ?", parcelID, slotID)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	var count int64
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return mailParcelsConflict("Container slot %d is already occupied", slotID)
	}
	return nil
}

func (m *MailParcelsEditorController) parcelCapacity(db *gorm.DB) int {
	var value string
	err := db.Table("rule_values").
		Select("rule_value").
		Where("rule_name = ?", "Parcel:ParcelMaxItems").
		Order("ruleset_id DESC").Limit(1).Scan(&value).Error
	if err != nil {
		return mailParcelsDefaultCapacity
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return mailParcelsDefaultCapacity
	}
	return parsed
}

func mailInputColumns(input mailEditorInput) map[string]interface{} {
	return map[string]interface{}{
		"charid": input.CharacterID, "timestamp": input.Timestamp, "from": strings.TrimSpace(input.From),
		"subject": strings.TrimSpace(input.Subject), "body": input.Body, "to": strings.TrimSpace(input.To),
		"status": input.Status,
	}
}

func parcelInputColumns(input parcelEditorInput) map[string]interface{} {
	columns := map[string]interface{}{
		"char_id": input.CharacterID, "item_id": input.ItemID,
		"aug_slot_1": input.Augment1, "aug_slot_2": input.Augment2, "aug_slot_3": input.Augment3,
		"aug_slot_4": input.Augment4, "aug_slot_5": input.Augment5, "aug_slot_6": input.Augment6,
		"slot_id": input.SlotID, "quantity": input.Quantity, "evolve_amount": input.EvolveAmount,
		"from_name": strings.TrimSpace(input.FromName), "note": strings.TrimSpace(input.Note),
	}
	if strings.TrimSpace(input.SentDate) == "" {
		columns["sent_date"] = nil
	} else {
		columns["sent_date"] = strings.TrimSpace(input.SentDate)
	}
	return columns
}

func contentInputColumns(parcelID uint, input parcelContentInput) map[string]interface{} {
	return map[string]interface{}{
		"parcels_id": parcelID, "slot_id": input.SlotID, "item_id": input.ItemID,
		"aug_slot_1": input.Augment1, "aug_slot_2": input.Augment2, "aug_slot_3": input.Augment3,
		"aug_slot_4": input.Augment4, "aug_slot_5": input.Augment5, "aug_slot_6": input.Augment6,
		"quantity": input.Quantity, "evolve_amount": input.EvolveAmount,
	}
}

func parcelAugments(input parcelEditorInput) []uint {
	return []uint{input.Augment1, input.Augment2, input.Augment3, input.Augment4, input.Augment5, input.Augment6}
}

func parcelRecordAugments(input parcelEditorRecord) []uint {
	return []uint{input.Augment1, input.Augment2, input.Augment3, input.Augment4, input.Augment5, input.Augment6}
}

func contentAugments(input parcelContentInput) []uint {
	return []uint{input.Augment1, input.Augment2, input.Augment3, input.Augment4, input.Augment5, input.Augment6}
}

func contentRecordAugments(input parcelContentRecord) []uint {
	return []uint{input.Augment1, input.Augment2, input.Augment3, input.Augment4, input.Augment5, input.Augment6}
}

func validateMailInput(input mailEditorInput, currentStatus *int8) error {
	if input.CharacterID == 0 {
		return errors.New("Select a recipient character")
	}
	if strings.TrimSpace(input.From) == "" {
		return errors.New("Sender is required")
	}
	if len(strings.TrimSpace(input.From)) > 100 {
		return errors.New("Sender must be 100 characters or fewer")
	}
	if strings.TrimSpace(input.Subject) == "" {
		return errors.New("Subject is required")
	}
	if len(strings.TrimSpace(input.Subject)) > 200 {
		return errors.New("Subject must be 200 characters or fewer")
	}
	knownStatus := input.Status == mailStatusUnread || input.Status == mailStatusRead || input.Status == mailStatusTrash
	unchangedLegacy := currentStatus != nil && input.Status == *currentStatus
	if !knownStatus && !unchangedLegacy {
		return mailParcelsConflict("Mail status %d is an unknown legacy value; preserve it or choose Unread, Read, or Trash", input.Status)
	}
	return validateMailParcelsReason(input.Reason)
}

func validateParcelInput(input parcelEditorInput) error {
	if input.CharacterID == 0 {
		return errors.New("Select a recipient character")
	}
	if input.ItemID == 0 {
		return errors.New("Select an item")
	}
	if input.Quantity == 0 {
		return errors.New("Quantity must be at least 1")
	}
	if len(strings.TrimSpace(input.FromName)) > 64 {
		return errors.New("Sender name must be 64 characters or fewer")
	}
	if len(strings.TrimSpace(input.Note)) > 1024 {
		return errors.New("Parcel note must be 1,024 characters or fewer")
	}
	if input.SentDate != "" {
		if _, err := time.Parse("2006-01-02 15:04:05", input.SentDate); err != nil {
			return errors.New("Sent date must use YYYY-MM-DD HH:MM:SS")
		}
	}
	return validateMailParcelsReason(input.Reason)
}

func validateParcelContentInput(input parcelContentInput) error {
	if input.ItemID == 0 {
		return errors.New("Select a container item")
	}
	if input.Quantity == 0 {
		return errors.New("Quantity must be at least 1")
	}
	return validateMailParcelsReason(input.Reason)
}

func validateMailParcelsReason(reason string) error {
	length := len(strings.TrimSpace(reason))
	if length < mailParcelsReasonMinLength {
		return fmt.Errorf("Reason must be at least %d characters", mailParcelsReasonMinLength)
	}
	if length > mailParcelsReasonMaxLength {
		return fmt.Errorf("Reason must be %d characters or fewer", mailParcelsReasonMaxLength)
	}
	return nil
}

func mailParcelsPagination(c echo.Context) (int, int) {
	page := 1
	limit := mailParcelsDefaultPageSize
	if parsed, err := strconv.Atoi(c.QueryParam("page")); err == nil && parsed > 0 {
		page = parsed
	}
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if limit > mailParcelsMaxPageSize {
		limit = mailParcelsMaxPageSize
	}
	return page, limit
}

func mailParcelsID(c echo.Context, name string) (uint, error) {
	id, err := strconv.ParseUint(c.Param(name), 10, 32)
	if err != nil || id == 0 {
		return 0, fmt.Errorf("%s must be a positive number", name)
	}
	return uint(id), nil
}

func mailParcelsConflict(format string, args ...interface{}) error {
	return mailParcelsConflictError{message: fmt.Sprintf(format, args...)}
}

func mailParcelsMutationError(c echo.Context, err error, resource string) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": resource + " was not found"})
	}
	var conflict mailParcelsConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	return mailParcelsDatabaseError(c, err)
}

func mailParcelsLoadError(c echo.Context, err error, resource string) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": resource + " was not found"})
	}
	return mailParcelsDatabaseError(c, err)
}

func mailParcelsDatabaseError(c echo.Context, err error) error {
	return c.JSON(http.StatusInternalServerError, echo.Map{
		"error": fmt.Sprintf("Mail and parcels editor database error: %v", err),
	})
}

func (m *MailParcelsEditorController) writeAudit(
	c echo.Context,
	eventName string,
	payload mailParcelsAuditPayload,
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

func (m *MailParcelsEditorController) discardAudit(id uint) {
	if id == 0 || m.db.GetSpireDb() == nil {
		return
	}
	_ = m.db.GetSpireDb().Table("spire_user_event_log").Where("id = ?", id).Delete(nil).Error
}
