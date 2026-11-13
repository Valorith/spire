package user

import (
	"errors"
	"fmt"
	"github.com/EQEmuTools/spire/internal/database"
	"github.com/EQEmuTools/spire/internal/models"
	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	gocache "github.com/patrickmn/go-cache"
	"os"
	"strconv"
	"strings"
	"time"
)

type ContextMiddleware struct {
	db    *database.Resolver
	cache *gocache.Cache
}

func NewContextMiddleware(
	db *database.Resolver,
	cache *gocache.Cache,
) *ContextMiddleware {
	return &ContextMiddleware{
		db:    db,
		cache: cache,
	}
}

type jwtCustomClaims struct {
	Authorized bool   `json:"authorized"`
	UserId     string `json:"userId"`
	jwt.RegisteredClaims
}

// Validate rejects unusable identities before successHandler can load a user.
// Registered time claims are validated separately by the JWT parser.
func (c jwtCustomClaims) Validate() error {
	id, err := strconv.Atoi(c.UserId)
	if err != nil || id <= 0 {
		return errors.New("invalid JWT user ID")
	}
	return nil
}

func (m ContextMiddleware) HandleHeader() echo.MiddlewareFunc {
	return m.jwtMiddleware("header:Authorization:Bearer ", m.skipperHeader)
}

func (m ContextMiddleware) HandleQuerystring() echo.MiddlewareFunc {
	return m.jwtMiddleware("query:jwt", m.skipperQuery)
}

func (m ContextMiddleware) jwtMiddleware(tokenLookup string, skipper middleware.Skipper) echo.MiddlewareFunc {
	key := []byte(os.Getenv("JWT_SECRET_KEY"))
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithIssuedAt())
	return echojwt.WithConfig(echojwt.Config{
		SuccessHandler: m.successHandler,
		TokenLookup:    tokenLookup,
		Skipper:        skipper,
		ParseTokenFunc: func(_ echo.Context, token string) (interface{}, error) {
			// Keep HS256 and legacy issued-at validation explicit. Allocate claims
			// per request so concurrent requests cannot share an identity.
			return parser.ParseWithClaims(token, &jwtCustomClaims{}, func(_ *jwt.Token) (interface{}, error) {
				return key, nil
			})
		},
	})
}

func (m ContextMiddleware) skipperHeader(c echo.Context) bool {
	// Skip JWT signature validation if authenticated with basic auth
	scheme, _, _ := strings.Cut(c.Request().Header.Get("Authorization"), " ")
	if strings.EqualFold(scheme, "Basic") {
		return true
	}

	// If we send an authorization header then we will go through our JWT signature validation logic
	if c.Request().Header.Get("Authorization") != "" {
		return false
	}

	// When we don't send an authorization header, we assume that the request
	// is not an authenticated user we will simply use the local default
	// PEQ database instance

	return true
}

func (m ContextMiddleware) skipperQuery(c echo.Context) bool {
	// If we send a query param header then we will go through our JWT signature validation logic
	if c.QueryParam("jwt") != "" {
		return false
	}

	// When we don't send an authorization header, we assume that the request
	// is not an authenticated user we will simply use the local default
	// PEQ database instance

	return true
}

func (m ContextMiddleware) successHandler(c echo.Context) {
	// signature validation
	user := c.Get("user").(*jwt.Token)
	claims := user.Claims.(*jwtCustomClaims)
	userId, _ := strconv.Atoi(claims.UserId) // checked by jwtCustomClaims.Validate

	// cache user context for 10 minutes to refrain from repeated DB hits
	userKey := fmt.Sprintf("user-%v", userId)
	cachedUser, found := m.cache.Get(userKey)
	if found {
		c.Set("user", cachedUser)
		return
	}

	// fetch user if not in cache and set in request context
	var dbUser models.User
	m.db.GetSpireDb().Find(&dbUser, userId)
	if dbUser.ID > 0 {
		c.Set("user", dbUser)
		m.cache.Set(userKey, dbUser, 10*time.Minute)
	}
}
