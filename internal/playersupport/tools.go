package playersupport

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

// RemoveLockout removes an expedition lockout from a character in game.
func (w *World) RemoveLockout(characterID, accountID uint, expedition, event string) string {
	return "unavailable"
}

// UpdateTask changes a task for a character in game.
func (w *World) UpdateTask(update TaskUpdate) TaskResult {
	return TaskResult{Status: "unavailable"}
}

// RestoreCorpseExp returns a corpse's experience to its character in game and
// reports the status and the experience returned.
func (w *World) RestoreCorpseExp(characterID, accountID, corpseID uint) (string, int64) {
	return "unavailable", 0
}

// SetRevoked turns the account's OOC, auction and shout block on or off for
// its character in game, and saves it.
func (w *World) SetRevoked(characterID, accountID uint, revoked bool) string {
	return "unavailable"
}

// ReloadBucketCache asks every zone to drop its data bucket cache (stock
// console "api reload 7").
func (w *World) ReloadBucketCache() string {
	return "unavailable"
}
