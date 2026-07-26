# Japan Disaster Relief Frontend

Next.js App Router 前端。依赖由仓库根目录 npm workspace 管理。

```bash
# Repository root
npm ci
npm run dev:frontend
npm run lint --workspace japan-disaster-relief
npm run typecheck --workspace japan-disaster-relief
npm run test --workspace japan-disaster-relief
npm run build --workspace japan-disaster-relief
npm run build:cloudflare --workspace japan-disaster-relief
```

默认使用 mock。连接本地 backend 时，将 `.env.example` 复制为 `.env.local`，只配置公开的 `NEXT_PUBLIC_API_BASE_URL` 和 `NEXT_PUBLIC_API_MOCK`。不要提交 `.env.local`。

主要职责见 [`DOCS/FOLDER_STRUCTURE.md`](../../DOCS/FOLDER_STRUCTURE.md)。
