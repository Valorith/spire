package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	chatAdminEventChannelCreate = "CHAT_CHANNEL_CREATE"
	chatAdminEventChannelUpdate = "CHAT_CHANNEL_UPDATE"
	chatAdminEventChannelDelete = "CHAT_CHANNEL_DELETE"
	chatAdminEventReserveCreate = "CHAT_RESERVED_NAME_CREATE"
	chatAdminEventReserveUpdate = "CHAT_RESERVED_NAME_UPDATE"
	chatAdminEventReserveDelete = "CHAT_RESERVED_NAME_DELETE"
	chatAdminEventSaylinkCreate = "CHAT_SAYLINK_CREATE"
	chatAdminEventSaylinkUpdate = "CHAT_SAYLINK_UPDATE"
	chatAdminEventSaylinkDelete = "CHAT_SAYLINK_DELETE"
)

type ChatAdministrationController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type chatAdministrationSummary struct {
	Channels      int64 `json:"channels"`
	Secured       int64 `json:"secured"`
	SystemOwned   int64 `json:"system_owned"`
	ReservedNames int64 `json:"reserved_names"`
	Saylinks      int64 `json:"saylinks"`
}

type chatAdministrationPage struct {
	Data    interface{}               `json:"data"`
	Total   int64                     `json:"total"`
	Page    int                       `json:"page"`
	Limit   int                       `json:"limit"`
	Summary chatAdministrationSummary `json:"summary"`
}

type chatChannelSnapshot struct {
	Name        string `json:"name"`
	Owner       string `json:"owner"`
	MinStatus   int    `json:"minstatus"`
	HasPassword bool   `json:"has_password"`
}

type chatChannelInput struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Owner        string `json:"owner"`
	MinStatus    int    `json:"minstatus"`
	PasswordMode string `json:"password_mode"`
	Password     string `json:"password"`
	Reason       string `json:"reason"`
}

type chatChannelMutationRequest struct {
	Channel            chatChannelInput     `json:"channel"`
	Expected           *chatChannelSnapshot `json:"expected,omitempty"`
	Confirm            bool                 `json:"confirm,omitempty"`
	AllowSystemChannel bool                 `json:"allow_system_channel,omitempty"`
}

type chatChannelRecord struct {
	ID               int    `json:"id" gorm:"column:id"`
	Name             string `json:"name" gorm:"column:name"`
	Owner            string `json:"owner" gorm:"column:owner"`
	MinStatus        int    `json:"minstatus" gorm:"column:minstatus"`
	HasPassword      bool   `json:"has_password" gorm:"column:has_password"`
	OwnerCharacterID int    `json:"owner_character_id" gorm:"column:owner_character_id"`
	OwnerExists      bool   `json:"owner_exists" gorm:"column:owner_exists"`
	SystemOwned      bool   `json:"system_owned" gorm:"-"`
}

type chatChannelRaw struct {
	ID        int    `gorm:"column:id"`
	Name      string `gorm:"column:name"`
	Owner     string `gorm:"column:owner"`
	Password  string `gorm:"column:password"`
	MinStatus int    `gorm:"column:minstatus"`
}

type chatReservedNameSnapshot struct {
	Name string `json:"name"`
}

type chatReservedNameInput struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Reason string `json:"reason"`
}

type chatReservedNameMutationRequest struct {
	Reserved chatReservedNameInput     `json:"reserved"`
	Expected *chatReservedNameSnapshot `json:"expected,omitempty"`
	Confirm  bool                      `json:"confirm,omitempty"`
}

type chatReservedNameRecord struct {
	ID                 int    `json:"id" gorm:"column:id"`
	Name               string `json:"name" gorm:"column:name"`
	ActiveChannelCount int64  `json:"active_channel_count" gorm:"column:active_channel_count"`
}

type chatSaylinkSnapshot struct {
	Phrase string `json:"phrase"`
}

type chatSaylinkInput struct {
	ID     int    `json:"id"`
	Phrase string `json:"phrase"`
	Reason string `json:"reason"`
}

type chatSaylinkMutationRequest struct {
	Saylink  chatSaylinkInput     `json:"saylink"`
	Expected *chatSaylinkSnapshot `json:"expected,omitempty"`
	Confirm  bool                 `json:"confirm,omitempty"`
}

