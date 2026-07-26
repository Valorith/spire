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
	alternateCurrencyEditorDefaultPageSize = 30
	alternateCurrencyEditorMaxPageSize     = 100
	alternateCurrencyEditorSampleLimit     = 8
	alternateCurrencyReasonMinLength       = 8
	alternateCurrencyReasonMaxLength       = 240

	alternateCurrencyEventCreate        = "ALTERNATE_CURRENCY_CREATE"
	alternateCurrencyEventUpdate        = "ALTERNATE_CURRENCY_UPDATE"
	alternateCurrencyEventDelete        = "ALTERNATE_CURRENCY_DELETE"
	alternateCurrencyEventResolveDelete = "ALTERNATE_CURRENCY_RESOLVE_DELETE"
	alternateCurrencyEventBalanceAdjust = "ALTERNATE_CURRENCY_BALANCE_ADJUST"
)

type AlternateCurrencyEditorController struct {
	db       *database.Resolver
	auditLog *auditlog.UserEvent
}

type alternateCurrencyEditorPage struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

type alternateCurrencyItem struct {
	ID                 int    `json:"id"`
	Name               string `json:"name"`
	Icon               int    `json:"icon"`
	AssignedCurrencyID int    `json:"assigned_currency_id,omitempty"`
}

type alternateCurrencyEditorSummary struct {
	ID           int    `json:"id"`
	ItemID       int    `json:"item_id"`
	ItemName     string `json:"item_name"`
	ItemIcon     int    `json:"item_icon"`
	NpcCount     int64  `json:"npc_count"`
	TaskCount    int64  `json:"task_count"`
	BalanceCount int64  `json:"balance_count"`
}

type alternateCurrencyEditorInput struct {
	ID     int `json:"id"`
	ItemID int `json:"item_id"`
}

type alternateCurrencyNpcUsage struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Level uint8  `json:"level"`
	Race  uint16 `json:"race"`
	Class uint8  `json:"class"`
}

type alternateCurrencyTaskUsage struct {
	ID           int    `json:"id"`
	Title        string `json:"title"`
	RewardPoints int    `json:"reward_points"`
}

type alternateCurrencyBalanceUsage struct {
	CharacterID   int    `json:"character_id"`
	CharacterName string `json:"character_name"`
	Level         int    `json:"level"`
	Class         int    `json:"class"`
	Amount        uint64 `json:"amount"`
}

type alternateCurrencyUsage struct {
	NpcCount       int64                           `json:"npc_count"`
	TaskCount      int64                           `json:"task_count"`
	BalanceCount   int64                           `json:"balance_count"`
	TotalBalance   uint64                          `json:"total_balance"`
	NpcSamples     []alternateCurrencyNpcUsage     `json:"npc_samples"`
	TaskSamples    []alternateCurrencyTaskUsage    `json:"task_samples"`
	BalanceSamples []alternateCurrencyBalanceUsage `json:"balance_samples"`
}

func (u alternateCurrencyUsage) ReferenceCount() int64 {
	return u.NpcCount + u.TaskCount + u.BalanceCount
}

type alternateCurrencyEditorDetail struct {
	Currency alternateCurrencyEditorInput `json:"currency"`
	Item     alternateCurrencyItem        `json:"item"`
	Usage    alternateCurrencyUsage       `json:"usage"`
}

type alternateCurrencyResolveRequest struct {
	Mode           string `json:"mode"`
	TargetID       int    `json:"target_id"`
	DeleteBalances bool   `json:"delete_balances"`
	Reason         string `json:"reason"`
}

type alternateCurrencyResolveResult struct {
	DeletedID       int    `json:"deleted_id"`
	Mode            string `json:"mode"`
	ReplacementID   int    `json:"replacement_id,omitempty"`
	NpcsUpdated     int64  `json:"npcs_updated"`
	TasksUpdated    int64  `json:"tasks_updated"`
	BalancesMoved   int64  `json:"balances_moved"`
	BalancesDeleted int64  `json:"balances_deleted"`
	AuditID         uint   `json:"audit_id"`
}

type alternateCurrencyBalanceRequest struct {
	CharacterID    int     `json:"character_id"`
	Operation      string  `json:"operation"`
	Amount         int64   `json:"amount"`
	ExpectedAmount *uint64 `json:"expected_amount"`
	Reason         string  `json:"reason"`
}

type alternateCurrencyBalanceResult struct {
	CharacterID   int    `json:"character_id"`
	CharacterName string `json:"character_name"`
	CurrencyID    int    `json:"currency_id"`
	Before        uint64 `json:"before"`
	After         uint64 `json:"after"`
	Operation     string `json:"operation"`
	AuditID       uint   `json:"audit_id"`
}

type alternateCurrencyAuditEntry struct {
	ID        uint                   `json:"id"`
	UserID    uint                   `json:"user_id"`
	UserName  string                 `json:"user_name"`
	EventName string                 `json:"event_name"`
	CreatedAt time.Time              `json:"created_at"`
	Data      map[string]interface{} `json:"data"`
}

