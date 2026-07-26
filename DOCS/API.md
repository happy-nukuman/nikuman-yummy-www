# API

本文只记录**已经实现**的接口；计划接口与实现接口严格分开（见文末「Planned API」）。请求/响应形状的单一事实来源是 Shared Contract package `@nikuman-yummy/shared`（`SHARED/src/*.ts`），本文每个接口都标注对应的 Contract 类型名。前端应通过 `import type { ... } from "@nikuman-yummy/shared"` 引用这些类型，**不得在前端重新声明这些形状**。

前端如何按流程调用这些接口，见 [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)；多语言字段与枚举键的显示约定见 [I18N.md](I18N.md)。

## 通用约定

### Base URL

Base URL 由环境决定（以部署环境为准）：

- 本地开发：`wrangler dev` 默认 `http://localhost:8787`。前端通过 `NEXT_PUBLIC_API_BASE_URL` 配置，缺省时回退到该值（`FRONTEND/japan-disaster-relief/src/lib/api/config.ts`）。
- 已部署 Worker：backend Worker 的 `wrangler.jsonc` `name` 为 `api-japan-disaster-relief`，CORS allowlist 中的前端 Worker 域名使用 `tokyo-odh-108` 子域，据此推断 backend 的 workers.dev 地址为 `https://api-japan-disaster-relief.tokyo-odh-108.workers.dev`。该地址由部署账号决定，**以部署环境为准**，本文不作保证。

### 请求与响应格式

- 所有请求体和响应体都是 `application/json`；POST 请求必须带 `Content-Type: application/json`。
- 成功响应**没有 envelope**：响应体直接是对应 Contract 类型的形状（例如 `FacilitySearchResponse`）。`ApiResponse<T>`/`ApiResponseMeta` 在 Contract 中为后续 fallback 元数据预留，当前接口不使用。
- 错误响应统一为 `ApiErrorResponse`（见下）。

### X-Request-ID

每个响应（包括错误响应）都带 `X-Request-ID` Header。客户端可以在请求中发送 `X-Request-ID`：若值匹配 `^[A-Za-z0-9._-]{1,128}$` 则服务端原样沿用，否则服务端生成随机 UUID。错误响应中的 `error.requestId` 与响应 Header 一致，用于把用户反馈关联到服务端日志。

