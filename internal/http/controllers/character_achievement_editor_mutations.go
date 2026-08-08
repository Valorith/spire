package controllers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type achievementEditorDefinitionPolicy struct {
	ID                uint32 `gorm:"column:id"`
	DefinitionVersion uint32 `gorm:"column:definition_version"`
	Enabled           bool   `gorm:"column:enabled"`
}

const achievementEditorProcessingLeaseSeconds uint64 = 60

func achievementEditorCharacterLockName(characterID uint32) string {
	// This name is part of the EQEmu runtime's cross-process lock contract.
	return fmt.Sprintf("eqemu_achievement_mutation_%d", characterID)
}

func (a *AchievementEditorController) loadAchievementDefinitionPolicy(c echo.Context, achievementID uint32) (achievementEditorDefinitionPolicy, error) {
	return loadAchievementDefinitionPolicyFromDB(a.contentDB(c), achievementID)
}

func loadAchievementDefinitionPolicyFromDB(db *gorm.DB, achievementID uint32) (achievementEditorDefinitionPolicy, error) {
	policy := achievementEditorDefinitionPolicy{}
	err := db.Table("achievements").
		Select("id, definition_version, enabled").Where("id = ?", achievementID).Take(&policy).Error
	return policy, err
}

func validateAchievementEditorPositiveStatePolicy(
	policy achievementEditorDefinitionPolicy,
	action string,
) error {
	if policy.Enabled {
		return nil
	}
	return operationalEditorConflict(
		"Achievement %d is disabled and is not part of the active server snapshot; enable the definition before %s",
		policy.ID,
		action,
	)
}

func validateAchievementEditorStoredStateVersions(versions []uint32, currentVersion uint32) error {
	for _, version := range versions {
		if version != 0 && version != currentVersion {
			return operationalEditorConflict(
				"Stored character achievement state belongs to definition version %d, not %d; reset the achievement before creating new state",
				version,
				currentVersion,
			)
		}
	}
	return nil
}

func validateAchievementEditorPendingMutationRetryVersion(storedVersion uint32, currentVersion uint32) error {
	if storedVersion == 0 {
		return operationalEditorConflict("Queued mutation has no definition version and cannot be retried safely")
	}
	if storedVersion != currentVersion {
		return operationalEditorConflict(
			"Queued mutation definition version %d is incompatible with current version %d",
			storedVersion,
			currentVersion,
		)
	}
	return nil
}

func assertAchievementEditorStoredStateVersions(
	tx *gorm.DB,
	characterID uint32,
	achievementID uint32,
	currentVersion uint32,
) error {
	versions := make([]uint32, 0)
	for _, table := range []string{"character_achievements", "character_achievement_progress"} {
		rows := make([]struct {
			DefinitionVersion uint32 `gorm:"column:definition_version"`
		}, 0)
		if err := tx.Table(table).Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("definition_version").
			Where("character_id = ? AND achievement_id = ?", characterID, achievementID).
			Find(&rows).Error; err != nil {
			return err
		}
		for _, row := range rows {
			versions = append(versions, row.DefinitionVersion)
		}
	}
	return validateAchievementEditorStoredStateVersions(versions, currentVersion)
}

func validateCharacterAchievementMutationBase(
	base achievementEditorCharacterMutationBase,
	character achievementEditorCharacter,
	operationPhrase string,
) error {
	if err := validateAchievementEditorReason(base.Reason); err != nil {
		return achievementEditorFieldError(http.StatusUnprocessableEntity, "reason", err.Error(), nil)
	}
	if err := achievementEditorConfirmation(base.CharacterConfirmation, character.Name); err != nil {
		return achievementEditorFieldError(http.StatusUnprocessableEntity, "character_confirmation", err.Error(), nil)
	}
	if err := achievementEditorConfirmation(base.Confirmation, operationPhrase); err != nil {
		return achievementEditorFieldError(http.StatusUnprocessableEntity, "confirmation", err.Error(), nil)
	}
	return nil
}

func validateCharacterAchievementPendingMutationRequest(
	request achievementEditorPendingMutationRequest,
	character achievementEditorCharacter,
	operationPhrase string,
) error {
	if err := validateAchievementEditorReason(request.Reason); err != nil {
		return achievementEditorFieldError(http.StatusUnprocessableEntity, "reason", err.Error(), nil)
	}
	if err := achievementEditorConfirmation(request.CharacterConfirmation, character.Name); err != nil {
		return achievementEditorFieldError(http.StatusUnprocessableEntity, "character_confirmation", err.Error(), nil)
	}
	if err := achievementEditorConfirmation(request.Confirmation, operationPhrase); err != nil {
		return achievementEditorFieldError(http.StatusUnprocessableEntity, "confirmation", err.Error(), nil)
	}
	return nil
}

func (a *AchievementEditorController) executeCharacterAchievementMutation(
	c echo.Context,
	character achievementEditorCharacter,
	event string,
	payload map[string]interface{},
	mutate func(*gorm.DB, achievementEditorCharacter) error,
) (uint, error) {
	auditID, err := writeOperationalEditorAudit(c, a.auditLog, event, payload)
	if err != nil {
		return 0, err
	}
	err = withCharacterAchievementEditorLock(a.characterDB(c), character.ID, character.Name, mutate)
	if err != nil {
		discardOperationalEditorAudit(a.db, auditID)
		return 0, err
	}
	return auditID, nil
}

