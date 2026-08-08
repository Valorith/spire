package controllers

import (
	"strings"
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
		if relations := query.Statement.Schema.Relationships.Relations; len(relations) != 0 {
			t.Fatalf("definition graph unexpectedly discovered GORM relationships: %+v", relations)
		}
	})

	t.Run("components", func(t *testing.T) {
		statement := &gorm.Statement{DB: db}
		if err := statement.Parse(&achievementEditorComponent{}); err != nil {
			t.Fatalf("parse component hydration destination: %v", err)
		}
		if relations := statement.Schema.Relationships.Relations; len(relations) != 0 {
			t.Fatalf("component DTO unexpectedly discovered GORM relationships: %+v", relations)
		}
	})

	t.Run("reward sets", func(t *testing.T) {
		statement := &gorm.Statement{DB: db}
		if err := statement.Parse(&achievementEditorRewardSet{}); err != nil {
			t.Fatalf("parse reward-set hydration destination: %v", err)
		}
		if relations := statement.Schema.Relationships.Relations; len(relations) != 0 {
			t.Fatalf("reward-set DTO unexpectedly discovered GORM relationships: %+v", relations)
		}
	})
}

func TestAchievementEditorTitleSetLookupSelectsOneStableRowPerSet(t *testing.T) {
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN:                       "user:pass@tcp(localhost:3306)/eqemu_content",
		SkipInitializeWithVersion: true,
	}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatalf("create dry-run GORM DB: %v", err)
	}

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return achievementEditorTitleSetLookupQuery(tx, "hero", nil).Limit(20).Find(&[]achievementEditorLookupOption{})
	})
	for _, fragment := range []string{"MIN(id) AS id", "GROUP BY `title_set`", "selected_title_set.id = title_row.id"} {
		if !strings.Contains(sql, fragment) {
			t.Fatalf("title-set lookup SQL is missing %q: %s", fragment, sql)
		}
	}
	if strings.Contains(sql, "GROUP BY title_set, prefix, suffix, id") {
		t.Fatalf("title-set lookup still groups by row identity instead of set identity: %s", sql)
	}
}
