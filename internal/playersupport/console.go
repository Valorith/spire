package playersupport

import (
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/logger"
)

// Results of ClosePetition.
const (
	PetitionClosed      = "closed"
	PetitionCheckedOut  = "checked_out"
	PetitionGone        = "gone"
	PetitionStale       = "stale"
	PetitionUnavailable = "unavailable"
	PetitionUnconfirmed = "unconfirmed"
	// PetitionNoCommand: World answered without the "supportpetition" command.
	PetitionNoCommand = "no_command"
)

// Results of Kick and KickCharacter.
const (
	KickRequested   = "requested"
	KickInvalid     = "invalid"
	KickUnavailable = "unavailable"
)

// ClosePetition asks World to delete the petition and refresh every zone's
// petition queue ("supportpetition close <dib> <senttime> <account id>").
func (w *World) ClosePetition(dib uint, senttime int64, accountID uint) string {
	return PetitionUnavailable
}

// Kick sends the stock console "kick <name>" to the local World.
func (w *World) Kick(name string) string {
	return KickUnavailable
}

// KickCharacter is Kick for callers without a World, such as Player
// Operations. It reaches only the local World named in the server config.
func KickCharacter(config *eqemuserverconfig.Config, log *logger.AppLogger, name string) string {
	return KickUnavailable
}
