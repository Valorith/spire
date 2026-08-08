package controllers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

const achievementEditorAuthoringLock = "eqemu_achievement_authoring"

// achievementEditorWithAdvisoryLock pins one MySQL connection for the entire
// lock/work/release sequence. Character-state operations use it to keep a
// stable content-policy view while a transaction runs on the character DB.
func achievementEditorWithAdvisoryLock(
	db *gorm.DB,
	lockName string,
	timeoutSeconds int,
	work func(*gorm.DB) error,
) error {
	return db.Connection(func(connection *gorm.DB) (err error) {
		var lock struct {
			Acquired *int `gorm:"column:acquired"`
		}
		if err := connection.Raw("SELECT GET_LOCK(?, ?) AS acquired", lockName, timeoutSeconds).Scan(&lock).Error; err != nil {
			return err
		}
		if lock.Acquired == nil || *lock.Acquired != 1 {
			return operationalEditorConflict("Another achievement mutation is active; retry after it completes")
		}
		defer func() {
			var release struct {
				Released *int `gorm:"column:released"`
			}
			releaseErr := connection.Raw("SELECT RELEASE_LOCK(?) AS released", lockName).Scan(&release).Error
			if releaseErr == nil && (release.Released == nil || *release.Released != 1) {
				releaseErr = fmt.Errorf("achievement advisory lock %q was not released by its owner", lockName)
			}
			if releaseErr != nil {
				connection.Logger.Error(
					context.Background(),
					"HIGH SEVERITY: achievement advisory unlock failed after work completed; preserving the mutation outcome to prevent an unsafe retry: %v",
					releaseErr,
				)
			}
			err = achievementEditorAdvisoryMutationOutcome(err, releaseErr)
		}()

		err = work(connection)
		return err
	})
}

// achievementEditorAdvisoryMutationOutcome deliberately treats the committed
// mutation (or its original failure) as authoritative. Reporting an unlock
// failure to the API after commit makes clients retry a change that already
// happened and can duplicate durable delivery or authoring mutations.
func achievementEditorAdvisoryMutationOutcome(mutationErr, _ error) error {
	return mutationErr
}

// achievementEditorWithAdvisoryTransaction holds the shared authoring lock
// through transaction commit before releasing it.
func achievementEditorWithAdvisoryTransaction(
	db *gorm.DB,
	lockName string,
	timeoutSeconds int,
	mutation func(*gorm.DB) error,
) error {
	return achievementEditorWithAdvisoryLock(db, lockName, timeoutSeconds, func(connection *gorm.DB) error {
		return connection.Transaction(mutation)
	})
}

func achievementEditorDefinitionRevision(graph achievementEditorGraph) (string, error) {
	payload, err := json.Marshal(graph)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(payload)
	return hex.EncodeToString(digest[:]), nil
}

func achievementEditorCategoryRevision(category achievementEditorCategory) (string, error) {
	// Counts and tree depth are derived presentation data and must not make an
	// otherwise unchanged category appear stale.
	category.AssociationCount = 0
	category.ChildrenCount = 0
	category.Depth = 0
	payload, err := json.Marshal(category)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(payload)
	return hex.EncodeToString(digest[:]), nil
}

func achievementEditorRequireRevision(expected string, actual string, label string) error {
	expected = strings.TrimSpace(expected)
	if expected == "" {
		return achievementEditorFieldError(409, "expected_revision", label+" revision is required; reload before saving", nil)
	}
	if expected != actual {
		return operationalEditorConflict("%s changed on the server; reload before continuing", label)
	}
	return nil
}

type achievementEditorValidationFailure struct {
	result achievementEditorValidationResult
}

func (e achievementEditorValidationFailure) Error() string {
	return "the achievement graph did not pass authoritative validation"
}

