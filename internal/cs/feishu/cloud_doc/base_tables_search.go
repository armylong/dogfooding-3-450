package cloud_doc

// 查询表格 -------------------------------------------------------------------------------------------------
type SearchBaseTablesRequest struct {
	AppToken                         string                            `json:"app_token"`                             // 应用凭证 获取方式:表格url上的路径尾部 示例:ZFszben8BaPhvPscIbLcmKsZnYB
	TableID                          string                            `json:"table_id"`                              // 表格ID 获取方式:表格url上的table参数的值 示例: tbluYT98DikJIQp1
	SearchBaseTablesUrlRequestParams *SearchBaseTablesUrlRequestParams `json:"search_base_tables_url_request_params"` // get参数
	SearchBaseTablesUrlRequestJson   *SearchBaseTablesUrlRequestJson   `json:"search_base_tables_url_request_json"`   // post参数
}

// 查询参数(拼接到url上面的)
type SearchBaseTablesUrlRequestParams struct {
	UserIDType string `json:"user_id_type"` // 用户ID类型 [非必填] 枚举:[open_id(默认) | union_id | user_id]
	PageToken  string `json:"page_token"`   // 分页标记 [非必填] 第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果 示例值："eVQrYzJBNDNONlk4VFZBZVlSdzlKdFJ4bVVHVExENDNKVHoxaVdiVnViQT0="
	PageSize   int    `json:"page_size"`    // 分页大小 [非必填] 最大值为 500 示例值：10 默认值：20
}

// 请求体(json格式)
type SearchBaseTablesUrlRequestJson struct {
	ViewID          string                                `json:"view_id,omitempty"`          // 视图ID [非必填] 视图ID，多维表格中视图的唯一标识。获取方式：在多维表格的 URL 地址栏中，view_id 参数的值: vew23Yod92
	FieldNames      []string                              `json:"field_names,omitempty"`      // 字段名称 [非必填] 用于指定本次查询返回记录中包含的字段
	Sort            []SearchBaseTablesUrlRequestJsonSort  `json:"sort,omitempty"`             // 排序条件 [非必填] 数据校验规则： 长度范围：0 ～ 100
	Filter          *SearchBaseTablesUrlRequestJsonFilter `json:"filter,omitempty"`           // 过滤条件 [非必填] 包含条件筛选信息的对象。了解 filter 填写指南和使用示例（如怎样同时使用 and 和 or 逻辑链接词）
	AutomaticFields bool                                  `json:"automatic_fields,omitempty"` // 是否自动计算并返回创建时间（created_time）、修改时间（last_modified_time）、创建人（created_by）、修改人（last_modified_by）这四类字段。默认为 false，表示不返回。示例值：false
}
type SearchBaseTablesUrlRequestJsonSort struct {
	FieldName string `json:"field_name"` // 排序字段的名称 [必填] 示例值："字段1" 数据校验规则： 长度范围：0 字符 ～ 1000 字符
	Desc      bool   `json:"desc"`       // 是否倒序 [必填] 示例值：true | false
}

type SearchBaseTablesUrlRequestJsonFilter struct {
	Conjunction     string                                           `json:"conjunction"`     // 表示条件之间的逻辑连接词 [必填] 示例值："and" 可选值有： and：满足全部条件 or：满足任一条件 数据校验规则： 长度范围：0 字符 ～ 10 字符
	AutomaticFields bool                                             `json:"automaticFields"` // 是否自动计算并返回 [非必填] 创建时间（created_time）、修改时间（last_modified_time）、创建人（created_by）、修改人（last_modified_by）这四类字段。默认为 false，表示不返回。示例值：false
	Conditions      []*SearchBaseTablesUrlRequestJsonFilterCondition `json:"conditions"`      // 筛选条件集合 [非必填] 数据校验规则：长度范围：0 ～ 50
}

type SearchBaseTablesUrlRequestJsonFilterCondition struct {
	FieldName string   `json:"field_name"` // 筛选条件的左值，值为字段的名称 [必填] 示例值："字段1" 数据校验规则： 长度范围：0 字符 ～ 1000 字符
	Operator  string   `json:"operator"`   // 条件运算符 [必填] 示例值："is" 可选值有： is：等于 isNot：不等于（不支持日期字段，了解如何查询日期字段，参考日期字段填写说明） contains：包含（不支持日期字段） doesNotContain：不包含（不支持日期字段） isEmpty：为空 isNotEmpty：不为空 isGreater：大于 isGreaterEqual：大于等于（不支持日期字段） isLess：小于 isLessEqual：小于等于（不支持日期字段） like：LIKE 运算符。暂未支持 in：IN 运算符。暂未支持
	Value     []string `json:"value"`      // 条件的值，可以是单个值或多个值的数组。不同字段类型和不同的 operator 可填的值不同 [必填] 示例值：["文本内容"] 数据校验规则： 长度范围：0 ～ 10
}