type alternateCurrencyAuditRow struct {
	ID        uint      `gorm:"column:id"`
	UserID    uint      `gorm:"column:user_id"`
	UserName  string    `gorm:"column:user_name"`
	EventName string    `gorm:"column:event_name"`
	CreatedAt time.Time `gorm:"column:created_at"`
	RawData   string    `gorm:"column:data"`
}

type alternateCurrencyAuditPayload struct {
	Action          string `json:"action"`
	CurrencyID      int    `json:"currency_id"`
	ItemID          int    `json:"item_id,omitempty"`
	PreviousItemID  int    `json:"previous_item_id,omitempty"`
	CharacterID     int    `json:"character_id,omitempty"`
	CharacterName   string `json:"character_name,omitempty"`
	Operation       string `json:"operation,omitempty"`
	Before          uint64 `json:"before,omitempty"`
	After           uint64 `json:"after,omitempty"`
	Reason          string `json:"reason,omitempty"`
	ReplacementID   int    `json:"replacement_id,omitempty"`
	NpcsUpdated     int64  `json:"npcs_updated,omitempty"`
	TasksUpdated    int64  `json:"tasks_updated,omitempty"`
	BalancesMoved   int64  `json:"balances_moved,omitempty"`
	BalancesDeleted int64  `json:"balances_deleted,omitempty"`
}

type alternateCurrencyEditorConflictError struct {
	message string
}

func (e alternateCurrencyEditorConflictError) Error() string {
	return e.message
}

type alternateCurrencyReferenceConflict struct {
	usage alternateCurrencyUsage
}

func (e alternateCurrencyReferenceConflict) Error() string {
	return "Alternate currency is still referenced"
}

func NewAlternateCurrencyEditorController(
	db *database.Resolver,
	auditLog *auditlog.UserEvent,
) *AlternateCurrencyEditorController {
	return &AlternateCurrencyEditorController{
		db:       db,
		auditLog: auditLog,
	}
}

func (a *AlternateCurrencyEditorController) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "alternate-currency-editor/currencies", a.listCurrencies, nil),
		routes.RegisterRoute(http.MethodGet, "alternate-currency-editor/currency/:id", a.getCurrency, nil),
		routes.RegisterRoute(http.MethodPut, "alternate-currency-editor/currency", a.createCurrency, nil),
		routes.RegisterRoute(http.MethodPatch, "alternate-currency-editor/currency/:id", a.updateCurrency, nil),
		routes.RegisterRoute(http.MethodDelete, "alternate-currency-editor/currency/:id", a.deleteCurrency, nil),
		routes.RegisterRoute(http.MethodPost, "alternate-currency-editor/currency/:id/resolve", a.resolveAndDeleteCurrency, nil),
		routes.RegisterRoute(http.MethodGet, "alternate-currency-editor/currency/:id/usage", a.listUsage, nil),
		routes.RegisterRoute(http.MethodPost, "alternate-currency-editor/currency/:id/balance", a.adjustBalance, nil),
		routes.RegisterRoute(http.MethodGet, "alternate-currency-editor/currency/:id/audit", a.listAudit, nil),
		routes.RegisterRoute(http.MethodGet, "alternate-currency-editor/items", a.searchItems, nil),
		routes.RegisterRoute(http.MethodGet, "alternate-currency-editor/characters", a.searchCharacters, nil),
	}
}

func (a *AlternateCurrencyEditorController) listCurrencies(c echo.Context) error {
	db := a.db.Get(models.AlternateCurrency{}, c)
	page, limit := alternateCurrencyPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))

	base := db.Table("alternate_currency ac").
		Joins("LEFT JOIN items i ON i.id = ac.item_id")
	if search != "" {
		like := "%" + search + "%"
		base = base.Where("i.Name LIKE ? OR CAST(ac.id AS CHAR) LIKE ? OR CAST(ac.item_id AS CHAR) LIKE ?", like, like, like)
	}

	var total int64
	if err := base.Distinct("ac.id").Count(&total).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}

	results := make([]alternateCurrencyEditorSummary, 0)
	query := base.Select(`
		ac.id,
		ac.item_id,
		COALESCE(i.Name, CONCAT('Unknown item #', ac.item_id)) AS item_name,
		COALESCE(i.icon, 0) AS item_icon,
		(SELECT COUNT(*) FROM npc_types n WHERE n.alt_currency_id = ac.id) AS npc_count,
		(SELECT COUNT(*) FROM tasks t WHERE t.reward_point_type = ac.id) AS task_count,
		(SELECT COUNT(*) FROM character_alt_currency b WHERE b.currency_id = ac.id) AS balance_count
	`).Order("CASE WHEN i.id IS NULL THEN 1 ELSE 0 END, i.Name, ac.id")
	if c.QueryParam("lookup") != "1" {
		query = query.Limit(limit).Offset((page - 1) * limit)
	} else {
		page = 1
		limit = int(total)
	}
	if err := query.Scan(&results).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}

	return c.JSON(http.StatusOK, alternateCurrencyEditorPage{
		Data: results, Total: total, Page: page, Limit: limit,
	})
}

