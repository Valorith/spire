package playersupport

import (
	"encoding/json"
	"strings"
)

// Features lists what the World's Player Support patch supports beyond
// moves, notices and live chat. A World without the patch, or with a patch
// older than the "supportfeatures" console command, reports none of them.
// docs/player-support-chat.md lists which tools each feature turns on.
type Features struct {
	// Patch is 0 when World has no patch or did not answer, 1 for a patch
	// with an older chat protocol, 2 for the patch without "supportfeatures",
	// and the number World reports otherwise (3 or later).
	Patch int `json:"patch"`
	// ClosePetition: "supportpetition close" clears a petition and refreshes
	// every zone's queue.
	ClosePetition bool `json:"close_petition"`
	// Lockouts: zone API "remove_support_lockout".
	Lockouts bool `json:"lockouts"`
	// Tasks: zone API "update_support_task".
	Tasks bool `json:"tasks"`
	// Revoke: zone API "set_support_revoked".
	Revoke bool `json:"revoke"`
	// CorpseExp: zone API "restore_support_corpse_exp".
	CorpseExp bool `json:"corpse_exp"`
	// Unbury: "supportmove" accepts a buried corpse and unburies it.
	Unbury bool `json:"unbury"`
	// Marquee: a tell World delivers from Spire is also shown to the
	// character as an on-screen marquee, "Game Master: <message>", cut to
	// MarqueeLength characters. Mail, notices and rejects get none.
	Marquee bool `json:"marquee"`
	// MailReplies: the patched UCS stores mail a player sends to GameMaster as
	// a mail row with charid 0, which Spire collects and files on the case.
	MailReplies bool `json:"mail_replies"`
	// MailNotice: "supportmailnotice" shows a character in a zone a chat line
	// and marquee about new mail.
	MailNotice bool `json:"mail_notice"`
	// Persona: "supportchat send" takes a sixth argument, the Game Master's
	// persona, shown on the tell as "(GM) <persona>".
	Persona bool `json:"persona"`
}

// MarqueeLength is the longest marquee World shows, prefix included; a longer
// one ends in "...". The tell keeps the full message.
const MarqueeLength = 120

// Features reports the local World's patch features. It is cached with the
// companion status and rechecked on the same schedule.
func (w *World) Features() Features {
	w.Companion()
	w.rosterMu.Lock()
	defer w.rosterMu.Unlock()
	return w.features
}

// classifyFeatures reads World's answer to "supportfeatures", sent only after
// the companion probe found a patch.
func classifyFeatures(reply string, err error, companion CompanionStatus) Features {
	if err != nil || !companion.Moves() {
		return Features{}
	}
	older := Features{Patch: 2}
	if companion == CompanionOutdated {
		older.Patch = 1
	}
	if strings.Contains(reply, "Command not found") {
		return older
	}
	var answer struct {
		Status   string   `json:"status"`
		Patch    int      `json:"patch"`
		Features []string `json:"features"`
	}
	if json.Unmarshal([]byte(reply), &answer) != nil || answer.Status != "ok" || answer.Patch < 3 {
		return older
	}
	features := Features{Patch: answer.Patch}
	for _, name := range answer.Features {
		switch name {
		case "close_petition":
			features.ClosePetition = true
		case "lockouts":
			features.Lockouts = true
		case "tasks":
			features.Tasks = true
		case "revoke":
			features.Revoke = true
		case "corpse_exp":
			features.CorpseExp = true
		case "unbury":
			features.Unbury = true
		case "marquee":
			features.Marquee = true
		case "mail_replies":
			features.MailReplies = true
		case "mail_notice":
			features.MailNotice = true
		case "persona":
			features.Persona = true
		}
	}
	return features
}
