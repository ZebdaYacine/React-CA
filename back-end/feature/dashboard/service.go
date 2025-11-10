package dashboard

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"back-end/feature/commune"

	"gorm.io/gorm"
)

const (
	pensionViewName         = "PENSION_ETEINTE"
	defaultInsuredRowsLimit = 1000
	pensionTableAlias       = "pe"
)

var (
	defaultTpTypes = []string{"Mensuel", "Trimestriel", "Exceptionnel"}

	ErrUnknownCommune = errors.New("dashboard: unknown commune")
)

type CommuneStore interface {
	List(ctx context.Context) ([]commune.Commune, error)
}

type Service struct {
	db         *gorm.DB
	communes   CommuneStore
	assureCols assureColumns
}

type Summary struct {
	TotalGenere int64
	TotalSolde  int64
}

type MonthlyStat struct {
	Month    time.Month
	TpGenere int64
	TpSolde  int64
}

type InsuredPerson struct {
	NumPension    string
	Nom           string
	Prenom        string
	FullName      string
	NomPere       string
	NomMere       string
	TypeTP        string
	Commune       string
	TpGenere      int64
	TpSolde       int64
	DateNaissance string
	DateDeces     string
}

type FilterOptions struct {
	Years    []int
	Communes []string
	TpTypes  []string
}

type queryFilters struct {
	Year        int
	WilayaCode  string
	CommuneCode string
}

func NewService(db *gorm.DB, communes CommuneStore) *Service {
	if db == nil {
		panic("dashboard service: nil database handle")
	}
	cols := detectAssureColumns(context.Background(), db)
	return &Service{db: db, communes: communes, assureCols: cols}
}

func (s *Service) TpSummary(ctx context.Context, year int, wilaya, commune string) (*Summary, error) {
	if year <= 0 {
		return nil, fmt.Errorf("dashboard: invalid year %d", year)
	}

	filters, err := newQueryFilters(year, wilaya, commune)
	if err != nil {
		return nil, err
	}

	whereClause, args := filters.whereClause(true)
	baseQuery := fmt.Sprintf(`SELECT COALESCE(SUM(Mont_TP), 0) AS total_genere,
		COALESCE(SUM(Solde_TP), 0) AS total_solde FROM %s`, pensionTableExpr())
	query := applyWhere(baseQuery, whereClause)

	var row struct {
		TotalGenere sql.NullFloat64 `gorm:"column:total_genere"`
		TotalSolde  sql.NullFloat64 `gorm:"column:total_solde"`
	}

	if err := s.db.WithContext(ctx).Raw(query, args...).Scan(&row).Error; err != nil {
		return nil, fmt.Errorf("dashboard: compute TP summary: %w", err)
	}

	return &Summary{
		TotalGenere: roundCurrency(row.TotalGenere),
		TotalSolde:  roundCurrency(row.TotalSolde),
	}, nil
}

func (s *Service) TpByMonth(ctx context.Context, year int, wilaya, commune string) ([]MonthlyStat, error) {
	if year <= 0 {
		return nil, fmt.Errorf("dashboard: invalid year %d", year)
	}

	filters, err := newQueryFilters(year, wilaya, commune)
	if err != nil {
		return nil, err
	}

	whereClause, args := filters.whereClause(true)
	dateExpr := dateColumnExpr(aliasedColumn("Date_Creation_TP"))
	baseQuery := fmt.Sprintf(`SELECT
		MONTH(%s) AS month_value,
		COALESCE(SUM(Mont_TP), 0) AS total_genere,
		COALESCE(SUM(Solde_TP), 0) AS total_solde
		FROM %s`, dateExpr, pensionTableExpr())
	query := applyWhere(baseQuery, whereClause) + " GROUP BY month_value ORDER BY month_value"

	var rows []struct {
		Month       sql.NullInt64   `gorm:"column:month_value"`
		TotalGenere sql.NullFloat64 `gorm:"column:total_genere"`
		TotalSolde  sql.NullFloat64 `gorm:"column:total_solde"`
	}

	if err := s.db.WithContext(ctx).Raw(query, args...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("dashboard: compute TP by month: %w", err)
	}

	byMonth := make(map[int]MonthlyStat, len(rows))
	for _, row := range rows {
		if !row.Month.Valid {
			continue
		}
		monthIndex := int(row.Month.Int64)
		if monthIndex < 1 || monthIndex > 12 {
			continue
		}
		byMonth[monthIndex] = MonthlyStat{
			Month:    time.Month(monthIndex),
			TpGenere: roundCurrency(row.TotalGenere),
			TpSolde:  roundCurrency(row.TotalSolde),
		}
	}

	result := make([]MonthlyStat, 0, 12)
	for i := 1; i <= 12; i++ {
		if stat, ok := byMonth[i]; ok {
			result = append(result, stat)
			continue
		}
		result = append(result, MonthlyStat{Month: time.Month(i)})
	}
	return result, nil
}

