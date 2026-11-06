package permissions

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/gertd/go-pluralize"
	"github.com/labstack/echo/v4"
	gocache "github.com/patrickmn/go-cache"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestPermissionCacheDoesNotReuseOwnershipForAnotherConnection(t *testing.T) {
	// Dry-run queries produce no grants for connection 2 without contacting a DB.
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN: "qa@tcp(127.0.0.1:1)/qa", SkipInitializeWithVersion: true,
	}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatal(err)
	}
	pool, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = pool.Close() })
	cache := gocache.New(gocache.NoExpiration, 0)
	cache.Set("user-permissions-2", userPermissions{
		connectionID: 1, isConnectionOwner: true,
	}, gocache.NoExpiration)
	resolver := database.NewResolver(database.NewConnections(db, nil, nil), nil, nil, cache)
	service := NewService(resolver, cache, nil, pluralize.NewClient())
	e := echo.New()
	context := e.NewContext(httptest.NewRequest(http.MethodGet, "/api/v1/admin/serverconfig", nil), httptest.NewRecorder())
	user := models.User{ID: 2}
	if !service.CanAccessResource(context, user, 1) {
		t.Fatal("the owned connection should be accessible")
	}
	if service.CanAccessResource(context, user, 2) {
		t.Fatal("ownership of connection 1 must not grant access to connection 2")
	}
	cached, _ := cache.Get("user-permissions-2")
	if cached.(userPermissions).connectionID != 2 {
		t.Fatal("the cache should now describe the newly selected connection")
	}
}

func TestConnectionPermissionsWithoutInstanceAdmin(t *testing.T) {
	for _, tc := range []struct {
		name        string
		method      string
		permissions userPermissions
		want        bool
	}{
		{name: "all read", method: http.MethodGet, permissions: userPermissions{canReadAll: true}, want: true},
		{name: "all write", method: http.MethodPut, permissions: userPermissions{canWriteAll: true}, want: true},
		{name: "read only cannot write", method: http.MethodPut, permissions: userPermissions{canReadAll: true}},
		{name: "write only cannot read", method: http.MethodGet, permissions: userPermissions{canWriteAll: true}},
		{name: "no grants cannot read", method: http.MethodGet},
		{name: "connection owner", method: http.MethodPut, permissions: userPermissions{isConnectionOwner: true}, want: true},
		{
			name: "scoped server read", method: http.MethodGet, want: true,
			permissions: userPermissions{permissions: []Resource{{
				RouteMatchPrefixes: []string{"admin/serverconfig"}, CanRead: true,
			}}},
		},
		{
			name: "unrelated grant cannot read", method: http.MethodGet,
			permissions: userPermissions{permissions: []Resource{{
				RouteMatchPrefixes: []string{"items"}, CanRead: true, CanWrite: true,
			}}},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			cache := gocache.New(gocache.NoExpiration, 0)
			// Seed the same permission cache used after resolving a connection.
			tc.permissions.connectionID = 1
			cache.Set("user-permissions-2", tc.permissions, gocache.NoExpiration)
			service := &Service{cache: cache}
			e := echo.New()
			request := httptest.NewRequest(tc.method, "/api/v1/admin/serverconfig", nil)
			context := e.NewContext(request, httptest.NewRecorder())
			user := models.User{ID: 2, IsAdmin: false}
			if got := service.CanAccessResource(context, user, 1); got != tc.want {
				t.Errorf("CanAccessResource() = %v, want %v", got, tc.want)
			}
		})
	}
}

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

func TestServerUtilityPermissions(t *testing.T) {
	for _, tc := range []struct {
		resource string
		path     string
		method   string
	}{
		{"Server Database Backup", "/api/v1/backup/mysql", http.MethodPost},
		{"Server Database Backup", "/api/v1/backup/mysql-dump-download/test.sql", http.MethodGet},
		{"Server Process Management", "/api/v1/admin/launcherconfig", http.MethodGet},
		{"Server Process Management", "/api/v1/admin/launcherconfig", http.MethodPost},
		{"Server Process Management", "/api/v1/eqemuserver/server/restart-schedules", http.MethodGet},
		{"Server Process Management", "/api/v1/eqemuserver/server/restart-schedules", http.MethodPost},
		{"Server Process Management", "/api/v1/eqemuserver/server/restart-schedules/preview", http.MethodPost},
		{"Server Process Management", "/api/v1/eqemuserver/server/restart-schedules/runs/123/cancel", http.MethodPost},
	} {
		t.Run(tc.method+tc.path, func(t *testing.T) {
			cache := gocache.New(gocache.NoExpiration, 0)
			service := &Service{cache: cache}
			cache.Set("user-permissions-2", userPermissions{
				connectionID: 1,
				permissions: []Resource{{
					RouteMatchPrefixes: service.RegisterManualResources()[tc.resource],
					CanRead:            true, CanWrite: tc.method == http.MethodPost,
				}},
			}, gocache.NoExpiration)
			e := echo.New()
			context := e.NewContext(httptest.NewRequest(tc.method, tc.path, nil), httptest.NewRecorder())
			if !service.CanAccessResource(context, models.User{ID: 2}, 1) {
				t.Fatal("the tool's named permission must authorize its endpoint")
			}
		})
	}
}

func TestReadOnlyRestartPermissionCannotMutateSchedules(t *testing.T) {
	cache := gocache.New(gocache.NoExpiration, 0)
	service := &Service{cache: cache}
	cache.Set("user-permissions-2", userPermissions{connectionID: 1, permissions: []Resource{{RouteMatchPrefixes: service.RegisterManualResources()["Server Process Management"], CanRead: true}}}, gocache.NoExpiration)
	for _, tc := range []struct {
		method, path string
		want         bool
	}{
		{http.MethodGet, "/api/v1/eqemuserver/server/restart-schedules", true},
		{http.MethodPost, "/api/v1/eqemuserver/server/restart-schedules", false},
		{http.MethodPost, "/api/v1/eqemuserver/server/restart-schedules/preview", false},
		{http.MethodPost, "/api/v1/eqemuserver/server/restart-schedules/runs/1/cancel", false},
		{http.MethodDelete, "/api/v1/eqemuserver/server/restart-schedules/1?revision=1", false},
	} {
		t.Run(tc.method+tc.path, func(t *testing.T) {
			c := echo.New().NewContext(httptest.NewRequest(tc.method, tc.path, nil), httptest.NewRecorder())
			if got := service.CanAccessResource(c, models.User{ID: 2}, 1); got != tc.want {
				t.Fatalf("access = %v, want %v", got, tc.want)
			}
		})
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

func TestOperationalDataEditorsAreRegisteredAsManualResources(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	tests := map[string]string{
		"Data Buckets Editor": "data-bucket-editor",
		"QGlobals Editor":     "qglobal-editor",
		"Chat Administration": "chat-administration",
	}
	for name, prefix := range tests {
		prefixes, ok := resources[name]
		if !ok || len(prefixes) != 1 || prefixes[0] != prefix {
			t.Fatalf("%s resource = %#v, want [%s]", name, prefixes, prefix)
		}
	}
}

func TestSpireApplicationUpdateIsRegisteredAsManualResource(t *testing.T) {
	resources := (&Service{}).RegisterManualResources()
	prefixes, ok := resources["Spire Application Update"]
	if !ok || len(prefixes) != 1 || prefixes[0] != "app/update" {
		t.Fatalf("Spire Application Update resource = %#v, want [app/update]", prefixes)
	}
}
