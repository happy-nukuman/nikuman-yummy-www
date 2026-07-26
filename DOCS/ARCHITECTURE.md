# Architecture

## 1. 系统目标与当前边界

目标是在灾害场景下，为在日外国人提供可理解、可追溯的避难信息。当前阶段只建立可维护工程基础，不声称已经完成避难推荐、地图、真实开放数据、多语言 UI、数据库或离线应用。

当前可运行边界：

```text
Browser
  ↓
Next.js Frontend
  ↓
API Client / TanStack Query
  ↓
Cloudflare Worker / Hono
  ↓
System status service
```

## 2. 前端职责

- `app`: 路由、Metadata、Provider 与页面组合。
- `features`: 按 language、location、disaster、shelter 等用户能力分区。
- `components`: 不包含业务规则的可复用 UI/反馈组件。
- `lib/api`: base URL、mock 边界、timeout、HTTP/JSON 错误。
- `lib/geo`: 可单元测试的地理计算。
- `lib/i18n`: locale 型、默认 locale 与 fallback。
- `types`: 从 Shared Contract 重导出应用所需类型。

页面不直接处理 `fetch`、mock、数据转换或未来推荐规则。当前 `SystemStatus` Feature 只是连通性脚手架，不是正式避难业务。

## 3. 后端职责

- `index.ts`: Worker export。
- `app.ts`: Hono app 装配。
- `routes`: HTTP path 与 status code。
- `services`: 可测试的业务用例。
- `repositories`: 数据来源抽象；当前只有接口，没有假数据实现。
- `schemas`: 统一响应构造。
- `middleware`: request ID、CORS、404 与异常处理。

当前 Worker 不包含数据库、用户认证或外部开放数据调用。

## 4. Shared Contract

`@nikuman-yummy/shared` 是前端、后端和数据脚本的单一 Contract 来源。它提供：

- `ApiResponse`、`ApiErrorResponse`、health/system 响应。
- `LocalizedText`、`DisasterType`、`DisasterAlert`、`Shelter`。
- 开放数据导入可调用的 `isShelter` runtime guard。

该 package 直接发布 TypeScript source。Next.js 使用 `transpilePackages`，Wrangler 使用其 bundler 处理同一源码；避免手工复制生成文件。

## 5. DATA 职责与未来数据流

当前已建立目录、管理规则和 shelter 校验脚本，未接入真实数据。

```text
Open Data                         [planned]
  ↓
DATA/raw                         [directory ready]
  ↓
Normalize / Validate Script      [validation ready, normalization planned]
  ↓
DATA/normalized                  [directory ready]
  ↓
Backend Repository               [interface ready]
  ↓
Frontend                         [planned shelter feature]
```

每个数据源必须记录来源、许可证、原始 URL、取得日期、更新频率和转换方法。不得用 sample 冒充真实避难数据。

## 6. 目标运行结构

```text
Browser
  ↓
Next.js Frontend
  ↓
API Client / TanStack Query
  ↓
Cloudflare Worker / Hono
  ↓
Repository
  ├─ Normalized JSON                 [planned]
  ├─ Future: R2                      [not configured]
  ├─ Future: D1                      [not configured]
  └─ Future: External Open Data API  [not connected]
```

## 7. Offline / fallback 计划

fallback 元数据已在 `ApiResponse.meta.fallback`、`source`、`updatedAt` 中预留。后续优先采用：

1. 构建时生成的小型 normalized snapshot。
2. 前端最近成功结果与更新时间。
3. 在线刷新失败时回退到快照并明确提示。

当前没有 Service Worker、IndexedDB 或 PWA，不得把它们写成已实现。

## 8. D1、R2、KV 的采用条件

- D1：需要关系查询、服务端筛选或结构化增量更新时。
- R2：开放数据或静态快照过大、不适合 Git 管理时。
- KV：小型低频配置、数据版本指针或短期 cache metadata。

只有在真实数据规模、更新频率和许可证确定后才选择绑定。本阶段不创建 Cloudflare 资源。

## 9. Cloudflare 部署

- Next.js 经 OpenNext 转换为 frontend Worker。
- Hono 直接打包为 backend Worker。
- GitHub Actions 使用根目录 workspace lockfile。
- Pull Request 只验证；`develop` push 才能进入 deploy job。
- Frontend manual dispatch 仅允许 `develop` ref 部署。

GitHub Environment approval、Variables 和 Secrets 属于控制台配置，不能仅凭代码声称已经设置。

## 10. CI 数据流

```text
Pull Request
  ↓
npm ci
  ↓
Lint → Typecheck → Test
  ↓
OpenNext build / Wrangler dry-run
  ↓
CodeQL / Dependency Review
  ↓
Merge to develop
  ↓
Cloudflare Demo deploy
```

## 11. 不采用复杂架构的理由

当前业务路由和数据源很少。使用轻量 route/service/repository 边界即可支持多人并行；DI 容器、CQRS、Event Bus、微服务和复杂领域框架会增加部署与理解成本，却没有当前需求支撑。
