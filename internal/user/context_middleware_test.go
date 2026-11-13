package user

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/http/request"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	gocache "github.com/patrickmn/go-cache"
)

const jwtTestKey = "spire-jwt-regression-test-only"

// Build the original HS256 wire format independently of the new JWT library.
// Existing login/OAuth tokens must remain valid after this migration.
func legacyJWT(payload, key string) string {
	encode := base64.RawURLEncoding.EncodeToString
	unsigned := encode([]byte(`{"alg":"HS256","typ":"JWT"}`)) + "." + encode([]byte(payload))
	mac := hmac.New(sha256.New, []byte(key))
	_, _ = mac.Write([]byte(unsigned))
	return unsigned + "." + encode(mac.Sum(nil))
}

func jwtTestMiddleware(t *testing.T) *ContextMiddleware {
	t.Helper()
	t.Setenv("JWT_SECRET_KEY", jwtTestKey)
	cache := gocache.New(time.Minute, 0)
	for _, id := range []uint{42, 43} {
		cache.Set(fmt.Sprintf("user-%d", id), models.User{ID: id, UserName: fmt.Sprintf("user-%d", id)}, time.Minute)
	}
	// A nil resolver also proves malformed tokens never reach database lookup.
	return NewContextMiddleware(nil, cache)
}

func jwtTestServer(m *ContextMiddleware) *echo.Echo {
	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, strconv.FormatUint(uint64(request.GetUser(c).ID), 10))
	}, m.HandleHeader(), m.HandleQuerystring())
	return e
}

func TestJWTLegacyTokenCompatibility(t *testing.T) {
	m := jwtTestMiddleware(t)
	e := jwtTestServer(m)
	future := time.Now().Add(time.Hour).Unix()
	for _, payload := range []string{
		fmt.Sprintf(`{"authorized":true,"userId":"42","exp":%d}`, future),
		fmt.Sprintf(`{"authorized":true,"userId":"42","exp":%d,"iat":%d,"nbf":%d,"iss":"spire","aud":"spire"}`, future, future-7200, future-7200),
		// StandardClaims did not require time claims. Keep that compatibility.
		`{"authorized":true,"userId":"42"}`,
	} {
		for _, transport := range []string{"header", "query"} {
			t.Run(transport+"/"+payload, func(t *testing.T) {
				token := legacyJWT(payload, jwtTestKey)
				req := httptest.NewRequest(http.MethodGet, "/", nil)
				if transport == "header" {
					req.Header.Set(echo.HeaderAuthorization, "Bearer "+token)
				} else {
					req.URL.RawQuery = url.Values{"jwt": {token}}.Encode()
				}
				rec := httptest.NewRecorder()
				e.ServeHTTP(rec, req)
				if rec.Code != http.StatusOK || rec.Body.String() != "42" {
					t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
				}
			})
		}
	}
}

func TestJWTInvalidTokens(t *testing.T) {
	m := jwtTestMiddleware(t)
	e := jwtTestServer(m)
	now := time.Now()
	future := now.Add(time.Hour).Unix()
	valid := legacyJWT(fmt.Sprintf(`{"authorized":true,"userId":"42","exp":%d}`, future), jwtTestKey)
	sign := func(method jwt.SigningMethod, key interface{}) string {
		t.Helper()
		token, err := jwt.NewWithClaims(method, jwt.MapClaims{"userId": "42", "exp": future}).SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return token
	}
	tests := map[string]string{
		"wrong key":           legacyJWT(fmt.Sprintf(`{"userId":"42","exp":%d}`, future), "wrong-key"),
		"tampered payload":    strings.Split(valid, ".")[0] + "." + base64.RawURLEncoding.EncodeToString([]byte(`{"userId":"43"}`)) + "." + strings.Split(valid, ".")[2],
		"expired":             legacyJWT(fmt.Sprintf(`{"userId":"42","exp":%d}`, now.Add(-time.Hour).Unix()), jwtTestKey),
		"not yet valid":       legacyJWT(fmt.Sprintf(`{"userId":"42","nbf":%d}`, future), jwtTestKey),
		"issued in future":    legacyJWT(fmt.Sprintf(`{"userId":"42","iat":%d}`, future), jwtTestKey),
		"invalid expiration":  legacyJWT(`{"userId":"42","exp":"tomorrow"}`, jwtTestKey),
		"missing user ID":     legacyJWT(`{"authorized":true}`, jwtTestKey),
		"non numeric user ID": legacyJWT(`{"userId":"not-a-user"}`, jwtTestKey),
		"numeric user ID":     legacyJWT(`{"userId":42}`, jwtTestKey),
		"zero user ID":        legacyJWT(`{"userId":"0"}`, jwtTestKey),
		"negative user ID":    legacyJWT(`{"userId":"-42"}`, jwtTestKey),
		"overflow user ID":    legacyJWT(`{"userId":"999999999999999999999999999999"}`, jwtTestKey),
		"unsigned":            sign(jwt.SigningMethodNone, jwt.UnsafeAllowNoneSignatureType),
		"HS384":               sign(jwt.SigningMethodHS384, []byte(jwtTestKey)),
		"HS512":               sign(jwt.SigningMethodHS512, []byte(jwtTestKey)),
		"malformed":           "not-a-jwt",
		"empty segments":      "..",
		"bad base64":          "!.!.!",
		"array claims":        legacyJWT(`[]`, jwtTestKey),
		"truncated":           strings.Join(strings.Split(valid, ".")[:2], "."),
		"missing signature":   strings.Join(strings.Split(valid, ".")[:2], ".") + ".",
		"extra segment":       valid + ".extra",
		"many separators":     strings.Repeat(".", 64*1024),
	}
	for name, token := range tests {
		for _, transport := range []string{"header", "query"} {
			t.Run(name+"/"+transport, func(t *testing.T) {
				req := httptest.NewRequest(http.MethodGet, "/", nil)
				if transport == "header" {
					req.Header.Set(echo.HeaderAuthorization, "Bearer "+token)
				} else {
					req.URL.RawQuery = url.Values{"jwt": {token}}.Encode()
				}
				rec := httptest.NewRecorder()
				e.ServeHTTP(rec, req)
				if rec.Code != http.StatusUnauthorized {
					t.Fatalf("status=%d body=%s; invalid token reached handler", rec.Code, rec.Body.String())
				}
			})
		}
	}
}

