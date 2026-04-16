package auth

import (
	"encoding/json"
	"fmt"
	"testing"
)

// TestRegister 测试注册
func TestRegister(t *testing.T) {
	req := &RegisterRequest{
		Account:  "test_user",
		Password: "123456",
		Name:     "测试用户",
		Email:    "test@example.com",
	}

	resp, err := Register(req)

	fmt.Println("========== TestRegister ==========")
	if err != nil {
		fmt.Println("错误:", err)
		return
	}
	fmt.Println("Token:", resp.Token)
	data, _ := json.MarshalIndent(resp.User, "", "  ")
	fmt.Println("User:", string(data))
}

// TestLogin 测试登录
func TestLogin(t *testing.T) {
	req := &LoginRequest{
		Account:    "test_user",
		Password:   "123456",
		DeviceType: "pc",
	}

	resp, err := Login(req)

	fmt.Println("========== TestLogin ==========")
	if err != nil {
		fmt.Println("错误:", err)
		return
	}
	fmt.Println("Token:", resp.Token)
	data, _ := json.MarshalIndent(resp.User, "", "  ")
	fmt.Println("User:", string(data))
}

// TestLoginMobile 测试手机端登录
func TestLoginMobile(t *testing.T) {
	req := &LoginRequest{
		Account:    "test_user",
		Password:   "123456",
		DeviceType: "mobile",
	}

	resp, err := Login(req)

	fmt.Println("========== TestLoginMobile ==========")
	if err != nil {
		fmt.Println("错误:", err)
		return
	}
	fmt.Println("Token:", resp.Token)
	fmt.Println("DeviceType:", resp.User)
}

// TestLogout 测试登出
func TestLogout(t *testing.T) {
	// 先登录获取token
	loginReq := &LoginRequest{
		Account:    "test_user",
		Password:   "123456",
		DeviceType: "pc",
	}
	resp, _ := Login(loginReq)

	// 登出
	err := Logout(resp.Token)

	fmt.Println("========== TestLogout ==========")
	if err != nil {
		fmt.Println("错误:", err)
		return
	}
	fmt.Println("登出成功")
}

// TestKickoff 测试踢下线(指定设备)
func TestKickoff(t *testing.T) {
	err := Kickoff(1, "mobile")

	fmt.Println("========== TestKickoff ==========")
	if err != nil {
		fmt.Println("错误:", err)
		return
	}
	fmt.Println("踢下线成功")
}

// TestKickoffAll 测试踢所有设备
func TestKickoffAll(t *testing.T) {
	err := Kickoff(1, "")

	fmt.Println("========== TestKickoffAll ==========")
	if err != nil {
		fmt.Println("错误:", err)
		return
	}
	fmt.Println("踢所有设备下线成功")
}

// TestLoginWrongPassword 测试错误密码
func TestLoginWrongPassword(t *testing.T) {
	req := &LoginRequest{
		Account:  "test_user",
		Password: "wrong_password",
	}

	_, err := Login(req)

	fmt.Println("========== TestLoginWrongPassword ==========")
	if err != nil {
		fmt.Println("错误(预期):", err)
	} else {
		fmt.Println("不应该成功")
	}
}

// TestLoginNotExist 测试不存在的账号
func TestLoginNotExist(t *testing.T) {
	req := &LoginRequest{
		Account:  "not_exist_user",
		Password: "123456",
	}

	_, err := Login(req)

	fmt.Println("========== TestLoginNotExist ==========")
	if err != nil {
		fmt.Println("错误(预期):", err)
	} else {
		fmt.Println("不应该成功")
	}
}
