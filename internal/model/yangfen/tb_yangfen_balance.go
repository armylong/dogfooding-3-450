package yangfen

import (
	"time"

	"github.com/armylong/go-library/service/sqlite"
)

type TbYangfenBalance struct {
	ID         int64     `json:"id" db:"pk"`  // 主键ID
	Uid        string    `json:"uid"`         // 用户ID
	Balance    int       `json:"balance"`     // 氧分余额
	ExpireTime int64     `json:"expire_time"` // 过期时间(Unix时间戳)
	CreatedAt  time.Time `json:"created_at"`  // 创建时间
	UpdatedAt  time.Time `json:"updated_at"`  // 更新时间
}

type tbYangfenBalanceModel struct{}

var TbYangfenBalanceModel = &tbYangfenBalanceModel{}

func init() {
	_ = TbYangfenBalanceModel.CreateTable()
}

func (m *tbYangfenBalanceModel) TableName() string {
	return "tb_yangfen_balance"
}

func (m *tbYangfenBalanceModel) CreateTable() error {
	sql := `
	CREATE TABLE IF NOT EXISTS tb_yangfen_balance (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		uid TEXT NOT NULL UNIQUE,
		balance INTEGER DEFAULT 0,
		expire_time INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`
	_, err := sqlite.DB.DB().Exec(sql)
	return err
}

func (m *tbYangfenBalanceModel) GetByUid(uid string) (*TbYangfenBalance, error) {
	var row TbYangfenBalance
	err := sqlite.DB.FindOne(m.TableName(), &row, "uid = ?", uid)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (m *tbYangfenBalanceModel) CreateOrUpdate(uid string, balance int, expireTime int64) error {
	data := &TbYangfenBalance{
		Uid:        uid,
		Balance:    balance,
		ExpireTime: expireTime,
	}
	return sqlite.DB.Upsert(m.TableName(), data, "uid")
}

func (m *tbYangfenBalanceModel) UpdateBalance(uid string, balance int) error {
	sql := `UPDATE tb_yangfen_balance SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE uid = ?`
	_, err := sqlite.DB.DB().Exec(sql, balance, uid)
	return err
}

func (m *tbYangfenBalanceModel) Delete(uid string) error {
	return sqlite.DB.DeleteByWhere(m.TableName(), "uid = ?", uid)
}