type chatSaylinkRecord struct {
	ID             int    `json:"id" gorm:"column:id"`
	Phrase         string `json:"phrase" gorm:"column:phrase"`
	DuplicateCount int64  `json:"duplicate_count" gorm:"column:duplicate_count"`
}

func NewChatAdministrationController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *ChatAdministrationController {
	return &ChatAdministrationController{db: db, auditLog: auditLog}
}

func (a *ChatAdministrationController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "chat-administration/summary", a.getSummary, nil),
		routes.RegisterRoute(http.MethodGet, "chat-administration/channels", a.listChannels, nil),
		routes.RegisterRoute(http.MethodGet, "chat-administration/channel/:id", a.getChannel, nil),
		routes.RegisterRoute(http.MethodPut, "chat-administration/channel", a.createChannel, nil),
		routes.RegisterRoute(http.MethodPatch, "chat-administration/channel/:id", a.updateChannel, nil),
		routes.RegisterRoute(http.MethodDelete, "chat-administration/channel/:id", a.deleteChannel, nil),
		routes.RegisterRoute(http.MethodGet, "chat-administration/reserved-names", a.listReservedNames, nil),
		routes.RegisterRoute(http.MethodPut, "chat-administration/reserved-name", a.createReservedName, nil),
		routes.RegisterRoute(http.MethodPatch, "chat-administration/reserved-name/:id", a.updateReservedName, nil),
		routes.RegisterRoute(http.MethodDelete, "chat-administration/reserved-name/:id", a.deleteReservedName, nil),
		routes.RegisterRoute(http.MethodGet, "chat-administration/saylinks", a.listSaylinks, nil),
		routes.RegisterRoute(http.MethodPut, "chat-administration/saylink", a.createSaylink, nil),
		routes.RegisterRoute(http.MethodPatch, "chat-administration/saylink/:id", a.updateSaylink, nil),
		routes.RegisterRoute(http.MethodDelete, "chat-administration/saylink/:id", a.deleteSaylink, nil),
		routes.RegisterRoute(http.MethodGet, "chat-administration/owners", a.lookupOwners, nil),
	}
}

func (a *ChatAdministrationController) getSummary(c echo.Context) error {
	summary, err := loadChatAdministrationSummary(a.db.Get(models.Chatchannel{}, c))
	if err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	return c.JSON(http.StatusOK, summary)
}

func (a *ChatAdministrationController) listChannels(c echo.Context) error {
	db := a.db.Get(models.Chatchannel{}, c)
	page, limit := operationalEditorPagination(c)
	base := db.Table("chatchannels cc")
	search := strings.TrimSpace(c.QueryParam("q"))
	if search != "" {
		like := "%" + search + "%"
		base = base.Where("cc.name LIKE ? OR cc.owner LIKE ? OR CAST(cc.id AS CHAR) LIKE ?", like, like, like)
	}
	switch strings.TrimSpace(c.QueryParam("filter")) {
	case "secured":
		base = base.Where("cc.password <> ''")
	case "open":
		base = base.Where("cc.password = ''")
	case "system":
		base = base.Where("cc.owner = '*System*'")
	case "player":
		base = base.Where("cc.owner <> '*System*'")
	case "staff":
		base = base.Where("cc.minstatus > 0")
	}
	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	records := make([]chatChannelRecord, 0)
	if err := base.Session(&gorm.Session{}).Select(`
		cc.id, cc.name, cc.owner, cc.minstatus, (cc.password <> '') AS has_password,
		COALESCE((SELECT ch.id FROM character_data ch WHERE ch.name = cc.owner LIMIT 1), 0) AS owner_character_id,
		EXISTS(SELECT 1 FROM character_data ch WHERE ch.name = cc.owner) AS owner_exists
	`).Order("cc.name").Limit(limit).Offset((page - 1) * limit).Scan(&records).Error; err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	for index := range records {
		records[index].SystemOwned = records[index].Owner == "*System*"
	}
	summary, err := loadChatAdministrationSummary(db)
	if err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	return c.JSON(http.StatusOK, chatAdministrationPage{
		Data: records, Total: total, Page: page, Limit: limit, Summary: summary,
	})
}

