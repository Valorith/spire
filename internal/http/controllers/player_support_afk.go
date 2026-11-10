package controllers

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"gorm.io/gorm"
)

// ---------------------------------------------------------------------------
// AFK forwarding. A player who is AFK answers a tell by themselves at once:
// the client sends "Sorry, I am A.F.K. (Away From Keyboard) right now." back
// to the sender, so it reaches Spire as a reply. That is not the player
// writing: it is not recorded, and each Game Master tell it answers is
// mailed to the character instead, through the offline mail path.

const (
	// supportAFKText is the stock RoF2 answer; a text starting with
	// supportAFKPrefix counts too.
	supportAFKText   = "Sorry, I am A.F.K. (Away From Keyboard) right now."
	supportAFKPrefix = "Sorry, I am A.F.K."
	// supportAFKTextWindow is how long after a tell the stock text counts as
	// its answer. Any reply within supportAFKFastWindow counts, whatever it
	// says: nobody types that fast, and a custom /afk text can say anything.
	supportAFKTextWindow = 30 * time.Second
	supportAFKFastWindow = 2 * time.Second

	supportAFKMailSubject = "Message about your petition"
	supportAFKMailPrefix  = "The following message was sent to you by a Game Master regarding your open petition, but you were AFK: "
)

// A sent tell's AFK state (PlayerSupportEntry.Afk): claimed, then mailed or
// failed. Empty means no AFK answer was seen.
const (
	supportAFKPending = "pending"
	supportAFKMailed  = "mailed"
	supportAFKFailed  = "failed"
)

// supportIsAFKReply reports whether a reply received at receivedAt is the
// player's client answering a tell sent at sentAt by itself.
func supportIsAFKReply(text string, sentAt, receivedAt time.Time) bool {
	gap := receivedAt.Sub(sentAt)
	if gap < 0 {
		// Spire's and the database's clocks can disagree by a little.
		gap = 0
	}
	trimmed := strings.ToLower(strings.TrimSpace(text))
	stock := trimmed == strings.ToLower(supportAFKText) || strings.HasPrefix(trimmed, strings.ToLower(supportAFKPrefix))
	return (stock && gap <= supportAFKTextWindow) || gap <= supportAFKFastWindow
}

// supportAccountName is an EQEmu account's name.
type supportAccountName struct {
	Name string `gorm:"column:name"`
}

// forwardAFK handles a reply that is an AFK answer to Game Master tells: each
// such tell not forwarded yet is mailed to the character, once. It reports
// whether the reply was an AFK answer, in which case it is not a player
// message.
func (p *PlayerSupportController) forwardAFK(ctx context.Context, eqemu, db *gorm.DB, frame playersupport.Frame, now time.Time) bool {
	if eqemu == nil || db == nil || frame.CharacterID == 0 || frame.AccountID == 0 {
		return false
	}
	eqemu, db = eqemu.WithContext(ctx), db.WithContext(ctx)
	var account supportAccountName
	if eqemu.Table("account").Select("name").Where("id = ?", frame.AccountID).Limit(1).Find(&account).Error != nil || account.Name == "" {
		return false
	}
	// The tells to this character on the account's cases that an answer now
	// could still be for. A tell's delivery can still read "pending": World
	// passes the AFK answer on before Spire has recorded the tell as sent.
	var tells []models.PlayerSupportEntry
	err := db.Table("spire_player_support_entries AS entries").Select("entries.*").
		Joins("JOIN spire_player_support_cases AS cases ON cases.id = entries.case_id").
		Where("cases.account = ? AND entries.kind = ? AND entries.recipient = ? AND entries.delivery <> ? AND entries.created_at >= ?",
			account.Name, "chat_out", frame.Character, "failed", now.Add(-supportAFKTextWindow)).
		Order("entries.id").Find(&tells).Error
	if err != nil {
		return false
	}
	answered := false
	for _, tell := range tells {
		if !supportIsAFKReply(frame.Text, tell.CreatedAt, now) {
			continue
		}
		answered = true
		if tell.Afk != "" {
			continue
		}
		p.forwardAFKTell(eqemu, db, frame, tell, now)
	}
	if answered && p.world != nil {
		p.world.Notify()
	}
	return answered
}

// forwardAFKTell mails one tell, claimed first so a tell is forwarded once
// even when several Spire processes or answers race, and records how it went
// on the tell and on the timeline.
func (p *PlayerSupportController) forwardAFKTell(eqemu, db *gorm.DB, frame playersupport.Frame, tell models.PlayerSupportEntry, now time.Time) {
	claim := db.Model(&models.PlayerSupportEntry{}).Where("id = ? AND (afk IS NULL OR afk = '')", tell.ID).Update("afk", supportAFKPending)
	if claim.Error != nil || claim.RowsAffected != 1 {
		return
	}
	row := gmMailInsert{
		CharID: frame.CharacterID, Timestamp: now.Unix(), From: playersupport.Identity,
		Subject: supportAFKMailSubject, Body: supportAFKMailPrefix + tell.Text, To: frame.Character, Status: mailStatusUnread,
	}
	state, delivery := supportAFKMailed, "mail"
	text := "Player was AFK: the Game Master tell was mailed to " + frame.Character + "\n" + tell.Text
	if err := eqemu.Table("mail").Create(&row).Error; err != nil {
		state, delivery = supportAFKFailed, "failed"
		text = "Player was AFK: the Game Master tell could not be mailed to " + frame.Character + "\n" + tell.Text
	} else {
		p.alertMail(eqemu, []uint{row.CharID}, row.From)
	}
	db.Model(&models.PlayerSupportEntry{}).Where("id = ?", tell.ID).Updates(map[string]interface{}{"afk": state, "afk_at": now})
	key := "afk-" + strconv.FormatUint(uint64(tell.ID), 10)
	db.Create(&models.PlayerSupportEntry{
		CaseID: tell.CaseID, Kind: "afk_mail", Actor: playersupport.DisplayName, Text: text,
		Delivery: delivery, Recipient: frame.Character, RequestKey: &key,
	})
}
