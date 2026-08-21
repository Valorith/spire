package controllers

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"
)

type achievementEditorSchemaTableSpec struct {
	Columns []string
	Indexes []achievementEditorSchemaIndexSpec
	Shapes  map[string]achievementEditorSchemaColumnShape
	Engine  bool
}

type achievementEditorSchemaIndexSpec struct {
	Columns []string
	Unique  bool
}

type achievementEditorSchemaColumnShape struct {
	BaseType      string
	Unsigned      bool
	Signed        bool
	NotNull       bool
	AutoIncrement bool
}

const achievementEditorSchemaCacheTTL = 30 * time.Second

func (a *AchievementEditorController) inspectAchievementSchema(
	db *gorm.DB,
	area string,
	spec map[string]achievementEditorSchemaTableSpec,
	refresh bool,
) achievementEditorSchemaArea {
	key := fmt.Sprintf("%s:%p", area, db.ConnPool)
	now := time.Now()
	if !refresh {
		a.schemaMu.Lock()
		entry, found := a.schemaCache[key]
		a.schemaMu.Unlock()
		if found && now.Before(entry.expiresAt) {
			return entry.diagnostics
		}
	}

	diagnostics := inspectAchievementEditorSchema(db, area, spec)
	a.schemaMu.Lock()
	if a.schemaCache == nil {
		a.schemaCache = make(map[string]achievementEditorSchemaCacheEntry)
	}
	a.schemaCache[key] = achievementEditorSchemaCacheEntry{
		diagnostics: diagnostics,
		expiresAt:   now.Add(achievementEditorSchemaCacheTTL),
	}
	a.schemaMu.Unlock()
	return diagnostics
}

