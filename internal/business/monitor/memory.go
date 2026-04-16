package monitor

import (
	"fmt"
	"strings"

	"github.com/shirou/gopsutil/v4/mem"
)

// MemoryInfo 内存信息
type MemoryInfo struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	Shared      uint64  `json:"shared"`
	Buffers     uint64  `json:"buffers"`
	Cached      uint64  `json:"cached"`
	Available   uint64  `json:"available"`
	UsedPercent float64 `json:"used_percent"`
	SwapTotal   uint64  `json:"swap_total"`
	SwapUsed    uint64  `json:"swap_used"`
	SwapFree    uint64  `json:"swap_free"`
}

type memoryBusiness struct{}

var MemoryBusiness = &memoryBusiness{}

// GetMemoryUsage 获取内存使用情况
func (b *memoryBusiness) GetMemoryUsage() (*MemoryInfo, error) {
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	swapStat, err := mem.SwapMemory()
	if err != nil {
		// 交换空间可能不可用，忽略错误
		swapStat = &mem.SwapMemoryStat{}
	}

	info := &MemoryInfo{
		Total:       vmStat.Total,
		Used:        vmStat.Used,
		Free:        vmStat.Free,
		Shared:      vmStat.Shared,
		Buffers:     vmStat.Buffers,
		Cached:      vmStat.Cached,
		Available:   vmStat.Available,
		UsedPercent: vmStat.UsedPercent,
		SwapTotal:   swapStat.Total,
		SwapUsed:    swapStat.Used,
		SwapFree:    swapStat.Free,
	}

	return info, nil
}

// FormatMemoryOutput 格式化内存输出
func (b *memoryBusiness) FormatMemoryOutput(info *MemoryInfo) string {
	if info == nil {
		return "无法获取内存信息"
	}

	var sb strings.Builder
	sb.WriteString("===== 物理内存 =====\n")
	sb.WriteString(fmt.Sprintf("总容量:   %s\n", b.formatMemoryBytes(info.Total)))
	sb.WriteString(fmt.Sprintf("已使用:   %s (%.1f%%)\n", b.formatMemoryBytes(info.Used), info.UsedPercent))
	sb.WriteString(fmt.Sprintf("可用:     %s\n", b.formatMemoryBytes(info.Available)))
	sb.WriteString(fmt.Sprintf("空闲:     %s\n", b.formatMemoryBytes(info.Free)))

	if info.Buffers > 0 {
		sb.WriteString(fmt.Sprintf("缓冲区:   %s\n", b.formatMemoryBytes(info.Buffers)))
	}
	if info.Cached > 0 {
		sb.WriteString(fmt.Sprintf("缓存:     %s\n", b.formatMemoryBytes(info.Cached)))
	}
	if info.Shared > 0 {
		sb.WriteString(fmt.Sprintf("共享内存: %s\n", b.formatMemoryBytes(info.Shared)))
	}

	if info.SwapTotal > 0 {
		sb.WriteString("\n===== 交换空间 =====\n")
		sb.WriteString(fmt.Sprintf("总容量:   %s\n", b.formatMemoryBytes(info.SwapTotal)))
		sb.WriteString(fmt.Sprintf("已使用:   %s\n", b.formatMemoryBytes(info.SwapUsed)))
		sb.WriteString(fmt.Sprintf("空闲:     %s\n", b.formatMemoryBytes(info.SwapFree)))
		if info.SwapTotal > 0 {
			swapPercent := float64(info.SwapUsed) / float64(info.SwapTotal) * 100
			sb.WriteString(fmt.Sprintf("使用率:   %.1f%%\n", swapPercent))
		}
	}

	return sb.String()
}

// formatMemoryBytes 格式化内存字节
func (b *memoryBusiness) formatMemoryBytes(bytes uint64) string {
	const (
		KB = 1024
		MB = KB * 1024
		GB = MB * 1024
		TB = GB * 1024
	)

	switch {
	case bytes >= TB:
		return fmt.Sprintf("%.2f TB", float64(bytes)/TB)
	case bytes >= GB:
		return fmt.Sprintf("%.2f GB", float64(bytes)/GB)
	case bytes >= MB:
		return fmt.Sprintf("%.2f MB", float64(bytes)/MB)
	case bytes >= KB:
		return fmt.Sprintf("%.2f KB", float64(bytes)/KB)
	default:
		return fmt.Sprintf("%d B", bytes)
	}
}
