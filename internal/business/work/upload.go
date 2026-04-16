package work

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	feishuCloudDocBusiness "github.com/armylong/armylong-go/internal/business/feishu/cloud_doc"
	configWork "github.com/armylong/armylong-go/internal/common/config"
	libraryUtils "github.com/armylong/go-library/utils"
	larkbitable "github.com/larksuite/oapi-sdk-go/v3/service/bitable/v1"
)

type uploadBusiness struct {
	WorkHome  string
	workSpace string

	UploadFields         []string
	UploadRequiredFields []string

	FeishuDocAppToken string
	FeishuDocTableId  string
	FeishuDocViewId   string
	FilterConditions  []*larkbitable.Condition
}

var UploadBusiness = &uploadBusiness{}

func (b *uploadBusiness) initWork() error {
	if b.WorkHome == "" {
		return errors.New("初始化失败: workHome is empty")
	}

	b.workSpace = b.WorkHome + `/works`

	return nil
}

func (b *uploadBusiness) UploadWorks(ctx context.Context) (err error) {
	initErr := b.initWork()
	if initErr != nil {
		return initErr
	}

	// 读取飞书多维表格中未完成的工作
	feishuResp, err := feishuCloudDocBusiness.BaseTablesBusiness.SearchBaseTables(ctx, larkbitable.NewSearchAppTableRecordReqBuilder().
		AppToken(b.FeishuDocAppToken).
		TableId(b.FeishuDocTableId).
		PageSize(10).
		Body(larkbitable.NewSearchAppTableRecordReqBodyBuilder().
			ViewId(b.FeishuDocViewId).
			Filter(&larkbitable.FilterInfo{
				Conjunction: &configWork.ConjunctionAnd,
				Conditions:  b.FilterConditions,
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

	// 创建工作数据到工作目录(如果已存在工作目录则跳过)
	// 上传已完成的工作数据至飞书多维表格
	for _, item := range feishuResp.Data.Items {
		fmt.Printf("\n")
		if item.RecordId == nil {
			fmt.Printf("记录ID为空: %v\n", item)
			continue
		}
		recordId := *item.RecordId
		fmt.Printf("处理记录ID: %s\n", recordId)
		// 查看工作目录下是否存在该记录的工作目录
		workDir := b.workSpace + "/" + recordId
		if _, err := os.Stat(workDir); os.IsNotExist(err) {
			// 不存在则跳过
			fmt.Printf("工作目录不存在, 跳过: %v\n", workDir)
			continue
		}

		// 查看工作目录下是否存在该记录的工作文件
		workingFile := workDir + "/" + configWork.WorkFileName
		if _, err := os.Stat(workingFile); os.IsNotExist(err) {
			// 不存在则跳过
			fmt.Printf("工作产出文件不存在, 跳过: %v\n", workingFile)
			continue
		}
		workFinishFile := workDir + "/" + configWork.WorkDoneFileName
		if _, err := os.Stat(workFinishFile); os.IsNotExist(err) {
			// 不存在则跳过
			fmt.Printf("工作完成标记文件不存在, 跳过: %v\n", workFinishFile)
			continue
		}

		// 读取工作产出文件
		workingData, err := os.ReadFile(workingFile)
		if err != nil {
			fmt.Println(err.Error())
			continue
		}
		// 转成map[string]any
		var workingDataMap map[string]any
		err = json.Unmarshal(workingData, &workingDataMap)
		if err != nil {
			fmt.Printf("工作产出文件解析失败: %v, err:%v\n", workingData, err)
			continue
		}

		uploadMap := make(map[string]any)
		var missingFields []string // 缺失字段
		for _, field := range b.UploadFields {
			if value, ok := workingDataMap[field]; !ok {
				// 如果字段不存在, 且是必填字段, 跳过
				if libraryUtils.InArray(field, b.UploadRequiredFields) {
					missingFields = append(missingFields, field)
					continue
				}
			} else {
				// 如果字段存在, 且是必填字段, 但值为空, 跳过
				if libraryUtils.InArray(field, b.UploadRequiredFields) && (value == nil || value == "") {
					missingFields = append(missingFields, field)
					continue
				} else {
					uploadMap[field] = value
				}
			}
		}

		if len(missingFields) > 0 {
			fmt.Printf("工作产出文件必填字段校验失败: %v, 跳过\n", missingFields)
			continue
		}

		_, err = b.uploadFeishuDoc(ctx, recordId, uploadMap)
		if err != nil {
			fmt.Printf("更新飞书多维表格记录字段失败: %v, err:%v\n", uploadMap, err)
			continue
		}
		fmt.Printf("✓ 工作 %v 已更新飞书多维表格记录字段: %v\n", recordId, uploadMap)
	}
	// fmt.Println(feishuResp)
	fmt.Printf("全部工作目录已处理: %s\n", b.workSpace)

	return nil
}

// 更新飞书多维表格记录字段
func (b *uploadBusiness) uploadFeishuDoc(ctx context.Context, recordId string, Fields map[string]any) (resp *larkbitable.UpdateAppTableRecordResp, err error) {
	// 创建请求对象
	req := larkbitable.NewUpdateAppTableRecordReqBuilder().
		AppToken(b.FeishuDocAppToken).
		TableId(b.FeishuDocTableId).
		RecordId(recordId).
		// UserIdType(`open_id`).
		// IgnoreConsistencyCheck(true).
		AppTableRecord(larkbitable.NewAppTableRecordBuilder().
			Fields(Fields).
			Build()).
		Build()
	resp, err = feishuCloudDocBusiness.BaseTablesBusiness.UpdateBaseTables(ctx, req)

	// fmt.Println(larkcore.Prettify(resp))
	return
}
