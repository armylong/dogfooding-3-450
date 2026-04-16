package settings

import (
	"errors"

	"github.com/armylong/armylong-go/internal/cs/settings"
	"github.com/armylong/armylong-go/internal/model/user"
	"github.com/gin-gonic/gin"
)

type SettingsController struct {
}

func (c *SettingsController) ActionUpdate(ctx *gin.Context, req *settings.UpdateSettingsRequest) (*settings.CommonResponse, error) {
	if req.Uid <= 0 {
		return nil, errors.New("uid不能为空")
	}

	if req.Settings == nil {
		return nil, errors.New("settings不能为空")
	}

	err := user.TbUserSettingsModel.CreateOrUpdate(req.Uid, *req.Settings)
	if err != nil {
		return nil, errors.New("保存设置失败")
	}

	return &settings.CommonResponse{
		Success: true,
		Message: "保存成功",
	}, nil
}
