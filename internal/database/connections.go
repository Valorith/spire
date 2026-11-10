package database

import (
	"fmt"
	"strings"

	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/models"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// Connections application database connections
type Connections struct {
	spireDb *gorm.DB
	eqemuDb *gorm.DB
	logger  *logger.AppLogger
}

func (c *Connections) EqemuDb() *gorm.DB {
	return c.eqemuDb
}

func (c *Connections) SpireDb() *gorm.DB {
	return c.spireDb
}

func (c *Connections) SpireDbNoLog() *gorm.DB {
	return c.spireDb.Session(&gorm.Session{Logger: gormLogger.Default.LogMode(gormLogger.Silent)})
}

func NewConnections(
	spire *gorm.DB,
	EQEmu *gorm.DB,
	logger *logger.AppLogger,
) *Connections {
	return &Connections{
		spireDb: spire,
		eqemuDb: EQEmu,
		logger:  logger,
	}
}

var spireTables = []models.Modelable{
	&models.User{},
	&models.UserServerDatabaseConnection{},
	&models.ServerDatabaseConnection{},
	&models.AnalyticEvent{},
	&models.AnalyticEventCount{},
	&models.UserEventLog{},
	&models.PlayerSupportCase{},
	&models.PlayerSupportEntry{},
	&models.PlayerSupportChat{},
	&models.PlayerSupportReply{},
	&models.PlayerSupportSettings{},
	&models.PlayerSupportAccountNote{},
	&models.PlayerSupportCaseLink{},
	&models.PlayerSupportPersona{},
	&models.UserServerResourcePermission{},
	&models.CrashReport{},
	&models.Setting{},
}

// SpireMigrate creates and updates every Spire table. A table that cannot be
// migrated is logged and skipped, so it never blocks the tables after it; the
// returned error lists every table that failed.
func (c *Connections) SpireMigrate(drop bool) error {
	var failed []string
	for _, table := range spireTables {
		if drop {
			c.logger.Info().Msgf("Dropping table [%v]\n", table.TableName())
			_ = c.SpireDb().Migrator().DropTable(table)
		}

		// build migrator instance
		migrator := c.SpireDb().
			Session(&gorm.Session{Logger: gormLogger.Default.LogMode(gormLogger.Silent)}).
			Migrator()

		// only emit creation message when the table doesn't actually exist
		if !migrator.HasTable(table) {
			c.logger.Info().Any("table", table.TableName()).Msg("Creating table")
		} else {
			c.logger.DebugVvv().Any("table", table.TableName()).Msg("Already has table")
		}

		// always run migration incase there are schema changes
		if err := migrator.AutoMigrate(table); err != nil {
			c.logger.Error().Any("table", table.TableName()).Err(err).Msg("Spire table migration failed")
			failed = append(failed, fmt.Sprintf("%s: %v", table.TableName(), err))
		}
	}
	if len(failed) > 0 {
		return fmt.Errorf("spire table migration failed for %d table(s): %s", len(failed), strings.Join(failed, "; "))
	}
	return nil
}

func (c *Connections) GetMigrationTables() []string {
	var tables []string
	for _, table := range spireTables {
		tables = append(tables, table.TableName())
	}

	return tables
}
