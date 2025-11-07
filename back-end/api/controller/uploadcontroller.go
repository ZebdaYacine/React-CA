package controller

import (
	"back-end/feature/upload"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UploadController struct {
	service *upload.Service
}

func NewUploadController(service *upload.Service) *UploadController {
	if service == nil {
		panic("upload controller: service dependency is nil")
	}
	return &UploadController{service: service}
}

func (uc *UploadController) UploadDashboardData(c *gin.Context) {
	type uploadField struct {
		Field    string
		Category string
		Label    string
	}

	fields := []uploadField{
		{Field: "retraitesFile", Category: "retraites", Label: "Liste des retraités"},
		{Field: "tpFile", Category: "tp", Label: "Liste des TP"},
		{Field: "communesFile", Category: "communes", Label: "Liste des communes"},
	}

	saved := make(map[string]string)
	for _, input := range fields {
		file, header, err := c.Request.FormFile(input.Field)
		if err != nil {
			if errors.Is(err, http.ErrMissingFile) {
				continue
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Impossible de lire %s: %v", input.Label, err)})
			return
		}

		filename, err := uc.service.Save(input.Category, file, header.Filename)
		file.Close()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		saved[input.Field] = filename
	}

	if len(saved) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veuillez sélectionner au moins un fichier à importer."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Fichiers importés avec succès.",
		"files":   saved,
	})
}
