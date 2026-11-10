package controllers

import (
	"encoding/json"
	"sort"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
)

// ---------------------------------------------------------------------------
// Reply by mail in Live chat. A case's Reply by mail (and the mail a Resolve
// sends with a saved reply) is written by the Mail & Parcels writer, which
// records only its audit row: the timeline shows it from there as "Mail sent".
// Live chat reads conversation entries, so it adds those deliveries as Game
// Master mail messages, in order with the player's tells and mail. The audit
// keeps the subject and the mail's msgid but not its text, which is read from
// the game's mail table while the player still has the mail.

// supportMailReplyIDBase keeps these messages' ids apart from entry ids; the
// sum stays below 2^53 so JavaScript reads it exactly.
const supportMailReplyIDBase uint = 1_000_000_000_000_000

// supportMailReplyAudit is a delivered mail on the case's audit trail.
type supportMailReplyAudit struct {
	ID        uint      `gorm:"column:id"`
	Data      string    `gorm:"column:data"`
	CreatedAt time.Time `gorm:"column:created_at"`
	Actor     string    `gorm:"column:actor"`
}

// supportMailReplyBody is a mail row's text.
type supportMailReplyBody struct {
	MsgID uint   `gorm:"column:msgid"`
	Body  string `gorm:"column:body"`
}

// mailReplyMessages lists the case's delivered Reply by mail as Live chat
// messages: kind "chat_out", delivery "mail", with the subject. Text is ""
// when the player no longer has the mail. The automatic notices, also mailed
// for the case, are not replies and stay on the timeline only.
func (s supportScope) mailReplyMessages(view supportCaseView) ([]models.PlayerSupportEntry, error) {
	messages := []models.PlayerSupportEntry{}
	if view.ID == 0 {
		return messages, nil
	}
	var audits []supportMailReplyAudit
	err := s.spire.Table("spire_user_event_log AS events").
		Select("events.id, events.data, events.created_at, COALESCE(users.user_name, '') AS actor").
		Joins("LEFT JOIN spire_users AS users ON users.id = events.user_id").
		Where("events.support_case_id = ? AND events.server_database_connection_id = ? AND events.event_name = ? AND events.support_delivery_state = ?",
			view.ID, s.connectionID, mailParcelsEventGMSendMail, "sent").
		Order("events.id").Find(&audits).Error
	if err != nil || len(audits) == 0 {
		return messages, err
	}
	msgIDs := make([]uint, 0, len(audits))
	type reply struct {
		audit   supportMailReplyAudit
		subject string
		msgID   uint
	}
	replies := make([]reply, 0, len(audits))
	for _, audit := range audits {
		var payload mailParcelsAuditPayload
		if json.Unmarshal([]byte(audit.Data), &payload) != nil || !strings.HasPrefix(payload.Reason, "Player Support case ") {
			continue
		}
		replies = append(replies, reply{audit: audit, subject: payload.Subject, msgID: payload.RecordID})
		if payload.RecordID > 0 {
			msgIDs = append(msgIDs, payload.RecordID)
		}
	}
	bodies := map[uint]string{}
	if len(msgIDs) > 0 && s.eqemu != nil {
		var rows []supportMailReplyBody
		// The mail must still be the petition character's; a missing row
		// leaves the text empty.
		if s.eqemu.Table("mail").Select("msgid, COALESCE(body, '') AS body").
			Where("msgid IN ? AND charid = ?", msgIDs, view.CharacterID).Find(&rows).Error == nil {
			for _, row := range rows {
				bodies[row.MsgID] = row.Body
			}
		}
	}
	for _, item := range replies {
		actor := item.audit.Actor
		if actor == "" {
			actor = supportDefaultActor
		}
		messages = append(messages, models.PlayerSupportEntry{
			ID: supportMailReplyIDBase + item.audit.ID, CaseID: view.ID, Kind: "chat_out", Actor: actor,
			Text: bodies[item.msgID], Delivery: "mail", Recipient: view.Character, Subject: item.subject, CreatedAt: item.audit.CreatedAt,
		})
	}
	return messages, nil
}

// mergeChatMessages puts Reply by mail messages in time order with the
// conversation entries.
func mergeChatMessages(entries, replies []models.PlayerSupportEntry) []models.PlayerSupportEntry {
	if len(replies) == 0 {
		return entries
	}
	merged := append(append([]models.PlayerSupportEntry{}, entries...), replies...)
	sort.SliceStable(merged, func(i, j int) bool {
		if !merged[i].CreatedAt.Equal(merged[j].CreatedAt) {
			return merged[i].CreatedAt.Before(merged[j].CreatedAt)
		}
		return merged[i].ID < merged[j].ID
	})
	return merged
}
