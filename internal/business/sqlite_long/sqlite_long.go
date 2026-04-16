package sqlite_long

import (
	"context"
	"database/sql"
	"os"

	sqliteLong "github.com/armylong/armylong-go/internal/cs/sqlite_long"
	"github.com/armylong/go-library/service/sqlite"
)

type sqliteLongBusiness struct{}

var SqliteLongBusiness = &sqliteLongBusiness{}

func (b *sqliteLongBusiness) Overview(ctx context.Context, req *sqliteLong.OverviewRequest) (*sqliteLong.OverviewResponse, error) {
	db := sqlite.DB.DB()

	var tables []sqliteLong.TableInfo
	rows, err := db.Query(`
		SELECT name FROM sqlite_master 
		WHERE type='table' AND name NOT LIKE 'sqlite_%' 
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			continue
		}

		var rowCount int64
		db.QueryRow("SELECT COUNT(*) FROM " + tableName).Scan(&rowCount)

		columnCount := getTableColumnCount(db, tableName)

		tables = append(tables, sqliteLong.TableInfo{
			Name:        tableName,
			RowCount:    rowCount,
			ColumnCount: columnCount,
		})
	}

	dbPath := getDatabasePath()
	var dbSize int64
	if info, err := os.Stat(dbPath); err == nil {
		dbSize = info.Size()
	}

	return &sqliteLong.OverviewResponse{
		DatabasePath: dbPath,
		DatabaseSize: dbSize,
		TableCount:   len(tables),
		Tables:       tables,
	}, nil
}

func (b *sqliteLongBusiness) TableList(ctx context.Context, req *sqliteLong.TableListRequest) (*sqliteLong.TableListResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	db := sqlite.DB.DB()

	var allTables []sqliteLong.TableInfo
	rows, err := db.Query(`
		SELECT name FROM sqlite_master 
		WHERE type='table' AND name NOT LIKE 'sqlite_%' 
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			continue
		}

		var rowCount int64
		db.QueryRow("SELECT COUNT(*) FROM " + tableName).Scan(&rowCount)

		tables := sqliteLong.TableInfo{
			Name:     tableName,
			RowCount: rowCount,
		}
		allTables = append(allTables, tables)
	}

	total := len(allTables)
	start := (req.Page - 1) * req.PageSize
	end := start + req.PageSize
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	return &sqliteLong.TableListResponse{
		Tables:   allTables[start:end],
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}, nil
}

func (b *sqliteLongBusiness) TableData(ctx context.Context, req *sqliteLong.TableDataRequest) (*sqliteLong.TableDataResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 50
	}

	db := sqlite.DB.DB()
	tableName := req.TableName

	var total int64
	db.QueryRow("SELECT COUNT(*) FROM " + tableName).Scan(&total)

	offset := (req.Page - 1) * req.PageSize
	dataRows, err := db.Query("SELECT * FROM "+tableName+" LIMIT ? OFFSET ?", req.PageSize, offset)
	if err != nil {
		return nil, err
	}
	defer dataRows.Close()

	columns, err := dataRows.Columns()
	if err != nil {
		return nil, err
	}

	var rows []map[string]any
	for dataRows.Next() {
		values := make([]any, len(columns))
		valuePtrs := make([]any, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := dataRows.Scan(valuePtrs...); err != nil {
			continue
		}

		row := make(map[string]any)
		for i, col := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				row[col] = string(b)
			} else {
				row[col] = val
			}
		}
		rows = append(rows, row)
	}

	return &sqliteLong.TableDataResponse{
		TableName: tableName,
		Columns:   columns,
		Rows:      rows,
		Total:     total,
		Page:      req.Page,
		PageSize:  req.PageSize,
	}, nil
}

func (b *sqliteLongBusiness) TableSchema(ctx context.Context, req *sqliteLong.TableSchemaRequest) (*sqliteLong.TableSchemaResponse, error) {
	db := sqlite.DB.DB()

	rows, err := db.Query("PRAGMA table_info(" + req.TableName + ")")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []sqliteLong.ColumnInfo
	for rows.Next() {
		var col sqliteLong.ColumnInfo
		var defaultVal *string
		if err := rows.Scan(&col.CID, &col.Name, &col.Type, &col.NotNull, &defaultVal, &col.PrimaryKey); err != nil {
			continue
		}
		if defaultVal != nil {
			col.DefaultVal = *defaultVal
		}
		columns = append(columns, col)
	}

	return &sqliteLong.TableSchemaResponse{
		TableName: req.TableName,
		Columns:   columns,
	}, nil
}

func getDatabasePath() string {
	homeDir, _ := os.UserHomeDir()
	if homeDir != "" {
		return homeDir + "/sqlite/database.db"
	}
	return "/tmp/sqlite/database.db"
}

func getTableColumnCount(db *sql.DB, tableName string) int {
	rows, err := db.Query("PRAGMA table_info(" + tableName + ")")
	if err != nil {
		return 0
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		count++
	}
	return count
}
