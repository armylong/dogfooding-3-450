// Package auth 提供用户认证相关的Controller
// 包括注册、登录、登出、踢下线等功能
package auth

import (
	bizAuth "github.com/armylong/armylong-go/internal/business/auth"
	"github.com/armylong/armylong-go/internal/common/auth"
	"github.com/gin-gonic/gin"
)

// AuthController 认证控制器
type AuthController struct{}

// ActionRegister 用户注册
func (c *AuthController) ActionRegister(ctx *gin.Context, req *bizAuth.RegisterRequest) (*bizAuth.LoginResponse, error) {
	return bizAuth.Register(req)
}

// ActionLogin 用户登录
func (c *AuthController) ActionLogin(ctx *gin.Context, req *bizAuth.LoginRequest) (*bizAuth.LoginResponse, error) {
	return bizAuth.Login(req)
}

// ActionLogout 用户登出
func (c *AuthController) ActionLogout(ctx *gin.Context) error {
	token := auth.LoginToken(ctx)
	return bizAuth.Logout(token)
}

// ActionKickoff 踢下线
func (c *AuthController) ActionKickoff(ctx *gin.Context, req *bizAuth.KickoffRequest) error {
	return bizAuth.Kickoff(req.Uid, req.DeviceType)
}
