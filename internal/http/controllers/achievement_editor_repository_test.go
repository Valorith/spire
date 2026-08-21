package controllers

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"io"
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

func TestAchievementEditorAAAbilityLookupKeepsDisabledExactIDsRepairable(t *testing.T) {
	where, _ := achievementEditorAAAbilityLookupWhere("martial", nil)
	if joined := strings.Join(where, " "); !strings.Contains(joined, "enabled = 1 AND name LIKE") {
		t.Fatalf("text AA search did not limit results to enabled abilities: %s", joined)
	}

	where, _ = achievementEditorAAAbilityLookupWhere("30300", nil)
	joined := strings.Join(where, " ")
	if !strings.Contains(joined, "id = ?") || !strings.Contains(joined, "enabled = 1 AND name LIKE") {
		t.Fatalf("exact AA search cannot surface a disabled legacy row while keeping fuzzy results enabled-only: %s", joined)
	}

	where, _ = achievementEditorAAAbilityLookupWhere("", []uint32{30300})
	joined = strings.Join(where, " ")
	if !strings.Contains(joined, "id IN ?") || strings.Contains(joined, "enabled = 1") {
		t.Fatalf("AA ID prefill unexpectedly hid disabled rows needed for repair: %s", joined)
	}
}

func TestAchievementEditorAARankCatalogQueryIsSingleOrderedBoundedFetch(t *testing.T) {
	db, err := gorm.Open(mysql.New(mysql.Config{
		DSN:                       "user:pass@tcp(localhost:3306)/eqemu_content",
		SkipInitializeWithVersion: true,
	}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatalf("create dry-run GORM DB: %v", err)
	}

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return achievementEditorAARankCatalogQuery(tx).Find(&[]achievementEditorAARankRow{})
	})
	for _, fragment := range []string{"FROM `aa_ranks`", "ORDER BY id", "LIMIT 100001"} {
		if !strings.Contains(sql, fragment) {
			t.Fatalf("AA rank catalog SQL is missing %q: %s", fragment, sql)
		}
	}
}

func TestLoadAchievementEditorAARankChainsQueriesCatalogOnce(t *testing.T) {
	recorder := &achievementEditorQueryRecorder{}
	sqlDB := sql.OpenDB(achievementEditorRecordingConnector{recorder: recorder})
	t.Cleanup(func() { _ = sqlDB.Close() })
	db, err := gorm.Open(mysql.New(mysql.Config{
		Conn:                      sqlDB,
		SkipInitializeWithVersion: true,
	}), &gorm.Config{DisableAutomaticPing: true})
	if err != nil {
		t.Fatalf("create recording GORM DB: %v", err)
	}

	_, err = loadAchievementEditorAARankChains(
		db,
		map[uint32]int64{30: 100, 40: 200},
		map[uint32]uint32{30: 2, 40: 3},
	)
	if err != nil {
		t.Fatalf("load rank chains from recording catalog: %v", err)
	}
	if len(recorder.queries) != 1 {
		t.Fatalf("aa_ranks query count = %d, want one catalog fetch for all requested abilities", len(recorder.queries))
	}
	if query := recorder.queries[0]; !strings.Contains(query, "FROM `aa_ranks`") {
		t.Fatalf("recorded query was not the AA rank catalog fetch: %s", query)
	}
}

type achievementEditorQueryRecorder struct {
	queries []string
}

type achievementEditorRecordingConnector struct {
	recorder *achievementEditorQueryRecorder
}

func (c achievementEditorRecordingConnector) Connect(context.Context) (driver.Conn, error) {
	return &achievementEditorRecordingConn{recorder: c.recorder}, nil
}

func (c achievementEditorRecordingConnector) Driver() driver.Driver {
	return achievementEditorRecordingDriver{recorder: c.recorder}
}

type achievementEditorRecordingDriver struct {
	recorder *achievementEditorQueryRecorder
}

func (d achievementEditorRecordingDriver) Open(string) (driver.Conn, error) {
	return &achievementEditorRecordingConn{recorder: d.recorder}, nil
}

type achievementEditorRecordingConn struct {
	recorder *achievementEditorQueryRecorder
}

func (*achievementEditorRecordingConn) Prepare(string) (driver.Stmt, error) {
	return nil, errors.New("prepared statements are not supported by the recording test connection")
}

func (*achievementEditorRecordingConn) Close() error { return nil }

func (*achievementEditorRecordingConn) Begin() (driver.Tx, error) {
	return nil, errors.New("transactions are not supported by the recording test connection")
}

func (c *achievementEditorRecordingConn) QueryContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Rows, error) {
	c.recorder.queries = append(c.recorder.queries, query)
	return achievementEditorEmptyRows{}, nil
}

type achievementEditorEmptyRows struct{}

func (achievementEditorEmptyRows) Columns() []string { return []string{"id", "next_id"} }
func (achievementEditorEmptyRows) Close() error      { return nil }
func (achievementEditorEmptyRows) Next([]driver.Value) error {
	return io.EOF
}
