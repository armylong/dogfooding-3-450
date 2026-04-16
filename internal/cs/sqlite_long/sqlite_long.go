package sqlite_long

type OverviewRequest struct {
}

type OverviewResponse struct {
	DatabasePath string            `json:"database_path"`
	DatabaseSize int64             `json:"database_size"`
	TableCount   int               `json:"table_count"`
	Tables       []TableInfo       `json:"tables"`
}

type TableInfo struct {
	Name       string `json:"name"`
	RowCount   int64  `json:"row_count"`
	ColumnCount int   `json:"column_count"`
}

type TableListRequest struct {
	Page     int `json:"page" form:"page"`
	PageSize int `json:"page_size" form:"page_size"`
}

type TableListResponse struct {
	Tables    []TableInfo `json:"tables"`
	Total     int         `json:"total"`
	Page      int         `json:"page"`
	PageSize  int         `json:"page_size"`
}

type TableDataRequest struct {
	TableName string `json:"table_name" form:"table_name"`
	Page      int    `json:"page" form:"page"`
	PageSize  int    `json:"page_size" form:"page_size"`
}

type TableDataResponse struct {
	TableName string              `json:"table_name"`
	Columns   []string            `json:"columns"`
	Rows      []map[string]any    `json:"rows"`
	Total     int64               `json:"total"`
	Page      int                 `json:"page"`
	PageSize  int                 `json:"page_size"`
}

type TableSchemaRequest struct {
	TableName string `json:"table_name" form:"table_name"`
}

type TableSchemaResponse struct {
	TableName string       `json:"table_name"`
	Columns   []ColumnInfo `json:"columns"`
}

type ColumnInfo struct {
	CID        int    `json:"cid"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	NotNull    int    `json:"not_null"`
	DefaultVal any    `json:"default_val"`
	PrimaryKey int    `json:"primary_key"`
}
