package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/EQEmuTools/spire/internal/playersupport"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ---------------------------------------------------------------------------
// Quests and progress: expedition lockouts, instances and tasks. Changes go
// to the database while the character is offline and through the zone API
// (updated patch) while it is in a zone.

type supportLockout struct {
	ID               uint      `json:"id"`
	Expedition       string    `json:"expedition"`
	Event            string    `json:"event"`
	ExpiresAt        time.Time `json:"expires_at"`
	RemainingSeconds int64     `json:"remaining_seconds"`
}

type supportInstance struct {
	InstanceID   uint       `json:"instance_id"`
	ZoneID       uint       `json:"zone_id"`
	ZoneName     string     `json:"zone_name"`
	Version      uint       `json:"version"`
	ExpiresAt    *time.Time `json:"expires_at"`
	NeverExpires bool       `json:"never_expires"`
	DzName       string     `json:"dz_name"`
}

// supportInstanceRow is an instance as read, with its expiry in Unix time.
type supportInstanceRow struct {
	Instance supportInstance `gorm:"embedded"`
	Expires  int64
}

type supportSafeReturn struct {
	ZoneID         uint   `json:"zone_id"`
	ZoneName       string `json:"zone_name"`
	InstanceZoneID uint   `json:"instance_zone_id"`
}

// supportProgressResponse holds the fields the lockouts and tasks reads share.
// local_world tells an "unknown" state on a World that is down from one on a
// World that runs on another host.
func supportProgressResponse(state string, features playersupport.Features, local bool) echo.Map {
	return echo.Map{"state": state, "features": features, "local_world": local}
}

