package user

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/armylong/go-library/service/sqlite"
)

type TbUserSettings struct {
	Uid       int64          `json:"uid" db:"pk"`
	Settings  *TbUserSetting `json:"settings" db:"settings"`
	UpdatedAt time.Time      `json:"updated_at" db:"updated_at"`
}

type TbUserSetting struct {
	Desktop TbUserSettingAppList `json:"desktop"`
	Dock    TbUserSettingAppList `json:"dock"`
}

func (s TbUserSetting) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *TbUserSetting) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("cannot scan %T into TbUserSetting", value)
	}
	return json.Unmarshal(bytes, s)
}

type TbUserSettingAppList struct {
	AppList []TbUserSettingApp `json:"app_list"`
}

type TbUserSettingApp struct {
	AppId   string `json:"app_id"`
	AppName string `json:"app_name"`
	Desc    string `json:"desc"`
	X       int    `json:"x"`
	Y       int    `json:"y"`
}

type tbUserSettingsModel struct{}

var TbUserSettingsModel = &tbUserSettingsModel{}

func init() {
	_ = TbUserSettingsModel.CreateTable()
}

func (m *tbUserSettingsModel) TableName() string {
	return "tb_user_settings"
}

func (m *tbUserSettingsModel) CreateTable() error {
	sql := `
	CREATE TABLE IF NOT EXISTS tb_user_settings (
		uid INTEGER PRIMARY KEY,
		settings TEXT,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`
	_, err := sqlite.DB.DB().Exec(sql)
	return err
}

func (m *tbUserSettingsModel) GetByUid(uid int64) (*TbUserSettings, error) {
	var settings TbUserSettings
	settings.Uid = uid
	err := sqlite.DB.GetByPkId(m.TableName(), &settings)
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

func (m *tbUserSettingsModel) CreateOrUpdate(uid int64, settings TbUserSetting) error {
	data := &TbUserSettings{
		Uid:       uid,
		Settings:  &settings,
		UpdatedAt: time.Now(),
	}
	return sqlite.DB.Upsert(m.TableName(), data, "uid")
}

func (m *tbUserSettingsModel) Delete(uid int64) error {
	settings := &TbUserSettings{Uid: uid}
	return sqlite.DB.DeleteByPkId(m.TableName(), settings)
}
