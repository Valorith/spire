package database

import (
	"os"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// TestSpireMigrateIntegration upgrades a Spire schema on a real MySQL or
// MariaDB server. Set SPIRE_MIGRATE_IT_MYSQL to a DSN without a database name
// (user:pass@tcp(host:port)/); it uses and drops its own scratch schema.
//
// One earlier table is broken on purpose: it must be reported and must not
// stop the Player Support tables after it, and an entries table from the
// v5.9.0 schema must get the newer "subject" column.
func TestSpireMigrateIntegration(t *testing.T) {
	dsn := os.Getenv("SPIRE_MIGRATE_IT_MYSQL")
	if dsn == "" {
		t.Skip("set SPIRE_MIGRATE_IT_MYSQL to run")
	}
	quiet := &gorm.Config{Logger: gormLogger.Default.LogMode(gormLogger.Silent), DisableForeignKeyConstraintWhenMigrating: true}
	root, err := gorm.Open(mysql.Open(dsn+"?parseTime=true"), quiet)
	if err != nil {
		t.Fatal(err)
	}
	const scratch = "spire_migrate_it"
	if err := root.Exec("DROP DATABASE IF EXISTS " + scratch).Error; err != nil {
		t.Fatal(err)
	}
	if err := root.Exec("CREATE DATABASE " + scratch).Error; err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { root.Exec("DROP DATABASE IF EXISTS " + scratch) })
	db, err := gorm.Open(mysql.New(mysql.Config{DSN: dsn + scratch + "?charset=utf8mb4&parseTime=True&loc=Local", DisableWithReturning: true}), quiet)
	if err != nil {
		t.Fatal(err)
	}
	for _, statement := range []string{
		// A value AutoMigrate cannot convert to the model's datetime column.
		"CREATE TABLE spire_analytic_events (id bigint unsigned AUTO_INCREMENT PRIMARY KEY, updated_at varchar(32))",
		"INSERT INTO spire_analytic_events (updated_at) VALUES ('not a date')",
		// spire_player_support_entries as v5.9.0 created it, with a row.
		"CREATE TABLE spire_player_support_entries (id bigint unsigned AUTO_INCREMENT PRIMARY KEY, case_id bigint unsigned, kind varchar(16), actor varchar(100), " +
			"text text, delivery varchar(16), recipient varchar(64), request_key varchar(96), created_at datetime(3), " +
			"UNIQUE KEY idx_spire_player_support_entries_request_key (request_key), KEY idx_spire_player_support_entries_case_id (case_id))",
		"INSERT INTO spire_player_support_entries (case_id, kind, actor, text, request_key, created_at) VALUES (1, 'note', 'Guide', 'Kept', 'k1', NOW())",
	} {
		if err := db.Exec(statement).Error; err != nil {
			t.Fatal(err)
		}
	}

	err = NewConnections(db, nil, logger.NewAppLogger()).SpireMigrate(false)
	if err == nil || !strings.Contains(err.Error(), "spire_analytic_events") || strings.Contains(err.Error(), "spire_player_support") {
		t.Fatalf("SpireMigrate() = %v, want only spire_analytic_events reported", err)
	}
	migrator := db.Migrator()
	if !migrator.HasColumn(&models.PlayerSupportEntry{}, "subject") {
		t.Error("spire_player_support_entries has no subject column")
	}
	for _, table := range []models.Modelable{&models.PlayerSupportAccountNote{}, &models.PlayerSupportCaseLink{}, &models.Setting{}, &models.CrashReport{}} {
		if !migrator.HasTable(table) {
			t.Errorf("%s was not created after the failing table", table.TableName())
		}
	}
	var kept string
	if err := db.Raw("SELECT text FROM spire_player_support_entries WHERE request_key = 'k1'").Scan(&kept).Error; err != nil || kept != "Kept" {
		t.Errorf("existing entry: %q, %v", kept, err)
	}
}