type SearchBaseTablesUrlResponse struct {
	Code  int                              `json:"code"` // 错误码，非 0 表示失败
	Msg   string                           `json:"msg"`  // 错误描述
	Data  *SearchBaseTablesUrlResponseData `json:"data,omitempty"`
	Error any                              `json:"error,omitempty"`
}

type SearchBaseTablesUrlResponseData struct {
	Total     int                              `json:"total"`      // 总记录数
	HasMore   bool                             `json:"has_more"`   // 是否还有更多项
	PageToken string                           `json:"page_token"` // 分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token
	Items     []*BaseTablesUrlResponseDataItem `json:"items"`      // 记录列表
}

type BaseTablesUrlResponseDataItem struct {
	Fields           map[string]any `json:"fields"`             // 记录字段
	RecordID         string         `json:"record_id"`          // 记录 ID
	CreatedBy        string         `json:"created_by"`         // 创建人
	CreatedTime      int            `json:"created_time"`       // 创建时间
	LastModifiedBy   string         `json:"last_modified_by"`   // 修改人
	LastModifiedTime int            `json:"last_modified_time"` // 最近更新时间
	SharedURL        string         `json:"shared_url"`         // 记录分享链接(批量获取记录接口将返回该字段)
	RecordURL        string         `json:"record_url"`         // 记录链接(检索记录接口将返回该字段)
}

// 更新表格 -------------------------------------------------------------------------------------------------
type UpdateBaseTablesRequest struct {
	AppToken                         string                            `json:"app_token"`                             // 应用凭证 获取方式:表格url上的路径尾部 示例:ZFszben8BaPhvPscIbLcmKsZnYB
	TableID                          string                            `json:"table_id"`                              // 表格ID 获取方式:表格url上的table参数的值 示例: tbluYT98DikJIQp1
	RecordID                         string                            `json:"record_id"`                             // 记录ID 数据表中一条记录的唯一标识。通过查询记录接口获取。示例值："recqwIwhc6"
	UpdateBaseTablesUrlRequestParams *UpdateBaseTablesUrlRequestParams `json:"update_base_tables_url_request_params"` // get参数
	UpdateBaseTablesUrlRequestJson   *UpdateBaseTablesUrlRequestJson   `json:"update_base_tables_url_request_json"`   // post参数
}

// 查询参数(拼接到url上面的)
type UpdateBaseTablesUrlRequestParams struct {
	UserIDType             string `json:"user_id_type"`             // 用户ID类型 [非必填] 枚举:[open_id(默认) | union_id | user_id]
	IgnoreConsistencyCheck bool   `json:"ignore_consistency_check"` // 是否忽略一致性读写检查 [非必填] 默认为 false，即在进行读写操作时，系统将确保读取到的数据和写入的数据是一致的。可选值： true：忽略读写一致性检查，提高性能，但可能会导致某些节点的数据不同步，出现暂时不一致 false：开启读写一致性检查，确保数据在读写过程中一致 示例值：true
}

// 请求体(json格式)
type UpdateBaseTablesUrlRequestJson struct {
	// 要更新的记录的数据。你需先指定数据表中的字段（即指定列），再传入正确格式的数据作为一条记录。

	// 注意：

	// 该接口支持的字段类型及其描述如下所示：

	// 文本：原值展示，不支持 markdown 语法
	// 数字：填写数字格式的值
	// 单选：填写选项值，对于新的选项值，将会创建一个新的选项
	// 多选：填写多个选项值，对于新的选项值，将会创建一个新的选项。如果填写多个相同的新选项值，将会创建多个相同的选项
	// 日期：填写毫秒级时间戳
	// 复选框：填写 true 或 false
	// 条码
	// 人员：填写用户的 open_id、union_id 或 user_id，类型需要与 user_id_type 指定的类型一致
	// 电话号码：填写文本内容
	// 超链接：参考以下示例，text 为文本值，link 为 URL 链接
	// 附件：填写附件 token，需要先调用上传素材或分片上传素材接口将附件上传至该多维表格中
	// 单向关联：填写被关联表的记录 ID
	// 双向关联：填写被关联表的记录 ID
	// 地理位置：填写经纬度坐标
	// 不同类型字段的数据结构请参考数据结构概述。

	// 示例值：{"文本":"HelloWorld"}
	Fields map[string]any `json:"fields"` // 记录字段
}

type UpdateBaseTablesUrlResponse struct {
	Code  int                              `json:"code"` // 错误码，非 0 表示失败
	Msg   string                           `json:"msg"`  // 错误描述
	Data  *UpdateBaseTablesUrlResponseData `json:"data,omitempty"`
	Error any                              `json:"error,omitempty"`
}

type UpdateBaseTablesUrlResponseData struct {
	Record *BaseTablesUrlResponseDataItem `json:"record"` // 记录 ID
}
