package config

import (
	"os"
	"strconv"
	"time"
)

const (
	defaultPort       = ":8080"
	defaultJWTSecret  = "super-secret-key"
	defaultTokenHours = 24
)

func ServerPort() string {
	if port := os.Getenv("SERVER_PORT"); port != "" {
		return port
	}
	return defaultPort
}

func JWTSecret() []byte {
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		return []byte(secret)
	}
	return []byte(defaultJWTSecret)
}

func TokenTTL() time.Duration {
	if ttl := os.Getenv("JWT_TTL_HOURS"); ttl != "" {
		if hours, err := strconv.Atoi(ttl); err == nil && hours > 0 {
			return time.Duration(hours) * time.Hour
		}
	}
	return time.Duration(defaultTokenHours) * time.Hour
}