func withCharacterAchievementEditorLock(
	db *gorm.DB,
	characterID uint32,
	expectedName string,
	mutate func(*gorm.DB, achievementEditorCharacter) error,
) error {
	lockName := achievementEditorCharacterLockName(characterID)
	return db.Connection(func(connection *gorm.DB) (err error) {
		var lock struct {
			Acquired int `gorm:"column:acquired"`
		}
		if err := connection.Raw("SELECT GET_LOCK(?, 5) AS acquired", lockName).Scan(&lock).Error; err != nil {
			return err
		}
		if lock.Acquired != 1 {
			return operationalEditorConflict("Character %d is already being changed; retry after the other operation finishes", characterID)
		}
		// This defer belongs to the pinned-connection scope. The nested
		// transaction below therefore commits or rolls back before the runtime
		// advisory lock is released.
		defer func() {
			var release struct {
				Released *int `gorm:"column:released"`
			}
			releaseErr := connection.Raw("SELECT RELEASE_LOCK(?) AS released", lockName).Scan(&release).Error
			if releaseErr == nil && (release.Released == nil || *release.Released != 1) {
				releaseErr = fmt.Errorf("character achievement lock %q was not released by its owner", lockName)
			}
			if releaseErr != nil {
				connection.Logger.Error(
					context.Background(),
					"HIGH SEVERITY: character achievement unlock failed after work completed; preserving the mutation outcome to prevent an unsafe retry: %v",
					releaseErr,
				)
			}
			err = achievementEditorAdvisoryMutationOutcome(err, releaseErr)
		}()

		err = connection.Transaction(func(tx *gorm.DB) error {
			var character achievementEditorCharacter
			if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).
				Select("id, account_id, name, level, class, ingame AS in_game, last_login, deleted_at").
				Where("id = ? AND deleted_at IS NULL", characterID).Take(&character).Error; err != nil {
				return err
			}
			if character.Name != expectedName {
				return operationalEditorConflict("The character name changed; reload and confirm the current name")
			}
			if character.InGame {
				return operationalEditorConflict("Character %s is online; achievement state can be changed only while the character is offline", character.Name)
			}
			return mutate(tx, character)
		})
		return err
	})
}

func achievementEditorEffectiveRequiredCount(requiredCounts []uint32) (uint32, error) {
	if len(requiredCounts) == 0 {
		return 0, operationalEditorConflict("The component has no enabled runtime criterion and cannot store exact progress")
	}
	effective := requiredCounts[0]
	if effective == 0 {
		return 0, operationalEditorConflict("The component's enabled runtime criterion has an invalid zero required count")
	}
	for _, requiredCount := range requiredCounts[1:] {
		if requiredCount != effective {
			return 0, operationalEditorConflict("The component's enabled criteria disagree on their runtime required count")
		}
	}
	return effective, nil
}

func achievementEditorEnabledComponentCriteriaQuery(
	db *gorm.DB,
	achievementID uint32,
	componentType uint8,
	componentID uint32,
) *gorm.DB {
	return db.Table("achievement_criteria").Where(
		"achievement_id = ? AND component_type = ? AND component_id = ? AND enabled = 1",
		achievementID, componentType, componentID,
	).Order("id")
}

func loadAchievementEditorComponentRuntimePolicy(
	db *gorm.DB,
	achievementID uint32,
	componentType uint8,
	componentID uint32,
) (uint32, uint32, error) {
	var component struct {
		Sequence uint32 `gorm:"column:sequence"`
	}
	if err := db.Table("achievement_components").Select("sequence").Where(
		"achievement_id = ? AND component_type = ? AND component_id = ?",
		achievementID, componentType, componentID,
	).Take(&component).Error; err != nil {
		return 0, 0, err
	}
	requiredCounts := make([]uint32, 0)
	if err := achievementEditorEnabledComponentCriteriaQuery(
		db, achievementID, componentType, componentID,
	).Pluck("required_count", &requiredCounts).Error; err != nil {
		return 0, 0, err
	}
	requiredCount, err := achievementEditorEffectiveRequiredCount(requiredCounts)
	if err != nil {
		return 0, 0, err
	}
	return component.Sequence, requiredCount, nil
}

func achievementEditorProcessingLeaseExpired(lastAttemptAt uint64, now uint64) bool {
	return now >= achievementEditorProcessingLeaseSeconds &&
		lastAttemptAt <= now-achievementEditorProcessingLeaseSeconds
}

func parseAchievementEditorExpectedCurrentCount(raw *string) (*uint64, error) {
	if raw == nil {
		return nil, achievementEditorFieldError(http.StatusUnprocessableEntity, "expected_current_count", "Expected current count is required and must be the exact unsigned 64-bit decimal string loaded by the editor", nil)
	}
	decimal := strings.TrimSpace(*raw)
	if decimal == "" || strings.HasPrefix(decimal, "+") || strings.HasPrefix(decimal, "-") {
		return nil, achievementEditorFieldError(http.StatusUnprocessableEntity, "expected_current_count", "Expected current count must be an unsigned 64-bit decimal string", nil)
	}
	value, err := strconv.ParseUint(decimal, 10, 64)
	if err != nil {
		return nil, achievementEditorFieldError(http.StatusUnprocessableEntity, "expected_current_count", "Expected current count must be an unsigned 64-bit decimal string", err)
	}
	return &value, nil
}

