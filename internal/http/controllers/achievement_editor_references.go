package controllers

import (
	"fmt"
	"sort"
	"strings"

	"gorm.io/gorm"
)

const (
	achievementEditorReferenceNPCType  = "npc_type"
	achievementEditorReferenceNPCRace  = "npc_race"
	achievementEditorReferenceTask     = "task"
	achievementEditorReferenceZone     = "zone"
	achievementEditorReferenceItem     = "item"
	achievementEditorReferenceRecipe   = "recipe"
	achievementEditorReferenceSkillCap = "skill_cap"
	achievementEditorReferenceCurrency = "currency"
	achievementEditorReferenceTitleSet = "title_set"
)

type achievementEditorSkillCapReference struct {
	SkillID uint32
	ClassID uint32
	Level   uint32
}

type achievementEditorReferenceRequests struct {
	NPCTypeIDs  map[uint32]struct{}
	NPCRaceIDs  map[uint32]struct{}
	TaskIDs     map[uint32]struct{}
	ZoneIDs     map[uint32]struct{}
	ItemIDs     map[uint32]struct{}
	RecipeIDs   map[uint32]struct{}
	SkillCaps   map[achievementEditorSkillCapReference]struct{}
	CurrencyIDs map[uint32]struct{}
	TitleSetIDs map[uint32]struct{}
}

func newAchievementEditorReferenceRequests() achievementEditorReferenceRequests {
	return achievementEditorReferenceRequests{
		NPCTypeIDs: make(map[uint32]struct{}), NPCRaceIDs: make(map[uint32]struct{}),
		TaskIDs: make(map[uint32]struct{}), ZoneIDs: make(map[uint32]struct{}),
		ItemIDs: make(map[uint32]struct{}), RecipeIDs: make(map[uint32]struct{}),
		SkillCaps:   make(map[achievementEditorSkillCapReference]struct{}),
		CurrencyIDs: make(map[uint32]struct{}), TitleSetIDs: make(map[uint32]struct{}),
	}
}

// collectAchievementEditorReferenceRequests creates a bounded, deduplicated
// query plan. Disabled rows never enter the runtime snapshot and therefore do
// not require live catalog rows. Zero is deliberately retained only where it
// is an exact value (Skill Cap skill 0); every documented ID wildcard remains
// local authoring state and is never queried or rejected as a missing row.
func collectAchievementEditorReferenceRequests(graph achievementEditorGraph) achievementEditorReferenceRequests {
	requests := newAchievementEditorReferenceRequests()
	for _, component := range graph.Components {
		for _, criterion := range component.Criteria {
			if !criterion.Enabled {
				continue
			}
			switch criterion.EventType {
			case 2:
				if criterion.TargetID != 0 {
					requests.NPCTypeIDs[criterion.TargetID] = struct{}{}
				}
			case 3:
				if criterion.TargetID != 0 {
					requests.NPCRaceIDs[criterion.TargetID] = struct{}{}
				}
			case 4:
				if criterion.TargetID != 0 {
					requests.TaskIDs[criterion.TargetID] = struct{}{}
				}
			case 5:
				if criterion.TargetID != 0 {
					requests.ZoneIDs[criterion.TargetID] = struct{}{}
				}
			case 6, 7:
				if criterion.TargetID != 0 {
					requests.ItemIDs[criterion.TargetID] = struct{}{}
				}
			case 8:
				if criterion.TargetID != 0 {
					requests.RecipeIDs[criterion.TargetID] = struct{}{}
				}
			case 12:
				if criterion.TargetID2 != 0 {
					requests.ZoneIDs[criterion.TargetID2] = struct{}{}
				}
			case 13:
				level, valid := achievementEditorCriterionTargetValue(criterion.TargetValue)
				if valid && criterion.TargetID <= 77 && criterion.TargetID2 >= 1 && criterion.TargetID2 <= 16 && level >= 1 && level <= 255 {
					requests.SkillCaps[achievementEditorSkillCapReference{
						SkillID: criterion.TargetID, ClassID: criterion.TargetID2, Level: uint32(level),
					}] = struct{}{}
				}
			}
		}
	}
	for _, reward := range graph.Rewards {
		if !reward.Enabled || reward.RewardDataID == 0 {
			continue
		}
		switch reward.RewardType {
		case 0:
			requests.ItemIDs[reward.RewardDataID] = struct{}{}
		case 4:
			requests.CurrencyIDs[reward.RewardDataID] = struct{}{}
		case 5:
			requests.TitleSetIDs[reward.RewardDataID] = struct{}{}
		}
	}
	return requests
}

