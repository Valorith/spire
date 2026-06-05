package spirechangelog

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/EQEmuTools/spire/internal/env"
	"github.com/EQEmuTools/spire/internal/release"
	"github.com/patrickmn/go-cache"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

var releaseHeadingRegexp = regexp.MustCompile(`(?m)^## \[([^\]]+)\] ([^\n]+)$`)
var packageVersionRegexp = regexp.MustCompile(`(?m)("version"\s*:\s*")([^"]+)(")`)
var packageSpireReleaseRepositoryRegexp = regexp.MustCompile(`(?s)("spire"\s*:\s*\{[^}]*"release_repository"\s*:\s*")([^"]+)(")`)
var packageSpireEmptyObjectRegexp = regexp.MustCompile(`(?s)("spire"\s*:\s*)\{\s*\}`)
var packageSpireObjectOpenRegexp = regexp.MustCompile(`(?s)("spire"\s*:\s*\{)`)
var semverRegexp = regexp.MustCompile(`^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$`)
var tokenLikeSecretRegexp = regexp.MustCompile(`(?i)(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,})`)

const spireReleaseBranch = "master"

type Service struct {
	cache *cache.Cache
}

type ReleaseSection struct {
	Version     string `json:"version"`
	ReleaseDate string `json:"release_date"`
	Body        string `json:"body"`
}

type ReleasePayload struct {
	Version     string `json:"version"`
	TagName     string `json:"tag_name"`
	Title       string `json:"title"`
	Body        string `json:"body"`
	ReleaseDate string `json:"release_date"`
}

type LoadState struct {
	Content                     string         `json:"content"`
	PackageVersion              string         `json:"package_version"`
	ReleaseRepository           string         `json:"release_repository"`
	ConfiguredReleaseRepository string         `json:"configured_release_repository"`
	ReleaseRepositorySource     string         `json:"release_repository_source"`
	ReleaseRepositoryOverride   string         `json:"release_repository_override"`
	ReleaseRepositoryCandidates []string       `json:"release_repository_candidates"`
	ReleaseBranch               string         `json:"release_branch"`
	CurrentBranch               string         `json:"current_branch"`
	Writable                    bool           `json:"writable"`
	Source                      string         `json:"source"`
	TopRelease                  ReleaseSection `json:"top_release"`
	ReleasePayload              ReleasePayload `json:"release_payload"`
	ValidationErrors            []string       `json:"validation_errors"`
}

type DraftResult struct {
	Body        string `json:"body"`
	LatestTag   string `json:"latest_tag"`
	CommitCount int    `json:"commit_count"`
}

type SaveRequest struct {
	Version     string `json:"version"`
	ReleaseDate string `json:"release_date"`
	Body        string `json:"body"`
}

type SaveContentRequest struct {
	Content string `json:"content"`
}

type UpdatePackageVersionRequest struct {
	Version string `json:"version"`
}

type UpdateReleaseRepositoryRequest struct {
	Repository string `json:"repository"`
}

func NewService(cache *cache.Cache) *Service {
	return &Service{cache: cache}
}

func (s *Service) LoadState() (*LoadState, error) {
	content, source, err := s.ReadChangelog()
	if err != nil {
		return nil, err
	}

	packageVersion, err := s.ReadPackageVersion()
	if err != nil {
		return nil, err
	}

	packageJSONRaw, _, err := s.readPackageJSON()
	if err != nil {
		return nil, err
	}

	releaseResolution := release.ResolveRepositoryDetails(
		os.Getenv("SPIRE_RELEASE_REPO"),
		packageJSONRaw,
		s.gitRemoteLookup(),
	)
	configuredRepo := release.RepositoryFromPackageJSON(packageJSONRaw)

	state := &LoadState{
		Content:                     content,
		PackageVersion:              packageVersion,
		ReleaseRepository:           releaseResolution.Repository,
		ConfiguredReleaseRepository: configuredRepo,
		ReleaseRepositorySource:     releaseResolution.Source,
		ReleaseRepositoryOverride:   release.NormalizeGitHubRepository(os.Getenv("SPIRE_RELEASE_REPO")),
		ReleaseRepositoryCandidates: s.releaseRepositoryCandidates(packageJSONRaw),
		ReleaseBranch:               spireReleaseBranch,
		CurrentBranch:               s.currentGitBranch(),
		Writable:                    s.IsWritable(),
		Source:                      source,
		TopRelease:                  s.ParseTopRelease(content),
		ReleasePayload:              s.BuildReleasePayload(s.ParseTopRelease(content)),
		ValidationErrors:            s.ValidateCurrentDocument(content, packageVersion),
	}

	return state, nil
}