func (s *Service) InsuredUsers(ctx context.Context, year int, wilaya, commune string, limit int) ([]InsuredPerson, error) {
	filters, err := newQueryFilters(year, wilaya, commune)
	if err != nil {
		return nil, err
	}

	whereClause, args := filters.whereClause(year > 0)
	if limit <= 0 {
		limit = defaultInsuredRowsLimit
	}

	columns := []string{
		aliasedColumn("Num_Pension"),
		aliasedColumn("Nom_Prenom"),
		aliasedColumn("CODE_COM"),
		aliasedColumn("Type_TP"),
		aliasedColumn("Mont_TP"),
		aliasedColumn("Solde_TP"),
		aliasedColumn("Date_Creation_TP"),
		aliasedColumn("Date_Deb_TP"),
		aliasedColumn("Date_Fin_TP"),
		s.assureColumnSelect(s.assureCols.NomPere, "Nom_Pere"),
		s.assureColumnSelect(s.assureCols.NomMere, "Nom_Mere"),
		s.assureColumnSelect(s.assureCols.DateNaissance, "Date_Naissance"),
	}

	baseQuery := fmt.Sprintf(`SELECT
		%s
		FROM %s
		%s`, strings.Join(columns, ",\n\t"), pensionTableExpr(), s.assureJoinClause())
	query := applyWhere(baseQuery, whereClause) + fmt.Sprintf(" ORDER BY %s DESC LIMIT ?", aliasedColumn("Date_Creation_TP"))
	args = append(args, limit)

	var rows []pensionRow
	if err := s.db.WithContext(ctx).Raw(query, args...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("dashboard: list insured users: %w", err)
	}

	records := make([]InsuredPerson, 0, len(rows))
	for _, row := range rows {
		numPension := stringFromNull(row.NumPension)
		fullName := strings.TrimSpace(stringFromNull(row.NomPrenom))
		nom, prenom := splitFullName(fullName)

		records = append(records, InsuredPerson{
			NumPension:    numPension,
			Nom:           nom,
			Prenom:        prenom,
			FullName:      fullName,
			NomPere:       stringFromNull(row.NomPere),
			NomMere:       stringFromNull(row.NomMere),
			TypeTP:        stringFromNull(row.TypeTP),
			Commune:       communeNameFromCode(stringFromNull(row.CodeCom)),
			TpGenere:      roundCurrency(row.MontTP),
			TpSolde:       roundCurrency(row.SoldeTP),
			DateNaissance: stringFromNull(row.DateNaissance),
			DateDeces:     "",
		})
	}

	return records, nil
}

func (s *Service) FilterOptions(ctx context.Context) (*FilterOptions, error) {
	years, err := s.fetchYears(ctx)
	if err != nil {
		return nil, err
	}
	communes, err := s.fetchCommunes(ctx)
	if err != nil {
		return nil, err
	}
	tpTypes, err := s.fetchTpTypes(ctx)
	if err != nil {
		return nil, err
	}

	if len(communes) == 0 {
		communes = knownCommuneNames()
	}
	if len(tpTypes) == 0 {
		tpTypes = append([]string(nil), defaultTpTypes...)
	}

	return &FilterOptions{
		Years:    years,
		Communes: communes,
		TpTypes:  tpTypes,
	}, nil
}

func quoteIdentifier(ident string) string {
	return "`" + strings.ReplaceAll(ident, "`", "``") + "`"
}

func (s *Service) fetchYears(ctx context.Context) ([]int, error) {
	query := fmt.Sprintf(`
	SELECT DISTINCT 
		YEAR(STR_TO_DATE(Date_Creation_TP, '%%d/%%m/%%Y')) AS year_value
	FROM %s
	WHERE Date_Creation_TP IS NOT NULL
	ORDER BY year_value;
`, quoteIdentifier(pensionViewName))

	var rows []struct {
		Year sql.NullInt64 `gorm:"column:year_value"`
	}
	if err := s.db.WithContext(ctx).Raw(query).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("dashboard: list available years: %w", err)
	}

	values := make([]int, 0, len(rows))
	for _, row := range rows {
		if row.Year.Valid {
			values = append(values, int(row.Year.Int64))
		}
	}
	return values, nil
}

