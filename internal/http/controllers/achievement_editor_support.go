package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

const achievementEditorMinimumReasonLength = 8

// achievementEditorContentModel is a resolver sentinel. Achievement content
// belongs to eqemu_content, while durable character state belongs to the
// default EQEmu database. It deliberately is not a generated database model.
type achievementEditorContentModel struct{}

func (achievementEditorContentModel) TableName() string       { return "achievements" }
func (achievementEditorContentModel) Relationships() []string { return []string{} }
func (achievementEditorContentModel) Connection() string      { return "eqemu_content" }

type achievementEditorHTTPError struct {
	status  int
	message string
	field   string
	details interface{}
}

func (e achievementEditorHTTPError) Error() string { return e.message }

func achievementEditorRequestError(status int, message string) error {
	return achievementEditorHTTPError{status: status, message: message}
}

func achievementEditorFieldError(status int, field string, message string, details interface{}) error {
	return achievementEditorHTTPError{status: status, field: field, message: message, details: details}
}

func (a *AchievementEditorController) contentDB(c echo.Context) *gorm.DB {
	return a.db.Get(achievementEditorContentModel{}, c)
}

func (a *AchievementEditorController) characterDB(c echo.Context) *gorm.DB {
	return a.db.Get(models.CharacterDatum{}, c)
}

func achievementEditorPagination(c echo.Context, maximum int) (int, int) {
	page := 1
	limit := achievementEditorDefaultLimit
	if parsed, err := strconv.Atoi(c.QueryParam("page")); err == nil && parsed > 0 {
		page = parsed
	}
	if page > achievementEditorMaximumPage {
		page = achievementEditorMaximumPage
	}
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if maximum <= 0 || maximum > achievementEditorMaximumLimit {
		maximum = achievementEditorMaximumLimit
	}
	if limit > maximum {
		limit = maximum
	}
	return page, limit
}

func achievementEditorParamID(c echo.Context, name string, label string) (uint32, error) {
	value, err := strconv.ParseUint(strings.TrimSpace(c.Param(name)), 10, 32)
	if err != nil || value == 0 {
		return 0, fmt.Errorf("%s must be a positive unsigned 32-bit ID", label)
	}
	return uint32(value), nil
}

func validateAchievementEditorReason(reason string) error {
	reason = strings.TrimSpace(reason)
	length := utf8.RuneCountInString(reason)
	if length < achievementEditorMinimumReasonLength {
		return fmt.Errorf("Audit reason must contain at least %d characters", achievementEditorMinimumReasonLength)
	}
	if length > operationalEditorReasonMaxLength {
		return fmt.Errorf("Audit reason must be %d characters or fewer", operationalEditorReasonMaxLength)
	}
	return nil
}

func achievementEditorConfirmation(actual string, expected string) error {
	if strings.TrimSpace(actual) != expected {
		return fmt.Errorf("Type %q exactly to confirm this operation", expected)
	}
	return nil
}

func achievementEditorRespondError(c echo.Context, label string, err error) error {
	var validationError achievementEditorValidationFailure
	if errors.As(err, &validationError) {
		return achievementEditorValidationResponse(c, validationError.result)
	}
	var requestError achievementEditorHTTPError
	if errors.As(err, &requestError) {
		payload := echo.Map{"error": requestError.message}
		if requestError.field != "" {
			payload["field"] = requestError.field
		}
		if requestError.details != nil {
			payload["details"] = requestError.details
		}
		return c.JSON(requestError.status, payload)
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": label + " was not found"})
	}
	var conflict operationalEditorConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	if strings.Contains(strings.ToLower(err.Error()), "duplicate entry") {
		return c.JSON(http.StatusConflict, echo.Map{"error": label + " already exists with the same identity"})
	}
	return operationalEditorDatabaseError(c, label, err)
}

func achievementEditorIntQuery(c echo.Context, name string, minimum int, maximum int) (int, bool) {
	value := strings.TrimSpace(c.QueryParam(name))
	if value == "" {
		return 0, false
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < minimum || parsed > maximum {
		return 0, false
	}
	return parsed, true
}

func boolToTinyInt(value bool) uint8 {
	if value {
		return 1
	}
	return 0
}
