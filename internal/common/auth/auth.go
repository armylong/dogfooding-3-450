// Package auth 提供JWT认证、内存缓存和中间件功能
// 支持多设备登录，同类型设备登录会踢掉旧设备
package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"github.com/armylong/armylong-go/internal/model/user"
	"github.com/armylong/go-library/service/longgin"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var (
	tokenCache sync.Map                             // 内存缓存，key: login_[token], value: *TbUser
	jwtSecret  = []byte("armylong-secret-key-2024") // JWT签名密钥
)

// Claims JWT Token的声明结构
type Claims struct {
	Uid        int64  `json:"uid"`         // 用户ID
	Name       string `json:"name"`        // 用户名
	DeviceType string `json:"device_type"` // 设备类型
	jwt.RegisteredClaims
}

// GenerateToken 生成JWT Token
// 参数:
//   - u: 用户信息
//   - deviceType: 设备类型 (pc/mobile/tablet/mini)
//   - expireDuration: 过期时长
//
// 返回:
//   - tokenString: JWT Token字符串
//   - expireAt: 过期时间戳
//   - error: 错误信息
func GenerateToken(u *user.TbUser, deviceType string, expireDuration time.Duration) (string, int64, error) {
	expireAt := time.Now().Add(expireDuration)
	claims := &Claims{
		Uid:        u.Uid,
		Name:       u.Name,
		DeviceType: deviceType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "armylong",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", 0, err
	}

	return tokenString, expireAt.Unix(), nil
}

// ParseToken 解析JWT Token
// 返回Token中的声明信息，如果Token无效或已过期则返回错误
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// GenerateRandomToken 生成随机Token字符串
// 用于生成不重复的随机标识
func GenerateRandomToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// SetCache 将用户信息写入内存缓存
// key格式: login_[token]
func SetCache(token string, u *user.TbUser) {
	tokenCache.Store("login_"+token, u)
}

// GetCache 从内存缓存获取用户信息
// 如果缓存中没有则返回nil
func GetCache(token string) *user.TbUser {
	if v, ok := tokenCache.Load("login_" + token); ok {
		return v.(*user.TbUser)
	}
	return nil
}

// DeleteCache 从内存缓存删除指定Token
func DeleteCache(token string) {
	tokenCache.Delete("login_" + token)
}

// DeleteCacheByTokens 批量删除内存缓存中的Token
// 用于踢下线时批量清除
func DeleteCacheByTokens(tokens []string) {
	for _, token := range tokens {
		tokenCache.Delete("login_" + token)
	}
}

// Middleware 登录验证中间件
// 验证流程:
//  1. 从Header获取Authorization Token
//  2. 解析JWT Token验证签名和过期时间
//  3. 查内存缓存，有则通过
//  4. 没有则查数据库，有则回写内存并通过
//  5. 都没有则返回401
func Middleware(ctx *gin.Context) {
	token := ctx.GetHeader("Authorization")
	if token == "" {
		ctx.AbortWithStatusJSON(200, gin.H{
			"errorCode": 401,
			"errorMsg":  "请先登录",
		})
		return
	}

	_, err := ParseToken(token)
	if err != nil {
		ctx.AbortWithStatusJSON(200, gin.H{
			"errorCode": 401,
			"errorMsg":  "Token无效或已过期",
		})
		return
	}

	u := GetCache(token)
	if u == nil {
		tokenRecord, err := user.TbUserTokenModel.GetByToken(token)
		if err != nil || tokenRecord == nil {
			ctx.AbortWithStatusJSON(200, gin.H{
				"errorCode": 401,
				"errorMsg":  "请重新登录",
			})
			return
		}

		if tokenRecord.ExpireAt > 0 && tokenRecord.ExpireAt < time.Now().Unix() {
			ctx.AbortWithStatusJSON(200, gin.H{
				"errorCode": 401,
				"errorMsg":  "Token已过期",
			})
			return
		}

		u, err = user.TbUserModel.GetByUid(tokenRecord.Uid)
		if err != nil || u == nil {
			ctx.AbortWithStatusJSON(200, gin.H{
				"errorCode": 401,
				"errorMsg":  "用户不存在",
			})
			return
		}

		SetCache(token, u)
	}

	ctx.Set("login_user", u)
	ctx.Set("login_token", token)
	ctx.Next()
}

// LoginUid 获取当前登录用户ID
// 必须在Middleware之后调用
func LoginUid(ctx context.Context) int64 {
	u := LoginUser(ctx)
	if u != nil {
		return u.Uid
	}
	return 0
}

// LoginUser 获取当前登录用户完整信息
// 必须在Middleware之后调用
func LoginUser(ctx context.Context) *user.TbUser {
	return loginUser(ctx)
}

func loginUser(ctx context.Context) *user.TbUser {
	ginContext, err := longgin.GetGinContext(ctx)
	if err != nil {
		return nil
	}
	if v, exists := ginContext.Get("login_user"); exists {
		return v.(*user.TbUser)
	}
	return nil

}

// LoginToken 获取当前登录用户的Token
// 必须在Middleware之后调用
func LoginToken(ctx *gin.Context) string {
	if v, exists := ctx.Get("login_token"); exists {
		return v.(string)
	}
	return ""
}
