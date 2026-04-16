package auth

import (
	"errors"

	"github.com/armylong/armylong-go/internal/common/auth"
	"github.com/armylong/armylong-go/internal/model/user"
)

// Kickoff 踢下线
// 可以踢指定设备类型，也可以踢所有设备
func Kickoff(uid int64, deviceType string) error {
	if uid == 0 {
		return errors.New("缺少用户ID")
	}

	var tokens []*user.TbUserToken
	var err error

	if deviceType != "" {
		// 踢指定设备类型
		tokens, err = user.TbUserTokenModel.ListByUid(uid)
		if err != nil {
			return errors.New("查询Token失败")
		}
		// 过滤出指定设备类型的Token
		var filtered []*user.TbUserToken
		for _, t := range tokens {
			if t.DeviceType == deviceType {
				filtered = append(filtered, t)
			}
		}
		tokens = filtered

		// 删除数据库记录
		user.TbUserTokenModel.DeleteByUidAndDeviceType(uid, deviceType)
	} else {
		// 踢所有设备
		tokens, err = user.TbUserTokenModel.ListByUid(uid)
		if err != nil {
			return errors.New("查询Token失败")
		}

		// 删除数据库记录
		user.TbUserTokenModel.DeleteByUid(uid)
	}

	// 批量删除内存缓存
	tokenStrings := make([]string, len(tokens))
	for i, t := range tokens {
		tokenStrings[i] = t.Token
	}
	auth.DeleteCacheByTokens(tokenStrings)

	return nil
}
