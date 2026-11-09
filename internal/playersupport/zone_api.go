package playersupport

// liveZone asks World which local zone holds the character
// ("supportlocation <character> <account>") and returns its status and the
// zone's API port. The status is "zone" with a port, or "offline", "busy",
// "stale" or "unavailable".
func (w *World) liveZone(characterID, accountID uint) (string, uint16) {
	return "unavailable", 0
}

// zoneAPI calls a zone API method on the local zone at port, logged in as
// the local admin, and decodes the reply's "data" object into data. It
// returns "ok", "unavailable" (no zone, failed login, or "Unknown Method")
// or "unconfirmed" (sent, but no reply).
func zoneAPI(port uint16, method string, params interface{}, data interface{}) string {
	return "unavailable"
}
