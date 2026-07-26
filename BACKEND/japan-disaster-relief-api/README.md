# Japan Disaster Relief API

Cloudflare Workers、Hono、TypeScript 后端。依赖由仓库根目录 npm workspace 管理。

```bash
# Repository root
npm ci
npm run dev:backend
npm run lint --workspace japan-disaster-relief-api
npm run typecheck --workspace japan-disaster-relief-api
npm run test --workspace japan-disaster-relief-api
npm run build --workspace japan-disaster-relief-api
```

`build` 使用 `wrangler deploy --dry-run`，不会部署。真实部署只由受控 GitHub Actions job 或明确的人工操作执行。

主要职责见 [`DOCS/FOLDER_STRUCTURE.md`](../../DOCS/FOLDER_STRUCTURE.md)，接口见 [`DOCS/API.md`](../../DOCS/API.md)。