func achievementEditorRuntimePolicyRevision(graph achievementEditorGraph) (string, error) {
	type runtimeCriterion struct {
		ComponentType uint8  `json:"component_type"`
		ComponentID   uint32 `json:"component_id"`
		EventType     uint8  `json:"event_type"`
		ProgressMode  uint8  `json:"progress_mode"`
		Behavior      uint8  `json:"behavior"`
		TargetID      uint32 `json:"target_id"`
		TargetID2     uint32 `json:"target_id2"`
		TargetValue   string `json:"target_value"`
		RequiredCount uint32 `json:"required_count"`
	}
	type runtimeComponent struct {
		ComponentType uint8              `json:"component_type"`
		ComponentID   uint32             `json:"component_id"`
		Criteria      []runtimeCriterion `json:"criteria"`
	}
	type runtimeReward struct {
		RewardID     string `json:"reward_id"`
		RewardType   uint8  `json:"reward_type"`
		RewardDataID uint32 `json:"reward_data_id"`
		Amount       string `json:"amount"`
	}
	type runtimeRewardOption struct {
		OptionID    uint32 `json:"option_id"`
		CommonToAll bool   `json:"common_to_all"`
		Flags       uint8  `json:"flags"`
		Enabled     bool   `json:"enabled"`
	}
	type runtimeRewardMapping struct {
		OptionID uint32 `json:"option_id"`
		RewardID string `json:"reward_id"`
	}
	type runtimeRewardSet struct {
		RewardSetID uint32                 `json:"reward_set_id"`
		Options     []runtimeRewardOption  `json:"options"`
		Mappings    []runtimeRewardMapping `json:"mappings"`
	}
	type runtimePolicy struct {
		ResetOnVersionChange bool                   `json:"reset_on_version_change"`
		Components           []runtimeComponent     `json:"components"`
		Rewards              []runtimeReward        `json:"rewards"`
		MappedRewards        []runtimeRewardMapping `json:"mapped_rewards"`
		RewardSet            *runtimeRewardSet      `json:"reward_set"`
	}

	policy := runtimePolicy{
		ResetOnVersionChange: graph.ResetOnVersionChange,
		Components:           make([]runtimeComponent, 0, len(graph.Components)),
		Rewards:              make([]runtimeReward, 0, len(graph.Rewards)),
		MappedRewards:        make([]runtimeRewardMapping, 0),
	}
	enabledRewardIDs := make(map[string]bool)
	for index, reward := range graph.Rewards {
		if !reward.Enabled {
			continue
		}
		enabledRewardIDs[reward.RewardID] = true
		enabledRewardIDs[fmt.Sprintf("@%d", index)] = true
		policy.Rewards = append(policy.Rewards, runtimeReward{
			RewardID:     reward.RewardID,
			RewardType:   reward.RewardType,
			RewardDataID: reward.RewardDataID,
			Amount:       reward.Amount,
		})
	}
	if graph.RewardSet != nil {
		for _, mapping := range graph.RewardSet.Mappings {
			if !enabledRewardIDs[mapping.RewardID] {
				continue
			}
			policy.MappedRewards = append(policy.MappedRewards, runtimeRewardMapping{
				OptionID: mapping.OptionID,
				RewardID: mapping.RewardID,
			})
		}
	}
	if graph.RewardSet != nil && graph.RewardSet.Enabled {
		policy.RewardSet = &runtimeRewardSet{
			RewardSetID: graph.RewardSet.RewardSetID,
			Options:     make([]runtimeRewardOption, 0, len(graph.RewardSet.Options)),
			Mappings:    make([]runtimeRewardMapping, 0, len(graph.RewardSet.Mappings)),
		}
		enabledOptionIDs := make(map[uint32]bool)
		for _, option := range graph.RewardSet.Options {
			if !option.Enabled {
				continue
			}
			enabledOptionIDs[option.OptionID] = true
			policy.RewardSet.Options = append(policy.RewardSet.Options, runtimeRewardOption{
				OptionID:    option.OptionID,
				CommonToAll: option.CommonToAll,
				Flags:       option.Flags,
			})
		}
		for _, mapping := range graph.RewardSet.Mappings {
			if !enabledOptionIDs[mapping.OptionID] || !enabledRewardIDs[mapping.RewardID] {
				continue
			}
			policy.RewardSet.Mappings = append(policy.RewardSet.Mappings, runtimeRewardMapping{
				OptionID: mapping.OptionID,
				RewardID: mapping.RewardID,
			})
		}
	}
	for _, component := range graph.Components {
		// Criteria without an owning component are inert in the runtime snapshot.
		// Only an explicit restore makes them effective and therefore subject to
		// the definition-version policy gate. Explicit deletion is cleanup of
		// already-inert rows and does not reinterpret durable character state.
		if component.RecoveryOnly && component.RecoveryAction != achievementEditorRecoveryActionRestore {
			continue
		}
		if component.ComponentType > 2 {
			continue
		}
		runtimeComponentRow := runtimeComponent{
			ComponentType: component.ComponentType,
			ComponentID:   component.ComponentID,
			Criteria:      make([]runtimeCriterion, 0, len(component.Criteria)),
		}
		for _, criterion := range component.Criteria {
			if !criterion.Enabled {
				continue
			}
			runtimeComponentRow.Criteria = append(runtimeComponentRow.Criteria, runtimeCriterion{
				ComponentType: component.ComponentType,
				ComponentID:   component.ComponentID,
				EventType:     criterion.EventType,
				ProgressMode:  criterion.ProgressMode,
				Behavior:      criterion.Behavior,
				TargetID:      criterion.TargetID,
				TargetID2:     criterion.TargetID2,
				TargetValue:   criterion.TargetValue,
				RequiredCount: criterion.RequiredCount,
			})
		}
		if len(runtimeComponentRow.Criteria) > 0 {
			policy.Components = append(policy.Components, runtimeComponentRow)
		}
	}
	payload, err := json.Marshal(policy)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(payload)
	return hex.EncodeToString(digest[:]), nil
}
