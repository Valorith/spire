package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm/clause"
)

// ---------------------------------------------------------------------------
// Persona: the name players see on a Game Master's tells from Spire, as
// "(GM) <persona>". Each Spire user keeps one, under their user id; a local
// install with authentication off has no user, so it keeps one under id 0.
// Mail is not affected: it always comes from GameMaster.

// supportPersonaAnswer is what the page shows about the viewer's persona.
type supportPersonaAnswer struct {
	// Persona is the chosen name, "" for the default.
	Persona string `json:"persona"`
	// Display is what players see after "(GM) ".
	Display string `json:"display"`
	// Available is World on this connection accepting personas.
	Available bool   `json:"available"`
	Reason    string `json:"reason,omitempty"`
	// Warning names a character with the same name. It is allowed: World
	// gives Player Support a reply only from players it has messaged under
	// that name.
	Warning string `json:"warning,omitempty"`
}

// persona reads the viewer's persona; "" when none is set or it is unreadable.
func (s supportScope) persona() string {
	var row models.PlayerSupportPersona
	if s.spire.Where("user_id = ?", s.user.ID).Limit(1).Find(&row).Error != nil {
		return ""
	}
	return row.Persona
}

// personaArgument is the persona a tell from this viewer carries (see
// playersupport.PersonaArgument): only on the World Spire runs beside, when
// it supports personas.
func (p *PlayerSupportController) personaArgument(scope supportScope) string {
	if p.world == nil || !p.localWorld(scope) {
		return ""
	}
	return playersupport.PersonaArgument(scope.persona(), p.world.Features())
}

func (p *PlayerSupportController) personaAnswer(scope supportScope, persona string) supportPersonaAnswer {
	answer := supportPersonaAnswer{Persona: persona, Display: playersupport.DefaultPersona}
	if persona != "" {
		answer.Display = persona
	}
	switch {
	case p.world == nil || !p.localWorld(scope):
		answer.Reason = "Needs the game server this Spire runs beside"
	case !p.world.Features().Persona:
		answer.Reason = "Needs the updated Player Support patch on World"
	default:
		answer.Available = true
	}
	if persona != "" && !strings.Contains(persona, " ") {
		var count int64
		if scope.eqemu.Table("character_data").Where("name = ? AND deleted_at IS NULL", persona).Count(&count).Error == nil && count > 0 {
			answer.Warning = "A character is named " + persona + ". Players you message see (GM) " + persona + ", and their replies still come to you."
		}
	}
	return answer
}

func (p *PlayerSupportController) getPersona(c echo.Context) error {
	scope, err := p.scope(c, true)
	if err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, p.personaAnswer(scope, scope.persona()))
}

// setPersona saves the viewer's persona; "" or the default clears it.
func (p *PlayerSupportController) setPersona(c echo.Context) error {
	var input struct {
		Persona string `json:"persona"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid persona"))
	}
	persona, err := playersupport.NormalizePersona(input.Persona)
	if err != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, err.Error()))
	}
	scope, err := p.scope(c, true)
	if err != nil {
		return supportError(c, err)
	}
	if err := savePersona(scope, persona); err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, p.personaAnswer(scope, persona))
}

// savePersona stores the viewer's persona, one row per user.
func savePersona(scope supportScope, persona string) error {
	row := models.PlayerSupportPersona{UserID: scope.user.ID, Persona: persona, UpdatedAt: time.Now()}
	return scope.spire.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"persona", "updated_at"}),
	}).Create(&row).Error
}
