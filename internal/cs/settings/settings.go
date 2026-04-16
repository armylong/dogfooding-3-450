package settings

import (
	userModel "github.com/armylong/armylong-go/internal/model/user"
)

type UpdateSettingsRequest struct {
	Uid      int64                    `json:"uid" form:"uid"`
	Settings *userModel.TbUserSetting `json:"settings" form:"settings"`
}

type CommonResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
