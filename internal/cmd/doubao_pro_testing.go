package cmd

import (
	"context"
	"fmt"

	workBusiness "github.com/armylong/armylong-go/internal/business/work"
	configWork "github.com/armylong/armylong-go/internal/common/config"
	larkbitable "github.com/larksuite/oapi-sdk-go/v3/service/bitable/v1"
	"github.com/spf13/cobra"
)

type doubaoProTestingCmd struct {
	feishuDocAppToken string
	feishuDocTableId  string
	feishuDocViewId   string
	feishuOpenId      string

	workHome string

	tableFieldNameOpenId string // 作业人飞书账号

	tableFieldNameScore1        string // 需求理解
	tableFieldNameScore2        string // 正确性
	tableFieldNameScore3        string // 完整性
	tableFieldNameScore4        string // 体验性
	tableFieldNameScoreRemark   string // 备注
	tableFieldNameScoreOptimize string // 优化建议

	tableFieldNameSpMemory string // 系统提示词
	tableFieldNameContext  string // 上下文
	tableFieldNameLevel1   string // 一级分类
	tableFieldNameLevel2   string // 二级分类
	tableFieldNamePrompt   string // 用户的问题
	tableFieldNameResponse string // ai的回复

	downloadFields       []string // 下载字段
	uploadFields         []string // 上传字段
	uploadRequiredFields []string // 上传必填字段
}

var DoubaoProTestingCmd = &doubaoProTestingCmd{}

func init() {
	DoubaoProTestingCmd.feishuDocAppToken = `CE3BwYISBiEG4KkG04UcTfr6nRh`
	DoubaoProTestingCmd.feishuDocTableId = `tbliWHNKeW9dcQnw`
	DoubaoProTestingCmd.feishuDocViewId = `vewGNON9rb`
	DoubaoProTestingCmd.feishuOpenId = `ou_8ba15f1ac045cca7d993b572471ca996`

	DoubaoProTestingCmd.workHome = `/root/works/doubao_testing`

	DoubaoProTestingCmd.tableFieldNameOpenId = `作业人飞书账号`

	DoubaoProTestingCmd.tableFieldNameScore1 = `需求理解`
	DoubaoProTestingCmd.tableFieldNameScore2 = `正确性`
	DoubaoProTestingCmd.tableFieldNameScore3 = `完整性`
	DoubaoProTestingCmd.tableFieldNameScore4 = `体验性`
	DoubaoProTestingCmd.tableFieldNameScoreRemark = `备注`
	DoubaoProTestingCmd.tableFieldNameScoreOptimize = `优化建议`

	DoubaoProTestingCmd.tableFieldNameSpMemory = `SP_memory`                         // 系统提示词
	DoubaoProTestingCmd.tableFieldNameContext = `context`                            // 上下文
	DoubaoProTestingCmd.tableFieldNameLevel1 = `message_intention_v4_offline_level1` // 一级分类
	DoubaoProTestingCmd.tableFieldNameLevel2 = `message_intention_v4_offline_level2` // 二级分类
	DoubaoProTestingCmd.tableFieldNamePrompt = `prompt`                              // 用户的问题
	DoubaoProTestingCmd.tableFieldNameResponse = `response`                          // ai的回复`

	DoubaoProTestingCmd.downloadFields = []string{
		DoubaoProTestingCmd.tableFieldNameSpMemory,
		DoubaoProTestingCmd.tableFieldNameContext,
		DoubaoProTestingCmd.tableFieldNameLevel1,
		DoubaoProTestingCmd.tableFieldNameLevel2,
		DoubaoProTestingCmd.tableFieldNamePrompt,
		DoubaoProTestingCmd.tableFieldNameResponse,
	}

	DoubaoProTestingCmd.uploadFields = []string{
		DoubaoProTestingCmd.tableFieldNameScore1,
		DoubaoProTestingCmd.tableFieldNameScore2,
		DoubaoProTestingCmd.tableFieldNameScore3,
		DoubaoProTestingCmd.tableFieldNameScore4,
		DoubaoProTestingCmd.tableFieldNameScoreRemark,
		DoubaoProTestingCmd.tableFieldNameScoreOptimize,
	}

	DoubaoProTestingCmd.uploadRequiredFields = []string{
		DoubaoProTestingCmd.tableFieldNameScore1,
		DoubaoProTestingCmd.tableFieldNameScore2,
		DoubaoProTestingCmd.tableFieldNameScore3,
		DoubaoProTestingCmd.tableFieldNameScore4,
		DoubaoProTestingCmd.tableFieldNameScoreRemark,
	}
}