func (a *AlternateCurrencyEditorController) getCurrency(c echo.Context) error {
	id, err := alternateCurrencyID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	detail, err := a.loadCurrencyDetail(a.db.Get(models.AlternateCurrency{}, c), id)
	if err != nil {
		return alternateCurrencyLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (a *AlternateCurrencyEditorController) createCurrency(c echo.Context) error {
	request := new(alternateCurrencyEditorInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid alternate currency payload: %v", err)})
	}
	if err := validateAlternateCurrencyInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := a.db.Get(models.AlternateCurrency{}, c)
	var createdID int
	var auditID uint
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := alternateCurrencyEnsureItem(tx, request.ItemID); err != nil {
			return err
		}
		if err := alternateCurrencyEnsureTokenAvailable(tx, request.ItemID, 0); err != nil {
			return err
		}
		id, err := alternateCurrencyFreeID(tx)
		if err != nil {
			return err
		}
		createdID = id
		if err := tx.Table("alternate_currency").Create(map[string]interface{}{
			"id": id, "item_id": request.ItemID,
		}).Error; err != nil {
			return err
		}
		auditID, err = a.writeAudit(c, alternateCurrencyEventCreate, alternateCurrencyAuditPayload{
			Action: "create", CurrencyID: id, ItemID: request.ItemID,
		})
		return err
	})
	if err != nil {
		a.discardAudit(auditID)
		return alternateCurrencyMutationError(c, err)
	}

	detail, err := a.loadCurrencyDetail(db, createdID)
	if err != nil {
		return alternateCurrencyLoadError(c, err)
	}
	return c.JSON(http.StatusCreated, detail)
}

func (a *AlternateCurrencyEditorController) updateCurrency(c echo.Context) error {
	id, err := alternateCurrencyID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(alternateCurrencyEditorInput)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid alternate currency payload: %v", err)})
	}
	request.ID = id
	if err := validateAlternateCurrencyInput(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := a.db.Get(models.AlternateCurrency{}, c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		var current alternateCurrencyEditorInput
		if err := tx.Table("alternate_currency").
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", id).
			Take(&current).Error; err != nil {
			return err
		}
		if err := alternateCurrencyEnsureItem(tx, request.ItemID); err != nil {
			return err
		}
		if err := alternateCurrencyEnsureTokenAvailable(tx, request.ItemID, id); err != nil {
			return err
		}
		if err := tx.Table("alternate_currency").Where("id = ?", id).
			Update("item_id", request.ItemID).Error; err != nil {
			return err
		}
		auditID, err = a.writeAudit(c, alternateCurrencyEventUpdate, alternateCurrencyAuditPayload{
			Action: "update", CurrencyID: id, ItemID: request.ItemID, PreviousItemID: current.ItemID,
		})
		return err
	})
	if err != nil {
		a.discardAudit(auditID)
		return alternateCurrencyMutationError(c, err)
	}

	detail, err := a.loadCurrencyDetail(db, id)
	if err != nil {
		return alternateCurrencyLoadError(c, err)
	}
	return c.JSON(http.StatusOK, detail)
}

