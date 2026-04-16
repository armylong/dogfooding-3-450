package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	feishuCloudDocBusiness "github.com/armylong/armylong-go/internal/business/feishu/cloud_doc"
	workBusiness "github.com/armylong/armylong-go/internal/business/work"
	configWork "github.com/armylong/armylong-go/internal/common/config"
	larkbitable "github.com/larksuite/oapi-sdk-go/v3/service/bitable/v1"
	"github.com/spf13/cobra"
)

type dogfoodingTestingCmd struct {
	feishuDocAppToken string
	feishuDocTableId  string
	feishuDocViewId   string
	feishuOpenId      string

	workHome string

	downloadFields       []string // 下载字段
	uploadFields         []string // 上传字段
	uploadRequiredFields []string // 上传必填字段

	// (*(*(*feishuResp).Data).Items[0]).Fields["题目ID"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["UID"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["队列名称"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["作业人"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["一级bad pattern"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["二级bad pattern"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["细分错误类型"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["详细问题说明"]
	// (*(*(*feishuResp).Data).Items[0]).Fields["备注"]
	tableFieldNameId        string // 题目ID
	tableFieldNameUid       string // UID
	tableFieldNameQueueName string // 队列名称
	tableFieldNameAssignee  string // 作业人
	tableFieldNameLevel1    string // 一级bad pattern
	tableFieldNameLevel2    string // 二级bad pattern
	tableFieldNameSubType   string // 细分错误类型
	tableFieldNameDetail    string // 详细问题说明
	tableFieldNameRemark    string // 备注
}

var DogfoodingTestingCmd = &dogfoodingTestingCmd{}

func init() {
	DogfoodingTestingCmd.feishuDocAppToken = `MpKrbFXkqaTGWlsvo4KcDanTnrg`
	DogfoodingTestingCmd.feishuDocTableId = `tblBwuKqLdZPTMXk`
	DogfoodingTestingCmd.feishuDocViewId = `vewByL8iBh`
	DogfoodingTestingCmd.feishuOpenId = `ou_8ba15f1ac045cca7d993b572471ca996`

	DogfoodingTestingCmd.workHome = `/root/works/dogfooding`

	DogfoodingTestingCmd.tableFieldNameId = `题目ID`
	DogfoodingTestingCmd.tableFieldNameUid = `UID`
	DogfoodingTestingCmd.tableFieldNameQueueName = `队列名称`
	DogfoodingTestingCmd.tableFieldNameAssignee = `作业人`
	DogfoodingTestingCmd.tableFieldNameLevel1 = `一级bad pattern`
	DogfoodingTestingCmd.tableFieldNameLevel2 = `二级bad pattern`
	DogfoodingTestingCmd.tableFieldNameSubType = `细分错误类型`
	DogfoodingTestingCmd.tableFieldNameDetail = `详细问题说明`
	DogfoodingTestingCmd.tableFieldNameRemark = `备注`

	DogfoodingTestingCmd.downloadFields = []string{
		DogfoodingTestingCmd.tableFieldNameId,
		DogfoodingTestingCmd.tableFieldNameUid,
		DogfoodingTestingCmd.tableFieldNameQueueName,
		DogfoodingTestingCmd.tableFieldNameAssignee,
		DogfoodingTestingCmd.tableFieldNameLevel1,
		DogfoodingTestingCmd.tableFieldNameLevel2,
		DogfoodingTestingCmd.tableFieldNameSubType,
		DogfoodingTestingCmd.tableFieldNameDetail,
		DogfoodingTestingCmd.tableFieldNameRemark,
	}

	DogfoodingTestingCmd.uploadFields = []string{
		DogfoodingTestingCmd.tableFieldNameId,
		DogfoodingTestingCmd.tableFieldNameUid,
		DogfoodingTestingCmd.tableFieldNameQueueName,
		DogfoodingTestingCmd.tableFieldNameAssignee,
		DogfoodingTestingCmd.tableFieldNameLevel1,
		DogfoodingTestingCmd.tableFieldNameLevel2,
		DogfoodingTestingCmd.tableFieldNameSubType,
		DogfoodingTestingCmd.tableFieldNameDetail,
	}

	DogfoodingTestingCmd.uploadRequiredFields = []string{
		DogfoodingTestingCmd.tableFieldNameId,
		DogfoodingTestingCmd.tableFieldNameUid,
		DogfoodingTestingCmd.tableFieldNameQueueName,
		DogfoodingTestingCmd.tableFieldNameAssignee,
		DogfoodingTestingCmd.tableFieldNameLevel1,
		DogfoodingTestingCmd.tableFieldNameLevel2,
		DogfoodingTestingCmd.tableFieldNameSubType,
		DogfoodingTestingCmd.tableFieldNameDetail,
	}
}

