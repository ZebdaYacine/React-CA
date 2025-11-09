package router

import (
	"back-end/api/controller"
	"back-end/feature/auth"
	"net/http"
	"strings"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Config struct {
	Engine           *gin.Engine
	GraphQLServer    *handler.Server
	AuthService      *auth.Service
	UploadController *controller.UploadController
}

func Setup(cfg Config) {
	if cfg.Engine == nil || cfg.GraphQLServer == nil || cfg.AuthService == nil || cfg.UploadController == nil {
		panic("router: missing required dependencies")
	}

	authController := controller.NewAuthController(cfg.AuthService)

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"*"}
	corsConfig.AllowMethods = []string{http.MethodGet, http.MethodPost, http.MethodOptions}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	corsConfig.AllowCredentials = true
	cfg.Engine.Use(cors.New(corsConfig))

	cfg.Engine.GET("/", gin.WrapH(playground.Handler("GraphQL Playground", "/query")))
	cfg.Engine.Any("/query", gin.WrapH(cfg.GraphQLServer))
	cfg.Engine.POST(
		"/upload/dashboard-data",
		requireAdmin(cfg.AuthService),
		cfg.UploadController.UploadDashboardData,
	)

	authGroup := cfg.Engine.Group("/auth")
	{
		authGroup.POST("/login", authController.LoginRequest)
		authGroup.POST("/logout", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
		})
	}
}

func requireAdmin(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token requis"})
			return
		}

		token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer"))
		claims, err := authService.ValidateToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token invalide"})
			return
		}

		if claims == nil || !strings.EqualFold(claims.Role, "admin") {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "access restricted to administrator"})
			return
		}

		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}