func (a *AlternateCurrencyEditorController) deleteCurrency(c echo.Context) error {
	id, err := alternateCurrencyID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := a.db.Get(models.AlternateCurrency{}, c)
	var auditID uint
	err = db.Transaction(func(tx *gorm.DB) error {
		var currency alternateCurrencyEditorInput
		if err := tx.Table("alternate_currency").
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", id).
			Take(&currency).Error; err != nil {
			return err
		}
		usage, err := loadAlternateCurrencyUsage(tx, id)
		if err != nil {
			return err
		}
		if usage.ReferenceCount() > 0 {
			return alternateCurrencyReferenceConflict{usage: usage}
		}
		auditID, err = a.writeAudit(c, alternateCurrencyEventDelete, alternateCurrencyAuditPayload{
			Action: "delete", CurrencyID: id, ItemID: currency.ItemID,
		})
		if err != nil {
			return err
		}
		return tx.Table("alternate_currency").Where("id = ?", id).Delete(nil).Error
	})
	if err != nil {
		a.discardAudit(auditID)
		var conflict alternateCurrencyReferenceConflict
		if errors.As(err, &conflict) {
			return c.JSON(http.StatusConflict, echo.Map{
				"error": "Alternate currency is still used. Replace or remove every usage before deleting it.",
				"usage": conflict.usage,
			})
		}
		return alternateCurrencyMutationError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func (a *AlternateCurrencyEditorController) resolveAndDeleteCurrency(c echo.Context) error {
	id, err := alternateCurrencyID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(alternateCurrencyResolveRequest)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid resolution payload: %v", err)})
	}
	request.Mode = strings.TrimSpace(strings.ToLower(request.Mode))
	request.Reason = strings.TrimSpace(request.Reason)
	if err := validateAlternateCurrencyResolve(*request, id); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := a.db.Get(models.AlternateCurrency{}, c)
	result := alternateCurrencyResolveResult{DeletedID: id, Mode: request.Mode, ReplacementID: request.TargetID}
	var source alternateCurrencyEditorInput
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Table("alternate_currency").
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", id).
			Take(&source).Error; err != nil {
			return err
		}

		if request.Mode == "replace" {
			var target alternateCurrencyEditorInput
			if err := tx.Table("alternate_currency").
				Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("id = ?", request.TargetID).
				Take(&target).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return alternateCurrencyConflict("Replacement alternate currency was not found")
				}
				return err
			}
			npcs := tx.Table("npc_types").Where("alt_currency_id = ?", id).Update("alt_currency_id", request.TargetID)
			if npcs.Error != nil {
				return npcs.Error
			}
			result.NpcsUpdated = npcs.RowsAffected

			tasks := tx.Table("tasks").Where("reward_point_type = ?", id).Update("reward_point_type", request.TargetID)
			if tasks.Error != nil {
				return tasks.Error
			}
			result.TasksUpdated = tasks.RowsAffected

			var overflowCount int64
			if err := tx.Raw(`
				SELECT COUNT(*)
				FROM character_alt_currency source
				JOIN character_alt_currency target
					ON target.char_id = source.char_id
					AND target.currency_id = ?
				WHERE source.currency_id = ?
					AND CAST(source.amount AS UNSIGNED) + CAST(target.amount AS UNSIGNED) > ?
			`, request.TargetID, id, uint64(math.MaxUint32)).Scan(&overflowCount).Error; err != nil {
				return err
			}
			if overflowCount > 0 {
				return alternateCurrencyConflict(
					"%d character balance merges would exceed the database limit; no changes were committed",
					overflowCount,
				)
			}
			var balanceCount int64
			if err := tx.Table("character_alt_currency").Where("currency_id = ?", id).Count(&balanceCount).Error; err != nil {
				return err
			}
			if balanceCount > 0 {
				if err := tx.Exec(`
					UPDATE character_alt_currency target
					JOIN character_alt_currency source
						ON source.char_id = target.char_id
						AND source.currency_id = ?
					SET target.amount = target.amount + source.amount
					WHERE target.currency_id = ?
				`, id, request.TargetID).Error; err != nil {
					return err
				}
				if err := tx.Exec(`
					INSERT INTO character_alt_currency (char_id, currency_id, amount)
					SELECT source.char_id, ?, source.amount
					FROM character_alt_currency source
					LEFT JOIN character_alt_currency target
						ON target.char_id = source.char_id
						AND target.currency_id = ?
					WHERE source.currency_id = ?
						AND target.char_id IS NULL
				`, request.TargetID, request.TargetID, id).Error; err != nil {
					return err
				}
				if err := tx.Table("character_alt_currency").Where("currency_id = ?", id).Delete(nil).Error; err != nil {
					return err
				}
			}
			result.BalancesMoved = balanceCount
		} else {
			npcs := tx.Table("npc_types").Where("alt_currency_id = ?", id).Update("alt_currency_id", 0)
			if npcs.Error != nil {
				return npcs.Error
			}
			result.NpcsUpdated = npcs.RowsAffected

			tasks := tx.Table("tasks").Where("reward_point_type = ?", id).Update("reward_point_type", 0)
			if tasks.Error != nil {
				return tasks.Error
			}
			result.TasksUpdated = tasks.RowsAffected

			var balanceCount int64
			if err := tx.Table("character_alt_currency").Where("currency_id = ?", id).Count(&balanceCount).Error; err != nil {
				return err
			}
			if balanceCount > 0 && !request.DeleteBalances {
				return alternateCurrencyConflict(
					"%d character balances remain. Explicitly confirm their removal or replace this currency instead",
					balanceCount,
				)
			}
			if request.DeleteBalances {
				deleted := tx.Table("character_alt_currency").Where("currency_id = ?", id).Delete(nil)
				if deleted.Error != nil {
					return deleted.Error
				}
				result.BalancesDeleted = deleted.RowsAffected
			}
		}

		remaining, err := loadAlternateCurrencyUsage(tx, id)
		if err != nil {
			return err
		}
		if remaining.ReferenceCount() > 0 {
			return alternateCurrencyConflict(
				"%d usages could not be resolved safely; no changes were committed",
				remaining.ReferenceCount(),
			)
		}

		result.AuditID, err = a.writeAudit(c, alternateCurrencyEventResolveDelete, alternateCurrencyAuditPayload{
			Action: "resolve_delete", CurrencyID: id, ItemID: source.ItemID,
			ReplacementID: request.TargetID, Reason: strings.TrimSpace(request.Reason),
			NpcsUpdated: result.NpcsUpdated, TasksUpdated: result.TasksUpdated,
			BalancesMoved: result.BalancesMoved, BalancesDeleted: result.BalancesDeleted,
		})
		if err != nil {
			return err
		}
		return tx.Table("alternate_currency").Where("id = ?", id).Delete(nil).Error
	})
	if err != nil {
		a.discardAudit(result.AuditID)
		return alternateCurrencyMutationError(c, err)
	}
	return c.JSON(http.StatusOK, result)
}

