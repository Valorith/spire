package updater

import (
	"bufio"
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"github.com/EQEmuTools/spire/internal/download"
	"github.com/EQEmuTools/spire/internal/env"
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
	"github.com/EQEmuTools/spire/internal/unzip"
	"github.com/google/go-github/v41/github"
	"github.com/mattn/go-isatty"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
)

// Updater is a service that checks for updates to the app
type Updater struct {
	// this is the package.json embedded in the binary which contains the app version
	packageJson               []byte
	logger                    *logger.AppLogger
	serverconfig              *eqemuserverconfig.Config
	unzipper                  *unzip.Unzipper
	githubClient              *github.Client
	goos                      string
	goarch                    string
	releaseRepositoryOverride string
}

// NewUpdater creates a new updater service
func NewUpdater(packageJson []byte) *Updater {
	appLogger := logger.ProvideAppLogger()
	pathmgr := pathmgmt.NewPathManagement(appLogger)
	return &Updater{
		packageJson: packageJson,
		logger:      appLogger,
		serverconfig: eqemuserverconfig.NewConfig(
			appLogger,
			pathmgr,
		),
		unzipper:                  unzip.NewUnzipper(appLogger),
		githubClient:              newDefaultGitHubClient(),
		goos:                      runtime.GOOS,
		goarch:                    runtime.GOARCH,
		releaseRepositoryOverride: os.Getenv("SPIRE_RELEASE_REPO"),
	}
}

// EnvResponse is the response from the env endpoint
type EnvResponse struct {
	Env     string `json:"env"`
	Version string `json:"version"`
}

// PackageJson is the package.json file
type PackageJson struct {
	Name       string `json:"name"`
	Version    string `json:"version"`
	Repository struct {
		Type string `json:"type"`
		URL  string `json:"url"`
	} `json:"repository"`
}

// getAppVersion gets the app version from the package.json embedded in the binary
func (s *Updater) getAppVersion() (error, EnvResponse) {
	var pkg PackageJson
	err := json.Unmarshal(s.packageJson, &pkg)
	if err != nil {
		return err, EnvResponse{}
	}

	return nil, EnvResponse{
		Env:     env.Get("APP_ENV", "local"),
		Version: pkg.Version,
	}
}

// CheckForUpdates checks for updates to the app
func (s *Updater) CheckForUpdates(interactive bool) bool {
	config, configErr := s.serverconfig.Get()
	if configErr == nil && config.Spire.DisableAutoUpdates && interactive {
		s.logger.Info().
			Any("spire.disable_auto_updates", config.Spire.DisableAutoUpdates).
			Msg("Auto updates are disabled via config")
		return false
	}

	// get executable name and path
	executableName := filepath.Base(os.Args[0])
	ex, err := os.Executable()
	if err != nil {
		fmt.Println(err)
	}
	executablePath := filepath.Dir(ex)

	s.logger.Debug().
		Any("executableName", executableName).
		Any("executablePath", executablePath).
		Msg("Checking for updates")

	// check if a .old version exists, delete it if does
	oldExecutable := filepath.Join(executablePath, fmt.Sprintf("%s.old", executableName))
	if _, err := os.Stat(oldExecutable); err == nil {
		s.logger.Info().Any("oldExecutable", oldExecutable).Msg("Removing old executable")
		e := os.Remove(oldExecutable)
		if e != nil {
			s.logger.Fatal().Err(e).Msg("Failed to remove old executable")
		}
	}

	// if being ran from go run main.go
	if executableName == "main.exe" || executableName == "main" {
		s.logger.Info().Msg("Running as go run main.go, ignoring...")
		return false
	}

	s.logger.Info().Msg("Checking for updates")
	s.logger.Info().Any("executableName", executableName).Msg("Running as binary")
	s.logger.Debug().Any("executableName", executableName).Msg("Checking for updates")

	status, selected, err := s.resolveUpdate(context.Background())
	if err != nil {
		s.logger.Info().Err(err).Msg("Failed to resolve an eligible Spire release")
		return false
	}
	if !status.Available || selected == nil {
		s.logger.Info().
			Any("version", status.CurrentVersion).
			Any("channel", status.Channel).
			Msg("Spire is already up to date")
		return false
	}

	// remove asset check file if we have an update
	tmpFile := filepath.Join(os.TempDir(), "spire_asset_last_check")
	if _, err := os.Stat(tmpFile); err == nil {
		e := os.Remove(tmpFile)
		if e != nil {
			s.logger.Fatal().Err(e).Msg("Failed to remove asset check file")
		}
	}

	s.logger.Info().
		Any("local", status.CurrentVersion).
		Any("latest", selected.release.GetTagName()).
		Any("channel", status.Channel).
		Any("release_type", status.Release.ReleaseType).
		Msg("Comparing local version to latest version")

	assetName := selected.asset.GetName()
	downloadURL := selected.asset.GetBrowserDownloadURL()
	targetFileNameZipped := targetReleaseAssetName(s.goos, s.goarch)
	targetFileName := fmt.Sprintf("spire-%s-%s", s.goos, s.goarch)

	s.logger.Debug().
		Any("assetName", assetName).
		Any("targetFileNameZipped", targetFileNameZipped).
		Msg("Checking asset")

	hash := fmt.Sprintf("%x", md5.Sum([]byte(downloadURL)))
	tmpdir := filepath.Join(os.TempDir(), "spire-update", hash)
	_ = os.MkdirAll(tmpdir, os.ModePerm)

	s.logger.Info().Any("assetName", assetName).Msg("Found matching release")

	file := path.Base(downloadURL)
	downloadPath := filepath.Join(tmpdir, file)
	err = download.WithProgress(downloadPath, downloadURL)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to download asset")
	}

	tempFileZipped := filepath.Join(tmpdir, targetFileNameZipped)
	err = s.unzipper.Extract(tempFileZipped, tmpdir)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to extract zip")
	}

	err = os.Rename(
		filepath.Join(executablePath, executableName),
		filepath.Join(executablePath, fmt.Sprintf("%s.old", executableName)),
	)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to rename executable")
	}

	lookTempFile := filepath.Join(tmpdir, targetFileName)
	tempFile, err := exec.LookPath(lookTempFile)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to find executable")
	}

	newExecutable := fmt.Sprintf("%s%s%s", executablePath, string(filepath.Separator), executableName)
	err = moveFile(tempFile, newExecutable)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to move executable")
	}

	err = os.Chmod(newExecutable, 0755)
	if err != nil {
		s.logger.Fatal().Err(err).Msg("Failed to chmod executable")
	}

	if isatty.IsTerminal(os.Stdout.Fd()) && interactive {
		s.logger.Info().
			Any("version", selected.release.GetTagName()).
			Msgf("Spire successfully updated, you must relaunch Spire manually")
		s.logger.Info().Msg("Press any key to continue...")
		bufio.NewReader(os.Stdin).ReadBytes('\n')
		return true
	}

	s.logger.Info().
		Any("version", selected.release.GetTagName()).
		Msgf("Spire successfully updated, you must relaunch Spire manually")
	return true
}