### 统一错误 Contract

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found.",
    "requestId": "..."
  }
}
```

`error.code` 的完整枚举（`ApiErrorCode`）：

| `error.code` | 典型 HTTP status | 含义 |
|---|---:|---|
| `BAD_REQUEST` | 400 | 请求体无法解析或不符合 Contract 校验 |
| `NOT_FOUND` | 404 | 未知路由（全局 notFound handler） |
| `INTERNAL_ERROR` | 500 | 未捕获的服务端异常；不向客户端返回异常堆栈 |
| `UPSTREAM_UNAVAILABLE` | 503 | 上游依赖不可用（当前只有 Demo 控制接口使用） |

`requestId` 不是固定值。业务降级（设施数据不可用、警报来源失败）**不走错误 Contract**，而是通过成功响应内的状态字段表达，见各接口的「降级语义」。

### CORS

CORS 只应用于 `/api/*`（`/health` 不带 CORS 中间件，供运维探活使用）。Origin 是明确 allowlist，不得无理由改为 `*`：

- `http://localhost:3000`（本地前端）
- `https://front-japan-disaster-relief.tokyo-odh-108.workers.dev`（当前 Cloudflare Demo 前端）

允许方法：`GET`、`POST`、`DELETE`、`OPTIONS`。`DELETE` 只为 Demo 控制接口存在。

## Implemented API

### GET `/health`

- 用途：Worker 存活检查（运维探活，无 PRD 业务对应）。
- 分类：运维。
- Contract：无请求体 → `HealthResponse`。
- 成功：HTTP 200。

```json
{
  "status": "ok"
}
```

| 条件 | HTTP status | error.code |
|---|---:|---|
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

### GET `/api/hello`

- 用途：验证 Frontend → API Client → Backend 连通性（脚手架，无 PRD 业务对应）。
- 分类：demo scaffold，不是正式避难业务接口。
- Contract：无请求体 → `HelloResponse`。
- 成功：HTTP 200。

```json
{
  "message": "hello world!"
}
```

| 条件 | HTTP status | error.code |
|---|---:|---|
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

### GET `/api/municipalities`

- 用途：定位被拒绝、超时或匹配失败时，为手动选择区市町村返回完整参考列表（PRD §9 异常矩阵：用户拒绝定位/定位失败 → 手动选择；FR-05）。
- 分类：正式业务。
- Contract：无请求体 → `MunicipalityListResponse`（元素为 `Municipality`）。
- 成功：HTTP 200；`municipalities` 按 `municipalityId` 升序排列。`name` 是 `LocalizedText`，当前三语齐备。

```json
{
  "municipalities": [
    {
      "municipalityId": "13101",
      "name": {
        "ja": "千代田区",
        "en": "Chiyoda City",
        "zhHans": "千代田区"
      }
    },
    {
      "municipalityId": "13102",
      "name": {
        "ja": "中央区",
        "en": "Chuo City",
        "zhHans": "中央区"
      }
    }
  ]
}
```

- 当前覆盖：东京 23 个特别区。

| 条件 | HTTP status | error.code |
|---|---:|---|
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

### POST `/api/location/municipality`

- 用途：根据本次浏览器坐标匹配东京区市町村（PRD §10.1、FR-05）。位置仅在用户授权后由前端取得，仅用于本次匹配。
- 分类：正式业务。
- Contract：`MunicipalityMatchRequest` → `MunicipalityMatchResponse`。
- Request body：

```json
{
  "latitude": 35.6852,
  "longitude": 139.7528
}
```

- 成功匹配：HTTP 200。

```json
{
  "municipalityId": "13101",
  "municipalityName": {
    "ja": "千代田区",
    "en": "Chiyoda City",
    "zhHans": "千代田区"
  },
  "matched": true
}
```

- 覆盖范围外或没有 bbox 命中仍返回 HTTP 200，前端可无阻塞地回退到手动选择：

```json
{
  "municipalityId": null,
  "municipalityName": null,
  "matched": false
}
```

| 条件 | HTTP status | error.code |
|---|---:|---|
| body 不是合法 JSON、缺字段、类型错误、坐标非有限 number | 400 | `BAD_REQUEST` |
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

行政区代码参考总务省代码登记；当前边界是草案阶段的近似 bounding box，不是官方多边形。bbox 重叠时选择最近 centroid，再按 `municipalityId` 打破相同距离；结果仅用于候选匹配建议，用户始终可以手动改选。

与 PRD §10.1 的逻辑示例相比，`municipalityName` 使用 Shared Contract 的 `LocalizedText`，而不是 plain string。

### POST `/api/facilities/search`

- 用途：按区市町村、设施类型和无障碍需求返回最多 20 个设施候选，同时返回目录来源与「地区内残留地区」指定信息（PRD §10.2、FR-11、FR-12）。
- 分类：正式业务。
- Contract：`FacilitySearchRequest` → `FacilitySearchResponse`。
- Request body：

```json
{
  "municipalityId": "13101",
  "latitude": 35.6997,
  "longitude": 139.7637,
  "facilityTypes": ["evacuation_area", "evacuation_shelter"],
  "accessibilityNeeds": ["wheelchair_accessible_toilet"]
}
```

`municipalityId` 是必填的非空 string。`latitude`、`longitude`、`facilityTypes`、`accessibilityNeeds` 均可省略；坐标存在时必须是有限 number，`facilityTypes` 只能包含 `evacuation_area` 或 `evacuation_shelter`，`accessibilityNeeds` 必须是 string array。合法但不在参考表中的 `municipalityId` 返回空候选，不返回 400。

`evacuation_area` 表示指定紧急避难场所（开放空间），`evacuation_shelter` 表示指定避难所（室内设施）。`facilityTypes` 省略或为空数组时不按类型过滤；`accessibilityNeeds` 使用 subset match（设施须包含全部所求项）。`accessibility` 的数据 slug 见 `ENUM_LABELS.accessibility`（`elevator_or_ground_floor_space` / `slope` / `braille_blocks` / `wheelchair_accessible_toilet`），`other:<日文自由文本>` 形式的值原样透传（见 [I18N.md](I18N.md) §2）。

- 成功：HTTP 200。

```json
{
  "dataStatus": "not_realtime",
  "sources": [
    {
      "name": "東京都総務局総合防災部「東京都防災マップ 避難所・避難場所一覧データ」",
      "url": "https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d0000000093",
      "updatedAt": "2023-06-05",
      "attribution": "「避難所、避難場所データ オープンデータ」（東京都提供）"
    },
    {
      "name": "東京都都市整備局「震災時火災における避難場所等の指定（第9回）」",
      "url": "https://catalog.data.metro.tokyo.lg.jp/dataset/t000008d0000000013",
      "updatedAt": "2022-09-01",
      "attribution": "「震災時火災における避難場所等の指定（第9回）」（東京都都市整備局提供）"
    }
  ],
  "stayPutStatus": "in_zone",
  "stayPutZones": [
    {
      "zoneId": "zone-13101-0eedad0e",
      "name": {
        "ja": "千代田区、秋葉原、上野地区"
      },
      "municipalityId": "13101",
      "chome": ["飯田橋一丁目", "飯田橋二丁目", "一番町"],
      "areaHa": null,
      "population": null,
      "sourceUrl": "https://catalog.data.metro.tokyo.lg.jp/dataset/t000008d0000000013",
      "sourceUpdatedAt": "2022-09-01"
    }
  ],
  "facilities": [
    {
      "facilityId": "13101-e0ad44da",
      "name": {
        "ja": "お茶の水小学校"
      },
      "facilityType": "evacuation_shelter",
      "municipalityId": "13101",
      "address": "千代田区神田猿楽町1-1-1",
      "latitude": 35.69735834,
      "longitude": 139.7603058,
      "distanceMeters": 412,
      "accessibility": ["wheelchair_accessible_toilet", "elevator_or_ground_floor_space"],
      "sourceUrl": "https://www.opendata.metro.tokyo.lg.jp/soumu/130001_evacuation_center.csv",
      "sourceUpdatedAt": "2022-06-20"
    }
  ]
}
```

设施目录由 Cloudflare D1（SQLite）的 `facilities` 表提供，数据来自经过归一化的东京都総務局与东京都都市整備局开放数据；`dataset_meta` 为每个来源各保存一行目录来源、更新时间、许可证、取得时间、是否实时和 attribution 等元数据。地区内残留地区由 `stay_put_zones` 表提供。Repository 按 `municipality_id` 分别查询设施和地区，并按 `dataset_meta.id` 读取全部设施来源；其他筛选、排序和坐标判定由 Service 完成。

`sources` 按 `dataset_meta.id` 排序。每个来源包含名称、目录 URL、更新时间，以及可选的 `attribution`。两个官方来源都采用 CC BY 4.0，但要求显示的 attribution 字符串不同；应用必须逐项原样显示各 publisher 返回的 `attribution`，不能合并成一个通用来源说明，也不得翻译（见 [I18N.md](I18N.md) §5）。

`stayPutZones` 是请求区市町村内的全部「地区内残留地区」，即依据東京都震災対策条例指定的官方地区。官方指引是地区内残留（留在地区内），不是前往所分配的广域避难场所；因此当 `stayPutStatus` 为 `in_zone` 时，前端必须优先展示官方留守指定（地区名、町丁目列表、来源），**不得**把按距离排序的设施候选呈现为"建议前往"。API 仍返回设施候选供参考，不在后端静默删除数据。

| `stayPutStatus` | 语义 |
|---|---|
| `in_zone` | 请求提供有限坐标，且官方 polygon 判定坐标位于该区市町村的至少一个地区内残留地区内（边界也算命中） |
| `outside_zone` | 请求提供有限坐标、该区市町村至少有一个可用官方 polygon，且坐标不在任何 polygon 内 |
| `undetermined` | 未提供完整有限坐标、该区市町村所有地区均无可用 polygon、没有 D1 binding/地区行，或地区查询失败 |

`in_zone` 与 `outside_zone` 只从官方 polygon 数据得出，绝不从町丁目名称推断。polygon 缺失时，`stayPutZones[].chome` 是供用户自行核对的町丁目列表，状态保持 `undetermined`。`areaHa` 与 `population` 允许为 `null`（当前数据中即多为 `null`）。`polygon_json` 仅用于后端判定，不在响应中公开。面向用户的具体措辞、翻译与行动文案属于 language pack/前端 copy 的职责；后端只返回指定事实和判定状态。

`facilityId` 格式为 `<municipalityId>-<8 hex chars>`；后半段是内容 hash，例如 `13101-e0ad44da`。`accessibility`、`openStatus`、`statusUpdatedAt` 是可选字段：只有注入数据明确携带可靠状态时才返回 `openStatus`/`statusUpdatedAt`（当前 D1 数据不含开放状态，因此正常响应中这两个字段不出现）。有完整坐标时按 Haversine 距离升序并把米数四舍五入为整数（距离相同按 `name.ja` 再按 `facilityId`）；没有完整坐标时按 `name.ja` 排序，`distanceMeters` 为 `null`。设施名只有 `ja`（官方数据原文，不做机器翻译，见 [I18N.md](I18N.md) §1）。

#### 降级语义（`dataStatus`，PRD §6.2）

- `confirmed`：目录可读取、至少有一行 `dataset_meta`，且每个来源行的 `realtime = 1`；
- `not_realtime`：目录可读取、至少有一行 `dataset_meta`，但一个或多个来源行的 `realtime` 不等于 `1`（当前两个来源均非实时，正常响应即为此状态）；
- `unknown`：没有 D1 `DB` binding，或 `dataset_meta` 为零行；此时 `sources: []`、`facilities: []`，但 `stayPutZones`/`stayPutStatus` 仍按地区表实际查询结果返回；
- `unavailable`：设施或 metadata 的 Repository 查询读取失败；此时仍返回 HTTP 200，并带 `sources: []`、`stayPutStatus: "undetermined"`、`stayPutZones: []`、`facilities: []`，供前端显示“当前服务受限”。

D1 binding 缺失时（包括不注入 binding 的单元测试）保留静态空目录，返回 `unknown`。只要 metadata 存在且查询可读取，某次筛选没有匹配设施仍保留 `sources`，并按全部来源行计算 `confirmed` 或 `not_realtime`。设施或 metadata 查询失败时返回 `unavailable`，不会转成 HTTP 500；地区表查询单独降级为 `stayPutStatus: "undetermined"` 与 `stayPutZones: []`，设施候选和 `dataStatus` 不受影响。

**诚实原则（FR-12，必须遵守，不得弱化）：**设施在数据中存在不表示当前开放、附近不表示安全、距离较短不表示路线可通行；禁止把 `not_realtime` 或 `unknown` 显示为"已开放"（PRD §6.2）。

| 条件 | HTTP status | error.code |
|---|---:|---|
| body 不是合法 JSON、缺 `municipalityId`、坐标非有限、`facilityTypes` 含非法枚举、`accessibilityNeeds` 非 string array | 400 | `BAD_REQUEST` |
| 数据不可用/查询失败 | **200**（不走错误 Contract，见 `dataStatus` 降级语义） | — |
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

本地开发从 backend workspace 运行 `npm run db:migrate:local` 创建或升级本地 D1；两个归一化 seed 文件（`DATA/normalized/facilities.seed.sql`、`DATA/normalized/stay-put-zones.seed.sql`）到位后运行 `npm run db:seed:local`，依次导入 facilities 和 stay-put zones。远端 D1 已创建并配置 binding，但远端 migration 和数据导入由 coordinator/deploy 流程执行；当前文档不表示远端数据已经导入。

与 PRD §10.2 的逻辑示例相比：`latitude` 和 `longitude` 可省略，以支持没有坐标的手动选择流程；PRD 示例中的单个 `source` 对象在实现中扩展为 `sources` 数组（含 `attribution`），并新增 `stayPutStatus`/`stayPutZones` 字段。

### POST `/api/rules/evaluate`

- 用途：PRD §10.3 固定规则计算。输入用户边界确认、当前环境和三个风险问题答案，输出用户状态与行动卡 ID（FR-07、FR-08、FR-10）。
- 分类：正式业务（规则表本身仍为 draft，见下）。
- Contract：`RuleEvaluationRequest` → `RuleEvaluationResponse`。
- 实现位置：`routes/rules.ts` → `services/rule-evaluation-service.ts` → `config/rules.ts`。
- Request body：字段全部必填；`answers` 必须正好三项（PRD FR-07）。

```json
{
  "mode": "disaster",
  "directDangerCleared": true,
  "environment": "outdoor",
  "answers": ["no", "no", "no"],
  "needsHelp": false,
  "locationStatus": "available"
}
```

- `mode` 当前只接受 `"disaster"`；`environment` ∈ `indoor | outdoor | transit`；`answers` 元素 ∈ `yes | no | uncertain`；`locationStatus` ∈ `available | manual | unavailable`。
- 成功：HTTP 200。

```json
{
  "ruleVersion": "p0-draft.1",
  "userState": "safe",
  "cardId": "card-safe-outdoor",
  "nextActions": ["card-facility-candidates", "card-communication-help", "card-official-sources"],
  "sourceIds": ["src-tokyo-bousai-guide-draft", "src-a-group-confirmation-pending"]
}
```

| 条件 | HTTP status | error.code |
|---|---:|---|
| body 不是合法 JSON、缺字段、类型错误、枚举值非法或 `answers` 长度不等于 3 | 400 | `BAD_REQUEST` |
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

校验使用 Shared Contract 的 `isRuleEvaluationRequest`。

- 行为约束：
  - 纯函数、可判定：相同输入必然得到相同 `userState` 和 `cardId`（PRD FR-08/FR-10），不读时钟、不用随机数、不做 I/O。
  - **不调用生成式 AI**，任何 AI 接口都不参与 `userState` 与 `cardId` 的决定（PRD §7.2）。
  - `directDangerCleared: false` 直接返回 `danger` 与边界卡 `card-boundary-danger`，不进入复杂问答（PRD FR-04、TC-05）。
  - 任一 `answers` 为 `"uncertain"` 时进入保守分支，不输出确定安全结论（TC-07）。
  - `locationStatus` 本版不改变 `userState`，只在设施候选查询中使用。
  - `transit` 只给基础引导，不做复杂路线判断（PRD FR-06）。

#### 规则表状态（重要）

当前规则表版本为 `p0-draft.1`，表内每条记录 `reviewStatus` 均为 `draft`，`sourceIds` 为占位 ID（例如 `src-tokyo-bousai-guide-draft`、`src-a-group-confirmation-pending`），不是已核验的官方依据。

原因是 PRD TBD-01：三个风险问题的最终文案、顺序和官方依据仍待 A 组三人确认。因此：

- 接口形状、状态机和判定逻辑可以据此联调；
- 卡片 ID、`nextActions` 与来源 ID 不得作为已确认的安全规则或官方依据对外展示（PRD FR-10）；
- A 组确认后需要提升 `RULE_VERSION`、替换来源 ID 并更新 `reviewStatus`。

### GET `/api/alerts`

- 用途：聚合当前灾害警报，供前端展示"存在官方/演示警报"这一事实（PRD FR-03：仅作灾害模式的建议性推荐依据）。
- 分类：正式业务（其中 `demo-mock` 来源是比赛演示脚手架）。
- Contract：无请求体 → `AlertsResponse`（`alerts` 元素为 `DisasterAlert`，`sources` 元素为 `AlertSourceStatus`）。
- 实现位置：`routes/alerts.ts` → `services/alert-service.ts` → `repositories/demo-alert-repository.ts`。
- 成功：HTTP 200；`alerts` 按 `issuedAt` 倒序（相同时间按 `id` 排序），`sources` 固定包含两个来源条目（顺序：demo-mock、JMA）。

```json
{
  "alerts": [
    {
      "id": "demo-fire-fcd38d43",
      "type": "fire",
      "title": {
        "ja": "火災(デモ)",
        "en": "Fire (demo)",
        "zhHans": "火灾(演示)"
      },
      "issuedAt": "2026-07-26T11:55:55.848Z",
      "source": "demo-mock"
    },
    {
      "id": "jma-20260628052159",
      "type": "earthquake",
      "title": {
        "ja": "岩手県沖 M6.1 最大震度5-",
        "en": "Off the Coast of Iwate Prefecture M6.1 max JMA intensity 5-"
      },
      "issuedAt": "2026-06-27T20:21:00.000Z",
      "source": "気象庁 (JMA)",
      "sourceUpdatedAt": "2026-06-27T20:26:00.000Z",
      "epicenter": {
        "ja": "岩手県沖",
        "en": "Off the Coast of Iwate Prefecture"
      },
      "magnitude": 6.1,
      "jmaMaxIntensity": "5-"
    }
  ],
  "sources": [
    {
      "name": "demo-mock",
      "url": "/api/demo/alerts",
      "realtime": false,
      "status": "ok",
      "updatedAt": "2026-07-26T11:55:55.848Z"
    },
    {
      "name": "気象庁 (JMA)",
      "url": "https://www.jma.go.jp/bosai/quake/data/list.json",
      "realtime": true,
      "status": "ok",
      "updatedAt": "2026-07-26T05:02:00.000Z"
    }
  ]
}
```

#### 降级语义（per-source，PRD §9：接口失败不阻断）

两个来源相互独立降级，HTTP 状态码始终是 200：

- `demo-mock`（`realtime: false`）：读取 D1 的 `demo_alerts` 表。D1 binding 缺失或查询失败时该来源 `status: "unavailable"`、不贡献 alert，JMA 部分照常返回。
- `気象庁 (JMA)`（`realtime: true`）：服务端 best-effort 抓取气象庁公开地震列表 JSON。超时（5 秒 `AbortSignal`）、网络失败、非 2xx 或 payload 结构异常时该来源 `status: "unavailable"`、不贡献 alert，**演示 alert 一定照常返回**。

`sources[].status` 只有 `"ok"` 和 `"unavailable"`；`updatedAt` 是该来源自身的数据新鲜度（demo 来源取最新 alert 的 `issuedAt`，JMA 取 feed 内最新发表时间 `rdt`），无法确认时为 `null`。

JMA 侧的实现约定：

- 数据源是气象庁网站的公开数据 feed（`https://www.jma.go.jp/bosai/quake/data/list.json`），**不是有 SLA 保证的官方 API**，随时可能变更或不可用，因此只作 best-effort，不作为可用性承诺；
- 筛选阈值：最近 24 小时内、最大震度 3 以上。两个阈值都是**演示阶段的产品选择**，不是气象庁的发布标准（feed 会列出全部观测地震，其中大部分是震度 1）；
- feed 会用同一 `eid` 重复发布多条报文（震度速報 → 震源・震度情報 → 震源要素更新），实现按 `eid` 去重，优先取同时含震源名与规模的报文，再取较新的 `ctt`，因此一次地震只产生一条 alert，alert `id` 形如 `jma-<eid>`；
- `title.ja` 由震源名 + 规模 + 最大震度拼装（例：`岩手県沖 M6.1 最大震度5-`），`title.en` 只在 feed 提供 `en_anm` 时给出；**不生成 `zhHans`**，不在服务端翻译安全相关官方措辞（PRD §7.2）；
- `issuedAt` 来自 feed 的地震发生时间 `at`，统一归一化为 UTC ISO-8601；`sourceUpdatedAt` 来自报文发表时间 `rdt`；
- 结构化可选字段（仅 JMA earthquake alert 出现，feed 提供时才填充；demo-mock alert 不带这些字段）：前端经过审核的语言包据此自行拼装本地化文案，震源名仍以 ja/en 原样保留、**后端不翻译震源专名与安全相关措辞**：
  - `epicenter?: LocalizedText` — 震源名。`epicenter.ja` 来自 feed `anm`（非空时给出）；`epicenter.en` 仅在 feed 提供 `en_anm`（非空）时给出；`anm` 为空时整字段缺省（后端不臆造震源）；
  - `magnitude?: number` — 地震规模数值。仅当 feed `mag` 可解析为有限数值时给出（`mag: ""` 等不可解析时缺省）；
  - `jmaMaxIntensity?: string` — JMA 震度等级代码（`"3"`、`"5-"`、`"6+"` 等，`-`/`+` 表示弱/强），**是震度刻度字符串而非数值**，取自该事件入选报文的最大震度。

前端约束（PRD FR-03）：本接口只是**建议性**信息。有 alert 时可以突出推荐灾害模式，**不得**据此自动强制切换进入灾害模式；用户始终可以手动选择或切换。alert 存在不表示某地已被要求避难，也不表示任何设施已开放。

| 条件 | HTTP status | error.code |
|---|---:|---|
| 单个来源失败（JMA 抓取失败 / D1 缺失） | **200**（不走错误 Contract，见 `sources[].status`） | — |
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

### POST `/api/demo/alerts`

- 用途：**比赛演示控制接口**，用于在演示中触发一条可控的灾害警报。火災（`fire`）在东京没有公开实时数据源（東京消防庁未提供公开实时 API），只能通过本接口进入系统。
- 分类：demo scaffold，不是正式避难业务接口，**禁止接入任何面向用户的 UI**。
- Contract：`DemoAlertCreateRequest` → `DemoAlertCreateResponse`。
- 实现位置：`routes/demo-alerts.ts` → `services/demo-alert-service.ts` → `repositories/demo-alert-repository.ts`。
- Request body：

```json
{
  "type": "fire",
  "title": {
    "ja": "訓練用の火災",
    "en": "Drill fire",
    "zhHans": "演习火灾"
  }
}
```

`type` 必填，必须是 Shared Contract 的 `DisasterType`（`earthquake | tsunami | flood | landslide | volcanic | fire`）；`title` 可省略，存在时 `ja` 必填、`en`/`zhHans` 可选。校验使用 Shared Contract 的 `isDemoAlertCreateRequest`。

- 成功：HTTP 200，返回已写入的 alert。

```json
{
  "alert": {
    "id": "demo-fire-fcd38d43",
    "type": "fire",
    "title": {
      "ja": "火災(デモ)",
      "en": "Fire (demo)",
      "zhHans": "火灾(演示)"
    },
    "issuedAt": "2026-07-26T11:55:55.848Z",
    "source": "demo-mock"
  }
}
```

`id` 形如 `demo-<type>-<uuid 前 8 位>`；`issuedAt` 为服务端当前时间（UTC ISO-8601）；`source` 固定为 `demo-mock`，与 `/api/alerts` 的来源条目名称一致。

省略 `title` 时使用固定的三语默认文案，每种灾害类型一条，**全部强制带 (デモ)/(demo)/(演示) 后缀**，保证演示 alert 永远不会被误认为真实官方警报（`config/alerts.ts`）。调用方自带 `title` 时按原样存储，不追加后缀，因此自定义文案的可信度由调用方负责——演示脚本自带文案时也必须自行携带 (デモ)/(demo)/(演示) 后缀约定。

| 条件 | HTTP status | error.code |
|---|---:|---|
| body 不是合法 JSON、`type` 非法、`title` 不符合 `LocalizedText` 约束 | 400 | `BAD_REQUEST` |
| D1 binding 缺失或写入失败 | 503 | `UPSTREAM_UNAVAILABLE` |
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

无 D1 时不可能返回 200。

### DELETE `/api/demo/alerts`

- 用途：清空全部演示 alert，让演示可以反复重跑。
- 分类：demo scaffold，不是正式避难业务接口，**禁止接入任何面向用户的 UI**。
- Contract：无请求体 → `DemoAlertClearResponse`。
- 成功：HTTP 200。

```json
{
  "cleared": 2
}
```

`cleared` 是本次删除的行数（空表时为 0）。

| 条件 | HTTP status | error.code |
|---|---:|---|
| D1 binding 缺失或删除失败 | 503 | `UPSTREAM_UNAVAILABLE` |
| 未捕获的服务端异常 | 500 | `INTERNAL_ERROR` |

演示 alert 存放在 D1 的 `demo_alerts` 表（migration `0002_demo_alerts.sql`），与 `facilities` 数据完全隔离；本地开发从 backend workspace 运行 `npm run db:migrate:local` 即可在既有 `0001` 之上创建该表。

## Planned API

灾害警报接口已按"演示可控 + 官方 best-effort"形态实现（`/api/alerts` 与 Demo 控制接口），但仍不包含火災实时数据源、东京都/区级官方警报推送和警报历史；数据版本接口尚未实现。设施查询 Contract 已实现并接入真实归一化开放数据（东京都総務局・都市整備局，CC BY 4.0，本地 D1 已可 seed）；远端 D1 的数据导入与更新流程仍待 coordinator/deploy 流程执行。设施开放状态（`openStatus`）当前无可靠数据源，不返回。