func (a *AlternateCurrencyEditorController) listUsage(c echo.Context) error {
	id, err := alternateCurrencyID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	db := a.db.Get(models.AlternateCurrency{}, c)
	if err := alternateCurrencyEnsureCurrency(db, id); err != nil {
		return alternateCurrencyLoadError(c, err)
	}

	page, limit := alternateCurrencyPagination(c)
	search := strings.TrimSpace(c.QueryParam("q"))
	like := "%" + search + "%"
	kind := strings.TrimSpace(strings.ToLower(c.QueryParam("kind")))

	switch kind {
	case "npcs":
		query := db.Table("npc_types").Where("alt_currency_id = ?", id)
		if search != "" {
			query = query.Where("name LIKE ? OR CAST(id AS CHAR) LIKE ?", like, like)
		}
		var total int64
		if err := query.Count(&total).Error; err != nil {
			return alternateCurrencyDatabaseError(c, err)
		}
		rows := make([]alternateCurrencyNpcUsage, 0)
		if err := query.Select("id, COALESCE(name, '') AS name, level, race, class").
			Order("name, id").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
			return alternateCurrencyDatabaseError(c, err)
		}
		return c.JSON(http.StatusOK, alternateCurrencyEditorPage{Data: rows, Total: total, Page: page, Limit: limit})
	case "tasks":
		query := db.Table("tasks").Where("reward_point_type = ?", id)
		if search != "" {
			query = query.Where("title LIKE ? OR CAST(id AS CHAR) LIKE ?", like, like)
		}
		var total int64
		if err := query.Count(&total).Error; err != nil {
			return alternateCurrencyDatabaseError(c, err)
		}
		rows := make([]alternateCurrencyTaskUsage, 0)
		if err := query.Select("id, COALESCE(title, '') AS title, reward_points").
			Order("title, id").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
			return alternateCurrencyDatabaseError(c, err)
		}
		return c.JSON(http.StatusOK, alternateCurrencyEditorPage{Data: rows, Total: total, Page: page, Limit: limit})
	case "balances":
		query := db.Table("character_alt_currency b").
			Joins("JOIN character_data c ON c.id = b.char_id").
			Where("b.currency_id = ?", id)
		if search != "" {
			query = query.Where("c.name LIKE ? OR CAST(c.id AS CHAR) LIKE ?", like, like)
		}
		var total int64
		if err := query.Count(&total).Error; err != nil {
			return alternateCurrencyDatabaseError(c, err)
		}
		rows := make([]alternateCurrencyBalanceUsage, 0)
		if err := query.Select(`
			c.id AS character_id,
			COALESCE(c.name, CONCAT('Character #', c.id)) AS character_name,
			c.level,
			c.class,
			b.amount
		`).Order("c.name, c.id").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
			return alternateCurrencyDatabaseError(c, err)
		}
		return c.JSON(http.StatusOK, alternateCurrencyEditorPage{Data: rows, Total: total, Page: page, Limit: limit})
	default:
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Usage kind must be npcs, tasks, or balances"})
	}
}

func (a *AlternateCurrencyEditorController) adjustBalance(c echo.Context) error {
	id, err := alternateCurrencyID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := new(alternateCurrencyBalanceRequest)
	if err := c.Bind(request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("Invalid balance payload: %v", err)})
	}
	request.Operation = strings.TrimSpace(strings.ToLower(request.Operation))
	request.Reason = strings.TrimSpace(request.Reason)
	if err := validateAlternateCurrencyBalance(*request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	db := a.db.Get(models.AlternateCurrency{}, c)
	result := alternateCurrencyBalanceResult{
		CharacterID: request.CharacterID,
		CurrencyID:  id,
		Operation:   request.Operation,
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := alternateCurrencyEnsureCurrency(tx, id); err != nil {
			return err
		}
		var character struct {
			ID   int    `gorm:"column:id"`
			Name string `gorm:"column:name"`
		}
		if err := tx.Table("character_data").
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id, COALESCE(name, '') AS name").
			Where("id = ?", request.CharacterID).
			Take(&character).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return alternateCurrencyConflict("Character was not found")
			}
			return err
		}
		result.CharacterName = character.Name

		var current struct {
			Amount uint64 `gorm:"column:amount"`
		}
		balanceQuery := tx.Table("character_alt_currency").
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("amount").
			Where("char_id = ? AND currency_id = ?", request.CharacterID, id).
			Take(&current)
		if balanceQuery.Error != nil && !errors.Is(balanceQuery.Error, gorm.ErrRecordNotFound) {
			return balanceQuery.Error
		}
		result.Before = current.Amount
		if request.ExpectedAmount == nil || *request.ExpectedAmount != current.Amount {
			return alternateCurrencyConflict(
				"Balance changed from %d to %d while this editor was open. Refresh before applying another adjustment",
				alternateCurrencyExpectedValue(request.ExpectedAmount),
				current.Amount,
			)
		}

		after, err := alternateCurrencyAdjustedBalance(current.Amount, request.Operation, request.Amount)
		if err != nil {
			return err
		}
		result.After = after
		if after == 0 {
			if err := tx.Table("character_alt_currency").
				Where("char_id = ? AND currency_id = ?", request.CharacterID, id).
				Delete(nil).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Exec(`
				INSERT INTO character_alt_currency (char_id, currency_id, amount)
				VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE amount = VALUES(amount)
			`, request.CharacterID, id, after).Error; err != nil {
				return err
			}
		}

		result.AuditID, err = a.writeAudit(c, alternateCurrencyEventBalanceAdjust, alternateCurrencyAuditPayload{
			Action: "balance_adjust", CurrencyID: id, CharacterID: request.CharacterID,
			CharacterName: character.Name, Operation: request.Operation,
			Before: current.Amount, After: after, Reason: strings.TrimSpace(request.Reason),
		})
		return err
	})
	if err != nil {
		a.discardAudit(result.AuditID)
		return alternateCurrencyMutationError(c, err)
	}
	return c.JSON(http.StatusOK, result)
}