func (a *ChatAdministrationController) getChannel(c echo.Context) error {
	id, err := chatAdministrationPositiveID(c, "id", "Chat channel")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	record, err := loadChatChannelRecord(a.db.Get(models.Chatchannel{}, c), id)
	if err != nil {
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	return c.JSON(http.StatusOK, record)
}

func (a *ChatAdministrationController) createChannel(c echo.Context) error {
	var request chatChannelMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid chat channel payload"})
	}
	if err := validateChatChannelInput(request.Channel, true); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.Chatchannel{}, c)
	payload := chatChannelAuditPayload("create", request.Channel, nil)
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventChannelCreate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Chat channel", err)
	}
	var createdID int
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := ensureChatChannelNameAvailable(tx, request.Channel.Name, 0); err != nil {
			return err
		}
		if err := ensureChatChannelNameNotReserved(tx, request.Channel.Name); err != nil {
			return err
		}
		row := map[string]interface{}{
			"name": strings.TrimSpace(request.Channel.Name), "owner": normalizedChatOwner(request.Channel.Owner),
			"minstatus": request.Channel.MinStatus, "password": request.Channel.Password,
		}
		if err := tx.Table("chatchannels").Create(row).Error; err != nil {
			return err
		}
		return tx.Raw("SELECT LAST_INSERT_ID()").Scan(&createdID).Error
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	record, err := loadChatChannelRecord(db, createdID)
	if err != nil {
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"channel": record, "audit_id": auditID})
}

func (a *ChatAdministrationController) updateChannel(c echo.Context) error {
	id, err := chatAdministrationPositiveID(c, "id", "Chat channel")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request chatChannelMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid chat channel payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original chat channel snapshot is required"})
	}
	if err := validateChatChannelInput(request.Channel, false); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.Chatchannel{}, c)
	before, err := loadChatChannelRaw(db, id, false)
	if err != nil {
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	beforeSnapshot := chatChannelSnapshotFromRaw(before)
	payload := chatChannelAuditPayload("update", request.Channel, &beforeSnapshot)
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventChannelUpdate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Chat channel", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		locked, err := loadChatChannelRaw(tx, id, true)
		if err != nil {
			return err
		}
		if chatChannelSnapshotFromRaw(locked) != *request.Expected {
			return operationalEditorConflict("This chat channel changed after it was loaded. Refresh it before saving.")
		}
		if err := ensureChatChannelNameAvailable(tx, request.Channel.Name, id); err != nil {
			return err
		}
		if !strings.EqualFold(strings.TrimSpace(request.Channel.Name), locked.Name) {
			if err := ensureChatChannelNameNotReserved(tx, request.Channel.Name); err != nil {
				return err
			}
		}
		values := map[string]interface{}{
			"name":      strings.TrimSpace(request.Channel.Name),
			"owner":     normalizedChatOwner(request.Channel.Owner),
			"minstatus": request.Channel.MinStatus,
		}
		switch request.Channel.PasswordMode {
		case "replace":
			values["password"] = request.Channel.Password
		case "clear":
			values["password"] = ""
		}
		result := tx.Table("chatchannels").Where("id = ?", id).Updates(values)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	record, err := loadChatChannelRecord(db, id)
	if err != nil {
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"channel": record, "audit_id": auditID})
}

func (a *ChatAdministrationController) deleteChannel(c echo.Context) error {
	id, err := chatAdministrationPositiveID(c, "id", "Chat channel")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request chatChannelMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid chat channel deletion payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original chat channel snapshot is required"})
	}
	if !request.Confirm {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Confirm chat channel deletion before continuing"})
	}
	if err := validateOperationalEditorReason(request.Channel.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.Chatchannel{}, c)
	before, err := loadChatChannelRaw(db, id, false)
	if err != nil {
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	if before.Owner == "*System*" && !request.AllowSystemChannel {
		return c.JSON(http.StatusConflict, echo.Map{
			"error": "System-owned channels need explicit system-channel removal approval.",
		})
	}
	beforeSnapshot := chatChannelSnapshotFromRaw(before)
	payload := chatChannelAuditPayload("delete", request.Channel, &beforeSnapshot)
	payload["deleted_name"] = before.Name
	payload["deleted_owner"] = before.Owner
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventChannelDelete, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Chat channel", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		locked, err := loadChatChannelRaw(tx, id, true)
		if err != nil {
			return err
		}
		if chatChannelSnapshotFromRaw(locked) != *request.Expected {
			return operationalEditorConflict("This chat channel changed after it was loaded. Refresh it before deleting.")
		}
		result := tx.Table("chatchannels").Where("id = ?", id).Delete(nil)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Chat channel", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted_id": id, "audit_id": auditID})
}

