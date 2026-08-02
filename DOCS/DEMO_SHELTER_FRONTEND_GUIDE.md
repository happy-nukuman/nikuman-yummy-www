# 东京都厅周边避难所 Demo API｜前端接入完整指南

本文面向前端开发人员，说明如何在比赛 Demo 中调用后端避难所查询接口，并正确展示东京都厅周边的新宿区避难所候选。

> - 实现分支：`backgroud`
> - API 状态：Demo 专用、已实现、无需 D1
> - 后端入口：`POST /api/demo/shelters/nearby`
> - 数据性质：新宿区官方开放数据的固定快照，不是实时开放状态

## 1. 接口能力与边界

前端提交任意合法的 WGS84 经纬度以满足现有请求 Contract。后端不会使用请求坐标进行查询，而是执行以下操作：

1. 校验经纬度与可选结果数量；
2. 使用固定东京都厅坐标 `35.6896342, 139.6917418` 作为查询原点；
3. 计算东京都厅与 Demo 避难所之间的 Haversine 直线距离；
4. 只保留固定原点 3,000 米以内的设施；
5. 按距离从近到远排序；
6. 返回日文设施名、日文地址、设施坐标、距离和 Google Maps 位置链接。

此接口不会：

- 判断设施当前是否开放；
- 判断设施或路线是否安全；
- 计算步行、驾车或避难路线；
- 保存位置历史；
- 调用生成式 AI；
- 访问 D1 数据库或外部实时接口。

关键行为：无论请求传入东京都厅、东京站、海外或其他合法坐标，返回的候选、距离和排序均相同；只有 `limit` 会改变返回条数。

## 2. Base URL 与环境配置

本地后端默认地址：

```text
http://localhost:8787
```

