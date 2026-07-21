package app

import (
	"encoding/json"
	"fmt"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/env"
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/filepathcheck"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/release"
	"github.com/EQEmuTools/spire/internal/spire"
	"github.com/EQEmuTools/spire/internal/spirechangelog"
	"github.com/EQEmuTools/spire/internal/updater"
	"github.com/EQEmuTools/spire/internal/user"
	"github.com/labstack/echo/v4"
	gocache "github.com/patrickmn/go-cache"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// Controller is the controller for the app
type Controller struct {
	cache            *gocache.Cache
	spireinit        *spire.Init
	spireuser        *user.User
	settings         *spire.Settings
	db               *database.Resolver
	changelogService *spirechangelog.Service
	serverConfig     *eqemuserverconfig.Config
}

// NewController returns a new app controller
func NewController(
	cache *gocache.Cache,
	spireinit *spire.Init,
	spireuser *user.User,
	settings *spire.Settings,
	db *database.Resolver,
	changelog *spirechangelog.Service,
	serverConfig *eqemuserverconfig.Config,
) *Controller {
	return &Controller{
		cache:            cache,
		spireinit:        spireinit,
		spireuser:        spireuser,
		settings:         settings,
		db:               db,
		changelogService: changelog,
		serverConfig:     serverConfig,
	}
}

// Routes returns the routes for the app controller
func (d *Controller) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "app/onboarding-info", d.getOnboardingInfo, nil),
		routes.RegisterRoute(http.MethodPost, "app/onboard-initialize", d.initializeApp, nil),
		routes.RegisterRoute(http.MethodGet, "app/changelog", d.changelog, nil),
		routes.RegisterRoute(http.MethodGet, "app/env", d.env, nil),
		routes.RegisterRoute(http.MethodPost, "app/update", d.update, nil),
		routes.RegisterRoute(http.MethodPost, "app/sync", d.sync, nil),
		routes.RegisterRoute(http.MethodPost, "app/sage-fs/select-directory", d.sageFsSelectDirectory, nil),
		routes.RegisterRoute(http.MethodPost, "app/sage-fs/validate", d.sageFsValidate, nil),
		routes.RegisterRoute(http.MethodGet, "app/sage-fs/readdir", d.sageFsReadDir, nil),
		routes.RegisterRoute(http.MethodGet, "app/sage-fs/read-file", d.sageFsReadFile, nil),
		routes.RegisterRoute(http.MethodPost, "app/sage-fs/mkdir", d.sageFsMkdir, nil),
		routes.RegisterRoute(http.MethodPost, "app/sage-fs/write-file", d.sageFsWriteFile, nil),
		routes.RegisterRoute(http.MethodDelete, "app/sage-fs/delete-file", d.sageFsDeleteFile, nil),
		routes.RegisterRoute(http.MethodDelete, "app/sage-fs/delete-folder", d.sageFsDeleteFolder, nil),
	}
}

func (d *Controller) changelog(c echo.Context) error {
	changelog, _, err := d.changelogService.ReadChangelog()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(200, echo.Map{"data": changelog})
}

type Features struct {
	GithubAuthEnabled bool `json:"github_auth_enabled"`
}

// EnvResponse is a struct to hold the response for the env endpoint
type EnvResponse struct {
	Env                       string           `json:"env"`
	Version                   string           `json:"version"`
	ReleaseRepository         string           `json:"release_repository"`
	OS                        string           `json:"os"`
	Features                  Features         `json:"features"`
	Settings                  []models.Setting `json:"settings"`
	SpireInitialized          bool             `json:"is_spire_initialized"`
	HostedReadOnlyModeEnabled bool             `json:"is_hosted_read_only_mode_enabled"`
}

// PackageJson is a struct to hold the package.json file
type PackageJson struct {
	Name       string `json:"name"`
	Version    string `json:"version"`
	Repository struct {
		Type string `json:"type"`
		URL  string `json:"url"`
	} `json:"repository"`
}

