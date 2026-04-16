package config

// 飞书api
const (
	// 获取多维表格数据 该接口用于查询数据表中的现有记录，单次最多查询 500 行记录，支持分页获取。 app_token table_id
	// 官方文档: https://open.feishu.cn/document/docs/bitable-v1/app-table-record/search?appId=cli_a94dc0fc84f6dbdd
	FeishuApiDocBaseTablesSearchUrl = "https://open.feishu.cn/open-apis/bitable/v1/apps/%s/tables/%s/records/search"

	// 更新多维表格数据表中的一条记录 该接口用于查询数据表中的现有记录详情。 app_token table_id record_id
	// 官方文档: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/update?appId=cli_a94dc0fc84f6dbdd
	FeishuApiDocBaseTablesUpdateUrl = "https://open.feishu.cn/open-apis/bitable/v1/apps/%s/tables/%s/records/%s"
)
