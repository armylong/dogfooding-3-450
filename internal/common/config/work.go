package config

const (
	FeishuDocAppToken = `CE3BwYISBiEG4KkG04UcTfr6nRh`
	FeishuDocTableId  = `tbliWHNKeW9dcQnw`
	FeishuDocViewId   = `vewGNON9rb`
)

const (
	WorkHome           = `/root/works/doubao_testing`
	WorkSpace          = WorkHome + `/works`
	WorkFileName       = `work.json`   // 工作数据文件名
	WorkDoneFileName   = `work.done`   // 工作完成标记文件名
	QaDoneFileName     = `qa.done`     // 质检完成标记文件名
	QaFileName         = `qa.json`     // 质检数据文件名
	UploadDoneFileName = `upload.done` // 上传完成标记文件名

)

// Filter.Conjunction 整体条件运算符
var (
	ConjunctionAnd string = `and`
)

// Filter.Conditions.Operator 单个条件运算符
var (
	OperatorIs             string = `is`             // 等于
	OperatorNot            string = `isNot`          // 不等于（不支持日期字段，了解如何查询日期字段，参考日期字段填写说明）
	OperatorContains       string = `contains`       // 包含（不支持日期字段）
	OperatorDoesNotContain string = `doesNotContain` // 不包含（不支持日期字段）
	OperatorIsEmpty        string = `isEmpty`        // 为空
	OperatorIsNotEmpty     string = `isNotEmpty`     // 不为空
	OperatorIsGreater      string = `isGreater`      // 大于
	OperatorIsGreaterEqual string = `isGreaterEqual` // 大于等于（不支持日期字段）
	OperatorIsLess         string = `isLess`         // 小于
	OperatorIsLessEqual    string = `isLessEqual`    // 小于等于（不支持日期字段）
	OperatorLike           string = `like`           // LIKE 运算符。暂未支持
	OperatorIn             string = `in`             // IN 运算符。暂未支持
)
