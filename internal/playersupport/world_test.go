package playersupport

import (
	"bufio"
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/eqemuserver"
	"github.com/EQEmuTools/spire/internal/logger"
)

func TestPresenceDistinguishesAccountFromCharacter(t *testing.T) {
	var rows eqemuserver.WorldClientList
	err := json.Unmarshal([]byte(`{"method":"get_client_list","data":[
		{"account_id":7,"online":5,"character_id":22},
		{"account_id":7,"online":1,"character_id":21},
		{"account_id":8,"online":3},
		{"account_id":9,"online":6,"character_id":40},
		{"account_id":10,"online":5,"character_id":41,"tells_off":1}
	]}`), &rows)
	if err != nil {
		t.Fatal(err)
	}
	presence := presenceFromRoster(rows)
	if !presence.Known || !presence.Accounts[7] || !presence.Characters[22] || presence.Characters[21] {
		t.Fatalf("account and character presence conflated: %+v", presence)
	}
	if !presence.Accounts[8] || presence.Accounts[9] || !presence.Accounts[10] || presence.Characters[41] {
		t.Fatalf("incorrect World session classification: %+v", presence)
	}
}

func TestRosterRequestsFullWorldClientList(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	done := make(chan error, 1)
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			done <- err
			return
		}
		defer conn.Close()
		_ = conn.SetDeadline(time.Now().Add(3 * time.Second))
		_, _ = fmt.Fprint(conn, "assuming admin\n\r> ")
		reader := bufio.NewReader(conn)
		for _, expected := range []string{"echo off", "acceptmessages off", "api get_client_list full"} {
			line, err := reader.ReadString('\n')
			if err != nil || !strings.HasSuffix(strings.TrimSpace(line), expected) {
				done <- fmt.Errorf("expected %q, got %q: %v", expected, line, err)
				return
			}
			if expected != "api get_client_list full" {
				_, _ = fmt.Fprint(conn, "> ")
			}
		}
		_, err = fmt.Fprint(conn, `{"method":"get_client_list","data":[{"account_id":7,"character_id":22,"online":5,"tells_off":0}]}`+"\n\r> ")
		done <- err
	}()
	world := &World{address: func() string { return listener.Addr().String() }, logger: logger.NewAppLogger()}
	presence := world.Roster()
	if world.rosterClient != nil {
		defer world.rosterClient.Close()
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	if !presence.Known || !presence.Accounts[7] || !presence.Characters[22] {
		t.Fatalf("full World roster did not report the logged-in character: %+v", presence)
	}
}

func TestStructuredSupportChatRoundTrip(t *testing.T) {
	const acceptedID = "21aa1111-2222-4333-8444-555555555555"
	const rejectedID = "21aa1111-2222-4333-8444-555555555556"
	client, server := net.Pipe()
	defer client.Close()
	message := "Your parcel is 100% ready."
	serverDone := make(chan error, 1)
	go func() {
		defer server.Close()
		_ = server.SetDeadline(time.Now().Add(4 * time.Second))
		_, _ = fmt.Fprint(server, "Connection established from localhost, assuming admin\n\r> ")
		scan := bufio.NewScanner(server)
		if !scan.Scan() || scan.Text() != "echo off" || !scan.Scan() || scan.Text() != "supportchat listen" {
			serverDone <- errors.New("wrong console handshake")
			return
		}
		_, _ = fmt.Fprint(server, "> SPIRE_SUPPORT {\"kind\":\"ready\",\"protocol\":2}\n")
		if !scan.Scan() {
			serverDone <- scan.Err()
			return
		}
		if scan.Text() != "supportchat send request-1 7 42 "+hex.EncodeToString([]byte(message)) {
			serverDone <- fmt.Errorf("unexpected tell command %q", scan.Text())
			return
		}
		_, _ = fmt.Fprint(server, "Unrelated console output\n> SPIRE_SUPPORT {\"kind\":\"sent\",\"request_id\":\"request-1\"}\n")
		_, _ = fmt.Fprintf(server, "SPIRE_SUPPORT {\"kind\":\"tell\",\"request_id\":%q,\"account_id\":7,\"character_id\":42,\"character\":\"Aranel\",\"text\":\"It's here. Thanks!\"}\n", acceptedID)
		if !scan.Scan() || scan.Text() != "supportchat decision "+acceptedID+" accepted" {
			serverDone <- fmt.Errorf("expected tell acknowledgement, got %q", scan.Text())
			return
		}
		_, _ = fmt.Fprintf(server, "SPIRE_SUPPORT {\"kind\":\"tell\",\"request_id\":%q,\"account_id\":8,\"character_id\":43,\"character\":\"Other\",\"text\":\"Hello\"}\n", rejectedID)
		if !scan.Scan() || scan.Text() != "supportchat decision "+rejectedID+" no_petition" {
			serverDone <- fmt.Errorf("expected tell rejection, got %q", scan.Text())
			return
		}
		serverDone <- nil
	}()
	const addr = "world"
	conn, err := startSession(addr, client)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	received := make(chan Frame, 1)
	world := &World{address: func() string { return addr }, conn: conn, change: make(chan struct{}), receive: func(frame Frame) TellDecision {
		if frame.RequestID == rejectedID {
			return TellNoPetition
		}
		received <- frame
		return TellAccepted
	}}
	go world.read(conn)
	if err := world.Send(context.Background(), "request-1", 7, 42, message); err != nil {
		t.Fatal(err)
	}
	select {
	case frame := <-received:
		if frame.RequestID != acceptedID || frame.CharacterID != 42 || frame.AccountID != 7 || frame.Character != "Aranel" || frame.Text != "It's here. Thanks!" {
			t.Fatalf("unexpected reply %+v", frame)
		}
	case <-time.After(time.Second):
		t.Fatal("reply was not dispatched")
	}
	if err := <-serverDone; err != nil {
		t.Fatal(err)
	}
	if !ValidateMessage(message) || ValidateMessage("hi\nsupportchat listen") || ValidateMessage(strings.Repeat("x", MaxMessage+1)) {
		t.Fatal("invalid message validation")
	}
}
