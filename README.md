# Japan Disaster Relief

面向在日外国人的避难信息 Web 服务。本仓库目前处于工程脚手架与原型开发阶段，已经具备前后端、共享 Contract、开放数据处理目录、最低测试和 Cloudflare 部署基础，但尚未实现完整避难推荐、地图、真实开放数据、多语言 UI 或离线应用。

## 技术栈

| 区域 | 技术 |
| --- | --- |
| Frontend | Next.js 16、React 19、TypeScript、Tailwind CSS、TanStack Query |
| Backend | Cloudflare Workers、Hono、TypeScript、Wrangler |
| Shared Contract | npm workspace `@nikuman-yummy/shared` |
| Data | TypeScript 转换/校验脚本与版本化目录约定 |
| Deployment | OpenNext for Cloudflare、Cloudflare Workers |
| CI/CD | GitHub Actions、CodeQL、Dependency Review |

## 项目结构

```text
.
├── FRONTEND/japan-disaster-relief/      Next.js 应用
├── BACKEND/japan-disaster-relief-api/   Hono Worker API
├── SHARED/                              前后端共用类型与 runtime guard
├── DATA/                                开放数据导入、标准化与校验
├── DOCS/                                架构、目录和 API 文档
└── .github/workflows/                   CI/CD
```

详细说明：

- [系统架构](DOCS/ARCHITECTURE.md)
- [文件夹构成](DOCS/FOLDER_STRUCTURE.md)
- [API Contract](DOCS/API.md)

## 环境要求

- Node.js 24.19.0 LTS（见 `.nvmrc`）
- npm 12.0.2
- Git
- Wrangler（作为项目依赖安装）
- Cloudflare account（仅部署需要）

## 初始化

```bash
git clone https://github.com/happy-nukuman/nikuman-yummy-www.git
cd nikuman-yummy-www
nvm use
npm ci
```

本仓库使用 npm workspaces，并只维护根目录 `package-lock.json`。不要在子项目重新生成独立 lockfile。

## 本地启动

分别启动后端和前端：

```bash
# Terminal 1: http://localhost:8787
npm run dev:backend

# Terminal 2: http://localhost:3000
npm run dev:frontend
```

前端默认使用 mock。连接本地后端时：

```bash
cp FRONTEND/japan-disaster-relief/.env.example \
  FRONTEND/japan-disaster-relief/.env.local
```

然后在 `.env.local` 中配置公开的 API 地址并关闭 mock。`.env.local` 不得提交。

## 验证命令

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

Cloudflare bundle 的本地只读验证：

```bash
npm run build:cloudflare
```

开放数据 Contract 验证：

```bash
npm run data:validate -- DATA/normalized/shelters.json
```

## 环境变量

| 名称 | 用途 | 是否公开 | 配置位置 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 浏览器调用的 API base URL | 是 | 前端 `.env.local`；部署时 GitHub Variable |
| `NEXT_PUBLIC_API_MOCK` | 切换 mock/真实 API | 是 | 前端 `.env.local`；部署时 GitHub Variable |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions 部署认证 | 否 | GitHub Secret |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account 标识 | 否 | GitHub Secret |

仓库只提交 `.env.example`。不要把 Token、密码或其他 Secret 放入 `NEXT_PUBLIC_*`。

## Cloudflare 与 CI/CD

- 涉及 frontend、backend、shared 或 data 的 Pull Request：install、lint、typecheck、test、OpenNext build、Wrangler dry-run、CodeQL、Dependency Review。
- `develop` 的相关路径发生 push：验证通过后部署 Demo Workers。
- Frontend `workflow_dispatch` 只有在 ref 为 `develop` 时才允许部署。
- `feature/*` Pull Request 不会触发 production deploy。
- `main` 当前没有自动部署；建议作为最终/production candidate。

当前 Worker 名称保留为：

- Frontend：`front-japan-disaster-relief`
- Backend：`api-japan-disaster-relief`

合并前需要在 GitHub 中确认：

1. `NEXT_PUBLIC_API_BASE_URL` 和 `NEXT_PUBLIC_API_MOCK` Variables 已配置到部署作用域。
2. `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` Secrets 仍有效。
3. 当前仓库没有声明 GitHub Environment approval 已配置；如需要生产审批，必须在控制台手动设置。

## 分支策略

当前和推荐流程：

```text
feature/* → Pull Request → develop → Demo environment
main → Final / production candidate（当前无自动部署）
```

禁止直接在 feature 分支执行 production deploy。

## 当前实现状态

| 状态 | 内容 |
| --- | --- |
| 已实现 | Next.js 首页、TanStack Query、统一 API Client、Hono health/system 路由、统一错误响应、request ID |
| 脚手架已准备 | language/location/disaster/shelter Feature 边界、反馈组件、geo/i18n 基础、Shared Contract、DATA 校验 |
| 计划实现 | 真实开放数据接入、避难所 API、数据更新时间/fallback、多语言 UI、离线缓存 |
| 尚未实现 | 完整避难推荐、地图、登录、数据库、AI Chatbot、PWA |