func (s *Service) ReadChangelog() (string, string, error) {
	if path, ok := s.liveChangelogPath(); ok {
		body, err := os.ReadFile(path)
		if err == nil {
			return string(body), "live", nil
		}
	}

	changelog, ok := s.cache.Get("changelog")
	if !ok {
		return "", "", errors.New("embedded changelog unavailable")
	}

	value, ok := changelog.(string)
	if !ok {
		return "", "", errors.New("embedded changelog has unexpected type")
	}

	return value, "embedded", nil
}

func (s *Service) ReadPackageVersion() (string, error) {
	raw, _, err := s.readPackageJSON()
	if err != nil {
		return "", err
	}

	var payload struct {
		Version string `json:"version"`
	}

	if err := json.Unmarshal(raw, &payload); err != nil {
		return "", err
	}

	return strings.TrimSpace(payload.Version), nil
}

func (s *Service) readPackageJSON() ([]byte, string, error) {
	if path, ok := s.livePackageJSONPath(); ok {
		body, err := os.ReadFile(path)
		if err == nil {
			return body, "live", nil
		}
	}

	pkgJSON, ok := s.cache.Get("packageJson")
	if !ok {
		return nil, "", errors.New("embedded package.json unavailable")
	}

	value, ok := pkgJSON.([]byte)
	if !ok {
		return nil, "", errors.New("embedded package.json has unexpected type")
	}

	return value, "embedded", nil
}

func (s *Service) IsWritable() bool {
	path, ok := s.liveChangelogPath()
	if !ok {
		return false
	}

	f, err := os.OpenFile(path, os.O_WRONLY, 0)
	if err != nil {
		return false
	}
	_ = f.Close()

	return true
}

