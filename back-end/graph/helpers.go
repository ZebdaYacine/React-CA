package graph

import (
	"back-end/feature/dashboard"
	"back-end/graph/model"
	"math"
	"strings"
)

func clampToInt32(value int64) int32 {
	if value > math.MaxInt32 {
		return math.MaxInt32
	}
	if value < math.MinInt32 {
		return math.MinInt32
	}
	return int32(value)
}

func optionalString(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	result := trimmed
	return &result
}

func optionalInt32(value int64) *int32 {
	if value == 0 {
		return nil
	}
	val := clampToInt32(value)
	return &val
}

func mapInsuredUser(data dashboard.InsuredPerson) *model.InsuredUser {
	nom := strings.TrimSpace(data.Nom)
	prenom := strings.TrimSpace(data.Prenom)

	if nom == "" && data.FullName != "" {
		nom = strings.TrimSpace(data.FullName)
	}
	if nom == "" {
		nom = "Inconnu"
	}
	if prenom == "" {
		prenom = "-"
	}

	return &model.InsuredUser{
		Nom:           nom,
		Prenom:        prenom,
		NomPere:       optionalString(data.NomPere),
		NomMere:       optionalString(data.NomMere),
		TpSolde:       optionalInt32(data.TpSolde),
		TpGenere:      optionalInt32(data.TpGenere),
		NPension:      optionalString(data.NumPension),
		DateNaissance: optionalString(data.DateNaissance),
		DateDeces:     optionalString(data.DateDeces),
		TypeTp:        optionalString(data.TypeTP),
		Commune:       optionalString(data.Commune),
	}
}
