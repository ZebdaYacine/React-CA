package dashboard

import (
	"back-end/feature/commune"
	"strings"
	"unicode"
)

type communeInfo struct {
	Code    string
	Name    string
	Aliases []string
}

var defaultCommuneCatalog = []communeInfo{
	{Code: "0301", Name: "Laghouat"},
	{Code: "0302", Name: "Ksar El Hirane"},
	{Code: "0303", Name: "Benacer Benchohra"},
	{Code: "0304", Name: "Sidi Makhlouf"},
	{Code: "0305", Name: "Hassi Delaa", Aliases: []string{"Hassi Dalaa"}},
	{Code: "0306", Name: "Hassi R'mel"},
	{Code: "0307", Name: "Ain Madhi"},
	{Code: "0308", Name: "Tadjmout", Aliases: []string{"Tadjemout"}},
	{Code: "0309", Name: "Kheneg"},
	{Code: "0310", Name: "Gueltat Sidi Saad"},
	{Code: "0311", Name: "Ain Sidi Ali"},
	{Code: "0312", Name: "El Beidha", Aliases: []string{"Beidha"}},
	{Code: "0313", Name: "Brida"},
	{Code: "0314", Name: "El Ghicha"},
	{Code: "0315", Name: "Hadj Mechri"},
	{Code: "0316", Name: "Sebgag"},
	{Code: "0317", Name: "Taouiala"},
	{Code: "0318", Name: "Tadjerouna", Aliases: []string{"Tadjrouna"}},
	{Code: "0319", Name: "Aflou"},
	{Code: "0320", Name: "El Assafia"},
	{Code: "0321", Name: "Oued Morra"},
	{Code: "0322", Name: "Oued M'zi"},
	{Code: "0323", Name: "El Haouaita", Aliases: []string{"El Houita"}},
	{Code: "0324", Name: "Sidi Bouzid"},
}

var (
	activeCommuneCatalog = append([]communeInfo(nil), defaultCommuneCatalog...)
	communeNameToCode    = make(map[string]string, len(defaultCommuneCatalog)*2)
	communeCodeToName    = make(map[string]string, len(defaultCommuneCatalog))
	wilayaAliasToCode    = map[string]string{
		"03":       "03",
		"laghouat": "03",
	}
)

func init() {
	rebuildCommuneCatalog(defaultCommuneCatalog)
	wilayaAliasToCode["wilayadelaghouat"] = "03"
	wilayaAliasToCode["laghouatwilaya"] = "03"
}

func rebuildCommuneCatalog(catalog []communeInfo) {
	activeCommuneCatalog = append([]communeInfo(nil), catalog...)
	communeNameToCode = make(map[string]string, len(catalog)*2)
	communeCodeToName = make(map[string]string, len(catalog))

	for _, info := range catalog {
		communeCodeToName[info.Code] = info.Name
		registerCommuneAlias(info.Code, info.Name)
		registerCommuneAlias(info.Code, info.Code)
		for _, alias := range info.Aliases {
			registerCommuneAlias(info.Code, alias)
		}
	}
}

func overrideCommuneCatalog(records []commune.Commune) {
	if len(records) == 0 {
		return
	}

	custom := make([]communeInfo, 0, len(records))
	for _, record := range records {
		name := strings.TrimSpace(record.Name)
		if name == "" {
			continue
		}
		custom = append(custom, communeInfo{
			Code: strings.TrimSpace(record.Code),
			Name: name,
		})
	}

	if len(custom) == 0 {
		return
	}
	rebuildCommuneCatalog(custom)
}

func UseCommuneCatalog(records []commune.Commune) {
	overrideCommuneCatalog(records)
}

func registerCommuneAlias(code, value string) {
	key := normalizeToken(value)
	if key == "" {
		return
	}
	communeNameToCode[key] = code
}

func normalizeToken(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	var builder strings.Builder
	builder.Grow(len(value))

	for _, r := range strings.ToLower(value) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(r)
		}
	}

	return builder.String()
}

func communeCodeFromInput(value string) (string, bool) {
	normalized := normalizeToken(value)
	if normalized == "" {
		return "", false
	}

	if len(normalized) >= 4 && isDigits(normalized[:4]) {
		return normalized[:4], true
	}

	code, ok := communeNameToCode[normalized]
	return code, ok
}

func communeNameFromCode(code string) string {
	if name, ok := communeCodeToName[code]; ok {
		return name
	}
	return code
}

func knownCommuneNames() []string {
	names := make([]string, 0, len(activeCommuneCatalog))
	for _, info := range activeCommuneCatalog {
		names = append(names, info.Name)
	}
	return names
}

func isDigits(value string) bool {
	if value == "" {
		return false
	}
	for _, r := range value {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

func normalizeWilayaCode(value string) string {
	normalized := normalizeToken(value)
	if normalized == "" {
		return ""
	}

	if code, ok := wilayaAliasToCode[normalized]; ok {
		return code
	}

	digits := extractDigits(value)
	if len(digits) >= 2 {
		return digits[:2]
	}

	return ""
}

func extractDigits(value string) string {
	var builder strings.Builder
	for _, r := range value {
		if unicode.IsDigit(r) {
			builder.WriteRune(r)
		}
	}
	return builder.String()
}
