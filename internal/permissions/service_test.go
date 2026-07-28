package permissions

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestIsWriteRequestIncludesDelete(t *testing.T) {
	service := &Service{}
	e := echo.New()

	for _, method := range []string{http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete} {
		request := httptest.NewRequest(method, "/api/v1/faction-editor/faction/10", nil)
		context := e.NewContext(request, httptest.NewRecorder())
		if !service.IsWriteRequest(context) {
			t.Errorf("IsWriteRequest(%s) = false, want true", method)
		}
	}
}

func TestIsWriteRequestTreatsReadsAndBulkAsNonWrites(t *testing.T) {
	service := &Service{}
	e := echo.New()

	for _, test := range []struct {
		method string
		path   string
	}{
		{method: http.MethodGet, path: "/api/v1/faction-editor/factions"},
		{method: http.MethodPost, path: "/api/v1/items/bulk"},
	} {
		request := httptest.NewRequest(test.method, test.path, nil)
		context := e.NewContext(request, httptest.NewRecorder())
		if service.IsWriteRequest(context) {
			t.Errorf("IsWriteRequest(%s %s) = true, want false", test.method, test.path)
		}
	}
}

func TestFactionEditorIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Faction Editor"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "faction-editor" {
		t.Fatalf("Faction Editor resource = %#v, want [faction-editor]", prefixes)
	}
}

func TestContentFlagEditorIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Content Flag Editor"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "content-flag-editor" {
		t.Fatalf("Content Flag Editor resource = %#v, want [content-flag-editor]", prefixes)
	}
}

func TestAlternateCurrencyEditorIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Alternate Currency Editor"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "alternate-currency-editor" {
		t.Fatalf("Alternate Currency Editor resource = %#v, want [alternate-currency-editor]", prefixes)
	}
}

func TestPlayerOperationsIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Player Operations"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "player-operations" {
		t.Fatalf("Player Operations resource = %#v, want [player-operations]", prefixes)
	}
}

func TestMailParcelsEditorIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Mail & Parcels Editor"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "mail-parcels-editor" {
		t.Fatalf("Mail & Parcels Editor resource = %#v, want [mail-parcels-editor]", prefixes)
	}
}

func TestInventoryKeyringIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Inventory & Keyring"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "inventory-keyring" {
		t.Fatalf("Inventory & Keyring resource = %#v, want [inventory-keyring]", prefixes)
	}
}

func TestSpireApplicationUpdateIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Spire Application Update"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "app/update" {
		t.Fatalf("Spire Application Update resource = %#v, want [app/update]", prefixes)
	}
}