func validateAchievementEditorExpectedCurrentCount(expected *uint64, actual uint64) error {
	if expected == nil {
		return achievementEditorFieldError(http.StatusUnprocessableEntity, "expected_current_count", "Expected current count is required; reload the component before saving exact progress", nil)
	}
	if *expected == actual {
		return nil
	}
	return operationalEditorConflict("Component progress changed from %d to %d; reload before saving", *expected, actual)
}

func achievementEditorAuthorizeStaleProcessingLeaseRecovery(
	lastAttemptAt uint64,
	now uint64,
	acknowledged bool,
) error {
	if !achievementEditorProcessingLeaseExpired(lastAttemptAt, now) {
		return operationalEditorConflict("An active processing mutation lease exists; wait for its 60-second lease to expire")
	}
	if !acknowledged {
		return achievementEditorFieldError(
			http.StatusUnprocessableEntity,
			"acknowledge_stale_processing_lease",
			"Acknowledge recovery of the expired processing lease before continuing",
			nil,
		)
	}
	return nil
}

func validateAchievementEditorSelectionRetryLedger(
	ledger achievementEditorCharacterRewardSelection,
	expectedStatus uint8,
) error {
	if ledger.Status != expectedStatus {
		return operationalEditorConflict(
			"Selection status changed from %d to %d; reload before retrying",
			expectedStatus, ledger.Status,
		)
	}
	if ledger.Status == 1 {
		return operationalEditorConflict("A fully granted reward selection cannot be retried")
	}
	if ledger.Status != 0 && ledger.Status != 2 && ledger.Status != 3 {
		return operationalEditorConflict("Unknown reward selection status %d cannot be retried", ledger.Status)
	}
	if ledger.SelectedOptionID == 0 {
		if ledger.Status == 0 {
			return operationalEditorConflict("A pending reward selection has no chosen option and cannot be retried")
		}
		return operationalEditorConflict("The reward selection has no chosen option and cannot be retried safely")
	}
	return nil
}

func validateAchievementEditorRewardRetryLedger(
	ledger achievementEditorCharacterRewardLedger,
	expectedStatus uint8,
) error {
	if ledger.Status != expectedStatus {
		return operationalEditorConflict(
			"Reward ledger status changed from %d to %d; reload before retrying",
			expectedStatus, ledger.Status,
		)
	}
	if ledger.Status == 1 {
		return operationalEditorConflict("A granted reward ledger cannot be retried")
	}
	if ledger.Status != 0 && ledger.Status != 2 {
		return operationalEditorConflict("Reward ledger status %d is not safely retryable", ledger.Status)
	}
	return nil
}

func validateAchievementEditorIndividualRewardRetryMapping(mappingCount int64) error {
	if mappingCount == 0 {
		return nil
	}
	return operationalEditorConflict("This reward is mapped to a selectable option and cannot be retried individually; retry its owning reward selection so the whole bundle is reconciled together")
}

func achievementEditorSelectionRetryRewardIDs(
	selectedOptionID uint32,
	options []achievementEditorRewardOption,
	mappings []achievementEditorRewardMapping,
	enabledRewardIDs map[string]struct{},
) ([]string, error) {
	relevantOptions := make(map[uint32]struct{})
	selectedFound := false
	for _, option := range options {
		if !option.Enabled {
			continue
		}
		if option.OptionID == selectedOptionID {
			if option.CommonToAll {
				return nil, operationalEditorConflict("The stored selected option is a common-to-all grant group, not a selectable choice")
			}
			selectedFound = true
			relevantOptions[option.OptionID] = struct{}{}
		}
		if option.CommonToAll {
			relevantOptions[option.OptionID] = struct{}{}
		}
	}
	if !selectedFound {
		return nil, operationalEditorConflict("The selectable reward set or its chosen option is missing or disabled")
	}

	grantsPerOption := make(map[uint32]int, len(relevantOptions))
	rewardIDs := make(map[string]struct{})
	for _, mapping := range mappings {
		if _, relevant := relevantOptions[mapping.OptionID]; !relevant {
			continue
		}
		if _, enabled := enabledRewardIDs[mapping.RewardID]; !enabled {
			return nil, operationalEditorConflict("A selected or common reward mapping references a missing, disabled, or foreign reward; repair the definition before retrying")
		}
		grantsPerOption[mapping.OptionID]++
		rewardIDs[mapping.RewardID] = struct{}{}
	}
	for optionID := range relevantOptions {
		if grantsPerOption[optionID] == 0 {
			return nil, operationalEditorConflict("Enabled selected/common option %d has no enabled mapped grant; repair the definition before retrying", optionID)
		}
	}
	result := make([]string, 0, len(rewardIDs))
	for rewardID := range rewardIDs {
		result = append(result, rewardID)
	}
	sort.Strings(result)
	return result, nil
}

