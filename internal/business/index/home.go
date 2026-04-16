package index

import (
	"context"

	auth "github.com/armylong/armylong-go/internal/common/auth"
	indexCs "github.com/armylong/armylong-go/internal/cs/index"
	userModel "github.com/armylong/armylong-go/internal/model/user"
)

type homeBusiness struct{}

var HomeBusiness = &homeBusiness{}

func (h *homeBusiness) DesktopOs(ctx context.Context, req *indexCs.DesktopOsRequest) (res *indexCs.DesktopOsResponse, err error) {
	uid := auth.LoginUid(ctx)
	if uid == 0 {
		return nil, nil
	}
	user, err := userModel.TbUserModel.GetByUid(uid)
	if err != nil {
		return nil, nil
	}
	userSetting, err := userModel.TbUserSettingsModel.GetByUid(uid)
	if err != nil {
		return &indexCs.DesktopOsResponse{
			User:    user,
			Setting: &userModel.TbUserSetting{},
		}, nil
	}
	return &indexCs.DesktopOsResponse{
		User:    user,
		Setting: userSetting.Settings,
	}, nil
}
