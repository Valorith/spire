package app

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/EQEmuTools/spire/internal/env"
	"github.com/labstack/echo/v4"
)

func TestRequireLocalSageFsRequestRejectsNonLoopbackPeerWithoutOrigin(t *testing.T) {
	t.Setenv("APP_ENV", env.AppEnvLocal)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/app/sage-fs/read-file", nil)
	req.RemoteAddr = "192.168.1.25:51234"
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := (&Controller{}).requireLocalSageFsRequest(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected non-loopback request to be rejected, got status %d", rec.Code)
	}
}

func TestRequireLocalSageFsRequestAllowsLoopbackPeerWithoutOrigin(t *testing.T) {
	t.Setenv("APP_ENV", env.AppEnvLocal)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/app/sage-fs/read-file", nil)
	req.RemoteAddr = "127.0.0.1:51234"
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := (&Controller{}).requireLocalSageFsRequest(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected loopback request to be allowed without writing a response, got status %d", rec.Code)
	}
}

func TestRequireLocalSageFsRequestRejectsNonLocalOrigin(t *testing.T) {
	t.Setenv("APP_ENV", env.AppEnvLocal)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/app/sage-fs/read-file", nil)
	req.RemoteAddr = "[::1]:51234"
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := (&Controller{}).requireLocalSageFsRequest(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected non-local origin to be rejected, got status %d", rec.Code)
	}
}
