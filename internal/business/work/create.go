package work

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	feishuCloudDocBusiness "github.com/armylong/armylong-go/internal/business/feishu/cloud_doc"
	configWork "github.com/armylong/armylong-go/internal/common/config"
	libraryUtils "github.com/armylong/go-library/utils"
	larkbitable "github.com/larksuite/oapi-sdk-go/v3/service/bitable/v1"
)

type createBusiness struct {
	WorkHome  string
	workSpace string

	UploadFields         []string
	UploadRequiredFields []string

	FeishuDocAppToken string
	FeishuDocTableId  string
	FeishuDocViewId   string
}

var CreateBusiness = &createBusiness{}

func (b *createBusiness) initWork() error {
	if b.WorkHome == "" {
		return errors.New("初始化失败: workHome is empty")
	}

	b.workSpace = b.WorkHome + `/works`

	return nil
}

func (b *createBusiness) CreateWorks(ctx context.Context) (err error) {
	initErr := b.initWork()
	if initErr != nil {
		return initErr
	}

	// 查找工作目录下的所有题目目录
	entries, err := os.ReadDir(b.workSpace)
	if err != nil {
		fmt.Printf("工作目录不存在 %s: %v\n", b.workSpace, err)
		return err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		// fmt.Printf("题目目录: %s\n", entry.Name())
		// 如果不包含工作完成文件标记, 忽略
		subdirPath := filepath.Join(b.workSpace, entry.Name())
		subEntries, _err := os.ReadDir(subdirPath)
		if err != nil {
			fmt.Printf("读取子目录 %s 失败: %v\n", subdirPath, err)
			return _err
		}
		if len(subEntries) == 0 {
			fmt.Printf("子目录 %s 为空, 跳过\n", subdirPath)
			continue
		}

		uploadDone := false
		qaDone := false
		qaFilePath := ""
		for _, subEntry := range subEntries {
			// 已上传过则忽略
			if !subEntry.IsDir() && subEntry.Name() == configWork.UploadDoneFileName {
				uploadDone = true
			}
			// 不包含质检完成标记则不上传
			if !subEntry.IsDir() && subEntry.Name() == configWork.QaDoneFileName {
				qaDone = true
			}
			// 如果包含质检数据文件, 则上传
			if !subEntry.IsDir() && subEntry.Name() == configWork.QaFileName {
				qaFilePath = filepath.Join(subdirPath, subEntry.Name())
			}
		}
		if uploadDone {
			// fmt.Printf("%s 已上传过, 忽略\n", subdirPath)
			continue
		}
		if !qaDone {
			fmt.Printf("%s 不包含质检完成标记, 不能上传\n", subdirPath)
			continue
		}
		if qaFilePath == "" {
			fmt.Printf("%s 不包含质检数据文件, 不能上传\n", subdirPath)
			continue
		}

		// 读取工作产出文件
		qaData, err := os.ReadFile(qaFilePath)
		if err != nil {
			fmt.Println(err.Error())
			continue
		}
		// 转成map[string]any
		var qaDataMap map[string]any
		err = json.Unmarshal(qaData, &qaDataMap)
		if err != nil {
			fmt.Printf("质检数据文件解析失败: %v, err:%v\n", qaData, err)
			continue
		}

		uploadMap := make(map[string]any)
		var missingFields []string // 缺失字段
		for _, field := range b.UploadFields {
			if value, ok := qaDataMap[field]; !ok {
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
			fmt.Printf("质检数据文件必填字段校验失败: %v, 跳过\n", missingFields)
			return errors.New("质检数据文件必填字段校验失败")
		}

		_, err = b.createFeishuDoc(ctx, uploadMap)
		if err != nil {
			fmt.Printf("更新飞书多维表格记录字段失败: %v, err:%v\n", uploadMap, err)
			return err
		}

		// 创建upload.done文件
		uploadDoneFilePath := filepath.Join(subdirPath, configWork.UploadDoneFileName)
		err = os.WriteFile(uploadDoneFilePath, []byte("1"), 0644)
		if err != nil {
			fmt.Printf("创建上传完成标记文件 %v 失败: %v\n", uploadDoneFilePath, err)
			return err
		}

		fmt.Printf("✓ 质检 %v 已更新飞书多维表格记录字段: %v\n", qaFilePath, uploadMap)
	}
	// fmt.Println(feishuResp)
	fmt.Printf("全部工作目录已处理: %s\n", b.workSpace)

	return nil
}

// 创建飞书多维表格记录字段
func (b *createBusiness) createFeishuDoc(ctx context.Context, Fields map[string]any) (resp *larkbitable.CreateAppTableRecordResp, err error) {
	// 创建请求对象
	req := larkbitable.NewCreateAppTableRecordReqBuilder().
		AppToken(b.FeishuDocAppToken).
		TableId(b.FeishuDocTableId).
		// RecordId(recordId).
		// UserIdType(`open_id`).
		// IgnoreConsistencyCheck(true).
		AppTableRecord(larkbitable.NewAppTableRecordBuilder().
			Fields(Fields).
			Build()).
		Build()
	resp, err = feishuCloudDocBusiness.BaseTablesBusiness.CreateBaseTables(ctx, req)

	// fmt.Println(larkcore.Prettify(resp))
	return
}
