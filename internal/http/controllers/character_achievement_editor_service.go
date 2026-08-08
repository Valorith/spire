package controllers

import (
	"fmt"
	"math/big"
	"sort"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

type characterAchievementEditorService struct {
	characterDB *gorm.DB
	contentDB   *gorm.DB
}

func newCharacterAchievementEditorService(characterDB *gorm.DB, contentDB *gorm.DB) *characterAchievementEditorService {
	return &characterAchievementEditorService{characterDB: characterDB, contentDB: contentDB}
}

func characterAchievementEditorCharacterSummaryQuery(db *gorm.DB, search string, presence string) *gorm.DB {
	base := db.Table("character_data character_record").Where("character_record.deleted_at IS NULL")
	search = strings.TrimSpace(search)
	if search != "" {
		like := "%" + search + "%"
		if id, err := strconv.ParseUint(search, 10, 32); err == nil {
			base = base.Where("character_record.id = ? OR character_record.name LIKE ?", id, like)
		} else {
			base = base.Where("character_record.name LIKE ?", like)
		}
	}
	switch presence {
	case "online":
		base = base.Where("character_record.ingame = 1")
	case "offline":
		base = base.Where("character_record.ingame = 0")
	}
	return base
}

func (s *characterAchievementEditorService) listCharacters(search string, presence string, page int, limit int) ([]achievementEditorCharacterSummary, int64, error) {
	base := characterAchievementEditorCharacterSummaryQuery(s.characterDB, search, presence)
	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	rows := make([]achievementEditorCharacterSummary, 0)
	selectSQL := `
		character_record.id, character_record.account_id, character_record.name, character_record.level, character_record.class,
		character_record.ingame AS in_game, character_record.last_login,
		(SELECT COUNT(*) FROM character_achievements completion WHERE completion.character_id = character_record.id) AS achievement_completion_count,
		(SELECT COUNT(DISTINCT progress.achievement_id) FROM character_achievement_progress progress
			WHERE progress.character_id = character_record.id
			AND NOT EXISTS (
				SELECT 1 FROM character_achievements completed
				WHERE completed.character_id = character_record.id AND completed.achievement_id = progress.achievement_id
			)) AS achievement_progress_count,
		(SELECT COUNT(*) FROM character_achievement_progress progress_rows WHERE progress_rows.character_id = character_record.id) AS achievement_progress_row_count,
		CAST(COALESCE((SELECT SUM(progress_total.current_count) FROM character_achievement_progress progress_total
			WHERE progress_total.character_id = character_record.id), 0) AS CHAR) AS achievement_progress_total`
	if err := base.Select(selectSQL).Order("character_record.name, character_record.id").
		Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (s *characterAchievementEditorService) loadCharacter(id uint32) (achievementEditorCharacter, error) {
	var character achievementEditorCharacter
	err := s.characterDB.Table("character_data").Select(`
		id, account_id, name, level, class, ingame AS in_game, last_login, deleted_at
	`).Where("id = ?", id).Take(&character).Error
	return character, err
}

type characterAchievementEditorDetailFilters struct {
	Search     string
	State      string
	CategoryID *uint32
	Page       int
	Limit      int
}

type characterAchievementEditorProgressAggregate struct {
	AchievementID            uint32
	RowCount                 int64
	Total                    string
	HasPositive              bool
	MinimumDefinitionVersion uint32
	MaximumDefinitionVersion uint32
}

type characterAchievementEditorAttentionAggregate struct {
	AchievementID uint32
	Attention     bool
}

type characterAchievementEditorMutationAggregate struct {
	AchievementID            uint32
	MinimumDefinitionVersion uint32
	MaximumDefinitionVersion uint32
}

func characterAchievementEditorDefinitionResolution(
	definitions []achievementEditorDefinitionSummary,
	stateIDs map[uint32]bool,
) (map[uint32]bool, []uint32) {
	knownDefinitionIDs := make(map[uint32]bool, len(definitions))
	for _, definition := range definitions {
		knownDefinitionIDs[definition.ID] = true
	}
	unresolvedStateIDs := make([]uint32, 0)
	for achievementID := range stateIDs {
		if !knownDefinitionIDs[achievementID] {
			unresolvedStateIDs = append(unresolvedStateIDs, achievementID)
		}
	}
	sort.Slice(unresolvedStateIDs, func(i, j int) bool {
		return unresolvedStateIDs[i] < unresolvedStateIDs[j]
	})
	return knownDefinitionIDs, unresolvedStateIDs
}

func (s *characterAchievementEditorService) loadDetail(characterID uint32, filters characterAchievementEditorDetailFilters) (achievementEditorCharacterDetailPage, error) {
	result := achievementEditorCharacterDetailPage{Page: filters.Page, Limit: filters.Limit}
	character, err := s.loadCharacter(characterID)
	if err != nil {
		return result, err
	}
	detail := achievementEditorCharacterDetail{
		Character:            character,
		Definitions:          make([]achievementEditorDefinitionSummary, 0),
		Associations:         make([]achievementEditorAssociation, 0),
		Components:           make([]achievementEditorComponent, 0),
		Criteria:             make([]achievementEditorCriterion, 0),
		Rewards:              make([]achievementEditorReward, 0),
		RewardSets:           make([]achievementEditorRewardSet, 0),
		RewardOptions:        make([]achievementEditorRewardOption, 0),
		RewardOptionEntries:  make([]achievementEditorRewardMapping, 0),
		Restrictions:         make([]achievementEditorCastRestriction, 0),
		Completions:          make([]achievementEditorCharacterCompletion, 0),
		Progress:             make([]achievementEditorCharacterProgress, 0),
		RewardLedgers:        make([]achievementEditorCharacterRewardLedger, 0),
		RewardSelections:     make([]achievementEditorCharacterRewardSelection, 0),
		PendingMutations:     make([]achievementEditorCharacterPendingMutation, 0),
		OrphanAchievementIDs: make([]uint32, 0),
	}

	// Build one bounded aggregate row per achievement. The previous implementation
	// hydrated every progress, reward, selection, and mutation row before applying
	// a 40-row catalog page, so a malformed or very old character could consume
	// unbounded memory. Full durable rows are loaded only after the page IDs are
	// known below.
	completionRows := make([]achievementEditorCharacterCompletion, 0)
	if err := s.characterDB.Table("character_achievements").Where("character_id = ?", characterID).
		Order("achievement_id").Scan(&completionRows).Error; err != nil {
		return result, err
	}
	progressRows := make([]characterAchievementEditorProgressAggregate, 0)
	if err := s.characterDB.Table("character_achievement_progress").Select(`
		achievement_id,
		COUNT(*) AS row_count,
		CAST(COALESCE(SUM(current_count), 0) AS CHAR) AS total,
		MAX(CASE WHEN current_count > 0 THEN 1 ELSE 0 END) AS has_positive,
		COALESCE(MIN(NULLIF(definition_version, 0)), 0) AS minimum_definition_version,
		COALESCE(MAX(NULLIF(definition_version, 0)), 0) AS maximum_definition_version
	`).Where("character_id = ?", characterID).Group("achievement_id").Scan(&progressRows).Error; err != nil {
		return result, err
	}
	rewardRows := make([]characterAchievementEditorAttentionAggregate, 0)
	if err := s.characterDB.Table("character_achievement_rewards").Select(`
		achievement_id,
		MAX(CASE WHEN status <> 1 THEN 1 ELSE 0 END) AS attention
	`).Where("character_id = ?", characterID).Group("achievement_id").Scan(&rewardRows).Error; err != nil {
		return result, err
	}
	selectionRows := make([]characterAchievementEditorAttentionAggregate, 0)
	if err := s.characterDB.Table("character_achievement_reward_selections").Select(`
		achievement_id,
		MAX(CASE WHEN status NOT IN (0, 1) OR (status = 0 AND selected_option_id <> 0) THEN 1 ELSE 0 END) AS attention
	`).Where("character_id = ?", characterID).Group("achievement_id").Scan(&selectionRows).Error; err != nil {
		return result, err
	}
	mutationRows := make([]characterAchievementEditorMutationAggregate, 0)
	if err := s.characterDB.Table("character_achievement_pending_mutations").Select(`
		achievement_id,
		COALESCE(MIN(NULLIF(definition_version, 0)), 0) AS minimum_definition_version,
		COALESCE(MAX(NULLIF(definition_version, 0)), 0) AS maximum_definition_version
	`).Where("character_id = ?", characterID).Group("achievement_id").Scan(&mutationRows).Error; err != nil {
		return result, err
	}

	repository := newAchievementEditorRepository(s.contentDB)
	definitions := make([]achievementEditorDefinitionSummary, 0)
	definitionQuery := s.contentDB.Table("achievements a").
		Select("a.id, a.name, a.description, a.icon_id, a.points, a.definition_version, a.enabled")
	search := strings.TrimSpace(filters.Search)
	if search != "" {
		like := "%" + search + "%"
		categoryMatch := `EXISTS (
			SELECT 1
			FROM achievement_category_associations search_association
			JOIN achievement_categories search_category ON search_category.id = search_association.category_id
			WHERE search_association.achievement_id = a.id
			AND (search_category.name LIKE ? OR search_association.display_text LIKE ?)
		)`
		if id, parseErr := strconv.ParseUint(search, 10, 32); parseErr == nil {
			definitionQuery = definitionQuery.Where("a.id = ? OR a.name LIKE ? OR a.description LIKE ? OR "+categoryMatch, id, like, like, like, like)
		} else {
			definitionQuery = definitionQuery.Where("a.name LIKE ? OR a.description LIKE ? OR "+categoryMatch, like, like, like, like)
		}
	}
	if filters.CategoryID != nil {
		definitionQuery = definitionQuery.Where(`EXISTS (
			SELECT 1 FROM achievement_category_associations ca
			WHERE ca.achievement_id = a.id AND ca.category_id = ?
		)`, *filters.CategoryID)
	}
	if err := definitionQuery.Order("a.name ASC, a.id ASC").Scan(&definitions).Error; err != nil {
		return result, err
	}
	completionByID := make(map[uint32]achievementEditorCharacterCompletion)
	progressByID := make(map[uint32]characterAchievementEditorProgressAggregate)
	rewardByID := make(map[uint32]characterAchievementEditorAttentionAggregate)
	selectionByID := make(map[uint32]characterAchievementEditorAttentionAggregate)
	mutationByID := make(map[uint32]characterAchievementEditorMutationAggregate)
	stateIDs := make(map[uint32]bool)
	for _, completion := range completionRows {
		completionByID[completion.AchievementID] = completion
		stateIDs[completion.AchievementID] = true
	}
	for _, progress := range progressRows {
		progressByID[progress.AchievementID] = progress
		stateIDs[progress.AchievementID] = true
		character.AchievementProgressRowCount += progress.RowCount
		if _, completed := completionByID[progress.AchievementID]; !completed {
			character.AchievementProgressCount++
		}
	}
	progressTotal := big.NewInt(0)
	for _, progress := range progressRows {
		value := new(big.Int)
		if _, ok := value.SetString(progress.Total, 10); ok {
			progressTotal.Add(progressTotal, value)
		}
	}
	character.AchievementCompletionCount = int64(len(completionByID))
	character.AchievementProgressTotal = progressTotal.String()
	detail.Character = character
	for _, reward := range rewardRows {
		rewardByID[reward.AchievementID] = reward
		stateIDs[reward.AchievementID] = true
	}
	for _, selection := range selectionRows {
		selectionByID[selection.AchievementID] = selection
		stateIDs[selection.AchievementID] = true
	}
	for _, mutation := range mutationRows {
		mutationByID[mutation.AchievementID] = mutation
		stateIDs[mutation.AchievementID] = true
	}
	// Search/category filters intentionally omit valid definitions from the
	// lightweight catalog projection. Resolve only those state-bearing IDs
	// before classifying orphan rows instead of scanning every catalog ID.
	knownDefinitionIDs, unresolvedStateIDs := characterAchievementEditorDefinitionResolution(definitions, stateIDs)
	if len(unresolvedStateIDs) > 0 {
		knownStateIDs := make([]uint32, 0, len(unresolvedStateIDs))
		if err := s.contentDB.Table("achievements").Where("id IN ?", unresolvedStateIDs).
			Pluck("id", &knownStateIDs).Error; err != nil {
			return result, err
		}
		for _, achievementID := range knownStateIDs {
			knownDefinitionIDs[achievementID] = true
		}
	}
	filtered := make([]achievementEditorDefinitionSummary, 0, len(definitions))
	for _, definition := range definitions {
		definition = characterAchievementEditorDecorateAggregate(
			definition, completionByID[definition.ID], progressByID[definition.ID],
			rewardByID[definition.ID], selectionByID[definition.ID], mutationByID[definition.ID],
		)
		if characterAchievementEditorStateMatches(definition, filters.State) {
			filtered = append(filtered, definition)
		}
	}
	for achievementID := range stateIDs {
		if knownDefinitionIDs[achievementID] {
			continue
		}
		detail.OrphanAchievementIDs = append(detail.OrphanAchievementIDs, achievementID)
		orphan := achievementEditorDefinitionSummary{
			ID: achievementID, Name: fmt.Sprintf("Deleted definition #%d", achievementID),
			State: "orphaned", Orphaned: true,
		}
		if completion, ok := completionByID[achievementID]; ok {
			orphan.CompletedAt = completion.CompletedAt
			orphan.CharacterDefinitionVersion = completion.DefinitionVersion
		}
		orphan = characterAchievementEditorDecorateAggregate(
			orphan, completionByID[achievementID], progressByID[achievementID],
			rewardByID[achievementID], selectionByID[achievementID], mutationByID[achievementID],
		)
		if filters.CategoryID == nil && characterAchievementEditorStateMatches(orphan, filters.State) && characterAchievementEditorSearchMatches(orphan, filters.Search) {
			filtered = append(filtered, orphan)
		}
	}
	sort.Slice(detail.OrphanAchievementIDs, func(i, j int) bool { return detail.OrphanAchievementIDs[i] < detail.OrphanAchievementIDs[j] })
	// stateIDs is a map, so orphan insertion order is intentionally undefined.
	// Always impose a stable total order before applying an offset; otherwise an
	// orphan can move between pages and appear twice or not at all.
	sort.Slice(filtered, func(i, j int) bool {
		if filtered[i].Orphaned != filtered[j].Orphaned {
			return !filtered[i].Orphaned
		}
		if filtered[i].Orphaned {
			return filtered[i].ID < filtered[j].ID
		}
		leftName := strings.ToLower(filtered[i].Name)
		rightName := strings.ToLower(filtered[j].Name)
		if leftName != rightName {
			return leftName < rightName
		}
		return filtered[i].ID < filtered[j].ID
	})
	result.Total = int64(len(filtered))
	start := (filters.Page - 1) * filters.Limit
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + filters.Limit
	if end > len(filtered) {
		end = len(filtered)
	}
	detail.Definitions = append(detail.Definitions, filtered[start:end]...)
	pageIDs := make([]uint32, 0, len(detail.Definitions))
	pageDefinitionIDs := make(map[uint32]bool, len(detail.Definitions))
	pageOrphanIDs := make([]uint32, 0)
	for _, definition := range detail.Definitions {
		pageDefinitionIDs[definition.ID] = true
		if !definition.Orphaned {
			pageIDs = append(pageIDs, definition.ID)
		} else {
			pageOrphanIDs = append(pageOrphanIDs, definition.ID)
		}
	}
	pageSummaries, err := repository.loadDefinitionSummaries(pageIDs)
	if err != nil {
		return result, err
	}
	for index, definition := range detail.Definitions {
		if definition.Orphaned {
			continue
		}
		if summary, ok := pageSummaries[definition.ID]; ok {
			detail.Definitions[index] = characterAchievementEditorDecorateAggregate(
				summary, completionByID[definition.ID], progressByID[definition.ID],
				rewardByID[definition.ID], selectionByID[definition.ID], mutationByID[definition.ID],
			)
		}
	}
	// Return page-scoped state and orphan identities so filtered/paginated views
	// stay bounded and cannot synthesize off-page rows in the client.
	detail.OrphanAchievementIDs = pageOrphanIDs
	pageStateIDs := make([]uint32, 0, len(pageDefinitionIDs))
	for achievementID := range pageDefinitionIDs {
		pageStateIDs = append(pageStateIDs, achievementID)
	}
	sort.Slice(pageStateIDs, func(i, j int) bool { return pageStateIDs[i] < pageStateIDs[j] })
	if err := s.loadCharacterPageState(&detail, characterID, pageStateIDs); err != nil {
		return result, err
	}
	if err := s.hydrateDefinitionRelations(&detail, pageIDs); err != nil {
		return result, err
	}
	result.Detail = detail
	return result, nil
}

func (s *characterAchievementEditorService) loadCharacterPageState(
	detail *achievementEditorCharacterDetail,
	characterID uint32,
	achievementIDs []uint32,
) error {
	if len(achievementIDs) == 0 {
		return nil
	}
	if err := s.characterDB.Table("character_achievements").Where("character_id = ? AND achievement_id IN ?", characterID, achievementIDs).
		Order("achievement_id").Scan(&detail.Completions).Error; err != nil {
		return err
	}
	if err := s.characterDB.Table("character_achievement_progress").Where("character_id = ? AND achievement_id IN ?", characterID, achievementIDs).
		Order("achievement_id, component_type, component_sequence, component_id").Scan(&detail.Progress).Error; err != nil {
		return err
	}
	if err := s.characterDB.Table("character_achievement_rewards").Where("character_id = ? AND achievement_id IN ?", characterID, achievementIDs).
		Order("achievement_id, reward_id").Scan(&detail.RewardLedgers).Error; err != nil {
		return err
	}
	if err := s.characterDB.Table("character_achievement_reward_selections").Where("character_id = ? AND achievement_id IN ?", characterID, achievementIDs).
		Order("achievement_id, reward_set_id").Scan(&detail.RewardSelections).Error; err != nil {
		return err
	}
	if err := s.characterDB.Table("character_achievement_pending_mutations").Where("character_id = ? AND achievement_id IN ?", characterID, achievementIDs).
		Order("mutation_id").Scan(&detail.PendingMutations).Error; err != nil {
		return err
	}
	return nil
}

func characterAchievementEditorDecorateDefinition(
	definition achievementEditorDefinitionSummary,
	completion achievementEditorCharacterCompletion,
	progress []achievementEditorCharacterProgress,
	rewards []achievementEditorCharacterRewardLedger,
	selections []achievementEditorCharacterRewardSelection,
	mutations []achievementEditorCharacterPendingMutation,
) achievementEditorDefinitionSummary {
	progressAggregate := characterAchievementEditorProgressAggregate{AchievementID: definition.ID}
	total := big.NewInt(0)
	for _, row := range progress {
		value := new(big.Int)
		if _, ok := value.SetString(row.CurrentCount, 10); ok {
			total.Add(total, value)
			if value.Sign() > 0 {
				progressAggregate.HasPositive = true
			}
		}
		progressAggregate.RowCount++
		if row.DefinitionVersion != 0 && (progressAggregate.MinimumDefinitionVersion == 0 || row.DefinitionVersion < progressAggregate.MinimumDefinitionVersion) {
			progressAggregate.MinimumDefinitionVersion = row.DefinitionVersion
		}
		if row.DefinitionVersion > progressAggregate.MaximumDefinitionVersion {
			progressAggregate.MaximumDefinitionVersion = row.DefinitionVersion
		}
	}
	progressAggregate.Total = total.String()
	rewardAggregate := characterAchievementEditorAttentionAggregate{AchievementID: definition.ID}
	for _, row := range rewards {
		if row.Status != 1 {
			rewardAggregate.Attention = true
		}
	}
	selectionAggregate := characterAchievementEditorAttentionAggregate{AchievementID: definition.ID}
	for _, row := range selections {
		if (row.Status != 0 && row.Status != 1) || (row.Status == 0 && row.SelectedOptionID != 0) {
			selectionAggregate.Attention = true
		}
	}
	mutationAggregate := characterAchievementEditorMutationAggregate{AchievementID: definition.ID}
	for _, mutation := range mutations {
		if mutation.DefinitionVersion == 0 {
			continue
		}
		if mutationAggregate.MinimumDefinitionVersion == 0 || mutation.DefinitionVersion < mutationAggregate.MinimumDefinitionVersion {
			mutationAggregate.MinimumDefinitionVersion = mutation.DefinitionVersion
		}
		if mutation.DefinitionVersion > mutationAggregate.MaximumDefinitionVersion {
			mutationAggregate.MaximumDefinitionVersion = mutation.DefinitionVersion
		}
	}
	if len(mutations) == 0 {
		mutationAggregate.AchievementID = 0
	}
	return characterAchievementEditorDecorateAggregate(
		definition, completion, progressAggregate, rewardAggregate, selectionAggregate, mutationAggregate,
	)
}

func characterAchievementEditorDecorateAggregate(
	definition achievementEditorDefinitionSummary,
	completion achievementEditorCharacterCompletion,
	progress characterAchievementEditorProgressAggregate,
	reward characterAchievementEditorAttentionAggregate,
	selection characterAchievementEditorAttentionAggregate,
	mutation characterAchievementEditorMutationAggregate,
) achievementEditorDefinitionSummary {
	if completion.AchievementID != 0 {
		definition.State = "completed"
		definition.CompletedAt = completion.CompletedAt
		definition.CharacterDefinitionVersion = completion.DefinitionVersion
		if !definition.Orphaned && completion.DefinitionVersion != 0 && completion.DefinitionVersion != definition.DefinitionVersion {
			definition.VersionMismatch = true
		}
	} else if progress.HasPositive {
		definition.State = "in_progress"
	} else {
		definition.State = "not_started"
	}
	definition.ProgressRows = progress.RowCount
	definition.ProgressTotal = progress.Total
	if definition.ProgressTotal == "" {
		definition.ProgressTotal = "0"
	}
	if progress.RowCount > 0 {
		if definition.CharacterDefinitionVersion == 0 {
			definition.CharacterDefinitionVersion = progress.MinimumDefinitionVersion
		}
		if !definition.Orphaned &&
			((progress.MinimumDefinitionVersion != 0 && progress.MinimumDefinitionVersion != definition.DefinitionVersion) ||
				(progress.MaximumDefinitionVersion != 0 && progress.MaximumDefinitionVersion != definition.DefinitionVersion)) {
			definition.VersionMismatch = true
		}
	}
	definition.RewardAttention = reward.Attention || selection.Attention
	definition.PendingMutation = mutation.AchievementID != 0
	if !definition.Orphaned && mutation.AchievementID != 0 &&
		((mutation.MinimumDefinitionVersion != 0 && mutation.MinimumDefinitionVersion != definition.DefinitionVersion) ||
			(mutation.MaximumDefinitionVersion != 0 && mutation.MaximumDefinitionVersion != definition.DefinitionVersion)) {
		definition.VersionMismatch = true
	}
	return definition
}

func characterAchievementEditorStateMatches(definition achievementEditorDefinitionSummary, filter string) bool {
	switch filter {
	case "completed":
		return definition.State == "completed"
	case "not_completed":
		return definition.State != "completed" && !definition.Orphaned
	case "in_progress":
		return definition.State == "in_progress"
	case "not_started":
		return definition.State == "not_started"
	case "version_mismatch":
		return definition.VersionMismatch
	case "reward_attention":
		return definition.RewardAttention
	case "pending_mutation":
		return definition.PendingMutation
	case "orphaned":
		return definition.Orphaned
	default:
		return true
	}
}

func characterAchievementEditorSearchMatches(definition achievementEditorDefinitionSummary, search string) bool {
	search = strings.ToLower(strings.TrimSpace(search))
	if search == "" {
		return true
	}
	return strings.Contains(strings.ToLower(definition.Name), search) ||
		strings.Contains(strings.ToLower(definition.Description), search) ||
		strings.Contains(strconv.FormatUint(uint64(definition.ID), 10), search)
}

func (s *characterAchievementEditorService) hydrateDefinitionRelations(detail *achievementEditorCharacterDetail, ids []uint32) error {
	if len(ids) == 0 {
		return nil
	}
	if err := s.contentDB.Table("achievement_category_associations association").Select(`
		association.achievement_id, association.category_id, association.sequence,
		association.display_text, category.name AS category_name
	`).Joins("LEFT JOIN achievement_categories category ON category.id = association.category_id").
		Where("association.achievement_id IN ?", ids).Order("association.achievement_id, association.sequence, association.category_id").
		Scan(&detail.Associations).Error; err != nil {
		return err
	}
	if err := s.contentDB.Table("achievement_components component").Select(`
		component.achievement_id, component.component_type, component.sequence,
		component.component_id, component.description, component.description_2,
		COALESCE(component_count.required_count, 1) AS presentation_count
	`).Joins("LEFT JOIN achievement_component_counts component_count ON component_count.component_id = component.component_id").
		Where("component.achievement_id IN ?", ids).Order("component.achievement_id, component.component_type, component.sequence, component.component_id").
		Scan(&detail.Components).Error; err != nil {
		return err
	}
	if err := s.contentDB.Table("achievement_criteria").Where("achievement_id IN ?", ids).
		Order("achievement_id, component_type, component_sequence, component_id, id").Scan(&detail.Criteria).Error; err != nil {
		return err
	}
	criteriaByComponent := make(map[string][]achievementEditorCriterion)
	for _, criterion := range detail.Criteria {
		key := fmt.Sprintf("%d:%d:%d", criterion.AchievementID, criterion.ComponentType, criterion.ComponentID)
		criteriaByComponent[key] = append(criteriaByComponent[key], criterion)
	}
	for index := range detail.Components {
		component := &detail.Components[index]
		key := fmt.Sprintf("%d:%d:%d", component.AchievementID, component.ComponentType, component.ComponentID)
		component.Criteria = criteriaByComponent[key]
		if component.Criteria == nil {
			component.Criteria = make([]achievementEditorCriterion, 0)
		}
	}
	if err := s.contentDB.Table("achievement_rewards").Where("achievement_id IN ?", ids).
		Order("achievement_id, sequence, reward_id").Scan(&detail.Rewards).Error; err != nil {
		return err
	}
	if err := s.contentDB.Table("achievement_reward_sets").Where("achievement_id IN ?", ids).
		Order("achievement_id, reward_set_id").Scan(&detail.RewardSets).Error; err != nil {
		return err
	}
	setIDs := make([]uint32, 0, len(detail.RewardSets))
	for _, set := range detail.RewardSets {
		setIDs = append(setIDs, set.RewardSetID)
	}
	if len(setIDs) > 0 {
		if err := s.contentDB.Table("achievement_reward_options").Where("reward_set_id IN ?", setIDs).
			Order("reward_set_id, sequence, option_id").Scan(&detail.RewardOptions).Error; err != nil {
			return err
		}
		if err := s.contentDB.Table("achievement_reward_option_entries").Where("reward_set_id IN ?", setIDs).
			Order("reward_set_id, option_id, reward_id").Scan(&detail.RewardOptionEntries).Error; err != nil {
			return err
		}
		optionsBySet := make(map[uint32][]achievementEditorRewardOption)
		mappingsBySet := make(map[uint32][]achievementEditorRewardMapping)
		for _, option := range detail.RewardOptions {
			optionsBySet[option.RewardSetID] = append(optionsBySet[option.RewardSetID], option)
		}
		for _, mapping := range detail.RewardOptionEntries {
			mappingsBySet[mapping.RewardSetID] = append(mappingsBySet[mapping.RewardSetID], mapping)
		}
		for index := range detail.RewardSets {
			set := &detail.RewardSets[index]
			set.Options = optionsBySet[set.RewardSetID]
			set.Mappings = mappingsBySet[set.RewardSetID]
			if set.Options == nil {
				set.Options = make([]achievementEditorRewardOption, 0)
			}
			if set.Mappings == nil {
				set.Mappings = make([]achievementEditorRewardMapping, 0)
			}
		}
	}
	return s.contentDB.Table("achievement_cast_restrictions").Where("achievement_id IN ?", ids).
		Order("restriction_id, achievement_id").Scan(&detail.Restrictions).Error
}
