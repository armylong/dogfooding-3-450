package monitor

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/shirou/gopsutil/v4/net"
	"github.com/shirou/gopsutil/v4/process"
)

// ConnectionInfo 网络连接信息
type ConnectionInfo struct {
	Protocol   string `json:"protocol"`
	LocalAddr  string `json:"local_addr"`
	LocalPort  int    `json:"local_port"`
	RemoteAddr string `json:"remote_addr"`
	RemotePort int    `json:"remote_port"`
	State      string `json:"state"`
	PID        int32  `json:"pid"`
	Process    string `json:"process"`
}

// PortInfo 端口信息
type PortInfo struct {
	Protocol  string `json:"protocol"`
	Port      int    `json:"port"`
	LocalAddr string `json:"local_addr"`
	State     string `json:"state"`
	PID       int32  `json:"pid"`
	Process   string `json:"process"`
}

// InterfaceInfo 网络接口信息
type InterfaceInfo struct {
	Name     string   `json:"name"`
	Addrs    []string `json:"addrs"`
	Flags    string   `json:"flags"`
	MTU      int      `json:"mtu"`
	Hardware string   `json:"hardware"`
}

type networkBusiness struct{}

var NetworkBusiness = &networkBusiness{}

// GetConnections 获取网络连接
func (b *networkBusiness) GetConnections() ([]ConnectionInfo, error) {
	conns, err := net.Connections("all")
	if err != nil {
		return nil, err
	}

	var connections []ConnectionInfo
	for _, conn := range conns {
		protocol := b.getProtocolName(conn.Type)
		state := b.getConnectionState(conn.Status)

		connections = append(connections, ConnectionInfo{
			Protocol:   protocol,
			LocalAddr:  conn.Laddr.IP,
			LocalPort:  int(conn.Laddr.Port),
			RemoteAddr: conn.Raddr.IP,
			RemotePort: int(conn.Raddr.Port),
			State:      state,
			PID:        conn.Pid,
		})
	}

	return connections, nil
}

// getProtocolName 获取协议名称
func (b *networkBusiness) getProtocolName(connType uint32) string {
	switch connType {
	case 1: // SOCK_STREAM
		return "tcp"
	case 2: // SOCK_DGRAM
		return "udp"
	default:
		return "unknown"
	}
}

// getConnectionState 获取连接状态
func (b *networkBusiness) getConnectionState(status string) string {
	if status == "" {
		return "-"
	}
	return status
}

// GetPortUsage 获取端口占用情况
func (b *networkBusiness) GetPortUsage() ([]PortInfo, error) {
	conns, err := net.Connections("all")
	if err != nil {
		return nil, err
	}

	portMap := make(map[string]PortInfo)
	for _, conn := range conns {
		if conn.Laddr.Port == 0 {
			continue
		}

		key := fmt.Sprintf("%s:%d", conn.Laddr.IP, conn.Laddr.Port)
		if _, exists := portMap[key]; !exists {
			protocol := b.getProtocolName(conn.Type)
			portMap[key] = PortInfo{
				Protocol:  protocol,
				Port:      int(conn.Laddr.Port),
				LocalAddr: conn.Laddr.IP,
				State:     b.getConnectionState(conn.Status),
				PID:       conn.Pid,
			}

			// 获取进程名称
			if conn.Pid > 0 {
				p, err := process.NewProcess(conn.Pid)
				if err == nil {
					name, _ := p.Name()
					portInfo := portMap[key]
					portInfo.Process = name
					portMap[key] = portInfo
				}
			}
		}
	}

	var ports []PortInfo
	for _, port := range portMap {
		ports = append(ports, port)
	}

	return ports, nil
}

// FindProcessByPort 根据端口查找进程
func (b *networkBusiness) FindProcessByPort(port int) (*PortInfo, error) {
	ports, err := b.GetPortUsage()
	if err != nil {
		return nil, err
	}

	for _, p := range ports {
		if p.Port == port {
			return &p, nil
		}
	}

	return nil, fmt.Errorf("端口 %d 未被占用", port)
}

// KillProcessByPort 杀死占用指定端口的进程
func (b *networkBusiness) KillProcessByPort(port int) error {
	portInfo, err := b.FindProcessByPort(port)
	if err != nil {
		return err
	}

	if portInfo.PID == 0 {
		return fmt.Errorf("无法获取占用端口 %d 的进程ID", port)
	}

	return ProcessBusiness.KillProcess(portInfo.PID)
}