// env returns the environment variables for the app
func (d *Controller) env(c echo.Context) error {
	state, stateErr := d.changelogService.LoadState()

	data, _ := d.cache.Get("packageJson")
	pJson, ok := data.([]byte)
	if ok {
		var pkg PackageJson
		err := json.Unmarshal(pJson, &pkg)
		if err != nil {
			return err
		}

		version := pkg.Version
		configReleaseRepository := ""
		if d.serverConfig != nil {
			if config, err := d.serverConfig.Get(); err == nil {
				configReleaseRepository = config.Spire.ReleaseRepository
			}
		}
		releaseRepository := release.ResolveRepositoryDetailsWithConfig(
			os.Getenv("SPIRE_RELEASE_REPO"),
			configReleaseRepository,
			pJson,
			nil,
		).Repository
		hasRuntimeReleaseRepositoryOverride := release.NormalizeGitHubRepository(os.Getenv("SPIRE_RELEASE_REPO")) != "" ||
			release.NormalizeGitHubRepository(configReleaseRepository) != ""
		if stateErr == nil && state != nil {
			if state.PackageVersion != "" {
				version = state.PackageVersion
			}
			if state.ReleaseRepository != "" && !hasRuntimeReleaseRepositoryOverride {
				releaseRepository = state.ReleaseRepository
			}
		}

		response := EnvResponse{
			Env:               env.Get("APP_ENV", "local"),
			OS:                runtime.GOOS,
			Version:           version,
			ReleaseRepository: releaseRepository,
			Features: Features{
				GithubAuthEnabled: len(os.Getenv("GITHUB_CLIENT_ID")) > 0,
			},
			Settings:                  d.settings.GetSettings(),
			SpireInitialized:          d.spireinit.IsInitialized(),
			HostedReadOnlyModeEnabled: env.IsHostedReadOnlyModeEnabled(),
		}

		return c.JSON(http.StatusOK, echo.Map{"data": response})
	}

	return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Unknown error"})
}

// getOnboardingInfo is used to get the spireinit info
func (d *Controller) getOnboardingInfo(c echo.Context) error {
	if d.spireinit.IsInitialized() {
		return c.JSON(http.StatusOK, echo.Map{"data": "Spire is already initialized"})
	}

	return c.JSON(http.StatusOK,
		echo.Map{
			"data": echo.Map{
				"connection_info": d.spireinit.GetConnectionInfo(),
				"tables":          d.spireinit.GetInstallationTables(),
			},
		},
	)
}

// initializeApp is used to initialize the app
func (d *Controller) initializeApp(c echo.Context) error {
	r := new(spire.InitAppRequest)
	if err := c.Bind(r); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Initialize the app
	err := d.spireinit.InitApp(r)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"data": "Ok"})
}

// sync is used to sync the db name
// used for local setups
// eventually replace this with something better
func (d *Controller) sync(c echo.Context) error {
	d.spireinit.Init()
	d.db.PurgeDatabaseConnections()

	return c.JSON(http.StatusOK, echo.Map{"data": "Ok"})
}

// spire update
func (d *Controller) update(c echo.Context) error {
	if !env.IsAppEnvLocal() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Cannot update in non-local environment"})
	}

	data, _ := d.cache.Get("packageJson")
	pJson, ok := data.([]byte)
	if ok {
		if updater.NewUpdater(pJson).CheckForUpdates(false) {
			go func() {
				fmt.Println("Automatically shutting down in 1 second...")
				time.Sleep(1 * time.Second)
				os.Exit(0)
			}()
			return c.JSON(http.StatusOK, echo.Map{"data": "Ok"})
		}
	}

	return c.JSON(http.StatusOK, echo.Map{"data": "Ok"})
}

type sageFsValidateRequest struct {
	Root string `json:"root"`
}

type sageFsEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	IsDirectory bool   `json:"isDirectory"`
	IsFile      bool   `json:"isFile"`
}

var sageFsRootValidationCache sync.Map
var sageFsFileMu sync.RWMutex

const sageFsIOAttempts = 3

func retrySageFsIO(operation func() error) (int, error) {
	var err error
	for attempt := 0; attempt < sageFsIOAttempts; attempt++ {
		if err = operation(); err == nil {
			return attempt, nil
		}
		if attempt+1 < sageFsIOAttempts {
			time.Sleep(time.Duration(attempt+1) * 25 * time.Millisecond)
		}
	}
	return sageFsIOAttempts - 1, err
}

func openSageFsFile(target string) (*os.File, int, error) {
	var file *os.File
	retries, err := retrySageFsIO(func() error {
		var openErr error
		file, openErr = os.Open(target)
		if os.IsNotExist(openErr) {
			return nil
		}
		return openErr
	})
	if file == nil && err == nil {
		return nil, retries, os.ErrNotExist
	}
	return file, retries, err
}

