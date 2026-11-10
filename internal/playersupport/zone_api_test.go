package playersupport

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/logger"
	"golang.org/x/net/websocket"
)

// fakeConsole answers World console commands on a local listener, one
// connection at a time, with reply(command).
func fakeConsole(t *testing.T, reply func(command string) string) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = listener.Close() })
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			go func(conn net.Conn) {
				defer conn.Close()
				_ = conn.SetDeadline(time.Now().Add(3 * time.Second))
				_, _ = fmt.Fprint(conn, "Connection established from localhost, assuming admin\n\r> ")
				reader := bufio.NewReader(conn)
				for {
					line, err := reader.ReadString('\n')
					if err != nil {
						return
					}
					command := strings.TrimSpace(line)
					if command == "echo off" || command == "acceptmessages off" {
						_, _ = fmt.Fprint(conn, "> ")
						continue
					}
					_, _ = fmt.Fprint(conn, reply(command)+"\n\r> ")
				}
			}(conn)
		}
	}()
	return listener.Addr().String()
}

// fakeZone serves the zone API: it accepts the admin login, records the
// method call and answers with reply. A nil reply closes the connection
// without answering.
func fakeZone(t *testing.T, calls chan<- map[string]interface{}, reply interface{}) uint16 {
	t.Helper()
	server := httptest.NewServer(websocket.Handler(func(ws *websocket.Conn) {
		var login struct {
			Method string   `json:"method"`
			Params []string `json:"params"`
		}
		if websocket.JSON.Receive(ws, &login) != nil || login.Method != "login" {
			return
		}
		_ = websocket.JSON.Send(ws, map[string]interface{}{"data": map[string]string{"status": "Ok"}})
		var call map[string]interface{}
		if websocket.JSON.Receive(ws, &call) != nil {
			return
		}
		if calls != nil {
			calls <- call
		}
		if reply != nil {
			_ = websocket.JSON.Send(ws, reply)
		}
	}))
	t.Cleanup(server.Close)
	address, err := url.Parse(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	port, err := strconv.Atoi(address.Port())
	if err != nil {
		t.Fatal(err)
	}
	return uint16(port)
}

func testWorld(address string) *World {
	return &World{address: func() string { return address }, logger: logger.NewAppLogger()}
}

func zoneOwnerReply(port uint16) func(string) string {
	return func(command string) string {
		if command == "supportlocation 22 7" {
			return fmt.Sprintf(`{"status":"zone","port":%d}`, port)
		}
		return `{"status":"stale"}`
	}
}

func TestLockoutAndTaskZoneReplies(t *testing.T) {
	data := func(body string) interface{} { return map[string]json.RawMessage{"data": json.RawMessage(body)} }
	for _, test := range []struct {
		name  string
		reply interface{}
		want  string
	}{
		{"removed", data(`{"status":"removed"}`), "removed"},
		{"already gone", data(`{"status":"gone"}`), "gone"},
		{"left the zone", data(`{"status":"offline"}`), "offline"},
		{"database failure", data(`{"status":"unavailable"}`), "unavailable"},
		{"zone without the patch", map[string]string{"error": "Unknown Method"}, "unavailable"},
		{"method threw", map[string]string{"error": "boom"}, "unconfirmed"},
		{"empty status", data(`{}`), "unavailable"},
		{"no answer", nil, "unconfirmed"},
	} {
		t.Run(test.name, func(t *testing.T) {
			calls := make(chan map[string]interface{}, 1)
			port := fakeZone(t, calls, test.reply)
			world := testWorld(fakeConsole(t, zoneOwnerReply(port)))
			if got := world.RemoveLockout(22, 7, "Veeshan's Peak", "Replay Timer"); got != test.want {
				t.Fatalf("RemoveLockout() = %q, want %q", got, test.want)
			}
			call := <-calls
			params, _ := call["params"].(map[string]interface{})
			if call["method"] != "remove_support_lockout" || params["character_id"] != float64(22) || params["account_id"] != float64(7) ||
				params["expedition"] != "Veeshan's Peak" || params["event"] != "Replay Timer" {
				t.Fatalf("unexpected call %v", call)
			}
		})
	}

	t.Run("task update", func(t *testing.T) {
		calls := make(chan map[string]interface{}, 1)
		port := fakeZone(t, calls, data(`{"status":"updated","done_count":3,"task_active":false,"task_completed":true}`))
		world := testWorld(fakeConsole(t, zoneOwnerReply(port)))
		got := world.UpdateTask(TaskUpdate{CharacterID: 22, AccountID: 7, TaskID: 140, Action: "update_activity", ActivityID: 1, Count: 2, ExpectedDone: 1})
		if got != (TaskResult{Status: "updated", DoneCount: 3, TaskCompleted: true}) {
			t.Fatalf("UpdateTask() = %+v", got)
		}
		call := <-calls
		params, _ := call["params"].(map[string]interface{})
		if call["method"] != "update_support_task" || params["task_id"] != float64(140) || params["action"] != "update_activity" ||
			params["activity_id"] != float64(1) || params["count"] != float64(2) || params["expected_done"] != float64(1) {
			t.Fatalf("unexpected call %v", call)
		}
	})

	for _, status := range []string{"stale", "gone", "inactive", "shared", "busy"} {
		port := fakeZone(t, nil, data(`{"status":"`+status+`","done_count":9}`))
		world := testWorld(fakeConsole(t, zoneOwnerReply(port)))
		if got := world.UpdateTask(TaskUpdate{CharacterID: 22, AccountID: 7, TaskID: 140, Action: "remove_task", ActivityID: -1}); got.Status != status {
			t.Errorf("UpdateTask() status = %q, want %q", got.Status, status)
		}
	}

	t.Run("task method missing", func(t *testing.T) {
		port := fakeZone(t, nil, map[string]string{"error": "Unknown Method"})
		world := testWorld(fakeConsole(t, zoneOwnerReply(port)))
		if got := world.UpdateTask(TaskUpdate{CharacterID: 22, AccountID: 7, TaskID: 140, Action: "remove_task", ActivityID: -1}); got.Status != "unavailable" {
			t.Fatalf("UpdateTask() = %+v, want unavailable", got)
		}
	})

	t.Run("character not in a zone", func(t *testing.T) {
		for reply, want := range map[string]string{
			`{"status":"offline"}`:          "offline",
			`{"status":"busy"}`:             "busy",
			`{"status":"zone","port":0}`:    "unavailable",
			"Command not found: supportloc": "unavailable",
		} {
			world := testWorld(fakeConsole(t, func(string) string { return reply }))
			if got := world.RemoveLockout(22, 7, "A", "B"); got != want {
				t.Errorf("RemoveLockout() with World reply %s = %q, want %q", reply, got, want)
			}
		}
		if got := testWorld("").UpdateTask(TaskUpdate{CharacterID: 22, AccountID: 7}); got.Status != "unavailable" {
			t.Errorf("UpdateTask() without a local World = %+v", got)
		}
	})

	t.Run("corpse experience and revoke", func(t *testing.T) {
		port := fakeZone(t, nil, data(`{"status":"restored","exp":123456789012}`))
		world := testWorld(fakeConsole(t, zoneOwnerReply(port)))
		if status, exp := world.RestoreCorpseExp(22, 7, 42); status != "restored" || exp != 123456789012 {
			t.Fatalf("RestoreCorpseExp() = %q, %d", status, exp)
		}
		port = fakeZone(t, nil, data(`{"status":"already","exp":5}`))
		world = testWorld(fakeConsole(t, zoneOwnerReply(port)))
		if status, exp := world.RestoreCorpseExp(22, 7, 42); status != "already" || exp != 0 {
			t.Fatalf("RestoreCorpseExp() = %q, %d", status, exp)
		}
		calls := make(chan map[string]interface{}, 1)
		port = fakeZone(t, calls, data(`{"status":"applied"}`))
		world = testWorld(fakeConsole(t, zoneOwnerReply(port)))
		if status := world.SetRevoked(22, 7, true); status != "applied" {
			t.Fatalf("SetRevoked() = %q", status)
		}
		if params, _ := (<-calls)["params"].(map[string]interface{}); params["revoked"] != true {
			t.Fatalf("SetRevoked params = %v", params)
		}
	})
}
