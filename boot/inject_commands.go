package boot

import (
	"github.com/EQEmuTools/spire/internal/console/cmd"
	"github.com/EQEmuTools/spire/internal/eqemuchangelog"
	"github.com/EQEmuTools/spire/internal/eqemuserver"
	"github.com/EQEmuTools/spire/internal/eqtraders"
	"github.com/EQEmuTools/spire/internal/generators"
	"github.com/EQEmuTools/spire/internal/model"
	"github.com/EQEmuTools/spire/internal/questapi"
	"github.com/EQEmuTools/spire/internal/spire"
	"github.com/EQEmuTools/spire/internal/user"
	_ "github.com/go-sql-driver/mysql"
	"github.com/google/wire"
	"github.com/spf13/cobra"
)

// commandSet is a Wire provider set that returns a slice of commands
var commandSet = wire.NewSet(
	cmd.NewHelloWorldCommand,
	user.NewCreateCommand,
	model.NewGeneratorCommand,
	cmd.NewHttpServeCommand,
	questapi.NewParseCommand,
	cmd.NewRoutesListCommand,
	spire.NewMigrateCommand,
	questapi.NewExampleTestCommand,
	generators.NewRaceModelMapsCommand,
	cmd.NewTestFilesystemCommand,
	spire.NewInitCommand,
	user.NewChangePasswordCommand,
	spire.NewCrashAnalyticsCommand,
	eqemuserver.NewUpdateCommand,
	eqemuserver.NewLauncherCmd,
	eqemuserver.NewLauncherShimCmd,
	eqtraders.NewScrapeCommand,
	eqtraders.NewImportCommand,
	eqemuchangelog.NewChangelogCommand,
	ProvideCommands,
)

// ProvideCommands is a Wire provider function that returns a slice of commands
func ProvideCommands(
	helloWorldCommand *cmd.HelloWorldCommand,
	userCreateCommand *user.CreateCommand,
	generateModelsCommand *model.GeneratorCommand,
	httpServeCommand *cmd.HttpServeCommand,
	routesListCommand *cmd.RoutesListCommand,
	spireMigrateCommand *spire.MigrateCommand,
	questApiParseCommand *questapi.ParseCommand,
	questExampleTestCommand *questapi.ExampleTestCommand,
	generateRaceModelMapsCommand *generators.RaceModelMapsCommand,
	changelogCmd *eqemuchangelog.ChangelogCommand,
	testFilesystemCmd *cmd.TestFilesystemCommand,
	spireInstallCmd *spire.InitCommand,
	userChangePasswordCmd *user.ChangePasswordCommand,
	spireCrashAnalyticsCommand *spire.CrashAnalyticsFingerprintBackfillCommand,
	eqEmuServerUpdateCommand *eqemuserver.UpdateCommand,
	eqEmuServerLauncherCommand *eqemuserver.LauncherCmd,
	eqEmuServerLauncherShimCommand *eqemuserver.LauncherShimCmd,
	scrapeEqtradersCommand *eqtraders.ScrapeCommand,
	importEqtradersCommand *eqtraders.ImportCommand,
) []*cobra.Command {
	return []*cobra.Command{
		helloWorldCommand.Command(),
		userCreateCommand.Command(),
		generateModelsCommand.Command(),
		httpServeCommand.Command(),
		routesListCommand.Command(),
		spireMigrateCommand.Command(),
		questApiParseCommand.Command(),
		questExampleTestCommand.Command(),
		generateRaceModelMapsCommand.Command(),
		changelogCmd.Command(),
		testFilesystemCmd.Command(),
		spireInstallCmd.Command(),
		userChangePasswordCmd.Command(),
		spireCrashAnalyticsCommand.Command(),
		eqEmuServerUpdateCommand.Command(),
		scrapeEqtradersCommand.Command(),
		importEqtradersCommand.Command(),
		eqEmuServerLauncherCommand.Command(),
		eqEmuServerLauncherShimCommand.Command(),
	}
}
