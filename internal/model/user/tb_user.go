package user

import (
	"time"

	"github.com/armylong/go-library/service/sqlite"
)

// TbUser 用户表结构
type TbUser struct {
	Uid       int64     `json:"uid" db:"pk"` // 主键ID
	Account   string    `json:"account"`     // 账号
	Password  string    `json:"password"`    // 密码
	Name      string    `json:"name"`        // 用户名
	Email     string    `json:"email"`       // 邮箱
	Phone     string    `json:"phone"`       // 手机号
	Status    int       `json:"status"`      // 状态: 1-正常 0-禁用
	CreatedAt time.Time `json:"created_at"`  // 创建时间
	UpdatedAt time.Time `json:"updated_at"`  // 更新时间
}

// ClearPassword 清空密码（返回给前端前调用）
func (u *TbUser) ClearPassword() {
	u.Password = ""
}

type tbUserModel struct{}

var TbUserModel = &tbUserModel{}

func init() {
	_ = TbUserModel.CreateTable()
}

func (m *tbUserModel) TableName() string {
	return "tb_user"
}

// CreateTable 创建用户表
func (m *tbUserModel) CreateTable() error {
	sql := `
	CREATE TABLE IF NOT EXISTS tb_user (
		uid INTEGER PRIMARY KEY AUTOINCREMENT,
		account TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		name TEXT NOT NULL,
		email TEXT,
		phone TEXT,
		status INTEGER DEFAULT 1,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`
	_, err := sqlite.DB.DB().Exec(sql)
	return err
}

// Create 创建用户
func (m *tbUserModel) Create(user *TbUser) (int64, error) {
	return sqlite.DB.Insert(m.TableName(), user)
}

// GetByUid 根据用户ID查询用户
func (m *tbUserModel) GetByUid(uid int64) (*TbUser, error) {
	var user TbUser
	user.Uid = uid
	err := sqlite.DB.GetByPkId(m.TableName(), &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmail 根据邮箱查询用户
func (m *tbUserModel) GetByEmail(email string) (*TbUser, error) {
	var user TbUser
	err := sqlite.DB.FindOne(m.TableName(), &user, "email = ?", email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByAccount 根据账号查询用户
func (m *tbUserModel) GetByAccount(account string) (*TbUser, error) {
	var user TbUser
	err := sqlite.DB.FindOne(m.TableName(), &user, "account = ?", account)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// List 分页查询用户列表
func (m *tbUserModel) List(limit, offset int) ([]*TbUser, error) {
	var users []*TbUser
	err := sqlite.DB.Find(m.TableName(), &users, "1=1 ORDER BY uid DESC LIMIT ? OFFSET ?", limit, offset)
	return users, err
}

// Update 更新用户信息
func (m *tbUserModel) Update(user *TbUser) error {
	return sqlite.DB.UpdateByPkId(m.TableName(), user)
}

// Delete 删除用户
func (m *tbUserModel) Delete(id int64) error {
	user := &TbUser{Uid: id}
	return sqlite.DB.DeleteByPkId(m.TableName(), user)
}

// Count 统计用户总数
func (m *tbUserModel) Count() (int64, error) {
	return sqlite.DB.CountAll(m.TableName())
}
