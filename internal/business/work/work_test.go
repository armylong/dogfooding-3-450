package work

import (
	"context"
	"fmt"
	"testing"

	libraryConf "github.com/armylong/go-library/service/conf"
)

var ctx = context.Background()

func TestDownloadWorks(t *testing.T) {
	WorkHome := `/root/works/doubao_testing`
	DownloadBusiness = &downloadBusiness{
		WorkHome: WorkHome,
	}
	err := DownloadBusiness.DownloadWorks(ctx)
	fmt.Println(err)
}

func TestEnv(t *testing.T) {
	env := libraryConf.GetEnv()
	fmt.Println(env)
}
