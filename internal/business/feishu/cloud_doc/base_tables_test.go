package cloud_doc

import (
	"context"
	"fmt"
	"testing"

	larkcore "github.com/larksuite/oapi-sdk-go/v3/core"
	larkbitable "github.com/larksuite/oapi-sdk-go/v3/service/bitable/v1"
)

var (
	ctx = context.Background()
)

const (
	FeishuDocAppToken = `CE3BwYISBiEG4KkG04UcTfr6nRh`
	FeishuDocTableId  = `tbliWHNKeW9dcQnw`
	FeishuDocViewId   = `vewGNON9rb`
)

func Test_baseTablesBusiness_SearchBaseTables(t *testing.T) {
	// 创建请求对象
	req := larkbitable.NewSearchAppTableRecordReqBuilder().
		AppToken(FeishuDocAppToken).
		TableId(FeishuDocTableId).
		// UserIdType(``).
		// PageToken(``).
		PageSize(10).
		Body(larkbitable.NewSearchAppTableRecordReqBodyBuilder().
			ViewId(FeishuDocViewId).
			// FieldNames([]string{`字段1`, `字段2`}).
			// Sort([]*larkbitable.Sort{
			// 	larkbitable.NewSortBuilder().
			// 		FieldName(`多行文本`).
			// 		Desc(true).
			// 		Build(),
			// }).
			// Filter(filter).
			// AutomaticFields().
			Build()).
		Build()
	resp, err := BaseTablesBusiness.SearchBaseTables(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(larkcore.Prettify(resp))
}

// func Test_baseTablesBusiness_UpdateBaseTables(t *testing.T) {
// 	recordId := "recvfHRdZHYyXb"
// 	// 创建请求对象
// 	req := larkbitable.NewUpdateAppTableRecordReqBuilder().
// 		AppToken(FeishuDocAppToken).
// 		TableId(FeishuDocTableId).
// 		RecordId(recordId).
// 		// UserIdType(`open_id`).
// 		// IgnoreConsistencyCheck(true).
// 		AppTableRecord(larkbitable.NewAppTableRecordBuilder().
// 			Fields(map[string]any{`正确性`: `1`, `完整性`: `2`}).
// 			Build()).
// 		Build()
// 	resp, err := BaseTablesBusiness.UpdateBaseTables(ctx, req)
// 	if err != nil {
// 		t.Fatal(err)
// 	}
// 	fmt.Println(larkcore.Prettify(resp))
// }
