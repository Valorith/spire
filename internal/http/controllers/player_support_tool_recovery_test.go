package controllers

import (
	"net/http"
	"testing"

	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
)

func TestCorpseExpPreconditions(t *testing.T) {
	corpse := supportCorpseExp{ID: 42, ZoneID: 89, InstanceID: 3, Exp: 125000}
	patched := playersupport.Features{Patch: 3, CorpseExp: true}
	here := &supportLiveLocation{ZoneID: 89, InstanceID: 3}
	rezzed := corpse
	rezzed.Rezzed = true
	empty := corpse
	empty.Exp = 0
	for _, test := range []struct {
		name     string
		corpse   supportCorpseExp
		remote   bool
		features playersupport.Features
		state    string
		live     *supportLiveLocation
		want     string
	}{
		{"ready", corpse, false, patched, "in_zone", here, ""},
		{"resurrected", rezzed, false, patched, "in_zone", here, "This corpse was already resurrected; its experience was returned then."},
		{"no experience", empty, false, patched, "in_zone", here, "This corpse holds no experience."},
		{"remote World", corpse, true, playersupport.Features{}, "in_zone", here, "Restoring experience needs the game server this Spire runs beside."},
		{"missing feature", corpse, false, playersupport.Features{Patch: 2}, "in_zone", here, "Restoring experience needs the updated Player Support patch."},
		{"offline", corpse, false, patched, "offline", nil, "Aranel must be in game to receive experience."},
		{"zoning", corpse, false, patched, "zoning", nil, "Aranel must be in game to receive experience."},
		{"other zone", corpse, false, patched, "in_zone", &supportLiveLocation{ZoneID: 22}, "Move the corpse to Aranel first. Experience is restored where the player is."},
		{"other instance", corpse, false, patched, "in_zone", &supportLiveLocation{ZoneID: 89, InstanceID: 4}, "Move the corpse to Aranel first. Experience is restored where the player is."},
	} {
		err := supportCorpseExpRefusal(test.corpse, !test.remote, test.features, test.state, test.live, "Aranel")
		if test.want == "" {
			if err != nil {
				t.Errorf("%s: %v", test.name, err)
			}
			continue
		}
		if toolHTTPCode(err) != http.StatusConflict || err.(*echo.HTTPError).Message != test.want {
			t.Errorf("%s: %v, want 409 %q", test.name, err, test.want)
		}
	}

	for status, want := range map[string]supportActionResult{
		"restored":    {Delivery: "sent", Message: "Returned 1,234,567 experience."},
		"already":     {Delivery: "failed", Message: "This corpse was already resurrected; its experience was returned then."},
		"elsewhere":   {Delivery: "failed", Message: "The corpse is not loaded where Aranel is. Move it to them first."},
		"busy":        {Delivery: "failed", Message: "The corpse is being looted or the player has a resurrection offer open. Try again in a moment."},
		"no_exp":      {Delivery: "failed", Message: "This corpse holds no experience."},
		"offline":     {Delivery: "failed", Message: "Aranel left the game. Try again."},
		"stale":       {Delivery: "failed", Message: "The game server did not confirm the change."},
		"unavailable": {Delivery: "failed", Message: "The game server did not confirm the change."},
		"unconfirmed": {Delivery: "unconfirmed", Message: "The game server did not confirm. Check Aranel's experience before retrying."},
	} {
		got := supportCorpseExpResult(status, 1234567, "Aranel")
		if got.Delivery != want.Delivery || got.Message != want.Message {
			t.Errorf("status %q = %+v, want %+v", status, got, want)
		}
	}
	if got := toolGroupedNumber(-1000); got != "-1,000" {
		t.Errorf("toolGroupedNumber(-1000) = %q", got)
	}
}
