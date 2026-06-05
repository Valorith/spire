package spirechangelog

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/EQEmuTools/spire/internal/release"
	"github.com/google/go-github/v41/github"
	"golang.org/x/oauth2"
)

const releaseStatusRefreshAfterSeconds = 20
const releaseStatusGitHubManualTokenCacheKey = "spire_changelog_github_manual_token"
const releaseStatusGitHubCLITokenCacheKey = "spire_changelog_github_cli_token"
const releaseStatusGitHubCLIUnavailableCacheKey = "spire_changelog_github_cli_unavailable"
const releaseStatusClipboardMaxBytes = 16 * 1024
const releaseStatusGitHubTokenConfigDir = "spire"
const releaseStatusGitHubTokenFileName = "github-release-token"

type ReleaseStatus struct {
	Summary             string                      `json:"summary"`
	SummaryLabel        string                      `json:"summary_label"`
	CheckedAt           string                      `json:"checked_at"`
	RefreshAfterSeconds int                         `json:"refresh_after_seconds"`
	Repository          string                      `json:"repository"`
	ReleaseBranch       string                      `json:"release_branch"`
	ExpectedTag         string                      `json:"expected_tag"`
	Local               ReleaseStatusLocal          `json:"local"`
	Workflow            *ReleaseStatusWorkflow      `json:"workflow,omitempty"`
	LatestRelease       *ReleaseStatusLatestRelease `json:"latest_release,omitempty"`
	Steps               []ReleaseStatusStep         `json:"steps"`
	Issues              []string                    `json:"issues"`
	GitHubError         string                      `json:"github_error,omitempty"`
	GitHubRate          *ReleaseStatusGitHubRate    `json:"github_rate,omitempty"`
	GitHubAuth          ReleaseStatusGitHubAuth     `json:"github_auth"`
}

type ReleaseStatusLocal struct {
	Source                  string   `json:"source"`
	Writable                bool     `json:"writable"`
	PackageVersion          string   `json:"package_version"`
	TopReleaseVersion       string   `json:"top_release_version"`
	TopReleaseDate          string   `json:"top_release_date"`
	ReleaseRepositorySource string   `json:"release_repository_source"`
	ReleaseBranch           string   `json:"release_branch"`
	CurrentBranch           string   `json:"current_branch"`
	ValidationErrors        []string `json:"validation_errors"`
}

