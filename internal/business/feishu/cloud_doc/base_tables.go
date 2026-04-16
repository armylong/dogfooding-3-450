package cloud_doc

import (
	"context"
	"errors"
	"fmt"

	libraryFeishu "github.com/armylong/go-library/service/feishu"
	lark "github.com/larksuite/oapi-sdk-go/v3"
	larkcore "github.com/larksuite/oapi-sdk-go/v3/core"
	larkbitable "github.com/larksuite/oapi-sdk-go/v3/service/bitable/v1"
)

type baseTablesBusiness struct{}

var BaseTablesBusiness = &baseTablesBusiness{}

// go get -u github.com/larksuite/oapi-sdk-go/v3@latest
// SDK 使用文档：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/golang-sdk-guide/preparations
// 复制该 Demo 后, 需要将 "YOUR_APP_ID", "YOUR_APP_SECRET" 替换为自己应用的 APP_ID, APP_SECRET.
// 以下示例代码默认根据文档示例值填充，如果存在代码问题，请在 API 调试台填上相关必要参数后再复制代码使用
func (b *baseTablesBusiness) SearchBaseTables(ctx context.Context, req *larkbitable.SearchAppTableRecordReq) (res *larkbitable.SearchAppTableRecordResp, err error) {
	fsConfig := libraryFeishu.GetFsConfig()
	userAccessToken := libraryFeishu.GetUserAccessToken(nil)
	// fmt.Println("userAccessToken:", userAccessToken)

	// 创建 Client
	client := lark.NewClient(fsConfig.AppId, fsConfig.AppSecret)

	// 发起请求
	resp, err := client.Bitable.V1.AppTableRecord.Search(ctx, req, larkcore.WithUserAccessToken(userAccessToken))

	// 处理错误
	if err != nil {
		fmt.Println(err)
		return
	}

	if resp == nil {
		fmt.Println("resp is nil")
		return nil, errors.New("resp is nil")
	}

	// 服务端错误处理
	if !resp.Success() {
		fmt.Printf("logId: %s, error response: \n%s", resp.RequestId(), larkcore.Prettify(resp.CodeError))
		return nil, resp.CodeError
	}

	// 业务处理
	// fmt.Println(larkcore.Prettify(resp))
	return resp, nil
}

func (b *baseTablesBusiness) UpdateBaseTables(ctx context.Context, req *larkbitable.UpdateAppTableRecordReq) (res *larkbitable.UpdateAppTableRecordResp, err error) {
	fsConfig := libraryFeishu.GetFsConfig()
	userAccessToken := libraryFeishu.GetUserAccessToken(nil)
	// fmt.Println("userAccessToken:", userAccessToken)

	// 创建 Client
	client := lark.NewClient(fsConfig.AppId, fsConfig.AppSecret)

	// 发起请求
	resp, err := client.Bitable.V1.AppTableRecord.Update(ctx, req, larkcore.WithUserAccessToken(userAccessToken))

	// 处理错误
	if err != nil {
		fmt.Println(err)
		return
	}

	if resp == nil {
		fmt.Println("resp is nil")
		return nil, errors.New("resp is nil")
	}

	// 服务端错误处理
	if !resp.Success() {
		fmt.Printf("logId: %s, error response: %s\n", resp.RequestId(), larkcore.Prettify(resp.CodeError))
		return nil, resp.CodeError
	}

	// 业务处理
	// fmt.Println(larkcore.Prettify(resp))
	return resp, nil
}

func (b *baseTablesBusiness) CreateBaseTables(ctx context.Context, req *larkbitable.CreateAppTableRecordReq) (res *larkbitable.CreateAppTableRecordResp, err error) {
	fsConfig := libraryFeishu.GetFsConfig()
	userAccessToken := libraryFeishu.GetUserAccessToken(nil)
	// fmt.Println("userAccessToken:", userAccessToken)

	// 创建 Client
	client := lark.NewClient(fsConfig.AppId, fsConfig.AppSecret)

	// 发起请求
	resp, err := client.Bitable.V1.AppTableRecord.Create(ctx, req, larkcore.WithUserAccessToken(userAccessToken))

	// 处理错误
	if err != nil {
		fmt.Println(err)
		return
	}

	if resp == nil {
		fmt.Println("resp is nil")
		return nil, errors.New("resp is nil")
	}

	// 服务端错误处理
	if !resp.Success() {
		fmt.Printf("logId: %s, error response: %s\n", resp.RequestId(), larkcore.Prettify(resp.CodeError))
		return nil, resp.CodeError
	}

	// 业务处理
	// fmt.Println(larkcore.Prettify(resp))
	return resp, nil
}
