package auth

import (
	"fmt"
	"testing"
	"time"

	"github.com/armylong/armylong-go/internal/model/user"
)

// TestGenerateToken 测试生成JWT Token
func TestGenerateToken(t *testing.T) {
	u := &user.TbUser{
		Uid:     1,
		Name:    "测试用户",
		Account: "test",
	}

	token, expireAt, err := GenerateToken(u, "pc", 7*24*time.Hour)
	if err != nil {
		fmt.Println("生成Token失败:", err)
		return
	}

	fmt.Println("========== TestGenerateToken ==========")
	fmt.Println("Token:", token)
	fmt.Println("ExpireAt:", expireAt)
	fmt.Println("ExpireTime:", time.Unix(expireAt, 0).Format("2006-01-02 15:04:05"))
}

// TestParseToken 测试解析JWT Token
func TestParseToken(t *testing.T) {
	u := &user.TbUser{
		Uid:     1,
		Name:    "测试用户",
		Account: "test",
	}

	token, _, _ := GenerateToken(u, "mobile", 7*24*time.Hour)

	claims, err := ParseToken(token)
	if err != nil {
		fmt.Println("解析Token失败:", err)
		return
	}

	fmt.Println("========== TestParseToken ==========")
	fmt.Println("Uid:", claims.Uid)
	fmt.Println("Name:", claims.Name)
	fmt.Println("DeviceType:", claims.DeviceType)
	fmt.Println("Issuer:", claims.Issuer)
}

// TestCache 测试内存缓存
func TestCache(t *testing.T) {
	u := &user.TbUser{
		Uid:     1,
		Name:    "测试用户",
		Account: "test",
	}
	token := "test_token_123"

	fmt.Println("========== TestCache ==========")

	SetCache(token, u)
	fmt.Println("SetCache: 写入缓存")

	cached := GetCache(token)
	if cached != nil {
		fmt.Println("GetCache: 获取成功, Name=", cached.Name)
	} else {
		fmt.Println("GetCache: 获取失败")
	}

	DeleteCache(token)
	fmt.Println("DeleteCache: 删除缓存")

	cached = GetCache(token)
	if cached != nil {
		fmt.Println("GetCache: 获取成功, Name=", cached.Name)
	} else {
		fmt.Println("GetCache: 获取失败(已删除)")
	}
}

// TestInvalidToken 测试无效Token
func TestInvalidToken(t *testing.T) {
	fmt.Println("========== TestInvalidToken ==========")

	invalidToken := "invalid_token_string"
	claims, err := ParseToken(invalidToken)
	if err != nil {
		fmt.Println("解析无效Token失败(预期):", err)
	} else {
		fmt.Println("解析结果:", claims)
	}
}