func (p *PlayerSupportController) lockouts(c echo.Context) error {
	scope, view, err := p.toolCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	state, err := p.characterState(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	lockouts := []supportLockout{}
	instances := []supportInstance{}
	var safeReturn *supportSafeReturn
	columns, err := toolColumns(scope.eqemu, "character_expedition_lockouts")
	if err != nil {
		return supportError(c, err)
	}
	if columns["expire_time"] {
		err = scope.eqemu.Table("character_expedition_lockouts").
			Select("id, expedition_name AS expedition, event_name AS event, expire_time AS expires_at, "+
				"TIMESTAMPDIFF(SECOND, NOW(), expire_time) AS remaining_seconds").
			Where("character_id = ? AND expire_time > NOW()", view.CharacterID).
			Order("expire_time, id").Limit(200).Scan(&lockouts).Error
		if err != nil {
			return supportError(c, err)
		}
	}
	instanceColumns, err := toolColumns(scope.eqemu, "instance_list")
	if err != nil {
		return supportError(c, err)
	}
	if instanceColumns["id"] {
		expires := "il.start_time + il.duration"
		if instanceColumns["expire_at"] {
			expires = "il.expire_at"
		}
		dz, err := toolColumns(scope.eqemu, "dynamic_zones")
		if err != nil {
			return supportError(c, err)
		}
		query := scope.eqemu.Table("instance_list_player AS player").
			Joins("JOIN instance_list AS il ON il.id = player.id").
			Where("player.charid = ?", view.CharacterID)
		selects := "il.id AS instance_id, il.zone AS zone_id, il.version, COALESCE(il.never_expires, 0) AS never_expires, " +
			"COALESCE(" + expires + ", 0) AS expires"
		if dz["instance_id"] {
			query = query.Joins("LEFT JOIN dynamic_zones AS dz ON dz.instance_id = il.id")
			selects += ", COALESCE(dz.name, '') AS dz_name"
		} else {
			selects += ", '' AS dz_name"
		}
		var rows []supportInstanceRow
		if err := query.Select(selects).Order("il.id").Limit(100).Scan(&rows).Error; err != nil {
			return supportError(c, err)
		}
		for _, row := range rows {
			instance := row.Instance
			if !instance.NeverExpires && row.Expires > 0 {
				at := time.Unix(row.Expires, 0).UTC()
				instance.ExpiresAt = &at
			}
			instances = append(instances, instance)
		}
	}
	safeColumns, err := toolColumns(scope.eqemu, "character_instance_safereturns")
	if err != nil {
		return supportError(c, err)
	}
	if safeColumns["safe_zone_id"] {
		var rows []supportSafeReturn
		if err := scope.eqemu.Table("character_instance_safereturns").
			Select("safe_zone_id AS zone_id, instance_zone_id").Where("character_id = ?", view.CharacterID).
			Limit(1).Scan(&rows).Error; err != nil {
			return supportError(c, err)
		}
		if len(rows) == 1 && rows[0].ZoneID > 0 {
			safeReturn = &rows[0]
		}
	}
	zoneIDs := []int{}
	for _, instance := range instances {
		zoneIDs = append(zoneIDs, int(instance.ZoneID))
	}
	if safeReturn != nil {
		zoneIDs = append(zoneIDs, int(safeReturn.ZoneID))
	}
	if len(zoneIDs) > 0 {
		zoneDB, err := p.toolContentDB(c, scope, models.Zone{})
		if err != nil {
			return supportError(c, err)
		}
		names, err := loadPlayerOperationsZoneNames(zoneDB, zoneIDs)
		if err != nil {
			return supportError(c, err)
		}
		for i := range instances {
			instances[i].ZoneName = names[int(instances[i].ZoneID)]
		}
		if safeReturn != nil {
			safeReturn.ZoneName = names[int(safeReturn.ZoneID)]
		}
	}
	response := supportProgressResponse(state.State, p.toolFeatures(scope), p.localWorld(scope))
	response["lockouts"], response["instances"], response["safe_return"] = lockouts, instances, safeReturn
	return c.JSON(http.StatusOK, response)
}

type supportLockoutInput struct {
	LockoutID uint   `json:"lockout_id"`
	Reason    string `json:"reason"`
	RequestID string `json:"request_id"`
}

func (p *PlayerSupportController) removeLockout(c echo.Context) error {
	scope, view, err := p.toolCase(c, true)
	if err != nil {
		return supportError(c, err)
	}
	var input supportLockoutInput
	if c.Bind(&input) != nil || input.LockoutID == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid lockout request"))
	}
	var lockout struct {
		ID             uint
		ExpeditionName string
		EventName      string
	}
	err = scope.eqemu.Table("character_expedition_lockouts").Select("id, expedition_name, event_name").
		Where("id = ? AND character_id = ?", input.LockoutID, view.CharacterID).Take(&lockout).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return supportError(c, echo.NewHTTPError(http.StatusNotFound, "That lockout is no longer there"))
	}
	if err != nil {
		return supportError(c, err)
	}
	state, err := p.characterState(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	if state.AccountID == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The petition account is unavailable"))
	}
	name := view.Character
	path := "database"
	if state.State == "in_zone" {
		if !p.localWorld(scope) || !p.toolFeatures(scope).Lockouts {
			return supportError(c, echo.NewHTTPError(http.StatusConflict,
				name+" is in game. Removing a lockout in game needs the updated Player Support patch; ask them to log out first."))
		}
		path = "game"
	} else if err := toolDatabaseRefusal(state.State, name); err != nil {
		return supportError(c, err)
	}
	action := supportAction{
		Kind: "lockout", RequestID: input.RequestID, Reason: input.Reason, Event: "PLAYER_SUPPORT_LOCKOUT",
		Summary: fmt.Sprintf("Removed lockout %s: %s", lockout.ExpeditionName, lockout.EventName),
		Details: map[string]interface{}{
			"lockout_id": lockout.ID, "expedition": lockout.ExpeditionName, "event": lockout.EventName, "path": path,
		},
	}
	removed := "Removed. " + name + " can enter again."
	return p.runSupportAction(c, scope, view, action, func() supportActionResult {
		if path == "game" {
			status := p.world.RemoveLockout(view.CharacterID, state.AccountID, lockout.ExpeditionName, lockout.EventName)
			return supportLockoutResult(status, name)
		}
		var rows int64
		err := scope.eqemu.Transaction(func(tx *gorm.DB) error {
			if err := supportStillOffline(tx, view.CharacterID, state.InGame); err != nil {
				return err
			}
			result := tx.Exec("DELETE FROM character_expedition_lockouts WHERE id = ? AND character_id = ?", lockout.ID, view.CharacterID)
			rows = result.RowsAffected
			return result.Error
		})
		switch {
		case errors.Is(err, errSupportCameOnline):
			return supportCameOnline(name)
		case err != nil:
			return supportActionResult{Delivery: "failed", Message: "The lockout could not be removed from the database."}
		case rows == 0:
			return supportActionResult{Delivery: "sent", Message: "It had already been removed."}
		}
		return supportActionResult{Delivery: "sent", Message: removed}
	})
}

