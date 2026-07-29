package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

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