func (s *Service) GenerateDraft() (*DraftResult, error) {
	root, ok := s.projectRoot()
	if !ok {
		return nil, errors.New("local repository checkout not detected")
	}

	latestTag, _ := s.latestLocalTag(root)
	rangeSpec := "HEAD"
	if latestTag != "" {
		rangeSpec = fmt.Sprintf("%s..HEAD", latestTag)
	}

	subjects, err := s.gitLines(root, "log", rangeSpec, "--pretty=format:%s", "--no-merges")
	if err != nil {
		return nil, err
	}

	seen := map[string]struct{}{}
	var bullets []string
	for _, subject := range subjects {
		normalized, keep := normalizeDraftSubject(subject)
		if !keep {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		bullets = append(bullets, fmt.Sprintf("* %s", normalized))
	}

	if len(bullets) == 0 {
		bullets = []string{"* Add release notes here."}
	}

	return &DraftResult{
		Body:        strings.Join(bullets, "\n"),
		LatestTag:   latestTag,
		CommitCount: len(bullets),
	}, nil
}

func (s *Service) UpdatePackageVersion(req UpdatePackageVersionRequest) (*LoadState, error) {
	path, ok := s.livePackageJSONPath()
	if !ok {
		return nil, errors.New("live package.json is unavailable in this environment")
	}

	version := strings.TrimSpace(req.Version)
	if version == "" {
		return nil, errors.New("Version is required.")
	}
	if !isValidVersion(version) {
		return nil, errors.New("Version must use semantic version format, such as 4.23.6.")
	}

	raw, _, err := s.readPackageJSON()
	if err != nil {
		return nil, err
	}

	updated, changed, err := setPackageVersion(raw, version)
	if err != nil {
		return nil, err
	}
	if changed {
		if err := writeFileAtomically(path, string(updated)); err != nil {
			return nil, err
		}
	}

	return s.LoadState()
}

func (s *Service) UpdateReleaseRepository(req UpdateReleaseRepositoryRequest) (*LoadState, error) {
	path, ok := s.livePackageJSONPath()
	if !ok {
		return nil, errors.New("live package.json is unavailable in this environment")
	}

	repository := release.NormalizeGitHubRepository(req.Repository)
	if repository == "" {
		return nil, errors.New("Release repository must use owner/repo format or a GitHub repository URL.")
	}

	raw, _, err := s.readPackageJSON()
	if err != nil {
		return nil, err
	}

	updated, changed, err := setPackageRepository(raw, repository)
	if err != nil {
		return nil, err
	}
	if changed {
		if err := writeFileAtomically(path, string(updated)); err != nil {
			return nil, err
		}
	}

	return s.LoadState()
}

func (s *Service) SaveRelease(req SaveRequest) (*LoadState, error) {
	path, ok := s.liveChangelogPath()
	if !ok {
		return nil, errors.New("live CHANGELOG.md is unavailable in this environment")
	}

	if !s.IsWritable() {
		return nil, errors.New("CHANGELOG.md is read-only in this environment")
	}

	currentContent, _, err := s.ReadChangelog()
	if err != nil {
		return nil, err
	}

	packagePath, packagePathExists := s.livePackageJSONPath()
	if !packagePathExists {
		return nil, errors.New("live package.json is unavailable in this environment")
	}

	packageRaw, _, err := s.readPackageJSON()
	if err != nil {
		return nil, err
	}

	packageVersion, err := s.ReadPackageVersion()
	if err != nil {
		return nil, err
	}

	validationErrors := s.ValidateProposedRelease(req, currentContent, packageVersion, true)
	if len(validationErrors) > 0 {
		return nil, errors.New(strings.Join(validationErrors, "\n"))
	}

	newSection := BuildReleaseSection(req.Version, req.ReleaseDate, req.Body)
	updatedContent := strings.TrimSpace(newSection)
	if strings.TrimSpace(currentContent) != "" {
		updatedContent += "\n\n" + strings.TrimLeft(currentContent, "\n")
	}
	updatedContent += "\n"

	updatedPackage := packageRaw
	packageChanged := false
	if strings.TrimSpace(req.Version) != packageVersion {
		updatedPackage, packageChanged, err = setPackageVersion(packageRaw, strings.TrimSpace(req.Version))
		if err != nil {
			return nil, err
		}
	}

	if packageChanged {
		if err := writeFileAtomically(packagePath, string(updatedPackage)); err != nil {
			return nil, err
		}
	}

	if err := writeFileAtomically(path, updatedContent); err != nil {
		if packageChanged {
			if rollbackErr := writeFileAtomically(packagePath, string(packageRaw)); rollbackErr != nil {
				return nil, fmt.Errorf("%v (rollback package.json failed: %v)", err, rollbackErr)
			}
		}
		return nil, err
	}

	return s.LoadState()
}

func (s *Service) SaveContent(req SaveContentRequest) (*LoadState, error) {
	path, ok := s.liveChangelogPath()
	if !ok {
		return nil, errors.New("live CHANGELOG.md is unavailable in this environment")
	}

	if !s.IsWritable() {
		return nil, errors.New("CHANGELOG.md is read-only in this environment")
	}

	content := req.Content
	if strings.TrimSpace(content) == "" {
		return nil, errors.New("CHANGELOG.md content is required")
	}
	if containsTokenLikeSecret(content) {
		return nil, errors.New(tokenLikeSecretIssue())
	}

	if !strings.HasSuffix(content, "\n") {
		content += "\n"
	}

	if err := writeFileAtomically(path, content); err != nil {
		return nil, err
	}

	return s.LoadState()
}

func (s *Service) ValidateCurrentDocument(content string, packageVersion string) []string {
	var issues []string
	if containsTokenLikeSecret(content) {
		issues = append(issues, tokenLikeSecretIssue())
	}

	top := s.ParseTopRelease(content)
	if top.Version == "" {
		issues = append(issues, "Unable to parse the top changelog release heading.")
	} else {
		if strings.TrimSpace(top.Body) == "" {
			issues = append(issues, "The top changelog release section is empty.")
		}
		if packageVersion != "" && top.Version != packageVersion && !strings.EqualFold(top.Version, "Unreleased") {
			issues = append(issues, fmt.Sprintf("Top changelog version [%s] does not match package.json version [%s].", top.Version, packageVersion))
		}
	}

	duplicates := duplicateVersions(s.ListVersions(content))
	for _, duplicate := range duplicates {
		issues = append(issues, fmt.Sprintf("Duplicate changelog version [%s] detected.", duplicate))
	}

	return issues
}

func (s *Service) ValidateProposedRelease(req SaveRequest, currentContent string, packageVersion string, allowPackageVersionUpdate bool) []string {
	var issues []string

	version := strings.TrimSpace(req.Version)
	releaseDate := strings.TrimSpace(req.ReleaseDate)
	body := strings.TrimSpace(req.Body)

	if version == "" {
		issues = append(issues, "Version is required.")
	} else if !isValidVersion(version) {
		issues = append(issues, "Version must use semantic version format, such as 4.23.6.")
	}
	if releaseDate == "" {
		issues = append(issues, "Release date is required.")
	} else if !isValidReleaseDate(releaseDate) {
		issues = append(issues, "Release date must use M/D/YYYY format.")
	}
	if body == "" {
		issues = append(issues, "Release notes body is required.")
	}
	if containsTokenLikeSecret(body) {
		issues = append(issues, tokenLikeSecretIssue())
	}
	if packageVersion != "" && version != packageVersion && !allowPackageVersionUpdate {
		issues = append(issues, fmt.Sprintf("Version [%s] does not match package.json version [%s].", version, packageVersion))
	}
	if version != "" && containsVersion(s.ListVersions(currentContent), version) {
		issues = append(issues, fmt.Sprintf("Changelog version [%s] already exists.", version))
	}

	return issues
}

func (s *Service) ParseTopRelease(content string) ReleaseSection {
	matches := releaseHeadingRegexp.FindAllStringSubmatchIndex(content, -1)
	if len(matches) == 0 {
		return ReleaseSection{}
	}

	first := matches[0]
	nextStart := len(content)
	if len(matches) > 1 {
		nextStart = matches[1][0]
	}

	return ReleaseSection{
		Version:     content[first[2]:first[3]],
		ReleaseDate: strings.TrimSpace(content[first[4]:first[5]]),
		Body:        strings.TrimSpace(content[first[1]:nextStart]),
	}
}

func (s *Service) BuildReleasePayload(release ReleaseSection) ReleasePayload {
	version := strings.TrimSpace(release.Version)
	if version == "" || strings.EqualFold(version, "Unreleased") {
		return ReleasePayload{}
	}

	releaseDate := strings.TrimSpace(release.ReleaseDate)
	body := BuildReleaseSection(version, releaseDate, release.Body)

	return ReleasePayload{
		Version:     version,
		TagName:     fmt.Sprintf("v%s", version),
		Title:       fmt.Sprintf("Spire v%s", version),
		Body:        body,
		ReleaseDate: releaseDate,
	}
}

func (s *Service) ListVersions(content string) []string {
	matches := releaseHeadingRegexp.FindAllStringSubmatch(content, -1)
	versions := make([]string, 0, len(matches))
	for _, match := range matches {
		if len(match) > 1 {
			versions = append(versions, strings.TrimSpace(match[1]))
		}
	}
	return versions
}

func BuildReleaseSection(version string, releaseDate string, body string) string {
	return fmt.Sprintf("## [%s] %s\n\n%s", strings.TrimSpace(version), strings.TrimSpace(releaseDate), strings.TrimSpace(body))
}

func containsTokenLikeSecret(value string) bool {
	return tokenLikeSecretRegexp.MatchString(value)
}

func tokenLikeSecretIssue() string {
	return "CHANGELOG.md appears to contain a token-like secret. Remove it before saving or publishing release notes."
}

func writeFileAtomically(path string, content string) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	tmpFile, err := os.CreateTemp(dir, ".spire-changelog-*")
	if err != nil {
		return err
	}

	tmpName := tmpFile.Name()
	defer os.Remove(tmpName)

	if err := tmpFile.Chmod(info.Mode()); err != nil {
		_ = tmpFile.Close()
		return err
	}
	if _, err := tmpFile.WriteString(content); err != nil {
		_ = tmpFile.Close()
		return err
	}
	if err := tmpFile.Close(); err != nil {
		return err
	}

	return os.Rename(tmpName, path)
}