func achievementEditorContentSchemaSpec() map[string]achievementEditorSchemaTableSpec {
	criteriaShapes := achievementEditorMergeColumnShapes(
		achievementEditorUnsignedColumnShapes("bigint", "id"),
		achievementEditorUnsignedColumnShapes("int", "achievement_id", "component_sequence", "component_id", "target_id", "target_id2", "required_count"),
		achievementEditorUnsignedColumnShapes("tinyint", "component_type", "event_type", "progress_mode", "behavior", "enabled"),
		achievementEditorSignedColumnShapes("bigint", "target_value"),
	)
	criteriaShapes["id"] = achievementEditorSchemaColumnShape{BaseType: "bigint", Unsigned: true, NotNull: true, AutoIncrement: true}
	rewardShapes := achievementEditorMergeColumnShapes(
		achievementEditorUnsignedColumnShapes("int", "reward_id", "reward_data_id"),
		achievementEditorUnsignedColumnShapes("bigint", "amount"),
		achievementEditorUnsignedColumnShapes("tinyint", "reward_type", "enabled"),
	)
	rewardShapes["reward_id"] = achievementEditorSchemaColumnShape{BaseType: "int", Unsigned: true, NotNull: true, AutoIncrement: true}
	return map[string]achievementEditorSchemaTableSpec{
		"achievement_categories": {
			Columns: []string{"id", "parent_id", "sequence", "name", "description", "icon"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"id"}, true}}, Shapes: achievementEditorUnsignedColumnShapes("int", "id", "parent_id", "sequence"), Engine: true,
		},
		"achievements": {
			Columns: []string{"id", "name", "description", "icon_id", "points", "has_reward", "client_flag", "version", "reset_on_version_change", "enabled"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "id", "icon_id", "points", "version"),
				achievementEditorUnsignedColumnShapes("tinyint", "has_reward", "client_flag", "reset_on_version_change", "enabled"),
			), Engine: true,
		},
		"achievement_category_associations": {
			Columns: []string{"category_id", "sequence", "achievement_id", "display_text"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"category_id", "achievement_id"}, true}}, Shapes: achievementEditorUnsignedColumnShapes("int", "category_id", "sequence", "achievement_id"), Engine: true,
		},
		"achievement_components": {
			Columns: []string{"achievement_id", "component_type", "sequence", "component_id", "name", "description"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"achievement_id", "component_type", "component_id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "achievement_id", "sequence", "component_id"),
				achievementEditorUnsignedColumnShapes("tinyint", "component_type"),
			), Engine: true,
		},
		"achievement_associations": {
			Columns: []string{"component_id", "required_count"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"component_id"}, true}}, Shapes: achievementEditorUnsignedColumnShapes("int", "component_id", "required_count"), Engine: true,
		},
		"achievement_criteria": {
			Columns: []string{"id", "achievement_id", "component_type", "component_sequence", "component_id", "event_type", "progress_mode", "behavior", "target_id", "target_id2", "target_value", "required_count", "enabled"},
			Indexes: []achievementEditorSchemaIndexSpec{
				{[]string{"id"}, true},
				{[]string{"achievement_id", "component_type", "component_id", "event_type", "target_id", "target_id2"}, true},
			}, Shapes: criteriaShapes, Engine: true,
		},
		"rewards": {
			Columns: []string{"reward_id", "reward_type", "reward_data_id", "amount", "description", "enabled"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"reward_id"}, true}}, Shapes: rewardShapes, Engine: true,
		},
		"achievement_cast_requirements": {
			Columns: []string{"restriction_id", "achievement_id", "requires_completed"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"restriction_id", "achievement_id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "restriction_id", "achievement_id"),
				achievementEditorUnsignedColumnShapes("tinyint", "requires_completed"),
			), Engine: true,
		},
		"reward_sets": {
			Columns: []string{"reward_set_id", "title", "enabled"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"reward_set_id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "reward_set_id"),
				achievementEditorUnsignedColumnShapes("tinyint", "enabled"),
			), Engine: true,
		},
		"reward_options": {
			Columns: []string{"reward_set_id", "option_id", "sequence", "label", "common_to_all", "flags", "enabled"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"reward_set_id", "option_id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "reward_set_id", "option_id", "sequence"),
				achievementEditorUnsignedColumnShapes("tinyint", "common_to_all", "flags", "enabled"),
			), Engine: true,
		},
		"reward_option_entries": {
			Columns: []string{"reward_set_id", "option_id", "sequence", "reward_id"},
			Indexes: []achievementEditorSchemaIndexSpec{
				{[]string{"reward_set_id", "option_id", "reward_id"}, true},
				{[]string{"reward_set_id", "reward_id"}, true},
			}, Shapes: achievementEditorUnsignedColumnShapes("int", "reward_set_id", "option_id", "sequence", "reward_id"), Engine: true,
		},
		"reward_sources": {
			Columns: []string{"source_type", "source_id", "reward_set_id", "enabled"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"source_type", "source_id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("tinyint", "source_type", "enabled"),
				achievementEditorUnsignedColumnShapes("bigint", "source_id"),
				achievementEditorUnsignedColumnShapes("int", "reward_set_id"),
			), Engine: true,
		},
		"reward_source_entries": {
			Columns: []string{"source_type", "source_id", "sequence", "reward_id"},
			Indexes: []achievementEditorSchemaIndexSpec{
				{[]string{"source_type", "source_id", "reward_id"}, true},
				{[]string{"source_type", "source_id", "sequence"}, true},
			}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("tinyint", "source_type"),
				achievementEditorUnsignedColumnShapes("bigint", "source_id"),
				achievementEditorUnsignedColumnShapes("int", "sequence", "reward_id"),
			), Engine: true,
		},
	}
}

