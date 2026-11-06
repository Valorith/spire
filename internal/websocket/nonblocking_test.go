package websocket

import (
	"encoding/json"
	"testing"

	"github.com/EQEmuTools/spire/internal/logger"
)

func TestTryBroadcastDoesNotWaitForBrowserManager(t *testing.T) {
	manager := NewClientManager(logger.NewAppLogger())
	// No consumer is running: a regular Broadcast would block indefinitely.
	manager.TryBroadcast("stopTimer", `{"time":0}`)
	manager.broadcast = make(chan string, 1)
	manager.TryBroadcast("stopTimer", `{"time":123}`)
	manager.TryBroadcast("stopTimer", `{"time":456}`) // Full channel must also be nonblocking.
	var message Message
	if err := json.Unmarshal([]byte(<-manager.broadcast), &message); err != nil {
		t.Fatal(err)
	}
	if message.Type != "stopTimer" || message.Message != `{"time":123}` {
		t.Fatalf("unexpected message: %+v", message)
	}
}