func (a *ChatAdministrationController) listReservedNames(c echo.Context) error {
	db := a.db.Get(models.ChatchannelReservedName{}, c)
	page, limit := operationalEditorPagination(c)
	base := db.Table("chatchannel_reserved_names rn")
	search := strings.TrimSpace(c.QueryParam("q"))
	if search != "" {
		like := "%" + search + "%"
		base = base.Where("rn.name LIKE ? OR CAST(rn.id AS CHAR) LIKE ?", like, like)
	}
	if c.QueryParam("filter") == "active" {
		base = base.Where("EXISTS (SELECT 1 FROM chatchannels cc WHERE cc.name = rn.name)")
	}
	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	records := make([]chatReservedNameRecord, 0)
	if err := base.Session(&gorm.Session{}).Select(`
		rn.id, rn.name,
		(SELECT COUNT(*) FROM chatchannels cc WHERE cc.name = rn.name) AS active_channel_count
	`).Order("rn.name").Limit(limit).Offset((page - 1) * limit).Scan(&records).Error; err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	summary, err := loadChatAdministrationSummary(db)
	if err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	return c.JSON(http.StatusOK, chatAdministrationPage{
		Data: records, Total: total, Page: page, Limit: limit, Summary: summary,
	})
}

func (a *ChatAdministrationController) createReservedName(c echo.Context) error {
	var request chatReservedNameMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid reserved-name payload"})
	}
	if err := validateReservedNameInput(request.Reserved); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.ChatchannelReservedName{}, c)
	payload := map[string]interface{}{
		"action": "create", "name": strings.TrimSpace(request.Reserved.Name),
		"reason": strings.TrimSpace(request.Reserved.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventReserveCreate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Reserved chat name", err)
	}
	var createdID int
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := ensureReservedNameAvailable(tx, request.Reserved.Name, 0); err != nil {
			return err
		}
		if err := tx.Table("chatchannel_reserved_names").
			Create(map[string]interface{}{"name": strings.TrimSpace(request.Reserved.Name)}).Error; err != nil {
			return err
		}
		return tx.Raw("SELECT LAST_INSERT_ID()").Scan(&createdID).Error
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Reserved chat name", err)
	}
	record, err := loadReservedNameRecord(db, createdID)
	if err != nil {
		return operationalEditorMutationError(c, "Reserved chat name", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"reserved": record, "audit_id": auditID})
}

func (a *ChatAdministrationController) updateReservedName(c echo.Context) error {
	id, err := chatAdministrationPositiveID(c, "id", "Reserved name")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request chatReservedNameMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid reserved-name payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original reserved-name snapshot is required"})
	}
	if err := validateReservedNameInput(request.Reserved); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.ChatchannelReservedName{}, c)
	payload := map[string]interface{}{
		"action": "update", "reserved_id": id, "name": strings.TrimSpace(request.Reserved.Name),
		"previous_name": request.Expected.Name, "reason": strings.TrimSpace(request.Reserved.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventReserveUpdate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Reserved chat name", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		var locked chatReservedNameSnapshot
		if err := tx.Table("chatchannel_reserved_names").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("name").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		if locked != *request.Expected {
			return operationalEditorConflict("This reserved name changed after it was loaded. Refresh it before saving.")
		}
		if err := ensureReservedNameAvailable(tx, request.Reserved.Name, id); err != nil {
			return err
		}
		result := tx.Table("chatchannel_reserved_names").Where("id = ?", id).
			Update("name", strings.TrimSpace(request.Reserved.Name))
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Reserved chat name", err)
	}
	record, err := loadReservedNameRecord(db, id)
	if err != nil {
		return operationalEditorMutationError(c, "Reserved chat name", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"reserved": record, "audit_id": auditID})
}