// supportLockoutResult maps the zone's answer to remove_support_lockout.
func supportLockoutResult(status, name string) supportActionResult {
	switch status {
	case "removed":
		return supportActionResult{Delivery: "sent", Message: "Removed. " + name + " can enter again."}
	case "gone":
		return supportActionResult{Delivery: "sent", Message: "It had already been removed."}
	case "offline":
		return supportActionResult{Delivery: "failed", Message: name + " left the game. Try again."}
	default:
		return supportActionResult{Delivery: "failed", Message: "The game server did not confirm the change."}
	}
}

// ---------------------------------------------------------------------------
// Tasks

type supportTaskReward struct {
	Text   string            `json:"text"`
	Copper int64             `json:"copper"`
	Exp    int64             `json:"exp"`
	Points int64             `json:"points"`
	Items  []supportTaskItem `json:"items"`
}

type supportTaskItem struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type supportTaskActivity struct {
	ActivityID  int    `json:"activity_id"`
	Step        int    `json:"step"`
	Description string `json:"description"`
	Goal        int    `json:"goal"`
	Done        int    `json:"done"`
	Completed   bool   `json:"completed"`
	Optional    bool   `json:"optional"`
}

type supportTask struct {
	TaskID     uint                  `json:"task_id"`
	Title      string                `json:"title"`
	Type       string                `json:"type"`
	AcceptedAt *time.Time            `json:"accepted_at"`
	ExpiresAt  *time.Time            `json:"expires_at"`
	Reward     supportTaskReward     `json:"reward"`
	Activities []supportTaskActivity `json:"activities"`
}

type supportCompletedTask struct {
	TaskID      uint       `json:"task_id"`
	Title       string     `json:"title"`
	CompletedAt *time.Time `json:"completed_at"`
}

type supportTaskTimer struct {
	ID        uint      `json:"id"`
	TaskID    uint      `json:"task_id"`
	Title     string    `json:"title"`
	Kind      string    `json:"kind"`
	ExpiresAt time.Time `json:"expires_at"`
}

// supportTaskType names EQEmu's TaskType.
func supportTaskType(value int) string {
	switch value {
	case 0:
		return "task"
	case 1:
		return "shared"
	default:
		return "quest"
	}
}

// supportRewardItemIDs reads a task's reward_id_list: pipe-separated
// entries of an item ID, optionally followed by ",<charges>".
func supportRewardItemIDs(list string) []uint {
	ids := []uint{}
	for _, part := range strings.Split(list, "|") {
		part, _, _ = strings.Cut(part, ",")
		id, err := strconv.ParseUint(strings.TrimSpace(part), 10, 32)
		if err == nil && id > 0 {
			ids = append(ids, uint(id))
		}
	}
	return ids
}

func supportUnix(value int64) *time.Time {
	if value <= 0 {
		return nil
	}
	at := time.Unix(value, 0).UTC()
	return &at
}

type supportTaskContent struct {
	ID           uint
	Type         int
	Duration     int64
	Title        string
	RewardText   string
	RewardIDList string
	CashReward   int64
	ExpReward    int64
	RewardPoints int64
	RewardMethod int
}

// rewardItemIDs are the items the zone grants; a quest reward method leaves
// rewards to the quest script.
func (t supportTaskContent) rewardItemIDs() []uint {
	if t.RewardMethod == 2 {
		return nil
	}
	return supportRewardItemIDs(t.RewardIDList)
}

type supportActivityContent struct {
	Taskid              uint
	Activityid          int
	Step                int
	TargetName          string
	Goalcount           int
	DescriptionOverride string
	Optional            int
}

func (a supportActivityContent) description() string {
	switch {
	case strings.TrimSpace(a.DescriptionOverride) != "":
		return a.DescriptionOverride
	case strings.TrimSpace(a.TargetName) != "":
		return a.TargetName
	}
	return fmt.Sprintf("Step %d", a.Activityid+1)
}

