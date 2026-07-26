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

### GET `/api/municipalities`

- 用途：定位拒绝或失败时，为手动选择区市町村返回完整参考列表。
- Request body：无。
- 成功：HTTP 200；`municipalities` 按 `municipalityId` 升序排列。

```json
{
  "municipalities": [
    {
      "municipalityId": "13101",
      "name": {
        "ja": "千代田区",
        "en": "Chiyoda City"
      }
    }
  ]
}
```

- 当前覆盖：东京 23 个特别区。
- Error：统一 `ApiErrorResponse`。

### POST `/api/location/municipality`

- 用途：根据本次浏览器坐标匹配东京区市町村。
- Request body：

```json
{
  "latitude": 35.6852,
  "longitude": 139.7528
}
```

`latitude`、`longitude` 都必须是有限 number。JSON 无法解析、字段缺失、类型错误或非有限值时返回 HTTP 400：

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request body must contain finite latitude and longitude numbers.",
    "requestId": "..."
  }
}
```

- 成功匹配：HTTP 200。

```json
{
  "municipalityId": "13101",
  "municipalityName": {
    "ja": "千代田区",
    "en": "Chiyoda City"
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

行政区代码参考总务省代码登记；当前边界是草案阶段的近似 bounding box，不是官方多边形。bbox 重叠时选择最近 centroid，再按 `municipalityId` 打破相同距离；结果仅用于候选匹配建议，用户始终可以手动改选。

与 PRD §10.1 的逻辑示例相比，`municipalityName` 使用 Shared Contract 的 `LocalizedText`，而不是 plain string。

### POST `/api/facilities/search`

- 用途：按区市町村、设施类型和无障碍需求返回最多 20 个设施候选。
- Request body：

```json
{
  "municipalityId": "13101",
  "latitude": 35.6852,
  "longitude": 139.7528,
  "facilityTypes": ["evacuation_area", "evacuation_shelter"],
  "accessibilityNeeds": ["wheelchair"]
}
```

`municipalityId` 是必填的非空 string。`latitude`、`longitude`、`facilityTypes`、`accessibilityNeeds` 均可省略；坐标存在时必须是有限 number，`facilityTypes` 只能包含 `evacuation_area` 或 `evacuation_shelter`，`accessibilityNeeds` 必须是 string array。JSON 无法解析或字段不符合以上约束时返回 HTTP 400 `BAD_REQUEST` 的统一 `ApiErrorResponse`。

`evacuation_area` 表示指定紧急避难场所（开放空间），`evacuation_shelter` 表示指定避难所（室内设施）。`facilityTypes` 省略或为空数组时不按类型过滤；`accessibilityNeeds` 使用 subset match。

设施目录由 Cloudflare D1（SQLite）的 `facilities` 表提供，数据来自经过归一化的东京都総務局与东京都都市整備局开放数据；`dataset_meta` 为每个来源各保存一行目录来源、更新时间、许可证、取得时间、是否实时和 attribution 等元数据。地区内残留地区由 `stay_put_zones` 表提供。Repository 按 `municipality_id` 分别查询设施和地区，并按 `dataset_meta.id` 读取全部设施来源；其他筛选、排序和坐标判定由 Service 完成。

- 成功：HTTP 200。

```json
{
  "dataStatus": "not_realtime",
  "sources": [
    {
      "name": "東京都総務局",
      "url": "https://example.invalid/general-affairs/catalogue",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "attribution": "東京都総務局 source attribution"
    },
    {
      "name": "東京都都市整備局",
      "url": "https://example.invalid/urban-development/catalogue",
      "updatedAt": "2026-01-02T00:00:00.000Z",
      "attribution": "東京都都市整備局 source attribution"
    }
  ],
  "stayPutStatus": "in_zone",
  "stayPutZones": [
    {
      "zoneId": "stay-put-13101-001",
      "name": {
        "ja": "丸の内地区"
      },
      "municipalityId": "13101",
      "chome": ["丸の内一丁目", "丸の内二丁目"],
      "areaHa": 120.5,
      "population": 8000,
      "sourceUrl": "https://example.invalid/stay-put-zones",
      "sourceUpdatedAt": "2022-09-01"
    }
  ],
  "facilities": [
    {
      "facilityId": "13101-a1b2c3d4",
      "name": {
        "ja": "施設名",
        "en": "Facility name"
      },
      "facilityType": "evacuation_shelter",
      "municipalityId": "13101",
      "address": "住所",
      "latitude": 35.68,
      "longitude": 139.75,
      "distanceMeters": 581,
      "accessibility": ["wheelchair"],
      "openStatus": "open",
      "statusUpdatedAt": "2026-01-01T01:00:00.000Z",
      "sourceUrl": "https://example.invalid/facility",
      "sourceUpdatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

`sources` 按 `dataset_meta.id` 排序。每个来源包含名称、目录 URL、更新时间，以及可选的 `attribution`。两个官方来源都采用 CC BY 4.0，但要求显示的 attribution 字符串不同；应用必须逐项显示各 publisher 返回的 `attribution`，不能合并成一个通用来源说明。

`stayPutZones` 是请求区市町村内的全部「地区内残留地区」，即依据東京都震災対策条例指定的官方地区。官方指引是地区内残留（留在地区内），不是前往所分配的广域避难场所；因此当 `stayPutStatus` 为 `in_zone` 时，前端必须把附近设施候选说明为不适用于该用户的建议。API 仍返回设施候选，不在后端静默删除数据。

| `stayPutStatus` | 语义 |
|---|---|
| `in_zone` | 请求提供有限坐标，且官方 polygon 判定坐标位于该区市町村的至少一个地区内残留地区内（边界也算命中） |
| `outside_zone` | 请求提供有限坐标、该区市町村至少有一个官方 polygon，且坐标不在任何 polygon 内 |
| `undetermined` | 未提供完整有限坐标、该区市町村所有地区均无可用 polygon、没有 D1 binding/地区行，或地区查询失败 |

`in_zone` 与 `outside_zone` 只从官方 polygon 数据得出，绝不从町丁目名称推断。polygon 缺失时，`stayPutZones[].chome` 是供用户自行核对的町丁目列表，状态保持 `undetermined`。`areaHa` 与 `population` 允许为 `null`。`polygon_json` 仅用于后端判定，不在响应中公开。面向用户的具体措辞、翻译与行动文案属于 language pack/前端 copy 的职责；后端只返回指定事实和判定状态。

`facilityId` 格式为 `<municipalityId>-<8 hex chars>`；后半段是内容 hash，例如 `13101-a1b2c3d4`。`accessibility`、`openStatus`、`statusUpdatedAt` 是可选字段。只有注入数据明确携带可靠状态时才返回 `openStatus`。有完整坐标时按 Haversine 距离升序并把米数四舍五入为整数；没有完整坐标时按 `name.ja` 排序，`distanceMeters` 为 `null`。合法但不在参考表中的 `municipalityId` 返回空候选，不返回 400。

数据状态遵循 PRD §6.2：

- `confirmed`：目录可读取、至少有一行 `dataset_meta`，且每个来源行的 `realtime = 1`；
- `not_realtime`：目录可读取、至少有一行 `dataset_meta`，但一个或多个来源行的 `realtime` 不等于 `1`；
- `unknown`：没有 D1 `DB` binding，或 `dataset_meta` 为零行；此时 `sources: []`、`facilities: []`；
- `unavailable`：设施或 metadata 的 Repository 查询读取失败；此时仍返回 HTTP 200，并带 `sources: []`、`stayPutStatus: "undetermined"`、`stayPutZones: []`、`facilities: []`，供前端显示“当前服务受限”。

D1 binding 缺失时（包括不注入 binding 的单元测试）保留静态空目录，返回 `unknown`。只要 metadata 存在且查询可读取，某次筛选没有匹配设施仍保留 `sources`，并按全部来源行计算 `confirmed` 或 `not_realtime`。设施或 metadata 查询失败时返回 `unavailable`，不会转成 HTTP 500；地区表查询单独降级为 `stayPutStatus: "undetermined"` 与 `stayPutZones: []`，设施候选和 `dataStatus` 不受影响。设施在数据中存在不表示当前开放、附近不表示安全、距离较短不表示路线可通行。

本地开发从 backend workspace 运行 `npm run db:migrate:local` 创建或升级本地 D1；两个归一化 seed 文件到位后运行 `npm run db:seed:local`，依次导入 facilities 和 stay-put zones。远端 D1 已创建并配置 binding，但远端 migration 和数据导入由 coordinator/deploy 流程执行；当前文档不表示远端数据已经导入。

与 PRD §10.2 的逻辑示例相比，`latitude` 和 `longitude` 可省略，以支持没有坐标的手动选择流程。

### POST `/api/rules/evaluate`

- 用途：PRD §10.3 固定规则计算。输入用户边界确认、当前环境和三个风险问题答案，输出用户状态与行动卡 ID。
- 实现位置：`routes/rules.ts` → `services/rule-evaluation-service.ts` → `config/rules.ts`。
- Request body：`application/json`，字段全部必填。

```json
{
  "mode": "disaster",
  "directDangerCleared": true,
  "environment": "indoor | outdoor | transit",
  "answers": ["yes | no | uncertain", "yes | no | uncertain", "yes | no | uncertain"],
  "needsHelp": false,
  "locationStatus": "available | manual | unavailable"
}
```

- `mode` 当前只接受 `"disaster"`；`answers` 必须正好三项（PRD FR-07）。
- 成功：HTTP 200，直接返回 PRD 形状，不加 envelope。

```json
{
  "ruleVersion": "p0-draft.1",
  "userState": "safe | uncertain | danger | need_help",
  "cardId": "string",
  "nextActions": ["string"],
  "sourceIds": ["string"]
}
```

- Error：body 不是合法 JSON、缺字段、类型错误、枚举值非法或 `answers` 长度不等于 3 时返回 HTTP 400 与统一 `ApiErrorResponse`，`error.code` 为 `BAD_REQUEST`。校验使用 Shared Contract 的 `isRuleEvaluationRequest`。
- 行为约束：
  - 纯函数、可判定：相同输入必然得到相同 `userState` 和 `cardId`（PRD FR-08/FR-10），不读时钟、不用随机数、不做 I/O。
  - **不调用生成式 AI**，任何 AI 接口都不参与 `userState` 与 `cardId` 的决定（PRD §7.2）。
  - `directDangerCleared: false` 直接返回 `danger` 与边界卡 `card-boundary-danger`，不进入复杂问答（PRD FR-04、TC-05）。
  - 任一 `answers` 为 `"uncertain"` 时进入保守分支，不输出确定安全结论（TC-07）。
  - `locationStatus` 本版不改变 `userState`，只在设施候选查询中使用。
  - `transit` 只给基础引导，不做复杂路线判断（PRD FR-06）。
- 分类：规则计算接口，规则表本身尚未定稿。

#### 规则表状态（重要）

当前规则表版本为 `p0-draft.1`，表内每条记录 `reviewStatus` 均为 `draft`，`sourceIds` 为占位 ID（例如 `src-tokyo-bousai-guide-draft`、`src-a-group-confirmation-pending`），不是已核验的官方依据。

原因是 PRD TBD-01：三个风险问题的最终文案、顺序和官方依据仍待 A 组三人确认。因此：

- 接口形状、状态机和判定逻辑可以据此联调；
- 卡片 ID、`nextActions` 与来源 ID 不得作为已确认的安全规则或官方依据对外展示（PRD FR-10）；
- A 组确认后需要提升 `RULE_VERSION`、替换来源 ID 并更新 `reviewStatus`。

### GET `/api/alerts`

- 用途：聚合当前灾害警报，供前端展示"存在官方/演示警报"这一事实。
- 实现位置：`routes/alerts.ts` → `services/alert-service.ts` → `repositories/demo-alert-repository.ts`。
- Request body：无。
- 成功：HTTP 200；`alerts` 按 `issuedAt` 倒序（相同时间按 `id` 排序），`sources` 固定包含两个来源条目。

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
      "sourceUpdatedAt": "2026-06-27T20:26:00.000Z"
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

两个来源相互独立降级（PRD §9：接口失败不阻断）：

- `demo-mock`（`realtime: false`）：读取 D1 的 `demo_alerts` 表。D1 binding 缺失或查询失败时该来源 `status: "unavailable"`、不贡献 alert，JMA 部分照常返回。
- `気象庁 (JMA)`（`realtime: true`）：服务端 best-effort 抓取气象庁公开地震列表 JSON。超时（5 秒 `AbortSignal`）、网络失败、非 2xx 或 payload 结构异常时该来源 `status: "unavailable"`、不贡献 alert，**演示 alert 一定照常返回**；HTTP 状态码始终是 200。

`sources[].status` 只有 `"ok"` 和 `"unavailable"`；`updatedAt` 是该来源自身的数据新鲜度（demo 来源取最新 alert 的 `issuedAt`，JMA 取 feed 内最新发表时间 `rdt`），无法确认时为 `null`。

JMA 侧的实现约定：

- 数据源是气象庁网站的公开数据 feed（`https://www.jma.go.jp/bosai/quake/data/list.json`），**不是有 SLA 保证的官方 API**，随时可能变更或不可用，因此只作 best-effort，不作为可用性承诺；
- 筛选阈值：最近 24 小时内、最大震度 3 以上。两个阈值都是**演示阶段的产品选择**，不是气象庁的发布标准（feed 会列出全部观测地震，其中大部分是震度 1）；
- feed 会用同一 `eid` 重复发布多条报文（震度速報 → 震源・震度情報 → 震源要素更新），实现按 `eid` 去重，优先取同时含震源名与规模的报文，再取较新的 `ctt`，因此一次地震只产生一条 alert；
- `title.ja` 由震源名 + 规模 + 最大震度拼装（例：`岩手県沖 M6.1 最大震度5-`），`title.en` 只在 feed 提供 `en_anm` 时给出；**不生成 `zhHans`**，不在服务端翻译安全相关官方措辞（PRD §7.2）；
- `issuedAt` 来自 feed 的地震发生时间 `at`，统一归一化为 UTC ISO-8601；`sourceUpdatedAt` 来自报文发表时间 `rdt`；
- 结构化可选字段（仅 JMA earthquake alert 出现，feed 提供时才填充；demo-mock alert 不带这些字段）：前端经过审核的语言包据此自行拼装本地化文案，震源名仍以 ja/en 原样保留、**后端不翻译震源专名与安全相关措辞**：
  - `epicenter?: LocalizedText` — 震源名。`epicenter.ja` 来自 feed `anm`（非空时给出）；`epicenter.en` 仅在 feed 提供 `en_anm`（非空）时给出；`anm` 为空时整字段缺省（后端不臆造震源）；
  - `magnitude?: number` — 地震规模数值。仅当 feed `mag` 可解析为有限数值时给出（`mag: ""` 等不可解析时缺省）；
  - `jmaMaxIntensity?: string` — JMA 震度等级代码（`"3"`、`"5-"`、`"6+"` 等，`-`/`+` 表示弱/强），**是震度刻度字符串而非数值**，取自该事件入选报文的最大震度。

前端约束（PRD FR-03）：本接口只是**建议性**信息。有 alert 时可以突出推荐灾害模式，**不得**据此自动强制切换进入灾害模式；用户始终可以手动选择或切换。alert 存在不表示某地已被要求避难，也不表示任何设施已开放。

- Error：统一 `ApiErrorResponse`（本接口正常路径不返回 4xx/5xx；来源不可用通过 `sources[].status` 表达）。

### POST `/api/demo/alerts`

- 用途：**比赛演示控制接口**，用于在演示中触发一条可控的灾害警报。火災（`fire`）在东京没有公开实时数据源（東京消防庁未提供公开实时 API），只能通过本接口进入系统。
- 实现位置：`routes/demo-alerts.ts` → `services/demo-alert-service.ts` → `repositories/demo-alert-repository.ts`。
- Request body：

```json
{
  "type": "earthquake | tsunami | flood | landslide | volcanic | fire",
  "title": {
    "ja": "訓練用の揺れ",
    "en": "Drill shake",
    "zhHans": "演习摇晃"
  }
}
```

`type` 必填，必须是 Shared Contract 的 `DisasterType`；`title` 可省略，存在时 `ja` 必填、`en`/`zhHans` 可选。校验使用 Shared Contract 的 `isDemoAlertCreateRequest`。JSON 无法解析或字段不符合约束时返回 HTTP 400 `BAD_REQUEST` 的统一 `ApiErrorResponse`。

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

省略 `title` 时使用固定的三语默认文案，每种灾害类型一条，**全部强制带 (デモ)/(demo)/(演示) 后缀**，保证演示 alert 永远不会被误认为真实官方警报（`config/alerts.ts`）。调用方自带 `title` 时按原样存储，不追加后缀，因此自定义文案的可信度由调用方负责。

- Error：D1 binding 缺失或写入失败时返回 HTTP 503，`error.code` 为 `UPSTREAM_UNAVAILABLE`；无 D1 时不可能返回 200。
- 分类：Demo 控制接口，不是正式避难业务接口。

### DELETE `/api/demo/alerts`

- 用途：清空全部演示 alert，让演示可以反复重跑。
- Request body：无。
- 成功：HTTP 200。

```json
{
  "cleared": 2
}
```

`cleared` 是本次删除的行数（空表时为 0）。

- Error：D1 binding 缺失或删除失败时返回 HTTP 503 `UPSTREAM_UNAVAILABLE`。
- 分类：Demo 控制接口，不是正式避难业务接口。

演示 alert 存放在 D1 的 `demo_alerts` 表（migration `0002_demo_alerts.sql`），与 `facilities` 数据完全隔离；本地开发从 backend workspace 运行 `npm run db:migrate:local` 即可在既有 `0001` 之上创建该表。

## CORS

`/api/*` 保留明确 allowlist，支持本地前端和当前 Cloudflare Demo 前端。不得无理由改为 `*`。allowlist 方法为 `GET`、`POST`、`DELETE`、`OPTIONS`；`DELETE` 只为上面的 Demo 控制接口存在。

## Planned API

灾害警报接口已按"演示可控 + 官方 best-effort"形态实现（`/api/alerts` 与 Demo 控制接口），但仍不包含火災实时数据源、东京都/区级官方警报推送和警报历史；数据版本接口尚未实现。设施查询 Contract 已实现，但真实开放数据、许可证和更新流程仍待确认并接入。
