package controllers

import (
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestAchievementEditorRepositoryDTOsIgnoreManuallyHydratedRelations(t *testing.T) {
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN:                       "user:pass@tcp(localhost:3306)/eqemu_content",
		SkipInitializeWithVersion: true,
	}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatalf("create dry-run GORM DB: %v", err)
	}

	t.Run("definition graph", func(t *testing.T) {
		graph := achievementEditorGraph{}
		query := db.Table("achievements").Where("id = ?", 1001).Take(&graph)
		if query.Error != nil {
			t.Fatalf("build definition load query: %v", query.Error)
		}
	})

	t.Run("components", func(t *testing.T) {
		statement := &gorm.Statement{DB: db}
		if err := statement.Parse(&achievementEditorComponent{}); err != nil {
			t.Fatalf("parse component hydration destination: %v", err)
		}
	})

	t.Run("reward sets", func(t *testing.T) {
		statement := &gorm.Statement{DB: db}
		if err := statement.Parse(&achievementEditorRewardSet{}); err != nil {
			t.Fatalf("parse reward-set hydration destination: %v", err)
		}
	})
}
