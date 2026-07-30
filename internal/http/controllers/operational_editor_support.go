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
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

const (
	operationalEditorDefaultPageSize = 40
	operationalEditorMaxPageSize     = 100
	operationalEditorReasonMaxLength = 240
)

type operationalEditorConflictError struct {
	message string
}

type operationalEditorAuditEntry struct {
	ID        uint                   `json:"id" gorm:"column:id"`
	UserID    uint                   `json:"user_id" gorm:"column:user_id"`
	UserName  string                 `json:"user_name" gorm:"column:user_name"`
	EventName string                 `json:"event_name" gorm:"column:event_name"`
	CreatedAt time.Time              `json:"created_at" gorm:"column:created_at"`
	Data      map[string]interface{} `json:"data" gorm:"-"`
	RawData   string                 `json:"-" gorm:"column:data"`
}

type operationalEditorAuditPage struct {
	Data  []operationalEditorAuditEntry `json:"data"`
	Total int64                         `json:"total"`
	Page  int                           `json:"page"`
	Limit int                           `json:"limit"`
}

func (e operationalEditorConflictError) Error() string {
	return e.message
}

func operationalEditorConflict(format string, args ...interface{}) error {
	return operationalEditorConflictError{message: fmt.Sprintf(format, args...)}
}

func operationalEditorPagination(c echo.Context) (int, int) {
	page := 1
	limit := operationalEditorDefaultPageSize
	if parsed, err := strconv.Atoi(c.QueryParam("page")); err == nil && parsed > 0 {
		page = parsed
	}
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if limit > operationalEditorMaxPageSize {
		limit = operationalEditorMaxPageSize
	}
	return page, limit
}

func validateOperationalEditorReason(reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return errors.New("Audit reason is required")
	}
	if len(reason) > operationalEditorReasonMaxLength {
		return fmt.Errorf("Audit reason must be %d characters or fewer", operationalEditorReasonMaxLength)
	}
	return nil
}

func operationalEditorTableExists(db *gorm.DB, table string) bool {
	var count int64
	err := db.Raw(
		"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
		table,
	).Scan(&count).Error
	return err == nil && count > 0
}

func operationalEditorColumnExists(db *gorm.DB, table string, column string) bool {
	var count int64
	err := db.Raw(
		"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
		table,
		column,
	).Scan(&count).Error
	return err == nil && count > 0
}

func writeOperationalEditorAudit(
	c echo.Context,
	auditLog *auditlog.UserEvent,
	eventName string,
	payload interface{},
) (uint, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return 0, err
	}
	id, err := auditLog.LogEditorEvent(c, eventName, string(data))
	if err != nil {
		return 0, fmt.Errorf("could not persist the required audit record: %w", err)
	}
	if id == 0 {
		return 0, errors.New("could not persist the required audit record")
	}
	return id, nil
}

func discardOperationalEditorAudit(db *database.Resolver, id uint) {
	if id == 0 || db.GetSpireDb() == nil {
		return
	}
	_ = db.GetSpireDb().
		Table("spire_user_event_log").
		Where("id = ?", id).
		Delete(nil).Error
}

func enrichOperationalEditorAudit(
	db *database.Resolver,
	id uint,
	payload map[string]interface{},
) {
	if id == 0 || db.GetSpireDb() == nil {
		return
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	_ = db.GetSpireDb().
		Table("spire_user_event_log").
		Where("id = ?", id).
		Update("data", string(data)).Error
}

func listOperationalEditorAudit(
	c echo.Context,
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
	eventNames []string,
	identityClause string,
	identityArgs ...interface{},
) error {
	if db.GetSpireDb() == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "Spire audit database is unavailable"})
	}
	page, limit := operationalEditorPagination(c)
	if limit > 25 {
		limit = 25
	}
	query := db.GetSpireDb().Table("spire_user_event_log logs").
		Joins("LEFT JOIN spire_users users ON users.id = logs.user_id").
		Where("logs.server_database_connection_id = ?", auditLog.ActiveConnectionID(c)).
		Where("logs.event_name IN ?", eventNames).
		Where("JSON_VALID(logs.data) = 1").
		Where(identityClause, identityArgs...)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return operationalEditorDatabaseError(c, "Editor audit history", err)
	}
	rows := make([]operationalEditorAuditEntry, 0)
	if err := query.Select(`
		logs.id,
		logs.user_id,
		COALESCE(NULLIF(users.user_name, ''), NULLIF(users.full_name, ''), CONCAT('User ', logs.user_id)) AS user_name,
		logs.event_name,
		logs.created_at,
		logs.data
	`).Order("logs.id DESC").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
		return operationalEditorDatabaseError(c, "Editor audit history", err)
	}
	for index := range rows {
		rows[index].Data = make(map[string]interface{})
		if err := json.Unmarshal([]byte(rows[index].RawData), &rows[index].Data); err != nil {
			rows[index].Data["raw"] = rows[index].RawData
		}
	}
	return c.JSON(http.StatusOK, operationalEditorAuditPage{
		Data: rows, Total: total, Page: page, Limit: limit,
	})
}

func operationalEditorAuditError(c echo.Context, label string, err error) error {
	return c.JSON(
		http.StatusInternalServerError,
		echo.Map{"error": fmt.Sprintf("%s could not preserve the required audit record: %v", label, err)},
	)
}

func operationalEditorMutationError(c echo.Context, label string, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": fmt.Sprintf("%s was not found", label)})
	}
	var conflict operationalEditorConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	if strings.Contains(strings.ToLower(err.Error()), "duplicate entry") {
		return c.JSON(http.StatusConflict, echo.Map{"error": fmt.Sprintf("%s already exists with the same identity", label)})
	}
	return operationalEditorDatabaseError(c, label, err)
}

func operationalEditorDatabaseError(c echo.Context, label string, err error) error {
	return c.JSON(
		http.StatusInternalServerError,
		echo.Map{"error": fmt.Sprintf("%s database error: %v", label, err)},
	)
}

func operationalEditorPositiveID(c echo.Context, parameter string, label string) (uint64, error) {
	id, err := strconv.ParseUint(c.Param(parameter), 10, 64)
	if err != nil || id == 0 {
		return 0, fmt.Errorf("%s must be a positive number", label)
	}
	return id, nil
}
