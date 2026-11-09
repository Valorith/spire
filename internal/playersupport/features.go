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
}

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
		}
	}
	return features
}