func loadAchievementEditorSelectionRetryRewardIDs(
	db *gorm.DB,
	achievementID uint32,
	rewardSetID uint32,
	selectedOptionID uint32,
) ([]string, error) {
	var enabledSet int64
	if err := db.Table("achievement_reward_sets").
		Where("achievement_id = ? AND reward_set_id = ? AND enabled = 1", achievementID, rewardSetID).
		Count(&enabledSet).Error; err != nil {
		return nil, err
	}
	if enabledSet == 0 {
		return nil, operationalEditorConflict("The selectable reward set is missing, disabled, or no longer belongs to this achievement")
	}
	options := make([]achievementEditorRewardOption, 0)
	if err := db.Table("achievement_reward_options").
		Where("reward_set_id = ?", rewardSetID).
		Order("option_id").
		Scan(&options).Error; err != nil {
		return nil, err
	}
	mappings := make([]achievementEditorRewardMapping, 0)
	if err := db.Table("achievement_reward_option_entries").
		Where("reward_set_id = ?", rewardSetID).
		Order("option_id, reward_id").
		Scan(&mappings).Error; err != nil {
		return nil, err
	}
	rows := make([]struct {
		RewardID string `gorm:"column:reward_id"`
	}, 0)
	if err := db.Table("achievement_rewards").
		Select("reward_id").
		Where("achievement_id = ? AND enabled = 1", achievementID).
		Order("reward_id").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	enabledRewardIDs := make(map[string]struct{}, len(rows))
	for _, row := range rows {
		enabledRewardIDs[row.RewardID] = struct{}{}
	}
	return achievementEditorSelectionRetryRewardIDs(selectedOptionID, options, mappings, enabledRewardIDs)
}

func (a *AchievementEditorController) setCharacterProgress(c echo.Context) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievement progress", err)
	}
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorProgressRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The exact-progress request is not valid JSON"})
	}
	character, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).loadCharacter(characterID)
	if err != nil {
		return achievementEditorRespondError(c, "Character", err)
	}
	if err := validateCharacterAchievementMutationBase(request.achievementEditorCharacterMutationBase, character, character.Name); err != nil {
		return achievementEditorRespondError(c, "Character achievement progress", err)
	}
	if request.ComponentType > 2 {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Only state-bearing component types 0 through 2 can store progress", "field": "component_type"})
	}
	expectedCurrentCount, err := parseAchievementEditorExpectedCurrentCount(request.ExpectedCurrentCount)
	if err != nil {
		return achievementEditorRespondError(c, "Character achievement progress", err)
	}
	failureLabel := "Character achievement progress"
	var auditID uint
	err = achievementEditorWithAdvisoryLock(a.contentDB(c), achievementEditorAuthoringLock, 5, func(contentDB *gorm.DB) error {
		policy, lockErr := loadAchievementDefinitionPolicyFromDB(contentDB, request.AchievementID)
		if lockErr != nil {
			failureLabel = "Achievement definition"
			return lockErr
		}
		if request.ExpectedDefinitionVersion != policy.DefinitionVersion {
			return operationalEditorConflict("The achievement definition changed; reload before editing progress")
		}
		if lockErr := validateAchievementEditorPositiveStatePolicy(policy, "creating character progress"); lockErr != nil {
			return lockErr
		}
		componentSequence, requiredCount, lockErr := loadAchievementEditorComponentRuntimePolicy(
			contentDB, request.AchievementID, request.ComponentType, request.ComponentID,
		)
		if lockErr != nil {
			failureLabel = "Achievement component"
			return lockErr
		}
		if request.CurrentCount > requiredCount {
			return achievementEditorFieldError(
				http.StatusUnprocessableEntity,
				"current_count",
				fmt.Sprintf("Current count cannot exceed the enabled runtime criterion requirement of %d", requiredCount),
				nil,
			)
		}
		payload := characterAchievementEditorAuditPayload(character, request.AchievementID, request.Reason)
		payload["component_type"] = request.ComponentType
		payload["component_id"] = request.ComponentID
		payload["current_count"] = request.CurrentCount
		if expectedCurrentCount != nil {
			payload["expected_current_count"] = strconv.FormatUint(*expectedCurrentCount, 10)
		}
		auditID, lockErr = a.executeCharacterAchievementMutation(c, character, achievementEditorEventProgressSet, payload, func(tx *gorm.DB, _ achievementEditorCharacter) error {
			if err := assertAchievementEditorStoredStateVersions(
				tx, characterID, request.AchievementID, policy.DefinitionVersion,
			); err != nil {
				return err
			}
			var completionCount int64
			if err := tx.Table("character_achievements").Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("character_id = ? AND achievement_id = ?", characterID, request.AchievementID).Count(&completionCount).Error; err != nil {
				return err
			}
			if completionCount > 0 {
				return operationalEditorConflict("Completed achievements cannot receive exact progress; reset the achievement first")
			}
			var current struct {
				CurrentCount      uint64 `gorm:"column:current_count"`
				DefinitionVersion uint32 `gorm:"column:definition_version"`
			}
			row := tx.Table("character_achievement_progress").Clauses(clause.Locking{Strength: "UPDATE"}).
				Select("current_count, definition_version").Where(
				"character_id = ? AND achievement_id = ? AND component_type = ? AND component_id = ?",
				characterID, request.AchievementID, request.ComponentType, request.ComponentID,
			).Take(&current)
			if row.Error != nil && !errors.Is(row.Error, gorm.ErrRecordNotFound) {
				return row.Error
			}
			if row.Error == nil && current.DefinitionVersion != policy.DefinitionVersion {
				return operationalEditorConflict("Stored component progress belongs to definition version %d, not %d", current.DefinitionVersion, policy.DefinitionVersion)
			}
			if err := validateAchievementEditorExpectedCurrentCount(expectedCurrentCount, current.CurrentCount); err != nil {
				return err
			}
			completed := request.CurrentCount >= requiredCount
			return tx.Exec(`INSERT INTO character_achievement_progress
			(character_id, achievement_id, component_type, component_sequence, component_id, current_count, completed, definition_version, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE component_sequence = VALUES(component_sequence), current_count = VALUES(current_count),
			completed = VALUES(completed), definition_version = VALUES(definition_version), updated_at = VALUES(updated_at)`,
				characterID, request.AchievementID, request.ComponentType, componentSequence, request.ComponentID,
				request.CurrentCount, boolToTinyInt(completed), policy.DefinitionVersion, uint64(time.Now().Unix()),
			).Error
		})
		return lockErr
	})
	if err != nil {
		return achievementEditorRespondError(c, failureLabel, err)
	}
	return characterAchievementEditorMutationResponse(c, auditID, characterID)
}