func (s *Service) projectRoot() (string, bool) {
	cwd, err := os.Getwd()
	if err == nil {
		for dir := cwd; dir != filepath.Dir(dir); dir = filepath.Dir(dir) {
			if fileExists(filepath.Join(dir, "CHANGELOG.md")) && fileExists(filepath.Join(dir, "package.json")) {
				return dir, true
			}
		}
	}

	return "", false
}

func (s *Service) liveChangelogPath() (string, bool) {
	if !s.prefersLiveFiles() {
		return "", false
	}

	root, ok := s.projectRoot()
	if !ok {
		return "", false
	}

	path := filepath.Join(root, "CHANGELOG.md")
	if !fileExists(path) {
		return "", false
	}

	return path, true
}

func (s *Service) livePackageJSONPath() (string, bool) {
	if !s.prefersLiveFiles() {
		return "", false
	}

	root, ok := s.projectRoot()
	if !ok {
		return "", false
	}

	path := filepath.Join(root, "package.json")
	if !fileExists(path) {
		return "", false
	}

	return path, true
}

func (s *Service) prefersLiveFiles() bool {
	switch env.Get("APP_ENV", "local") {
	case "local", "dev", "testing":
		return true
	default:
		return false
	}
}

func (s *Service) gitRemoteLookup() release.RemoteLookup {
	root, ok := s.projectRoot()
	if !ok {
		return nil
	}

	return func(name string) (string, error) {
		lines, err := s.gitLines(root, "remote", "get-url", name)
		if err != nil {
			return "", err
		}
		if len(lines) == 0 {
			return "", errors.New("git remote not found")
		}
		return lines[0], nil
	}
}

