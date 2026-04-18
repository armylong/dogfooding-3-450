# 抓接口 - Chrome扩展

一个用于捕获页面接口数据并上传至服务器的Chrome浏览器扩展。

## 功能特性

- ✅ **请求捕获**：Hook XHR和Fetch请求，捕获完整接口信息
- ✅ **关键词筛选**：支持多个筛选关键词，只捕获符合条件的请求
- ✅ **录制开关**：可控制录制状态，关闭时完全不捕获
- ✅ **接口列表**：实时展示已捕获的接口数据，按时间倒序排列
- ✅ **标签页隔离**：不同标签页的数据相互独立
- ✅ **自动上传**：录制开启时，捕获的请求自动异步上传至服务器
- ✅ **状态持久化**：录制状态和筛选条件自动保存
- ✅ **异常处理**：服务器不可用时显示提示信息

## 安装说明

1. 打开Chrome浏览器，进入 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目的 `api-catcher` 文件夹

## 使用方法

### 1. 开启录制
点击插件图标，打开popup面板，点击「录制开关」按钮开启录制。开启后：
- 状态指示变为红色「录制中」并闪烁
- 页面上的所有符合条件的接口请求将被捕获

### 2. 设置筛选关键词
点击「+ 添加」按钮添加筛选条件：
- 可添加多个筛选关键词
- 关键词为空时捕获所有请求
- 只有URL包含任一关键词的请求才会被捕获
- 筛选条件自动保存，刷新页面不会丢失

### 3. 查看接口列表
接口列表区域实时展示：
- 已捕获的接口数量统计
- 按时间倒序排列（最新在前）
- 请求方法（GET/POST/PUT/DELETE等）
- 请求时间
- 完整URL
- HTTP状态码

### 4. 清空数据
点击「清空」按钮可清除当前标签页的所有捕获数据。

## 文件结构

```
api-catcher/
├── manifest.json    # 扩展配置文件
├── popup.html       # popup页面结构
├── popup.css        # popup样式文件
├── popup.js         # popup交互逻辑
├── background.js    # 后台服务脚本（数据管理、上传）
├── content.js       # 内容脚本（请求Hook）
└── README.md        # 说明文档
```

## 核心文件说明

### manifest.json
Chrome扩展的配置文件，包含：
- 权限声明：storage、tabs、activeTab
- 后台服务配置
- 内容脚本注入配置
- host权限配置

### content.js
注入到页面的内容脚本，负责：
- Hook原生XMLHttpRequest对象
- Hook原生fetch函数
- 捕获请求的完整信息（URL、方法、请求头、响应头、参数、请求体、响应体、状态、耗时）
- 与background通信，发送捕获的数据
- 使用页面上下文注入技术确保Hook能拦截所有请求

### background.js
后台服务，负责：
- 管理各标签页的接口数据（Map存储，标签页隔离）
- 录制状态和筛选列表的持久化存储
- 异步上传接口数据到服务器
- 服务器连接状态检测
- 与popup和content脚本的消息通信
- 监听标签页更新事件，向新页面同步状态

### popup.js
popup面板的交互逻辑：
- 录制开关控制
- 筛选关键词的动态添加/删除
- 接口列表的实时渲染
- 服务器连接状态显示

## 数据上传

### 上传地址
`http://localhost/api_catcher/upload`

### 数据格式
```json
{
  "filter_list": ["api/user", "api/order"],
  "api_data": {
    "id": "1712345678901_abc123",
    "url": "https://example.com/api/user/info",
    "method": "GET",
    "request_headers": {},
    "response_headers": {},
    "params": {},
    "request_body": null,
    "response_body": {},
    "status": 200,
    "capture_time": 1712345678901,
    "duration": 120
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 唯一标识（时间戳+随机数） |
| url | String | 完整URL |
| method | String | 请求方法 |
| request_headers | Object | 请求头 |
| response_headers | Object | 响应头 |
| params | Object | URL查询参数 |
| request_body | 任意 | 请求体内容 |
| response_body | 任意 | 响应体内容 |
| status | Number | HTTP状态码 |
| capture_time | Number | 捕获时间戳（毫秒） |
| duration | Number | 请求耗时（毫秒） |

## 注意事项

1. **图标文件**：manifest.json中配置了icon16.png、icon48.png、icon128.png，如需显示图标请自行添加对应尺寸的图标文件。
2. **跨域问题**：由于Chrome的安全策略，content script只能在页面上下文执行Hook，无法通过chrome.webRequest API获取请求体和响应体。
3. **服务器地址**：如需修改上传服务器地址，请修改background.js中的UPLOAD_URL常量。
4. **刷新页面**：安装或更新扩展后，需要刷新已打开的页面才能生效。
5. **调试信息**：打开浏览器开发者工具（F12），在Console中可以看到扩展的调试日志，前缀为`[API Catcher]`。

## 技术实现

- 使用Chrome Extension Manifest V3规范
- Service Worker作为后台服务
- 原型链改写实现XHR和Fetch的Hook
- 页面上下文脚本注入技术（解决隔离问题）
- chrome.storage.local实现状态持久化
- chrome.runtime.sendMessage实现跨上下文通信
- 事件监听机制确保捕获所有请求状态（load/error/abort）

## 更新日志

### v1.0 (2024)
- 初始版本发布
- 支持XHR和Fetch请求捕获
- 支持关键词筛选
- 支持数据自动上传