// DemoHandler demo命令执行逻辑
// go run main.go demo 张三 -m "测试消息" -e -a 25 -H 篮球 -H 编程
func (d *doubaoProTestingCmd) DoubaoProTestingHandler(cmd *cobra.Command, args []string) {
	ctx := cmd.Context()
	action := ""
	if len(args) > 0 {
		action = args[0]
	}

	switch action {
	case "download":
		// go run /root/code/stepBYstep/goCode/armylong-go/main.go doubao_pro_testing download
		d.downloadWorks(ctx)
	case "upload":
		// go run /root/code/stepBYstep/goCode/armylong-go/main.go doubao_pro_testing upload
		d.uploadWorks(ctx)
	default:
		fmt.Printf("未知命令1: %s\n", action)
		fmt.Println("可用命令: download, upload")
	}

}

// 拉取并创建新工作
func (d *doubaoProTestingCmd) downloadWorks(ctx context.Context) {
	workBusiness.DownloadBusiness.WorkHome = d.workHome
	workBusiness.DownloadBusiness.DownloadFields = d.downloadFields
	workBusiness.DownloadBusiness.FeishuDocAppToken = d.feishuDocAppToken
	workBusiness.DownloadBusiness.FeishuDocTableId = d.feishuDocTableId
	workBusiness.DownloadBusiness.FeishuDocViewId = d.feishuDocViewId
	workBusiness.DownloadBusiness.FilterConditions = d.getUncompletedWorksFilter()

	err := workBusiness.DownloadBusiness.DownloadWorks(ctx)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println()
}

// 拉取并更新已完成的工作
func (d *doubaoProTestingCmd) uploadWorks(ctx context.Context) {
	workBusiness.UploadBusiness.WorkHome = d.workHome
	workBusiness.UploadBusiness.UploadFields = d.uploadFields
	workBusiness.UploadBusiness.UploadRequiredFields = d.uploadRequiredFields
	workBusiness.UploadBusiness.FeishuDocAppToken = d.feishuDocAppToken
	workBusiness.UploadBusiness.FeishuDocTableId = d.feishuDocTableId
	workBusiness.UploadBusiness.FeishuDocViewId = d.feishuDocViewId
	workBusiness.UploadBusiness.FilterConditions = d.getUncompletedWorksFilter()

	err := workBusiness.UploadBusiness.UploadWorks(ctx)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println()
}

// 获取未完成工作
func (d *doubaoProTestingCmd) getUncompletedWorksFilter() []*larkbitable.Condition {
	return []*larkbitable.Condition{
		{
			FieldName: &d.tableFieldNameOpenId,
			Operator:  &configWork.OperatorIs,
			Value:     []string{d.feishuOpenId},
		},
		{
			FieldName: &d.tableFieldNameScore1,
			Operator:  &configWork.OperatorIsEmpty,
			Value:     []string{},
		},
		{
			FieldName: &d.tableFieldNameScore2,
			Operator:  &configWork.OperatorIsEmpty,
			Value:     []string{},
		},
		{
			FieldName: &d.tableFieldNameScore3,
			Operator:  &configWork.OperatorIsEmpty,
			Value:     []string{},
		},
		{
			FieldName: &d.tableFieldNameScore4,
			Operator:  &configWork.OperatorIsEmpty,
			Value:     []string{},
		},
		{
			FieldName: &d.tableFieldNameScoreRemark,
			Operator:  &configWork.OperatorIsEmpty,
			Value:     []string{},
		},
	}
}