// DemoHandler demo命令执行逻辑
// go run main.go demo 张三 -m "测试消息" -e -a 25 -H 篮球 -H 编程
func (d *dogfoodingTestingCmd) DogfoodingTestingHandler(cmd *cobra.Command, args []string) {
	ctx := cmd.Context()
	action := ""
	if len(args) > 0 {
		action = args[0]
	}

	questionId, _ := cmd.Flags().GetString("question_id")

	switch action {
	case "download":
		// go run /root/code/stepBYstep/goCode/armylong-go/main.go bad_pattern_testing download
		d.downloadWorks(ctx, questionId)
	case "upload":
		// go run /root/code/stepBYstep/goCode/armylong-go/main.go bad_pattern_testing upload
		d.uploadWorks(ctx)
	case "format_work":
		d.formatWorks(ctx)
	case "while_format_work":
		d.whileFormatWorks(ctx, questionId)
	default:
		fmt.Printf("未知命令1: %s\n", action)
		fmt.Println("可用命令: download, upload")
	}

}

func (d *dogfoodingTestingCmd) whileFormatWorks(ctx context.Context, questionId string) {
	for {
		d.formatWorks(ctx)
		time.Sleep(1 * time.Second)
	}

}

func (d *dogfoodingTestingCmd) formatWorks(ctx context.Context) {

	workSpace := d.workHome + `/works`
	// 获取所有题目下初始work_init.json文件并格式化
	// 查找工作目录下的所有题目目录
	entries, err := os.ReadDir(workSpace)
	if err != nil {
		fmt.Printf("工作目录不存在 %s: %v\n", workSpace, err)
		return
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		// fmt.Printf("题目目录: %s\n", entry.Name())
		subdirPath := filepath.Join(workSpace, entry.Name())
		subEntries, _err := os.ReadDir(subdirPath)
		if _err != nil {
			fmt.Printf("%s 读取子目录 %s 失败: %v\n", subdirPath, subdirPath, _err)
			return
		}
		if len(subEntries) == 0 {
			fmt.Printf("%s 为空, 跳过\n", subdirPath)
			// 创建work_init.json空文件
			workInitFilePath := filepath.Join(subdirPath, `work_init.json`)
			err = os.WriteFile(workInitFilePath, nil, 0644)
			if err != nil {
				fmt.Printf("%s 创建work_init.json文件失败: %v\n", subdirPath, err)
				continue
			}
			continue
		}

		workDoneFilePath := ""
		workFilePath := ""
		workInitFilePath := ""
		for _, subEntry := range subEntries {
			// 是否有工作产出完毕标记文件
			if !subEntry.IsDir() && subEntry.Name() == configWork.WorkDoneFileName {
				workDoneFilePath = filepath.Join(subdirPath, subEntry.Name())
			}

			// 是否有工作产出文件
			if !subEntry.IsDir() && subEntry.Name() == configWork.WorkFileName {
				workFilePath = filepath.Join(subdirPath, subEntry.Name())
			}

			// 是否有工作产出初始文件
			if !subEntry.IsDir() && subEntry.Name() == `work_init.json` {
				workInitFilePath = filepath.Join(subdirPath, subEntry.Name())
			}
		}
		// 有工作产出完毕标记文件, 则跳过
		if workDoneFilePath != "" {
			// fmt.Printf("%s 已格式化过, 有完成标记, 忽略\n", subdirPath)
			continue
		}
		// 没有工作产出初始文件, 则跳过
		if workInitFilePath == "" {
			fmt.Printf("%s 不包含初始工作产出文件, 不能上传\n", subdirPath)
			continue
		}

		// 读取工作产出初始文件
		workInitData, err := os.ReadFile(workInitFilePath)
		if err != nil {
			fmt.Println(err.Error())
			continue
		}

		if len(workInitData) == 0 {
			fmt.Printf("%s 初始工作产出文件为空, 跳过\n", subdirPath)
			continue
		}

		// 转成map[string]any
		var workInitMap map[string]any
		err = json.Unmarshal(workInitData, &workInitMap)
		if err != nil {
			fmt.Printf("%s 初始工作产出文件解析失败: %v, err:%v\n", subdirPath, workInitData, err)
			continue
		}

		dataList := workInitMap["Data"].([]any)
		dataItem := dataList[0]
		// fmt.Println(dataItem)
		dataItemMap, ok := dataItem.(map[string]any)
		if !ok {
			fmt.Printf("%s dataItem 类型断言失败: %v\n", subdirPath, dataItem)
			continue
		}
		contentStr := dataItemMap["Content"].(string)
		// fmt.Println(contentStr)

		var data map[string]any
		err = json.Unmarshal([]byte(contentStr), &data)
		if err != nil {
			fmt.Printf("%s 初始工作产出文件解析失败: %v, err:%v\n", subdirPath, workInitData, err)
			continue
		}
		prompt_meta := data["prompt_meta"].(map[string]any)
		prompt_meta["inputs"] = ""
		data["prompt_meta"] = prompt_meta

		// data写入格式化后的workFilePath
		contentBytes, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			fmt.Printf("%s 格式化工作产出文件解析失败: %v, err:%v\n", subdirPath, workInitData, err)
			continue
		}

		// 写入格式化后的workFilePath
		workFilePath = filepath.Join(subdirPath, configWork.WorkFileName)
		err = os.WriteFile(workFilePath, contentBytes, 0644)
		if err != nil {
			fmt.Printf("%s 写入格式化后的工作产出文件失败: %v, err:%v\n", subdirPath, workFilePath, err)
			continue
		}

		// 写入格式化后的workDoneFilePath
		workDoneFilePath = filepath.Join(subdirPath, configWork.WorkDoneFileName)
		err = os.WriteFile(workDoneFilePath, []byte("1"), 0644)
		if err != nil {
			fmt.Printf("%s 写入格式化后的工作产出完毕标记文件失败: %v, err:%v\n", subdirPath, workDoneFilePath, err)
			continue
		}

		fmt.Printf("%s 已格式化\n", subdirPath)

	}
	fmt.Printf("全部工作目录已处理: %s\n", workSpace)
}