前端通过以下环境变量读取 API 地址：

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
NEXT_PUBLIC_API_MOCK=false
```

请复制前端已有的 `.env.example` 为 `.env.local`。`.env.local` 不得提交到 Git。

```bash
cd FRONTEND/japan-disaster-relief
copy .env.example .env.local
```

比赛或部署环境必须以实际后端 Worker 地址设置 `NEXT_PUBLIC_API_BASE_URL`，不要在业务组件内写死域名。

## 3. 启动本地联调环境

在仓库根目录安装依赖：

```bash
npm ci
```

分别启动后端和前端：

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

确认后端可访问：

```text
http://localhost:8787/health
```

## 4. 请求契约

### 4.1 Endpoint

```http
POST /api/demo/shelters/nearby
Content-Type: application/json
Accept: application/json
```

### 4.2 Request body

```json
{
  "latitude": 35.6896342,
  "longitude": 139.6917418,
  "limit": 5
}
```

请求坐标只为保持接口 Contract 兼容，后端会忽略其具体值。建议前端 Demo 直接传东京都厅固定坐标，不要仅为调用本接口申请浏览器定位权限。

| 字段 | 类型 | 必填 | 规则 |
|---|---|---:|---|
| `latitude` | `number` | 是 | WGS84 纬度，有限数值，范围 `-90` 至 `90`；通过校验后不参与查询 |
| `longitude` | `number` | 是 | WGS84 经度，有限数值，范围 `-180` 至 `180`；通过校验后不参与查询 |
| `limit` | `number` | 否 | 结果数量，整数 `1` 至 `10`，默认 `5` |

禁止把字符串形式的坐标直接传给 API：

```json
{
  "latitude": "35.6896342",
  "longitude": "139.6917418"
}
```

以上请求会返回 HTTP 400。前端应在构造请求时保留 `number` 类型。

## 5. 成功响应

```json
{
  "dataStatus": "not_realtime",
  "origin": {
    "latitude": 35.6896342,
    "longitude": 139.6917418
  },
  "searchRadiusMeters": 3000,
  "source": {
    "name": "新宿区の避難所情報",
    "url": "https://catalog.data.metro.tokyo.lg.jp/dataset/t131041d0000000055",
    "updatedAt": "2025-12-12",
    "realtime": false
  },
  "facilities": [
    {
      "facilityId": "demo-shinjuku-nishi-shinjuku-elementary",
      "nameJa": "西新宿小学校",
      "addressJa": "東京都新宿区西新宿4-35-5",
      "latitude": 35.68602,
      "longitude": 139.68748,
      "distanceMeters": 556,
      "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=35.68602%2C139.68748"
    }
  ],
  "limitations": {
    "openStatus": "unknown",
    "routeStatus": "unknown"
  }
}
```

### 5.1 顶层字段

| 字段 | 类型 | 前端用途 |
|---|---|---|
| `dataStatus` | 固定为 `"not_realtime"` | 显示“非实时数据／无法确认当前开放” |
| `origin` | `{ latitude, longitude }` | 后端实际查询原点；始终为东京都厅固定坐标 |
| `searchRadiusMeters` | `number` | 固定查询半径；当前为 3,000 米 |
| `source` | `object` | 来源名称、来源链接、更新时间与实时性 |
| `facilities` | `DemoShelterCandidate[]` | 避难所候选列表，已按距离升序排列 |
| `limitations` | `object` | 强制提醒开放状态和路线状态均不可确认 |

### 5.2 设施字段

| 字段 | 类型 | 展示规则 |
|---|---|---|
| `facilityId` | `string` | React key、缓存与测试标识；不要作为用户文案 |
| `nameJa` | `string` | 官方日文设施名，原样展示，不做机器翻译 |
| `addressJa` | `string` | 日文地址，原样展示 |
| `latitude` | `number` | 设施纬度；用于地图定位 |
| `longitude` | `number` | 设施经度；用于地图定位 |
| `distanceMeters` | `number` | 从东京都厅固定坐标计算的直线距离，整数米 |
| `googleMapsUrl` | `string` | 打开 Google Maps 的设施位置；只能表述为“查看位置” |

## 6. 共享 TypeScript 类型

前端必须从 workspace 共享包导入类型，不要在前端重复声明：

```ts
import type {
  DemoShelterNearbyRequest,
  DemoShelterNearbyResponse,
  DemoShelterCandidate,
} from "@nikuman-yummy/shared";
```

共享 Contract 实现位置：

```text
SHARED/src/demo-shelter.ts
```

请求校验规则由后端使用同一文件中的 `isDemoShelterNearbyRequest` 执行。

## 7. 推荐的 API Client 实现

当前 `src/lib/api/client.ts` 只有 `apiGet`。请在同一文件补充统一的 `apiPost`，不要在页面组件内各自实现 `fetch`。

建议保持与现有客户端相同的 8 秒超时及 `ApiClientError` 分类：

```ts
import { API_BASE_URL, DEFAULT_REQUEST_TIMEOUT_MS } from "./config";

type ApiPostOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
  options: ApiPostOptions = {},
): Promise<TResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  let didTimeout = false;

  const handleExternalAbort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) {
    handleExternalAbort();
  } else {
    options.signal?.addEventListener("abort", handleExternalAbort, { once: true });
  }

  const timeoutId = globalThis.setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiClientError(
        "HTTP_ERROR",
        `POST ${path} returned HTTP ${response.status}.`,
        response.status,
      );
    }

    try {
      return (await response.json()) as TResponse;
    } catch {
      throw new ApiClientError(
        "INVALID_RESPONSE",
        `POST ${path} returned invalid JSON.`,
      );
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ApiClientError(
        didTimeout ? "REQUEST_TIMEOUT" : "REQUEST_ABORTED",
        didTimeout
          ? `POST ${path} timed out.`
          : `POST ${path} was aborted.`,
      );
    }

    throw new ApiClientError(
      "NETWORK_ERROR",
      `POST ${path} failed before receiving a response.`,
    );
  } finally {
    globalThis.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", handleExternalAbort);
  }
}
```

如果需要支持现有 mock 模式，应在 `src/lib/api/mock.ts` 中为该路径增加明确 mock；不能在 `apiPost` 内静默返回空数组。

## 8. Feature 层封装

建议在 shelter feature 下集中封装 API，不让页面直接依赖路径字符串：

```text
src/features/shelter/
├── api/
│   └── get-demo-shelters.ts
├── hooks/
│   └── use-demo-shelters.ts
└── components/
    ├── shelter-candidate-card.tsx
    └── shelter-candidate-list.tsx
