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

type MoveTarget struct {
	CharacterID    uint          `json:"character_id"`
	AccountID      uint          `json:"account_id"`
	CorpseID       uint          `json:"corpse_id"`
	SourceZone     uint          `json:"source_zone"`
	SourceInstance uint          `json:"source_instance"`
	Destination    uint          `json:"destination"`
	ToPlayer       bool          `json:"-"`
	PlayerPosition *movePosition `json:"player_position,omitempty"`
}

type movePosition struct {
	ZoneID     uint    `json:"zone_id"`
	InstanceID uint    `json:"instance_id"`
	X          float32 `json:"x"`
	Y          float32 `json:"y"`
	Z          float32 `json:"z"`
	Heading    float32 `json:"heading"`
}

type moveConsoleReply struct {
	Status string `json:"status"`
	Port   uint16 `json:"port"`
}

type moveZoneReply struct {
	Status   string        `json:"status"`
	Location *movePosition `json:"location"`
}

// Move lets World update an unloaded target or identify the local zone that
// owns a live entity. The zone revalidates the target before applying the move.
func (w *World) Move(target MoveTarget) string {
	address := w.address()
	if address == "" {
		return "unavailable"
	}
	console := telnet.NewClientWithAddress(w.logger, address)
	defer console.Close()
	var playerPort uint16
	if target.ToPlayer {
		owner := moveConsole(console, fmt.Sprintf("supportlocation %d %d", target.CharacterID, target.AccountID))
		if owner.Status != "zone" {
			return owner.Status
		}
		if owner.Port == 0 {
			return "unavailable"
		}
		playerPort = owner.Port
		player := moveZoneCall(playerPort, "get_support_location", target)
		if player.Status != "located" || player.Location == nil {
			if player.Status == "offline" {
				return "offline"
			}
			return "unavailable"
		}
		target.PlayerPosition = player.Location
		target.Destination = player.Location.ZoneID
	}
	command := fmt.Sprintf("supportmove %d %d %d %d %d %d", target.CharacterID,
		target.AccountID, target.CorpseID, target.SourceZone, target.SourceInstance, target.Destination)
	if position := target.PlayerPosition; position != nil {
		command += fmt.Sprintf(" %d %.9g %.9g %.9g %.9g", position.InstanceID, position.X, position.Y, position.Z, position.Heading)
	}
	reply := moveConsole(console, command)
	status := reply.Status
	if status == "zone" {
		if reply.Port == 0 {
			return "unavailable"
		}
		status = moveZoneCall(reply.Port, "move_support_target", target).Status
	}
	if !target.ToPlayer || (status != "saved" && status != "moved") {
		return status
	}
	switch moveZoneCall(playerPort, "finish_support_corpse_move", target).Status {
	case "notified":
		return "moved_notified"
	case "spawned":
		return "moved_notice_unavailable"
	default:
		return "moved_arrival_unconfirmed"
	}
}

func moveConsole(console *telnet.Client, command string) moveConsoleReply {
	raw, err := console.Command(telnet.CommandConfig{Command: command, AllowEmptyResponse: true})
	if err != nil {
		return moveConsoleReply{Status: "unconfirmed"}
	}
	var reply moveConsoleReply
	if json.Unmarshal([]byte(raw), &reply) != nil || reply.Status == "" {
		return moveConsoleReply{Status: "unavailable"}
	}
	return reply
}

func moveZoneCall(port uint16, method string, target MoveTarget) moveZoneReply {
	unavailable := moveZoneReply{Status: "unavailable"}
	address := net.JoinHostPort("127.0.0.1", strconv.Itoa(int(port)))
	config, err := websocket.NewConfig("ws://"+address+"/", "http://"+address)
	if err != nil {
		return unavailable
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	conn, err := config.DialContext(ctx)
	if err != nil {
		return unavailable
	}
	defer conn.Close()
	conn.MaxPayloadBytes = 16 * 1024
	if conn.SetDeadline(time.Now().Add(3*time.Second)) != nil {
		return unavailable
	}

	type request struct {
		Method string      `json:"method"`
		Params interface{} `json:"params"`
	}
	type response struct {
		Data  moveZoneReply `json:"data"`
		Error string        `json:"error"`
	}
	var login response
	if websocket.JSON.Send(conn, request{Method: "login", Params: []string{"admin", ""}}) != nil ||
		websocket.JSON.Receive(conn, &login) != nil || login.Data.Status != "Ok" {
		return unavailable
	}
	var moved response
	if websocket.JSON.Send(conn, request{Method: method, Params: target}) != nil ||
		websocket.JSON.Receive(conn, &moved) != nil {
		return moveZoneReply{Status: "unconfirmed"}
	}
	if strings.EqualFold(moved.Error, "Unknown Method") {
		return unavailable
	}
	return moved.Data
}