// supportTaskContents reads task definitions and their activities from the
// content database.
func supportTaskContents(db *gorm.DB, ids []uint) (map[uint]supportTaskContent, map[uint][]supportActivityContent, error) {
	tasks := map[uint]supportTaskContent{}
	activities := map[uint][]supportActivityContent{}
	if len(ids) == 0 {
		return tasks, activities, nil
	}
	var taskRows []supportTaskContent
	if err := db.Table("tasks").Select("id, type, COALESCE(duration, 0) AS duration, COALESCE(title, '') AS title, "+
		"COALESCE(reward_text, '') AS reward_text, COALESCE(reward_id_list, '') AS reward_id_list, "+
		"COALESCE(cash_reward, 0) AS cash_reward, COALESCE(exp_reward, 0) AS exp_reward, COALESCE(reward_points, 0) AS reward_points, COALESCE(reward_method, 0) AS reward_method").
		Where("id IN ?", ids).Scan(&taskRows).Error; err != nil {
		return nil, nil, err
	}
	for _, task := range taskRows {
		tasks[task.ID] = task
	}
	var activityRows []supportActivityContent
	if err := db.Table("task_activities").Select("taskid, activityid, COALESCE(step, 0) AS step, COALESCE(target_name, '') AS target_name, "+
		"COALESCE(goalcount, 0) AS goalcount, COALESCE(description_override, '') AS description_override, COALESCE(optional, 0) AS optional").
		Where("taskid IN ?", ids).Order("taskid, activityid").Scan(&activityRows).Error; err != nil {
		return nil, nil, err
	}
	for _, activity := range activityRows {
		activities[activity.Taskid] = append(activities[activity.Taskid], activity)
	}
	return tasks, activities, nil
}

func supportTaskTitle(tasks map[uint]supportTaskContent, id uint) string {
	if title := strings.TrimSpace(tasks[id].Title); title != "" {
		return title
	}
	return fmt.Sprintf("Task #%d", id)
}