```

### 8.1 API function

```ts
import type {
  DemoShelterNearbyRequest,
  DemoShelterNearbyResponse,
} from "@nikuman-yummy/shared";
import { apiPost } from "@/lib/api/client";

export function getDemoShelters(
  request: DemoShelterNearbyRequest,
  signal?: AbortSignal,
): Promise<DemoShelterNearbyResponse> {
  return apiPost<DemoShelterNearbyRequest, DemoShelterNearbyResponse>(
    "/api/demo/shelters/nearby",
    request,
    { signal },
  );
}
```

### 8.2 TanStack Query mutation

查询由用户动作触发，建议使用 mutation：

```ts
import { useMutation } from "@tanstack/react-query";
import { getDemoShelters } from "../api/get-demo-shelters";

export function useDemoShelters() {
  return useMutation({
    mutationKey: ["demo-shelters-nearby"],
    mutationFn: getDemoShelters,
  });
}
```

调用示例：

```ts
const shelters = useDemoShelters();

function search() {
  shelters.mutate({
    latitude: 35.6896342,
    longitude: 139.6917418,
    limit: 5,
  });
}
```

提交期间必须禁用重复点击：

```tsx
<button disabled={shelters.isPending} onClick={handleSearch}>
  {shelters.isPending ? "検索中…" : "近くの避難所を確認"}
</button>
```

## 9. 固定 Demo 坐标接入

本接口固定按照东京都厅查询，不需要浏览器定位。前端应直接使用下面的 Demo 常量：

```ts
export const TOKYO_METROPOLITAN_GOVERNMENT_DEMO_ORIGIN = {
  latitude: 35.6896342,
  longitude: 139.6917418,
} as const;
```

调用：

```ts
shelters.mutate({
  ...TOKYO_METROPOLITAN_GOVERNMENT_DEMO_ORIGIN,
  limit: 5,
});
```

注意：

- 不要仅为此接口调用 `navigator.geolocation`；
- 即使其他流程已经取得用户坐标，也不需要传入真实位置；
- 如果仍传入其他合法坐标，后端也会忽略并返回相同结果；
- 响应中的 `origin` 是实际计算原点，应始终等于上述固定坐标。

## 10. UI 展示规范

推荐候选卡字段顺序：

```text
西新宿小学校
避難所 · 約 556 m
東京都新宿区西新宿4-35-5
現在の開設状況：確認できません
[Google マップで位置を確認]
```

页面底部必须展示：

```text
データ出典：新宿区の避難所情報
更新日：2025-12-12
リアルタイム情報ではありません。
近い施設が安全または開設中とは限りません。
直線距離は経路の通行可能性を示しません。
```

Google Maps 按钮：

```tsx
<a
  href={facility.googleMapsUrl}
  target="_blank"
  rel="noopener noreferrer"
>
  Google マップで位置を確認
</a>
```

允许的表达：

- “附近设施候选”；
- “约 556 米”；
- “在 Google 地图中查看位置”；
- “无法确认当前开放状态”；
- “路线是否可通行需要现场确认”。

禁止的表达：

- “最近且最安全的避难所”；
- “该设施已开放”；
- “安全路线”；
- “系统建议立即前往”；
- “一定可以到达”。

Google Maps 链接只用于显示设施坐标，不能把按钮写成“开始安全导航”。

## 11. 页面状态处理

前端必须覆盖以下状态：

| 状态 | 判断方式 | UI 行为 |
|---|---|---|
| 初始 | mutation 尚未调用 | 显示“查看东京都厅周边避难所”按钮 |
| 请求中 | `isPending` | 显示骨架或加载状态，禁用重复请求 |
| 成功有结果 | `facilities.length > 0` | 按后端顺序展示候选 |
| 成功无结果 | `facilities.length === 0` | 显示东京都厅 3 公里内无 Demo 数据，不虚构候选 |
| HTTP 400 | `ApiClientError.status === 400` | 视为前端请求构造错误；用户侧显示通用提示 |
| 请求超时 | `REQUEST_TIMEOUT` | 显示服务受限、重试入口和基础求助信息 |
| 网络错误 | `NETWORK_ERROR` | 显示极简网络异常页，不继续展示旧候选 |
| 用户取消/返回 | `REQUEST_ABORTED` | 静默结束，不弹技术错误 |

注意：`dataStatus === "not_realtime"` 是正常成功响应，不是错误。必须展示来源、更新时间与限制说明。

## 12. 错误响应

非法请求返回 HTTP 400：

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request body must contain valid latitude and longitude values; limit must be an integer from 1 to 10.",
    "requestId": "..."
  }
}
```

