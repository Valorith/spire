package playersupport

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/telnet"
	"golang.org/x/net/websocket"
)

// liveZone asks World which local zone holds the character
// ("supportlocation <character> <account>") and returns its status and the
// zone's API port. The status is "zone" with a port, or "offline", "busy",
// "stale" or "unavailable".
func (w *World) liveZone(characterID, accountID uint) (string, uint16) {
	address := w.address()
	if address == "" {
		return "unavailable", 0
	}
	console := telnet.NewClientWithAddress(w.logger, address)
	defer console.Close()
	return zoneOwner(console, characterID, accountID)
}

func zoneOwner(console *telnet.Client, characterID, accountID uint) (string, uint16) {
	owner := moveConsole(console, fmt.Sprintf("supportlocation %d %d", characterID, accountID))
	if owner.Status != "zone" {
		return owner.Status, 0
	}
	if owner.Port == 0 {
		return "unavailable", 0
	}
	return "zone", owner.Port
}

// zoneAPI calls a zone API method on the local zone at port, logged in as
// the local admin, and decodes the reply's "data" object into data. It
// returns "ok", "unavailable" (no zone, failed login, or "Unknown Method")
// or "unconfirmed" (sent, but no reply).
func zoneAPI(port uint16, method string, params interface{}, data interface{}) string {
	if port == 0 {
		return "unavailable"
	}
	address := net.JoinHostPort("127.0.0.1", strconv.Itoa(int(port)))
	config, err := websocket.NewConfig("ws://"+address+"/", "http://"+address)
	if err != nil {
		return "unavailable"
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	conn, err := config.DialContext(ctx)
	if err != nil {
		return "unavailable"
	}
	defer conn.Close()
	conn.MaxPayloadBytes = 16 * 1024
	if conn.SetDeadline(time.Now().Add(3*time.Second)) != nil {
		return "unavailable"
	}

	type request struct {
		Method string      `json:"method"`
		Params interface{} `json:"params"`
	}
	var login zoneAPIReply
	if websocket.JSON.Send(conn, request{Method: "login", Params: []string{"admin", ""}}) != nil ||
		websocket.JSON.Receive(conn, &login) != nil {
		return "unavailable"
	}
	var status struct {
		Status string `json:"status"`
	}
	if json.Unmarshal(login.Data, &status) != nil || status.Status != "Ok" {
		return "unavailable"
	}
	if websocket.JSON.Send(conn, request{Method: method, Params: params}) != nil {
		return "unconfirmed"
	}
	var reply zoneAPIReply
	if websocket.JSON.Receive(conn, &reply) != nil {
		return "unconfirmed"
	}
	return reply.decode(data)
}

// zoneAPIReply is a zone API response: "data" on success, "error" when the
// method threw or does not exist.
type zoneAPIReply struct {
	Data  json.RawMessage `json:"data"`
	Error string          `json:"error"`
}

func (r zoneAPIReply) decode(data interface{}) string {
	if strings.EqualFold(r.Error, "Unknown Method") {
		return "unavailable"
	}
	if r.Error != "" || len(r.Data) == 0 {
		return "unconfirmed"
	}
	if data != nil && json.Unmarshal(r.Data, data) != nil {
		return "unconfirmed"
	}
	return "ok"
}

// zoneStatus runs one zone API method for a character in game and returns
// the reply's status, or the reason the zone could not be asked.
func (w *World) zoneStatus(characterID, accountID uint, method string, params interface{}, data interface{ status() string }) string {
	owner, port := w.liveZone(characterID, accountID)
	if owner != "zone" {
		return supportOwnerStatus(owner)
	}
	if result := zoneAPI(port, method, params, data); result != "ok" {
		return result
	}
	if data.status() == "" {
		return "unavailable"
	}
	return data.status()
}

// supportOwnerStatus maps World's "supportlocation" answer when no zone holds
// the character.
func supportOwnerStatus(status string) string {
	switch status {
	case "offline", "busy", "stale":
		return status
	default:
		return "unavailable"
	}
}
