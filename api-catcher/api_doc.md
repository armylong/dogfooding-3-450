# API接口文档

## 上传接口数据

### 请求信息

- URL: http://localhost/api_catcher/upload
- Method: POST
- Content-Type: application/json

### 请求参数

{
  "filter_list": ["api/user", "api/order"],
  "api_data": {
    "id": "1712345678901_abc123",
    "url": "https://example.com/api/user/info",
    "method": "GET",
    "headers": {},
    "params": {},
    "request_body": null,
    "response_body": {},
    "status": 200,
    "capture_time": 1712345678901,
    "duration": 120
  }
}

### 参数说明

filter_list: 筛选关键词列表（数组）
api_data: 捕获的接口数据（对象）

api_data字段说明：
- id: 唯一标识（时间戳+随机数）
- url: 完整URL
- method: 请求方法（GET/POST/PUT/DELETE等）
- headers: 请求头
- params: URL查询参数
- request_body: 请求体
- response_body: 响应体
- status: HTTP状态码
- capture_time: 捕获时间戳（毫秒）
- duration: 请求耗时（毫秒）

### 响应示例

{
  "code": 0,
  "message": "success"
}
