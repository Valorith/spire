package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/EQEmuTools/spire/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func clauseLockForUpdate() clause.Locking { return clause.Locking{Strength: "UPDATE"} }

// ---------------------------------------------------------------------------
// Account history: the account's other cases, newest first.

type supportHistoryCase struct {
	Key         string `json:"key"`
	Character   string `json:"character"`
	Status      string `json:"status"`
	Message     string `json:"message"`
	SubmittedAt int64  `json:"submitted_at"`
	Merged      bool   `json:"merged"`
	Resolution  string `json:"resolution,omitempty"`
	NativeOpen  bool   `json:"native_open"`
}

func (s supportScope) accountHistory(view supportCaseView) ([]supportHistoryCase, error) {
	history := []supportHistoryCase{}
	if view.Account == "" {
		return history, nil
	}
	var records []models.PlayerSupportCase
	query := s.spire.Where("connection_id = ? AND account = ?", s.connectionID, view.Account)
	if view.ID > 0 {
		query = query.Where("id <> ?", view.ID)
	}
	if err := query.Order("submitted_at DESC").Limit(20).Find(&records).Error; err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return history, nil
	}
	ids := make([]uint, 0, len(records))
	for _, record := range records {
		ids = append(ids, record.ID)
	}
	var resolutions []models.PlayerSupportEntry
	if err := s.spire.Where("case_id IN ? AND kind = ?", ids, "resolve").Order("id").Find(&resolutions).Error; err != nil {
		return nil, err
	}
	latest := map[uint]string{}
	for _, entry := range resolutions {
		_, summary, _ := strings.Cut(entry.Text, "\n")
		latest[entry.CaseID] = strings.TrimSpace(summary)
	}
	var native []models.Petition
	if err := s.eqemu.Select("dib, senttime").Where("accountname = ?", view.Account).Find(&native).Error; err != nil {
		return nil, err
	}
	open := map[string]bool{}
	for _, row := range native {
		open[supportSourceKey(row)] = true
	}
	for _, record := range records {
		message := record.Message
		if utf8.RuneCountInString(message) > 160 {
			message = string([]rune(message)[:157]) + "..."
		}
		history = append(history, supportHistoryCase{
			Key: record.SourceKey, Character: record.Character, Status: record.Status, Message: message,
			SubmittedAt: record.SubmittedAt, Merged: record.MergedInto != 0, Resolution: latest[record.ID],
			NativeOpen: open[record.SourceKey],
		})
	}
	return history, nil
}

// ---------------------------------------------------------------------------
// Merge: fold an earlier case from the same account into this one. The
// earlier case's timeline, deliveries, conversation and linked bug reports
// move here, and it is resolved with a pointer to this case.