func (r achievementEditorReferenceRequests) usedCatalogs() []string {
	result := make([]string, 0, 9)
	if len(r.NPCTypeIDs) > 0 {
		result = append(result, achievementEditorReferenceNPCType)
	}
	if len(r.NPCRaceIDs) > 0 {
		result = append(result, achievementEditorReferenceNPCRace)
	}
	if len(r.TaskIDs) > 0 {
		result = append(result, achievementEditorReferenceTask)
	}
	if len(r.ZoneIDs) > 0 {
		result = append(result, achievementEditorReferenceZone)
	}
	if len(r.ItemIDs) > 0 {
		result = append(result, achievementEditorReferenceItem)
	}
	if len(r.RecipeIDs) > 0 {
		result = append(result, achievementEditorReferenceRecipe)
	}
	if len(r.SkillCaps) > 0 {
		result = append(result, achievementEditorReferenceSkillCap)
	}
	if len(r.CurrencyIDs) > 0 {
		result = append(result, achievementEditorReferenceCurrency)
	}
	if len(r.TitleSetIDs) > 0 {
		result = append(result, achievementEditorReferenceTitleSet)
	}
	return result
}

type achievementEditorReferenceCatalogRequirement struct {
	table   string
	columns []string
}

func achievementEditorReferenceLookupSpec(kind string) achievementEditorLookupSpec {
	spec := achievementEditorLookupSpecs()[kind]
	if kind == "zone" {
		// Version is presentation/instance metadata; a runtime zone criterion
		// observes zoneidnumber and remains valid even without a version-0 row.
		spec.baseWhere = ""
	}
	return spec
}

func achievementEditorReferenceCatalogRequirements() map[string]achievementEditorReferenceCatalogRequirement {
	specs := achievementEditorLookupSpecs()
	return map[string]achievementEditorReferenceCatalogRequirement{
		achievementEditorReferenceNPCType:  {table: specs["npc"].from, columns: []string{specs["npc"].idColumn}},
		achievementEditorReferenceNPCRace:  {table: specs["npc"].from, columns: []string{"race"}},
		achievementEditorReferenceTask:     {table: specs["task"].from, columns: []string{specs["task"].idColumn}},
		achievementEditorReferenceZone:     {table: specs["zone"].from, columns: []string{specs["zone"].idColumn}},
		achievementEditorReferenceItem:     {table: specs["item"].from, columns: []string{specs["item"].idColumn}},
		achievementEditorReferenceRecipe:   {table: specs["recipe"].from, columns: []string{specs["recipe"].idColumn}},
		achievementEditorReferenceSkillCap: {table: "skill_caps", columns: []string{"skill_id", "class_id", "level"}},
		achievementEditorReferenceCurrency: {table: specs["currency"].from, columns: []string{specs["currency"].idColumn}},
		achievementEditorReferenceTitleSet: {table: specs["title-set"].from, columns: []string{specs["title-set"].idColumn}},
	}
}

