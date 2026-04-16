package monitor

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestProcessBusiness_GetProcessList 测试获取进程列表
func TestProcessBusiness_GetProcessList(t *testing.T) {
	processes, err := ProcessBusiness.GetProcessList("pid", 10)
	assert.NoError(t, err)
	assert.NotNil(t, processes)
	assert.LessOrEqual(t, len(processes), 10)

	// 测试排序
	if len(processes) > 1 {
		assert.LessOrEqual(t, processes[0].PID, processes[1].PID)
	}
}

// TestProcessBusiness_GetTopProcesses 测试获取Top进程
func TestProcessBusiness_GetTopProcesses(t *testing.T) {
	processes, err := ProcessBusiness.GetTopProcesses("cpu", 5)
	assert.NoError(t, err)
	assert.NotNil(t, processes)
	assert.LessOrEqual(t, len(processes), 5)
}

// TestProcessBusiness_FindProcessByName 测试按名称查找进程
func TestProcessBusiness_FindProcessByName(t *testing.T) {
	// 查找当前测试进程
	processes, err := ProcessBusiness.FindProcessByName("go")
	assert.NoError(t, err)
	assert.NotNil(t, processes)
}

// TestProcessBusiness_GetProcessInfo 测试获取单个进程信息
func TestProcessBusiness_GetProcessInfo(t *testing.T) {
	// 使用当前进程ID (PID 1通常是init/systemd)
	info, err := ProcessBusiness.GetProcessInfo(1)
	// 在某些系统上可能无法访问PID 1，所以不强制断言
	if err == nil {
		assert.NotNil(t, info)
		assert.Equal(t, int32(1), info.PID)
	}
}

// TestProcessBusiness_FormatProcessOutput 测试格式化进程输出
func TestProcessBusiness_FormatProcessOutput(t *testing.T) {
	processes := []ProcessInfo{
		{PID: 1, Name: "init", CPU: 0.5, Memory: 0.1, MemoryMB: 10, PPID: 0},
		{PID: 2, Name: "kthre", CPU: 0.0, Memory: 0.0, MemoryMB: 0, PPID: 0},
	}
	output := ProcessBusiness.FormatProcessOutput(processes)
	assert.NotEmpty(t, output)
	assert.Contains(t, output, "PID")
	assert.Contains(t, output, "init")
}

// TestDiskBusiness_GetDiskUsage 测试获取磁盘使用
func TestDiskBusiness_GetDiskUsage(t *testing.T) {
	disks, err := DiskBusiness.GetDiskUsage()
	assert.NoError(t, err)
	assert.NotNil(t, disks)

	// 至少应该有一个根分区
	if len(disks) > 0 {
		assert.Greater(t, disks[0].Total, uint64(0))
	}
}

// TestDiskBusiness_GetDiskPartitions 测试获取磁盘分区
func TestDiskBusiness_GetDiskPartitions(t *testing.T) {
	partitions, err := DiskBusiness.GetDiskPartitions()
	assert.NoError(t, err)
	assert.NotNil(t, partitions)
}

// TestDiskBusiness_FormatDiskUsageOutput 测试格式化磁盘使用输出
func TestDiskBusiness_FormatDiskUsageOutput(t *testing.T) {
	disks := []DiskInfo{
		{Device: "/dev/sda1", MountPoint: "/", FileSystem: "ext4", Total: 1000000000, Used: 500000000, Free: 500000000, UsedPercent: 50.0},
	}
	output := DiskBusiness.FormatDiskUsageOutput(disks)
	assert.NotEmpty(t, output)
	assert.Contains(t, output, "设备")
	assert.Contains(t, output, "/dev/sda1")
}

// TestMemoryBusiness_GetMemoryUsage 测试获取内存使用
func TestMemoryBusiness_GetMemoryUsage(t *testing.T) {
	info, err := MemoryBusiness.GetMemoryUsage()
	assert.NoError(t, err)
	assert.NotNil(t, info)
	assert.Greater(t, info.Total, uint64(0))
}

// TestMemoryBusiness_FormatMemoryOutput 测试格式化内存输出
func TestMemoryBusiness_FormatMemoryOutput(t *testing.T) {
	info := &MemoryInfo{
		Total:       16000000000,
		Used:        8000000000,
		Free:        8000000000,
		Available:   8000000000,
		UsedPercent: 50.0,
		SwapTotal:   2000000000,
		SwapUsed:    0,
		SwapFree:    2000000000,
	}
	output := MemoryBusiness.FormatMemoryOutput(info)
	assert.NotEmpty(t, output)
	assert.Contains(t, output, "物理内存")
	assert.Contains(t, output, "交换空间")
}