func (s *Service) fetchCommunes(ctx context.Context) ([]string, error) {
	if s.communes != nil {
		records, err := s.communes.List(ctx)
		if err != nil {
			return nil, fmt.Errorf("dashboard: list communes: %w", err)
		}
		if len(records) > 0 {
			names := make([]string, 0, len(records))
			for _, record := range records {
				name := strings.TrimSpace(record.Name)
				if name == "" {
					continue
				}
				names = append(names, name)
			}
			if len(names) > 0 {
				return names, nil
			}
		}
	}

	return s.fetchCommunesFromView(ctx)
}

func (s *Service) fetchCommunesFromView(ctx context.Context) ([]string, error) {
	query := fmt.Sprintf(`SELECT DISTINCT CODE_COM AS code_value
		FROM %s
		WHERE CODE_COM IS NOT NULL
		ORDER BY code_value`, pensionViewName)

	var rows []struct {
		Code sql.NullString `gorm:"column:code_value"`
	}
	if err := s.db.WithContext(ctx).Raw(query).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("dashboard: list communes: %w", err)
	}

	names := make([]string, 0, len(rows))
	for _, row := range rows {
		if !row.Code.Valid {
			continue
		}
		code := strings.TrimSpace(row.Code.String)
		if code == "" {
			continue
		}
		names = append(names, communeNameFromCode(code))
	}

	// Remove duplicates while preserving order.
	seen := make(map[string]struct{}, len(names))
	unique := make([]string, 0, len(names))
	for _, name := range names {
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		unique = append(unique, name)
	}
	return unique, nil
}

func (s *Service) fetchTpTypes(ctx context.Context) ([]string, error) {
	query := fmt.Sprintf(`SELECT DISTINCT Type_TP AS type_value
		FROM %s
		WHERE Type_TP IS NOT NULL
		ORDER BY type_value`, pensionViewName)

	var rows []struct {
		Type sql.NullString `gorm:"column:type_value"`
	}
	if err := s.db.WithContext(ctx).Raw(query).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("dashboard: list TP types: %w", err)
	}

	values := make([]string, 0, len(rows))
	for _, row := range rows {
		if !row.Type.Valid {
			continue
		}
		value := strings.TrimSpace(row.Type.String)
		if value == "" {
			continue
		}
		values = append(values, value)
	}
	return values, nil
}

func newQueryFilters(year int, wilaya, commune string) (queryFilters, error) {
	filters := queryFilters{
		Year:       year,
		WilayaCode: normalizeWilayaCode(wilaya),
	}

	trimmedCommune := strings.TrimSpace(commune)
	if trimmedCommune == "" || strings.EqualFold(trimmedCommune, "__full-wilaya__") {
		return filters, nil
	}

	if code, ok := communeCodeFromInput(trimmedCommune); ok {
		filters.CommuneCode = code
		return filters, nil
	}

	return queryFilters{}, fmt.Errorf("%w: %s", ErrUnknownCommune, commune)
}

func (f queryFilters) whereClause(includeYear bool) (string, []interface{}) {
	conditions := make([]string, 0, 3)
	args := make([]interface{}, 0, 3)

	if includeYear && f.Year > 0 {
		conditions = append(conditions, fmt.Sprintf(
			"YEAR(%s) = ?",
			dateColumnExpr(aliasedColumn("Date_Creation_TP")),
		))
		args = append(args, f.Year)
	}
	if f.CommuneCode != "" {
		conditions = append(conditions, fmt.Sprintf("%s = ?", aliasedColumn("CODE_COM")))
		args = append(args, f.CommuneCode)
	} else if f.WilayaCode != "" {
		conditions = append(conditions, fmt.Sprintf("%s LIKE ?", aliasedColumn("CODE_COM")))
		args = append(args, f.WilayaCode+"%")
	}

	if len(conditions) == 0 {
		return "", args
	}
	return "WHERE " + strings.Join(conditions, " AND "), args
}