func (a *AlternateCurrencyEditorController) listAudit(c echo.Context) error {
	id, err := alternateCurrencyID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if a.db.GetSpireDb() == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "Spire audit database is unavailable"})
	}
	connectionID := a.auditLog.ActiveConnectionID(c)
	page, limit := alternateCurrencyPagination(c)
	if limit > 50 {
		limit = 50
	}

	query := a.db.GetSpireDb().Table("spire_user_event_log logs").
		Joins("LEFT JOIN spire_users users ON users.id = logs.user_id").
		Where("logs.server_database_connection_id = ?", connectionID).
		Where("logs.event_name LIKE 'ALTERNATE_CURRENCY_%'").
		Where("JSON_VALID(logs.data) = 1").
		Where(`
			CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.currency_id')) AS UNSIGNED) = ?
			OR CAST(JSON_UNQUOTE(JSON_EXTRACT(logs.data, '$.replacement_id')) AS UNSIGNED) = ?
		`, id, id)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}
	rows := make([]alternateCurrencyAuditRow, 0)
	if err := query.Select(`
		logs.id,
		logs.user_id,
		COALESCE(NULLIF(users.user_name, ''), NULLIF(users.full_name, ''), CONCAT('User ', logs.user_id)) AS user_name,
		logs.event_name,
		logs.created_at,
		logs.data
	`).Order("logs.id DESC").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}

	results := make([]alternateCurrencyAuditEntry, 0, len(rows))
	for _, row := range rows {
		payload := make(map[string]interface{})
		if err := json.Unmarshal([]byte(row.RawData), &payload); err != nil {
			payload["raw"] = row.RawData
		}
		results = append(results, alternateCurrencyAuditEntry{
			ID: row.ID, UserID: row.UserID, UserName: row.UserName,
			EventName: row.EventName, CreatedAt: row.CreatedAt, Data: payload,
		})
	}
	return c.JSON(http.StatusOK, alternateCurrencyEditorPage{
		Data: results, Total: total, Page: page, Limit: limit,
	})
}

func (a *AlternateCurrencyEditorController) searchItems(c echo.Context) error {
	db := a.db.Get(models.Item{}, c)
	search := strings.TrimSpace(c.QueryParam("q"))
	if search == "" {
		return c.JSON(http.StatusOK, alternateCurrencyEditorPage{Data: []alternateCurrencyItem{}, Total: 0, Page: 1, Limit: 12})
	}
	limit := 12
	like := "%" + search + "%"
	query := db.Table("items").Where("Name LIKE ?", like)
	if id, err := strconv.Atoi(search); err == nil && id > 0 {
		query = db.Table("items").Where("Name LIKE ? OR id = ?", like, id)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}
	results := make([]alternateCurrencyItem, 0)
	if err := query.Select(`
		items.id,
		COALESCE(items.Name, '') AS name,
		COALESCE(items.icon, 0) AS icon,
		COALESCE((
			SELECT MIN(ac.id)
			FROM alternate_currency ac
			WHERE ac.item_id = items.id
		), 0) AS assigned_currency_id
	`).Order("items.Name, items.id").
		Limit(limit).Scan(&results).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, alternateCurrencyEditorPage{Data: results, Total: total, Page: 1, Limit: limit})
}

func (a *AlternateCurrencyEditorController) searchCharacters(c echo.Context) error {
	currencyID, err := strconv.Atoi(c.QueryParam("currency_id"))
	if err != nil || currencyID <= 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Currency ID must be a positive number"})
	}
	search := strings.TrimSpace(c.QueryParam("q"))
	if len(search) < 2 {
		return c.JSON(http.StatusOK, alternateCurrencyEditorPage{Data: []alternateCurrencyBalanceUsage{}, Total: 0, Page: 1, Limit: 15})
	}
	db := a.db.Get(models.CharacterDatum{}, c)
	like := "%" + search + "%"
	query := db.Table("character_data c").Where("c.name LIKE ?", like)
	if id, err := strconv.Atoi(search); err == nil && id > 0 {
		query = db.Table("character_data c").Where("c.name LIKE ? OR c.id = ?", like, id)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}
	results := make([]alternateCurrencyBalanceUsage, 0)
	if err := query.Select(`
		c.id AS character_id,
		COALESCE(c.name, CONCAT('Character #', c.id)) AS character_name,
		c.level,
		c.class,
		COALESCE(b.amount, 0) AS amount
	`).Joins(
		"LEFT JOIN character_alt_currency b ON b.char_id = c.id AND b.currency_id = ?",
		currencyID,
	).Order("c.name, c.id").
		Limit(15).Scan(&results).Error; err != nil {
		return alternateCurrencyDatabaseError(c, err)
	}
	return c.JSON(http.StatusOK, alternateCurrencyEditorPage{Data: results, Total: total, Page: 1, Limit: 15})
}