func (p *PlayerSupportController) merge(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	var input struct {
		Source   string `json:"source"`
		Revision uint   `json:"revision"`
	}
	if c.Bind(&input) != nil || input.Source == "" || input.Source == c.Param("key") {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Choose another case to merge"))
	}
	target, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	source, err := scope.caseByKey(input.Source)
	if err != nil {
		return supportError(c, err)
	}
	switch {
	case !strings.EqualFold(source.Account, target.Account):
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Only cases from the same account can be merged"))
	case source.ID == 0:
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "That case has no Spire history to merge"))
	case source.NativeOpen:
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "That petition is still open in game. Merge the older case into it instead."))
	case source.MergedInto != 0 || target.MergedInto != 0:
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "A merged case cannot be merged again"))
	}
	actor := supportActor(scope.user)
	err = scope.writeCase(func(tx *gorm.DB) error {
		record, err := scope.persist(tx, target.PlayerSupportCase)
		if err != nil {
			return err
		}
		if record.Revision != input.Revision {
			return echo.NewHTTPError(http.StatusConflict, "The case changed. Refresh it before trying again.")
		}
		var from models.PlayerSupportCase
		if err := tx.Clauses(clauseLockForUpdate()).Where("id = ? AND connection_id = ?", source.ID, scope.connectionID).
			Take(&from).Error; err != nil {
			return err
		}
		if from.MergedInto != 0 {
			return echo.NewHTTPError(http.StatusConflict, "That case was already merged")
		}
		steps := []*gorm.DB{
			tx.Model(&models.PlayerSupportEntry{}).Where("case_id = ?", from.ID).Update("case_id", record.ID),
			tx.Table("spire_user_event_log").Where("support_case_id = ? AND server_database_connection_id = ?", from.ID, scope.connectionID).
				Update("support_case_id", record.ID),
			tx.Model(&from).Updates(map[string]interface{}{"status": "resolved", "merged_into": record.ID, "revision": from.Revision + 1}),
			tx.Model(&record).Update("revision", record.Revision+1),
		}
		for _, step := range steps {
			if step.Error != nil {
				return step.Error
			}
		}
		if err := supportMoveCaseLinks(tx, from.ID, record.ID); err != nil {
			return err
		}
		// One conversation per account: keep it on the case that stays open.
		var chat models.PlayerSupportChat
		if tx.Where("case_id = ?", from.ID).Take(&chat).Error == nil {
			if err := tx.Model(&chat).Where("account_id = ?", chat.AccountID).Update("case_id", record.ID).Error; err != nil {
				return err
			}
		}
		filed := time.Unix(from.SubmittedAt, 0).Format("Jan 2, 2006")
		number, _, _ := strings.Cut(from.SourceKey, "-")
		if err := tx.Create(&models.PlayerSupportEntry{CaseID: record.ID, Kind: "merge", Actor: actor,
			Text: fmt.Sprintf("Merged case #%s (%s, filed %s) into this case\n%s", number, from.Character, filed, from.Message)}).Error; err != nil {
			return err
		}
		number, _, _ = strings.Cut(record.SourceKey, "-")
		return tx.Create(&models.PlayerSupportEntry{CaseID: from.ID, Kind: "resolve", Actor: actor,
			Text: fmt.Sprintf("Resolved the case\nMerged into case #%s", number)}).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	p.world.Notify()
	p.publishCaseStatus(c, scope, target.SourceKey)
	return c.NoContent(http.StatusNoContent)
}

// supportMoveCaseLinks moves a merged case's links, such as linked bug
// reports, to the case that stays. A link both cases have would break the
// unique index, so the merged case's copy is dropped first. The target's links
// are read up front because MySQL rejects a subquery on the table it changes.
func supportMoveCaseLinks(tx *gorm.DB, from, to uint) error {
	var existing []models.PlayerSupportCaseLink
	if err := tx.Select("kind, ref_id").Where("case_id = ?", to).Find(&existing).Error; err != nil {
		return err
	}
	var kinds []string
	refs := map[string][]uint{}
	for _, link := range existing {
		if refs[link.Kind] == nil {
			kinds = append(kinds, link.Kind)
		}
		refs[link.Kind] = append(refs[link.Kind], link.RefID)
	}
	for _, kind := range kinds {
		if err := tx.Where("case_id = ? AND kind = ? AND ref_id IN ?", from, kind, refs[kind]).
			Delete(&models.PlayerSupportCaseLink{}).Error; err != nil {
			return err
		}
	}
	return tx.Model(&models.PlayerSupportCaseLink{}).Where("case_id = ?", from).Update("case_id", to).Error
}

// ---------------------------------------------------------------------------
// Saved replies shared by staff on a connection.

const supportReplyLimit = 50

type supportReplyInput struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	// Resolves offers the reply in the Resolve dialog.
	Resolves bool `json:"resolves"`
}

func (in supportReplyInput) clean() (supportReplyInput, error) {
	in.Title, in.Body = strings.TrimSpace(in.Title), strings.TrimSpace(in.Body)
	if in.Title == "" || utf8.RuneCountInString(in.Title) > 80 {
		return in, echo.NewHTTPError(http.StatusBadRequest, "Enter a title of up to 80 characters")
	}
	if in.Body == "" || len(in.Body) > 2000 {
		return in, echo.NewHTTPError(http.StatusBadRequest, "Enter a reply of up to 2,000 characters")
	}
	return in, nil
}

