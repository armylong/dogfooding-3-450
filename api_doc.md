# API接口文档

## 上传接口数据

### 请求信息

- **URL**: `http://localhost/api_catcher/upload`
- **Method**: `POST`
- **Content-Type**: `application/json`

### 请求参数

```json
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
```

### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filter_list | Array\<String\> | 是 | 筛选关键词列表 |
| api_data | Object | 是 | 捕获的接口数据 |

### api_data 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 唯一标识（时间戳+随机数） |
| url | String | 是 | 完整URL |
| method | String | 是 | 请求方法（GET/POST/PUT/DELETE等） |
| headers | Object | 否 | 请求头 |
| params | Object | 否 | URL查询参数 |
| request_body | Object/String/null | 否 | 请求体 |
| response_body | Object/String/null | 否 | 响应体 |
| status | Number | 是 | HTTP状态码 |
| capture_time | Number | 是 | 捕获时间戳（毫秒） |
| duration | Number | 是 | 请求耗时（毫秒） |

### 响应示例

```json
{
  "code": 0,
  "message": "success"
}
```
