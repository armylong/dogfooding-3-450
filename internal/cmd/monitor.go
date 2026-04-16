package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"time"

	"github.com/armylong/armylong-go/internal/business/monitor"
	"github.com/spf13/cobra"
)

type monitorCmd struct{}

var MonitorCmd = &monitorCmd{}

// MonitorHandler monitor命令入口
func (m *monitorCmd) MonitorHandler(cmd *cobra.Command, args []string) {
	if len(args) == 0 {
		printMonitorHelp()
		return
	}

	category := args[0]

	switch category {
	case "process":
		m.handleProcess(cmd, args[1:])
	case "disk":
		m.handleDisk(cmd, args[1:])
	case "memory":
		m.handleMemory(cmd, args[1:])
	case "cpu":
		m.handleCPU(cmd, args[1:])
	case "network":
		m.handleNetwork(cmd, args[1:])
	case "system":
		m.handleSystem(cmd, args[1:])
	default:
		fmt.Printf("未知的监控类别: %s\n", category)
		printMonitorHelp()
	}
}

// handleProcess 处理进程相关命令
func (m *monitorCmd) handleProcess(cmd *cobra.Command, args []string) {
	if len(args) == 0 {
		fmt.Println("用法: monitor process [list|top|kill|find]")
		return
	}

	action := args[0]
	sortBy, _ := cmd.Flags().GetString("sort")
	limit, _ := cmd.Flags().GetInt("limit")
	refresh, _ := cmd.Flags().GetBool("refresh")
	interval, _ := cmd.Flags().GetInt("interval")

	switch action {
	case "list":
		if refresh {
			m.runWithRefresh(interval, func() {
				m.showProcessList(sortBy, limit)
			})
		} else {
			m.showProcessList(sortBy, limit)
		}

	case "top":
		sort := sortBy
		if sort == "" {
			sort = "cpu"
		}
		if refresh {
			m.runWithRefresh(interval, func() {
				m.showProcessList(sort, limit)
			})
		} else {
			m.showProcessList(sort, limit)
		}

	case "kill":
		if len(args) < 2 {
			fmt.Println("错误: 请指定进程ID")
			fmt.Println("用法: monitor process kill <pid>")
			return
		}
		pid, err := strconv.Atoi(args[1])
		if err != nil {
			fmt.Printf("错误: 无效的进程ID: %s\n", args[1])
			return
		}
		err = monitor.ProcessBusiness.KillProcess(int32(pid))
		if err != nil {
			fmt.Printf("杀死进程失败: %v\n", err)
			return
		}
		fmt.Printf("✓ 进程 %d 已被终止\n", pid)

	case "find":
		if len(args) < 2 {
			fmt.Println("错误: 请指定进程名称")
			fmt.Println("用法: monitor process find <name>")
			return
		}
		name := args[1]
		processes, err := monitor.ProcessBusiness.FindProcessByName(name)
		if err != nil {
			fmt.Printf("查找进程失败: %v\n", err)
			return
		}
		if len(processes) == 0 {
			fmt.Printf("未找到包含 '%s' 的进程\n", name)
			return
		}
		fmt.Printf("找到 %d 个匹配的进程:\n\n", len(processes))
		fmt.Print(monitor.ProcessBusiness.FormatProcessOutput(processes))

	default:
		fmt.Printf("未知的进程操作: %s\n", action)
		fmt.Println("可用操作: list, top, kill, find")
	}
}

// showProcessList 显示进程列表
func (m *monitorCmd) showProcessList(sortBy string, limit int) {
	clearScreen()
	fmt.Println("===== 进程列表 =====")
	if sortBy != "" {
		fmt.Printf("排序方式: %s\n", sortBy)
	}
	fmt.Println()

	processes, err := monitor.ProcessBusiness.GetProcessList(sortBy, limit)
	if err != nil {
		fmt.Printf("获取进程列表失败: %v\n", err)
		return
	}
	fmt.Print(monitor.ProcessBusiness.FormatProcessOutput(processes))
}

// handleDisk 处理磁盘相关命令
func (m *monitorCmd) handleDisk(cmd *cobra.Command, args []string) {
	if len(args) == 0 {
		fmt.Println("用法: monitor disk [usage|list]")
		return
	}

	action := args[0]
	refresh, _ := cmd.Flags().GetBool("refresh")
	interval, _ := cmd.Flags().GetInt("interval")

	switch action {
	case "usage":
		if refresh {
			m.runWithRefresh(interval, func() {
				m.showDiskUsage()
			})
		} else {
			m.showDiskUsage()
		}

	case "list":
		partitions, err := monitor.DiskBusiness.GetDiskPartitions()
		if err != nil {
			fmt.Printf("获取磁盘分区失败: %v\n", err)
			return
		}
		fmt.Println("===== 磁盘分区 =====\n")
		fmt.Print(monitor.DiskBusiness.FormatDiskPartitionsOutput(partitions))

	default:
		fmt.Printf("未知的磁盘操作: %s\n", action)
		fmt.Println("可用操作: usage, list")
	}
}

