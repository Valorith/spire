package questapi

import (
	"fmt"
	"github.com/EQEmuTools/spire/internal/env"
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/labstack/echo/v4"
	"net/http"
	"regexp"
	"strings"
)

type Controller struct {
	parser  *ParseService
	sourcer *ExamplesGithubSourcer
}

func NewController(
	parser *ParseService,
	sourcer *ExamplesGithubSourcer,
) *Controller {
	return &Controller{parser: parser, sourcer: sourcer}
}

func (d *Controller) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "quest-api/definitions", d.getQuestDefinitions, nil),
		routes.RegisterRoute(http.MethodGet, "quest-api/vscode-snippets", d.getSnippets, nil),
		routes.RegisterRoute(http.MethodPost, "quest-api/webhook-update-vscode-snippets", d.webhookVscodeSnippetsUpdate, nil),
		routes.RegisterRoute(http.MethodPost, "quest-api/refresh-definitions", d.refreshDefinitions, nil),
		routes.RegisterRoute(http.MethodPost, "quest-api/webhook-update-api", d.webhookSourceDefinitionsUpdateApi, nil),
		routes.RegisterRoute(http.MethodPost, "quest-api/webhook-update-source-examples/org/:org/repo/:repo/branch/:branch", d.webhookSourceExamplesUpdateApi, nil),
		routes.RegisterRoute(http.MethodPost, "quest-api/source-examples", d.searchConfiguredGithubExamples, nil),
		routes.RegisterRoute(
			http.MethodPost,
			"quest-api/source-examples/org/:org/repo/:repo/branch/:branch",
			d.searchGithubExamples,
			nil,
		),
	}
}

func (d *Controller) getQuestDefinitions(c echo.Context) error {
	source, err := normalizeRepositorySource(
		c.QueryParam("org"),
		c.QueryParam("repo"),
		c.QueryParam("branch"),
		DefaultDefinitionSource,
	)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	response := d.parser.ParseSource(source, false)
	if !hasQuestApiDefinitions(response) {
		return echo.NewHTTPError(http.StatusBadRequest, "the repository did not provide recognizable Quest API definitions")
	}

	return c.JSON(http.StatusOK, echo.Map{"data": response})
}

func (d *Controller) refreshDefinitions(c echo.Context) error {
	request := new(RepositorySource)
	if c.Request().ContentLength != 0 {
		if err := c.Bind(request); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
	}

	source, err := normalizeRepositorySource(request.Org, request.Repo, request.Branch, DefaultDefinitionSource)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	response := d.parser.ParseSource(source, true)
	if !hasQuestApiDefinitions(response) {
		return echo.NewHTTPError(http.StatusBadRequest, "the repository did not provide recognizable Quest API definitions")
	}

	return c.JSON(http.StatusOK, echo.Map{"data": response})
}

func (d *Controller) getSnippets(c echo.Context) error {
	return c.JSON(http.StatusOK, echo.Map{"data": d.parser.GetSnippets()})
}

type SearchTermRequest struct {
	SearchTerms []string `json:"search_terms"`
	Language    string   `json:"language"`
	Org         string   `json:"org"`
	Repo        string   `json:"repo"`
	Branch      string   `json:"branch"`
}

// searches quest examples
func (d *Controller) searchGithubExamples(c echo.Context) error {
	// body - bind
	p := new(SearchTermRequest)
	if err := c.Bind(p); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// params
	org := c.Param("org")
	repo := c.Param("repo")
	branch := c.Param("branch")

	source, err := normalizeRepositorySource(org, repo, branch, DefaultExampleSource)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// result
	return c.JSON(
		http.StatusOK,
		echo.Map{
			"data": d.sourcer.Search(source.Org, source.Repo, source.Branch, p.SearchTerms, p.Language, false),
		},
	)
}

func (d *Controller) searchConfiguredGithubExamples(c echo.Context) error {
	p := new(SearchTermRequest)
	if err := c.Bind(p); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	source, err := normalizeRepositorySource(p.Org, p.Repo, p.Branch, DefaultExampleSource)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if len(d.sourcer.Source(source.Org, source.Repo, source.Branch, false)) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "the repository did not provide readable quest code examples")
	}

	return c.JSON(http.StatusOK, echo.Map{
		"data": d.sourcer.Search(source.Org, source.Repo, source.Branch, p.SearchTerms, p.Language, false),
	})
}

func hasQuestApiDefinitions(response Response) bool {
	return len(response.PerlApi.PerlMethods) > 0 || len(response.LuaApi.LuaMethods) > 0
}

var repositorySegmentPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_.-]*$`)
var repositoryRefPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_./-]*$`)

func normalizeRepositorySource(org, repo, branch string, defaults RepositorySource) (RepositorySource, error) {
	org = strings.TrimSpace(org)
	repo = strings.TrimSuffix(strings.TrimSpace(repo), ".git")
	branch = strings.TrimSpace(branch)

	if org == "" {
		org = defaults.Org
	}
	if repo == "" {
		repo = defaults.Repo
	}
	if branch == "" {
		branch = defaults.Branch
	}

	if !repositorySegmentPattern.MatchString(org) {
		return RepositorySource{}, fmt.Errorf("invalid GitHub repository organization")
	}
	if !repositorySegmentPattern.MatchString(repo) {
		return RepositorySource{}, fmt.Errorf("invalid GitHub repository name")
	}
	if !repositoryRefPattern.MatchString(branch) || strings.Contains(branch, "..") || strings.HasPrefix(branch, "/") {
		return RepositorySource{}, fmt.Errorf("invalid GitHub branch or tag")
	}

	return RepositorySource{Org: org, Repo: repo, Branch: branch}, nil
}

// ingests a webhook from Github and updates the repo data locally
func (d *Controller) webhookSourceDefinitionsUpdateApi(c echo.Context) error {
	// todo: verify signature later

	fmt.Println("Received definitions update request...")

	isGithubRequest := c.Request().Header.Get("X-Github-Event") != "" &&
		c.Request().Header.Get("X-Github-Delivery") != ""

	if isGithubRequest && env.IsAppEnvProduction() {
		d.parser.Parse(true)
	}

	if !isGithubRequest && env.IsAppEnvLocal() {
		d.parser.Parse(true)
	}

	return c.JSON(http.StatusOK, echo.Map{"data": "Ok"})
}

// ingests a webhook from Github and updates the repo data locally
func (d *Controller) webhookVscodeSnippetsUpdate(c echo.Context) error {
	// todo: verify signature later

	fmt.Println("Received vscode quest snippets update request...")

	isGithubRequest := c.Request().Header.Get("X-Github-Event") != "" &&
		c.Request().Header.Get("X-Github-Delivery") != ""

	if isGithubRequest && env.IsAppEnvProduction() {
		d.parser.SourceSnippets("EQEmu", "spire-quest-snippets", "main", true)
	}

	if !isGithubRequest && env.IsAppEnvLocal() {
		d.parser.SourceSnippets("EQEmu", "spire-quest-snippets", "main", true)
	}

	return c.JSON(http.StatusOK, echo.Map{"data": "Ok"})
}

// ingests a webhook from Github and updates the repo data locally
func (d *Controller) webhookSourceExamplesUpdateApi(c echo.Context) error {
	// todo: verify signature later
	if c.Request().Header.Get("X-Github-Event") != "" &&
		c.Request().Header.Get("X-Github-Delivery") != "" {
		// params
		org := c.Param("org")
		repo := c.Param("repo")
		branch := c.Param("branch")

		d.sourcer.Source(org, repo, branch, true)
	}

	return c.JSON(http.StatusOK, echo.Map{"data": "Ok"})
}
