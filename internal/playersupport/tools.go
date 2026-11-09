package playersupport

import (
	"encoding/json"
	"strings"

	"github.com/EQEmuTools/spire/internal/telnet"
)

// TaskUpdate is one change to a character's active task, applied in game by
// the zone API method "update_support_task".
type TaskUpdate struct {
	CharacterID uint `json:"character_id"`
	AccountID   uint `json:"account_id"`
	TaskID      uint `json:"task_id"`
	// Action is "reset_activity", "update_activity" or "remove_task".
	Action string `json:"action"`
	// ActivityID is the activity for activity actions, and -1 otherwise.
	ActivityID int `json:"activity_id"`
	// Count is the amount to add for "update_activity", and 0 otherwise.
	Count int `json:"count"`
	// ExpectedDone is the activity's done count the GM saw.
	ExpectedDone int `json:"expected_done"`
}

// TaskResult is the zone's answer to a TaskUpdate.
type TaskResult struct {
	Status        string `json:"status"`
	DoneCount     int    `json:"done_count"`
	TaskActive    bool   `json:"task_active"`
	TaskCompleted bool   `json:"task_completed"`
}

func (r *TaskResult) status() string { return r.Status }

type zoneStatusReply struct {
	Status string `json:"status"`
}

func (r *zoneStatusReply) status() string { return r.Status }

type corpseExpReply struct {
	Status string `json:"status"`
	Exp    int64  `json:"exp"`
}

func (r *corpseExpReply) status() string { return r.Status }

type supportCharacterParams struct {
	CharacterID uint `json:"character_id"`
	AccountID   uint `json:"account_id"`
}

// RemoveLockout removes an expedition lockout from a character in game.
func (w *World) RemoveLockout(characterID, accountID uint, expedition, event string) string {
	params := struct {
		supportCharacterParams
		Expedition string `json:"expedition"`
		Event      string `json:"event"`
	}{supportCharacterParams{characterID, accountID}, expedition, event}
	return w.zoneStatus(characterID, accountID, "remove_support_lockout", params, &zoneStatusReply{})
}

// UpdateTask changes a task for a character in game.
func (w *World) UpdateTask(update TaskUpdate) TaskResult {
	var reply TaskResult
	status := w.zoneStatus(update.CharacterID, update.AccountID, "update_support_task", update, &reply)
	if status != reply.Status {
		return TaskResult{Status: status}
	}
	return reply
}

// RestoreCorpseExp returns a corpse's experience to its character in game and
// reports the status and the experience returned.
func (w *World) RestoreCorpseExp(characterID, accountID, corpseID uint) (string, int64) {
	params := struct {
		supportCharacterParams
		CorpseID uint `json:"corpse_id"`
	}{supportCharacterParams{characterID, accountID}, corpseID}
	var reply corpseExpReply
	status := w.zoneStatus(characterID, accountID, "restore_support_corpse_exp", params, &reply)
	if status != "restored" {
		return status, 0
	}
	return status, reply.Exp
}

// SetRevoked turns the account's OOC, auction and shout block on or off for
// its character in game, and saves it.
func (w *World) SetRevoked(characterID, accountID uint, revoked bool) string {
	params := struct {
		supportCharacterParams
		Revoked bool `json:"revoked"`
	}{supportCharacterParams{characterID, accountID}, revoked}
	return w.zoneStatus(characterID, accountID, "set_support_revoked", params, &zoneStatusReply{})
}

// ReloadBucketCache asks every zone to drop its data bucket cache (stock
// console "api reload 7"). It returns "sent" or "unavailable".
func (w *World) ReloadBucketCache() string {
	address := w.address()
	if address == "" {
		return "unavailable"
	}
	console := telnet.NewClientWithAddress(w.logger, address)
	defer console.Close()
	raw, err := console.Command(telnet.CommandConfig{Command: "api reload 7", EnforceJson: true})
	return classifyBucketReload(raw, err)
}

func classifyBucketReload(raw string, err error) string {
	if err != nil {
		return "unavailable"
	}
	var reply struct {
		Method string `json:"method"`
		Data   struct {
			Message string `json:"message"`
		} `json:"data"`
		Error string `json:"error"`
	}
	if json.Unmarshal([]byte(raw), &reply) != nil || reply.Method != "reload" || reply.Error != "" ||
		!strings.HasPrefix(reply.Data.Message, "Reloading") {
		return "unavailable"
	}
	return "sent"
}
