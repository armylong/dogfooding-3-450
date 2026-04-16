package auth

import (
	"errors"
	"time"

	"github.com/armylong/armylong-go/internal/common/auth"
	"github.com/armylong/armylong-go/internal/model/user"
	"golang.org/x/crypto/bcrypt"
)

// Register 用户注册
// 注册成功后自动登录，返回Token和用户信息
func Register(req *RegisterRequest) (*LoginResponse, error) {
	if req.Account == "" || req.Password == "" {
		return nil, errors.New("账号和密码不能为空")
	}

	// 检查账号是否已存在
	existingUser, _ := user.TbUserModel.GetByAccount(req.Account)
	if existingUser != nil {
		return nil, errors.New("账号已存在")
	}

	// 密码加密
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}

	// 创建用户
	u := &user.TbUser{
		Account:  req.Account,
		Password: string(hashedPassword),
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Status:   1,
	}

	_, err = user.TbUserModel.Create(u)
	if err != nil {
		return nil, errors.New("创建用户失败: " + err.Error())
	}

	// 查询创建后的用户
	createdUser, _ := user.TbUserModel.GetByAccount(req.Account)

	// 生成Token
	token, expireAt, err := auth.GenerateToken(createdUser, "pc", 7*24*time.Hour)
	if err != nil {
		return nil, errors.New("生成Token失败")
	}

	// 保存Token到数据库
	tokenRecord := &user.TbUserToken{
		Uid:        createdUser.Uid,
		Token:      token,
		DeviceType: "pc",
		ExpireAt:   expireAt,
	}
	user.TbUserTokenModel.Create(tokenRecord)

	// 写入内存缓存
	auth.SetCache(token, createdUser)

	return &LoginResponse{
		Token: token,
		User:  createdUser,
	}, nil
}
