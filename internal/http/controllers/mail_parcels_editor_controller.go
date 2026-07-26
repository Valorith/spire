package controllers

import (
	"crypto/sha256"
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
	mailParcelsMaxBatchItems   = 20
	mailParcelsMaxDirectMail   = 100
	mailParcelsSQLDateTime     = "2006-01-02 15:04:05"

	mailStatusUnread = 1
	mailStatusRead   = 3
	mailStatusTrash  = 4

	playerEventParcelSend     = 50
	playerEventParcelSendName = "Parcel Item Sent"

	mailParcelsEventMailCreate    = "MAIL_PARCELS_MAIL_CREATE"
	mailParcelsEventMailUpdate    = "MAIL_PARCELS_MAIL_UPDATE"
	mailParcelsEventMailDelete    = "MAIL_PARCELS_MAIL_DELETE"
	mailParcelsEventParcelCreate  = "MAIL_PARCELS_PARCEL_CREATE"
	mailParcelsEventParcelUpdate  = "MAIL_PARCELS_PARCEL_UPDATE"
	mailParcelsEventParcelDelete  = "MAIL_PARCELS_PARCEL_DELETE"
	mailParcelsEventContentCreate = "MAIL_PARCELS_CONTENT_CREATE"
	mailParcelsEventContentUpdate = "MAIL_PARCELS_CONTENT_UPDATE"
	mailParcelsEventContentDelete = "MAIL_PARCELS_CONTENT_DELETE"
	mailParcelsEventGMSendParcels = "MAIL_PARCELS_GM_SEND_PARCELS"
	mailParcelsEventGMSendMail    = "MAIL_PARCELS_GM_SEND_MAIL"
	mailParcelsEventGMBroadcast   = "MAIL_PARCELS_GM_BROADCAST"
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
	AugmentSlot1  int    `json:"augment_slot_1_type" gorm:"column:augment_slot_1_type"`
	AugmentSlot2  int    `json:"augment_slot_2_type" gorm:"column:augment_slot_2_type"`
	AugmentSlot3  int    `json:"augment_slot_3_type" gorm:"column:augment_slot_3_type"`
	AugmentSlot4  int    `json:"augment_slot_4_type" gorm:"column:augment_slot_4_type"`
	AugmentSlot5  int    `json:"augment_slot_5_type" gorm:"column:augment_slot_5_type"`
	AugmentSlot6  int    `json:"augment_slot_6_type" gorm:"column:augment_slot_6_type"`
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

type gmMailSendInput struct {
	CharacterIDs []uint `json:"character_ids"`
	Timestamp    int64  `json:"timestamp"`
	From         string `json:"from"`
	Subject      string `json:"subject"`
	Body         string `json:"body"`
	Reason       string `json:"reason"`
	Confirmation string `json:"confirmation"`
}

type gmMailSendResult struct {
	Audience       string                          `json:"audience"`
	RecipientCount int                             `json:"recipient_count"`
	MessageCount   int                             `json:"message_count"`
	MessageIDs     []uint                          `json:"message_ids,omitempty"`
	Recipients     []mailParcelsCharacterReference `json:"recipients"`
	AuditID        uint                            `json:"audit_id"`
}

type gmMailAudiencePreview struct {
	RecipientCount int                             `json:"recipient_count"`
	Recipients     []mailParcelsCharacterReference `json:"recipients"`
	Confirmation   string                          `json:"confirmation"`
}

type gmMailInsert struct {
	MsgID     uint   `gorm:"column:msgid;primaryKey;autoIncrement"`
	CharID    uint   `gorm:"column:charid"`
	Timestamp int64  `gorm:"column:timestamp"`
	From      string `gorm:"column:from"`
	Subject   string `gorm:"column:subject"`
	Body      string `gorm:"column:body"`
	To        string `gorm:"column:to"`
	Status    int8   `gorm:"column:status"`
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
	FromName      string `json:"from_name" gorm:"column:from_name"`
	Note          string `json:"note" gorm:"column:note"`
	SentDate      string `json:"sent_date" gorm:"column:sent_date"`
	SentTimestamp int64  `json:"sent_timestamp" gorm:"column:sent_timestamp"`
	ContentCount  int64  `json:"content_count" gorm:"column:content_count"`
}

type parcelEditorInput struct {
	CharacterID uint   `json:"character_id"`
	ItemID      uint   `json:"item_id"`
	Augment1    uint   `json:"augment_1"`
	Augment2    uint   `json:"augment_2"`
	Augment3    uint   `json:"augment_3"`
	Augment4    uint   `json:"augment_4"`
	Augment5    uint   `json:"augment_5"`
	Augment6    uint   `json:"augment_6"`
	SlotID      uint   `json:"slot_id"`
	Quantity    uint   `json:"quantity"`
	FromName    string `json:"from_name"`
	Note        string `json:"note"`
	SentDate    string `json:"sent_date"`
	Reason      string `json:"reason"`
}

type gmParcelSendInput struct {
	CharacterID  uint               `json:"character_id"`
	FromName     string             `json:"from_name"`
	Note         string             `json:"note"`
	SentDate     string             `json:"sent_date"`
	Reason       string             `json:"reason"`
	Confirmation string             `json:"confirmation"`
	Items        []gmParcelSendItem `json:"items"`
}

type gmParcelSendItem struct {
	ClientKey string `json:"client_key"`
	ItemID    uint   `json:"item_id"`
	Augment1  uint   `json:"augment_1"`
	Augment2  uint   `json:"augment_2"`
	Augment3  uint   `json:"augment_3"`
	Augment4  uint   `json:"augment_4"`
	Augment5  uint   `json:"augment_5"`
	Augment6  uint   `json:"augment_6"`
	Quantity  uint   `json:"quantity"`
}

type gmParcelSendDelivery struct {
	ClientKey        string             `json:"client_key"`
	Parcel           parcelEditorRecord `json:"parcel"`
	PlayerEventLogID int64              `json:"player_event_log_id"`
}

type gmParcelSendResult struct {
	CharacterID   uint                   `json:"character_id"`
	CharacterName string                 `json:"character_name"`
	ParcelCount   int                    `json:"parcel_count"`
	Deliveries    []gmParcelSendDelivery `json:"deliveries"`
	AuditID       uint                   `json:"audit_id"`
}

type parcelContentRecord struct {
	ID         uint   `json:"id" gorm:"column:id"`
	ParcelID   uint   `json:"parcel_id" gorm:"column:parcel_id"`
	SlotID     uint   `json:"slot_id" gorm:"column:slot_id"`
	ItemID     uint   `json:"item_id" gorm:"column:item_id"`
	ItemName   string `json:"item_name" gorm:"column:item_name"`
	ItemIcon   int    `json:"item_icon" gorm:"column:item_icon"`
	ItemNoDrop int    `json:"item_no_drop" gorm:"column:item_no_drop"`
	Augment1   uint   `json:"augment_1" gorm:"column:augment_1"`
	Augment2   uint   `json:"augment_2" gorm:"column:augment_2"`
	Augment3   uint   `json:"augment_3" gorm:"column:augment_3"`
	Augment4   uint   `json:"augment_4" gorm:"column:augment_4"`
	Augment5   uint   `json:"augment_5" gorm:"column:augment_5"`
	Augment6   uint   `json:"augment_6" gorm:"column:augment_6"`
	Quantity   uint   `json:"quantity" gorm:"column:quantity"`
}

type parcelContentInput struct {
	SlotID   uint   `json:"slot_id"`
	ItemID   uint   `json:"item_id"`
	Augment1 uint   `json:"augment_1"`
	Augment2 uint   `json:"augment_2"`
	Augment3 uint   `json:"augment_3"`
	Augment4 uint   `json:"augment_4"`
	Augment5 uint   `json:"augment_5"`
	Augment6 uint   `json:"augment_6"`
	Quantity uint   `json:"quantity"`
	Reason   string `json:"reason"`
}

type parcelEditorDetail struct {
	Parcel           parcelEditorRecord    `json:"parcel"`
	Content          []parcelContentRecord `json:"content"`
	PlayerEventLogID int64                 `json:"player_event_log_id,omitempty"`
}

// playerEventParcelSendData mirrors PlayerEvent::ParcelSend in the EQEmu
// server's common/events/player_events.h. Keep this payload schema compatible
// with the server so the existing event-log consumers can deserialize it.
type playerEventParcelSendData struct {
	ItemID         uint   `json:"item_id"`
	ItemUniqueID   string `json:"item_unique_id"`
	Augment1ID     uint   `json:"augment_1_id"`
	Augment2ID     uint   `json:"augment_2_id"`
	Augment3ID     uint   `json:"augment_3_id"`
	Augment4ID     uint   `json:"augment_4_id"`
	Augment5ID     uint   `json:"augment_5_id"`
	Augment6ID     uint   `json:"augment_6_id"`
	Quantity       uint   `json:"quantity"`
	Charges        int    `json:"charges"`
	FromPlayerName string `json:"from_player_name"`
	ToPlayerName   string `json:"to_player_name"`
	SentDate       uint   `json:"sent_date"`
}

type playerEventLogInsert struct {
	ID            int64     `gorm:"column:id;primaryKey;autoIncrement"`
	AccountID     int       `gorm:"column:account_id"`
	CharacterID   uint      `gorm:"column:character_id"`
	EventTypeID   int       `gorm:"column:event_type_id"`
	EventTypeName string    `gorm:"column:event_type_name"`
	EventData     string    `gorm:"column:event_data"`
	EtlTableID    int64     `gorm:"column:etl_table_id"`
	CreatedAt     time.Time `gorm:"column:created_at"`
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
	Action         string      `json:"action"`
	Kind           string      `json:"kind"`
	RecordID       uint        `json:"record_id"`
	ParentID       uint        `json:"parent_id,omitempty"`
	CharacterID    uint        `json:"character_id,omitempty"`
	CharacterName  string      `json:"character_name,omitempty"`
	ItemID         uint        `json:"item_id,omitempty"`
	ItemName       string      `json:"item_name,omitempty"`
	Subject        string      `json:"subject,omitempty"`
	Audience       string      `json:"audience,omitempty"`
	RecipientCount int         `json:"recipient_count,omitempty"`
	ParcelCount    int         `json:"parcel_count,omitempty"`
	RecordIDs      []uint      `json:"record_ids,omitempty"`
	Details        interface{} `json:"details,omitempty"`
	Reason         string      `json:"reason"`
	Before         interface{} `json:"before,omitempty"`
	After          interface{} `json:"after,omitempty"`
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
		routes.RegisterRoute(http.MethodPut, "mail-parcels-editor/mail/send", m.sendDirectMail, nil),
		routes.RegisterRoute(http.MethodPatch, "mail-parcels-editor/mail/:id", m.updateMail, nil),
		routes.RegisterRoute(http.MethodDelete, "mail-parcels-editor/mail/:id", m.deleteMail, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/broadcast/audience", m.broadcastAudience, nil),
		routes.RegisterRoute(http.MethodPut, "mail-parcels-editor/broadcast/mail/send", m.sendBroadcastMail, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/parcels", m.listParcels, nil),
		routes.RegisterRoute(http.MethodGet, "mail-parcels-editor/parcel/:id", m.getParcel, nil),
		routes.RegisterRoute(http.MethodPut, "mail-parcels-editor/parcel", m.createParcel, nil),
		routes.RegisterRoute(http.MethodPut, "mail-parcels-editor/parcel/send", m.sendGMParcels, nil),
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

func (m *MailParcelsEditorController) sendDirectMail(c echo.Context) error {
	var input gmMailSendInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid GM mail payload: %v", err)})
	}
	if err := validateGMMailInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	characterIDs := uniquePositiveIDs(input.CharacterIDs)
	if len(characterIDs) == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Select at least one recipient character"})
	}
	if len(characterIDs) > mailParcelsMaxDirectMail {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": fmt.Sprintf("Direct messages are limited to %d selected characters", mailParcelsMaxDirectMail),
		})
	}

	db := m.db.Get(models.Mail{}, c)
	result := gmMailSendResult{Audience: "direct", Recipients: []mailParcelsCharacterReference{}}
	var auditID uint
	err := db.Transaction(func(tx *gorm.DB) error {
		recipients, err := loadGMDirectRecipients(tx, characterIDs)
		if err != nil {
			return err
		}
		expected := gmMailConfirmation("direct", len(recipients))
		if strings.TrimSpace(input.Confirmation) != expected {
			return mailParcelsConflict("Type %s to confirm delivery", expected)
		}
		rows, err := createGMMailRows(tx, recipients, input)
		if err != nil {
			return err
		}
		result = gmMailResult("direct", recipients, rows)
		auditID, err = m.writeAudit(c, mailParcelsEventGMSendMail, gmMailAuditPayload(input, result, rows))
		result.AuditID = auditID
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "GM direct message")
	}
	return c.JSON(http.StatusCreated, result)
}