func achievementEditorCharacterSchemaSpec() map[string]achievementEditorSchemaTableSpec {
	updateShapes := achievementEditorMergeColumnShapes(
		achievementEditorUnsignedColumnShapes("bigint", "update_id", "source_target_id"),
		achievementEditorUnsignedColumnShapes("int", "character_id", "achievement_id", "component_id", "requested_value", "version", "attempt_count", "created_at", "last_attempt_at"),
		achievementEditorUnsignedColumnShapes("tinyint", "source_target_type", "operation", "component_type", "status"),
	)
	updateShapes["update_id"] = achievementEditorSchemaColumnShape{BaseType: "bigint", Unsigned: true, NotNull: true, AutoIncrement: true}
	return map[string]achievementEditorSchemaTableSpec{
		"character_data": {
			Columns: []string{"id", "account_id", "name", "level", "class", "ingame", "last_login", "deleted_at"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"id"}, true}}, Engine: true,
		},
		"character_achievements": {
			Columns: []string{"character_id", "achievement_id", "version", "completed_at"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"character_id", "achievement_id"}, true}}, Shapes: achievementEditorUnsignedColumnShapes("int", "character_id", "achievement_id", "version", "completed_at"), Engine: true,
		},
		"character_achievement_progress": {
			Columns: []string{"character_id", "achievement_id", "component_type", "component_sequence", "component_id", "current_count", "completed", "version", "updated_at"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"character_id", "achievement_id", "component_type", "component_id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "character_id", "achievement_id", "component_sequence", "component_id", "version", "updated_at"),
				achievementEditorUnsignedColumnShapes("bigint", "current_count"),
				achievementEditorUnsignedColumnShapes("tinyint", "component_type", "completed"),
			), Engine: true,
		},
		"character_achievement_rewards": {
			Columns: []string{"character_id", "achievement_id", "reward_id", "status", "attempt_count", "granted_at", "last_attempt_at", "last_error"},
			Indexes: []achievementEditorSchemaIndexSpec{{[]string{"character_id", "achievement_id", "reward_id"}, true}}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "character_id", "achievement_id", "attempt_count", "granted_at", "last_attempt_at"),
				achievementEditorUnsignedColumnShapes("bigint", "reward_id"),
				achievementEditorUnsignedColumnShapes("tinyint", "status"),
			), Engine: true,
		},
		"character_achievement_reward_selections": {
			Columns: []string{"character_id", "achievement_id", "reward_set_id", "selected_option_id", "status", "attempt_count", "claimed_at", "last_attempt_at", "last_error"},
			Indexes: []achievementEditorSchemaIndexSpec{
				{[]string{"character_id", "achievement_id", "reward_set_id"}, true},
				{[]string{"status", "character_id"}, false},
			}, Shapes: achievementEditorMergeColumnShapes(
				achievementEditorUnsignedColumnShapes("int", "character_id", "achievement_id", "reward_set_id", "selected_option_id", "attempt_count", "claimed_at", "last_attempt_at"),
				achievementEditorUnsignedColumnShapes("tinyint", "status"),
			), Engine: true,
		},
		"character_achievement_pending_updates": {
			Columns: []string{"update_id", "character_id", "source_target_type", "source_target_id", "operation", "achievement_id", "component_type", "component_id", "requested_value", "version", "status", "attempt_count", "created_at", "last_attempt_at", "last_error"},
			Indexes: []achievementEditorSchemaIndexSpec{
				{[]string{"update_id"}, true},
				{[]string{"character_id", "status", "update_id"}, false},
				{[]string{"status", "character_id"}, false},
			}, Shapes: updateShapes, Engine: true,
		},
	}
}

