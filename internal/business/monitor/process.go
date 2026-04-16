package monitor

import (
	"fmt"
	"strings"

	"github.com/shirou/gopsutil/v4/process"
)

// ProcessInfo 进程信息
type ProcessInfo struct {
	PID        int32   `json:"pid"`
	Name       string  `json:"name"`
	CmdLine    string  `json:"cmd_line"`
	CPU        float64 `json:"cpu"`
	Memory     float32 `json:"memory"`
	MemoryMB   float32 `json:"memory_mb"`
	Status     string  `json:"status"`
	PPID       int32   `json:"ppid"`
	NumThreads int32   `json:"num_threads"`
	User       string  `json:"user"`
	StartTime  string  `json:"start_time"`
}

type processBusiness struct{}

var ProcessBusiness = &processBusiness{}

// GetProcessList 获取所有进程列表
func (b *processBusiness) GetProcessList(sortBy string, limit int) ([]ProcessInfo, error) {
	processes, err := process.Processes()
	if err != nil {
		return nil, err
	}

	var result []ProcessInfo
	for _, p := range processes {
		info := b.convertProcess(p)
		result = append(result, info)
	}

	result = b.sortProcesses(result, sortBy)
	if limit > 0 && len(result) > limit {
		result = result[:limit]
	}

	return result, nil
}

// convertProcess 转换 gopsutil process 到 ProcessInfo
func (b *processBusiness) convertProcess(p *process.Process) ProcessInfo {
	info := ProcessInfo{
		PID: p.Pid,
	}

	// 获取进程名称
	name, err := p.Name()
	if err == nil {
		info.Name = name
	}

	// 获取命令行
	cmdline, err := p.Cmdline()
	if err == nil {
		info.CmdLine = cmdline
	}

	// 获取CPU使用率
	cpuPercent, err := p.CPUPercent()
	if err == nil {
		info.CPU = cpuPercent
	}

	// 获取内存使用率
	memPercent, err := p.MemoryPercent()
	if err == nil {
		info.Memory = memPercent
	}

	// 获取内存信息
	memInfo, err := p.MemoryInfo()
	if err == nil && memInfo != nil {
		info.MemoryMB = float32(memInfo.RSS) / 1024 / 1024
	}

	// 获取状态
	status, err := p.Status()
	if err == nil && len(status) > 0 {
		info.Status = status[0]
	}

	// 获取父进程ID
	ppid, err := p.Ppid()
	if err == nil {
		info.PPID = ppid
	}

	// 获取线程数
	numThreads, err := p.NumThreads()
	if err == nil {
		info.NumThreads = numThreads
	}

	// 获取用户名
	username, err := p.Username()
	if err == nil {
		info.User = username
	}

	// 获取启动时间
	createTime, err := p.CreateTime()
	if err == nil && createTime > 0 {
		info.StartTime = formatTime(createTime)
	}

	return info
}

// sortProcesses 排序进程
func (b *processBusiness) sortProcesses(processes []ProcessInfo, sortBy string) []ProcessInfo {
	switch sortBy {
	case "cpu":
		for i := 0; i < len(processes)-1; i++ {
			for j := i + 1; j < len(processes); j++ {
				if processes[j].CPU > processes[i].CPU {
					processes[i], processes[j] = processes[j], processes[i]
				}
			}
		}
	case "memory":
		for i := 0; i < len(processes)-1; i++ {
			for j := i + 1; j < len(processes); j++ {
				if processes[j].Memory > processes[i].Memory {
					processes[i], processes[j] = processes[j], processes[i]
				}
			}
		}
	case "pid":
		for i := 0; i < len(processes)-1; i++ {
			for j := i + 1; j < len(processes); j++ {
				if processes[j].PID < processes[i].PID {
					processes[i], processes[j] = processes[j], processes[i]
				}
			}
		}
	}
	return processes
}

// GetTopProcesses 获取CPU/内存占用最高的进程
func (b *processBusiness) GetTopProcesses(by string, limit int) ([]ProcessInfo, error) {
	return b.GetProcessList(by, limit)
}

// KillProcess 杀死指定进程
func (b *processBusiness) KillProcess(pid int32) error {
	if pid <= 0 {
		return fmt.Errorf("无效的进程ID: %d", pid)
	}

	p, err := process.NewProcess(pid)
	if err != nil {
		return fmt.Errorf("找不到进程 %d: %v", pid, err)
	}

	return p.Kill()
}

// FindProcessByName 按名称查找进程
func (b *processBusiness) FindProcessByName(name string) ([]ProcessInfo, error) {
	processes, err := process.Processes()
	if err != nil {
		return nil, err
	}

	var matched []ProcessInfo
	nameLower := strings.ToLower(name)

	for _, p := range processes {
		pName, err := p.Name()
		if err != nil {
			continue
		}

		cmdline, _ := p.Cmdline()

		if strings.Contains(strings.ToLower(pName), nameLower) ||
			strings.Contains(strings.ToLower(cmdline), nameLower) {
			matched = append(matched, b.convertProcess(p))
		}
	}

	return matched, nil
}

// GetProcessInfo 获取单个进程信息
func (b *processBusiness) GetProcessInfo(pid int32) (*ProcessInfo, error) {
	p, err := process.NewProcess(pid)
	if err != nil {
		return nil, fmt.Errorf("进程 %d 不存在", pid)
	}

	info := b.convertProcess(p)
	return &info, nil
}

// FormatProcessOutput 格式化进程输出
func (b *processBusiness) FormatProcessOutput(processes []ProcessInfo) string {
	if len(processes) == 0 {
		return "暂无进程信息"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-10s %-8s %-8s %-12s %-10s %s\n", "PID", "CPU%", "MEM%", "MEM(MB)", "PPID", "命令"))
	sb.WriteString(strings.Repeat("-", 80) + "\n")

	for _, p := range processes {
		sb.WriteString(fmt.Sprintf("%-10d %-8.1f %-8.1f %-12.1f %-10d %s\n",
			p.PID, p.CPU, p.Memory, p.MemoryMB, p.PPID, p.Name))
	}

	return sb.String()
}

// formatTime 格式化时间戳
func formatTime(timestamp int64) string {
	return ""
}