// GetInterfaces 获取网络接口信息
func (b *networkBusiness) GetInterfaces() ([]InterfaceInfo, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var interfaces []InterfaceInfo
	for _, iface := range ifaces {
		info := InterfaceInfo{
			Name:  iface.Name,
			MTU:   iface.MTU,
			Flags: strings.Join(iface.Flags, ","),
		}

		// 获取硬件地址
		if iface.HardwareAddr != "" {
			info.Hardware = iface.HardwareAddr
		}

		// 获取地址
		for _, addr := range iface.Addrs {
			info.Addrs = append(info.Addrs, addr.Addr)
		}

		interfaces = append(interfaces, info)
	}

	return interfaces, nil
}

// GetInterfaceStats 获取网络接口统计信息
func (b *networkBusiness) GetInterfaceStats() (map[string]net.IOCountersStat, error) {
	stats, err := net.IOCounters(true)
	if err != nil {
		return nil, err
	}

	result := make(map[string]net.IOCountersStat)
	for _, stat := range stats {
		result[stat.Name] = stat
	}

	return result, nil
}

// FormatConnectionsOutput 格式化连接输出
func (b *networkBusiness) FormatConnectionsOutput(connections []ConnectionInfo) string {
	if len(connections) == 0 {
		return "暂无网络连接"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-8s %-22s %-22s %-12s %s\n",
		"协议", "本地地址", "远程地址", "状态", "PID"))
	sb.WriteString(strings.Repeat("-", 80) + "\n")

	count := 0
	for _, conn := range connections {
		if count >= 20 {
			sb.WriteString(fmt.Sprintf("... 还有 %d 个连接 ...\n", len(connections)-20))
			break
		}

		local := fmt.Sprintf("%s:%d", conn.LocalAddr, conn.LocalPort)
		remote := fmt.Sprintf("%s:%d", conn.RemoteAddr, conn.RemotePort)
		if conn.RemotePort == 0 {
			remote = conn.RemoteAddr
		}

		pidStr := "-"
		if conn.PID > 0 {
			pidStr = strconv.Itoa(int(conn.PID))
		}

		sb.WriteString(fmt.Sprintf("%-8s %-22s %-22s %-12s %s\n",
			conn.Protocol, local, remote, conn.State, pidStr))
		count++
	}

	return sb.String()
}

// FormatPortsOutput 格式化端口输出
func (b *networkBusiness) FormatPortsOutput(ports []PortInfo) string {
	if len(ports) == 0 {
		return "暂无端口占用"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-8s %-8s %-22s %-12s %-10s %s\n",
		"协议", "端口", "地址", "状态", "PID", "进程"))
	sb.WriteString(strings.Repeat("-", 80) + "\n")

	for _, p := range ports {
		process := p.Process
		if process == "" {
			process = "-"
		}
		pidStr := "-"
		if p.PID > 0 {
			pidStr = strconv.Itoa(int(p.PID))
		}

		sb.WriteString(fmt.Sprintf("%-8s %-8d %-22s %-12s %-10s %s\n",
			p.Protocol, p.Port, p.LocalAddr, p.State, pidStr, process))
	}

	return sb.String()
}

// FormatInterfacesOutput 格式化网络接口输出
func (b *networkBusiness) FormatInterfacesOutput(interfaces []InterfaceInfo) string {
	if len(interfaces) == 0 {
		return "暂无网络接口信息"
	}

	var sb strings.Builder
	for _, iface := range interfaces {
		sb.WriteString(fmt.Sprintf("接口: %s\n", iface.Name))
		sb.WriteString(fmt.Sprintf("  MAC:  %s\n", iface.Hardware))
		sb.WriteString(fmt.Sprintf("  MTU:  %d\n", iface.MTU))
		sb.WriteString(fmt.Sprintf("  标志: %s\n", iface.Flags))
		sb.WriteString("  地址:\n")
		for _, addr := range iface.Addrs {
			sb.WriteString(fmt.Sprintf("    %s\n", addr))
		}
		sb.WriteString("\n")
	}

	return sb.String()
}