func inspectAchievementEditorSchema(db *gorm.DB, area string, spec map[string]achievementEditorSchemaTableSpec) achievementEditorSchemaArea {
	result := achievementEditorSchemaArea{
		Ready: true, Tables: make(map[string]achievementEditorSchemaTable), Issues: make([]achievementEditorSchemaIssue, 0),
	}
	if db == nil {
		result.Ready = false
		result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Code: "connection_unavailable", Severity: "error", Message: "Database connection is unavailable"})
		return result
	}
	_ = db.Raw("SELECT DATABASE()").Scan(&result.Database).Error

	type tableRow struct {
		TableName string `gorm:"column:table_name"`
		Engine    string `gorm:"column:engine"`
	}
	tables := make([]tableRow, 0)
	if err := db.Raw(`SELECT table_name, engine FROM information_schema.tables
		WHERE table_schema = DATABASE()`).Scan(&tables).Error; err != nil {
		result.Ready = false
		result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Code: "inspection_failed", Severity: "error", Message: err.Error()})
		return result
	}
	tableEngines := make(map[string]string)
	for _, row := range tables {
		tableEngines[row.TableName] = row.Engine
	}

	type columnRow struct {
		TableName  string `gorm:"column:table_name"`
		ColumnName string `gorm:"column:column_name"`
		ColumnType string `gorm:"column:column_type"`
		IsNullable string `gorm:"column:is_nullable"`
		Extra      string `gorm:"column:extra"`
	}
	columns := make([]columnRow, 0)
	if err := db.Raw(`SELECT table_name, column_name, column_type, is_nullable, extra
		FROM information_schema.columns WHERE table_schema = DATABASE()`).Scan(&columns).Error; err != nil {
		result.Ready = false
		result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Code: "inspection_failed", Severity: "error", Message: err.Error()})
		return result
	}
	columnsByTable := make(map[string]map[string]columnRow)
	for _, row := range columns {
		if columnsByTable[row.TableName] == nil {
			columnsByTable[row.TableName] = make(map[string]columnRow)
		}
		columnsByTable[row.TableName][row.ColumnName] = row
	}

	type indexRow struct {
		TableName  string `gorm:"column:table_name"`
		IndexName  string `gorm:"column:index_name"`
		NonUnique  int    `gorm:"column:non_unique"`
		SeqInIndex int    `gorm:"column:seq_in_index"`
		ColumnName string `gorm:"column:column_name"`
	}
	indexes := make([]indexRow, 0)
	if err := db.Raw(`SELECT table_name, index_name, non_unique, seq_in_index, column_name
		FROM information_schema.statistics WHERE table_schema = DATABASE()
		ORDER BY table_name, index_name, seq_in_index`).Scan(&indexes).Error; err != nil {
		result.Ready = false
		result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Code: "inspection_failed", Severity: "error", Message: err.Error()})
		return result
	}
	type observedIndex struct {
		Unique  bool
		Columns []string
	}
	indexesByTable := make(map[string]map[string]observedIndex)
	for _, row := range indexes {
		if indexesByTable[row.TableName] == nil {
			indexesByTable[row.TableName] = make(map[string]observedIndex)
		}
		observed := indexesByTable[row.TableName][row.IndexName]
		observed.Unique = row.NonUnique == 0
		observed.Columns = append(observed.Columns, row.ColumnName)
		indexesByTable[row.TableName][row.IndexName] = observed
	}

	tableNames := make([]string, 0, len(spec))
	for table := range spec {
		tableNames = append(tableNames, table)
	}
	sort.Strings(tableNames)
	for _, table := range tableNames {
		tableSpec := spec[table]
		engine, present := tableEngines[table]
		observedColumns := make([]string, 0)
		for column := range columnsByTable[table] {
			observedColumns = append(observedColumns, column)
		}
		sort.Strings(observedColumns)
		result.Tables[table] = achievementEditorSchemaTable{Present: present, Required: true, Engine: engine, Columns: observedColumns}
		if !present {
			result.Ready = false
			result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Table: table, Code: "missing_table", Severity: "error", Message: "Required table is missing"})
			continue
		}
		if tableSpec.Engine && !strings.EqualFold(engine, "InnoDB") {
			result.Ready = false
			result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Table: table, Code: "unsafe_engine", Severity: "error", Message: "Table must use InnoDB for atomic writes and row locks"})
		}
		for _, column := range tableSpec.Columns {
			observed, exists := columnsByTable[table][column]
			if !exists {
				result.Ready = false
				result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Table: table, Column: column, Code: "missing_column", Severity: "error", Message: "Required column is missing"})
				continue
			}
			shape, shapeRequired := tableSpec.Shapes[column]
			if !shapeRequired {
				continue
			}
			if shape.BaseType != "" && achievementEditorColumnBaseType(observed.ColumnType) != shape.BaseType {
				result.Ready = false
				result.Issues = append(result.Issues, achievementEditorSchemaIssue{
					Area: area, Table: table, Column: column, Code: "wrong_column_type", Severity: "error",
					Message: fmt.Sprintf("Column must use %s, found %s", strings.ToUpper(shape.BaseType), observed.ColumnType),
				})
			}
			if shape.Unsigned && !strings.Contains(strings.ToLower(observed.ColumnType), "unsigned") {
				result.Ready = false
				result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Table: table, Column: column, Code: "wrong_signedness", Severity: "error", Message: "Column must be unsigned"})
			}
			if shape.Signed && strings.Contains(strings.ToLower(observed.ColumnType), "unsigned") {
				result.Ready = false
				result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Table: table, Column: column, Code: "wrong_signedness", Severity: "error", Message: "Column must be signed"})
			}
			if shape.NotNull && !strings.EqualFold(observed.IsNullable, "NO") {
				result.Ready = false
				result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Table: table, Column: column, Code: "nullable_identity", Severity: "error", Message: "Column must be NOT NULL"})
			}
			if shape.AutoIncrement && !strings.Contains(strings.ToLower(observed.Extra), "auto_increment") {
				result.Ready = false
				result.Issues = append(result.Issues, achievementEditorSchemaIssue{Area: area, Table: table, Column: column, Code: "missing_auto_increment", Severity: "error", Message: "Column must be AUTO_INCREMENT"})
			}
		}
		for _, requiredIndex := range tableSpec.Indexes {
			matched := false
			for _, observed := range indexesByTable[table] {
				if observed.Unique == requiredIndex.Unique && stringSlicesEqual(observed.Columns, requiredIndex.Columns) {
					matched = true
					break
				}
			}
			if !matched {
				result.Ready = false
				kind := "index"
				if requiredIndex.Unique {
					kind = "unique index"
				}
				result.Issues = append(result.Issues, achievementEditorSchemaIssue{
					Area: area, Table: table, Code: "missing_index", Severity: "error",
					Message: fmt.Sprintf("Required %s (%s) is missing", kind, strings.Join(requiredIndex.Columns, ", ")),
				})
			}
		}
	}
	return result
}