func (s *Service) currentGitBranch() string {
	root, ok := s.projectRoot()
	if !ok {
		return ""
	}

	lines, err := s.gitLines(root, "branch", "--show-current")
	if err == nil && len(lines) > 0 {
		return strings.TrimSpace(lines[0])
	}

	lines, err = s.gitLines(root, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil || len(lines) == 0 {
		return ""
	}

	return strings.TrimSpace(lines[0])
}

func (s *Service) releaseRepositoryCandidates(packageJSONRaw []byte) []string {
	candidates := make([]string, 0, 4)
	seen := make(map[string]struct{}, 4)
	addCandidate := func(value string) {
		repo := release.NormalizeGitHubRepository(value)
		if repo == "" {
			return
		}
		if _, ok := seen[repo]; ok {
			return
		}
		seen[repo] = struct{}{}
		candidates = append(candidates, repo)
	}

	addCandidate(os.Getenv("SPIRE_RELEASE_REPO"))
	addCandidate(release.RepositoryFromPackageJSON(packageJSONRaw))

	if lookup := s.gitRemoteLookup(); lookup != nil {
		for _, remoteName := range []string{"upstream", "origin"} {
			remoteURL, err := lookup(remoteName)
			if err != nil {
				continue
			}
			addCandidate(remoteURL)
		}
	}

	addCandidate(release.DefaultRepository)
	return candidates
}

func (s *Service) latestLocalTag(root string) (string, error) {
	lines, err := s.gitLines(root, "tag", "--list", "v*", "--sort=-version:refname")
	if err != nil {
		return "", err
	}
	if len(lines) == 0 {
		return "", nil
	}
	return lines[0], nil
}

func (s *Service) gitLines(root string, args ...string) ([]string, error) {
	cmd := exec.Command("git", append([]string{"-C", root}, args...)...)
	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("git %s failed: %s", strings.Join(args, " "), strings.TrimSpace(string(exitErr.Stderr)))
		}
		return nil, err
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(lines) == 1 && lines[0] == "" {
		return []string{}, nil
	}
	return lines, nil
}

