package feishu

import (
	"context"
	"fmt"
	"sync"
	"testing"

	feishuLibrary "github.com/armylong/go-library/service/feishu"
)

var ctx = context.Background()

func TestInitUserAccessToken(t *testing.T) {
	code := "dLAnI0eBwE6fAcH89CAAe7AGcK045I9e"
	redirectUri := "https://olfrzjwptnle.ap-northeast-1.clawcloudrun.com"
	userAccessTokenHeader := feishuLibrary.GetUserAccessTokenHeader(&feishuLibrary.GetUserAccessTokenRequest{
		Code:        code,
		RedirectURI: redirectUri,
	})
	fmt.Println(userAccessTokenHeader)
}

func TestRefreshUserAccessToken(t *testing.T) {
	feishuLibrary.GetUserAccessTokenHeader(nil)
	// feishuLibrary.GetUserAccessTokenHeader(nil)
	// userAccessTokenHeader := feishuLibrary.GetUserAccessTokenHeader(nil)
	// fmt.Println(userAccessTokenHeader)
}

func TestGetUserAccessToken(t *testing.T) {
	// 并发获取用户AccessTokenHeader
	wg := sync.WaitGroup{}
	wg.Add(5)
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			feishuLibrary.GetUserAccessTokenHeader(nil)
		}()
	}
	wg.Wait()
}