func (a *AlternateCurrencyEditorController) loadCurrencyDetail(db *gorm.DB, id int) (alternateCurrencyEditorDetail, error) {
	var detail alternateCurrencyEditorDetail
	var row struct {
		ID       int    `gorm:"column:id"`
		ItemID   int    `gorm:"column:item_id"`
		ItemName string `gorm:"column:item_name"`
		ItemIcon int    `gorm:"column:item_icon"`
	}
	if err := db.Table("alternate_currency ac").
		Select(`
			ac.id,
			ac.item_id,
			COALESCE(i.Name, CONCAT('Unknown item #', ac.item_id)) AS item_name,
			COALESCE(i.icon, 0) AS item_icon
		`).
		Joins("LEFT JOIN items i ON i.id = ac.item_id").
		Where("ac.id = ?", id).
		Take(&row).Error; err != nil {
		return detail, err
	}
	detail.Currency = alternateCurrencyEditorInput{ID: row.ID, ItemID: row.ItemID}
	detail.Item = alternateCurrencyItem{ID: row.ItemID, Name: row.ItemName, Icon: row.ItemIcon}
	usage, err := loadAlternateCurrencyUsage(db, id)
	if err != nil {
		return detail, err
	}
	detail.Usage = usage
	return detail, nil
}

func loadAlternateCurrencyUsage(db *gorm.DB, id int) (alternateCurrencyUsage, error) {
	usage := alternateCurrencyUsage{
		NpcSamples:     make([]alternateCurrencyNpcUsage, 0),
		TaskSamples:    make([]alternateCurrencyTaskUsage, 0),
		BalanceSamples: make([]alternateCurrencyBalanceUsage, 0),
	}
	if err := db.Table("npc_types").Where("alt_currency_id = ?", id).Count(&usage.NpcCount).Error; err != nil {
		return usage, err
	}
	if err := db.Table("tasks").Where("reward_point_type = ?", id).Count(&usage.TaskCount).Error; err != nil {
		return usage, err
	}
	if err := db.Table("character_alt_currency").Where("currency_id = ?", id).Count(&usage.BalanceCount).Error; err != nil {
		return usage, err
	}
	var total struct {
		Amount uint64 `gorm:"column:amount"`
	}
	if err := db.Table("character_alt_currency").
		Select("COALESCE(SUM(amount), 0) AS amount").
		Where("currency_id = ?", id).Scan(&total).Error; err != nil {
		return usage, err
	}
	usage.TotalBalance = total.Amount

	if err := db.Table("npc_types").
		Select("id, COALESCE(name, '') AS name, level, race, class").
		Where("alt_currency_id = ?", id).
		Order("name, id").
		Limit(alternateCurrencyEditorSampleLimit).
		Scan(&usage.NpcSamples).Error; err != nil {
		return usage, err
	}
	if err := db.Table("tasks").
		Select("id, COALESCE(title, '') AS title, reward_points").
		Where("reward_point_type = ?", id).
		Order("title, id").
		Limit(alternateCurrencyEditorSampleLimit).
		Scan(&usage.TaskSamples).Error; err != nil {
		return usage, err
	}
	if err := db.Table("character_alt_currency b").
		Select(`
			c.id AS character_id,
			COALESCE(c.name, CONCAT('Character #', c.id)) AS character_name,
			c.level,
			c.class,
			b.amount
		`).
		Joins("JOIN character_data c ON c.id = b.char_id").
		Where("b.currency_id = ?", id).
		Order("b.amount DESC, c.name").
		Limit(alternateCurrencyEditorSampleLimit).
		Scan(&usage.BalanceSamples).Error; err != nil {
		return usage, err
	}
	return usage, nil
}

func alternateCurrencyEnsureCurrency(db *gorm.DB, id int) error {
	var count int64
	if err := db.Table("alternate_currency").Where("id = ?", id).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func alternateCurrencyEnsureItem(db *gorm.DB, itemID int) error {
	var count int64
	if err := db.Table("items").Where("id = ?", itemID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return alternateCurrencyConflict("Token item #%d was not found", itemID)
	}
	return nil
}

func alternateCurrencyEnsureTokenAvailable(db *gorm.DB, itemID int, excludeID int) error {
	query := db.Table("alternate_currency").Where("item_id = ?", itemID)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	var count int64
	if err := query.Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return alternateCurrencyConflict("Token item #%d is already assigned to another alternate currency", itemID)
	}
	return nil
}

func alternateCurrencyFreeID(db *gorm.DB) (int, error) {
	var result struct {
		ID int `gorm:"column:id"`
	}
	if err := db.Raw(`
		SELECT candidate.id
		FROM (
			SELECT 1 AS id
			UNION ALL
			SELECT current_row.id + 1 AS id
			FROM alternate_currency current_row
			WHERE current_row.id > 0 AND current_row.id < 2147483647
		) candidate
		LEFT JOIN alternate_currency occupied ON occupied.id = candidate.id
		WHERE occupied.id IS NULL
		ORDER BY candidate.id
		LIMIT 1
	`).Scan(&result).Error; err != nil {
		return 0, err
	}
	if result.ID <= 0 {
		return 0, errors.New("No free alternate currency ID is available")
	}
	return result.ID, nil
}

func validateAlternateCurrencyInput(input alternateCurrencyEditorInput) error {
	if input.ItemID <= 0 {
		return errors.New("Select a token item")
	}
	return nil
}

