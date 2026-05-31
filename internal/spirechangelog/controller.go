package spirechangelog

import (
	"github.com/EQEmuTools/spire/internal/http/routes"
	"github.com/labstack/echo/v4"
	"net/http"
)

type Controller struct {
	service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{service: service}
}

func (a *Controller) Routes() []*routes.Route {
	return []*routes.Route{
		routes.RegisterRoute(http.MethodGet, "spirechangelog", a.getState, nil),
		routes.RegisterRoute(http.MethodPost, "spirechangelog/draft", a.generateDraft, nil),
		routes.RegisterRoute(http.MethodPost, "spirechangelog/repository", a.updateReleaseRepository, nil),
		routes.RegisterRoute(http.MethodPost, "spirechangelog/version", a.updatePackageVersion, nil),
		routes.RegisterRoute(http.MethodPost, "spirechangelog/save", a.saveRelease, nil),
		routes.RegisterRoute(http.MethodPost, "spirechangelog/content", a.saveContent, nil),
	}
}

func (a *Controller) getState(c echo.Context) error {
	state, err := a.service.LoadState()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"data": state})
}

func (a *Controller) generateDraft(c echo.Context) error {
	draft, err := a.service.GenerateDraft()
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"data": draft})
}

func (a *Controller) saveRelease(c echo.Context) error {
	var req SaveRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	state, err := a.service.SaveRelease(req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Spire changelog saved successfully",
		"data":    state,
	})
}

func (a *Controller) saveContent(c echo.Context) error {
	var req SaveContentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	state, err := a.service.SaveContent(req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "CHANGELOG.md saved successfully",
		"data":    state,
	})
}

func (a *Controller) updatePackageVersion(c echo.Context) error {
	var req UpdatePackageVersionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	state, err := a.service.UpdatePackageVersion(req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "package.json version updated successfully",
		"data":    state,
	})
}

func (a *Controller) updateReleaseRepository(c echo.Context) error {
	var req UpdateReleaseRepositoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	state, err := a.service.UpdateReleaseRepository(req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "package.json release repository updated successfully",
		"data":    state,
	})
}