func setSageFsRetryHeader(c echo.Context, retries int) {
	if retries > 0 {
		c.Response().Header().Set("X-Sage-Fs-Retries", fmt.Sprintf("%d", retries))
	}
}

func (d *Controller) sageFsSelectDirectory(c echo.Context) error {
	return d.sageFsSelectDirectoryWithPicker(c, pickSageFsDirectory)
}

func (d *Controller) sageFsSelectDirectoryWithPicker(
	c echo.Context,
	picker func() (string, error),
) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	root, err := picker()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": fmt.Sprintf("Unable to open the directory selector: %v", err),
		})
	}
	if strings.TrimSpace(root) == "" {
		return c.NoContent(http.StatusNoContent)
	}

	root, err = normalizeSageFsRoot(root)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if !isEverQuestClientDirectory(root) {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Selected directory does not look like an EverQuest client directory",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{"root": filepath.ToSlash(root)})
}

func (d *Controller) sageFsValidate(c echo.Context) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	var request sageFsValidateRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Failed to bind request"})
	}

	root, err := normalizeSageFsRoot(request.Root)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	if !isEverQuestClientDirectory(root) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Selected directory does not look like an EverQuest client directory"})
	}

	return c.JSON(http.StatusOK, echo.Map{"root": filepath.ToSlash(root)})
}

func (d *Controller) sageFsReadDir(c echo.Context) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	_, target, err := resolveSageFsPath(c, false)
	if err != nil {
		return c.JSON(statusCodeForSageFsError(err), echo.Map{"error": err.Error()})
	}

	entries, err := os.ReadDir(target)
	if os.IsNotExist(err) {
		return c.JSON(http.StatusOK, []sageFsEntry{})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	response := make([]sageFsEntry, 0, len(entries))
	for _, entry := range entries {
		entryPath := filepath.Join(target, entry.Name())
		entryInfo, err := entry.Info()
		if err != nil {
			continue
		}
		response = append(response, sageFsEntry{
			Name:        entry.Name(),
			Path:        filepath.ToSlash(entryPath),
			IsDirectory: entryInfo.IsDir(),
			IsFile:      entryInfo.Mode().IsRegular(),
		})
	}

	return c.JSON(http.StatusOK, response)
}

func (d *Controller) sageFsReadFile(c echo.Context) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	_, target, err := resolveSageFsPath(c, false)
	if err != nil {
		return c.JSON(statusCodeForSageFsError(err), echo.Map{"error": err.Error()})
	}
	sageFsFileMu.RLock()
	defer sageFsFileMu.RUnlock()

	file, retries, err := openSageFsFile(target)
	setSageFsRetryHeader(c, retries)
	if os.IsNotExist(err) {
		c.Response().Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
		c.Response().Header().Set("X-Sage-Preview-Missing", "1")
		return c.NoContent(http.StatusOK)
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	if !fileInfo.Mode().IsRegular() {
		c.Response().Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
		c.Response().Header().Set("X-Sage-Preview-Missing", "1")
		return c.NoContent(http.StatusOK)
	}

	c.Response().Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
	return c.Stream(http.StatusOK, "application/octet-stream", file)
}

func (d *Controller) sageFsMkdir(c echo.Context) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	_, target, err := resolveSageFsPath(c, true)
	if err != nil {
		return c.JSON(statusCodeForSageFsError(err), echo.Map{"error": err.Error()})
	}
	sageFsFileMu.Lock()
	defer sageFsFileMu.Unlock()

	if err := os.MkdirAll(target, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

func (d *Controller) sageFsWriteFile(c echo.Context) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	_, target, err := resolveSageFsPath(c, true)
	if err != nil {
		return c.JSON(statusCodeForSageFsError(err), echo.Map{"error": err.Error()})
	}

	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	sageFsFileMu.Lock()
	defer sageFsFileMu.Unlock()
	mkdirRetries, err := retrySageFsIO(func() error {
		return os.MkdirAll(filepath.Dir(target), 0755)
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	writeRetries, err := retrySageFsIO(func() error {
		return os.WriteFile(target, body, 0644)
	})
	setSageFsRetryHeader(c, mkdirRetries+writeRetries)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

func (d *Controller) sageFsDeleteFile(c echo.Context) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	_, target, err := resolveSageFsPath(c, true)
	if err != nil {
		return c.JSON(statusCodeForSageFsError(err), echo.Map{"error": err.Error()})
	}
	sageFsFileMu.Lock()
	defer sageFsFileMu.Unlock()

	if err := os.Remove(target); err != nil && !os.IsNotExist(err) {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

func (d *Controller) sageFsDeleteFolder(c echo.Context) error {
	if err := d.requireLocalSageFsRequest(c); err != nil {
		return err
	}

	_, target, err := resolveSageFsPath(c, true)
	if err != nil {
		return c.JSON(statusCodeForSageFsError(err), echo.Map{"error": err.Error()})
	}
	sageFsFileMu.Lock()
	defer sageFsFileMu.Unlock()

	if err := os.RemoveAll(target); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

func (d *Controller) requireLocalSageFsRequest(c echo.Context) error {
	if !env.IsAppEnvLocal() {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "Sage filesystem bridge is only available in local mode"})
	}

	if !isLoopbackRemoteAddr(c.Request().RemoteAddr) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "Sage filesystem bridge only accepts local requests"})
	}

	origin := c.Request().Header.Get("Origin")
	if origin == "" {
		return nil
	}

	originUrl, err := url.Parse(origin)
	if err != nil || !isLoopbackHost(originUrl.Hostname()) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "Sage filesystem bridge only accepts local browser origins"})
	}

	return nil
}