func (p *PlayerSupportController) tasks(c echo.Context) error {
	scope, view, err := p.toolCase(c, false)
	if err != nil {
		return supportError(c, err)
	}
	state, err := p.characterState(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	response := supportProgressResponse(state.State, p.toolFeatures(scope), p.localWorld(scope))
	response["tasks"], response["completed"], response["timers"] = []supportTask{}, []supportCompletedTask{}, []supportTaskTimer{}
	columns, err := toolColumns(scope.eqemu, "character_tasks")
	if err != nil {
		return supportError(c, err)
	}
	if !columns["taskid"] {
		return c.JSON(http.StatusOK, response)
	}
	var active []struct {
		Taskid       uint
		Type         int
		Acceptedtime int64
	}
	if err := scope.eqemu.Table("character_tasks").Select("taskid, type, COALESCE(acceptedtime, 0) AS acceptedtime").
		Where("charid = ?", view.CharacterID).Order("slot, taskid").Scan(&active).Error; err != nil {
		return supportError(c, err)
	}
	var progress []struct {
		Taskid     uint
		Activityid int
		Donecount  int
		Completed  int
	}
	if err := scope.eqemu.Table("character_activities").Select("taskid, activityid, donecount, completed").
		Where("charid = ?", view.CharacterID).Scan(&progress).Error; err != nil {
		return supportError(c, err)
	}
	var completed []struct {
		Taskid        uint
		Completedtime int64
	}
	if err := scope.eqemu.Table("completed_tasks").Select("taskid, MAX(completedtime) AS completedtime").
		Where("charid = ? AND activityid = -1", view.CharacterID).Group("taskid").
		Order("completedtime DESC").Limit(50).Scan(&completed).Error; err != nil {
		return supportError(c, err)
	}
	var timers []struct {
		ID         uint
		TaskID     uint
		TimerType  int
		ExpireTime time.Time
	}
	timerColumns, err := toolColumns(scope.eqemu, "character_task_timers")
	if err != nil {
		return supportError(c, err)
	}
	if timerColumns["expire_time"] {
		if err := scope.eqemu.Table("character_task_timers").Select("id, task_id, timer_type, expire_time").
			Where("character_id = ? AND expire_time > NOW()", view.CharacterID).Order("expire_time, id").Limit(100).
			Scan(&timers).Error; err != nil {
			return supportError(c, err)
		}
	}
	ids := []uint{}
	for _, task := range active {
		ids = append(ids, task.Taskid)
	}
	for _, task := range completed {
		ids = append(ids, task.Taskid)
	}
	for _, timer := range timers {
		ids = append(ids, timer.TaskID)
	}
	contentDB, err := p.toolContentDB(c, scope, models.Task{})
	if err != nil {
		return supportError(c, err)
	}
	contents, activities, err := supportTaskContents(contentDB, ids)
	if err != nil {
		return supportError(c, err)
	}
	rewardIDs := map[uint]bool{}
	for _, task := range active {
		for _, id := range contents[task.Taskid].rewardItemIDs() {
			rewardIDs[id] = true
		}
	}
	rewardItems := map[uint]*mailParcelsItemReference{}
	if len(rewardIDs) > 0 {
		itemDB, err := p.toolContentDB(c, scope, models.Item{})
		if err != nil {
			return supportError(c, err)
		}
		if rewardItems, err = supportItemReferences(itemDB, rewardIDs); err != nil {
			return supportError(c, err)
		}
	}
	type progressKey struct {
		task     uint
		activity int
	}
	done := map[progressKey][2]int{}
	for _, row := range progress {
		done[progressKey{row.Taskid, row.Activityid}] = [2]int{row.Donecount, row.Completed}
	}
	tasks := []supportTask{}
	for _, row := range active {
		content := contents[row.Taskid]
		task := supportTask{
			TaskID: row.Taskid, Title: supportTaskTitle(contents, row.Taskid), Type: supportTaskType(row.Type),
			AcceptedAt: supportUnix(row.Acceptedtime), Activities: []supportTaskActivity{},
			Reward: supportTaskReward{Text: content.RewardText, Copper: content.CashReward, Exp: content.ExpReward,
				Points: content.RewardPoints, Items: []supportTaskItem{}},
		}
		if content.Duration > 0 && row.Acceptedtime > 0 {
			task.ExpiresAt = supportUnix(row.Acceptedtime + content.Duration)
		}
		for _, id := range content.rewardItemIDs() {
			if item := rewardItems[id]; item != nil {
				task.Reward.Items = append(task.Reward.Items, supportTaskItem{ID: id, Name: item.Name})
			}
		}
		for _, activity := range activities[row.Taskid] {
			state := done[progressKey{row.Taskid, activity.Activityid}]
			task.Activities = append(task.Activities, supportTaskActivity{
				ActivityID: activity.Activityid, Step: activity.Step, Description: activity.description(),
				Goal: activity.Goalcount, Done: state[0], Completed: state[1] != 0, Optional: activity.Optional != 0,
			})
		}
		tasks = append(tasks, task)
	}
	completedTasks := []supportCompletedTask{}
	for _, row := range completed {
		completedTasks = append(completedTasks, supportCompletedTask{
			TaskID: row.Taskid, Title: supportTaskTitle(contents, row.Taskid), CompletedAt: supportUnix(row.Completedtime),
		})
	}
	taskTimers := []supportTaskTimer{}
	for _, row := range timers {
		taskTimers = append(taskTimers, supportTaskTimer{
			ID: row.ID, TaskID: row.TaskID, Title: supportTaskTitle(contents, row.TaskID),
			Kind: supportTimerKind(row.TimerType), ExpiresAt: row.ExpireTime,
		})
	}
	response["tasks"], response["completed"], response["timers"] = tasks, completedTasks, taskTimers
	return c.JSON(http.StatusOK, response)
}

// supportTimerKind names EQEmu's TaskTimerType.
func supportTimerKind(value int) string {
	if value == 1 {
		return "request"
	}
	return "replay"
}

type supportTaskInput struct {
	Action       string `json:"action"`
	TaskID       uint   `json:"task_id"`
	ActivityID   int    `json:"activity_id"`
	Count        int    `json:"count"`
	TimerID      uint   `json:"timer_id"`
	ExpectedDone int    `json:"expected_done"`
	Reason       string `json:"reason"`
	RequestID    string `json:"request_id"`
}

// supportTaskTarget is what the database says about the task an action
// names.
type supportTaskTarget struct {
	Active   bool
	Shared   bool
	Title    string
	Activity *supportActivityContent
}

// supportTaskPlan checks a task action against the character's state and
// returns "game" or "database", or the refusal. patch reports
// features.Tasks on the local World.
func supportTaskPlan(input supportTaskInput, target supportTaskTarget, state string, patch bool, name string) (string, error) {
	bad := echo.NewHTTPError(http.StatusBadRequest, "Invalid task request")
	switch input.Action {
	case "clear_completed", "clear_timer":
		if input.TaskID == 0 && input.Action == "clear_completed" || input.TimerID == 0 && input.Action == "clear_timer" {
			return "", bad
		}
		if state == "in_zone" {
			if input.Action == "clear_completed" {
				return "", echo.NewHTTPError(http.StatusConflict, "Clear completed records while "+name+" is offline.")
			}
			return "", echo.NewHTTPError(http.StatusConflict, "Clear timers while "+name+" is offline.")
		}
		if err := toolDatabaseRefusal(state, name); err != nil {
			return "", err
		}
		return "database", nil
	case "reset_activity", "update_activity", "remove_task":
	default:
		return "", echo.NewHTTPError(http.StatusBadRequest, "Unknown task action")
	}
	if input.TaskID == 0 {
		return "", bad
	}
	if !target.Active {
		return "", echo.NewHTTPError(http.StatusNotFound, "That task is no longer active")
	}
	if target.Shared {
		return "", echo.NewHTTPError(http.StatusConflict, "Shared tasks are managed by the shared task system. Use #task in game.")
	}
	if input.Action != "remove_task" {
		if target.Activity == nil || input.ExpectedDone < 0 {
			return "", bad
		}
		if input.Action == "update_activity" && (input.Count < 1 || input.Count > max(target.Activity.Goalcount, 1) || input.Count > 1000) {
			return "", bad
		}
	}
	switch state {
	case "in_zone":
		if !patch {
			return "", echo.NewHTTPError(http.StatusConflict,
				name+" is in game. Changing tasks in game needs the updated Player Support patch; ask them to log out first.")
		}
		return "game", nil
	case "offline":
		if input.Action == "update_activity" && input.ExpectedDone+input.Count >= target.Activity.Goalcount {
			return "", echo.NewHTTPError(http.StatusConflict,
				"Completing a step offline would skip its reward. Do it while "+name+" is in game.")
		}
		return "database", nil
	}
	return "", toolDatabaseRefusal(state, name)
}

func (p *PlayerSupportController) updateTask(c echo.Context) error {
	scope, view, err := p.toolCase(c, true)
	if err != nil {
		return supportError(c, err)
	}
	var input supportTaskInput
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid task request"))
	}
	target, timerKind, err := p.supportTaskTarget(c, scope, view, input)
	if err != nil {
		return supportError(c, err)
	}
	state, err := p.characterState(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	if state.AccountID == 0 {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "The petition account is unavailable"))
	}
	name := view.Character
	patch := p.localWorld(scope) && p.toolFeatures(scope).Tasks
	path, err := supportTaskPlan(input, target, state.State, patch, name)
	if err != nil {
		return supportError(c, err)
	}
	step, goal := 0, 0
	if target.Activity != nil {
		step, goal = input.ActivityID+1, target.Activity.Goalcount
	}
	var summary string
	switch input.Action {
	case "reset_activity":
		summary = fmt.Sprintf("Reset step %d of %s", step, target.Title)
	case "update_activity":
		summary = fmt.Sprintf("Added %d to step %d of %s", input.Count, step, target.Title)
	case "remove_task":
		summary = "Removed task " + target.Title
	case "clear_completed":
		summary = "Cleared the completed record of " + target.Title
	case "clear_timer":
		summary = fmt.Sprintf("Cleared the %s timer of %s", timerKind, target.Title)
	}
	details := map[string]interface{}{"action": input.Action, "task_id": input.TaskID, "path": path}
	switch input.Action {
	case "reset_activity", "update_activity":
		details["activity_id"], details["expected_done"] = input.ActivityID, input.ExpectedDone
		if input.Action == "update_activity" {
			details["count"] = input.Count
		}
	case "clear_timer":
		details["timer_id"] = input.TimerID
	}
	action := supportAction{
		Kind: "task", RequestID: input.RequestID, Reason: input.Reason, Event: "PLAYER_SUPPORT_TASK",
		Summary: summary, Details: details,
	}
	return p.runSupportAction(c, scope, view, action, func() supportActionResult {
		if path == "game" {
			update := playersupport.TaskUpdate{
				CharacterID: view.CharacterID, AccountID: state.AccountID, TaskID: input.TaskID, Action: input.Action, ActivityID: -1,
			}
			if input.Action != "remove_task" {
				update.ActivityID, update.ExpectedDone = input.ActivityID, input.ExpectedDone
			}
			if input.Action == "update_activity" {
				update.Count = input.Count
			}
			return supportTaskGameResult(p.world.UpdateTask(update), input.Action, goal, name)
		}
		return supportTaskDatabase(scope.eqemu, view.CharacterID, state.InGame, input, goal, name)
	})
}