// 拉取并创建新工作
func (d *dogfoodingTestingCmd) downloadWorks(ctx context.Context, questionId string) {

	workSpace := d.workHome + `/works`

	if questionId == "" {
		fmt.Println("错误: question_id 不能为空")
		return
	}

	// 读取飞书多维表格中未完成的工作
	feishuResp, err := feishuCloudDocBusiness.BaseTablesBusiness.SearchBaseTables(ctx, larkbitable.NewSearchAppTableRecordReqBuilder().
		AppToken(d.feishuDocAppToken).
		TableId(d.feishuDocTableId).
		PageSize(10).
		Body(larkbitable.NewSearchAppTableRecordReqBodyBuilder().
			ViewId(d.feishuDocViewId).
			Filter(&larkbitable.FilterInfo{
				Conjunction: &configWork.ConjunctionAnd,
				Conditions:  d.getQuestionWorksFilter(questionId),
			}).
			Build()).Build())
	if err != nil {
		fmt.Println(err.Error())
		return
	}
	if feishuResp == nil || feishuResp.Data == nil {
		fmt.Println("返回数据为空")
		return
	}
	if len(feishuResp.Data.Items) == 0 {
		fmt.Println("未完成的工作数量为0")
		return
	} else if len(feishuResp.Data.Items) > 1 {
		fmt.Println("未完成的工作数量大于1")
		return
	}
	fieldsMap := feishuResp.Data.Items[0].Fields
	queueName := fieldsMap[`队列名称`].(string)
	questionSpaceName := fmt.Sprintf("%s---%s", queueName, questionId)
	questionSpacePath := filepath.Join(workSpace, questionSpaceName)
	// 目录不存在则创建题目目录
	if _, err := os.Stat(questionSpacePath); os.IsNotExist(err) {
		err = os.MkdirAll(questionSpacePath, 0755)
		if err != nil {
			fmt.Printf("%s 创建题目目录失败: %v\n", questionSpacePath, err)
			return
		}
	}

	// 生成初始化work_init.json
	d.formatWorks(ctx)

	// 将fieldsMap数据写入qa.json文件
	fieldsJson, _err := json.MarshalIndent(fieldsMap, "", "  ")
	if _err != nil {
		fmt.Printf("解析记录 %s 失败: %v\n", questionId, _err)
		return
	}
	qaFilePath := filepath.Join(questionSpacePath, `qa.json`)
	err = os.WriteFile(qaFilePath, fieldsJson, 0644)
	if err != nil {
		fmt.Printf("%s 写入qa.json文件失败: %v\n", qaFilePath, err)
		return
	}

	fmt.Printf("%s 已创建qa.json文件\n", qaFilePath)
}

// 拉取并更新已完成的工作
func (d *dogfoodingTestingCmd) uploadWorks(ctx context.Context) {
	workBusiness.CreateBusiness.WorkHome = d.workHome
	workBusiness.CreateBusiness.UploadFields = d.uploadFields
	workBusiness.CreateBusiness.UploadRequiredFields = d.uploadRequiredFields
	workBusiness.CreateBusiness.FeishuDocAppToken = d.feishuDocAppToken
	workBusiness.CreateBusiness.FeishuDocTableId = d.feishuDocTableId
	workBusiness.CreateBusiness.FeishuDocViewId = d.feishuDocViewId

	err := workBusiness.CreateBusiness.CreateWorks(ctx)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println()
}

// 获取未完成工作
func (d *dogfoodingTestingCmd) getQuestionWorksFilter(questionId string) []*larkbitable.Condition {
	return []*larkbitable.Condition{
		// {
		// 	FieldName: &d.tableFieldNameId,
		// 	Operator:  &configWork.OperatorIs,
		// 	Value:     []string{questionId},
		// },
	}
}
