package eqemuserverconfig

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
	"github.com/labstack/echo/v4"
)

func TestSaveLauncherConfigPersistsOpcodeRepository(t *testing.T) {
	resetConfigCache := func() {
		mutex.Lock()
		cachedConfig = nil
		lastModifiedTime = time.Time{}
		mutex.Unlock()
	}
	resetConfigCache()
	t.Cleanup(resetConfigCache)

	serverPath := t.TempDir()
	appLogger := logger.NewAppLogger()
	paths := pathmgmt.NewPathManagement(appLogger)
	paths.SetServerPath(serverPath)
	serverConfig := NewConfig(appLogger, paths)

	initial := EQEmuConfigJson{WebAdmin: &WebAdminConfig{
		Version: "1.0.0",
		Launcher: &WebAdminLauncherConfig{
			MinZoneProcesses: 10,
		},
	}}
	if err := serverConfig.Save(initial); err != nil {
		t.Fatalf("save initial config: %v", err)
	}

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/admin/launcherconfig",
		strings.NewReader(`{"minZoneProcesses":10,"opcodeSource":"  https://github.com/Valorith/Server  "}`),
	)
	request.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	response := httptest.NewRecorder()
	context := echo.New().NewContext(request, response)

	if err := NewController(serverConfig).saveLauncherConfig(context); err != nil {
		t.Fatalf("save launcher config: %v", err)
	}
	if response.Code != http.StatusOK {
		t.Fatalf("save launcher config status = %d, body = %s", response.Code, response.Body.String())
	}

	persistedBytes, err := os.ReadFile(filepath.Join(serverPath, "eqemu_config.json"))
	if err != nil {
		t.Fatalf("read persisted config: %v", err)
	}
	var persisted EQEmuConfigJson
	if err = json.Unmarshal(persistedBytes, &persisted); err != nil {
		t.Fatalf("decode persisted config: %v", err)
	}
	if got := persisted.WebAdmin.Launcher.OpcodeSource; got != "https://github.com/Valorith/Server" {
		t.Fatalf("persisted opcodeSource = %q", got)
	}

	invalidRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/admin/launcherconfig",
		strings.NewReader(`{"minZoneProcesses":10,"opcodeSource":"https://github.com/Valorith/spire"}`),
	)
	invalidRequest.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	invalidResponse := httptest.NewRecorder()
	invalidContext := echo.New().NewContext(invalidRequest, invalidResponse)
	if err = NewController(serverConfig).saveLauncherConfig(invalidContext); err != nil {
		t.Fatalf("reject invalid launcher config: %v", err)
	}
	if invalidResponse.Code != http.StatusBadRequest {
		t.Fatalf("invalid launcher config status = %d, body = %s", invalidResponse.Code, invalidResponse.Body.String())
	}

	persistedAfterInvalid, err := os.ReadFile(filepath.Join(serverPath, "eqemu_config.json"))
	if err != nil {
		t.Fatalf("read config after invalid save: %v", err)
	}
	if err = json.Unmarshal(persistedAfterInvalid, &persisted); err != nil {
		t.Fatalf("decode config after invalid save: %v", err)
	}
	if got := persisted.WebAdmin.Launcher.OpcodeSource; got != "https://github.com/Valorith/Server" {
		t.Fatalf("opcodeSource after invalid save = %q", got)
	}
}

func TestSavePersistsOptionalSpireUpdateChannel(t *testing.T) {
	resetConfigCache := func() {
		mutex.Lock()
		cachedConfig = nil
		lastModifiedTime = time.Time{}
		mutex.Unlock()
	}
	resetConfigCache()
	t.Cleanup(resetConfigCache)

	serverPath := t.TempDir()
	appLogger := logger.NewAppLogger()
	paths := pathmgmt.NewPathManagement(appLogger)
	paths.SetServerPath(serverPath)
	serverConfig := NewConfig(appLogger, paths)

	legacy := EQEmuConfigJson{}
	if err := serverConfig.Save(legacy); err != nil {
		t.Fatalf("save legacy config: %v", err)
	}
	loaded, err := serverConfig.Get()
	if err != nil {
		t.Fatalf("load legacy config: %v", err)
	}
	if loaded.Spire.UpdateChannel != "" {
		t.Fatalf("legacy update channel = %q, want empty beta-default value", loaded.Spire.UpdateChannel)
	}

	loaded.Spire.UpdateChannel = "beta"
	if err = serverConfig.Save(loaded); err != nil {
		t.Fatalf("save beta update channel: %v", err)
	}

	persistedBytes, err := os.ReadFile(filepath.Join(serverPath, "eqemu_config.json"))
	if err != nil {
		t.Fatalf("read persisted config: %v", err)
	}
	var persisted EQEmuConfigJson
	if err = json.Unmarshal(persistedBytes, &persisted); err != nil {
		t.Fatalf("decode persisted config: %v", err)
	}
	if persisted.Spire.UpdateChannel != "beta" {
		t.Fatalf("persisted update channel = %q, want beta", persisted.Spire.UpdateChannel)
	}

	persisted.Spire.UpdateChannel = "stable"
	if err = serverConfig.Save(persisted); err != nil {
		t.Fatalf("save stable update channel: %v", err)
	}
	stableBytes, err := os.ReadFile(filepath.Join(serverPath, "eqemu_config.json"))
	if err != nil {
		t.Fatalf("read stable config: %v", err)
	}
	if err = json.Unmarshal(stableBytes, &persisted); err != nil {
		t.Fatalf("decode stable config: %v", err)
	}
	if persisted.Spire.UpdateChannel != "stable" {
		t.Fatalf("persisted update channel = %q, want stable", persisted.Spire.UpdateChannel)
	}
}