func achievementEditorUnsignedColumnShapes(baseType string, columns ...string) map[string]achievementEditorSchemaColumnShape {
	result := make(map[string]achievementEditorSchemaColumnShape, len(columns))
	for _, column := range columns {
		result[column] = achievementEditorSchemaColumnShape{BaseType: baseType, Unsigned: true, NotNull: true}
	}
	return result
}

func achievementEditorSignedColumnShapes(baseType string, columns ...string) map[string]achievementEditorSchemaColumnShape {
	result := make(map[string]achievementEditorSchemaColumnShape, len(columns))
	for _, column := range columns {
		result[column] = achievementEditorSchemaColumnShape{BaseType: baseType, Signed: true, NotNull: true}
	}
	return result
}

func achievementEditorMergeColumnShapes(groups ...map[string]achievementEditorSchemaColumnShape) map[string]achievementEditorSchemaColumnShape {
	result := make(map[string]achievementEditorSchemaColumnShape)
	for _, group := range groups {
		for column, shape := range group {
			result[column] = shape
		}
	}
	return result
}

func achievementEditorColumnBaseType(columnType string) string {
	baseType := strings.ToLower(strings.TrimSpace(columnType))
	if index := strings.IndexAny(baseType, "( "); index >= 0 {
		baseType = baseType[:index]
	}
	return baseType
}

func stringSlicesEqual(left []string, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}
