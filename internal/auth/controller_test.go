package auth

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/http/request"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/user"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	gocache "github.com/patrickmn/go-cache"
)

func TestCreateJWTTokenRoundTrip(t *testing.T) {
	const key = "spire-auth-test-only"
	t.Setenv("JWT_SECRET_KEY", key)
	before := time.Now().Add(time.Hour * 87600).Unix()
	token, err := createJwtToken("42")
	if err != nil {
		t.Fatal(err)
	}
	after := time.Now().Add(time.Hour * 87600).Unix()
	parsed, err := jwt.Parse(token, func(_ *jwt.Token) (interface{}, error) { return []byte(key), nil }, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil || !parsed.Valid {
		t.Fatalf("issued token is invalid: %v", err)
	}
	claims := parsed.Claims.(jwt.MapClaims)
	if claims["authorized"] != true || claims["userId"] != "42" {
		t.Fatalf("issued claims changed: %v", claims)
	}
	expires, err := claims.GetExpirationTime()
	if err != nil || expires == nil || expires.Unix() < before || expires.Unix() > after {
		t.Fatalf("issued token expiry changed: %v (%v)", expires, err)
	}

	cache := gocache.New(time.Minute, 0)
	cache.Set("user-42", models.User{ID: 42, UserName: "auth-test"}, time.Minute)
	m := user.NewContextMiddleware(nil, cache)
	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		if got := request.GetUser(c); got.ID != 42 || got.UserName != "auth-test" {
			t.Errorf("wrong authenticated user: %+v", got)
		}
		return c.NoContent(http.StatusNoContent)
	}, m.HandleHeader(), m.HandleQuerystring())
	for _, transport := range []string{"header", "query"} {
		t.Run(transport, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if transport == "header" {
				req.Header.Set(echo.HeaderAuthorization, "Bearer "+token)
			} else {
				req.URL.RawQuery = url.Values{"jwt": {token}}.Encode()
			}
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if rec.Code != http.StatusNoContent {
				t.Fatalf("issued token rejected: status=%d body=%s", rec.Code, rec.Body.String())
			}
		})
	}
}