// supportTaskTarget loads what an action names, scoped to the case's
// character: the active task and step, or the timer.
func (p *PlayerSupportController) supportTaskTarget(c echo.Context, scope supportScope, view supportCaseView, input supportTaskInput) (supportTaskTarget, string, error) {
	var target supportTaskTarget
	timerKind := ""
	taskID := input.TaskID
	if input.Action == "clear_timer" && input.TimerID > 0 {
		var timer struct {
			TaskID    uint
			TimerType int
		}
		err := scope.eqemu.Table("character_task_timers").Select("task_id, timer_type").
			Where("id = ? AND character_id = ?", input.TimerID, view.CharacterID).Take(&timer).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return target, "", echo.NewHTTPError(http.StatusNotFound, "That timer is no longer there")
		}
		if err != nil {
			return target, "", err
		}
		taskID, timerKind = timer.TaskID, supportTimerKind(timer.TimerType)
	}
	if taskID == 0 {
		return target, timerKind, nil
	}
	var rows []struct{ Type int }
	if err := scope.eqemu.Table("character_tasks").Select("type").
		Where("charid = ? AND taskid = ?", view.CharacterID, taskID).Limit(1).Scan(&rows).Error; err != nil {
		return target, "", err
	}
	if len(rows) == 1 {
		target.Active, target.Shared = true, rows[0].Type == 1
	}
	contentDB, err := p.toolContentDB(c, scope, models.Task{})
	if err != nil {
		return target, "", err
	}
	contents, activities, err := supportTaskContents(contentDB, []uint{taskID})
	if err != nil {
		return target, "", err
	}
	if contents[taskID].Type == 1 {
		target.Shared = true
	}
	target.Title = supportTaskTitle(contents, taskID)
	for i := range activities[taskID] {
		if activities[taskID][i].Activityid == input.ActivityID {
			target.Activity = &activities[taskID][i]
		}
	}
	return target, timerKind, nil
}

