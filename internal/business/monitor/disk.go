package monitor

import (
	"fmt"
	"strings"

	"github.com/shirou/gopsutil/v4/disk"
)

// DiskInfo 磁盘信息
type DiskInfo struct {
	Device      string  `json:"device"`
	MountPoint  string  `json:"mount_point"`
	FileSystem  string  `json:"file_system"`
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"used_percent"`
}

// DiskPartition 磁盘分区信息
type DiskPartition struct {
	Device     string `json:"device"`
	MountPoint string `json:"mount_point"`
	FileSystem string `json:"file_system"`
	Options    string `json:"options"`
}

type diskBusiness struct{}

var DiskBusiness = &diskBusiness{}

// GetDiskUsage 获取磁盘使用情况
func (b *diskBusiness) GetDiskUsage() ([]DiskInfo, error) {
	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil, err
	}

	var disks []DiskInfo
	for _, p := range partitions {
		usage, err := disk.Usage(p.Mountpoint)
		if err != nil {
			continue
		}

		disks = append(disks, DiskInfo{
			Device:      p.Device,
			MountPoint:  p.Mountpoint,
			FileSystem:  p.Fstype,
			Total:       usage.Total,
			Used:        usage.Used,
			Free:        usage.Free,
			UsedPercent: usage.UsedPercent,
		})
	}

	return disks, nil
}

// GetDiskPartitions 获取磁盘分区列表
func (b *diskBusiness) GetDiskPartitions() ([]DiskPartition, error) {
	partitions, err := disk.Partitions(true)
	if err != nil {
		return nil, err
	}

	var result []DiskPartition
	for _, p := range partitions {
		result = append(result, DiskPartition{
			Device:     p.Device,
			MountPoint: p.Mountpoint,
			FileSystem: p.Fstype,
			Options:    strings.Join(p.Opts, ","),
		})
	}

	return result, nil
}

// FormatDiskUsageOutput 格式化磁盘使用输出
func (b *diskBusiness) FormatDiskUsageOutput(disks []DiskInfo) string {
	if len(disks) == 0 {
		return "暂无磁盘信息"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-20s %-15s %-12s %-12s %-12s %-8s %s\n",
		"设备", "挂载点", "总容量", "已使用", "可用", "使用率", "文件系统"))
	sb.WriteString(strings.Repeat("-", 100) + "\n")

	for _, d := range disks {
		totalStr := b.formatBytes(d.Total)
		usedStr := b.formatBytes(d.Used)
		freeStr := b.formatBytes(d.Free)

		sb.WriteString(fmt.Sprintf("%-20s %-15s %-12s %-12s %-12s %-7.1f%% %s\n",
			b.truncateString(d.Device, 20),
			b.truncateString(d.MountPoint, 15),
			totalStr, usedStr, freeStr,
			d.UsedPercent,
			d.FileSystem))
	}

	return sb.String()
}

// FormatDiskPartitionsOutput 格式化磁盘分区输出
func (b *diskBusiness) FormatDiskPartitionsOutput(partitions []DiskPartition) string {
	if len(partitions) == 0 {
		return "暂无分区信息"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-25s %-20s %-12s %s\n",
		"设备", "挂载点", "文件系统", "选项"))
	sb.WriteString(strings.Repeat("-", 100) + "\n")

	for _, p := range partitions {
		sb.WriteString(fmt.Sprintf("%-25s %-20s %-12s %s\n",
			b.truncateString(p.Device, 25),
			b.truncateString(p.MountPoint, 20),
			p.FileSystem,
			p.Options))
	}

	return sb.String()
}

// formatBytes 格式化字节数为可读格式
func (b *diskBusiness) formatBytes(bytes uint64) string {
	const (
		KB = 1024
		MB = KB * 1024
		GB = MB * 1024
		TB = GB * 1024
	)

	switch {
	case bytes >= TB:
		return fmt.Sprintf("%.1fTB", float64(bytes)/TB)
	case bytes >= GB:
		return fmt.Sprintf("%.1fGB", float64(bytes)/GB)
	case bytes >= MB:
		return fmt.Sprintf("%.1fMB", float64(bytes)/MB)
	case bytes >= KB:
		return fmt.Sprintf("%.1fKB", float64(bytes)/KB)
	default:
		return fmt.Sprintf("%dB", bytes)
	}
}

// truncateString 截断字符串
func (b *diskBusiness) truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