// showDiskUsage 显示磁盘使用情况
func (m *monitorCmd) showDiskUsage() {
	clearScreen()
	fmt.Println("===== 磁盘使用情况 =====\n")

	disks, err := monitor.DiskBusiness.GetDiskUsage()
	if err != nil {
		fmt.Printf("获取磁盘使用情况失败: %v\n", err)
		return
	}
	fmt.Print(monitor.DiskBusiness.FormatDiskUsageOutput(disks))
}

// handleMemory 处理内存相关命令
func (m *monitorCmd) handleMemory(cmd *cobra.Command, args []string) {
	refresh, _ := cmd.Flags().GetBool("refresh")
	interval, _ := cmd.Flags().GetInt("interval")

	if refresh {
		m.runWithRefresh(interval, func() {
			m.showMemoryUsage()
		})
	} else {
		m.showMemoryUsage()
	}
}

// showMemoryUsage 显示内存使用情况
func (m *monitorCmd) showMemoryUsage() {
	clearScreen()
	fmt.Println("===== 内存使用情况 =====\n")

	memInfo, err := monitor.MemoryBusiness.GetMemoryUsage()
	if err != nil {
		fmt.Printf("获取内存信息失败: %v\n", err)
		return
	}
	fmt.Print(monitor.MemoryBusiness.FormatMemoryOutput(memInfo))
}

// handleCPU 处理CPU相关命令
func (m *monitorCmd) handleCPU(cmd *cobra.Command, args []string) {
	if len(args) == 0 {
		args = []string{"usage"}
	}

	action := args[0]
	refresh, _ := cmd.Flags().GetBool("refresh")
	interval, _ := cmd.Flags().GetInt("interval")

	switch action {
	case "usage":
		if refresh {
			m.runWithRefresh(interval, func() {
				m.showCPUUsage()
			})
		} else {
			m.showCPUUsage()
		}

	case "info":
		cpuInfo, err := monitor.CPUBusiness.GetCPUInfo()
		if err != nil {
			fmt.Printf("获取CPU信息失败: %v\n", err)
			return
		}
		fmt.Println("===== CPU信息 =====\n")
		fmt.Print(monitor.CPUBusiness.FormatCPUInfoOutput(cpuInfo))

	default:
		fmt.Printf("未知的CPU操作: %s\n", action)
		fmt.Println("可用操作: usage, info")
	}
}

// showCPUUsage 显示CPU使用率
func (m *monitorCmd) showCPUUsage() {
	clearScreen()
	fmt.Println("===== CPU使用率 =====\n")

	cpuUsage, err := monitor.CPUBusiness.GetCPUUsage()
	if err != nil {
		fmt.Printf("获取CPU使用率失败: %v\n", err)
		return
	}
	fmt.Print(monitor.CPUBusiness.FormatCPUUsageOutput(cpuUsage))
}

// handleNetwork 处理网络相关命令
func (m *monitorCmd) handleNetwork(cmd *cobra.Command, args []string) {
	if len(args) == 0 {
		fmt.Println("用法: monitor network [connections|ports|kill-port|interfaces]")
		return
	}

	action := args[0]
	refresh, _ := cmd.Flags().GetBool("refresh")
	interval, _ := cmd.Flags().GetInt("interval")

	switch action {
	case "connections":
		if refresh {
			m.runWithRefresh(interval, func() {
				m.showNetworkConnections()
			})
		} else {
			m.showNetworkConnections()
		}

	case "ports":
		if refresh {
			m.runWithRefresh(interval, func() {
				m.showNetworkPorts()
			})
		} else {
			m.showNetworkPorts()
		}

	case "kill-port":
		if len(args) < 2 {
			fmt.Println("错误: 请指定端口号")
			fmt.Println("用法: monitor network kill-port <port>")
			return
		}
		port, err := strconv.Atoi(args[1])
		if err != nil {
			fmt.Printf("错误: 无效的端口号: %s\n", args[1])
			return
		}
		err = monitor.NetworkBusiness.KillProcessByPort(port)
		if err != nil {
			fmt.Printf("释放端口失败: %v\n", err)
			return
		}
		fmt.Printf("✓ 端口 %d 已被释放\n", port)

	case "interfaces":
		interfaces, err := monitor.NetworkBusiness.GetInterfaces()
		if err != nil {
			fmt.Printf("获取网络接口失败: %v\n", err)
			return
		}
		fmt.Println("===== 网络接口 =====\n")
		fmt.Print(monitor.NetworkBusiness.FormatInterfacesOutput(interfaces))

	default:
		fmt.Printf("未知的网络操作: %s\n", action)
		fmt.Println("可用操作: connections, ports, kill-port, interfaces")
	}
}

