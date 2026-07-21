package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/EQEmuTools/spire/internal/env"
	"github.com/labstack/echo/v4"
)

func TestSageFsSelectDirectoryReturnsValidatedNativeSelection(t *testing.T) {
	t.Setenv("APP_ENV", env.AppEnvLocal)

	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "eqclient.ini"), []byte("[Defaults]"), 0644); err != nil {
		t.Fatalf("write EQ client marker: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "global_chr.s3d"), []byte("asset"), 0644); err != nil {
		t.Fatalf("write EQ asset marker: %v", err)
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/app/sage-fs/select-directory", nil)
	req.RemoteAddr = "127.0.0.1:51234"
	req.Header.Set("Origin", "http://127.0.0.1:8080")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := (&Controller{}).sageFsSelectDirectoryWithPicker(c, func() (string, error) {
		return root, nil
	})
	if err != nil {
		t.Fatalf("select directory: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var response struct {
		Root string `json:"root"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if response.Root != filepath.ToSlash(root) {
		t.Fatalf("expected selected root %q, got %q", filepath.ToSlash(root), response.Root)
	}
}

func TestSageFsSelectDirectoryReturnsNoContentWhenCanceled(t *testing.T) {
	t.Setenv("APP_ENV", env.AppEnvLocal)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/app/sage-fs/select-directory", nil)
	req.RemoteAddr = "127.0.0.1:51234"
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := (&Controller{}).sageFsSelectDirectoryWithPicker(c, func() (string, error) {
		return "", nil
	})
	if err != nil {
		t.Fatalf("cancel directory selection: %v", err)
	}
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", rec.Code)
	}
}

func TestRetrySageFsIOSucceedsAfterTransientFailures(t *testing.T) {
	attempts := 0
	retries, err := retrySageFsIO(func() error {
		attempts++
		if attempts < sageFsIOAttempts {
			return errors.New("transient")
		}
		return nil
	})
	if err != nil {
		t.Fatalf("expected transient operation to recover: %v", err)
	}
	if attempts != sageFsIOAttempts || retries != sageFsIOAttempts-1 {
		t.Fatalf("expected %d attempts and %d retries, got %d attempts and %d retries", sageFsIOAttempts, sageFsIOAttempts-1, attempts, retries)
	}
}

func TestRetrySageFsIOReturnsPersistentFailure(t *testing.T) {
	attempts := 0
	retries, err := retrySageFsIO(func() error {
		attempts++
		return errors.New("persistent")
	})
	if err == nil || err.Error() != "persistent" {
		t.Fatalf("expected persistent error, got %v", err)
	}
	if attempts != sageFsIOAttempts || retries != sageFsIOAttempts-1 {
		t.Fatalf("expected %d attempts and %d retries, got %d attempts and %d retries", sageFsIOAttempts, sageFsIOAttempts-1, attempts, retries)
	}
}

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
