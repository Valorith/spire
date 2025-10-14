package boot

import (
	"github.com/EQEmuTools/spire/internal/assets"
	"github.com/EQEmuTools/spire/internal/auditlog"
	"github.com/EQEmuTools/spire/internal/backup"
	"github.com/EQEmuTools/spire/internal/clientfiles"
	"github.com/EQEmuTools/spire/internal/connection"
	"github.com/EQEmuTools/spire/internal/desktop"
	"github.com/EQEmuTools/spire/internal/eqemuanalytics"
	"github.com/EQEmuTools/spire/internal/eqemuchangelog"
	"github.com/EQEmuTools/spire/internal/eqemuloginserver"
	"github.com/EQEmuTools/spire/internal/eqemuserver"
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/github"
	"github.com/EQEmuTools/spire/internal/influx"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
	"github.com/EQEmuTools/spire/internal/permissions"
	"github.com/EQEmuTools/spire/internal/questapi"
	"github.com/EQEmuTools/spire/internal/spire"
	"github.com/EQEmuTools/spire/internal/telnet"
	"github.com/EQEmuTools/spire/internal/unzip"
	"github.com/EQEmuTools/spire/internal/user"
	"github.com/EQEmuTools/spire/internal/websocket"
	pluralize "github.com/gertd/go-pluralize"
	"github.com/google/wire"
)

var serviceSet = wire.NewSet(
	influx.NewClient,
	connection.NewCreate,
	connection.NewCheck,
	github.NewGithubSourceDownloader,
	questapi.NewParseService,
	questapi.NewExamplesGithubSourcer,
	desktop.NewWebBoot,
	clientfiles.NewExporter,
	clientfiles.NewImporter,
	eqemuserverconfig.NewConfig,
	eqemuloginserver.NewConfig,
	pathmgmt.NewPathManagement,
	permissions.NewService,
	pluralize.NewClient,
	auditlog.NewUserEvent,
	assets.NewSpireAssets,
	eqemuchangelog.NewChangelog,
	eqemuanalytics.NewReleases,
	user.NewUser,
	spire.NewSettings,
	spire.NewInit,
	telnet.NewClient,
	eqemuserver.NewClient,
	backup.NewMysql,
	websocket.NewHandler,
	eqemuserver.NewUpdater,
	eqemuserver.NewLauncher,
	eqemuserver.NewQuestHotReloadWatcher,
	unzip.NewUnzipper,
	websocket.NewClientManager,
	eqemuserver.NewCrashLogWatcher,
)
