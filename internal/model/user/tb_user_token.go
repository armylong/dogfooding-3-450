package user

import (
	"time"

	"github.com/armylong/go-library/service/sqlite"
)

// TbUserToken 用户Token表结构
// 用于存储用户的登录Token信息，支持多设备登录
type TbUserToken struct {
	ID         int64     `json:"id" db:"pk"`      // 主键ID
	Uid        int64     `json:"uid"`             // 用户ID
	Token      string    `json:"token"`           // JWT Token
	DeviceType string    `json:"device_type"`     // 设备类型: pc/mobile/tablet/mini
	ExpireAt   int64     `json:"expire_at"`       // 过期时间戳
	CreatedAt  time.Time `json:"created_at"`      // 创建时间
}

type tbUserTokenModel struct{}

var TbUserTokenModel = &tbUserTokenModel{}

func init() {
	_ = TbUserTokenModel.CreateTable()
}

func (m *tbUserTokenModel) TableName() string {
	return "tb_user_token"
}

// CreateTable 创建Token表
func (m *tbUserTokenModel) CreateTable() error {
	sql := `
	CREATE TABLE IF NOT EXISTS tb_user_token (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		uid INTEGER NOT NULL,
		token TEXT NOT NULL UNIQUE,
		device_type TEXT NOT NULL DEFAULT 'pc',
		expire_at INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`
	_, err := sqlite.DB.DB().Exec(sql)
	return err
}

// Create 创建Token记录
func (m *tbUserTokenModel) Create(token *TbUserToken) (int64, error) {
	return sqlite.DB.Insert(m.TableName(), token)
}

// GetByToken 根据Token查询记录
func (m *tbUserTokenModel) GetByToken(token string) (*TbUserToken, error) {
	var t TbUserToken
	err := sqlite.DB.FindOne(m.TableName(), &t, "token = ?", token)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// ListByUid 根据用户ID查询所有Token
func (m *tbUserTokenModel) ListByUid(uid int64) ([]*TbUserToken, error) {
	var tokens []*TbUserToken
	err := sqlite.DB.Find(m.TableName(), &tokens, "uid = ?", uid)
	return tokens, err
}

// DeleteByToken 根据Token删除记录
func (m *tbUserTokenModel) DeleteByToken(token string) error {
	return sqlite.DB.DeleteByWhere(m.TableName(), "token = ?", token)
}

// DeleteByUidAndDeviceType 删除指定用户指定设备类型的Token
// 用于同类型设备登录时踢掉旧设备
func (m *tbUserTokenModel) DeleteByUidAndDeviceType(uid int64, deviceType string) error {
	return sqlite.DB.DeleteByWhere(m.TableName(), "uid = ? AND device_type = ?", uid, deviceType)
}

// DeleteByUid 删除指定用户的所有Token
// 用于踢下线所有设备
func (m *tbUserTokenModel) DeleteByUid(uid int64) error {
	return sqlite.DB.DeleteByWhere(m.TableName(), "uid = ?", uid)
}

// DeleteExpired 删除已过期的Token
func (m *tbUserTokenModel) DeleteExpired() error {
	now := time.Now().Unix()
	return sqlite.DB.DeleteByWhere(m.TableName(), "expire_at > 0 AND expire_at < ?", now)
}
