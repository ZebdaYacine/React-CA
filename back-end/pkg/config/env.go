package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// LoadEnv attempts to load a .env file, starting from the current working directory
// and walking up two parent directories. It is safe to call multiple times; the first
// readable file short-circuits the search.
func LoadEnv() error {
	candidates := []string{".env"}
	for i := 1; i <= 2; i++ {
		parent := parentPath(i)
		if parent == "" {
			continue
		}
		candidates = append(candidates, filepath.Join(parent, ".env"))
	}

	for _, path := range candidates {
		if path == "" {
			continue
		}
		if _, err := os.Stat(path); err != nil {
			continue
		}

		if err := godotenv.Load(path); err != nil {
			return fmt.Errorf("load %s: %w", path, err)
		}

		log.Printf("config: environment variables loaded from %s", path)
		return nil
	}

	return nil
}

func parentPath(level int) string {
	if level <= 0 {
		return "."
	}

	parts := make([]string, level)
	for i := 0; i < level; i++ {
		parts[i] = ".."
	}
	return filepath.Join(parts...)
}
