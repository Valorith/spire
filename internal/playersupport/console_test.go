package playersupport

import (
	"errors"
	"strings"
	"testing"
)

func TestKickName(t *testing.T) {
	for _, name := range []string{"Aranel", "a", strings.Repeat("x", 63)} {
		if !kickName.MatchString(name) {
			t.Errorf("%q should be accepted", name)
		}
	}
	for _, name := range []string{"", "Aranel2", "Aranel Smith", "Aranel\nworldshutdown", strings.Repeat("x", 64), "Ärnel"} {
		if kickName.MatchString(name) {
			t.Errorf("%q should be rejected", name)
		}
		if got := kick("127.0.0.1:1", nil, name); got != KickInvalid {
			t.Errorf("kick(%q) = %q, want invalid before contacting World", name, got)
		}
	}
	if got := kick("", nil, "Aranel"); got != KickUnavailable {
		t.Errorf("kick without a local World = %q", got)
	}
}

func TestMailNoticeSender(t *testing.T) {
	cases := map[string]string{
		"GameMaster":            "GameMaster",
		"  Game   Master ":      "Game Master",
		"a Game Master":         "a Game Master",
		"100% Fun":              "100 Fun",
		"Ärnel":                 "rnel",
		"Line\nbreak":           "Linebreak",
		strings.Repeat("x", 64): strings.Repeat("x", 64),
		strings.Repeat("x", 65): "",
		"%%%":                   "",
		"":                      "",
	}
	for in, want := range cases {
		if got := MailNoticeSender(in); got != want {
			t.Errorf("MailNoticeSender(%q) = %q, want %q", in, got, want)
		}
	}
	if got := (&World{address: func() string { return "" }}).MailNotice(100, "GameMaster"); got != MailNoticeUnavailable {
		t.Errorf("without a local World: %q", got)
	}
	if got := (&World{address: func() string { return "127.0.0.1:1" }}).MailNotice(0, "GameMaster"); got != MailNoticeStale {
		t.Errorf("character 0: %q", got)
	}
}

func TestClassifyMailNotice(t *testing.T) {
	cases := []struct {
		reply string
		err   error
		want  string
	}{
		{`{"status":"shown"}`, nil, MailNoticeShown},
		{`{"status":"busy"}` + "\n", nil, MailNoticeBusy},
		{`{"status":"offline"}`, nil, MailNoticeOffline},
		{`{"status":"stale"}`, nil, MailNoticeStale},
		{`{"status":"other"}`, nil, MailNoticeUnavailable},
		{"Command not found: supportmailnotice", nil, MailNoticeNoCommand},
		{"", errors.New("timeout"), MailNoticeUnconfirmed},
		{"garbage", nil, MailNoticeUnavailable},
	}
	for _, test := range cases {
		if got := classifyMailNotice(test.reply, test.err); got != test.want {
			t.Errorf("classifyMailNotice(%q, %v) = %q, want %q", test.reply, test.err, got, test.want)
		}
	}
}

func TestClassifyPetitionClose(t *testing.T) {
	cases := []struct {
		reply string
		err   error
		want  string
	}{
		{`{"status":"closed"}`, nil, PetitionClosed},
		{`{"status":"checked_out"}`, nil, PetitionCheckedOut},
		{`{"status":"gone"}`, nil, PetitionGone},
		{`{"status":"stale"}`, nil, PetitionStale},
		{`{"status":"unavailable"}`, nil, PetitionUnavailable},
		{`{"status":"something"}`, nil, PetitionUnavailable},
		{"Command not found: supportpetition", nil, PetitionNoCommand},
		{"", errors.New("timeout"), PetitionUnconfirmed},
		{"garbage", nil, PetitionUnavailable},
	}
	for _, test := range cases {
		if got := classifyPetitionClose(test.reply, test.err); got != test.want {
			t.Errorf("classifyPetitionClose(%q, %v) = %q, want %q", test.reply, test.err, got, test.want)
		}
	}
}
