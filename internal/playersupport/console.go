package playersupport

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/telnet"
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

// Results of MailNotice.
const (
	MailNoticeShown       = "shown"
	MailNoticeBusy        = "busy"
	MailNoticeOffline     = "offline"
	MailNoticeStale       = "stale"
	MailNoticeUnavailable = "unavailable"
	MailNoticeUnconfirmed = "unconfirmed"
	// MailNoticeNoCommand: World answered without "supportmailnotice".
	MailNoticeNoCommand = "no_command"
)

// MailNoticeSender makes a mail's sender acceptable to "supportmailnotice":
// at most 64 printable ASCII characters and no '%'. It returns "" when nothing
// usable is left, and the notice then names no sender.
func MailNoticeSender(name string) string {
	kept := strings.Map(func(r rune) rune {
		if r < 32 || r > 126 || r == '%' {
			return -1
		}
		return r
	}, name)
	kept = strings.Join(strings.Fields(kept), " ")
	if len(kept) > 64 {
		return ""
	}
	return kept
}

// MailNotice asks World to tell a character in a zone that new mail arrived
// ("supportmailnotice <character id> [sender]"), with a chat line and a
// marquee. It never retries; World answers at once.
func (w *World) MailNotice(characterID uint, sender string) string {
	if characterID == 0 {
		return MailNoticeStale
	}
	address := w.address()
	if address == "" {
		return MailNoticeUnavailable
	}
	command := fmt.Sprintf("supportmailnotice %d", characterID)
	if sender = MailNoticeSender(sender); sender != "" {
		command += " " + sender
	}
	console := telnet.NewClientWithAddress(w.logger, address)
	defer console.Close()
	reply, err := console.Command(telnet.CommandConfig{Command: command, AllowEmptyResponse: true})
	return classifyMailNotice(reply, err)
}

func classifyMailNotice(reply string, err error) string {
	if err != nil {
		return MailNoticeUnconfirmed
	}
	if strings.Contains(reply, "Command not found") {
		return MailNoticeNoCommand
	}
	var answer struct {
		Status string `json:"status"`
	}
	if json.Unmarshal([]byte(strings.TrimSpace(reply)), &answer) != nil {
		return MailNoticeUnavailable
	}
	switch answer.Status {
	case MailNoticeShown, MailNoticeBusy, MailNoticeOffline, MailNoticeStale:
		return answer.Status
	default:
		return MailNoticeUnavailable
	}
}

// World's console kick copies the name into a 64-byte buffer.
var kickName = regexp.MustCompile(`^[A-Za-z]{1,63}$`)

// ClosePetition asks World to delete the petition and refresh every zone's
// petition queue ("supportpetition close <dib> <senttime> <account id>").
func (w *World) ClosePetition(dib uint, senttime int64, accountID uint) string {
	if dib == 0 || senttime < 0 || accountID == 0 {
		return PetitionStale
	}
	address := w.address()
	if address == "" {
		return PetitionUnavailable
	}
	console := telnet.NewClientWithAddress(w.logger, address)
	defer console.Close()
	reply, err := console.Command(telnet.CommandConfig{
		Command:            fmt.Sprintf("supportpetition close %d %d %d", dib, senttime, accountID),
		AllowEmptyResponse: true,
	})
	return classifyPetitionClose(reply, err)
}

func classifyPetitionClose(reply string, err error) string {
	if err != nil {
		return PetitionUnconfirmed
	}
	if strings.Contains(reply, "Command not found") {
		return PetitionNoCommand
	}
	var answer struct {
		Status string `json:"status"`
	}
	if json.Unmarshal([]byte(reply), &answer) != nil {
		return PetitionUnavailable
	}
	switch answer.Status {
	case PetitionClosed, PetitionCheckedOut, PetitionGone, PetitionStale, PetitionUnavailable:
		return answer.Status
	default:
		return PetitionUnavailable
	}
}

// Kick sends the stock console "kick <name>" to the local World.
func (w *World) Kick(name string) string {
	return kick(w.address(), w.logger, name)
}

// KickCharacter is Kick for callers without a World, such as Player
// Operations. It reaches only the local World named in the server config.
func KickCharacter(config *eqemuserverconfig.Config, log *logger.AppLogger, name string) string {
	return kick(loopbackConsoleAddress(config), log, name)
}

func kick(address string, log *logger.AppLogger, name string) string {
	if !kickName.MatchString(name) {
		return KickInvalid
	}
	if address == "" {
		return KickUnavailable
	}
	console := telnet.NewClientWithAddress(log, address)
	defer console.Close()
	// World prints nothing for a kick it sent to the zones.
	reply, err := console.Command(telnet.CommandConfig{Command: "kick " + name, AllowEmptyResponse: true})
	if err != nil || strings.Contains(reply, "Command not found") || strings.Contains(reply, "Access denied") {
		return KickUnavailable
	}
	return KickRequested
}