type ReleaseStatusWorkflow struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	RunNumber  int    `json:"run_number"`
	Status     string `json:"status"`
	Conclusion string `json:"conclusion"`
	Event      string `json:"event"`
	HeadBranch string `json:"head_branch"`
	HeadSHA    string `json:"head_sha"`
	HTMLURL    string `json:"html_url"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

type ReleaseStatusLatestRelease struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	HTMLURL     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
	Draft       bool   `json:"draft"`
	Prerelease  bool   `json:"prerelease"`
	AssetCount  int    `json:"asset_count"`
}

type ReleaseStatusStep struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Detail string `json:"detail"`
	Status string `json:"status"`
}

type ReleaseStatusGitHubRate struct {
	Limit     int    `json:"limit"`
	Remaining int    `json:"remaining"`
	ResetAt   string `json:"reset_at"`
}

type ReleaseStatusGitHubAuth struct {
	Source        string `json:"source"`
	Authenticated bool   `json:"authenticated"`
	NeedsToken    bool   `json:"needs_token"`
	Message       string `json:"message"`
}

type UpdateGitHubTokenRequest struct {
	Token string `json:"token"`
}

type releaseStatusSignal struct {
	LocalIssues        []string
	ExpectedTag        string
	WorkflowStatus     string
	WorkflowConclusion string
	LatestReleaseTag   string
	GitHubError        string
}

func (s *Service) LoadReleaseStatus(ctx context.Context) (*ReleaseStatus, error) {
	state, err := s.LoadState()
	if err != nil {
		return nil, err
	}

	validationErrors := state.ValidationErrors
	if validationErrors == nil {
		validationErrors = []string{}
	}

	status := &ReleaseStatus{
		CheckedAt:           time.Now().UTC().Format(time.RFC3339),
		RefreshAfterSeconds: releaseStatusRefreshAfterSeconds,
		Repository:          state.ReleaseRepository,
		ReleaseBranch:       spireReleaseBranch,
		ExpectedTag:         state.ReleasePayload.TagName,
		Local: ReleaseStatusLocal{
			Source:                  state.Source,
			Writable:                state.Writable,
			PackageVersion:          state.PackageVersion,
			TopReleaseVersion:       state.TopRelease.Version,
			TopReleaseDate:          state.TopRelease.ReleaseDate,
			ReleaseRepositorySource: state.ReleaseRepositorySource,
			ReleaseBranch:           spireReleaseBranch,
			CurrentBranch:           state.CurrentBranch,
			ValidationErrors:        validationErrors,
		},
		Issues: releaseStatusLocalIssues(state),
	}

	owner, repo, splitErr := splitGitHubRepository(state.ReleaseRepository)
	if splitErr != nil {
		status.Issues = append(status.Issues, splitErr.Error())
	} else {
		workflow, latestRelease, rate, githubError, githubAuth := s.fetchGitHubReleaseStatus(ctx, owner, repo, spireReleaseBranch)
		status.Workflow = workflow
		status.LatestRelease = latestRelease
		status.GitHubRate = rate
		status.GitHubError = githubError
		status.GitHubAuth = githubAuth
	}

	status.Summary, status.SummaryLabel = deriveReleaseStatusSummary(releaseStatusSignal{
		LocalIssues:        status.Issues,
		ExpectedTag:        status.ExpectedTag,
		WorkflowStatus:     workflowStatus(status.Workflow),
		WorkflowConclusion: workflowConclusion(status.Workflow),
		LatestReleaseTag:   latestReleaseTag(status.LatestRelease),
		GitHubError:        status.GitHubError,
	})
	status.Steps = buildReleaseStatusSteps(state, status)

	return status, nil
}

func (s *Service) UpdateGitHubToken(ctx context.Context, req UpdateGitHubTokenRequest) (*ReleaseStatus, error) {
	return s.updateGitHubTokenValue(ctx, req.Token)
}

func (s *Service) UpdateGitHubTokenFromClipboard(ctx context.Context) (*ReleaseStatus, error) {
	token, err := releaseStatusGitHubTokenFromClipboard(ctx)
	if err != nil {
		return nil, fmt.Errorf("local clipboard did not contain a readable GitHub token. Copy the token, then try again")
	}

	return s.updateGitHubTokenValue(ctx, token)
}

func (s *Service) updateGitHubTokenValue(ctx context.Context, value string) (*ReleaseStatus, error) {
	token := releaseStatusExtractGitHubToken(value)
	if token == "" {
		return nil, fmt.Errorf("GitHub token is required")
	}

	if err := releaseStatusValidateGitHubToken(ctx, token); err != nil {
		return nil, fmt.Errorf("GitHub token could not be validated. Check the token value and scopes.")
	}

	if err := releaseStatusPersistGitHubToken(token); err != nil {
		return nil, fmt.Errorf("GitHub token could not be saved on this machine. Check local config directory permissions.")
	}

	if s.cache != nil {
		s.cache.Set(releaseStatusGitHubManualTokenCacheKey, token, 12*time.Hour)
		s.cache.Delete(releaseStatusGitHubCLITokenCacheKey)
		s.cache.Delete(releaseStatusGitHubCLIUnavailableCacheKey)
	}

	return s.LoadReleaseStatus(ctx)
}

func releaseStatusExtractGitHubToken(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	match := tokenLikeSecretRegexp.FindString(value)
	if match == "" {
		return value
	}

	fields := strings.Fields(match)
	if len(fields) > 0 && strings.EqualFold(fields[0], "Authorization:") {
		return fields[len(fields)-1]
	}

	return strings.TrimSpace(match)
}

func releaseStatusGitHubTokenPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil || strings.TrimSpace(configDir) == "" {
		homeDir, homeErr := os.UserHomeDir()
		if homeErr != nil {
			return "", homeErr
		}
		if strings.TrimSpace(homeDir) == "" {
			return "", fmt.Errorf("user config directory is unavailable")
		}
		configDir = filepath.Join(homeDir, ".config")
	}

	return filepath.Join(configDir, releaseStatusGitHubTokenConfigDir, releaseStatusGitHubTokenFileName), nil
}

func releaseStatusPersistGitHubToken(token string) error {
	path, err := releaseStatusGitHubTokenPath()
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	_ = os.Chmod(dir, 0700)

	if err := os.WriteFile(path, []byte(strings.TrimSpace(token)+"\n"), 0600); err != nil {
		return err
	}
	return os.Chmod(path, 0600)
}

func releaseStatusReadPersistedGitHubToken() (string, error) {
	path, err := releaseStatusGitHubTokenPath()
	if err != nil {
		return "", err
	}

	body, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}

	return releaseStatusExtractGitHubToken(string(body)), nil
}

func releaseStatusGitHubTokenFromClipboard(ctx context.Context) (string, error) {
	var lastErr error
	for _, args := range releaseStatusClipboardCommands() {
		output, err := releaseStatusRunClipboardCommand(ctx, args)
		if err != nil {
			lastErr = err
			continue
		}
		token := releaseStatusExtractGitHubToken(output)
		if token != "" {
			return token, nil
		}
		lastErr = fmt.Errorf("clipboard is empty")
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("no supported clipboard command found")
	}
	return "", lastErr
}

func releaseStatusClipboardCommands() [][]string {
	switch runtime.GOOS {
	case "darwin":
		return [][]string{{"pbpaste"}}
	case "windows":
		return [][]string{
			{"powershell.exe", "-NoProfile", "-Command", "Get-Clipboard -Raw"},
			{"powershell", "-NoProfile", "-Command", "Get-Clipboard -Raw"},
		}
	default:
		return [][]string{
			{"wl-paste", "--no-newline"},
			{"xclip", "-selection", "clipboard", "-o"},
			{"xsel", "--clipboard", "--output"},
		}
	}
}

func releaseStatusRunClipboardCommand(ctx context.Context, args []string) (string, error) {
	if len(args) == 0 {
		return "", fmt.Errorf("clipboard command is empty")
	}

	clipCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	cmd := exec.CommandContext(clipCtx, args[0], args[1:]...)
	cmd.Stderr = io.Discard
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", err
	}

	if err := cmd.Start(); err != nil {
		return "", err
	}

	output, readErr := io.ReadAll(io.LimitReader(stdout, releaseStatusClipboardMaxBytes+1))
	waitErr := cmd.Wait()
	if readErr != nil {
		return "", readErr
	}
	if len(output) > releaseStatusClipboardMaxBytes {
		return "", fmt.Errorf("clipboard content is too large")
	}
	if waitErr != nil {
		return "", waitErr
	}

	return strings.TrimSpace(string(output)), nil
}

func (s *Service) releaseStatusGitHubClient(ctx context.Context) (*github.Client, ReleaseStatusGitHubAuth) {
	token, source := s.releaseStatusGitHubToken(ctx)
	client := &http.Client{Timeout: 5 * time.Second}
	if token != "" {
		client.Transport = &oauth2.Transport{
			Source: oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token}),
		}
	}

	return github.NewClient(client), ReleaseStatusGitHubAuth{
		Source:        source,
		Authenticated: token != "",
	}
}

func (s *Service) releaseStatusGitHubToken(ctx context.Context) (string, string) {
	if s.cache != nil {
		if cached, ok := s.cache.Get(releaseStatusGitHubManualTokenCacheKey); ok {
			if token, ok := cached.(string); ok && token != "" {
				return token, "provided"
			}
		}
	}

	if token, err := releaseStatusReadPersistedGitHubToken(); err == nil && token != "" {
		if s.cache != nil {
			s.cache.Set(releaseStatusGitHubManualTokenCacheKey, token, 12*time.Hour)
		}
		return token, "provided"
	}

	for _, envName := range []string{"GH_RELEASE_GITHUB_API_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"} {
		if token := strings.TrimSpace(os.Getenv(envName)); token != "" {
			return token, "environment"
		}
	}

	if s.cache != nil {
		if _, unavailable := s.cache.Get(releaseStatusGitHubCLIUnavailableCacheKey); unavailable {
			return "", "none"
		}
		if cached, ok := s.cache.Get(releaseStatusGitHubCLITokenCacheKey); ok {
			if token, ok := cached.(string); ok && token != "" {
				return token, "gh_cli"
			}
		}
	}

	token, err := releaseStatusGitHubTokenFromCLI(ctx)
	if err != nil || token == "" {
		if s.cache != nil {
			s.cache.Set(releaseStatusGitHubCLIUnavailableCacheKey, true, time.Minute)
		}
		return "", "none"
	}

	if s.cache != nil {
		s.cache.Set(releaseStatusGitHubCLITokenCacheKey, token, time.Hour)
	}
	return token, "gh_cli"
}

func releaseStatusGitHubTokenFromCLI(ctx context.Context) (string, error) {
	cliCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	output, err := exec.CommandContext(cliCtx, "gh", "auth", "token").Output()
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(string(output)), nil
}

func releaseStatusValidateGitHubToken(ctx context.Context, token string) error {
	client := &http.Client{
		Timeout: 5 * time.Second,
		Transport: &oauth2.Transport{
			Source: oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token}),
		},
	}

	_, _, err := github.NewClient(client).Users.Get(ctx, "")
	return err
}

func (s *Service) fetchGitHubReleaseStatus(ctx context.Context, owner string, repo string, branch string) (*ReleaseStatusWorkflow, *ReleaseStatusLatestRelease, *ReleaseStatusGitHubRate, string, ReleaseStatusGitHubAuth) {
	client, auth := s.releaseStatusGitHubClient(ctx)
	var rate *ReleaseStatusGitHubRate
	var errors []string

	runs, runsResp, err := client.Actions.ListWorkflowRunsByFileName(ctx, owner, repo, "manual-release.yml", &github.ListWorkflowRunsOptions{
		Branch: branch,
		Event:  "workflow_dispatch",
		ListOptions: github.ListOptions{
			PerPage: 1,
		},
	})
	if runsResp != nil {
		rate = releaseStatusRate(runsResp)
	}
	if err != nil {
		errors = append(errors, fmt.Sprintf("Manual Release workflow unavailable on %s: %v", branch, err))
	}

	var workflow *ReleaseStatusWorkflow
	if runs != nil && len(runs.WorkflowRuns) > 0 {
		workflow = releaseStatusWorkflowFromGitHub(runs.WorkflowRuns[0])
	}

	latest, releaseResp, err := client.Repositories.GetLatestRelease(ctx, owner, repo)
	if releaseResp != nil {
		rate = releaseStatusRate(releaseResp)
	}
	if err != nil {
		if releaseResp == nil || releaseResp.StatusCode != http.StatusNotFound {
			errors = append(errors, fmt.Sprintf("Latest GitHub release unavailable: %v", err))
		}
	}

	var latestRelease *ReleaseStatusLatestRelease
	if latest != nil {
		latestRelease = releaseStatusLatestReleaseFromGitHub(latest)
	}

	githubError := strings.Join(errors, " ")
	auth.NeedsToken = releaseStatusGitHubNeedsToken(auth, rate, githubError)
	auth.Message = releaseStatusGitHubAuthMessage(auth, rate, githubError)

	return workflow, latestRelease, rate, githubError, auth
}

func releaseStatusWorkflowFromGitHub(run *github.WorkflowRun) *ReleaseStatusWorkflow {
	if run == nil {
		return nil
	}

	return &ReleaseStatusWorkflow{
		ID:         run.GetID(),
		Name:       run.GetName(),
		RunNumber:  run.GetRunNumber(),
		Status:     run.GetStatus(),
		Conclusion: run.GetConclusion(),
		Event:      run.GetEvent(),
		HeadBranch: run.GetHeadBranch(),
		HeadSHA:    run.GetHeadSHA(),
		HTMLURL:    run.GetHTMLURL(),
		CreatedAt:  releaseStatusTimestamp(run.GetCreatedAt()),
		UpdatedAt:  releaseStatusTimestamp(run.GetUpdatedAt()),
	}
}

func releaseStatusLatestReleaseFromGitHub(latest *github.RepositoryRelease) *ReleaseStatusLatestRelease {
	if latest == nil {
		return nil
	}

	return &ReleaseStatusLatestRelease{
		TagName:     latest.GetTagName(),
		Name:        latest.GetName(),
		HTMLURL:     latest.GetHTMLURL(),
		PublishedAt: releaseStatusTimestamp(latest.GetPublishedAt()),
		Draft:       latest.GetDraft(),
		Prerelease:  latest.GetPrerelease(),
		AssetCount:  len(latest.Assets),
	}
}

func releaseStatusLocalIssues(state *LoadState) []string {
	issues := make([]string, 0, len(state.ValidationErrors)+4)
	if state.Source != "live" {
		issues = append(issues, "Open Spire from a live checkout before cutting a release.")
	}
	if state.Source == "live" {
		currentBranch := strings.TrimSpace(state.CurrentBranch)
		if currentBranch == "" {
			issues = append(issues, fmt.Sprintf("Confirm the local checkout is on %s before cutting a release.", spireReleaseBranch))
		} else if currentBranch != spireReleaseBranch {
			issues = append(issues, fmt.Sprintf("Releases must be cut from %s. Current checkout branch is %s.", spireReleaseBranch, currentBranch))
		}
	}
	if !state.Writable {
		issues = append(issues, "CHANGELOG.md is not writable from this server.")
	}
	if strings.TrimSpace(state.ReleaseRepository) == "" {
		issues = append(issues, "Release repository is not configured.")
	}
	issues = append(issues, state.ValidationErrors...)
	return issues
}

func releaseStatusGitHubNeedsToken(auth ReleaseStatusGitHubAuth, rate *ReleaseStatusGitHubRate, githubError string) bool {
	errorText := strings.ToLower(githubError)
	if strings.Contains(errorText, "bad credentials") || strings.Contains(errorText, "requires authentication") {
		return true
	}

	if !auth.Authenticated {
		if rate != nil && rate.Remaining == 0 {
			return true
		}
		if strings.Contains(errorText, "rate limit") || strings.Contains(errorText, "api rate limit") {
			return true
		}
	}

	return false
}

func releaseStatusGitHubAuthMessage(auth ReleaseStatusGitHubAuth, rate *ReleaseStatusGitHubRate, githubError string) string {
	if releaseStatusGitHubNeedsToken(auth, rate, githubError) {
		if auth.Authenticated {
			return "The configured GitHub token could not be used. Provide a valid token to enable live release status."
		}
		return "GitHub needs an authenticated token before Spire can read live release status."
	}

	switch auth.Source {
	case "provided":
		return "Using the GitHub token saved on this machine."
	case "environment":
		return "Using a GitHub token from the server environment."
	case "gh_cli":
		return "Using the authenticated GitHub CLI token on this machine."
	default:
		return "Using public GitHub API access."
	}
}

func deriveReleaseStatusSummary(signal releaseStatusSignal) (string, string) {
	if len(signal.LocalIssues) > 0 {
		return "needs_attention", "Needs attention"
	}
	if isWorkflowRunning(signal.WorkflowStatus) {
		return "running", "Workflow running"
	}
	if isWorkflowFailed(signal.WorkflowStatus, signal.WorkflowConclusion) {
		return "failed", "Workflow failed"
	}
	if signal.ExpectedTag != "" && strings.EqualFold(signal.LatestReleaseTag, signal.ExpectedTag) {
		return "published", "Published"
	}
	if signal.GitHubError != "" {
		return "unknown", "GitHub unavailable"
	}
	return "ready", "Ready for workflow"
}

func buildReleaseStatusSteps(state *LoadState, status *ReleaseStatus) []ReleaseStatusStep {
	branchStatus := "pending"
	if state.Source == "live" && strings.TrimSpace(state.CurrentBranch) != spireReleaseBranch {
		branchStatus = "attention"
	}

	editorStatus := "pending"
	if state.Source != "live" || !state.Writable || strings.TrimSpace(state.ReleaseRepository) == "" {
		editorStatus = "attention"
	}

	notesStatus := "pending"
	if state.TopRelease.Version == "" || strings.TrimSpace(state.TopRelease.Body) == "" {
		notesStatus = "attention"
	}

	validationStatus := "pending"
	if len(state.ValidationErrors) > 0 {
		validationStatus = "attention"
	}

	workflowStepStatus := "pending"
	if status.Workflow != nil {
		switch {
		case isWorkflowRunning(status.Workflow.Status):
			workflowStepStatus = "running"
		case isWorkflowFailed(status.Workflow.Status, status.Workflow.Conclusion):
			workflowStepStatus = "failed"
		case strings.EqualFold(status.Workflow.Conclusion, "success"):
			workflowStepStatus = "done"
		}
	}

	publishStatus := "pending"
	if status.Summary == "published" {
		publishStatus = "done"
	} else if workflowStepStatus == "running" {
		publishStatus = "running"
	} else if workflowStepStatus == "failed" {
		publishStatus = "failed"
	}

	verifyStatus := "pending"
	if status.Summary == "published" {
		verifyStatus = "done"
	} else if status.GitHubError != "" {
		verifyStatus = "attention"
	}

	return []ReleaseStatusStep{
		{
			ID:     "sync_checkout",
			Title:  "Move the release contents onto master.",
			Detail: "Merge or cherry-pick the work that should ship, then pull master current before editing release notes.",
			Status: branchStatus,
		},
		{
			ID:     "open_editor",
			Title:  "Open this editor from the master checkout.",
			Detail: "The editor should be live, writable, and pointed at the GitHub repo that receives releases before you save release notes.",
			Status: editorStatus,
		},
		{
			ID:     "prepare_notes",
			Title:  "Prepare the top CHANGELOG.md section.",
			Detail: "Put the notes that should become the GitHub release body in the first heading. Drafts can use [Unreleased]; the workflow replaces it with the final version and date.",
			Status: notesStatus,
		},
		{
			ID:     "validate_changelog",
			Title:  "Save and review CHANGELOG.md.",
			Detail: "Save the file, clear changelog checks, and compare the preview against the release notes you intend to publish.",
			Status: validationStatus,
		},
		{
			ID:     "run_workflow",
			Title:  "Run Manual Release on master.",
			Detail: "Open GitHub Actions, select the master branch, choose patch/minor/major, and use the repo override only when intentionally publishing elsewhere.",
			Status: workflowStepStatus,
		},
		{
			ID:     "publish_release",
			Title:  "Let the workflow create the release.",
			Detail: "It updates version metadata, stamps changelog notes, builds assets, commits release metadata back to master, and publishes GitHub.",
			Status: publishStatus,
		},
		{
			ID:     "verify_release",
			Title:  "Verify the published release.",
			Detail: "Confirm the latest GitHub release tag, notes, assets, and updater metadata match the intended release.",
			Status: verifyStatus,
		},
	}
}

func splitGitHubRepository(repository string) (string, string, error) {
	normalized := release.NormalizeGitHubRepository(repository)
	parts := strings.SplitN(normalized, "/", 2)
	if len(parts) != 2 || strings.TrimSpace(parts[0]) == "" || strings.TrimSpace(parts[1]) == "" {
		return "", "", fmt.Errorf("Release repository must use owner/repo format.")
	}
	return parts[0], parts[1], nil
}

func isWorkflowRunning(status string) bool {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "queued", "in_progress", "requested", "waiting", "pending":
		return true
	default:
		return false
	}
}

func isWorkflowFailed(status string, conclusion string) bool {
	if !strings.EqualFold(strings.TrimSpace(status), "completed") {
		return false
	}

	switch strings.ToLower(strings.TrimSpace(conclusion)) {
	case "failure", "cancelled", "timed_out", "action_required", "stale":
		return true
	default:
		return false
	}
}

func workflowStatus(workflow *ReleaseStatusWorkflow) string {
	if workflow == nil {
		return ""
	}
	return workflow.Status
}

func workflowConclusion(workflow *ReleaseStatusWorkflow) string {
	if workflow == nil {
		return ""
	}
	return workflow.Conclusion
}

func latestReleaseTag(latest *ReleaseStatusLatestRelease) string {
	if latest == nil {
		return ""
	}
	return latest.TagName
}

func releaseStatusTimestamp(ts github.Timestamp) string {
	if ts.Time.IsZero() {
		return ""
	}
	return ts.Time.UTC().Format(time.RFC3339)
}

func releaseStatusRate(resp *github.Response) *ReleaseStatusGitHubRate {
	if resp == nil {
		return nil
	}
	return &ReleaseStatusGitHubRate{
		Limit:     resp.Rate.Limit,
		Remaining: resp.Rate.Remaining,
		ResetAt:   releaseStatusTimestamp(resp.Rate.Reset),
	}
}
