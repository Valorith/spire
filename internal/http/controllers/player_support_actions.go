package controllers

import (
	"net/http"

	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
)

// supportAction is one change to a player's data made from a case. Every
// such change has a reason, a timeline entry and an audit record.
type supportAction struct {
	// Kind is the timeline entry kind, such as "lockout".
	Kind string
	// RequestID is the client's 32-character hex request ID.
	RequestID string
	// Summary is the first timeline line, such as "Removed lockout ...".
	Summary string
	// Reason is the GM's reason, checked with validatePlayerOperationsReason.
	Reason string
	// Event is the audit event name, such as "PLAYER_SUPPORT_LOCKOUT".
	Event string
	// Details are added to the audit payload.
	Details map[string]interface{}
}

// supportActionResult is what an action's work reports.
type supportActionResult struct {
	// Delivery is "sent", "failed" or "unconfirmed".
	Delivery string
	// Message is appended to the timeline entry and returned to the client.
	Message string
	// Data holds extra response fields.
	Data map[string]interface{}
}

// runSupportAction records action on the case, runs work once, and writes
// the response. The caller has already checked the action's preconditions.
func (p *PlayerSupportController) runSupportAction(c echo.Context, scope supportScope, view supportCaseView, action supportAction, work func() supportActionResult) error {
	return supportError(c, echo.NewHTTPError(http.StatusNotImplemented, "This action is not available yet"))
}

// supportCharacterState says where the case's character is, which decides
// between an in-game change (patch) and a database change.
type supportCharacterState struct {
	// State is "in_zone", "zoning", "offline" or "unknown".
	State string
	// Online is the account's character in a zone, which may be an alt.
	Online    playersupport.OnlineCharacter
	InGame    bool
	AccountID uint
}

// characterState reports supportCharacterState for the case's character.
func (p *PlayerSupportController) characterState(scope supportScope, view supportCaseView) (supportCharacterState, error) {
	return supportCharacterState{State: "unknown"}, nil
}
