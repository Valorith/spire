package controllers

import (
	"time"

	"github.com/EQEmuTools/spire/internal/playersupport"
	"gorm.io/gorm"
)

// ---------------------------------------------------------------------------
// New-mail alert: after Spire writes mail for characters on the database of
// the World it runs beside, a character in a zone is shown a chat line and a
// marquee ("supportmailnotice", World feature "mail_notice"). It is best
// effort: it runs after the mail is committed, in the background, and never
// changes the send's result. Nothing is recorded on the case.

// supportMailAlertBlind caps how many recipients are alerted when Spire cannot
// see the World roster, such as a server-wide broadcast while World is down.
const supportMailAlertBlind = 10

// supportMailAlertSender is the sender the new-mail alert names: World says
// "You have received a new mail message from <sender>.", so mail from
// GameMaster reads "from a Game Master". The mail itself keeps its sender,
// which is what the player's Reply addresses. World joins the words of the
// sender with single spaces.
func supportMailAlertSender(from string) string {
	if from == playersupport.Identity {
		from = supportMailAlertGameMaster
	}
	return playersupport.MailNoticeSender(from)
}

// supportMailAlertGameMaster names GameMaster in the new-mail alert.
const supportMailAlertGameMaster = "a " + playersupport.DisplayName

// alertMail sends the new-mail alert for mail just committed to db.
func (p *PlayerSupportController) alertMail(db *gorm.DB, characterIDs []uint, from string) {
	if p.notifyMail != nil {
		p.notifyMail(db, characterIDs, from)
		return
	}
	if p.world == nil || p.db == nil || len(characterIDs) == 0 {
		return
	}
	go p.sendMailAlerts(db, characterIDs, from)
}

func (p *PlayerSupportController) sendMailAlerts(db *gorm.DB, characterIDs []uint, from string) {
	selected := worldDatabase(db)
	if selected == "" || selected != worldDatabase(p.db.GetEqemuDb()) || !p.world.Features().MailNotice {
		return
	}
	ids := uniquePositiveIDs(characterIDs)
	roster := p.world.Roster()
	inZone := map[uint]bool{}
	for _, online := range roster.InZone {
		inZone[online.ID] = true
	}
	if !roster.Known && len(ids) > supportMailAlertBlind {
		ids = ids[:supportMailAlertBlind]
	}
	sender := supportMailAlertSender(from)
	for _, id := range ids {
		if roster.Known && !inZone[id] {
			continue
		}
		status := p.world.MailNotice(id, sender)
		if status == playersupport.MailNoticeBusy {
			// Zoning: one more try once the zone has had a moment.
			time.Sleep(2 * time.Second)
			status = p.world.MailNotice(id, sender)
		}
		if p.log != nil {
			p.log.Debug().Uint("character_id", id).Str("status", status).Msg("Player Support new-mail alert")
		}
	}
}