func (p *PlayerSupportController) listReplies(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	replies := []models.PlayerSupportReply{}
	if err := scope.spire.Where("connection_id = ?", scope.connectionID).Order("title, id").Find(&replies).Error; err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, echo.Map{"replies": replies})
}

func (p *PlayerSupportController) saveReply(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	var input supportReplyInput
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid saved reply"))
	}
	if input, err = input.clean(); err != nil {
		return supportError(c, err)
	}
	reply := models.PlayerSupportReply{
		ConnectionID: scope.connectionID, Title: input.Title, Body: input.Body, Resolves: input.Resolves, UpdatedBy: supportActor(scope.user),
	}
	if id := c.Param("id"); id != "" {
		value, err := strconv.ParseUint(id, 10, 32)
		if err != nil {
			return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid saved reply"))
		}
		result := scope.spire.Model(&models.PlayerSupportReply{}).Where("id = ? AND connection_id = ?", value, scope.connectionID).
			Updates(map[string]interface{}{"title": reply.Title, "body": reply.Body, "resolves": reply.Resolves, "updated_by": reply.UpdatedBy})
		if result.Error != nil {
			return supportError(c, result.Error)
		}
		if result.RowsAffected == 0 {
			return supportError(c, echo.NewHTTPError(http.StatusNotFound, "That saved reply was deleted"))
		}
		return c.NoContent(http.StatusNoContent)
	}
	var count int64
	if err := scope.spire.Model(&models.PlayerSupportReply{}).Where("connection_id = ?", scope.connectionID).Count(&count).Error; err != nil {
		return supportError(c, err)
	}
	if count >= supportReplyLimit {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, fmt.Sprintf("Keep up to %d saved replies", supportReplyLimit)))
	}
	if err := scope.spire.Create(&reply).Error; err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusCreated, reply)
}

