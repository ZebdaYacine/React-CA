package upload

import (
	"database/sql"
	"fmt"
	"log"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

const (
	defaultHeaderRow = 1
	defaultDataRow   = 2
)

var expectedColumnsAssure = []string{
	"TYPE_DOS", "AG", "REG", "AVT", "N_SERIE", "NPENS", "NIN", "ETAT",
	"NOM", "PRENOM", "DECUJUS", "INTITULE", "NUM_SS", "REG_LIQ", "REG_CORD",
	"ADRESSE", "VILLE", "CODE_POST", "CODE_COM", "DATENAIS", "DATE_DEP",
	"DATJOUIS", "MP", "MAND_CCP", "NOM_PERE", "NOM_MERE", "DATE_1ER",
	"DATE_DER", "DATE_DC", "SEXE", "CATEG", "DAT_ENTR", "DT_TRAIT",
	"MT_CD", "NET_MENS", "SAL_POST", "DT_CODIF", "NRECODIF", "NPL",
	"DT_CREAT", "NAT", "SIT_FAM", "LIEUNAIS", "CIVILITE", "PRESUME",
	"TRIM_G", "TRIM_COT", "TRIM_MJH", "TRIM_CAS", "TRIM_ETR", "NUM_SIT",
	"DATE_SIT", "CODE_OP", "DAT_SIT1", "VLD_SIT1", "CODE_OP1", "DATE_REL",
	"D_TUTEUR", "TAUX_D", "TAUX_RV", "TAUX_GLB", "NUM_TEL", "MUTUELLE",
}

var expectedColumnsPension = []string{
	"Num_Pension", "Nom_Prenom", "Etat_Pensionne", "Num_TP", "Type_TP",
	"Etat_TP", "Nature_TP", "Mont_TP", "Solde_TP", "Date_Creation_TP",
	"Date_Deb_TP", "Date_Fin_TP", "Agence",
}

var dateColumns = map[string]struct{}{
	"DATENAIS":        {},
	"DATE_DEP":        {},
	"DATJOUIS":        {},
	"DATE_1ER":        {},
	"DATE_DER":        {},
	"DATE_DC":         {},
	"DAT_ENTR":        {},
	"DT_TRAIT":        {},
	"DT_CODIF":        {},
	"DT_CREAT":        {},
	"DATE_SIT":        {},
	"DAT_SIT1":        {},
	"DATE_REL":        {},
	"Date_Creation_TP": {},
	"Date_Deb_TP":      {},
	"Date_Fin_TP":      {},
}

// ExcelImporter implements the Excel ingestion logic so uploads can immediately populate MySQL tables.
type ExcelImporter struct {
	db         *sql.DB
	headerRow  int
	dataRow    int
	emptyAsNil bool
}

func NewExcelImporter(db *sql.DB) (*ExcelImporter, error) {
	if db == nil {
		return nil, fmt.Errorf("excel importer: nil database handle")
	}
	return &ExcelImporter{
		db:         db,
		headerRow:  defaultHeaderRow,
		dataRow:    defaultDataRow,
		emptyAsNil: true,
	}, nil
}

func (ei *ExcelImporter) ImportAssure(path string) error {
	return ei.importExcel(path, "assure", expectedColumnsAssure)
}

func (ei *ExcelImporter) ImportTP(path string) error {
	return ei.importExcel(path, "TP", expectedColumnsPension)
}

func (ei *ExcelImporter) importExcel(path, tableName string, expectedCols []string) error {
	if path == "" {
		return fmt.Errorf("excel importer: empty path for table %s", tableName)
	}

	file, err := excelize.OpenFile(path)
	if err != nil {
		return fmt.Errorf("excel importer: open %s: %w", path, err)
	}
	defer file.Close()

	sheet := file.GetSheetName(file.GetActiveSheetIndex())
	rows, err := file.GetRows(sheet)
	if err != nil {
		return fmt.Errorf("excel importer: read rows from %q: %w", sheet, err)
	}

	if len(rows) < ei.headerRow {
		return fmt.Errorf("excel importer: missing header row %d in %s", ei.headerRow, path)
	}
	columns, err := extractColumns(rows[ei.headerRow-1])
	if err != nil {
		return fmt.Errorf("excel importer: invalid header: %w", err)
	}
	if err := ensureColumns(columns, expectedCols); err != nil {
		log.Printf("upload: warning header mismatch for %s: %v (continuing)", tableName, err)
	}

	dataStart := ei.dataRow - 1
	if dataStart <= ei.headerRow-1 {
		dataStart = ei.headerRow
	}
	if dataStart >= len(rows) {
		log.Printf("upload: no data rows detected for %s in %s", tableName, filepath.Base(path))
		return nil
	}

	tableSQL, err := quoteQualifiedIdentifier(tableName)
	if err != nil {
		return fmt.Errorf("excel importer: invalid table %q: %w", tableName, err)
	}

	columnSQL := make([]string, len(columns))
	placeholders := make([]string, len(columns))
	for i, col := range columns {
		columnSQL[i] = quoteIdentifier(col)
		placeholders[i] = "?"
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s)",
		tableSQL,
		strings.Join(columnSQL, ", "),
		strings.Join(placeholders, ", "),
	)

	tx, err := ei.db.Begin()
	if err != nil {
		return fmt.Errorf("excel importer: start transaction for %s: %w", tableName, err)
	}

	stmt, err := tx.Prepare(query)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("excel importer: prepare insert for %s: %w", tableName, err)
	}
	defer stmt.Close()

	inserted := 0
	for i, row := range rows[dataStart:] {
		excelRow := dataStart + i + 1
		values := make([]interface{}, len(columns))
		rowHasValue := false

		for j := range columns {
			var val interface{}
			if j < len(row) {
				cell := strings.TrimSpace(row[j])
				colName := columns[j]

				if cell == "" && ei.emptyAsNil {
					val = nil
				} else if _, isDate := dateColumns[colName]; isDate {
					if parsed, ok := parseAnyDate(cell); ok {
						val = parsed
						rowHasValue = true
					} else {
						log.Printf("upload: unable to parse date %q (col=%s row=%d)", cell, colName, excelRow)
						val = nil
					}
				} else {
					val = cell
					rowHasValue = rowHasValue || cell != ""
				}
			} else {
				val = nil
			}
			values[j] = val
		}

		if !rowHasValue {
			continue
		}

		if _, err := stmt.Exec(values...); err != nil {
			tx.Rollback()
			return fmt.Errorf("excel importer: insert row %d into %s: %w", excelRow, tableName, err)
		}
		inserted++
		if inserted%1000 == 0 {
			log.Printf("upload: inserted %d rows into %s...", inserted, tableName)
		}
	}

	if err := tx.Commit(); err != nil {
		tx.Rollback()
		return fmt.Errorf("excel importer: commit %s: %w", tableName, err)
	}

	log.Printf("upload: inserted %d row(s) into %s from %s", inserted, tableName, filepath.Base(path))
	return nil
}