func (a *ChatAdministrationController) deleteReservedName(c echo.Context) error {
	id, err := chatAdministrationPositiveID(c, "id", "Reserved name")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request chatReservedNameMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid reserved-name deletion payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original reserved-name snapshot is required"})
	}
	if !request.Confirm {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Confirm reserved-name deletion before continuing"})
	}
	if err := validateOperationalEditorReason(request.Reserved.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.ChatchannelReservedName{}, c)
	payload := map[string]interface{}{
		"action": "delete", "reserved_id": id, "name": request.Expected.Name,
		"reason": strings.TrimSpace(request.Reserved.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventReserveDelete, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Reserved chat name", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		var locked chatReservedNameSnapshot
		if err := tx.Table("chatchannel_reserved_names").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("name").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		if locked != *request.Expected {
			return operationalEditorConflict("This reserved name changed after it was loaded. Refresh it before deleting.")
		}
		result := tx.Table("chatchannel_reserved_names").Where("id = ?", id).Delete(nil)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Reserved chat name", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted_id": id, "audit_id": auditID})
}

func (a *ChatAdministrationController) listSaylinks(c echo.Context) error {
	db := a.db.Get(models.Saylink{}, c)
	page, limit := operationalEditorPagination(c)
	base := db.Table("saylink sl")
	search := strings.TrimSpace(c.QueryParam("q"))
	if search != "" {
		like := "%" + search + "%"
		base = base.Where("sl.phrase LIKE ? OR CAST(sl.id AS CHAR) LIKE ?", like, like)
	}
	if c.QueryParam("filter") == "duplicates" {
		base = base.Where("(SELECT COUNT(*) FROM saylink other WHERE other.phrase = sl.phrase) > 1")
	}
	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	records := make([]chatSaylinkRecord, 0)
	if err := base.Session(&gorm.Session{}).Select(`
		sl.id, sl.phrase,
		GREATEST((SELECT COUNT(*) FROM saylink other WHERE other.phrase = sl.phrase) - 1, 0) AS duplicate_count
	`).Order("sl.phrase, sl.id").Limit(limit).Offset((page - 1) * limit).Scan(&records).Error; err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	summary, err := loadChatAdministrationSummary(db)
	if err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	return c.JSON(http.StatusOK, chatAdministrationPage{
		Data: records, Total: total, Page: page, Limit: limit, Summary: summary,
	})
}

func (a *ChatAdministrationController) createSaylink(c echo.Context) error {
	var request chatSaylinkMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid saylink payload"})
	}
	if err := validateSaylinkInput(request.Saylink); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.Saylink{}, c)
	payload := map[string]interface{}{
		"action": "create", "phrase": request.Saylink.Phrase,
		"reason": strings.TrimSpace(request.Saylink.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventSaylinkCreate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Saylink phrase", err)
	}
	var createdID int
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Table("saylink").
			Create(map[string]interface{}{"phrase": strings.TrimSpace(request.Saylink.Phrase)}).Error; err != nil {
			return err
		}
		return tx.Raw("SELECT LAST_INSERT_ID()").Scan(&createdID).Error
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Saylink phrase", err)
	}
	record, err := loadSaylinkRecord(db, createdID)
	if err != nil {
		return operationalEditorMutationError(c, "Saylink phrase", err)
	}
	return c.JSON(http.StatusCreated, echo.Map{"saylink": record, "audit_id": auditID})
}

func (a *ChatAdministrationController) updateSaylink(c echo.Context) error {
	id, err := chatAdministrationPositiveID(c, "id", "Saylink")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request chatSaylinkMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid saylink payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original saylink snapshot is required"})
	}
	if err := validateSaylinkInput(request.Saylink); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.Saylink{}, c)
	payload := map[string]interface{}{
		"action": "update", "saylink_id": id, "phrase": strings.TrimSpace(request.Saylink.Phrase),
		"previous_phrase": request.Expected.Phrase, "reason": strings.TrimSpace(request.Saylink.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventSaylinkUpdate, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Saylink phrase", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		var locked chatSaylinkSnapshot
		if err := tx.Table("saylink").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("phrase").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		if locked != *request.Expected {
			return operationalEditorConflict("This saylink changed after it was loaded. Refresh it before saving.")
		}
		result := tx.Table("saylink").Where("id = ?", id).
			Update("phrase", strings.TrimSpace(request.Saylink.Phrase))
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Saylink phrase", err)
	}
	record, err := loadSaylinkRecord(db, id)
	if err != nil {
		return operationalEditorMutationError(c, "Saylink phrase", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"saylink": record, "audit_id": auditID})
}