func (a *AchievementEditorController) completeCharacterAchievement(c echo.Context) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievement completion", err)
	}
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorForceCompleteRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The completion request is not valid JSON"})
	}
	character, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).loadCharacter(characterID)
	if err != nil {
		return achievementEditorRespondError(c, "Character", err)
	}
	if err := validateCharacterAchievementMutationBase(request.achievementEditorCharacterMutationBase, character, character.Name); err != nil {
		return achievementEditorRespondError(c, "Character achievement completion", err)
	}
	failureLabel := "Character achievement completion"
	var auditID uint
	err = achievementEditorWithAdvisoryLock(a.contentDB(c), achievementEditorAuthoringLock, 5, func(contentDB *gorm.DB) error {
		policy, lockErr := loadAchievementDefinitionPolicyFromDB(contentDB, request.AchievementID)
		if lockErr != nil {
			failureLabel = "Achievement definition"
			return lockErr
		}
		if request.ExpectedDefinitionVersion != policy.DefinitionVersion {
			return operationalEditorConflict("The achievement definition changed; reload before forcing completion")
		}
		if lockErr := validateAchievementEditorPositiveStatePolicy(policy, "forcing character completion"); lockErr != nil {
			return lockErr
		}
		payload := characterAchievementEditorAuditPayload(character, request.AchievementID, request.Reason)
		payload["definition_version"] = policy.DefinitionVersion
		auditID, lockErr = a.executeCharacterAchievementMutation(c, character, achievementEditorEventForceComplete, payload, func(tx *gorm.DB, _ achievementEditorCharacter) error {
			if err := assertAchievementEditorStoredStateVersions(
				tx, characterID, request.AchievementID, policy.DefinitionVersion,
			); err != nil {
				return err
			}
			result := tx.Table("character_achievements").Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("character_id = ? AND achievement_id = ?", characterID, request.AchievementID).
				Take(&achievementEditorCharacterCompletion{})
			if result.Error == nil {
				return operationalEditorConflict("Achievement %d is already completed for %s", request.AchievementID, character.Name)
			}
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return result.Error
			}
			return tx.Table("character_achievements").Create(map[string]interface{}{
				"character_id": characterID, "achievement_id": request.AchievementID,
				"definition_version": policy.DefinitionVersion, "completed_at": uint64(time.Now().Unix()),
			}).Error
		})
		return lockErr
	})
	if err != nil {
		return achievementEditorRespondError(c, failureLabel, err)
	}
	return characterAchievementEditorMutationResponse(c, auditID, characterID)
}