func (p *PlayerSupportController) deleteReply(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid saved reply"))
	}
	if err := scope.spire.Where("id = ? AND connection_id = ?", id, scope.connectionID).Delete(&models.PlayerSupportReply{}).Error; err != nil {
		return supportError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

// ---------------------------------------------------------------------------
// Alerts: post each new petition on the local server to a Discord webhook
// chosen from EQEmu's discord_webhooks table.

func (p *PlayerSupportController) settings(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	local := p.localWorld(scope)
	result := echo.Map{"available": local, "discord_webhook_id": 0, "webhooks": []interface{}{}}
	if !local {
		return c.JSON(http.StatusOK, result)
	}
	var settings models.PlayerSupportSettings
	if err := scope.spire.Limit(1).Find(&settings).Error; err != nil {
		return supportError(c, err)
	}
	type webhook struct {
		ID   uint   `json:"id"`
		Name string `json:"name"`
	}
	webhooks := []webhook{}
	if err := scope.eqemu.Table("discord_webhooks").Select("id, COALESCE(webhook_name, '') AS name").
		Where("deleted_at IS NULL AND webhook_url <> ''").Order("webhook_name, id").Scan(&webhooks).Error; err != nil {
		return supportError(c, err)
	}
	result["discord_webhook_id"] = settings.DiscordWebhookID
	result["webhooks"] = webhooks
	return c.JSON(http.StatusOK, result)
}

func (p *PlayerSupportController) updateSettings(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	if !p.localWorld(scope) {
		return supportError(c, echo.NewHTTPError(http.StatusConflict, "Petition alerts are set up from the Spire running beside this game server"))
	}
	var input struct {
		DiscordWebhookID uint `json:"discord_webhook_id"`
	}
	if c.Bind(&input) != nil {
		return supportError(c, echo.NewHTTPError(http.StatusBadRequest, "Invalid settings"))
	}
	if input.DiscordWebhookID > 0 {
		var count int64
		if err := scope.eqemu.Table("discord_webhooks").Where("id = ? AND deleted_at IS NULL", input.DiscordWebhookID).
			Count(&count).Error; err != nil {
			return supportError(c, err)
		}
		if count == 0 {
			return supportError(c, echo.NewHTTPError(http.StatusConflict, "That Discord webhook no longer exists"))
		}
	}
	// Announce only petitions filed from now on.
	var newest int64
	if err := scope.eqemu.Table("petitions").Select("COALESCE(MAX(senttime), 0)").Scan(&newest).Error; err != nil {
		return supportError(c, err)
	}
	err = scope.spire.Transaction(func(tx *gorm.DB) error {
		var settings models.PlayerSupportSettings
		if err := tx.Clauses(clauseLockForUpdate()).Limit(1).Find(&settings).Error; err != nil {
			return err
		}
		if settings.DiscordWebhookID == 0 && input.DiscordWebhookID > 0 {
			settings.AlertedThrough = newest
		}
		settings.DiscordWebhookID = input.DiscordWebhookID
		settings.UpdatedBy = supportActor(scope.user)
		return tx.Save(&settings).Error
	})
	if err != nil {
		return supportError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func supportDiscordURL(url string) bool {
	return strings.HasPrefix(url, "https://discord.com/api/webhooks/") ||
		strings.HasPrefix(url, "https://discordapp.com/api/webhooks/") ||
		strings.HasPrefix(url, "https://ptb.discord.com/api/webhooks/") ||
		strings.HasPrefix(url, "https://canary.discord.com/api/webhooks/")
}

type supportAlertPetition struct {
	Petid        uint
	Charname     string
	Zone         string
	Urgency      int
	Petitiontext string
	Senttime     int64
}

// supportAlertMessage builds the Discord message. Mentions are disabled, so
// petition text cannot ping anyone.
func supportAlertMessage(petitions []supportAlertPetition, more int) []byte {
	var lines []string
	for _, petition := range petitions {
		text := strings.Join(strings.Fields(petition.Petitiontext), " ")
		if utf8.RuneCountInString(text) > 300 {
			text = string([]rune(text)[:297]) + "..."
		}
		urgent := ""
		if petition.Urgency > 1 {
			urgent = " · urgent"
		}
		zone := ""
		if petition.Zone != "" {
			zone = " in " + petition.Zone
		}
		lines = append(lines, fmt.Sprintf("**New petition #%d** from %s%s%s\n> %s", petition.Petid, petition.Charname, zone, urgent, text))
	}
	if more > 0 {
		lines = append(lines, fmt.Sprintf("…and %d more. Open Player Support in Spire to see them.", more))
	}
	body, _ := json.Marshal(map[string]interface{}{
		"username": "Player Support", "content": strings.Join(lines, "\n\n"),
		"allowed_mentions": map[string]interface{}{"parse": []string{}},
	})
	return body
}

func supportPostWebhook(ctx context.Context, url string, body []byte) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := (&http.Client{Timeout: 5 * time.Second}).Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode >= 300 {
		return fmt.Errorf("Discord answered %s", response.Status)
	}
	return nil
}

// watchPetitionAlerts announces new petitions on the database this Spire is
// configured with, which is the game server Live chat also uses.
func (p *PlayerSupportController) watchPetitionAlerts(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := p.announcePetitions(ctx, p.db.GetSpireDb(), p.db.GetEqemuDb()); err != nil && p.log != nil {
				p.log.Warn().Err(err).Msg("Player Support could not post petition alerts")
			}
		}
	}
}

