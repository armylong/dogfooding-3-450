package monitor

import (
	"fmt"
	"runtime"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/host"
)

// SystemInfo 系统信息
type SystemInfo struct {
	Hostname        string `json:"hostname"`
	OS              string `json:"os"`
	Platform        string `json:"platform"`
	PlatformVersion string `json:"platform_version"`
	KernelVersion   string `json:"kernel_version"`
	Architecture    string `json:"architecture"`
	CPUCount        int    `json:"cpu_count"`
	GoVersion       string `json:"go_version"`
}

// UptimeInfo 运行时间信息
type UptimeInfo struct {
	Uptime    uint64 `json:"uptime"`
	BootTime  uint64 `json:"boot_time"`
	UptimeStr string `json:"uptime_str"`
}

type systemBusiness struct{}

var SystemBusiness = &systemBusiness{}

// GetSystemInfo 获取系统信息
func (b *systemBusiness) GetSystemInfo() (*SystemInfo, error) {
	info, err := host.Info()
	if err != nil {
		return nil, err
	}

	sysInfo := &SystemInfo{
		Hostname:        info.Hostname,
		OS:              info.OS,
		Platform:        info.Platform,
		PlatformVersion: info.PlatformVersion,
		KernelVersion:   info.KernelVersion,
		Architecture:    runtime.GOARCH,
		CPUCount:        runtime.NumCPU(),
		GoVersion:       runtime.Version(),
	}

	return sysInfo, nil
}

// GetUptime 获取系统运行时间
func (b *systemBusiness) GetUptime() (*UptimeInfo, error) {
	uptime, err := host.Uptime()
	if err != nil {
		return nil, err
	}

	bootTime, err := host.BootTime()
	if err != nil {
		return nil, err
	}

	return &UptimeInfo{
		Uptime:    uptime,
		BootTime:  bootTime,
		UptimeStr: b.formatUptime(uptime),
	}, nil
}

// formatUptime 格式化运行时间
func (b *systemBusiness) formatUptime(seconds uint64) string {
	days := seconds / 86400
	hours := (seconds % 86400) / 3600
	minutes := (seconds % 3600) / 60
	secs := seconds % 60

	var parts []string
	if days > 0 {
		parts = append(parts, fmt.Sprintf("%d天", days))
	}
	if hours > 0 {
		parts = append(parts, fmt.Sprintf("%d小时", hours))
	}
	if minutes > 0 {
		parts = append(parts, fmt.Sprintf("%d分钟", minutes))
	}
	if len(parts) == 0 || secs > 0 {
		parts = append(parts, fmt.Sprintf("%d秒", secs))
	}

	return strings.Join(parts, " ")
}

// FormatSystemInfoOutput 格式化系统信息输出
func (b *systemBusiness) FormatSystemInfoOutput(info *SystemInfo) string {
	if info == nil {
		return "无法获取系统信息"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("主机名:       %s\n", info.Hostname))
	sb.WriteString(fmt.Sprintf("操作系统:     %s\n", info.OS))
	sb.WriteString(fmt.Sprintf("平台:         %s\n", info.Platform))
	sb.WriteString(fmt.Sprintf("平台版本:     %s\n", info.PlatformVersion))
	sb.WriteString(fmt.Sprintf("内核版本:     %s\n", info.KernelVersion))
	sb.WriteString(fmt.Sprintf("架构:         %s\n", info.Architecture))
	sb.WriteString(fmt.Sprintf("CPU核心数:    %d\n", info.CPUCount))
	sb.WriteString(fmt.Sprintf("Go版本:       %s\n", info.GoVersion))

	return sb.String()
}

// FormatUptimeOutput 格式化运行时间输出
func (b *systemBusiness) FormatUptimeOutput(info *UptimeInfo) string {
	if info == nil {
		return "无法获取运行时间"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("系统已运行: %s\n", info.UptimeStr))
	sb.WriteString(fmt.Sprintf("启动时间:   %s\n", time.Unix(int64(info.BootTime), 0).Format("2006-01-02 15:04:05")))

	return sb.String()
}