func (a *AchievementEditorController) resetCharacterAchievement(c echo.Context) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievement reset", err)
	}
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorResetRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The reset request is not valid JSON"})
	}
	character, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).loadCharacter(characterID)
	if err != nil {
		return achievementEditorRespondError(c, "Character", err)
	}
	resetPhrase := fmt.Sprintf("RESET %d", request.AchievementID)
	if request.ClearRewardHistory {
		resetPhrase = fmt.Sprintf("RESET REWARDS %d", request.AchievementID)
	}
	if err := validateCharacterAchievementMutationBase(request.achievementEditorCharacterMutationBase, character, resetPhrase); err != nil {
		return achievementEditorRespondError(c, "Character achievement reset", err)
	}
	if request.ClearRewardHistory && !request.AcknowledgeRegrantRisk {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{
			"error": "Acknowledge that clearing reward ledgers can cause every reward to be granted again",
			"field": "acknowledge_regrant_risk",
		})
	}
	failureLabel := "Character achievement reset"
	var auditID uint
	err = achievementEditorWithAdvisoryLock(a.contentDB(c), achievementEditorAuthoringLock, 5, func(contentDB *gorm.DB) error {
		policy, policyErr := loadAchievementDefinitionPolicyFromDB(contentDB, request.AchievementID)
		if policyErr != nil && !errors.Is(policyErr, gorm.ErrRecordNotFound) {
			failureLabel = "Achievement definition"
			return policyErr
		}
		if policyErr == nil && request.ExpectedDefinitionVersion != policy.DefinitionVersion {
			return operationalEditorConflict("The achievement definition version changed; reload before resetting state")
		}
		payload := characterAchievementEditorAuditPayload(character, request.AchievementID, request.Reason)
		payload["clear_reward_history"] = request.ClearRewardHistory
		payload["definition_present"] = policyErr == nil
		payload["stale_processing_lease_recovery_acknowledged"] = request.AcknowledgeStaleProcessingLease
		auditID, policyErr = a.executeCharacterAchievementMutation(c, character, achievementEditorEventReset, payload, func(tx *gorm.DB, _ achievementEditorCharacter) error {
			processing := make([]achievementEditorCharacterPendingMutation, 0)
			if err := tx.Table("character_achievement_pending_mutations").Clauses(clause.Locking{Strength: "UPDATE"}).
				Select("mutation_id, last_attempt_at").
				Where("character_id = ? AND achievement_id = ? AND status = 2", characterID, request.AchievementID).
				Find(&processing).Error; err != nil {
				return err
			}
			now := uint64(time.Now().Unix())
			for _, mutation := range processing {
				if err := achievementEditorAuthorizeStaleProcessingLeaseRecovery(
					mutation.LastAttemptAt, now, request.AcknowledgeStaleProcessingLease,
				); err != nil {
					return err
				}
			}
			for _, table := range []string{"character_achievement_progress", "character_achievement_pending_mutations", "character_achievements"} {
				if err := tx.Table(table).Where("character_id = ? AND achievement_id = ?", characterID, request.AchievementID).Delete(nil).Error; err != nil {
					return err
				}
			}
			if request.ClearRewardHistory {
				for _, table := range []string{"character_achievement_rewards", "character_achievement_reward_selections"} {
					if err := tx.Table(table).Where("character_id = ? AND achievement_id = ?", characterID, request.AchievementID).Delete(nil).Error; err != nil {
						return err
					}
				}
			}
			return nil
		})
		return policyErr
	})
	if err != nil {
		return achievementEditorRespondError(c, failureLabel, err)
	}
	return characterAchievementEditorMutationResponse(c, auditID, characterID)
}

func (a *AchievementEditorController) retryCharacterReward(c echo.Context) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievement reward", err)
	}
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorRewardRetryRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The reward retry request is not valid JSON"})
	}
	character, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).loadCharacter(characterID)
	if err != nil {
		return achievementEditorRespondError(c, "Character", err)
	}
	if err := validateCharacterAchievementMutationBase(request.achievementEditorCharacterMutationBase, character, "RETRY REWARD "+strings.TrimSpace(request.RewardID)); err != nil {
		return achievementEditorRespondError(c, "Character achievement reward", err)
	}
	if !request.AcknowledgeDuplicateRisk {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Acknowledge the possible duplicate-delivery risk before retrying", "field": "acknowledge_duplicate_risk"})
	}
	rewardID, err := strconv.ParseUint(strings.TrimSpace(request.RewardID), 10, 64)
	if err != nil || rewardID == 0 {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Reward ID must be a positive unsigned 64-bit integer", "field": "reward_id"})
	}
	failureLabel := "Character achievement reward"
	var auditID uint
	err = achievementEditorWithAdvisoryLock(a.contentDB(c), achievementEditorAuthoringLock, 5, func(contentDB *gorm.DB) error {
		policy, lockErr := loadAchievementDefinitionPolicyFromDB(contentDB, request.AchievementID)
		if lockErr != nil {
			failureLabel = "Achievement definition"
			return lockErr
		}
		if request.ExpectedDefinitionVersion != policy.DefinitionVersion {
			return operationalEditorConflict("The achievement definition changed; reload before retrying delivery")
		}
		var enabled int64
		if lockErr := contentDB.Table("achievement_rewards").Where(
			"achievement_id = ? AND reward_id = ? AND enabled = 1", request.AchievementID, rewardID,
		).Count(&enabled).Error; lockErr != nil {
			failureLabel = "Achievement reward"
			return lockErr
		}
		if enabled == 0 {
			return operationalEditorConflict("The canonical reward is missing, disabled, or no longer belongs to this achievement")
		}
		var mappingCount int64
		if lockErr := contentDB.Table("achievement_reward_option_entries").
			Where("reward_id = ?", rewardID).
			Count(&mappingCount).Error; lockErr != nil {
			failureLabel = "Achievement reward mapping"
			return lockErr
		}
		if lockErr := validateAchievementEditorIndividualRewardRetryMapping(mappingCount); lockErr != nil {
			return lockErr
		}
		payload := characterAchievementEditorAuditPayload(character, request.AchievementID, request.Reason)
		payload["reward_id"] = request.RewardID
		payload["expected_status"] = request.ExpectedStatus
		payload["duplicate_delivery_risk_acknowledged"] = true
		auditID, lockErr = a.executeCharacterAchievementMutation(c, character, achievementEditorEventRewardRetry, payload, func(tx *gorm.DB, _ achievementEditorCharacter) error {
			var ledger achievementEditorCharacterRewardLedger
			if err := tx.Table("character_achievement_rewards").Clauses(clause.Locking{Strength: "UPDATE"}).Where(
				"character_id = ? AND achievement_id = ? AND reward_id = ?", characterID, request.AchievementID, rewardID,
			).Take(&ledger).Error; err != nil {
				return err
			}
			if err := validateAchievementEditorRewardRetryLedger(ledger, request.ExpectedStatus); err != nil {
				return err
			}
			return tx.Table("character_achievement_rewards").Where(
				"character_id = ? AND achievement_id = ? AND reward_id = ?", characterID, request.AchievementID, rewardID,
			).Updates(map[string]interface{}{"status": 2, "last_error": "Retry requested from Spire; duplicate-delivery risk acknowledged"}).Error
		})
		return lockErr
	})
	if err != nil {
		return achievementEditorRespondError(c, failureLabel, err)
	}
	return characterAchievementEditorMutationResponse(c, auditID, characterID)
}