// TestCPUBusiness_GetCPUInfo 测试获取CPU信息
func TestCPUBusiness_GetCPUInfo(t *testing.T) {
	info, err := CPUBusiness.GetCPUInfo()
	assert.NoError(t, err)
	assert.NotNil(t, info)
	assert.Greater(t, info.LogicalCores, 0)
}

// TestCPUBusiness_GetCPUUsage 测试获取CPU使用率
func TestCPUBusiness_GetCPUUsage(t *testing.T) {
	usage, err := CPUBusiness.GetCPUUsage()
	assert.NoError(t, err)
	assert.NotNil(t, usage)
	// CPU使用率应该在合理范围内
	assert.GreaterOrEqual(t, usage.TotalUsage, 0.0)
	assert.LessOrEqual(t, usage.TotalUsage, 100.0)
}

// TestCPUBusiness_FormatCPUInfoOutput 测试格式化CPU信息输出
func TestCPUBusiness_FormatCPUInfoOutput(t *testing.T) {
	info := &CPUInfo{
		ModelName:     "Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz",
		PhysicalCores: 8,
		LogicalCores:  8,
		Frequency:     3600,
	}
	output := CPUBusiness.FormatCPUInfoOutput(info)
	assert.NotEmpty(t, output)
	assert.Contains(t, output, "Intel")
}

// TestNetworkBusiness_GetConnections 测试获取网络连接
func TestNetworkBusiness_GetConnections(t *testing.T) {
	conns, err := NetworkBusiness.GetConnections()
	// 在某些系统上可能需要root权限
	if err == nil {
		assert.NotNil(t, conns)
	}
}

// TestNetworkBusiness_GetPortUsage 测试获取端口占用
func TestNetworkBusiness_GetPortUsage(t *testing.T) {
	ports, err := NetworkBusiness.GetPortUsage()
	// 在某些系统上可能需要root权限
	if err == nil {
		assert.NotNil(t, ports)
	}
}

// TestNetworkBusiness_GetInterfaces 测试获取网络接口
func TestNetworkBusiness_GetInterfaces(t *testing.T) {
	interfaces, err := NetworkBusiness.GetInterfaces()
	assert.NoError(t, err)
	assert.NotNil(t, interfaces)
	// 至少应该有lo接口
	assert.Greater(t, len(interfaces), 0)
}

// TestNetworkBusiness_FormatConnectionsOutput 测试格式化连接输出
func TestNetworkBusiness_FormatConnectionsOutput(t *testing.T) {
	connections := []ConnectionInfo{
		{Protocol: "tcp", LocalAddr: "127.0.0.1", LocalPort: 8080, RemoteAddr: "0.0.0.0", RemotePort: 0, State: "LISTEN", PID: 1234},
	}
	output := NetworkBusiness.FormatConnectionsOutput(connections)
	assert.NotEmpty(t, output)
	assert.Contains(t, output, "协议")
}

// TestSystemBusiness_GetSystemInfo 测试获取系统信息
func TestSystemBusiness_GetSystemInfo(t *testing.T) {
	info, err := SystemBusiness.GetSystemInfo()
	assert.NoError(t, err)
	assert.NotNil(t, info)
	assert.NotEmpty(t, info.Hostname)
	assert.NotEmpty(t, info.OS)
}

// TestSystemBusiness_GetUptime 测试获取运行时间
func TestSystemBusiness_GetUptime(t *testing.T) {
	info, err := SystemBusiness.GetUptime()
	assert.NoError(t, err)
	assert.NotNil(t, info)
	assert.Greater(t, info.Uptime, uint64(0))
	assert.NotEmpty(t, info.UptimeStr)
}

// TestSystemBusiness_FormatSystemInfoOutput 测试格式化系统信息输出
func TestSystemBusiness_FormatSystemInfoOutput(t *testing.T) {
	info := &SystemInfo{
		Hostname:        "test-host",
		OS:              "darwin",
		Platform:        "darwin",
		PlatformVersion: "14.0",
		Architecture:    "arm64",
		CPUCount:        8,
		GoVersion:       "go1.21.0",
	}
	output := SystemBusiness.FormatSystemInfoOutput(info)
	assert.NotEmpty(t, output)
	assert.Contains(t, output, "test-host")
}