每个响应都有 `X-Request-ID` Header。开发和排障时可以记录 `requestId`；本 Demo 建议始终提交公开的东京都厅固定坐标。

不要把后端英文 `error.message` 直接显示给用户。用户文案由前端语言包管理。

## 13. cURL 联调示例

```bash
curl -X POST "http://localhost:8787/api/demo/shelters/nearby" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "latitude": 35.6896342,
    "longitude": 139.6917418,
    "limit": 5
  }'
```

PowerShell：

```powershell
$body = @{
  latitude = 35.6896342
  longitude = 139.6917418
  limit = 5
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8787/api/demo/shelters/nearby" `
  -ContentType "application/json" `
  -Body $body
```

## 14. 前端验收清单

- [ ] `.env.local` 使用正确的 API Base URL，并设置 `NEXT_PUBLIC_API_MOCK=false`；
- [ ] 不为本接口申请浏览器位置权限；
- [ ] 请求体坐标为 `number`，不是字符串；
- [ ] 请求期间按钮不可重复点击；
- [ ] 候选顺序直接使用后端返回顺序，不在前端重新按名称排序；
- [ ] 设施名与地址使用官方日文原文；
- [ ] 距离显示“约”，不表述为路线距离；
- [ ] Google Maps 使用后端的 `googleMapsUrl`；
- [ ] 外部链接使用 `target="_blank"` 与 `rel="noopener noreferrer"`；
- [ ] 明确显示设施开放状态无法确认；
- [ ] 明确显示路线是否可通行无法确认；
- [ ] 展示数据来源与更新时间；
- [ ] 空数组显示无结果，不生成假候选；
- [ ] 覆盖 loading、success、empty、400、timeout、network error；
- [ ] 使用统一的东京都厅 Demo 坐标常量；
- [ ] 中文、英文、日文切换不会改变候选事实字段；
- [ ] 使用不同合法请求坐标测试时，候选、距离和排序保持一致。

## 15. 后端验证状态

该接口已经覆盖：

- 请求 Contract runtime 校验；
- 固定东京都厅坐标附近结果与距离排序；
- `limit` 截断；
- Google Maps URL；
- 任意合法请求坐标均返回相同候选、距离与排序；
- 非法 JSON、缺少字段、坐标越界与非法 `limit`；
- 无 D1 binding 时正常运行。

后端完整测试、Shared 测试、类型检查、Lint 与 Wrangler dry-run build 已通过。

## 16. 相关文件

| 内容 | 路径 |
|---|---|
| Demo 路由 | `BACKEND/japan-disaster-relief-api/src/routes/demo-shelters.ts` |
| 查询服务 | `BACKEND/japan-disaster-relief-api/src/services/demo-shelter-service.ts` |
| Demo 数据 | `BACKEND/japan-disaster-relief-api/src/config/demo-shelters.ts` |
| Shared Contract | `SHARED/src/demo-shelter.ts` |
| 路由测试 | `BACKEND/japan-disaster-relief-api/src/routes/demo-shelters.test.ts` |
| Service 测试 | `BACKEND/japan-disaster-relief-api/src/services/demo-shelter-service.test.ts` |
| 完整 API 文档 | `DOCS/API.md` |
| 通用前端联调指南 | `DOCS/FRONTEND_INTEGRATION.md` |
