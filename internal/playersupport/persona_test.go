package playersupport

import (
	"bufio"
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"
)

func TestNormalizePersona(t *testing.T) {
	valid := map[string]string{
		"Aranwen":                  "Aranwen",
		"  Guide Vayle ":           "Guide Vayle",
		"Lady Of The Lake":         "Lady Of The Lake",
		"Abc":                      "Abc",
		strings.Repeat("a", 24):    strings.Repeat("a", 24),
		"":                         "",
		"   ":                      "",
		"Game Master":              "", // the default: no persona
		"Sir Gamemaster Of Qeynos": "Sir Gamemaster Of Qeynos",
	}
	for in, want := range valid {
		got, err := NormalizePersona(in)
		if err != nil || got != want {
			t.Errorf("NormalizePersona(%q) = %q, %v; want %q", in, got, err, want)
		}
	}
	invalid := map[string]string{
		"Ab":                    "A persona is 3 to 24 characters",
		strings.Repeat("a", 25): "A persona is 3 to 24 characters",
		"Guide  Vayle":          "Use letters and single spaces only, starting with a letter",
		"Vayle2":                "Use letters and single spaces only, starting with a letter",
		"GM-Vayle":              "Use letters and single spaces only, starting with a letter",
		"Vayle's":               "Use letters and single spaces only, starting with a letter",
		"Ärnel":                 "Use letters and single spaces only, starting with a letter",
		"GameMaster":            "Game Master is the default name; use the default or choose another name",
		"game master":           "Game Master is the default name; use the default or choose another name",
		"GAME MASTER":           "Game Master is the default name; use the default or choose another name",
		"Gamemaster":            "Game Master is the default name; use the default or choose another name",
	}
	for in, want := range invalid {
		if got, err := NormalizePersona(in); err == nil || err.Error() != want || got != "" {
			t.Errorf("NormalizePersona(%q) = %q, %v; want error %q", in, got, err, want)
		}
	}
}

// The sixth argument goes only to a World that lists "persona", and only for
// a set persona other than the default.
func TestPersonaArgument(t *testing.T) {
	supports, older := Features{Patch: 3, Persona: true}, Features{Patch: 3, MailNotice: true}
	cases := []struct {
		persona  string
		features Features
		want     string
	}{
		{"Aranwen", supports, "Aranwen"},
		{"Aranwen", older, ""},
		{"", supports, ""},
		{"Game Master", supports, ""},
		{"Bad  Name", supports, ""},
		{"Aranwen", Features{}, ""},
	}
	for _, test := range cases {
		if got := PersonaArgument(test.persona, test.features); got != test.want {
			t.Errorf("PersonaArgument(%q, %+v) = %q, want %q", test.persona, test.features, got, test.want)
		}
	}
}

func TestChatSendCommand(t *testing.T) {
	five := chatSendCommand("chat-12-ab", 7, 42, "Hi there.", "")
	if five != "supportchat send chat-12-ab 7 42 "+hex.EncodeToString([]byte("Hi there.")) || len(strings.Fields(five)) != 6 {
		t.Errorf("without a persona: %q", five)
	}
	six := chatSendCommand("chat-12-ab", 7, 42, "Hi there.", "Guide Vayle")
	// "Guide Vayle" in lowercase hex.
	if six != five+" 4775696465205661796c65" {
		t.Errorf("with a persona: %q", six)
	}
	fields := strings.Fields(six)
	if len(fields) != 7 || fields[6] != strings.ToLower(fields[6]) {
		t.Fatalf("persona argument %q", six)
	}
	decoded, err := hex.DecodeString(fields[6])
	if err != nil || string(decoded) != "Guide Vayle" {
		t.Errorf("persona decodes to %q, %v", decoded, err)
	}
	// The longest persona stays within World's 128 hex characters.
	if long := strings.Fields(chatSendCommand("x", 1, 2, "m", strings.Repeat("a", PersonaMaxLength)))[6]; len(long) > 128 {
		t.Errorf("persona hex is %d characters", len(long))
	}
}

// A tell with a persona reaches World as six arguments.
func TestSendWithPersona(t *testing.T) {
	client, server := net.Pipe()
	defer client.Close()
	done := make(chan error, 1)
	go func() {
		defer server.Close()
		_ = server.SetDeadline(time.Now().Add(4 * time.Second))
		_, _ = fmt.Fprint(server, "Connection established from localhost, assuming admin\n\r> ")
		scan := bufio.NewScanner(server)
		if !scan.Scan() || scan.Text() != "echo off" || !scan.Scan() || scan.Text() != "supportchat listen" {
			done <- errors.New("wrong console handshake")
			return
		}
		_, _ = fmt.Fprint(server, "> SPIRE_SUPPORT {\"kind\":\"ready\",\"protocol\":2}\n")
		want := "supportchat send request-1 7 42 " + hex.EncodeToString([]byte("Hello")) + " " + hex.EncodeToString([]byte("Aranwen"))
		if !scan.Scan() || scan.Text() != want {
			done <- fmt.Errorf("unexpected tell command %q", scan.Text())
			return
		}
		_, _ = fmt.Fprint(server, "SPIRE_SUPPORT {\"kind\":\"sent\",\"request_id\":\"request-1\"}\n")
		done <- nil
	}()
	conn, err := startSession("world", client)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	world := &World{address: func() string { return "world" }, conn: conn, change: make(chan struct{})}
	go world.read(conn)
	if err := world.Send(context.Background(), "request-1", 7, 42, "Hello", "Aranwen"); err != nil {
		t.Fatal(err)
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}
