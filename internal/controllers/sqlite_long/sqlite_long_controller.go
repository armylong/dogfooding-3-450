package sqlite_long

import (
	"context"

	sqliteLongBiz "github.com/armylong/armylong-go/internal/business/sqlite_long"
	sqliteLongCs "github.com/armylong/armylong-go/internal/cs/sqlite_long"
)

type SqliteLongController struct{}

func (c *SqliteLongController) ActionOverview(ctx context.Context, req *sqliteLongCs.OverviewRequest) (*sqliteLongCs.OverviewResponse, error) {
	return sqliteLongBiz.SqliteLongBusiness.Overview(ctx, req)
}

func (c *SqliteLongController) ActionTableList(ctx context.Context, req *sqliteLongCs.TableListRequest) (*sqliteLongCs.TableListResponse, error) {
	return sqliteLongBiz.SqliteLongBusiness.TableList(ctx, req)
}

func (c *SqliteLongController) ActionTableData(ctx context.Context, req *sqliteLongCs.TableDataRequest) (*sqliteLongCs.TableDataResponse, error) {
	return sqliteLongBiz.SqliteLongBusiness.TableData(ctx, req)
}

func (c *SqliteLongController) ActionTableSchema(ctx context.Context, req *sqliteLongCs.TableSchemaRequest) (*sqliteLongCs.TableSchemaResponse, error) {
	return sqliteLongBiz.SqliteLongBusiness.TableSchema(ctx, req)
}