func extractColumns(header []string) ([]string, error) {
	lastNonEmpty := -1
	for i := len(header) - 1; i >= 0; i-- {
		if strings.TrimSpace(header[i]) != "" {
			lastNonEmpty = i
			break
		}
	}
	if lastNonEmpty == -1 {
		return nil, fmt.Errorf("header row is empty")
	}

	columns := make([]string, 0, lastNonEmpty+1)
	seen := make(map[string]struct{})
	for i := 0; i <= lastNonEmpty; i++ {
		name := strings.TrimSpace(header[i])
		if name == "" {
			return nil, fmt.Errorf("header column %d is empty", i+1)
		}
		if _, ok := seen[name]; ok {
			return nil, fmt.Errorf("duplicate column %q", name)
		}
		seen[name] = struct{}{}
		columns = append(columns, name)
	}
	return columns, nil
}

func ensureColumns(actual, expected []string) error {
	if len(actual) != len(expected) {
		return fmt.Errorf("expected %d columns, found %d", len(expected), len(actual))
	}
	for i := range expected {
		if strings.TrimSpace(actual[i]) != expected[i] {
			return fmt.Errorf("column %d mismatch: expected %q, found %q", i+1, expected[i], actual[i])
		}
	}
	return nil
}

func quoteIdentifier(ident string) string {
	return "`" + strings.ReplaceAll(ident, "`", "``") + "`"
}

func quoteQualifiedIdentifier(ident string) (string, error) {
	parts := strings.Split(ident, ".")
	if len(parts) == 0 {
		return "", fmt.Errorf("empty identifier")
	}
	quoted := make([]string, len(parts))
	for i, part := range parts {
		name := strings.TrimSpace(part)
		if name == "" {
			return "", fmt.Errorf("empty identifier part in %q", ident)
		}
		quoted[i] = quoteIdentifier(name)
	}
	return strings.Join(quoted, "."), nil
}

func parseAnyDate(cell string) (string, bool) {
	layouts := []string{
		"02/01/2006",
		"02-01-2006",
		"2006-01-02",
		"01-02-06",
		"01/02/06",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, cell); err == nil {
			return t.Format("02/01/2006"), true
		}
	}

	if f, err := strconv.ParseFloat(cell, 64); err == nil {
		if t, err2 := excelize.ExcelDateToTime(f, false); err2 == nil {
			return t.Format("02/01/2006"), true
		}
	}

	return "", false
}
