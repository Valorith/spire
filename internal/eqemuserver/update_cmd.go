package eqemuserver

import (
	"fmt"
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
	"github.com/EQEmuTools/spire/internal/spire"
	version "github.com/hashicorp/go-version"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/process"
	"github.com/spf13/cobra"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

type UpdateCommand struct {
	logger       *logger.AppLogger
	command      *cobra.Command
	serverconfig *eqemuserverconfig.Config
	settings     *spire.Settings
	pathmgmt     *pathmgmt.PathManagement
	launcher     *Launcher
	updater      *Updater
}

func (c *UpdateCommand) Command() *cobra.Command {
	return c.command
}

var useReleaseBinaries bool
var auto bool

// var flagAuthEnabled bool
var compileServer bool
var compileLocation string

// NewUpdateCommand creates a new spire:init command
func NewUpdateCommand(
	logger *logger.AppLogger,
	serverconfig *eqemuserverconfig.Config,
	settings *spire.Settings,
	pathmgmt *pathmgmt.PathManagement,
	launcher *Launcher,
	updater *Updater,

) *UpdateCommand {
	i := &UpdateCommand{
		logger:       logger,
		serverconfig: serverconfig,
		settings:     settings,
		pathmgmt:     pathmgmt,
		updater:      updater,
		launcher:     launcher,
		command: &cobra.Command{
			Use:   "eqemu-server:update",
			Short: "Extends Spire Admin server update functionality",
		},
	}

	// add flag --compile-server
	// add flag --compile-build-location
	// add flag --use-release-binaries
	i.command.PersistentFlags().BoolVarP(&useReleaseBinaries, "release-binaries", "r", false, "Whether or not to use release binaries")
	i.command.PersistentFlags().BoolVarP(&compileServer, "compile-server", "c", false, "Whether or not the server should be compiled (default: false - uses releases)")
	i.command.PersistentFlags().StringVarP(&compileLocation, "compile-build-location", "l", "~/code/build", "Determines where the binaries should be built")
	i.command.PersistentFlags().BoolVarP(&auto, "auto", "a", false, "Automatically update wihout prompts (default: false)")

	i.command.RunE = i.Handle

	return i
}

func (c *UpdateCommand) Handle(_ *cobra.Command, args []string) error {
	if useReleaseBinaries {
		fmt.Println("Setting to use release binaries")
		c.settings.SetSetting(spire.SettingUpdateType, spire.UpdateTypeRelease)
	}
	if compileServer {
		fmt.Println("Setting to compile server")
		c.settings.SetSetting(spire.SettingUpdateType, spire.UpdateTypeSelfCompiled)

		info, err := c.updater.GetBuildInfo()
		if err != nil {
			c.logger.Fatal().Err(err).Msg("Failed to get build info")
		}

		c.logger.Info().
			Any("source", info.SourceDirectory).
			Any("build_tool", info.BuildTool).
			Any("build_cores", info.BuildCores).
			Msg("Setting source directory")

		// set build cores if not set
		if info.BuildCores == "" {
			// default to 1 core
			cores := 1

			// get system memory available
			memory, err := mem.VirtualMemory()
			if err != nil {
				c.logger.Fatal().Err(err).Msg("Failed to get system memory")
			}

			// get system memory available in GB
			memoryAvailableGb := memory.Available / 1024 / 1024 / 1024
			if memoryAvailableGb >= 10 {
				cores = runtime.NumCPU() - 4
				if cores < 1 {
					cores = 1
				}
			} else if memoryAvailableGb >= 6 {
				cores = 4
			}

			c.settings.SetSetting(spire.SettingBuildCores, strconv.Itoa(cores))
		}

		if compileLocation != "" {
			c.logger.Info().Any("location", compileLocation).Msg("Setting compile location")

			c.settings.SetSetting(spire.SettingBuildLocation, compileLocation)
		}
	}

	// check if server is online
	online := false
	processes, _ := process.Processes()
	for _, p := range processes {
		cmdline, _ := p.Cmdline()
		if strings.Contains(cmdline, "world") {
			online = true
		}
	}

	padSize := 15

	// print current settings
	// string repeat -
	c.LineBreak()
	fmt.Println(" Current settings")
	c.LineBreak()
	updateType := c.updater.GetUpdateType()
	fmt.Printf(" %*s | %v\n", padSize, "Update Type", updateType)

	if updateType == spire.UpdateTypeSelfCompiled {
		fmt.Printf(" %*s | %v\n", padSize, "Build Location", c.updater.GetBuildLocation())
	}
	info, _ := c.updater.GetVersionInfo()

	compileTime := fmt.Sprintf(" (%s %s)", info.CompileDate, info.CompileTime)
	if info.ServerVersion == "" {
		info.ServerVersion = "0.0.0"
		compileTime = ""
	}

	fmt.Printf(
		" %*s | %v%v\n",
		padSize,
		"Current",
		info.ServerVersion,
		compileTime,
	)

	c.LineBreak()

	// handle release updates
	if updateType == spire.UpdateTypeRelease {
		latestVer, err := c.updater.GetLatestReleaseVersion()
		if err != nil {
			c.logger.Fatal().Err(err).Msg("Failed to get latest release version")
		}

		fmt.Printf(" %*s | %v\n", padSize, "Latest Release", latestVer)

		c.LineBreak()

		// if server version is empty, set to 0.0.0
		if info.ServerVersion == "" {
			info.ServerVersion = "0.0.0"
		}

		localVersion, err := version.NewVersion(info.ServerVersion)
		if err != nil {
			c.logger.Fatal().Err(err).Msg("Failed to get local version")
		}

		latestVersion, err := version.NewVersion(latestVer)
		if err != nil {
			c.logger.Fatal().Err(err).Msg("Failed to get latest version")
		}

		if localVersion.GreaterThanOrEqual(latestVersion) {
			fmt.Println("Already up to date")
			os.Exit(0)
		} else if online {
			fmt.Println("Server is online, in order to update you need to stop the server first")

			if !auto {
				// prompt user to stop server y/n
				// if yes, stop server
				var answer string
				fmt.Printf("Stop server? [y/n] ")
				fmt.Scanln(&answer)
				fmt.Printf("\n")

				if answer == "y" {
					fmt.Println("Stopping server")
				} else {
					return nil
				}
			} else {
				fmt.Println("Stopping server")
			}
		}

		// update server
		if localVersion.LessThan(latestVersion) {
			fmt.Println("Updating server")
			release := fmt.Sprintf(
				"https://github.com/EQEmu/Server/releases/download/v%s/eqemu-server-linux-x64.zip",
				latestVersion.String(),
			)
			err := c.installRelease(release, online)
			if err != nil {
				return err
			}

			if !auto {
				var answer string
				fmt.Printf("Start server? [y/n] ")
				fmt.Scanln(&answer)
				fmt.Printf("\n")

				if answer == "y" {
					fmt.Println("Starting server")
					if err := c.launcher.StartLauncherProcess(); err != nil {
						return err
					}
				}
			} else {
				fmt.Println("Starting server")
				if err := c.launcher.StartLauncherProcess(); err != nil {
					return err
				}
			}
		} else {
			fmt.Println("Server is already up to date")
		}
	}

	// handle self compiled
	if updateType == spire.UpdateTypeSelfCompiled {
		if runtime.GOOS != "linux" {
			c.logger.Fatal().Any("os", runtime.GOOS).Msg("Self compiled updates are only supported on linux")
		}

		fmt.Println("Starting")
		c.LineBreak()

		info, _ := c.updater.GetBuildInfo()

		fmt.Println("git pull")
		c.LineBreak()

		cmd := exec.Command("git", "pull")
		cmd.Stdout = os.Stdout
		cmd.Dir = info.SourceDirectory
		err := cmd.Run()
		if err != nil {
			c.logger.Info().Err(err).Msg("Failed to pull latest changes")
		}

		c.LineBreak()
		fmt.Println(info.BuildTool, "-j"+info.BuildCores)
		c.LineBreak()

		// validate build tool types (make, ninja, gcc etc)
		if info.BuildTool == "" {
			c.logger.Fatal().Msg("Build tool not found")
		}

		buildToolTypes := []string{"make", "ninja"}
		found := false
		for _, t := range buildToolTypes {
			if t == filepath.Base(info.BuildTool) {
				found = true
			}
		}

		if !found {
			c.logger.Fatal().Msg("Invalid build tool")
			return fmt.Errorf("invalid build tool")
		}

		cmd = exec.Command(info.BuildTool, "-j"+info.BuildCores)
		cmd.Dir = info.SourceDirectory
		cmd.Stdout = os.Stdout
		err = cmd.Run()
		if err != nil {
			c.logger.Info().Err(err).Msg("Failed to build server")
		}

		c.LineBreak()
	}
	return nil
}

// Keep server power actions excluded until release extraction has completed.
func (c *UpdateCommand) installRelease(release string, wasOnline bool) error {
	unlock, err := c.launcher.lockPowerAction()
	if err != nil {
		return fmt.Errorf("cannot claim server power action; update aborted: %w", err)
	}
	defer unlock()
	unlockStartup, err := c.launcher.lockStartup()
	if err != nil {
		return fmt.Errorf("cannot claim server executable access; update aborted: %w", err)
	}
	defer unlockStartup()
	cfg, err := c.launcher.serverconfig.Get()
	if err != nil {
		return err
	}
	if wasOnline || cfg.Spire.LauncherStart {
		c.launcher.SetStopTimer(0)
		if err := c.launcher.stopProcessesUnlocked(); err != nil {
			return fmt.Errorf("cannot stop server; update aborted: %w", err)
		}
	}
	return c.updater.InstallRelease(release)
}

func (c *UpdateCommand) LineBreak() {
	fmt.Println(strings.Repeat("-", 40))
}