// supportTaskGameResult maps the zone's answer to update_support_task.
func supportTaskGameResult(result playersupport.TaskResult, action string, goal int, name string) supportActionResult {
	switch result.Status {
	case "updated":
		data := map[string]interface{}{
			"done_count": result.DoneCount, "task_active": result.TaskActive, "task_completed": result.TaskCompleted,
		}
		switch {
		case action == "update_activity" && result.TaskCompleted:
			return supportActionResult{Delivery: "sent", Message: "The task is complete and its reward was granted.", Data: data}
		case action == "remove_task":
			return supportActionResult{Delivery: "sent", Message: "The task was removed.", Data: data}
		}
		return supportActionResult{Delivery: "sent", Message: fmt.Sprintf("Done (%d/%d).", result.DoneCount, goal), Data: data}
	case "stale":
		return supportActionResult{Delivery: "failed", Message: "The task changed in game. Refresh and try again."}
	case "gone":
		return supportActionResult{Delivery: "failed", Message: "The task is no longer active."}
	case "inactive":
		return supportActionResult{Delivery: "failed", Message: "That step is not active yet."}
	case "offline":
		return supportActionResult{Delivery: "failed", Message: name + " left the game. Try again."}
	default:
		return supportActionResult{Delivery: "failed", Message: "The game server did not confirm the change."}
	}
}