func (m *MailParcelsEditorController) broadcastAudience(c echo.Context) error {
	recipients, err := loadGMBroadcastRecipients(m.db.Get(models.Mail{}, c), false)
	if err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	preview := recipients
	if len(preview) > 12 {
		preview = preview[:12]
	}
	return c.JSON(http.StatusOK, gmMailAudiencePreview{
		RecipientCount: len(recipients),
		Recipients:     preview,
		Confirmation:   gmMailConfirmation("broadcast", len(recipients)),
	})
}

func (m *MailParcelsEditorController) sendBroadcastMail(c echo.Context) error {
	var input gmMailSendInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid GM broadcast payload: %v", err)})
	}
	if err := validateGMMailInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := m.db.Get(models.Mail{}, c)
	result := gmMailSendResult{Audience: "broadcast", Recipients: []mailParcelsCharacterReference{}}
	var auditID uint
	err := db.Transaction(func(tx *gorm.DB) error {
		recipients, err := loadGMBroadcastRecipients(tx, true)
		if err != nil {
			return err
		}
		if len(recipients) == 0 {
			return mailParcelsConflict("There are no active characters to receive this broadcast")
		}
		expected := gmMailConfirmation("broadcast", len(recipients))
		if strings.TrimSpace(input.Confirmation) != expected {
			return mailParcelsConflict("Type %s to confirm server-wide delivery", expected)
		}
		rows, err := createGMMailRows(tx, recipients, input)
		if err != nil {
			return err
		}
		result = gmMailResult("broadcast", recipients, rows)
		auditID, err = m.writeAudit(c, mailParcelsEventGMBroadcast, gmMailAuditPayload(input, result, rows))
		result.AuditID = auditID
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "GM server-wide message")
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
	itemDB := m.db.Get(models.Item{}, c)
	page, limit := mailParcelsPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	base := parcelBaseQuery(db)
	if search != "" {
		like := "%" + search + "%"
		itemIDs := make([]uint, 0)
		if err := itemDB.Table("items").Where("Name LIKE ?", like).Limit(mailParcelsMaxPageSize).Pluck("id", &itemIDs).Error; err != nil {
			return mailParcelsDatabaseError(c, err)
		}
		searchSQL := `
			character_record.name LIKE ? OR parcel.from_name LIKE ? OR parcel.note LIKE ?
			OR CAST(parcel.id AS CHAR) = ? OR CAST(parcel.char_id AS CHAR) = ? OR CAST(parcel.item_id AS CHAR) = ?
		`
		searchArgs := []interface{}{like, like, like, search, search, search}
		if len(itemIDs) > 0 {
			searchSQL += " OR parcel.item_id IN ?"
			searchArgs = append(searchArgs, itemIDs)
		}
		base = base.Where(searchSQL, searchArgs...)
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
	if err := hydrateParcelRecords(itemDB, records); err != nil {
		return mailParcelsDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, mailParcelsPage{Data: records, Total: total, Page: page, Limit: limit})
}

func (m *MailParcelsEditorController) getParcel(c echo.Context) error {
	id, err := mailParcelsID(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := loadParcelDetail(
		m.db.Get(models.CharacterParcel{}, c),
		m.db.Get(models.Item{}, c),
		id,
		false,
	)
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
	normalizedSentDate, err := normalizeParcelSentDate(input.SentDate)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	input.SentDate = normalizedSentDate
	if err := validateParcelInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	itemDB := m.db.Get(models.Item{}, c)
	var detail parcelEditorDetail
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		character, err := ensureMailParcelsCharacter(tx, input.CharacterID)
		if err != nil {
			return err
		}
		item, err := ensureParcelItemChanges(itemDB, input.ItemID, parcelAugments(input), 0, nil)
		if err != nil {
			return err
		}
		if input.SlotID == 0 {
			input.SlotID, err = nextParcelSlot(tx, input.CharacterID, 0, m.parcelCapacity(tx))
			if err != nil {
				return err
			}
		}
		if err := ensureParcelSlotAvailable(tx, input.CharacterID, input.SlotID, 0, m.parcelCapacity(tx)); err != nil {
			return err
		}
		if input.SentDate == "" {
			input.SentDate = time.Now().Format(mailParcelsSQLDateTime)
		}
		if err := tx.Table("character_parcels").Create(parcelInputColumns(input)).Error; err != nil {
			return err
		}
		var id uint
		if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&id).Error; err != nil {
			return err
		}
		detail, err = loadParcelDetail(tx, itemDB, id, false)
		if err != nil {
			return err
		}
		detail.PlayerEventLogID, err = writeParcelPlayerEvent(
			tx,
			character,
			detail.Parcel,
			item,
		)
		if err != nil {
			return err
		}
		auditID, err = m.writeAudit(c, mailParcelsEventParcelCreate, mailParcelsAuditPayload{
			Action: "create", Kind: "parcel", RecordID: id,
			CharacterID: input.CharacterID, CharacterName: character.Name,
			ItemID: input.ItemID, ItemName: item.Name,
			Reason: strings.TrimSpace(input.Reason),
			Details: map[string]interface{}{
				"player_event_log_id": detail.PlayerEventLogID,
			},
			After: detail.Parcel,
		})
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "Parcel")
	}
	return c.JSON(http.StatusCreated, detail)
}

