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

	defaultDBMaxIdleConns       = 5
	defaultDBMaxOpenConns       = 10
	defaultDBConnMaxLifetimeMin = 5
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

func DatabaseDSN() string {
	return os.Getenv("DB_DSN")
}

func DatabaseMaxIdleConns() int {
	return positiveIntFromEnv("DB_MAX_IDLE_CONNS", defaultDBMaxIdleConns)
}

func DatabaseMaxOpenConns() int {
	return positiveIntFromEnv("DB_MAX_OPEN_CONNS", defaultDBMaxOpenConns)
}

func DatabaseConnMaxLifetime() time.Duration {
	minutes := positiveIntFromEnv("DB_CONN_MAX_LIFETIME_MIN", defaultDBConnMaxLifetimeMin)
	return time.Duration(minutes) * time.Minute
}

func positiveIntFromEnv(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if parsed, err := strconv.Atoi(val); err == nil && parsed > 0 {
			return parsed
		}
	}
	return fallback
}
