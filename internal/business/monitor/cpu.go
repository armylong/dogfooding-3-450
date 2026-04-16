package monitor

import (
	"fmt"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
)

// CPUInfo CPU信息
type CPUInfo struct {
	ModelName     string   `json:"model_name"`
	PhysicalCores int      `json:"physical_cores"`
	LogicalCores  int      `json:"logical_cores"`
	Frequency     float64  `json:"frequency"`
	VendorID      string   `json:"vendor_id"`
	Family        string   `json:"family"`
	Model         string   `json:"model"`
	Stepping      int32    `json:"stepping"`
	CacheSize     int32    `json:"cache_size"`
	Flags         []string `json:"flags"`
}

// CPUUsage CPU使用率信息
type CPUUsage struct {
	User         float64   `json:"user"`
	System       float64   `json:"system"`
	Idle         float64   `json:"idle"`
	Nice         float64   `json:"nice"`
	IOWait       float64   `json:"iowait"`
	IRQ          float64   `json:"irq"`
	SoftIRQ      float64   `json:"softirq"`
	Steal        float64   `json:"steal"`
	Guest        float64   `json:"guest"`
	TotalUsage   float64   `json:"total_usage"`
	PerCoreUsage []float64 `json:"per_core_usage"`
}

type cpuBusiness struct{}

var CPUBusiness = &cpuBusiness{}

// GetCPUInfo 获取CPU信息
func (b *cpuBusiness) GetCPUInfo() (*CPUInfo, error) {
	infos, err := cpu.Info()
	if err != nil {
		return nil, err
	}

	if len(infos) == 0 {
		return &CPUInfo{}, nil
	}

	// 获取第一个CPU的信息
	info := infos[0]

	// 计算物理核心数和逻辑核心数
	physicalCores, _ := cpu.Counts(false)
	logicalCores, _ := cpu.Counts(true)

	return &CPUInfo{
		ModelName:     info.ModelName,
		PhysicalCores: physicalCores,
		LogicalCores:  logicalCores,
		Frequency:     info.Mhz,
		VendorID:      info.VendorID,
		Family:        info.Family,
		Model:         info.Model,
		Stepping:      info.Stepping,
		CacheSize:     info.CacheSize,
		Flags:         info.Flags,
	}, nil
}

// GetCPUUsage 获取CPU使用率
func (b *cpuBusiness) GetCPUUsage() (*CPUUsage, error) {
	// 获取总体CPU使用率
	percentages, err := cpu.Percent(time.Second, false)
	if err != nil {
		return nil, err
	}

	// 获取每个核心的使用率
	perCorePercentages, err := cpu.Percent(time.Second, true)
	if err != nil {
		return nil, err
	}

	// 获取详细的CPU时间统计
	timesStat, err := cpu.Times(false)
	if err != nil || len(timesStat) == 0 {
		// 如果获取详细统计失败，使用简单的百分比
		usage := &CPUUsage{
			TotalUsage:   percentages[0],
			PerCoreUsage: perCorePercentages,
		}
		return usage, nil
	}

	stat := timesStat[0]
	total := stat.User + stat.System + stat.Idle + stat.Nice + stat.Iowait + stat.Irq + stat.Softirq + stat.Steal + stat.Guest

	usage := &CPUUsage{
		User:         stat.User,
		System:       stat.System,
		Idle:         stat.Idle,
		Nice:         stat.Nice,
		IOWait:       stat.Iowait,
		IRQ:          stat.Irq,
		SoftIRQ:      stat.Softirq,
		Steal:        stat.Steal,
		Guest:        stat.Guest,
		TotalUsage:   percentages[0],
		PerCoreUsage: perCorePercentages,
	}

	if total > 0 {
		usage.User = stat.User / total * 100
		usage.System = stat.System / total * 100
		usage.Idle = stat.Idle / total * 100
		usage.Nice = stat.Nice / total * 100
		usage.IOWait = stat.Iowait / total * 100
		usage.IRQ = stat.Irq / total * 100
		usage.SoftIRQ = stat.Softirq / total * 100
		usage.Steal = stat.Steal / total * 100
		usage.Guest = stat.Guest / total * 100
	}

	return usage, nil
}

// FormatCPUInfoOutput 格式化CPU信息输出
func (b *cpuBusiness) FormatCPUInfoOutput(info *CPUInfo) string {
	if info == nil {
		return "无法获取CPU信息"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("型号:       %s\n", info.ModelName))
	sb.WriteString(fmt.Sprintf("物理核心:   %d\n", info.PhysicalCores))
	sb.WriteString(fmt.Sprintf("逻辑核心:   %d\n", info.LogicalCores))
	if info.Frequency > 0 {
		sb.WriteString(fmt.Sprintf("频率:       %.2f MHz\n", info.Frequency))
	}
	if info.VendorID != "" {
		sb.WriteString(fmt.Sprintf("厂商:       %s\n", info.VendorID))
	}
	if info.Family != "" {
		sb.WriteString(fmt.Sprintf("家族:       %s\n", info.Family))
	}
	if info.Model != "" {
		sb.WriteString(fmt.Sprintf("型号:       %s\n", info.Model))
	}
	if info.Stepping != 0 {
		sb.WriteString(fmt.Sprintf("步进:       %d\n", info.Stepping))
	}
	if info.CacheSize != 0 {
		sb.WriteString(fmt.Sprintf("缓存:       %d KB\n", info.CacheSize))
	}

	return sb.String()
}

// FormatCPUUsageOutput 格式化CPU使用率输出
func (b *cpuBusiness) FormatCPUUsageOutput(usage *CPUUsage) string {
	if usage == nil {
		return "无法获取CPU使用率"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("总使用率:   %.1f%%\n", usage.TotalUsage))
	sb.WriteString(fmt.Sprintf("用户态:     %.1f%%\n", usage.User))
	sb.WriteString(fmt.Sprintf("系统态:     %.1f%%\n", usage.System))
	sb.WriteString(fmt.Sprintf("空闲:       %.1f%%\n", usage.Idle))

	if usage.Nice > 0 {
		sb.WriteString(fmt.Sprintf("Nice:       %.1f%%\n", usage.Nice))
	}
	if usage.IOWait > 0 {
		sb.WriteString(fmt.Sprintf("IO等待:     %.1f%%\n", usage.IOWait))
	}
	if usage.IRQ > 0 {
		sb.WriteString(fmt.Sprintf("硬件中断:   %.1f%%\n", usage.IRQ))
	}
	if usage.SoftIRQ > 0 {
		sb.WriteString(fmt.Sprintf("软件中断:   %.1f%%\n", usage.SoftIRQ))
	}

	return sb.String()
}
