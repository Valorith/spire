package boot

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EQEmuTools/spire/internal/database"
	appmiddleware "github.com/EQEmuTools/spire/internal/http/middleware"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/permissions"
	"github.com/gertd/go-pluralize"
	"github.com/labstack/echo/v4"
	gocache "github.com/patrickmn/go-cache"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestCurrentPermissionsRouteDoesNotRequireResourceGrants(t *testing.T) {
	for _, tc := range []struct {
		name          string
		userID        uint
		canReadConfig bool
	}{
		{"scoped reader", 2, true},
		{"no grants", 2, false},
		{"anonymous", 0, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
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
			// Stub only storage. Route selection, grant resolution, and the ACL run normally.
			err = db.Callback().Query().After("gorm:query").Register("test:permissions", func(tx *gorm.DB) {
				if rows, ok := tx.Statement.Dest.(*[]models.UserServerResourcePermission); ok && tc.canReadConfig {
					*rows = []models.UserServerResourcePermission{{
						UserId: 2, ServerDatabaseConnectionId: 7, ResourceName: "SERVER_CONFIGURATION", CanRead: 1,
					}}
				}
			})
			if err != nil {
				t.Fatal(err)
			}
			cache := gocache.New(gocache.NoExpiration, 0)
			cache.Set("active-connection-2", uint(7), gocache.NoExpiration)
			cache.Set("active-user-db-connection-2", models.UserServerDatabaseConnection{
				ID: 99, UserId: 2, ServerDatabaseConnectionId: 7, Active: 1,
			}, gocache.NoExpiration)
			resolver := database.NewResolver(database.NewConnections(db, nil, nil), nil, nil, cache)
			service := permissions.NewService(resolver, cache, nil, pluralize.NewClient())
			current := permissions.NewCurrentUserController(resolver, service)
			resources := permissions.NewController(resolver, service)
			controllers := provideControllers(
				nil,       // hello
				nil,       // auth
				nil,       // me
				nil,       // analytics
				nil,       // connections
				nil,       // taskClassRestrictions
				nil,       // factionEditor
				nil,       // contentFlagEditor
				nil,       // alternateCurrencyEditor
				nil,       // mailParcelsEditor
				nil,       // mercenaryEditor
				nil,       // playerOperations
				nil,       // playerSupport
				nil,       // inventoryKeyring
				nil,       // dataBucketEditor
				nil,       // qGlobalEditor
				nil,       // chatAdministration
				nil,       // quest
				nil,       // app
				nil,       // query
				nil,       // clientFilesController
				nil,       // staticMaps
				nil,       // analyticsController
				nil,       // authedAnalyticsController
				nil,       // changelogController
				nil,       // spireChangelogController
				nil,       // assetsController
				resources, // permissionsController
				current,   // currentPermissionsController
				nil,       // usersController
				nil,       // settingsController
				nil,       // eqemuserverController
				nil,       // eqemuserverPublicController
				nil,       // serverconfigController
				nil,       // backupController
				nil,       // websocketController
				nil,       // systemController
				nil,       // modelController
			)
			e := echo.New()
			e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
				return func(c echo.Context) error {
					c.Set("user", models.User{ID: tc.userID})
					return next(c)
				}
			})
			acl := appmiddleware.NewPermissionsMiddleware(resolver, nil, cache, service).Handle()
			for _, group := range []struct {
				controllers []routes.Controller
				middleware  []echo.MiddlewareFunc
			}{
				{controllers.v1controllersNoPermissions, nil},
				{controllers.v1controllers, []echo.MiddlewareFunc{acl}},
			} {
				httpGroup := e.Group("/api/v1", group.middleware...)
				for _, controller := range group.controllers {
					switch controller.(type) {
					case *permissions.Controller, *permissions.CurrentUserController:
						for _, route := range controller.Routes() {
							httpGroup.Add(route.Method(), "/"+route.Route(), route.Handler(), route.Middlewares()...)
						}
					}
				}
			}
			e.GET("/api/v1/admin/serverconfig", func(c echo.Context) error { return c.NoContent(http.StatusOK) }, acl)
			request := func(path string) *httptest.ResponseRecorder {
				result := httptest.NewRecorder()
				e.ServeHTTP(result, httptest.NewRequest(http.MethodGet, path, nil))
				return result
			}
			result := request("/api/v1/permissions/me?user_id=1&connection_id=99")
			if tc.userID == 0 {
				if result.Code != http.StatusUnauthorized {
					t.Fatalf("anonymous snapshot: %d %s", result.Code, result.Body.String())
				}
				return
			}
			if result.Code != http.StatusOK {
				t.Fatalf("snapshot: %d %s", result.Code, result.Body.String())
			}
			var snapshot struct {
				ConnectionID uint     `json:"connection_id"`
				ReadAll      bool     `json:"read_all"`
				WriteAll     bool     `json:"write_all"`
				Read         []string `json:"read"`
				Write        []string `json:"write"`
			}
			if err := json.Unmarshal(result.Body.Bytes(), &snapshot); err != nil {
				t.Fatal(err)
			}
			if snapshot.ConnectionID != 7 || snapshot.ReadAll || snapshot.WriteAll || len(snapshot.Write) != 0 {
				t.Fatalf("unexpected grants: %+v", snapshot)
			}
			if tc.canReadConfig {
				if len(snapshot.Read) != 1 || snapshot.Read[0] != "admin/serverconfig" {
					t.Fatalf("scoped read grants: %+v", snapshot)
				}
			} else if len(snapshot.Read) != 0 {
				t.Fatalf("unexpected read grants: %+v", snapshot)
			}
			expected := http.StatusForbidden
			if tc.canReadConfig {
				expected = http.StatusOK
			}
			if result = request("/api/v1/admin/serverconfig"); result.Code != expected {
				t.Fatalf("resource ACL: got %d, want %d", result.Code, expected)
			}
			if result = request("/api/v1/permissions/resources"); result.Code != http.StatusForbidden {
				t.Fatalf("resource catalog must retain its existing ACL: %d", result.Code)
			}
		})
	}
}
