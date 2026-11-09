package playersupport

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
	return Features{}
}