func (a *ChatAdministrationController) deleteSaylink(c echo.Context) error {
	id, err := chatAdministrationPositiveID(c, "id", "Saylink")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	var request chatSaylinkMutationRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid saylink deletion payload"})
	}
	if request.Expected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The original saylink snapshot is required"})
	}
	if !request.Confirm {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Confirm saylink deletion before continuing"})
	}
	if err := validateOperationalEditorReason(request.Saylink.Reason); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.Saylink{}, c)
	payload := map[string]interface{}{
		"action": "delete", "saylink_id": id, "phrase": request.Expected.Phrase,
		"reason": strings.TrimSpace(request.Saylink.Reason),
	}
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, chatAdminEventSaylinkDelete, payload)
	if err != nil {
		return operationalEditorAuditError(c, "Saylink phrase", err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		var locked chatSaylinkSnapshot
		if err := tx.Table("saylink").Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("phrase").Where("id = ?", id).Take(&locked).Error; err != nil {
			return err
		}
		if locked != *request.Expected {
			return operationalEditorConflict("This saylink changed after it was loaded. Refresh it before deleting.")
		}
		result := tx.Table("saylink").Where("id = ?", id).Delete(nil)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return operationalEditorMutationError(c, "Saylink phrase", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"deleted_id": id, "audit_id": auditID})
}

