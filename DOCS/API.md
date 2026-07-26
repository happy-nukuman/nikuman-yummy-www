# API

当前 Base URL 由环境决定。本文只记录已经实现的接口；计划接口与实现接口严格分开。

所有响应包含 `X-Request-ID` Header。未知路由和内部错误使用 Shared Contract：

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found.",
    "requestId": "..."
  }
}
```

`requestId` 示例不是固定值。服务端不会向客户端返回异常堆栈。

## Implemented API

### GET `/health`

- 用途：Worker 存活检查。
- Request body：无。
- 成功：HTTP 200。

```json
{
  "status": "ok"
}
```

- Error：统一 `ApiErrorResponse`。
- 分类：运维健康检查，不是正式避难业务接口。

### GET `/api/hello`

- 用途：验证 Frontend → API Client → Backend 连通性。
- Request body：无。
- 成功：HTTP 200。

```json
{
  "message": "hello world!"
}
```

- Error：统一 `ApiErrorResponse`。
- 分类：Development scaffold endpoint，不是正式避难业务接口。

## CORS

`/api/*` 保留明确 allowlist，支持本地前端和当前 Cloudflare Demo 前端。不得无理由改为 `*`。

## Planned API

避难所查询、灾害警报和数据版本接口尚未实现。确认真实开放数据、许可证、字段和 fallback 策略后再补充正式 Contract。