// supportTaskDatabase applies a task action to an offline character. Every
// statement repeats the character, and activity changes require the done
// count the GM saw.
func supportTaskDatabase(db *gorm.DB, characterID uint, wasInGame bool, input supportTaskInput, goal int, name string) supportActionResult {
	changed := supportActionResult{Delivery: "failed", Message: "The task changed. Refresh and try again."}
	var rows int64
	var done int
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := supportStillOffline(tx, characterID, wasInGame); err != nil {
			return err
		}
		switch input.Action {
		case "reset_activity", "update_activity":
			var active int64
			if err := tx.Table("character_tasks").Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("charid = ? AND taskid = ? AND type <> 1", characterID, input.TaskID).Count(&active).Error; err != nil || active == 0 {
				return err
			}
			if input.Action == "reset_activity" {
				result := tx.Exec("UPDATE character_activities SET donecount = 0, completed = 0 WHERE charid = ? AND taskid = ? AND activityid = ? AND donecount = ?",
					characterID, input.TaskID, input.ActivityID, input.ExpectedDone)
				rows, done = result.RowsAffected, 0
				return result.Error
			}
			result := tx.Exec("UPDATE character_activities SET donecount = donecount + ? WHERE charid = ? AND taskid = ? AND activityid = ? AND donecount = ? AND donecount + ? < ?",
				input.Count, characterID, input.TaskID, input.ActivityID, input.ExpectedDone, input.Count, goal)
			if result.Error == nil && result.RowsAffected == 0 && input.ExpectedDone == 0 {
				// A step without progress may have no row yet.
				result = tx.Exec("INSERT IGNORE INTO character_activities (charid, taskid, activityid, donecount, completed) VALUES (?, ?, ?, ?, 0)",
					characterID, input.TaskID, input.ActivityID, input.Count)
			}
			rows, done = result.RowsAffected, input.ExpectedDone+input.Count
			return result.Error
		case "remove_task":
			result := tx.Exec("DELETE FROM character_tasks WHERE charid = ? AND taskid = ? AND type <> 1", characterID, input.TaskID)
			if result.Error != nil || result.RowsAffected == 0 {
				return result.Error
			}
			rows = result.RowsAffected
			return tx.Exec("DELETE FROM character_activities WHERE charid = ? AND taskid = ?", characterID, input.TaskID).Error
		case "clear_completed":
			result := tx.Exec("DELETE FROM completed_tasks WHERE charid = ? AND taskid = ?", characterID, input.TaskID)
			rows = result.RowsAffected
			return result.Error
		case "clear_timer":
			result := tx.Exec("DELETE FROM character_task_timers WHERE id = ? AND character_id = ?", input.TimerID, characterID)
			rows = result.RowsAffected
			return result.Error
		}
		return nil
	})
	if errors.Is(err, errSupportCameOnline) {
		return supportCameOnline(name)
	}
	if err != nil {
		return supportActionResult{Delivery: "failed", Message: "The task could not be changed in the database."}
	}
	if rows == 0 {
		return changed
	}
	switch input.Action {
	case "remove_task":
		return supportActionResult{Delivery: "sent", Message: "The task was removed."}
	case "clear_completed":
		return supportActionResult{Delivery: "sent", Message: "The completed record was cleared."}
	case "clear_timer":
		return supportActionResult{Delivery: "sent", Message: "The timer was cleared."}
	}
	return supportActionResult{Delivery: "sent", Message: fmt.Sprintf("Done (%d/%d).", done, goal),
		Data: map[string]interface{}{"done_count": done}}
}

// errSupportCameOnline: the character entered the game after Spire found it
// offline.
var errSupportCameOnline = errors.New("character came online")

// supportStillOffline locks the character row and confirms the character has
// not entered the game since the action was checked. A zone loads lockouts
// and tasks when the character enters and writes its own copy back, so a
// database edit racing a login would be lost or half applied. wasInGame is
// the flag characterState saw: a flag left set by a crash, on a character
// the World roster shows offline, cannot tell a new login apart and does not
// block the edit.
func supportStillOffline(tx *gorm.DB, characterID uint, wasInGame bool) error {
	var row supportIngameRow
	if err := tx.Table("character_data").Clauses(clause.Locking{Strength: "UPDATE"}).Select("COALESCE(ingame, 0) AS ingame").
		Where("id = ?", characterID).Take(&row).Error; err != nil {
		return err
	}
	if row.InGame != 0 && !wasInGame {
		return errSupportCameOnline
	}
	return nil
}

type supportIngameRow struct {
	InGame int `gorm:"column:ingame"`
}

func supportCameOnline(name string) supportActionResult {
	return supportActionResult{Delivery: "failed", Message: name + " entered the game. Nothing was changed; refresh and try again."}
}