func (p *PlayerSupportController) announcePetitions(ctx context.Context, spire, eqemu *gorm.DB) error {
	if spire == nil || eqemu == nil {
		return nil
	}
	spire, eqemu = spire.WithContext(ctx), eqemu.WithContext(ctx)
	var settings models.PlayerSupportSettings
	if err := spire.Limit(1).Find(&settings).Error; err != nil || settings.ID == 0 || settings.DiscordWebhookID == 0 {
		return err
	}
	var url string
	if err := eqemu.Table("discord_webhooks").Select("COALESCE(webhook_url, '')").
		Where("id = ? AND deleted_at IS NULL", settings.DiscordWebhookID).Scan(&url).Error; err != nil {
		return err
	}
	if !supportDiscordURL(url) {
		return nil
	}
	var petitions []supportAlertPetition
	if err := eqemu.Table("petitions").Select("petid, charname, zone, urgency, petitiontext, senttime").
		Where("senttime > ?", settings.AlertedThrough).Order("senttime, dib").Limit(6).Scan(&petitions).Error; err != nil {
		return err
	}
	if len(petitions) == 0 {
		return nil
	}
	var total int64
	if err := eqemu.Table("petitions").Where("senttime > ?", settings.AlertedThrough).Count(&total).Error; err != nil {
		return err
	}
	shown := petitions
	if len(shown) > 5 {
		shown = shown[:5]
	}
	newest := petitions[len(petitions)-1].Senttime
	if total > int64(len(petitions)) {
		// Skip the rest so one burst is one message.
		if err := eqemu.Table("petitions").Select("MAX(senttime)").Scan(&newest).Error; err != nil {
			return err
		}
	}
	// Record first, so a slow or failing webhook never posts the same petition twice.
	result := spire.Model(&models.PlayerSupportSettings{}).Where("id = ? AND alerted_through = ?", settings.ID, settings.AlertedThrough).
		Update("alerted_through", newest)
	if result.Error != nil || result.RowsAffected == 0 {
		return result.Error
	}
	post := p.postWebhook
	if post == nil {
		post = supportPostWebhook
	}
	return post(ctx, url, supportAlertMessage(shown, int(total)-len(shown)))
}

// ---------------------------------------------------------------------------
// Response metrics for cases filed in the last N days.

type supportStaffMetrics struct {
	Name      string `json:"name"`
	Responses int    `json:"responses"`
	Resolved  int    `json:"resolved"`
}

type supportMetrics struct {
	Days              int                   `json:"days"`
	Filed             int                   `json:"filed"`
	Resolved          int                   `json:"resolved"`
	Merged            int                   `json:"merged"`
	Responded         int                   `json:"responded"`
	FirstResponseMins *float64              `json:"first_response_minutes"`
	ResolveMins       *float64              `json:"resolve_minutes"`
	Staff             []supportStaffMetrics `json:"staff"`
}

func supportMedian(values []float64) *float64 {
	if len(values) == 0 {
		return nil
	}
	sort.Float64s(values)
	middle := len(values) / 2
	median := values[middle]
	if len(values)%2 == 0 {
		median = (values[middle-1] + values[middle]) / 2
	}
	return &median
}

