# Frontend tech stack

实际采用的前端技术：

| Technology | Role |
| --- | --- |
| Next.js 16 App Router | 路由、静态生成和应用框架 |
| React 19 | UI |
| TypeScript 5 | 类型检查 |
| Tailwind CSS 4 | 样式 |
| TanStack Query 5 | Server state |
| Vitest | 纯函数和模块测试 |
| OpenNext for Cloudflare | Worker bundle |

当前没有 Zustand、完整 i18n framework、Component Library 或 Playwright。引入新依赖前应先证明实际 Feature 需要，并验证 OpenNext 构建。