// showNetworkConnections 显示网络连接
func (m *monitorCmd) showNetworkConnections() {
	clearScreen()
	fmt.Println("===== 网络连接 =====\n")

	connections, err := monitor.NetworkBusiness.GetConnections()
	if err != nil {
		fmt.Printf("获取网络连接失败: %v\n", err)
		return
	}
	fmt.Print(monitor.NetworkBusiness.FormatConnectionsOutput(connections))
}

// showNetworkPorts 显示端口占用
func (m *monitorCmd) showNetworkPorts() {
	clearScreen()
	fmt.Println("===== 端口占用 =====\n")

	ports, err := monitor.NetworkBusiness.GetPortUsage()
	if err != nil {
		fmt.Printf("获取端口占用失败: %v\n", err)
		return
	}
	fmt.Print(monitor.NetworkBusiness.FormatPortsOutput(ports))
}

// handleSystem 处理系统相关命令
func (m *monitorCmd) handleSystem(cmd *cobra.Command, args []string) {
	if len(args) == 0 {
		args = []string{"info"}
	}

	action := args[0]

	switch action {
	case "info":
		sysInfo, err := monitor.SystemBusiness.GetSystemInfo()
		if err != nil {
			fmt.Printf("获取系统信息失败: %v\n", err)
			return
		}
		fmt.Println("===== 系统信息 =====\n")
		fmt.Print(monitor.SystemBusiness.FormatSystemInfoOutput(sysInfo))

	case "uptime":
		uptime, err := monitor.SystemBusiness.GetUptime()
		if err != nil {
			fmt.Printf("获取运行时间失败: %v\n", err)
			return
		}
		fmt.Println("===== 系统运行时间 =====\n")
		fmt.Print(monitor.SystemBusiness.FormatUptimeOutput(uptime))

	default:
		fmt.Printf("未知的系统操作: %s\n", action)
		fmt.Println("可用操作: info, uptime")
	}
}

// runWithRefresh 带刷新功能的运行
func (m *monitorCmd) runWithRefresh(interval int, fn func()) {
	if interval <= 0 {
		interval = 2
	}

	fmt.Println("按 Ctrl+C 退出实时刷新模式")
	fmt.Printf("刷新间隔: %d秒\n\n", interval)

	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	fn()

	for range ticker.C {
		fn()
	}
}

// clearScreen 清屏
func clearScreen() {
	if runtime.GOOS == "windows" {
		cmd := exec.Command("cmd", "/c", "cls")
		cmd.Stdout = os.Stdout
		cmd.Run()
	} else {
		fmt.Print("\033[H\033[2J")
	}
}

// printMonitorHelp 打印帮助信息
func printMonitorHelp() {
	fmt.Println(`系统监控命令

用法:
  monitor [category] [action] [options]

类别:
  process    进程管理
    list                 列出所有进程
    top                  显示CPU/内存占用最高的进程
    kill <pid>           杀死指定进程
    find <name>          按名称查找进程

  disk       磁盘监控
    usage                显示磁盘使用情况
    list                 列出所有磁盘分区

  memory     内存监控
    usage                显示内存使用情况

  cpu        CPU监控
    usage                显示CPU使用率
    info                 显示CPU信息

  network    网络监控
    connections          显示网络连接
    ports                显示端口占用
    kill-port <port>     杀死占用指定端口的进程
    interfaces           显示网络接口

  system     系统信息
    info                 显示系统信息
    uptime               显示系统运行时间

参数:
  --refresh              实时刷新显示
  --interval <seconds>   刷新间隔（秒），默认2秒
  --sort <field>         排序方式（cpu/memory/pid）
  --limit <number>       显示数量限制，默认10条

示例:
  monitor process list --sort cpu --limit 20
  monitor process top --refresh --interval 3
  monitor process kill 1234
  monitor disk usage
  monitor memory usage --refresh
  monitor cpu usage
  monitor network ports
  monitor system info`)
}