func (m *MailParcelsEditorController) sendGMParcels(c echo.Context) error {
	var input gmParcelSendInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid GM parcel payload: %v", err)})
	}
	normalizedSentDate, err := normalizeParcelSentDate(input.SentDate)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	input.SentDate = normalizedSentDate
	if err := validateGMParcelSendInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := m.db.Get(models.CharacterParcel{}, c)
	itemDB := m.db.Get(models.Item{}, c)
	result := gmParcelSendResult{Deliveries: []gmParcelSendDelivery{}}
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		character, err := loadLockedGMRecipient(tx, input.CharacterID)
		if err != nil {
			return err
		}
		expected := gmParcelConfirmation(len(input.Items), character.Name)
		if strings.TrimSpace(input.Confirmation) != expected {
			return mailParcelsConflict("Type %s to confirm parcel delivery", expected)
		}
		capacity := m.parcelCapacity(tx)
		slots, err := availableParcelSlots(tx, input.CharacterID, capacity)
		if err != nil {
			return err
		}
		if len(slots) < len(input.Items) {
			return mailParcelsConflict(
				"%s has %d free parcel slots but this batch requires %d",
				character.Name,
				len(slots),
				len(input.Items),
			)
		}
		sentDate := strings.TrimSpace(input.SentDate)
		if sentDate == "" {
			sentDate = time.Now().Format(mailParcelsSQLDateTime)
		}
		recordIDs := make([]uint, 0, len(input.Items))
		itemMetadata := make([]map[string]interface{}, 0, len(input.Items))
		for index, line := range input.Items {
			item, err := ensureParcelItemChanges(itemDB, line.ItemID, gmParcelItemAugments(line), 0, nil)
			if err != nil {
				return mailParcelsConflict("Parcel %d: %s", index+1, err.Error())
			}
			if err := validateGMParcelItemConfiguration(item, line); err != nil {
				return mailParcelsConflict("Parcel %d: %s", index+1, err.Error())
			}
			parcelInput := parcelEditorInput{
				CharacterID: input.CharacterID,
				ItemID:      line.ItemID,
				Augment1:    line.Augment1,
				Augment2:    line.Augment2,
				Augment3:    line.Augment3,
				Augment4:    line.Augment4,
				Augment5:    line.Augment5,
				Augment6:    line.Augment6,
				SlotID:      slots[index],
				Quantity:    line.Quantity,
				FromName:    input.FromName,
				Note:        input.Note,
				SentDate:    sentDate,
			}
			if err := tx.Table("character_parcels").Create(parcelInputColumns(parcelInput)).Error; err != nil {
				return err
			}
			var id uint
			if err := tx.Raw("SELECT LAST_INSERT_ID()").Scan(&id).Error; err != nil {
				return err
			}
			detail, err := loadParcelDetail(tx, itemDB, id, false)
			if err != nil {
				return err
			}
			playerEventLogID, err := writeParcelPlayerEvent(tx, character, detail.Parcel, item)
			if err != nil {
				return err
			}
			recordIDs = append(recordIDs, id)
			result.Deliveries = append(result.Deliveries, gmParcelSendDelivery{
				ClientKey:        line.ClientKey,
				Parcel:           detail.Parcel,
				PlayerEventLogID: playerEventLogID,
			})
			itemMetadata = append(itemMetadata, map[string]interface{}{
				"parcel_id":           id,
				"player_event_log_id": playerEventLogID,
				"slot_id":             slots[index],
				"item_id":             item.ID,
				"item_name":           item.Name,
				"quantity":            line.Quantity,
				"augment_ids":         gmParcelItemAugments(line),
			})
		}
		result.CharacterID = character.ID
		result.CharacterName = character.Name
		result.ParcelCount = len(result.Deliveries)
		auditID, err = m.writeAudit(c, mailParcelsEventGMSendParcels, mailParcelsAuditPayload{
			Action:        "gm_send",
			Kind:          "parcel_batch",
			RecordID:      firstUint(recordIDs),
			RecordIDs:     recordIDs,
			CharacterID:   character.ID,
			CharacterName: character.Name,
			ParcelCount:   len(recordIDs),
			Reason:        strings.TrimSpace(input.Reason),
			Details: map[string]interface{}{
				"delivery_semantics": "one_parcel_per_item",
				"from_name":          strings.TrimSpace(input.FromName),
				"note":               strings.TrimSpace(input.Note),
				"sent_date":          sentDate,
				"items":              itemMetadata,
			},
		})
		result.AuditID = auditID
		return err
	})
	if err != nil {
		m.discardAudit(auditID)
		return mailParcelsMutationError(c, err, "GM parcel batch")
	}
	return c.JSON(http.StatusCreated, result)
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
	input.SentDate, err = normalizeParcelSentDate(input.SentDate)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if err := validateParcelInput(input); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := m.db.Get(models.CharacterParcel{}, c)
	itemDB := m.db.Get(models.Item{}, c)
	var detail parcelEditorDetail
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		currentDetail, err := loadParcelDetail(tx, itemDB, id, true)
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
		item, err := ensureParcelItemChanges(itemDB, input.ItemID, parcelAugments(input), current.ItemID, parcelRecordAugments(current))
		if err != nil {
			return err
		}
		if input.SlotID == 0 {
			input.SlotID, err = nextParcelSlot(tx, input.CharacterID, id, m.parcelCapacity(tx))
			if err != nil {
				return err
			}
		}
		if err := ensureParcelSlotAvailable(tx, input.CharacterID, input.SlotID, id, m.parcelCapacity(tx)); err != nil {
			return err
		}
		if err := tx.Table("character_parcels").Where("id = ?", id).Updates(parcelInputColumns(input)).Error; err != nil {
			return err
		}
		detail, err = loadParcelDetail(tx, itemDB, id, false)
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
	itemDB := m.db.Get(models.Item{}, c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		current, err := loadParcelDetail(tx, itemDB, id, true)
		if err != nil {
			return err
		}
		if err := tx.Table("character_parcels_containers").Where("parcels_id = ?", id).Delete(nil).Error; err != nil {
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
	itemDB := m.db.Get(models.Item{}, c)
	var result parcelContentRecord
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		parent, err := loadParcelDetail(tx, itemDB, parcelID, true)
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
		item, err := ensureParcelItemChanges(itemDB, input.ItemID, contentAugments(input), 0, nil)
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
		result, err = loadParcelContent(tx, itemDB, parcelID, id, false)
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
	itemDB := m.db.Get(models.Item{}, c)
	var result parcelContentRecord
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		parent, err := loadParcelDetail(tx, itemDB, parcelID, true)
		if err != nil {
			return err
		}
		current, err := loadParcelContent(tx, itemDB, parcelID, contentID, true)
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
		item, err := ensureParcelItemChanges(itemDB, input.ItemID, contentAugments(input), current.ItemID, contentRecordAugments(current))
		if err != nil {
			return err
		}
		if err := tx.Table("character_parcels_containers").
			Where("id = ? AND parcels_id = ?", contentID, parcelID).
			Updates(contentInputColumns(parcelID, input)).Error; err != nil {
			return err
		}
		result, err = loadParcelContent(tx, itemDB, parcelID, contentID, false)
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
	itemDB := m.db.Get(models.Item{}, c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		parent, err := loadParcelDetail(tx, itemDB, parcelID, true)
		if err != nil {
			return err
		}
		current, err := loadParcelContent(tx, itemDB, parcelID, contentID, true)
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
		if socketType, err := strconv.Atoi(c.QueryParam("socket_type")); err == nil && socketType > 0 && socketType <= 31 {
			query = query.Where("(augtype & ?) <> 0", uint64(1)<<uint(socketType-1))
		}
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
		augslot1type AS augment_slot_1_type,
		augslot2type AS augment_slot_2_type,
		augslot3type AS augment_slot_3_type,
		augslot4type AS augment_slot_4_type,
		augslot5type AS augment_slot_5_type,
		augslot6type AS augment_slot_6_type,
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
		Joins("LEFT JOIN character_data character_record ON character_record.id = parcel.char_id")
}

func parcelSelect(query *gorm.DB) *gorm.DB {
	return query.Select(`
		parcel.id,
		parcel.char_id AS character_id,
		COALESCE(character_record.name, CONCAT('Unknown character #', parcel.char_id)) AS character_name,
		parcel.item_id,
		parcel.aug_slot_1 AS augment_1,
		parcel.aug_slot_2 AS augment_2,
		parcel.aug_slot_3 AS augment_3,
		parcel.aug_slot_4 AS augment_4,
		parcel.aug_slot_5 AS augment_5,
		parcel.aug_slot_6 AS augment_6,
		parcel.slot_id,
		parcel.quantity,
		COALESCE(parcel.from_name, '') AS from_name,
		COALESCE(parcel.note, '') AS note,
		COALESCE(DATE_FORMAT(parcel.sent_date, '%Y-%m-%d %H:%i:%s'), '') AS sent_date,
		COALESCE(UNIX_TIMESTAMP(parcel.sent_date), 0) AS sent_timestamp,
		(SELECT COUNT(*) FROM character_parcels_containers content WHERE content.parcels_id = parcel.id) AS content_count
	`)
}

func loadParcelDetail(db, itemDB *gorm.DB, id uint, lock bool) (parcelEditorDetail, error) {
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
		Select(`
			content.id,
			content.parcels_id AS parcel_id,
			content.slot_id,
			content.item_id,
			content.aug_slot_1 AS augment_1,
			content.aug_slot_2 AS augment_2,
			content.aug_slot_3 AS augment_3,
			content.aug_slot_4 AS augment_4,
			content.aug_slot_5 AS augment_5,
			content.aug_slot_6 AS augment_6,
			content.quantity
		`).Where("content.parcels_id = ?", id).Order("content.slot_id, content.id").Scan(&result.Content).Error; err != nil {
		return result, err
	}
	parcelRecords := []parcelEditorRecord{result.Parcel}
	if err := hydrateParcelRecords(itemDB, parcelRecords); err != nil {
		return result, err
	}
	result.Parcel = parcelRecords[0]
	if err := hydrateParcelContentRecords(itemDB, result.Content); err != nil {
		return result, err
	}
	return result, nil
}

func loadParcelContent(db, itemDB *gorm.DB, parcelID, contentID uint, lock bool) (parcelContentRecord, error) {
	var result parcelContentRecord
	query := db.Table("character_parcels_containers content")
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := query.Select(`
		content.id,
		content.parcels_id AS parcel_id,
		content.slot_id,
		content.item_id,
		content.aug_slot_1 AS augment_1,
		content.aug_slot_2 AS augment_2,
		content.aug_slot_3 AS augment_3,
		content.aug_slot_4 AS augment_4,
		content.aug_slot_5 AS augment_5,
		content.aug_slot_6 AS augment_6,
		content.quantity
	`).Where("content.parcels_id = ? AND content.id = ?", parcelID, contentID).Take(&result).Error
	if err == nil {
		records := []parcelContentRecord{result}
		err = hydrateParcelContentRecords(itemDB, records)
		result = records[0]
	}
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

func loadLockedGMRecipient(db *gorm.DB, id uint) (mailParcelsCharacterReference, error) {
	var result mailParcelsCharacterReference
	err := db.Table("character_data").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("id, name, account_id, level, class, race").
		Where("id = ? AND deleted_at IS NULL", id).
		Take(&result).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return result, mailParcelsConflict("Character #%d was not found", id)
	}
	return result, err
}

func loadGMDirectRecipients(db *gorm.DB, ids []uint) ([]mailParcelsCharacterReference, error) {
	found := make([]mailParcelsCharacterReference, 0, len(ids))
	if err := db.Table("character_data").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("id, name, account_id, level, class, race").
		Where("id IN ? AND deleted_at IS NULL", ids).
		Find(&found).Error; err != nil {
		return nil, err
	}
	byID := make(map[uint]mailParcelsCharacterReference, len(found))
	for _, recipient := range found {
		byID[recipient.ID] = recipient
	}
	ordered := make([]mailParcelsCharacterReference, 0, len(ids))
	missing := make([]string, 0)
	for _, id := range ids {
		recipient, ok := byID[id]
		if !ok {
			missing = append(missing, strconv.FormatUint(uint64(id), 10))
			continue
		}
		ordered = append(ordered, recipient)
	}
	if len(missing) > 0 {
		return nil, mailParcelsConflict("Recipient character IDs were not found: %s", strings.Join(missing, ", "))
	}
	return ordered, nil
}

func loadGMBroadcastRecipients(db *gorm.DB, lock bool) ([]mailParcelsCharacterReference, error) {
	recipients := make([]mailParcelsCharacterReference, 0)
	query := db.Table("character_data").
		Select("id, name, account_id, level, class, race").
		Where("deleted_at IS NULL")
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	if err := query.Order("name, id").Find(&recipients).Error; err != nil {
		return nil, err
	}
	return recipients, nil
}

func createGMMailRows(
	db *gorm.DB,
	recipients []mailParcelsCharacterReference,
	input gmMailSendInput,
) ([]gmMailInsert, error) {
	timestamp := input.Timestamp
	if timestamp <= 0 {
		timestamp = time.Now().Unix()
	}
	rows := make([]gmMailInsert, 0, len(recipients))
	for _, recipient := range recipients {
		rows = append(rows, gmMailInsert{
			CharID:    recipient.ID,
			Timestamp: timestamp,
			From:      strings.TrimSpace(input.From),
			Subject:   strings.TrimSpace(input.Subject),
			Body:      input.Body,
			To:        recipient.Name,
			Status:    mailStatusUnread,
		})
	}
	if err := db.Table("mail").CreateInBatches(&rows, 500).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func gmMailResult(
	audience string,
	recipients []mailParcelsCharacterReference,
	rows []gmMailInsert,
) gmMailSendResult {
	messageIDs := make([]uint, 0, len(rows))
	for _, row := range rows {
		if row.MsgID > 0 {
			messageIDs = append(messageIDs, row.MsgID)
		}
	}
	preview := recipients
	if len(preview) > 12 {
		preview = preview[:12]
	}
	return gmMailSendResult{
		Audience:       audience,
		RecipientCount: len(recipients),
		MessageCount:   len(rows),
		MessageIDs:     messageIDs,
		Recipients:     preview,
	}
}

func gmMailAuditPayload(
	input gmMailSendInput,
	result gmMailSendResult,
	rows []gmMailInsert,
) mailParcelsAuditPayload {
	recordIDs := result.MessageIDs
	if len(recordIDs) > 100 {
		recordIDs = recordIDs[:100]
	}
	recipientIDs := make([]uint, 0, len(result.Recipients))
	for _, recipient := range result.Recipients {
		recipientIDs = append(recipientIDs, recipient.ID)
	}
	bodyHash := sha256.Sum256([]byte(input.Body))
	return mailParcelsAuditPayload{
		Action:         "gm_send",
		Kind:           "mail_batch",
		RecordID:       firstUint(result.MessageIDs),
		RecordIDs:      recordIDs,
		Subject:        strings.TrimSpace(input.Subject),
		Audience:       result.Audience,
		RecipientCount: result.RecipientCount,
		Reason:         strings.TrimSpace(input.Reason),
		Details: map[string]interface{}{
			"from":                      strings.TrimSpace(input.From),
			"timestamp":                 mailBatchTimestamp(rows),
			"body_length":               len(input.Body),
			"body_sha256":               fmt.Sprintf("%x", bodyHash),
			"recipient_id_sample":       recipientIDs,
			"message_id_sample_limited": len(result.MessageIDs) > len(recordIDs),
		},
	}
}

func mailBatchTimestamp(rows []gmMailInsert) int64 {
	if len(rows) == 0 {
		return 0
	}
	return rows[0].Timestamp
}

func gmMailConfirmation(audience string, count int) string {
	noun := "CHARACTERS"
	if count == 1 {
		noun = "CHARACTER"
	}
	if audience == "broadcast" {
		return fmt.Sprintf("BROADCAST TO %d %s", count, noun)
	}
	return fmt.Sprintf("SEND TO %d %s", count, noun)
}

func uniquePositiveIDs(values []uint) []uint {
	seen := make(map[uint]bool, len(values))
	result := make([]uint, 0, len(values))
	for _, value := range values {
		if value == 0 || seen[value] {
			continue
		}
		seen[value] = true
		result = append(result, value)
	}
	return result
}

func availableParcelSlots(db *gorm.DB, characterID uint, capacity int) ([]uint, error) {
	occupiedSlots := make([]uint, 0)
	if err := db.Table("character_parcels").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("char_id = ?", characterID).
		Order("slot_id").
		Pluck("slot_id", &occupiedSlots).Error; err != nil {
		return nil, err
	}
	occupied := make(map[uint]bool, len(occupiedSlots))
	for _, slot := range occupiedSlots {
		occupied[slot] = true
	}
	available := make([]uint, 0, capacity-len(occupiedSlots))
	for slot := 1; slot <= capacity; slot++ {
		if !occupied[uint(slot)] {
			available = append(available, uint(slot))
		}
	}
	return available, nil
}

func gmParcelItemAugments(input gmParcelSendItem) []uint {
	return []uint{input.Augment1, input.Augment2, input.Augment3, input.Augment4, input.Augment5, input.Augment6}
}

func itemAugmentSlotTypes(item mailParcelsItemReference) []int {
	return []int{
		item.AugmentSlot1,
		item.AugmentSlot2,
		item.AugmentSlot3,
		item.AugmentSlot4,
		item.AugmentSlot5,
		item.AugmentSlot6,
	}
}

func augmentFitsSocket(augmentType, socketType int) bool {
	if augmentType <= 0 || socketType <= 0 {
		return false
	}
	return augmentType&(1<<(socketType-1)) != 0
}

func validateGMParcelItemConfiguration(item mailParcelsItemReference, input gmParcelSendItem) error {
	if item.Stackable == 0 && input.Quantity != 1 {
		return errors.New("non-stackable items must use a quantity of 1")
	}
	if item.Stackable != 0 && item.StackSize > 0 && int(input.Quantity) > item.StackSize {
		return fmt.Errorf("quantity cannot exceed this item's stack size of %d", item.StackSize)
	}
	return nil
}

func gmParcelConfirmation(count int, characterName string) string {
	noun := "PARCELS"
	if count == 1 {
		noun = "PARCEL"
	}
	return fmt.Sprintf("SEND %d %s TO %s", count, noun, characterName)
}

func firstUint(values []uint) uint {
	if len(values) == 0 {
		return 0
	}
	return values[0]
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
		augslot1type AS augment_slot_1_type,
		augslot2type AS augment_slot_2_type,
		augslot3type AS augment_slot_3_type,
		augslot4type AS augment_slot_4_type,
		augslot5type AS augment_slot_5_type,
		augslot6type AS augment_slot_6_type,
		evolvinglevel AS evolving_level
	`).Where("id = ?", id).Take(&result).Error
	return result, err
}

func loadMailParcelsItems(db *gorm.DB, ids []uint) (map[uint]mailParcelsItemReference, error) {
	items := make([]mailParcelsItemReference, 0)
	if len(ids) == 0 {
		return map[uint]mailParcelsItemReference{}, nil
	}
	if err := db.Table("items").Select(`
		id,
		Name AS name,
		icon,
		nodrop AS no_drop,
		bagslots AS bag_slots
	`).Where("id IN ?", ids).Scan(&items).Error; err != nil {
		return nil, err
	}
	result := make(map[uint]mailParcelsItemReference, len(items))
	for _, item := range items {
		result[item.ID] = item
	}
	return result, nil
}

func hydrateParcelRecords(db *gorm.DB, records []parcelEditorRecord) error {
	ids := make([]uint, 0, len(records))
	seen := make(map[uint]bool, len(records))
	for _, record := range records {
		if record.ItemID > 0 && !seen[record.ItemID] {
			seen[record.ItemID] = true
			ids = append(ids, record.ItemID)
		}
	}
	items, err := loadMailParcelsItems(db, ids)
	if err != nil {
		return err
	}
	for index := range records {
		item, found := items[records[index].ItemID]
		if !found {
			records[index].ItemName = fmt.Sprintf("Unknown item #%d", records[index].ItemID)
			records[index].ItemNoDrop = 1
			continue
		}
		records[index].ItemName = item.Name
		records[index].ItemIcon = item.Icon
		records[index].ItemNoDrop = item.NoDrop
		records[index].ItemBagSlots = item.BagSlots
	}
	return nil
}

func hydrateParcelContentRecords(db *gorm.DB, records []parcelContentRecord) error {
	ids := make([]uint, 0, len(records))
	seen := make(map[uint]bool, len(records))
	for _, record := range records {
		if record.ItemID > 0 && !seen[record.ItemID] {
			seen[record.ItemID] = true
			ids = append(ids, record.ItemID)
		}
	}
	items, err := loadMailParcelsItems(db, ids)
	if err != nil {
		return err
	}
	for index := range records {
		item, found := items[records[index].ItemID]
		if !found {
			records[index].ItemName = fmt.Sprintf("Unknown item #%d", records[index].ItemID)
			records[index].ItemNoDrop = 1
			continue
		}
		records[index].ItemName = item.Name
		records[index].ItemIcon = item.Icon
		records[index].ItemNoDrop = item.NoDrop
	}
	return nil
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
		socketType := itemAugmentSlotTypes(item)[index]
		if !unchangedLegacy && socketType <= 0 {
			return item, mailParcelsConflict("Item #%d does not have augment socket %d", itemID, index+1)
		}
		if !unchangedLegacy && !augmentFitsSocket(augment.AugmentType, socketType) {
			return item, mailParcelsConflict(
				"Augment item #%d is not compatible with socket %d (type %d) on item #%d",
				augmentID,
				index+1,
				socketType,
				itemID,
			)
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

func nextParcelSlot(db *gorm.DB, characterID, excludeID uint, capacity int) (uint, error) {
	slots := make([]uint, 0)
	query := db.Table("character_parcels").Where("char_id = ?", characterID)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Order("slot_id").Pluck("slot_id", &slots).Error; err != nil {
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
		"slot_id": input.SlotID, "quantity": input.Quantity,
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
		"quantity": input.Quantity,
	}
}

func parcelPlayerEventData(
	parcel parcelEditorRecord,
	item mailParcelsItemReference,
) (playerEventParcelSendData, error) {
	sentAt, err := time.ParseInLocation(mailParcelsSQLDateTime, parcel.SentDate, time.Local)
	if err != nil {
		return playerEventParcelSendData{}, fmt.Errorf("parcel sent date is not valid for player event logging: %w", err)
	}
	return playerEventParcelSendData{
		ItemID:         parcel.ItemID,
		ItemUniqueID:   "",
		Augment1ID:     parcel.Augment1,
		Augment2ID:     parcel.Augment2,
		Augment3ID:     parcel.Augment3,
		Augment4ID:     parcel.Augment4,
		Augment5ID:     parcel.Augment5,
		Augment6ID:     parcel.Augment6,
		Quantity:       parcel.Quantity,
		Charges:        parcelPlayerEventCharges(item, parcel.Quantity),
		FromPlayerName: parcel.FromName,
		ToPlayerName:   parcel.CharacterName,
		SentDate:       uint(sentAt.Unix()),
	}, nil
}

func parcelPlayerEventCharges(item mailParcelsItemReference, quantity uint) int {
	if item.Stackable != 0 || item.MaxCharges <= 0 {
		return 0
	}
	return int(quantity)
}

func writeParcelPlayerEvent(
	tx *gorm.DB,
	character mailParcelsCharacterReference,
	parcel parcelEditorRecord,
	item mailParcelsItemReference,
) (int64, error) {
	eventData, err := parcelPlayerEventData(parcel, item)
	if err != nil {
		return 0, err
	}
	encoded, err := json.Marshal(eventData)
	if err != nil {
		return 0, fmt.Errorf("could not serialize the parcel player event: %w", err)
	}
	row := playerEventLogInsert{
		AccountID:     character.AccountID,
		CharacterID:   character.ID,
		EventTypeID:   playerEventParcelSend,
		EventTypeName: playerEventParcelSendName,
		EventData:     string(encoded),
		EtlTableID:    0,
		CreatedAt:     time.Now(),
	}
	if err := tx.Table("player_event_logs").Create(&row).Error; err != nil {
		return 0, fmt.Errorf(
			"parcel delivery requires a transactional %s player event in the active EQEmu database: %w",
			playerEventParcelSendName,
			err,
		)
	}
	return row.ID, nil
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

func validateGMMailInput(input gmMailSendInput) error {
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
	if strings.TrimSpace(input.Body) == "" {
		return errors.New("Message body is required")
	}
	if len(input.Body) > 65535 {
		return errors.New("Message body must be 65,535 characters or fewer")
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
		if _, err := time.Parse(mailParcelsSQLDateTime, input.SentDate); err != nil {
			return errors.New("Sent date must use YYYY-MM-DD HH:MM:SS")
		}
	}
	return validateMailParcelsReason(input.Reason)
}

func validateGMParcelSendInput(input gmParcelSendInput) error {
	if input.CharacterID == 0 {
		return errors.New("Select a recipient character")
	}
	if len(input.Items) == 0 {
		return errors.New("Add at least one parcel item")
	}
	if len(input.Items) > mailParcelsMaxBatchItems {
		return fmt.Errorf("A parcel batch is limited to %d items", mailParcelsMaxBatchItems)
	}
	if strings.TrimSpace(input.FromName) == "" {
		return errors.New("Sender name is required")
	}
	if len(strings.TrimSpace(input.FromName)) > 64 {
		return errors.New("Sender name must be 64 characters or fewer")
	}
	if len(strings.TrimSpace(input.Note)) > 1024 {
		return errors.New("Parcel note must be 1,024 characters or fewer")
	}
	if input.SentDate != "" {
		if _, err := time.Parse(mailParcelsSQLDateTime, input.SentDate); err != nil {
			return errors.New("Sent date must use YYYY-MM-DD HH:MM:SS")
		}
	}
	for index, item := range input.Items {
		if item.ItemID == 0 {
			return fmt.Errorf("Parcel %d requires an item", index+1)
		}
		if item.Quantity == 0 {
			return fmt.Errorf("Parcel %d quantity must be at least 1", index+1)
		}
	}
	return validateMailParcelsReason(input.Reason)
}

func normalizeParcelSentDate(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", nil
	}
	if instant, err := time.Parse(time.RFC3339Nano, value); err == nil {
		return instant.In(time.Local).Format(mailParcelsSQLDateTime), nil
	}
	if _, err := time.ParseInLocation(mailParcelsSQLDateTime, value, time.Local); err == nil {
		return value, nil
	}
	return "", errors.New("Sent date must be an RFC3339 timestamp or use YYYY-MM-DD HH:MM:SS")
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
