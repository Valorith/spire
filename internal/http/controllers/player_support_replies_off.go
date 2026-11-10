package controllers

import (
	"context"
	"fmt"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
)

// ---------------------------------------------------------------------------
// Replies-closed notice: when Player replies goes from on to off, by "Turn off
// replies" or by resolving the case, the player is told in game (if a
// character on the account is in a zone) and always mailed. Neither failure
// undoes the change.

// supportRepliesOffSubject is the subject of the replies-closed mail.
const supportRepliesOffSubject = "Replies to your petition are closed"

// supportRepliesOffTell fits in a tell. petitionOpen is the in-game petition
// still being open: petitions are one per account, so a new one can only be
// filed once it is closed.
func supportRepliesOffTell(petitionOpen bool) string {
	if petitionOpen {
		return "Replies to the Game Master on your petition are now closed. A Game Master will contact you if more is needed. Once your petition is closed, file a new one with #petition for more help."
	}
	return "Your petition is closed, and replies to the Game Master are now closed. If you need more help, please file a new petition with #petition."
}

// supportRepliesOffMail is the fixed replies-closed mail. Like the account
// action notice, it never names the staff member.
func supportRepliesOffMail(character string, petitionOpen bool) string {
	body := "Hello " + character + ",\n\n" +
		"This is a notice from the Game Master team about your petition.\n\n"
	if petitionOpen {
		body += "Replies to the Game Master on your petition are now closed, so messages you send to the Game Master will not reach the team for now. If more information is needed, a Game Master will contact you.\n\n" +
			"Your petition is still open. Once it has been closed, please file a new petition in game with #petition if you need more help.\n\n"
	} else {
		body += "Your petition has been closed, and replies to the Game Master are now closed.\n\n" +
			"If you need more help, please file a new petition in game with #petition.\n\n"
	}
	return body + "The Game Master team"
}

// supportRepliesOffSummary says how the notice went, for the timeline and
// the answer. tell is "" when no character on the account could get one,
// otherwise its delivery ("sent", "failed" or "unconfirmed") to recipient.
func supportRepliesOffSummary(recipient, tell string, mailed bool) string {
	told := tell == "sent"
	var summary string
	switch {
	case told && mailed:
		summary = "The player was told in game and mailed a notice."
	case mailed:
		summary = "The player was mailed a notice."
	case told:
		summary = "The player was told in game, but the notice could not be mailed."
	default:
		summary = "The notice could not be mailed to the player."
	}
	switch tell {
	case "failed":
		summary += " The tell to " + recipient + " was not delivered."
	case "unconfirmed":
		summary += " The tell to " + recipient + " was not confirmed."
	}
	return summary
}

// supportPetitionRef identifies an in-game petition.
type supportPetitionRef struct {
	Dib      uint
	Senttime int64
}

// supportPetitionOpen reports whether the account's newest in-game petition
// is still the case's petition.
func supportPetitionOpen(scope supportScope, view supportCaseView) bool {
	var petition supportPetitionRef
	err := scope.eqemu.Table("petitions AS p").Select("p.dib, p.senttime").
		Joins("JOIN account AS acct ON acct.name = p.accountname").
		Where("acct.name = ?", view.Account).
		Order("p.dib DESC").Limit(1).Find(&petition).Error
	return err == nil && petition.Dib != 0 &&
		supportSourceKey(models.Petition{Dib: petition.Dib, Senttime: petition.Senttime}) == view.SourceKey
}

// supportAccountRef is an EQEmu account's id.
type supportAccountRef struct {
	ID uint
}

// supportNoticeAccount is the case's account id, 0 when it is gone.
func supportNoticeAccount(scope supportScope, view supportCaseView) (uint, error) {
	var account supportAccountRef
	err := scope.eqemu.Table("account").Select("id").Where("name = ?", view.Account).Limit(1).Find(&account).Error
	return account.ID, err
}

// tellAccount sends a Game Master tell to the account's character in a zone,
// the same way Live chat does. It returns "" when nobody can get one now.
func (p *PlayerSupportController) tellAccount(scope supportScope, accountID uint, id, text string) (string, string) {
	if p.world == nil || accountID == 0 || !p.localWorld(scope) {
		return "", ""
	}
	roster := p.world.Roster()
	online, ok := roster.InZone[accountID]
	if !roster.Known || !ok || online.TellsOff {
		return "", ""
	}
	if companionChatError(p.world.ChatCompanion()) != nil || !p.world.Ready() {
		return online.Name, "failed"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	// Sent on behalf of the Game Master who turned replies off: under their persona.
	return online.Name, tellDelivery(p.world.Send(ctx, id, accountID, online.ID, text, p.personaArgument(scope)))
}

// notifyRepliesOff sends the replies-closed notice for the "chat_off" entry
// entryID and adds how it went to that entry. It returns the same sentence.
// The tell and the mail are keyed by the entry, which exists once per change
// from on to off, so a retried request never sends them again.
func (p *PlayerSupportController) notifyRepliesOff(c echo.Context, scope supportScope, view supportCaseView, caseID, entryID uint) string {
	accountID, err := supportNoticeAccount(scope, view)
	if err != nil {
		c.Logger().Errorf("Player Support: replies-closed notice on case %s: %v", view.SourceKey, err)
	}
	open := supportPetitionOpen(scope, view)
	tell := p.tellPlayer
	if tell == nil {
		tell = p.tellAccount
	}
	recipient, delivery := tell(scope, accountID, fmt.Sprintf("replies-off-%d-%d", caseID, entryID), supportRepliesOffTell(open))
	send := p.mailNotice
	if send == nil {
		send = p.sendSupportNotice
	}
	mailErr := send(c, scope, view, supportNotice{
		CaseID: caseID, AccountID: accountID, Body: supportRepliesOffMail(view.Character, open),
		Subject: supportRepliesOffSubject, Reason: "Replies closed notice for Player Support case " + view.SourceKey,
		Key: fmt.Sprintf("%d-replies-off-%d", caseID, entryID),
		// A delivered tell already showed the player a marquee.
		NoAlert: delivery == "sent",
	})
	if mailErr != nil {
		c.Logger().Errorf("Player Support: replies-closed notice on case %s could not be mailed: %v", view.SourceKey, mailErr)
	}
	summary := supportRepliesOffSummary(recipient, delivery, mailErr == nil)
	ctx, cancel := context.WithTimeout(context.WithoutCancel(c.Request().Context()), 3*time.Second)
	defer cancel()
	if err := scope.spire.WithContext(ctx).Model(&models.PlayerSupportEntry{}).Where("id = ?", entryID).
		Update("text", supportRepliesOffText+"\n"+summary).Error; err != nil {
		c.Logger().Errorf("Player Support: could not record the replies-closed notice on case %s: %v", view.SourceKey, err)
	}
	return summary
}

// supportRepliesOffText is the timeline text of a "chat_off" entry.
const supportRepliesOffText = "Turned off player replies"
