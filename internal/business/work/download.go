package work

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	feishuCloudDocBusiness "github.com/armylong/armylong-go/internal/business/feishu/cloud_doc"
	configWork "github.com/armylong/armylong-go/internal/common/config"
	larkbitable "github.com/larksuite/oapi-sdk-go/v3/service/bitable/v1"
)

type downloadBusiness struct {
	WorkHome          string
	workSpace         string
	DownloadFields    []string
	FeishuDocAppToken string
	FeishuDocTableId  string
	FeishuDocViewId   string
	FilterConditions  []*larkbitable.Condition
}

var DownloadBusiness = &downloadBusiness{}

func (b *downloadBusiness) initWork() error {
	if b.WorkHome == "" {
		return errors.New("初始化失败: workHome is empty")
	}
	if b.DownloadFields == nil {
		return errors.New("初始化失败: downloadFields is empty")
	}
	if b.FeishuDocAppToken == "" {
		return errors.New("初始化失败: feishuDocAppToken is empty")
	}
	if b.FeishuDocTableId == "" {
		return errors.New("初始化失败: feishuDocTableId is empty")
	}
	if b.FeishuDocViewId == "" {
		return errors.New("初始化失败: feishuDocViewId is empty")
	}

	b.workSpace = b.WorkHome + `/works`

	return nil
}

func (b *downloadBusiness) DownloadWorks(ctx context.Context) (err error) {

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
	for _, item := range feishuResp.Data.Items {
		fmt.Printf("\n")
		if item.RecordId == nil {
			fmt.Printf("记录ID为空: %v\n", item)
			continue
		}
		recordId := *item.RecordId
		fmt.Printf("处理记录ID: %s\n", recordId)
		workDir := b.workSpace + "/" + *item.RecordId           // 工作目录
		workFilePath := workDir + "/" + configWork.WorkFileName // 工作参考文件
		// 查看工作目录下是否存在该记录的工作目录
		if _, err = os.Stat(workDir); os.IsNotExist(err) {
			// 不存在则创建
			err = os.MkdirAll(workDir, 0755)
			if err != nil {
				fmt.Printf("创建工作目录 %s 失败: %v\n", workDir, err)
				continue
			}
		} else {
			// 已存在则跳过
			fmt.Printf("工作目录已存在, 跳过: %v\n", workDir)
			continue
		}
		if item.Fields == nil {
			fmt.Printf("字段为空: %v\n", item)
			continue
		}
		// 只保存指定字段
		downloadData := make(map[string]any)
		for _, field := range b.DownloadFields {
			downloadData[field] = item.Fields[field]
		}
		itemJson, _err := json.MarshalIndent(downloadData, "", "  ")
		if _err != nil {
			fmt.Printf("解析记录 %s 失败: %v\n", recordId, _err)
			continue
		}

		err = os.WriteFile(workFilePath, itemJson, 0644)
		if err != nil {
			fmt.Printf("写入文件 %s 失败: %v\n", workFilePath, err)
			continue
		}
		fmt.Printf("✓ 工作目录创建成功: %v 已创建 %s 文件\n", workDir, configWork.WorkFileName)
	}
	// fmt.Println(feishuResp)
	fmt.Printf("全部工作目录已处理: %s\n", b.workSpace)

	return nil
}
