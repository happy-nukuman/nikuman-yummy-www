# Folder structure

## 总览

| 路径 | 职责 | 是否已实现 |
| --- | --- | --- |
| `FRONTEND/japan-disaster-relief/src/app` | Next.js 路由与页面组合 | 是 |
| `FRONTEND/japan-disaster-relief/src/features` | 按业务功能组织 | 部分；system-status 可运行，其余为职责说明 |
| `FRONTEND/japan-disaster-relief/src/components` | 通用 UI 和反馈组件 | 部分；已实现 feedback |
| `FRONTEND/japan-disaster-relief/src/lib/api` | API Client、mock、timeout 与错误边界 | 是 |
| `FRONTEND/japan-disaster-relief/src/lib/geo` | 地理计算 | 基础；距离函数与测试 |
| `FRONTEND/japan-disaster-relief/src/lib/i18n` | locale 与 fallback | 基础；未实现语言切换 |
| `FRONTEND/japan-disaster-relief/src/types` | Shared Contract 的前端出口 | 是 |
| `BACKEND/japan-disaster-relief-api/src/routes` | Hono 路由 | 是 |
| `BACKEND/japan-disaster-relief-api/src/services` | 用例与业务逻辑 | 基础；system status |
| `BACKEND/japan-disaster-relief-api/src/repositories` | 数据访问抽象 | 基础；只有 ShelterRepository interface |
| `BACKEND/japan-disaster-relief-api/src/schemas` | 响应结构构造 | 是 |
| `BACKEND/japan-disaster-relief-api/src/middleware` | CORS、request ID、统一错误 | 是 |
| `SHARED` | 前后端与数据脚本共享 Contract | 是 |
| `DATA/raw` | 原始开放数据 | 计划；只有管理说明 |
| `DATA/normalized` | 标准化数据 | 计划；只有管理说明 |
| `DATA/scripts` | 数据转换与校验 | 基础；已实现 shelter 校验 |
| `DOCS` | 技术文档 | 是 |

## Frontend

```text
src/
├── app/                       路由、layout、Provider
├── components/feedback/       Loading/Error/Empty
├── features/
│   ├── system-status/         当前可运行连通性示例
│   ├── language/              计划职责说明
│   ├── location/              计划职责说明
│   ├── disaster/              计划职责说明
│   └── shelter/               计划职责说明
├── lib/
│   ├── api/                   通用 HTTP/mock
│   ├── geo/                   纯函数
│   └── i18n/                  locale/fallback
└── types/                     Contract re-export
```

新增业务应从 Feature 入口组合 API、状态和 UI；`app/page.tsx` 不承载业务规则。

## Backend

```text
src/
├── index.ts                   Worker export
├── app.ts                     Hono 装配
├── config/                    公开运行配置
├── middleware/                横切处理
├── routes/                    HTTP 边界
├── services/                  用例
├── repositories/              数据来源接口
├── schemas/                   响应构造
└── types/                     Worker/Hono 环境类型
```

真实数据接入时，应先实现 `Repository`，由 Service 组合业务规则，再由 Route 暴露 HTTP。不要让 Route 直接读取 raw 文件或调用多个外部服务。

## Shared

```text
SHARED/src/
├── api.ts
├── disaster.ts
├── localization.ts
├── shelter.ts
└── index.ts
```

Contract 只包含跨边界需要的类型、常量和轻量 runtime guard，不放 React、Hono 或 Cloudflare 专用代码。

## DATA

`raw` 和 `normalized` 默认通过 `.gitignore` 阻止数据文件进入 Git，只跟踪职责 README。确认许可证、大小和更新策略后才能显式纳入版本管理。
