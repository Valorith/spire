package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// ---------------------------------------------------------------------------
// Bug reports: the account's /bug reports, which staff can link to the case
// and mark reviewed.

const supportBugLinkKind = "bug_report"

type supportBugReport struct {
	ID            uint       `json:"id"`
	CharacterName string     `json:"character_name"`
	Category      string     `json:"category"`
	Zone          string     `json:"zone"`
	ReportedAt    *time.Time `json:"reported_at"`
	Text          string     `json:"text"`
	Status        int        `json:"status"`
	ReviewedBy    string     `json:"reviewed_by"`
	Linked        bool       `json:"linked"`
}

// supportBugReportRow is a report as read, before its text is cut.
type supportBugReportRow struct {
	Report supportBugReport `gorm:"embedded"`
	Body   string
}

type supportBugReportInput struct {
	Action string `json:"action"`
	Note   string `json:"note"`
}

func (input supportBugReportInput) validate() error {
	switch input.Action {
	case "link", "unlink", "review":
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "Unknown bug report action")
	}
	if len([]rune(strings.TrimSpace(input.Note))) > 1000 {
		return echo.NewHTTPError(http.StatusBadRequest, "Keep the note to 1,000 characters")
	}
	return nil
}

// supportBugReportOwner is the WHERE clause that keeps bug reports to the
// petitioning account and its characters.
func supportBugReportOwner(db *gorm.DB, accountID uint, characters []uint) *gorm.DB {
	if len(characters) == 0 {
		return db.Where("account_id = ?", accountID)
	}
	return db.Where("(account_id = ? OR character_id IN ?)", accountID, characters)
}

// supportBugReportList lists the account's reports from the last 30 days and
// every report linked to the case, newest first.
func supportBugReportList(scope supportScope, view supportCaseView) ([]supportBugReport, error) {
	reports := []supportBugReport{}
	columns, err := toolColumns(scope.eqemu, "bug_reports")
	if err != nil || !columns["bug_report"] || !columns["report_datetime"] {
		return reports, err
	}
	accountID, err := toolAccount(scope, view)
	if err != nil {
		return nil, err
	}
	characters, err := toolAccountCharacters(scope, accountID, true)
	if err != nil {
		return nil, err
	}
	var linked []uint
	if view.ID > 0 {
		if err := scope.spire.Model(&models.PlayerSupportCaseLink{}).Where("case_id = ? AND kind = ?", view.ID, supportBugLinkKind).
			Pluck("ref_id", &linked).Error; err != nil {
			return nil, err
		}
	}
	query := supportBugReportOwner(scope.eqemu.Table("bug_reports"), accountID, toolCharacterIDs(characters))
	if len(linked) > 0 {
		query = query.Where("(report_datetime >= NOW() - INTERVAL 30 DAY OR id IN ?)", linked)
	} else {
		query = query.Where("report_datetime >= NOW() - INTERVAL 30 DAY")
	}
	var rows []supportBugReportRow
	if err := query.Select("id, COALESCE(character_name, '') AS character_name, COALESCE(category_name, '') AS category, " +
		"COALESCE(zone, '') AS zone, report_datetime AS reported_at, COALESCE(bug_report, '') AS body, " +
		"COALESCE(bug_status, 0) AS status, COALESCE(last_reviewer, '') AS reviewed_by").
		Order("report_datetime DESC, id DESC").Limit(50).Scan(&rows).Error; err != nil {
		return nil, err
	}
	isLinked := make(map[uint]bool, len(linked))
	for _, id := range linked {
		isLinked[id] = true
	}
	for _, row := range rows {
		report := row.Report
		report.Text, report.Linked = toolCut(row.Body, 2000), isLinked[report.ID]
		reports = append(reports, report)
	}
	return reports, nil
}

func (p *PlayerSupportController) bugReports(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	reports, err := supportBugReportList(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{"reports": reports})
}

func (p *PlayerSupportController) updateBugReport(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	var input supportBugReportInput
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid bug report request"))
	}
	if err := input.validate(); err != nil {
		return supportError(c, err)
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid bug report"))
	}
	if input.Action == "review" && scope.connectionID > 0 &&
		!p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/bug_reports", true) {
		return supportError(c, echo.NewHTTPError(http.StatusForbidden, "Bug report write access is required"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	accountID, err := toolAccount(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	characters, err := toolAccountCharacters(scope, accountID, true)
	if err != nil {
		return supportError(c, err)
	}
	notFound := echo.NewHTTPError(http.StatusNotFound, "That bug report is not from this account")
	columns, err := toolColumns(scope.eqemu, "bug_reports")
	if err != nil {
		return supportError(c, err)
	}
	if !columns["bug_report"] {
		return supportError(c, notFound)
	}
	var owned int64
	if err := supportBugReportOwner(scope.eqemu.Table("bug_reports"), accountID, toolCharacterIDs(characters)).
		Where("id = ?", id).Count(&owned).Error; err != nil {
		return supportError(c, err)
	}
	if owned == 0 {
		return supportError(c, notFound)
	}
	reportID := uint(id)
	actor := supportActor(scope.user)
	note := strings.TrimSpace(input.Note)
	var text string
	switch input.Action {
	case "link":
		text = fmt.Sprintf("Linked bug report #%d", reportID)
	case "unlink":
		text = fmt.Sprintf("Unlinked bug report #%d", reportID)
	case "review":
		text = fmt.Sprintf("Marked bug report #%d reviewed", reportID)
	}
	if note != "" {
		text += "\n" + note
	}
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, view.PlayerSupportCase)
		if err != nil {
			return err
		}
		view.ID = record.ID
		switch input.Action {
		case "link":
			err := tx.Create(&models.PlayerSupportCaseLink{CaseID: record.ID, Kind: supportBugLinkKind, RefID: reportID, Actor: actor}).Error
			var duplicate *mysql.MySQLError
			if errors.As(err, &duplicate) && duplicate.Number == 1062 {
				return echo.NewHTTPError(http.StatusConflict, "It is already linked")
			}
			if err != nil {
				return err
			}
		case "unlink":
			result := tx.Where("case_id = ? AND kind = ? AND ref_id = ?", record.ID, supportBugLinkKind, reportID).
				Delete(&models.PlayerSupportCaseLink{})
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return echo.NewHTTPError(http.StatusConflict, "It is not linked")
			}
		}
		if err := tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: "bug_link", Actor: actor, Text: text}).Error; err != nil {
			return err
		}
		if input.Action != "review" {
			return nil
		}
		// The EQEmu update runs last, so a Spire failure before it leaves the
		// report untouched and a failed update rolls back the timeline entry.
		return supportBugReportOwner(scope.eqemu.Table("bug_reports"), accountID, toolCharacterIDs(characters)).
			Where("id = ?", reportID).
			Updates(map[string]interface{}{
				"bug_status": 1, "last_review": gorm.Expr("NOW()"), "last_reviewer": actor, "reviewer_notes": note,
			}).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	reports, err := supportBugReportList(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{"reports": reports})
}
