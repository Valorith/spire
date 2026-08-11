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
	AchievementID  uint32
	RowCount       int64
	Total          string
	HasPositive    bool
	MinimumVersion uint32
	MaximumVersion uint32
}

type characterAchievementEditorAttentionAggregate struct {
	AchievementID uint32
	Attention     bool
}

type characterAchievementEditorUpdateAggregate struct {
	AchievementID  uint32
	RowCount       int64
	MinimumVersion uint32
	MaximumVersion uint32
}

func characterAchievementEditorSortedStateIDs(ids map[uint32]bool) []uint32 {
	result := make([]uint32, 0, len(ids))
	for id := range ids {
		result = append(result, id)
	}
	sort.Slice(result, func(i, j int) bool { return result[i] < result[j] })
	return result
}

func characterAchievementEditorDefinitionQuery(
	db *gorm.DB,
	filters characterAchievementEditorDetailFilters,
) *gorm.DB {
	query := db.Table("achievements a")
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
		if id, err := strconv.ParseUint(search, 10, 32); err == nil {
			query = query.Where("a.id = ? OR a.name LIKE ? OR a.description LIKE ? OR "+categoryMatch, id, like, like, like, like)
		} else {
			query = query.Where("a.name LIKE ? OR a.description LIKE ? OR "+categoryMatch, like, like, like, like)
		}
	}
	if filters.CategoryID != nil {
		query = query.Where(`EXISTS (
			SELECT 1 FROM achievement_category_associations ca
			WHERE ca.achievement_id = a.id AND ca.category_id = ?
		)`, *filters.CategoryID)
	}
	return query
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
		Requirements:         make([]achievementEditorCastRequirement, 0),
		Completions:          make([]achievementEditorCharacterCompletion, 0),
		Progress:             make([]achievementEditorCharacterProgress, 0),
		RewardLedgers:        make([]achievementEditorCharacterRewardLedger, 0),
		RewardSelections:     make([]achievementEditorCharacterRewardSelection, 0),
		PendingUpdates:       make([]achievementEditorCharacterPendingUpdate, 0),
		OrphanAchievementIDs: make([]uint32, 0),
	}

	// Build one bounded aggregate row per achievement. The previous implementation
	// hydrated every progress, reward, selection, and update row before applying
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
		MIN(version) AS minimum_version,
		MAX(version) AS maximum_version
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
	updateRows := make([]characterAchievementEditorUpdateAggregate, 0)
	if err := s.characterDB.Table("character_achievement_pending_updates").Select(`
		achievement_id,
		COUNT(*) AS row_count,
		MIN(version) AS minimum_version,
		MAX(version) AS maximum_version
	`).Where("character_id = ?", characterID).Group("achievement_id").Scan(&updateRows).Error; err != nil {
		return result, err
	}

	completionByID := make(map[uint32]achievementEditorCharacterCompletion)
	progressByID := make(map[uint32]characterAchievementEditorProgressAggregate)
	rewardByID := make(map[uint32]characterAchievementEditorAttentionAggregate)
	selectionByID := make(map[uint32]characterAchievementEditorAttentionAggregate)
	updateByID := make(map[uint32]characterAchievementEditorUpdateAggregate)
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
	for _, update := range updateRows {
		updateByID[update.AchievementID] = update
		stateIDs[update.AchievementID] = true
	}

	// Resolve only the character's state-bearing IDs against content. Search and
	// category filters must not turn a valid off-filter definition into an orphan.
	knownDefinitionIDs := make(map[uint32]bool, len(stateIDs))
	stateIDList := characterAchievementEditorSortedStateIDs(stateIDs)
	if len(stateIDList) > 0 {
		knownStateIDs := make([]uint32, 0, len(stateIDList))
		if err := s.contentDB.Table("achievements").Where("id IN ?", stateIDList).Pluck("id", &knownStateIDs).Error; err != nil {
			return result, err
		}
		for _, achievementID := range knownStateIDs {
			knownDefinitionIDs[achievementID] = true
		}
	}
	orphans := make([]achievementEditorDefinitionSummary, 0)
	for achievementID := range stateIDs {
		if knownDefinitionIDs[achievementID] {
			continue
		}
		orphan := achievementEditorDefinitionSummary{
			ID: achievementID, Name: fmt.Sprintf("Deleted definition #%d", achievementID),
			State: "orphaned", Orphaned: true,
		}
		if completion, ok := completionByID[achievementID]; ok {
			orphan.CompletedAt = completion.CompletedAt
			orphan.CharacterVersion = completion.Version
		}
		orphan = characterAchievementEditorDecorateAggregate(
			orphan, completionByID[achievementID], progressByID[achievementID],
			rewardByID[achievementID], selectionByID[achievementID], updateByID[achievementID],
		)
		if filters.CategoryID == nil && characterAchievementEditorStateMatches(orphan, filters.State) && characterAchievementEditorSearchMatches(orphan, filters.Search) {
			orphans = append(orphans, orphan)
		}
	}
	sort.Slice(orphans, func(i, j int) bool { return orphans[i].ID < orphans[j].ID })

	includeIDs := make(map[uint32]bool)
	excludeIDs := make(map[uint32]bool)
	requireInclude := false
	postFilter := false
	suppressDefinitions := false
	switch filters.State {
	case "completed":
		requireInclude = true
		for id := range completionByID {
			includeIDs[id] = true
		}
	case "in_progress":
		requireInclude = true
		for id, progress := range progressByID {
			if progress.HasPositive {
				if _, completed := completionByID[id]; !completed {
					includeIDs[id] = true
				}
			}
		}
	case "not_completed":
		for id := range completionByID {
			excludeIDs[id] = true
		}
	case "not_started":
		for id := range completionByID {
			excludeIDs[id] = true
		}
		for id, progress := range progressByID {
			if progress.HasPositive {
				excludeIDs[id] = true
			}
		}
	case "version_mismatch":
		requireInclude = true
		postFilter = true
		for id := range completionByID {
			includeIDs[id] = true
		}
		for id := range progressByID {
			includeIDs[id] = true
		}
		for id := range updateByID {
			includeIDs[id] = true
		}
	case "reward_attention":
		requireInclude = true
		for id, reward := range rewardByID {
			if reward.Attention {
				includeIDs[id] = true
			}
		}
		for id, selection := range selectionByID {
			if selection.Attention {
				includeIDs[id] = true
			}
		}
	case "pending_update":
		requireInclude = true
		for id := range updateByID {
			includeIDs[id] = true
		}
	case "orphaned":
		suppressDefinitions = true
	}

	definitionQuery := characterAchievementEditorDefinitionQuery(s.contentDB, filters)
	if requireInclude {
		ids := characterAchievementEditorSortedStateIDs(includeIDs)
		if len(ids) == 0 {
			suppressDefinitions = true
		} else {
			definitionQuery = definitionQuery.Where("a.id IN ?", ids)
		}
	}
	if ids := characterAchievementEditorSortedStateIDs(excludeIDs); len(ids) > 0 {
		definitionQuery = definitionQuery.Where("a.id NOT IN ?", ids)
	}

	const definitionProjection = "a.id, a.name, a.description, a.icon_id, a.points, a.version, a.enabled"
	validCandidates := make([]achievementEditorDefinitionSummary, 0)
	var validTotal int64
	if !suppressDefinitions && postFilter {
		if err := definitionQuery.Select(definitionProjection).Order("a.name ASC, a.id ASC").Scan(&validCandidates).Error; err != nil {
			return result, err
		}
		filteredCandidates := validCandidates[:0]
		for _, definition := range validCandidates {
			definition = characterAchievementEditorDecorateAggregate(
				definition, completionByID[definition.ID], progressByID[definition.ID],
				rewardByID[definition.ID], selectionByID[definition.ID], updateByID[definition.ID],
			)
			if characterAchievementEditorStateMatches(definition, filters.State) {
				filteredCandidates = append(filteredCandidates, definition)
			}
		}
		validCandidates = filteredCandidates
		validTotal = int64(len(validCandidates))
	} else if !suppressDefinitions {
		if err := definitionQuery.Count(&validTotal).Error; err != nil {
			return result, err
		}
	}

	result.Total = validTotal + int64(len(orphans))
	start := int64((filters.Page - 1) * filters.Limit)
	remaining := filters.Limit
	pageDefinitions := make([]achievementEditorDefinitionSummary, 0, filters.Limit)
	if start < validTotal && remaining > 0 {
		count := remaining
		if available := int(validTotal - start); count > available {
			count = available
		}
		if postFilter {
			pageDefinitions = append(pageDefinitions, validCandidates[int(start):int(start)+count]...)
		} else if err := definitionQuery.Select(definitionProjection).Order("a.name ASC, a.id ASC").
			Limit(count).Offset(int(start)).Scan(&pageDefinitions).Error; err != nil {
			return result, err
		}
		remaining -= count
	}
	orphanOffset := 0
	if start >= validTotal {
		orphanOffset = int(start - validTotal)
	}
	pageOrphans := make([]achievementEditorDefinitionSummary, 0)
	if remaining > 0 && orphanOffset < len(orphans) {
		orphanEnd := orphanOffset + remaining
		if orphanEnd > len(orphans) {
			orphanEnd = len(orphans)
		}
		pageOrphans = append(pageOrphans, orphans[orphanOffset:orphanEnd]...)
	}

	repository := newAchievementEditorRepository(s.contentDB)
	catalogPageIDs := make([]uint32, 0, len(pageDefinitions))
	for _, definition := range pageDefinitions {
		catalogPageIDs = append(catalogPageIDs, definition.ID)
	}
	pageSummaries, err := repository.loadDefinitionSummaries(catalogPageIDs)
	if err != nil {
		return result, err
	}
	for _, definition := range pageDefinitions {
		if summary, ok := pageSummaries[definition.ID]; ok {
			definition = summary
		}
		detail.Definitions = append(detail.Definitions, characterAchievementEditorDecorateAggregate(
			definition, completionByID[definition.ID], progressByID[definition.ID],
			rewardByID[definition.ID], selectionByID[definition.ID], updateByID[definition.ID],
		))
	}
	detail.Definitions = append(detail.Definitions, pageOrphans...)
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
	if err := s.characterDB.Table("character_achievement_pending_updates").Where("character_id = ? AND achievement_id IN ?", characterID, achievementIDs).
		Order("update_id").Scan(&detail.PendingUpdates).Error; err != nil {
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
	updates []achievementEditorCharacterPendingUpdate,
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
		if progressAggregate.RowCount == 0 || row.Version < progressAggregate.MinimumVersion {
			progressAggregate.MinimumVersion = row.Version
		}
		if progressAggregate.RowCount == 0 || row.Version > progressAggregate.MaximumVersion {
			progressAggregate.MaximumVersion = row.Version
		}
		progressAggregate.RowCount++
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
	updateAggregate := characterAchievementEditorUpdateAggregate{AchievementID: definition.ID}
	for _, update := range updates {
		if updateAggregate.RowCount == 0 || update.Version < updateAggregate.MinimumVersion {
			updateAggregate.MinimumVersion = update.Version
		}
		if updateAggregate.RowCount == 0 || update.Version > updateAggregate.MaximumVersion {
			updateAggregate.MaximumVersion = update.Version
		}
		updateAggregate.RowCount++
	}
	if updateAggregate.RowCount == 0 {
		updateAggregate.AchievementID = 0
	}
	return characterAchievementEditorDecorateAggregate(
		definition, completion, progressAggregate, rewardAggregate, selectionAggregate, updateAggregate,
	)
}