func (a *AchievementEditorController) retryCharacterSelection(c echo.Context) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievement reward selection", err)
	}
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorSelectionRetryRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The selection retry request is not valid JSON"})
	}
	character, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).loadCharacter(characterID)
	if err != nil {
		return achievementEditorRespondError(c, "Character", err)
	}
	if err := validateCharacterAchievementMutationBase(request.achievementEditorCharacterMutationBase, character, fmt.Sprintf("RETRY SELECTION %d", request.RewardSetID)); err != nil {
		return achievementEditorRespondError(c, "Character achievement reward selection", err)
	}
	if !request.AcknowledgeDuplicateRisk {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Acknowledge the possible duplicate-delivery risk before retrying", "field": "acknowledge_duplicate_risk"})
	}
	failureLabel := "Character achievement reward selection"
	var auditID uint
	err = achievementEditorWithAdvisoryLock(a.contentDB(c), achievementEditorAuthoringLock, 5, func(contentDB *gorm.DB) error {
		policy, lockErr := loadAchievementDefinitionPolicyFromDB(contentDB, request.AchievementID)
		if lockErr != nil {
			failureLabel = "Achievement definition"
			return lockErr
		}
		if request.ExpectedDefinitionVersion != policy.DefinitionVersion {
			return operationalEditorConflict("The achievement definition changed; reload before retrying selection delivery")
		}
		payload := characterAchievementEditorAuditPayload(character, request.AchievementID, request.Reason)
		payload["reward_set_id"] = request.RewardSetID
		payload["expected_status"] = request.ExpectedStatus
		payload["duplicate_delivery_risk_acknowledged"] = true
		auditID, lockErr = a.executeCharacterAchievementMutation(c, character, achievementEditorEventSelectionRetry, payload, func(tx *gorm.DB, _ achievementEditorCharacter) error {
			var ledger achievementEditorCharacterRewardSelection
			if err := tx.Table("character_achievement_reward_selections").Clauses(clause.Locking{Strength: "UPDATE"}).Where(
				"character_id = ? AND achievement_id = ? AND reward_set_id = ?", characterID, request.AchievementID, request.RewardSetID,
			).Take(&ledger).Error; err != nil {
				return err
			}
			if err := validateAchievementEditorSelectionRetryLedger(ledger, request.ExpectedStatus); err != nil {
				return err
			}
			retryRewardIDs, err := loadAchievementEditorSelectionRetryRewardIDs(
				contentDB, request.AchievementID, request.RewardSetID, ledger.SelectedOptionID,
			)
			if err != nil {
				return err
			}
			if len(retryRewardIDs) > 0 {
				if err := tx.Table("character_achievement_rewards").Where(
					"character_id = ? AND achievement_id = ? AND reward_id IN ? AND status = 0",
					characterID, request.AchievementID, retryRewardIDs,
				).Updates(map[string]interface{}{
					"status":     2,
					"last_error": "Owning selection retry requested from Spire; duplicate-delivery risk acknowledged",
				}).Error; err != nil {
					return err
				}
			}
			return tx.Table("character_achievement_reward_selections").Where(
				"character_id = ? AND achievement_id = ? AND reward_set_id = ?", characterID, request.AchievementID, request.RewardSetID,
			).Updates(map[string]interface{}{
				"status":     2,
				"last_error": "Retry requested from Spire; selected and common in-flight grants were made retryable; duplicate-delivery risk acknowledged",
			}).Error
		})
		return lockErr
	})
	if err != nil {
		return achievementEditorRespondError(c, failureLabel, err)
	}
	return characterAchievementEditorMutationResponse(c, auditID, characterID)
}

func (a *AchievementEditorController) retryCharacterMutation(c echo.Context) error {
	return a.changeCharacterPendingMutation(c, false)
}

func (a *AchievementEditorController) discardCharacterMutation(c echo.Context) error {
	return a.changeCharacterPendingMutation(c, true)
}