func validateAlternateCurrencyResolve(request alternateCurrencyResolveRequest, sourceID int) error {
	request.Mode = strings.TrimSpace(strings.ToLower(request.Mode))
	if request.Mode != "replace" && request.Mode != "remove" {
		return errors.New("Resolution mode must be replace or remove")
	}
	if request.Mode == "replace" {
		if request.TargetID <= 0 {
			return errors.New("Select a replacement alternate currency")
		}
		if request.TargetID == sourceID {
			return errors.New("Replacement alternate currency must be different")
		}
	}
	return validateAlternateCurrencyReason(request.Reason)
}

func validateAlternateCurrencyBalance(request alternateCurrencyBalanceRequest) error {
	if request.CharacterID <= 0 {
		return errors.New("Select a character")
	}
	request.Operation = strings.TrimSpace(strings.ToLower(request.Operation))
	switch request.Operation {
	case "set":
		if request.Amount < 0 || request.Amount > int64(math.MaxUint32) {
			return fmt.Errorf("Balance must be between 0 and %d", uint64(math.MaxUint32))
		}
	case "add", "subtract":
		if request.Amount <= 0 || request.Amount > int64(math.MaxUint32) {
			return fmt.Errorf("Adjustment must be between 1 and %d", uint64(math.MaxUint32))
		}
	default:
		return errors.New("Balance operation must be set, add, or subtract")
	}
	if request.ExpectedAmount == nil {
		return errors.New("Expected balance is required; refresh the character before adjusting")
	}
	return validateAlternateCurrencyReason(request.Reason)
}

func validateAlternateCurrencyReason(reason string) error {
	length := len(strings.TrimSpace(reason))
	if length < alternateCurrencyReasonMinLength {
		return fmt.Errorf("Reason must be at least %d characters", alternateCurrencyReasonMinLength)
	}
	if length > alternateCurrencyReasonMaxLength {
		return fmt.Errorf("Reason must be %d characters or fewer", alternateCurrencyReasonMaxLength)
	}
	return nil
}

func alternateCurrencyAdjustedBalance(current uint64, operation string, amount int64) (uint64, error) {
	switch strings.TrimSpace(strings.ToLower(operation)) {
	case "set":
		return uint64(amount), nil
	case "add":
		if uint64(amount) > uint64(math.MaxUint32)-current {
			return 0, fmt.Errorf("Adjustment would exceed the maximum balance of %d", uint64(math.MaxUint32))
		}
		return current + uint64(amount), nil
	case "subtract":
		if uint64(amount) > current {
			return 0, alternateCurrencyConflict("Cannot subtract %d from a balance of %d", amount, current)
		}
		return current - uint64(amount), nil
	default:
		return 0, errors.New("Unknown balance operation")
	}
}

func alternateCurrencyExpectedValue(value *uint64) uint64 {
	if value == nil {
		return 0
	}
	return *value
}

func alternateCurrencyPagination(c echo.Context) (int, int) {
	page := 1
	limit := alternateCurrencyEditorDefaultPageSize
	if parsed, err := strconv.Atoi(c.QueryParam("page")); err == nil && parsed > 0 {
		page = parsed
	}
	if parsed, err := strconv.Atoi(c.QueryParam("limit")); err == nil && parsed > 0 {
		limit = parsed
	}
	if limit > alternateCurrencyEditorMaxPageSize {
		limit = alternateCurrencyEditorMaxPageSize
	}
	return page, limit
}

func alternateCurrencyID(c echo.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, errors.New("Alternate currency ID must be a positive number")
	}
	return id, nil
}

func alternateCurrencyConflict(format string, args ...interface{}) error {
	return alternateCurrencyEditorConflictError{message: fmt.Sprintf(format, args...)}
}

func alternateCurrencyMutationError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Alternate currency was not found"})
	}
	var conflict alternateCurrencyEditorConflictError
	if errors.As(err, &conflict) {
		return c.JSON(http.StatusConflict, echo.Map{"error": conflict.Error()})
	}
	return alternateCurrencyDatabaseError(c, err)
}

func alternateCurrencyLoadError(c echo.Context, err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Alternate currency was not found"})
	}
	return alternateCurrencyDatabaseError(c, err)
}

func alternateCurrencyDatabaseError(c echo.Context, err error) error {
	return c.JSON(
		http.StatusInternalServerError,
		echo.Map{"error": fmt.Sprintf("Alternate currency editor database error: %v", err)},
	)
}

func (a *AlternateCurrencyEditorController) writeAudit(
	c echo.Context,
	eventName string,
	payload alternateCurrencyAuditPayload,
) (uint, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return 0, err
	}
	id, err := a.auditLog.LogEditorEvent(c, eventName, string(data))
	if err != nil {
		return 0, fmt.Errorf("could not persist the required audit record: %w", err)
	}
	if id == 0 {
		return 0, errors.New("could not persist the required audit record")
	}
	return id, nil
}

func (a *AlternateCurrencyEditorController) discardAudit(id uint) {
	if id == 0 || a.db.GetSpireDb() == nil {
		return
	}
	_ = a.db.GetSpireDb().
		Table("spire_user_event_log").
		Where("id = ?", id).
		Delete(nil).Error
}