func characterAchievementEditorDecorateAggregate(
	definition achievementEditorDefinitionSummary,
	completion achievementEditorCharacterCompletion,
	progress characterAchievementEditorProgressAggregate,
	reward characterAchievementEditorAttentionAggregate,
	selection characterAchievementEditorAttentionAggregate,
	update characterAchievementEditorUpdateAggregate,
) achievementEditorDefinitionSummary {
	if completion.AchievementID != 0 {
		definition.State = "completed"
		definition.CompletedAt = completion.CompletedAt
		definition.CharacterVersion = completion.Version
		if !definition.Orphaned && completion.Version != definition.Version {
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
		if completion.AchievementID == 0 {
			definition.CharacterVersion = progress.MinimumVersion
		}
		if !definition.Orphaned &&
			(progress.MinimumVersion != definition.Version || progress.MaximumVersion != definition.Version) {
			definition.VersionMismatch = true
		}
	}
	definition.RewardAttention = reward.Attention || selection.Attention
	definition.PendingUpdate = update.RowCount > 0
	if !definition.Orphaned && update.RowCount > 0 &&
		(update.MinimumVersion != definition.Version || update.MaximumVersion != definition.Version) {
		definition.VersionMismatch = true
	}
	if definition.Orphaned {
		definition.State = "orphaned"
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
	case "pending_update":
		return definition.PendingUpdate
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
		component.component_id, component.name, component.description,
		COALESCE(component_count.required_count, 1) AS presentation_count
	`).Joins("LEFT JOIN achievement_associations component_count ON component_count.component_id = component.component_id").
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
	automaticRewards := make([]achievementEditorReward, 0)
	if err := s.contentDB.Table("reward_source_entries source_entry").Select(`
		source_entry.source_id, source_entry.sequence, reward.reward_id, reward.reward_type,
		reward.reward_data_id, reward.amount, reward.description, reward.enabled
	`).Joins("JOIN rewards reward ON reward.reward_id = source_entry.reward_id").
		Where("source_entry.source_type = ? AND source_entry.source_id IN ?", achievementEditorRewardSourceType, ids).
		Order("source_entry.source_id, source_entry.sequence, reward.reward_id").Scan(&automaticRewards).Error; err != nil {
		return err
	}
	detail.Rewards = append(detail.Rewards, automaticRewards...)
	if err := s.contentDB.Table("reward_sources source").Select(`
		source.source_id, reward_set.reward_set_id, reward_set.title, reward_set.enabled,
		source.enabled AS source_enabled,
		(SELECT COUNT(*) FROM reward_sources usage_source WHERE usage_source.reward_set_id = source.reward_set_id) AS source_count
	`).Joins("JOIN reward_sets reward_set ON reward_set.reward_set_id = source.reward_set_id").
		Where("source.source_type = ? AND source.source_id IN ?", achievementEditorRewardSourceType, ids).
		Order("source.source_id, reward_set.reward_set_id").Scan(&detail.RewardSets).Error; err != nil {
		return err
	}
	setIDs := make([]uint32, 0, len(detail.RewardSets))
	for index := range detail.RewardSets {
		set := &detail.RewardSets[index]
		set.Shared = set.SourceCount > 1
		setIDs = append(setIDs, set.RewardSetID)
	}
	if len(setIDs) > 0 {
		if err := s.contentDB.Table("reward_options").Where("reward_set_id IN ?", setIDs).
			Order("reward_set_id, sequence, option_id").Scan(&detail.RewardOptions).Error; err != nil {
			return err
		}
		if err := s.contentDB.Table("reward_option_entries").Where("reward_set_id IN ?", setIDs).
			Order("reward_set_id, option_id, sequence, reward_id").Scan(&detail.RewardOptionEntries).Error; err != nil {
			return err
		}
		selectableRewards := make([]achievementEditorReward, 0)
		if err := s.contentDB.Table("reward_sources source").Select(`
			source.source_id, entry.sequence, reward.reward_id, reward.reward_type,
			reward.reward_data_id, reward.amount, reward.description, reward.enabled
		`).Joins("JOIN reward_option_entries entry ON entry.reward_set_id = source.reward_set_id").
			Joins("JOIN rewards reward ON reward.reward_id = entry.reward_id").
			Where("source.source_type = ? AND source.source_id IN ?", achievementEditorRewardSourceType, ids).
			Order("source.source_id, entry.option_id, entry.sequence, reward.reward_id").Scan(&selectableRewards).Error; err != nil {
			return err
		}
		detail.Rewards = append(detail.Rewards, selectableRewards...)
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
	return s.contentDB.Table("achievement_cast_requirements").Where("achievement_id IN ?", ids).
		Order("restriction_id, achievement_id").Scan(&detail.Requirements).Error
}