func TestJWTOptionalAuthenticationAndSchemes(t *testing.T) {
	e := jwtTestServer(jwtTestMiddleware(t))
	for _, tt := range []struct {
		header string
		status int
	}{
		{"", http.StatusOK},
		{"Basic dXNlcjpwYXNz", http.StatusOK},
		{"basic dXNlcjpwYXNz", http.StatusOK},
		{"Bearer", http.StatusBadRequest},
		{"Bearer ", http.StatusBadRequest},
		{"Digest token", http.StatusBadRequest},
		{"Bearer containsBasic", http.StatusUnauthorized},
		{"notBasic value", http.StatusBadRequest},
	} {
		t.Run(tt.header, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/?jwt=", nil)
			req.Header.Set(echo.HeaderAuthorization, tt.header)
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if rec.Code != tt.status {
				t.Fatalf("status=%d, want=%d body=%s", rec.Code, tt.status, rec.Body.String())
			}
			if tt.status == http.StatusOK && rec.Body.String() != "0" {
				t.Fatal("anonymous/Basic request acquired JWT identity")
			}
		})
	}
}

func TestJWTBothTransportsStillValidate(t *testing.T) {
	e := jwtTestServer(jwtTestMiddleware(t))
	valid := legacyJWT(`{"userId":"42"}`, jwtTestKey)
	for _, tt := range []struct {
		header, query string
		status        int
	}{
		{valid, valid, http.StatusOK},
		{valid, "invalid", http.StatusUnauthorized},
		{"invalid", valid, http.StatusUnauthorized},
	} {
		req := httptest.NewRequest(http.MethodGet, "/?"+url.Values{"jwt": {tt.query}}.Encode(), nil)
		req.Header.Set(echo.HeaderAuthorization, "Bearer "+tt.header)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != tt.status {
			t.Fatalf("status=%d want=%d body=%s", rec.Code, tt.status, rec.Body.String())
		}
	}
}

func TestJWTConcurrentClaimsIsolation(t *testing.T) {
	e := jwtTestServer(jwtTestMiddleware(t))
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			id := strconv.Itoa(42 + i%2)
			token := legacyJWT(`{"userId":"`+id+`"}`, jwtTestKey)
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if i%3 == 0 {
				req.URL.RawQuery = url.Values{"jwt": {token}}.Encode()
			} else {
				req.Header.Set(echo.HeaderAuthorization, "Bearer "+token)
			}
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if rec.Code != http.StatusOK || rec.Body.String() != id {
				t.Errorf("status=%d user=%q want=%q", rec.Code, rec.Body.String(), id)
			}
		}(i)
	}
	wg.Wait()
}

// CVE-2025-30204 allocated a slice proportional to the number of separators.
// Keep this entirely local, with a bounded input, and compare parser allocation
// rather than wall-clock timing or a request to a deployed service.
func TestJWTMalformedSegmentAllocationBounded(t *testing.T) {
	allocated := func(segments int) int64 {
		token := strings.Repeat(".", segments)
		parser := jwt.NewParser()
		result := testing.Benchmark(func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				if _, _, err := parser.ParseUnverified(token, &jwtCustomClaims{}); err == nil {
					b.Fatal("malformed token accepted")
				}
			}
		})
		return result.AllocedBytesPerOp()
	}
	small, large := allocated(16), allocated(64*1024)
	if large > small+4096 {
		t.Fatalf("separator-dependent allocations: small=%d large=%d bytes/op", small, large)
	}
	t.Logf("malformed-token allocations: small=%d large=%d bytes/op", small, large)
}
