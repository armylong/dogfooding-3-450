package index

import (
	userModel "github.com/armylong/armylong-go/internal/model/user"
)

type DesktopOsRequest struct {
}

type DesktopOsResponse struct {
	User    *userModel.TbUser        `json:"user"`
	Setting *userModel.TbUserSetting `json:"setting"`
}