func applyWhere(baseQuery, whereClause string) string {
	if whereClause == "" {
		return baseQuery
	}
	if strings.HasSuffix(baseQuery, "\n") {
		return baseQuery + whereClause
	}
	return baseQuery + " " + whereClause
}

type pensionRow struct {
	NumPension    sql.NullString  `gorm:"column:Num_Pension"`
	NomPrenom     sql.NullString  `gorm:"column:Nom_Prenom"`
	CodeCom       sql.NullString  `gorm:"column:CODE_COM"`
	TypeTP        sql.NullString  `gorm:"column:Type_TP"`
	MontTP        sql.NullFloat64 `gorm:"column:Mont_TP"`
	SoldeTP       sql.NullFloat64 `gorm:"column:Solde_TP"`
	DateCreation  sql.NullString  `gorm:"column:Date_Creation_TP"`
	DateDeb       sql.NullString  `gorm:"column:Date_Deb_TP"`
	DateFin       sql.NullString  `gorm:"column:Date_Fin_TP"`
	NomPere       sql.NullString  `gorm:"column:Nom_Pere"`
	NomMere       sql.NullString  `gorm:"column:Nom_Mere"`
	DateNaissance sql.NullString  `gorm:"column:Date_Naissance"`
}

func roundCurrency(value sql.NullFloat64) int64 {
	if !value.Valid {
		return 0
	}
	return int64(math.Round(value.Float64))
}

func stringFromNull(value sql.NullString) string {
	if !value.Valid {
		return ""
	}
	return strings.TrimSpace(value.String)
}

func splitFullName(fullName string) (string, string) {
	parts := strings.Fields(fullName)
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func pensionTableExpr() string {
	if pensionTableAlias == "" {
		return pensionViewName
	}
	return fmt.Sprintf("%s AS %s", pensionViewName, pensionTableAlias)
}

func aliasedColumn(column string) string {
	if pensionTableAlias == "" {
		return column
	}
	return fmt.Sprintf("%s.%s", pensionTableAlias, column)
}

func dateColumnExpr(column string) string {
	return fmt.Sprintf("STR_TO_DATE(%s, '%%d/%%m/%%Y')", column)
}

func (s *Service) assureJoinClause() string {
	if !s.assureCols.hasAny() {
		return ""
	}
	return fmt.Sprintf("LEFT JOIN ASSURE a ON %s = a.NPENS", aliasedColumn("Num_Pension"))
}

func (s *Service) assureColumnSelect(columnName, alias string) string {
	if columnName == "" {
		return fmt.Sprintf("NULL AS %s", alias)
	}
	return fmt.Sprintf("a.%s AS %s", columnName, alias)
}

type assureColumns struct {
	NomPere       string
	NomMere       string
	DateNaissance string
}

func (c assureColumns) hasAny() bool {
	return c.NomPere != "" || c.NomMere != "" || c.DateNaissance != ""
}

func detectAssureColumns(ctx context.Context, db *gorm.DB) assureColumns {
	columnMap, err := listTableColumns(ctx, db, "ASSURE")
	if err != nil || len(columnMap) == 0 {
		return assureColumns{}
	}

	return assureColumns{
		NomPere:       pickColumn(columnMap, []string{"nom_pere", "nompere", "pere_nom"}, "pere"),
		NomMere:       pickColumn(columnMap, []string{"nom_mere", "nommere", "mere_nom"}, "mere"),
		DateNaissance: pickColumn(columnMap, []string{"date_naissance", "date_naiss", "date_nais", "datenaissance"}, "nais"),
	}
}

func listTableColumns(ctx context.Context, db *gorm.DB, tableName string) (map[string]string, error) {
	var rows []struct {
		ColumnName string `gorm:"column:COLUMN_NAME"`
	}
	query := `
		SELECT COLUMN_NAME
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = ?
	`
	if err := db.WithContext(ctx).Raw(query, tableName).Scan(&rows).Error; err != nil {
		return nil, err
	}

	result := make(map[string]string, len(rows))
	for _, row := range rows {
		lower := strings.ToLower(row.ColumnName)
		result[lower] = row.ColumnName
	}
	return result, nil
}

func pickColumn(columns map[string]string, candidates []string, contains string) string {
	for _, candidate := range candidates {
		if column, ok := columns[strings.ToLower(candidate)]; ok {
			return column
		}
	}

	if contains != "" {
		for lower, original := range columns {
			if strings.Contains(lower, contains) {
				return original
			}
		}
	}

	return ""
}