// loadAchievementEditorReferenceContext resolves the complete query plan in
// batches. Reference catalogs are optional EQEmu content tables: missing or
// temporarily unreadable catalogs become explicit validation diagnostics
// instead of a 500 or, worse, an unverified save.
func loadAchievementEditorReferenceContext(db *gorm.DB, graph achievementEditorGraph, context *achievementEditorValidationContext) {
	requests := collectAchievementEditorReferenceRequests(graph)
	usedCatalogs := requests.usedCatalogs()
	if len(usedCatalogs) == 0 {
		return
	}
	if context.ReferenceCatalogIssues == nil {
		context.ReferenceCatalogIssues = make(map[string]string)
	}
	requirements := achievementEditorReferenceCatalogRequirements()
	tableSet := make(map[string]struct{})
	for _, catalog := range usedCatalogs {
		tableSet[requirements[catalog].table] = struct{}{}
	}
	tables := make([]string, 0, len(tableSet))
	for table := range tableSet {
		tables = append(tables, table)
	}
	sort.Strings(tables)
	type columnRow struct {
		TableName  string `gorm:"column:table_name"`
		ColumnName string `gorm:"column:column_name"`
	}
	columns := make([]columnRow, 0)
	if err := db.Raw(`SELECT table_name, column_name FROM information_schema.columns
		WHERE table_schema = DATABASE() AND table_name IN ?`, tables).Scan(&columns).Error; err != nil {
		for _, catalog := range usedCatalogs {
			context.ReferenceCatalogIssues[catalog] = "the content catalog schema could not be inspected"
		}
		return
	}
	available := make(map[string]map[string]struct{})
	for _, row := range columns {
		if available[row.TableName] == nil {
			available[row.TableName] = make(map[string]struct{})
		}
		available[row.TableName][row.ColumnName] = struct{}{}
	}
	for _, catalog := range usedCatalogs {
		requirement := requirements[catalog]
		missing := make([]string, 0)
		for _, column := range requirement.columns {
			if _, found := available[requirement.table][column]; !found {
				missing = append(missing, column)
			}
		}
		if len(missing) > 0 {
			context.ReferenceCatalogIssues[catalog] = fmt.Sprintf("table %s is unavailable or lacks column(s) %s", requirement.table, strings.Join(missing, ", "))
		}
	}

	loadAchievementEditorNPCReferences(db, requests, context)
	loadAchievementEditorIDReferences(db, requests.TaskIDs, achievementEditorReferenceTask, achievementEditorReferenceLookupSpec("task"), &context.KnownTaskIDs, context)
	loadAchievementEditorIDReferences(db, requests.ZoneIDs, achievementEditorReferenceZone, achievementEditorReferenceLookupSpec("zone"), &context.KnownZoneIDs, context)
	loadAchievementEditorIDReferences(db, requests.ItemIDs, achievementEditorReferenceItem, achievementEditorReferenceLookupSpec("item"), &context.KnownItemIDs, context)
	loadAchievementEditorIDReferences(db, requests.RecipeIDs, achievementEditorReferenceRecipe, achievementEditorReferenceLookupSpec("recipe"), &context.KnownRecipeIDs, context)
	loadAchievementEditorSkillCapReferences(db, requests, context)
	loadAchievementEditorIDReferences(db, requests.CurrencyIDs, achievementEditorReferenceCurrency, achievementEditorReferenceLookupSpec("currency"), &context.KnownAlternateCurrencyIDs, context)
	loadAchievementEditorIDReferences(db, requests.TitleSetIDs, achievementEditorReferenceTitleSet, achievementEditorReferenceLookupSpec("title-set"), &context.KnownTitleSetIDs, context)
}

func loadAchievementEditorIDReferences(
	db *gorm.DB,
	requested map[uint32]struct{},
	catalog string,
	spec achievementEditorLookupSpec,
	destination *map[uint32]struct{},
	context *achievementEditorValidationContext,
) {
	if len(requested) == 0 || context.ReferenceCatalogIssues[catalog] != "" {
		return
	}
	ids := achievementEditorReferenceIDs(requested)
	found := make([]uint32, 0, len(ids))
	query := db.Table(spec.from).Distinct(spec.idColumn).Where(spec.idColumn+" IN ?", ids)
	if spec.baseWhere != "" {
		query = query.Where(spec.baseWhere)
	}
	if err := query.Pluck(spec.idColumn, &found).Error; err != nil {
		context.ReferenceCatalogIssues[catalog] = fmt.Sprintf("table %s could not be queried", spec.from)
		return
	}
	*destination = make(map[uint32]struct{}, len(found))
	for _, id := range found {
		(*destination)[id] = struct{}{}
	}
}

