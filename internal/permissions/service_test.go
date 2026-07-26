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
