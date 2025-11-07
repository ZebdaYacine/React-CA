package controller

import (
	"back-end/feature/auth"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthController handles authentication-related HTTP entrypoints.
type AuthController struct {
	authService *auth.Service
}

func NewAuthController(service *auth.Service) *AuthController {
	if service == nil {
		panic("auth controller: service dependency is nil")
	}
	return &AuthController{authService: service}
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type loginResponse struct {
	Username string `json:"username"`
	Token    string `json:"token"`
}

type loginErrorResponse struct {
	Message string `json:"error"`
}

func (ac *AuthController) LoginRequest(c *gin.Context) {
	log.Println("************************ RECEIVE LOGIN REQUEST ************************")

	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, loginErrorResponse{Message: "invalid payload"})
		return
	}

	log.Printf("login attempt for user %q", req.Username)

	token, err := ac.authService.Authenticate(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, loginErrorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, loginResponse{
		Username: req.Username,
		Token:    token,
	})
}