func resolveSageFsPath(c echo.Context, cacheOnly bool) (string, string, error) {
	root, err := normalizeSageFsRoot(c.QueryParam("root"))
	if err != nil {
		return "", "", err
	}
	if !isEverQuestClientDirectory(root) {
		return "", "", fmt.Errorf("selected directory does not look like an EverQuest client directory")
	}

	requestedPath := c.QueryParam("path")
	if requestedPath == "" {
		requestedPath = root
	}

	target := requestedPath
	if !filepath.IsAbs(target) {
		target = filepath.Join(root, target)
	}

	target, err = filepath.Abs(filepath.Clean(target))
	if err != nil {
		return "", "", fmt.Errorf("invalid path")
	}

	allowedRoot := root
	if cacheOnly {
		allowedRoot = filepath.Join(root, "eqsage")
	}

	if !filepathcheck.IsWithinBaseDir(allowedRoot, target) {
		return "", "", fmt.Errorf("path traversal detected")
	}

	return root, target, nil
}

func normalizeSageFsRoot(root string) (string, error) {
	root = strings.TrimSpace(root)
	if root == "" {
		return "", fmt.Errorf("missing EverQuest directory")
	}

	absoluteRoot, err := filepath.Abs(filepath.Clean(root))
	if err != nil {
		return "", fmt.Errorf("invalid EverQuest directory")
	}

	info, err := os.Stat(absoluteRoot)
	if err != nil {
		return "", fmt.Errorf("EverQuest directory is not accessible")
	}
	if !info.IsDir() {
		return "", fmt.Errorf("EverQuest directory is not a directory")
	}

	return absoluteRoot, nil
}

func isEverQuestClientDirectory(root string) bool {
	if cached, ok := sageFsRootValidationCache.Load(root); ok {
		return cached.(bool)
	}

	entries, err := os.ReadDir(root)
	if err != nil {
		sageFsRootValidationCache.Store(root, false)
		return false
	}

	hasClientMarker := false
	hasAssetFile := false
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := strings.ToLower(entry.Name())
		if name == "eqgame.exe" || name == "eqclient.ini" {
			hasClientMarker = true
		}
		if strings.HasSuffix(name, ".s3d") || strings.HasSuffix(name, ".eqg") {
			hasAssetFile = true
		}
		if hasClientMarker && hasAssetFile {
			sageFsRootValidationCache.Store(root, true)
			return true
		}
	}

	sageFsRootValidationCache.Store(root, false)
	return false
}

func isLoopbackHost(host string) bool {
	host = strings.ToLower(strings.TrimSpace(host))
	if ip := net.ParseIP(host); ip != nil {
		return ip.IsLoopback()
	}
	return host == "localhost" ||
		host == "[::1]" ||
		host == "host.docker.internal"
}

func isLoopbackRemoteAddr(remoteAddr string) bool {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		host = remoteAddr
	}
	host = strings.Trim(host, "[]")

	if ip := net.ParseIP(host); ip != nil {
		return ip.IsLoopback()
	}

	return isLoopbackHost(host)
}

func statusCodeForSageFsError(err error) int {
	if err == nil {
		return http.StatusOK
	}
	if strings.Contains(err.Error(), "traversal") {
		return http.StatusForbidden
	}
	return http.StatusBadRequest
}