func (a *ChatAdministrationController) lookupOwners(c echo.Context) error {
	db := a.db.Get(models.Chatchannel{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	like := "%" + search + "%"
	results := make([]operationalEditorLookup, 0)
	if err := db.Table("character_data ch").
		Joins("LEFT JOIN account a ON a.id = ch.account_id").
		Select("ch.id, ch.name, CONCAT('Account ', COALESCE(NULLIF(a.name, ''), CONCAT('#', ch.account_id))) AS context").
		Where("ch.name LIKE ? OR a.name LIKE ? OR CAST(ch.id AS CHAR) LIKE ?", like, like, like).
		Order("ch.name").Limit(20).Scan(&results).Error; err != nil {
		return operationalEditorDatabaseError(c, "Chat Administration", err)
	}
	return c.JSON(http.StatusOK, echo.Map{"data": results})
}

func loadChatAdministrationSummary(db *gorm.DB) (chatAdministrationSummary, error) {
	var summary chatAdministrationSummary
	if err := db.Table("chatchannels").Select(`
		COUNT(*) AS channels,
		COALESCE(SUM(password <> ''), 0) AS secured,
		COALESCE(SUM(owner = '*System*'), 0) AS system_owned
	`).Scan(&summary).Error; err != nil {
		return summary, err
	}
	if err := db.Table("chatchannel_reserved_names").Count(&summary.ReservedNames).Error; err != nil {
		return summary, err
	}
	if err := db.Table("saylink").Count(&summary.Saylinks).Error; err != nil {
		return summary, err
	}
	return summary, nil
}

func loadChatChannelRaw(db *gorm.DB, id int, lock bool) (chatChannelRaw, error) {
	var raw chatChannelRaw
	query := db.Table("chatchannels").Where("id = ?", id)
	if lock {
		query = query.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := query.Take(&raw).Error
	return raw, err
}

func loadChatChannelRecord(db *gorm.DB, id int) (chatChannelRecord, error) {
	var record chatChannelRecord
	err := db.Table("chatchannels cc").Select(`
		cc.id, cc.name, cc.owner, cc.minstatus, (cc.password <> '') AS has_password,
		COALESCE((SELECT ch.id FROM character_data ch WHERE ch.name = cc.owner LIMIT 1), 0) AS owner_character_id,
		EXISTS(SELECT 1 FROM character_data ch WHERE ch.name = cc.owner) AS owner_exists
	`).Where("cc.id = ?", id).Take(&record).Error
	record.SystemOwned = record.Owner == "*System*"
	return record, err
}

func loadReservedNameRecord(db *gorm.DB, id int) (chatReservedNameRecord, error) {
	var record chatReservedNameRecord
	err := db.Table("chatchannel_reserved_names rn").Select(`
		rn.id, rn.name,
		(SELECT COUNT(*) FROM chatchannels cc WHERE cc.name = rn.name) AS active_channel_count
	`).Where("rn.id = ?", id).Take(&record).Error
	return record, err
}

func loadSaylinkRecord(db *gorm.DB, id int) (chatSaylinkRecord, error) {
	var record chatSaylinkRecord
	err := db.Table("saylink sl").Select(`
		sl.id, sl.phrase,
		GREATEST((SELECT COUNT(*) FROM saylink other WHERE other.phrase = sl.phrase) - 1, 0) AS duplicate_count
	`).Where("sl.id = ?", id).Take(&record).Error
	return record, err
}

func chatChannelSnapshotFromRaw(raw chatChannelRaw) chatChannelSnapshot {
	return chatChannelSnapshot{
		Name: raw.Name, Owner: raw.Owner, MinStatus: raw.MinStatus, HasPassword: raw.Password != "",
	}
}

func validateChatChannelInput(input chatChannelInput, creating bool) error {
	if err := validateOperationalEditorReason(input.Reason); err != nil {
		return err
	}
	if strings.TrimSpace(input.Name) == "" {
		return errors.New("Channel name is required")
	}
	if len(strings.TrimSpace(input.Name)) > 64 {
		return errors.New("Channel name must be 64 characters or fewer")
	}
	if len(normalizedChatOwner(input.Owner)) > 64 {
		return errors.New("Channel owner must be 64 characters or fewer")
	}
	if input.MinStatus < -2 || input.MinStatus > 250 {
		return errors.New("Minimum status must be between -2 and 250")
	}
	if len(input.Password) > 64 {
		return errors.New("Channel password must be 64 characters or fewer")
	}
	if creating {
		return nil
	}
	switch input.PasswordMode {
	case "", "keep", "clear":
		return nil
	case "replace":
		if input.Password == "" {
			return errors.New("Enter the replacement channel password")
		}
		return nil
	default:
		return errors.New("Unknown channel password action")
	}
}

func validateReservedNameInput(input chatReservedNameInput) error {
	if err := validateOperationalEditorReason(input.Reason); err != nil {
		return err
	}
	if strings.TrimSpace(input.Name) == "" {
		return errors.New("Reserved channel name is required")
	}
	if len(strings.TrimSpace(input.Name)) > 64 {
		return errors.New("Reserved channel name must be 64 characters or fewer")
	}
	return nil
}

func validateSaylinkInput(input chatSaylinkInput) error {
	if err := validateOperationalEditorReason(input.Reason); err != nil {
		return err
	}
	if strings.TrimSpace(input.Phrase) == "" {
		return errors.New("Saylink phrase is required")
	}
	if len(strings.TrimSpace(input.Phrase)) > 64 {
		return errors.New("Saylink phrase must be 64 characters or fewer")
	}
	return nil
}

func normalizedChatOwner(owner string) string {
	owner = strings.TrimSpace(owner)
	if owner == "" {
		return "*System*"
	}
	return owner
}

func ensureChatChannelNameAvailable(db *gorm.DB, name string, excludeID int) error {
	var count int64
	query := db.Table("chatchannels").Where("name = ?", strings.TrimSpace(name))
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return operationalEditorConflict("A chat channel already uses this name")
	}
	return nil
}

func ensureChatChannelNameNotReserved(db *gorm.DB, name string) error {
	var count int64
	if err := db.Table("chatchannel_reserved_names").
		Where("name = ?", strings.TrimSpace(name)).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return operationalEditorConflict("This name is reserved and cannot be used for a new chat channel")
	}
	return nil
}

func ensureReservedNameAvailable(db *gorm.DB, name string, excludeID int) error {
	var count int64
	query := db.Table("chatchannel_reserved_names").Where("name = ?", strings.TrimSpace(name))
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return operationalEditorConflict("This chat channel name is already reserved")
	}
	return nil
}

func chatAdministrationPositiveID(c echo.Context, parameter string, label string) (int, error) {
	id, err := operationalEditorPositiveID(c, parameter, label+" ID")
	if err != nil {
		return 0, err
	}
	if id > uint64(^uint(0)>>1) {
		return 0, fmt.Errorf("%s ID is outside the supported range", label)
	}
	return int(id), nil
}

func chatChannelAuditPayload(action string, input chatChannelInput, before *chatChannelSnapshot) map[string]interface{} {
	payload := map[string]interface{}{
		"action": action, "channel_id": input.ID, "name": strings.TrimSpace(input.Name),
		"owner": normalizedChatOwner(input.Owner), "minstatus": input.MinStatus,
		"password_action": input.PasswordMode, "reason": strings.TrimSpace(input.Reason),
	}
	if before != nil {
		payload["previous"] = before
	}
	return payload
}
