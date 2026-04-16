package auth

import (
	"errors"
	"time"

	"github.com/armylong/armylong-go/internal/common/auth"
	"github.com/armylong/armylong-go/internal/model/user"
	"golang.org/x/crypto/bcrypt"
)

// Login 用户登录
// 支持多设备登录，同类型设备登录会踢掉旧设备
func Login(req *LoginRequest) (*LoginResponse, error) {
	if req.Account == "" || req.Password == "" {
		return nil, errors.New("账号和密码不能为空")
	}

	// 默认设备类型为pc
	deviceType := req.DeviceType
	if deviceType == "" {
		deviceType = "pc"
	}

	// 查询用户
	u, err := user.TbUserModel.GetByAccount(req.Account)
	if err != nil || u == nil {
		return nil, errors.New("账号不存在")
	}

	// 检查用户状态
	if u.Status != 1 {
		return nil, errors.New("账号已被禁用")
	}

	// 验证密码
	err = bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("密码错误")
	}

	// 生成Token
	token, expireAt, err := auth.GenerateToken(u, deviceType, 7*24*time.Hour)
	if err != nil {
		return nil, errors.New("生成Token失败")
	}

	// 删除该用户同类型设备的旧Token（踢掉旧设备）
	user.TbUserTokenModel.DeleteByUidAndDeviceType(u.Uid, deviceType)

	// 保存新Token到数据库
	tokenRecord := &user.TbUserToken{
		Uid:        u.Uid,
		Token:      token,
		DeviceType: deviceType,
		ExpireAt:   expireAt,
	}
	user.TbUserTokenModel.Create(tokenRecord)

	// 写入内存缓存
	auth.SetCache(token, u)

	return &LoginResponse{
		Token: token,
		User:  u,
	}, nil
}

// Logout 用户登出
// 删除内存缓存和数据库中的Token
func Logout(token string) error {
	if token != "" {
		// 删除内存缓存
		auth.DeleteCache(token)
		// 删除数据库记录
		user.TbUserTokenModel.DeleteByToken(token)
	}
	return nil
}