func (p *PlayerSupportController) metrics(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	days, _ := strconv.Atoi(c.QueryParam("days"))
	if days != 7 && days != 90 {
		days = 30
	}
	since := time.Now().AddDate(0, 0, -days)
	var cases []models.PlayerSupportCase
	if err := scope.spire.Where("connection_id = ? AND submitted_at >= ?", scope.connectionID, since.Unix()).Find(&cases).Error; err != nil {
		return supportError(c, err)
	}
	result := supportMetrics{Days: days, Filed: len(cases), Staff: []supportStaffMetrics{}}
	// Spire records a case once staff open or act on it. Petitions still in
	// the queue untouched count as filed too.
	known := map[string]bool{}
	for _, record := range cases {
		known[record.SourceKey] = true
	}
	var native []models.Petition
	if err := scope.eqemu.Select("dib, senttime").Where("senttime >= ?", since.Unix()).Find(&native).Error; err != nil {
		return supportError(c, err)
	}
	for _, row := range native {
		if !known[supportSourceKey(row)] {
			result.Filed++
		}
	}
	ids := make([]uint, 0, len(cases))
	byID := map[uint]models.PlayerSupportCase{}
	for _, record := range cases {
		ids = append(ids, record.ID)
		byID[record.ID] = record
		if record.MergedInto != 0 {
			result.Merged++
		} else if record.Status == "resolved" {
			result.Resolved++
		}
	}
	staff := map[string]*supportStaffMetrics{}
	member := func(name string) *supportStaffMetrics {
		if name == "" {
			name = supportDefaultActor
		}
		if staff[name] == nil {
			staff[name] = &supportStaffMetrics{Name: name}
		}
		return staff[name]
	}
	first := map[uint]time.Time{}
	// Merging moves an earlier case's history onto a later one. Work done
	// before this case was filed, or before the period, belongs elsewhere.
	counts := func(caseID uint, at time.Time) bool {
		return !at.Before(since) && !at.Before(time.Unix(byID[caseID].SubmittedAt, 0))
	}
	responded := func(caseID uint, at time.Time) {
		if current, ok := first[caseID]; !ok || at.Before(current) {
			first[caseID] = at
		}
	}
	var resolveTimes []float64
	if len(ids) > 0 {
		var entries []models.PlayerSupportEntry
		if err := scope.spire.Where("case_id IN ? AND kind IN ?", ids, []string{"chat_out", "resolve"}).Order("id").Find(&entries).Error; err != nil {
			return supportError(c, err)
		}
		resolvedAt := map[uint]time.Time{}
		for _, entry := range entries {
			if !counts(entry.CaseID, entry.CreatedAt) {
				continue
			}
			if entry.Kind == "chat_out" {
				responded(entry.CaseID, entry.CreatedAt)
				member(entry.Actor).Responses++
				continue
			}
			resolvedAt[entry.CaseID] = entry.CreatedAt
			if !strings.Contains(entry.Text, "\nMerged into case #") {
				member(entry.Actor).Resolved++
			}
		}
		for id, at := range resolvedAt {
			if record := byID[id]; record.Status == "resolved" && record.MergedInto == 0 {
				resolveTimes = append(resolveTimes, at.Sub(time.Unix(record.SubmittedAt, 0)).Minutes())
			}
		}
		var deliveries []struct {
			SupportCaseID uint
			CreatedAt     time.Time
			Actor         string
		}
		if err := scope.spire.Table("spire_user_event_log AS events").
			Select("events.support_case_id, events.created_at, COALESCE(users.user_name, '') AS actor").
			Joins("LEFT JOIN spire_users AS users ON users.id = events.user_id").
			Where("events.support_case_id IN ? AND events.server_database_connection_id = ? AND events.support_delivery_state = ?",
				ids, scope.connectionID, "sent").
			Scan(&deliveries).Error; err != nil {
			return supportError(c, err)
		}
		for _, delivery := range deliveries {
			if !counts(delivery.SupportCaseID, delivery.CreatedAt) {
				continue
			}
			responded(delivery.SupportCaseID, delivery.CreatedAt)
			member(delivery.Actor).Responses++
		}
	}
	var firstTimes []float64
	for id, at := range first {
		firstTimes = append(firstTimes, at.Sub(time.Unix(byID[id].SubmittedAt, 0)).Minutes())
	}
	result.Responded = len(first)
	result.FirstResponseMins = supportMedian(firstTimes)
	result.ResolveMins = supportMedian(resolveTimes)
	for _, entry := range staff {
		result.Staff = append(result.Staff, *entry)
	}
	sort.Slice(result.Staff, func(i, j int) bool {
		a, b := result.Staff[i], result.Staff[j]
		if a.Resolved+a.Responses != b.Resolved+b.Responses {
			return a.Resolved+a.Responses > b.Resolved+b.Responses
		}
		return a.Name < b.Name
	})
	return c.JSON(http.StatusOK, result)
}