func (a *AchievementEditorController) changeCharacterPendingMutation(c echo.Context, discard bool) error {
	if err := a.requireCharacterSchema(c); err != nil {
		return achievementEditorRespondError(c, "Character achievement mutation", err)
	}
	characterID, err := achievementEditorParamID(c, "id", "Character ID")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	request := achievementEditorPendingMutationRequest{}
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "The mutation request is not valid JSON"})
	}
	character, err := newCharacterAchievementEditorService(a.characterDB(c), a.contentDB(c)).loadCharacter(characterID)
	if err != nil {
		return achievementEditorRespondError(c, "Character", err)
	}
	phrase := "RETRY MUTATION " + strings.TrimSpace(request.MutationID)
	event := achievementEditorEventMutationRetry
	action := "retry"
	if discard {
		phrase = "DISCARD MUTATION " + strings.TrimSpace(request.MutationID)
		event = achievementEditorEventMutationDiscard
		action = "discard"
	}
	if err := validateCharacterAchievementPendingMutationRequest(request, character, phrase); err != nil {
		return achievementEditorRespondError(c, "Character achievement mutation", err)
	}
	if strings.ToLower(strings.TrimSpace(request.Action)) != action {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "The mutation action does not match this endpoint", "field": "action"})
	}
	mutationID, err := strconv.ParseUint(strings.TrimSpace(request.MutationID), 10, 64)
	if err != nil || mutationID == 0 {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "Mutation ID must be a positive unsigned 64-bit integer", "field": "mutation_id"})
	}
	payload := map[string]interface{}{
		"action": action, "character_id": characterID, "character_name": character.Name,
		"mutation_id": request.MutationID, "expected_status": request.ExpectedStatus,
		"expected_attempt_count": request.ExpectedAttemptCount, "reason": strings.TrimSpace(request.Reason),
		"stale_processing_lease_recovery_acknowledged": request.AcknowledgeStaleProcessingLease,
	}
	var auditID uint
	execute := func(contentDB *gorm.DB) error {
		var executeErr error
		auditID, executeErr = a.executeCharacterAchievementMutation(c, character, event, payload, func(tx *gorm.DB, _ achievementEditorCharacter) error {
			var mutation achievementEditorCharacterPendingMutation
			if err := tx.Table("character_achievement_pending_mutations").Clauses(clause.Locking{Strength: "UPDATE"}).Where(
				"character_id = ? AND mutation_id = ?", characterID, mutationID,
			).Take(&mutation).Error; err != nil {
				return err
			}
			if mutation.Status != request.ExpectedStatus || mutation.AttemptCount != request.ExpectedAttemptCount {
				return operationalEditorConflict("Queued mutation state changed; reload before continuing")
			}
			if discard {
				switch mutation.Status {
				case 0, 1:
					// Pending and blocked rows are not owned by an active consumer.
				case 2:
					if err := achievementEditorAuthorizeStaleProcessingLeaseRecovery(
						mutation.LastAttemptAt,
						uint64(time.Now().Unix()),
						request.AcknowledgeStaleProcessingLease,
					); err != nil {
						return err
					}
				default:
					return operationalEditorConflict("Unknown queued mutation status %d cannot be discarded", mutation.Status)
				}
				return tx.Table("character_achievement_pending_mutations").Where(
					"character_id = ? AND mutation_id = ?", characterID, mutationID,
				).Delete(nil).Error
			}
			if mutation.Status != 1 {
				return operationalEditorConflict("Only blocked queued mutations can be returned to pending")
			}
			policy, err := loadAchievementDefinitionPolicyFromDB(contentDB, mutation.AchievementID)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return operationalEditorConflict("The referenced achievement definition no longer exists")
				}
				return err
			}
			if err := validateAchievementEditorPositiveStatePolicy(policy, "retrying the queued mutation"); err != nil {
				return err
			}
			if err := validateAchievementEditorPendingMutationRetryVersion(mutation.DefinitionVersion, policy.DefinitionVersion); err != nil {
				return err
			}
			return tx.Table("character_achievement_pending_mutations").Where(
				"character_id = ? AND mutation_id = ?", characterID, mutationID,
			).Updates(map[string]interface{}{"status": 0, "last_error": ""}).Error
		})
		return executeErr
	}
	if discard {
		err = execute(nil)
	} else {
		err = achievementEditorWithAdvisoryLock(a.contentDB(c), achievementEditorAuthoringLock, 5, execute)
	}
	if err != nil {
		return achievementEditorRespondError(c, "Character achievement mutation", err)
	}
	return characterAchievementEditorMutationResponse(c, auditID, characterID)
}

func characterAchievementEditorAuditPayload(
	character achievementEditorCharacter,
	achievementID uint32,
	reason string,
) map[string]interface{} {
	return map[string]interface{}{
		"character_id": character.ID, "character_name": character.Name,
		"achievement_id": achievementID, "reason": strings.TrimSpace(reason),
	}
}

func characterAchievementEditorMutationResponse(c echo.Context, auditID uint, characterID uint32) error {
	// Omitting a partial detail envelope deliberately makes the client reload
	// its current search/filter page after the committed mutation.
	return c.JSON(http.StatusOK, echo.Map{"updated": true, "character_id": characterID, "audit_id": auditID})
}