func duplicateVersions(versions []string) []string {
	counts := make(map[string]int, len(versions))
	for _, version := range versions {
		counts[version]++
	}

	var duplicates []string
	for version, count := range counts {
		if count > 1 {
			duplicates = append(duplicates, version)
		}
	}
	sort.Strings(duplicates)

	return duplicates
}

func containsVersion(versions []string, target string) bool {
	for _, version := range versions {
		if version == target {
			return true
		}
	}
	return false
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func isValidReleaseDate(v string) bool {
	matched, _ := regexp.MatchString(`^\d{1,2}/\d{1,2}/\d{4}$`, strings.TrimSpace(v))
	return matched
}

func isValidVersion(v string) bool {
	return semverRegexp.MatchString(strings.TrimSpace(v))
}

func setPackageVersion(raw []byte, version string) ([]byte, bool, error) {
	if len(raw) == 0 {
		return nil, false, errors.New("package.json content is empty")
	}

	updated := packageVersionRegexp.ReplaceAllString(string(raw), `${1}`+version+`${3}`)
	if updated == string(raw) {
		if !packageVersionRegexp.MatchString(string(raw)) {
			return nil, false, errors.New("Unable to locate package.json version field.")
		}
		return raw, false, nil
	}

	return []byte(updated), true, nil
}

func setPackageRepository(raw []byte, repository string) ([]byte, bool, error) {
	if len(raw) == 0 {
		return nil, false, errors.New("package.json content is empty")
	}

	repository = release.NormalizeGitHubRepository(repository)
	if repository == "" {
		return nil, false, errors.New("Release repository must use owner/repo format or a GitHub repository URL.")
	}

	content := string(raw)

	if packageSpireReleaseRepositoryRegexp.MatchString(content) {
		updated := packageSpireReleaseRepositoryRegexp.ReplaceAllString(content, `${1}`+repository+`${3}`)
		if updated == content {
			return raw, false, nil
		}
		return []byte(updated), true, nil
	}

	if packageSpireEmptyObjectRegexp.MatchString(content) {
		updated := packageSpireEmptyObjectRegexp.ReplaceAllString(
			content,
			fmt.Sprintf(`${1}{
    "release_repository": "%s"
  }`, repository),
		)
		if updated == content {
			return raw, false, nil
		}
		return []byte(updated), true, nil
	}

	if packageSpireObjectOpenRegexp.MatchString(content) {
		updated := packageSpireObjectOpenRegexp.ReplaceAllString(
			content,
			fmt.Sprintf(`${1}
    "release_repository": "%s",`, repository),
		)
		if updated == content {
			return raw, false, nil
		}
		return []byte(updated), true, nil
	}

	if packageVersionRegexp.MatchString(content) {
		spireBlock := fmt.Sprintf("${1}${2}${3},\n  \"spire\": {\n    \"release_repository\": \"%s\"\n  }", repository)
		updated := packageVersionRegexp.ReplaceAllString(content, spireBlock)
		if updated == content {
			return raw, false, nil
		}
		return []byte(updated), true, nil
	}

	return nil, false, errors.New("Unable to locate package.json version field.")
}

func normalizeDraftSubject(subject string) (string, bool) {
	s := strings.TrimSpace(subject)
	if s == "" {
		return "", false
	}

	lower := strings.ToLower(s)
	if strings.HasPrefix(s, "Merge ") ||
		strings.HasPrefix(lower, "release ") ||
		strings.HasPrefix(lower, "bump version") ||
		strings.HasPrefix(lower, "update changelog") ||
		strings.HasPrefix(lower, "changelog:") {
		return "", false
	}

	if regexp.MustCompile(`^Update .+\.(go|ts|js|vue|md|ya?ml|json|css|scss)$`).MatchString(s) {
		return "", false
	}

	replacements := map[string]string{
		"fix: ":      "Fix ",
		"feat: ":     "",
		"docs: ":     "",
		"refactor: ": "",
		"chore: ":    "",
	}

	for prefix, replacement := range replacements {
		if strings.HasPrefix(lower, prefix) {
			s = replacement + strings.TrimSpace(s[len(prefix):])
			break
		}
	}

	if s == "" {
		return "", false
	}

	return strings.ToUpper(s[:1]) + s[1:], true
}
