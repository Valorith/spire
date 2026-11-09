package permissions

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	gocache "github.com/patrickmn/go-cache"
)

func TestSupportChatLogPermissionIsSeparate(t *testing.T) {
	grant := func(resources ...Resource) (*Service, echo.Context) {
		cache := gocache.New(gocache.NoExpiration, 0)
		cache.Set("user-permissions-2", userPermissions{connectionID: 1, permissions: resources}, gocache.NoExpiration)
		context := echo.New().NewContext(httptest.NewRequest(http.MethodGet, "/api/v1/player-support/cases", nil), httptest.NewRecorder())
		return &Service{cache: cache}, context
	}
	manual := (&Service{}).RegisterManualResources()
	support := Resource{RouteMatchPrefixes: manual["Player Support"], CanRead: true, CanWrite: true}
	chat := Resource{RouteMatchPrefixes: manual["Player Support Chat Logs"], CanRead: true}
	linked := Resource{RouteMatchPrefixes: manual["Player Support Linked Accounts"], CanRead: true}
	user := models.User{ID: 2}

	service, context := grant(support)
	if !service.CanAccessRoute(context, user, 1, "/api/v1/player-support/cases", false) {
		t.Fatal("the Player Support grant must open Player Support")
	}
	for _, path := range []string{"/api/v1/player-support-chat-logs", "/api/v1/player-support-linked-accounts"} {
		if service.CanAccessRoute(context, user, 1, path, false) {
			t.Fatalf("the Player Support grant must not open %s", path)
		}
	}

	service, context = grant(support, chat)
	if !service.CanAccessRoute(context, user, 1, "/api/v1/player-support-chat-logs", false) {
		t.Fatal("the chat log grant must open chat logs")
	}
	if service.CanAccessRoute(context, user, 1, "/api/v1/player-support-linked-accounts", false) {
		t.Fatal("the chat log grant must not open linked accounts")
	}

	service, context = grant(linked)
	if !service.CanAccessRoute(context, user, 1, "/api/v1/player-support-linked-accounts", false) {
		t.Fatal("the linked accounts grant must open linked accounts")
	}
	if service.CanAccessRoute(context, user, 1, "/api/v1/player-support/cases", false) {
		t.Fatal("the linked accounts grant must not open Player Support")
	}
}

func TestSupportBatchNeedsPlayerSupportWrite(t *testing.T) {
	cache := gocache.New(gocache.NoExpiration, 0)
	service := &Service{cache: cache}
	cache.Set("user-permissions-2", userPermissions{connectionID: 1, permissions: []Resource{{
		RouteMatchPrefixes: service.RegisterManualResources()["Player Support"], CanRead: true,
	}}}, gocache.NoExpiration)
	context := echo.New().NewContext(httptest.NewRequest(http.MethodPut, "/api/v1/player-support/batch", nil), httptest.NewRecorder())
	if !service.IsWriteRequest(context) {
		t.Fatal("the batch route must count as a write")
	}
	if service.CanAccessResource(context, models.User{ID: 2}, 1) {
		t.Fatal("a read-only Player Support grant must not run batch actions")
	}
}
