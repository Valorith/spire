package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"github.com/EQEmuTools/spire/internal/playersupport"
)

func TestTellDelivery(t *testing.T) {
	for _, test := range []struct {
		name string
		err  error
		want string
	}{
		{"accepted", nil, "sent"},
		{"no answer", playersupport.ErrDeliveryUnknown, "unconfirmed"},
		{"no answer, wrapped", fmt.Errorf("send: %w", playersupport.ErrDeliveryUnknown), "unconfirmed"},
		{"unavailable", playersupport.ErrUnavailable, "failed"},
		{"refused", errors.New("player is not in game"), "failed"},
	} {
		if got := tellDelivery(test.err); got != test.want {
			t.Errorf("%s: %q, want %q", test.name, got, test.want)
		}
	}
}

// The Resolve dialog reads the delivery from the send's answer.
func TestChatSendAnswer(t *testing.T) {
	data, err := json.Marshal(supportChatSent{Delivery: "failed"})
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != `{"delivery":"failed"}` {
		t.Errorf("answer = %s", data)
	}
}
