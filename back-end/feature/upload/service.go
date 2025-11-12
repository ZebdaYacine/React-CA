package upload

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var allowedExtensions = map[string]struct{}{
	".xls":  {},
	".xlsx": {},
}

type Service struct {
	uploadDir string
	importer  *ExcelImporter
}

func NewService(uploadDir string, importer *ExcelImporter) (*Service, error) {
	if uploadDir == "" {
		uploadDir = "uploads"
	}

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return nil, fmt.Errorf("unable to prepare upload directory %q: %w", uploadDir, err)
	}

	return &Service{uploadDir: uploadDir, importer: importer}, nil
}

func (s *Service) Save(category string, file multipart.File, originalName string) (string, error) {
	if file == nil {
		return "", fmt.Errorf("empty file for %s", category)
	}

	ext := strings.ToLower(filepath.Ext(originalName))
	if _, ok := allowedExtensions[ext]; !ok {
		return "", fmt.Errorf("format de fichier non supportǸ (%s). Utilisez .xls ou .xlsx", ext)
	}

	finalName := fmt.Sprintf("%s_%s%s", sanitize(category), time.Now().Format("20060102_150405"), ext)
	targetPath := filepath.Join(s.uploadDir, finalName)

	dst, err := os.Create(targetPath)
	if err != nil {
		return "", fmt.Errorf("impossible de crǸer le fichier %s: %w", finalName, err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("Ǹchec lors de l'enregistrement de %s: %w", finalName, err)
	}

	if err := s.processUpload(category, targetPath); err != nil {
		_ = os.Remove(targetPath)
		return "", err
	}

	return finalName, nil
}

func sanitize(value string) string {
	clean := strings.TrimSpace(value)
	clean = strings.ReplaceAll(clean, " ", "_")
	clean = strings.ReplaceAll(clean, "/", "_")
	if clean == "" {
		return "upload"
	}
	return clean
}

func (s *Service) processUpload(category, path string) error {
	if s.importer == nil {
		return nil
	}

	switch strings.ToLower(strings.TrimSpace(category)) {
	case "retraites":
		return s.importer.ImportAssure(path)
	case "tp":
		return s.importer.ImportTP(path)
	default:
		return nil
	}
}
