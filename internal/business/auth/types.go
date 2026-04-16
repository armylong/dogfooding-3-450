// Package auth 提供用户认证相关的业务逻辑
package auth

import (
	"github.com/armylong/armylong-go/internal/model/user"
)

// LoginRequest 登录请求参数
type LoginRequest struct {
	Account    string `json:"account" form:"account"`         // 账号
	Password   string `json:"password" form:"password"`       // 密码
	DeviceType string `json:"device_type" form:"device_type"` // 设备类型: pc/mobile/tablet/mini
}

// RegisterRequest 注册请求参数
type RegisterRequest struct {
	Account  string `json:"account" form:"account"`   // 账号
	Password string `json:"password" form:"password"` // 密码
	Name     string `json:"name" form:"name"`         // 用户名
	Email    string `json:"email" form:"email"`       // 邮箱
	Phone    string `json:"phone" form:"phone"`       // 手机号
}

// LoginResponse 登录/注册响应
type LoginResponse struct {
	Token string       `json:"token"` // JWT Token
	User  *user.TbUser `json:"user"`  // 用户信息
}

// KickoffRequest 踢下线请求参数
type KickoffRequest struct {
	Uid        int64  `json:"uid" form:"uid"`                 // 用户ID
	DeviceType string `json:"device_type" form:"device_type"` // 设备类型，为空则踢所有设备
}