func loadAchievementEditorNPCReferences(db *gorm.DB, requests achievementEditorReferenceRequests, context *achievementEditorValidationContext) {
	wantTypes := len(requests.NPCTypeIDs) > 0 && context.ReferenceCatalogIssues[achievementEditorReferenceNPCType] == ""
	wantRaces := len(requests.NPCRaceIDs) > 0 && context.ReferenceCatalogIssues[achievementEditorReferenceNPCRace] == ""
	if !wantTypes && !wantRaces {
		return
	}
	type npcReferenceRow struct {
		ID   uint32 `gorm:"column:id"`
		Race uint32 `gorm:"column:race"`
	}
	rows := make([]npcReferenceRow, 0)
	query := db.Table("npc_types")
	switch {
	case wantTypes && wantRaces:
		query = query.Select("id, race").Where("id IN ?", achievementEditorReferenceIDs(requests.NPCTypeIDs)).Or("race IN ?", achievementEditorReferenceIDs(requests.NPCRaceIDs))
	case wantTypes:
		query = query.Select("id").Where("id IN ?", achievementEditorReferenceIDs(requests.NPCTypeIDs))
	case wantRaces:
		query = query.Select("race").Where("race IN ?", achievementEditorReferenceIDs(requests.NPCRaceIDs))
	}
	if err := query.Scan(&rows).Error; err != nil {
		if wantTypes {
			context.ReferenceCatalogIssues[achievementEditorReferenceNPCType] = "table npc_types could not be queried"
		}
		if wantRaces {
			context.ReferenceCatalogIssues[achievementEditorReferenceNPCRace] = "table npc_types could not be queried"
		}
		return
	}
	if wantTypes {
		context.KnownNPCTypeIDs = make(map[uint32]struct{})
	}
	if wantRaces {
		context.KnownNPCRaceIDs = make(map[uint32]struct{})
	}
	for _, row := range rows {
		if _, requested := requests.NPCTypeIDs[row.ID]; wantTypes && requested {
			context.KnownNPCTypeIDs[row.ID] = struct{}{}
		}
		if _, requested := requests.NPCRaceIDs[row.Race]; wantRaces && requested {
			context.KnownNPCRaceIDs[row.Race] = struct{}{}
		}
	}
}

func loadAchievementEditorSkillCapReferences(db *gorm.DB, requests achievementEditorReferenceRequests, context *achievementEditorValidationContext) {
	if len(requests.SkillCaps) == 0 || context.ReferenceCatalogIssues[achievementEditorReferenceSkillCap] != "" {
		return
	}
	skills := make(map[uint32]struct{})
	classes := make(map[uint32]struct{})
	levels := make(map[uint32]struct{})
	for reference := range requests.SkillCaps {
		skills[reference.SkillID] = struct{}{}
		classes[reference.ClassID] = struct{}{}
		levels[reference.Level] = struct{}{}
	}
	rows := make([]struct {
		SkillID uint32 `gorm:"column:skill_id"`
		ClassID uint32 `gorm:"column:class_id"`
		Level   uint32 `gorm:"column:level"`
	}, 0)
	if err := db.Table("skill_caps").Select("skill_id, class_id, level").
		Where("skill_id IN ? AND class_id IN ? AND level IN ?", achievementEditorReferenceIDs(skills), achievementEditorReferenceIDs(classes), achievementEditorReferenceIDs(levels)).
		Scan(&rows).Error; err != nil {
		context.ReferenceCatalogIssues[achievementEditorReferenceSkillCap] = "table skill_caps could not be queried"
		return
	}
	context.KnownSkillCaps = make(map[achievementEditorSkillCapReference]struct{}, len(rows))
	for _, row := range rows {
		context.KnownSkillCaps[achievementEditorSkillCapReference{SkillID: row.SkillID, ClassID: row.ClassID, Level: row.Level}] = struct{}{}
	}
}

func achievementEditorReferenceIDs(values map[uint32]struct{}) []uint32 {
	result := make([]uint32, 0, len(values))
	for value := range values {
		result = append(result, value)
	}
	sort.Slice(result, func(i, j int) bool { return result[i] < result[j] })
	return result
}
