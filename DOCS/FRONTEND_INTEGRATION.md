# Frontend Integration Guide

面向前端联调的实践指南：按 PRD 主流程说明每一步调哪个接口、传什么、如何处理响应与降级。接口 Contract（字段、类型名、错误表）以 [API.md](API.md) 为准；多语言字段与枚举键的显示约定以 [I18N.md](I18N.md) 为准。本文不重复定义字段形状，所有请求/响应类型都从 `@nikuman-yummy/shared` `import type` 引用，不得在前端重新声明。

## 0. 客户端约定（沿用现有实现，不新造）

- Base URL：`NEXT_PUBLIC_API_BASE_URL` 环境变量，缺省 `http://localhost:8787`（`src/lib/api/config.ts`）。各环境取值见 [API.md](API.md)「Base URL」。
- 超时与错误：统一走 `src/lib/api/client.ts` 的约定——默认超时 `DEFAULT_REQUEST_TIMEOUT_MS = 8000`，错误用 `ApiClientError`（`HTTP_ERROR` / `NETWORK_ERROR` / `REQUEST_TIMEOUT` / `REQUEST_ABORTED` / `INVALID_RESPONSE`）。后续新增 POST helper 沿用同一约定，不引入第二套错误分类。
- 数据获取层用 TanStack Query；相同 queryKey 的在途请求会被去重（见 §4）。
- 服务端错误体是统一 `ApiErrorResponse`（`error.code` / `message` / `requestId`）；排查问题时记录 `requestId` 与响应 `X-Request-ID` Header。

## 1. PRD 主流程 → API 调用映射（PRD §3.2）

| 步骤（PRD §3.2） | API 调用 | 输入来源 | 响应处理 |
|---|---|---|---|
| 打开 PWA → 推荐界面语言 → 用户确认或切换 | 无 | 浏览器语言偏好（不调用 AI） | 纯前端；语言随时可切换且保留流程状态（PRD §4.1） |
| 选择灾害模式 | 可调 `GET /api/alerts` | 无 | **建议性**使用：有 alert 时突出推荐灾害模式，**不得**据此自动强制切换（PRD FR-03）。alert 存在 ≠ 已要求避难 ≠ 设施已开放 |
| 确认是否已脱离直接危险 | **不调用任何接口** | 用户回答 | 「否」或「不确定」→ 只显示固定提示与求助入口，**不进入后续问答，也不调用 `/api/rules/evaluate`**（PRD FR-04、§9 唯一阻断分支） |
| 获取本次位置或手动选区 | `POST /api/location/municipality` | 浏览器授权后的本次坐标 | `matched: true` → 使用 `municipalityId`，`locationStatus = "available"`；`matched: false` → 转手动选区，不阻断（PRD §9） |
| └ 分支：拒绝授权 / 定位超时 / 定位失败 | `GET /api/municipalities` | 无 | 展示完整区市町村列表供手动选择；选定后 `locationStatus = "manual"`。定位中必须显示状态，超时后不得无限等待（PRD FR-05） |
| 选择当前环境 | 无 | 用户选择 | 映射为 `indoor` / `outdoor` / `transit` |
| 回答三个风险问题 | 无 | 用户逐题回答 | 每题 `yes` / `no` / `uncertain`，顺序即 `answers[0..2]`（文案与顺序仍是 TBD-01，接口形状已固定） |
| 固定规则计算用户状态 | `POST /api/rules/evaluate` | 以上各步收集的 `mode`（固定 `"disaster"`）、`directDangerCleared`、`environment`、`answers`、`needsHelp`、`locationStatus` | 得到 `userState` + `cardId` + `nextActions`。卡片文案由前端语言包按 `cardId` 解析；规则表是 draft（`p0-draft.1`），不得把 `cardId`/`sourceIds` 当已核验官方依据展示（PRD FR-10） |
| 显示行动卡 → 用户选「已完成/做不到/不确定/需要帮助」→ 下一张卡 | 无（按 `nextActions` 前端流转） | 用户选择 | 「做不到」→ 替代动作或沟通卡（PRD §9）；「需要帮助」时后续重算带 `needsHelp: true` |
| 必要时显示设施候选 | `POST /api/facilities/search` | `municipalityId` + 本次坐标（手动选区无坐标则省略 lat/lng）+ 可选 `facilityTypes` / `accessibilityNeeds` | 渲染 `facilities` 并遵守 §2/§3 的降级与留守优先规则；无坐标时 `distanceMeters` 为 `null`，不要显示距离 |
| 展示多语言沟通卡 | 无 | 固定语言包 | 纯前端（PRD FR-13） |
| 展示数据来源、更新时间和限制 | 无新调用 | 复用此前响应的 `sources[]`、`dataStatus`、`alerts` 的 `sources[]` | 渲染来源、更新时间、实时性与 attribution（§5），并说明产品不能替代警察、消防、医疗机构和现场工作人员（PRD FR-14） |

**返回重算规则（PRD §4.1、TC-14）：**用户返回上一步并修改任何答案（环境、风险问题、位置）后，必须用新输入**重新调用** `POST /api/rules/evaluate`，不得复用旧结果；`municipalityId` 或坐标变化后 likewise 重新调用 `/api/facilities/search`。规则接口是纯函数，相同输入必得相同结果，重复调用是安全的。

## 2. 降级处理表（PRD §9 异常矩阵 + §6.2 诚实规则）

所有枚举键的显示文案取自 `@nikuman-yummy/shared` 的 `ENUM_LABELS`（见 [I18N.md](I18N.md) §2）；当前是工程草案（`I18N_LABELS_VERSION = "i18n-draft.1"`）。**不得自创安全文案。**

| 场景 | UI 必须显示 | 禁止 |
|---|---|---|
| `dataStatus: "confirmed"` | 来源、更新时间、数据状态标签 | 声称设施当前一定开放 |
| `dataStatus: "not_realtime"` | `ENUM_LABELS.dataStatus.not_realtime`（无法确认当前开放状态）+ 来源/更新时间 | 显示为「已开放」（PRD §6.2、TC-10） |
| `dataStatus: "unknown"` | 不推荐设施；显示官方入口与限制说明（TC-09） | 虚构候选、把 `unknown` 显示为「已开放」 |
| `dataStatus: "unavailable"` | 「当前服务受限」（HTTP 仍为 200，靠 `dataStatus` 判断），保留重试入口 | 转成空白页或继续使用可能过期的旧数据（PRD FR-15） |
| `alerts.sources[].status: "unavailable"` | 该来源标记为不可用，另一来源照常显示 | 因一个来源失败丢弃整个响应；把「无 alert」当成「无灾害」 |
| `stayPutStatus: "in_zone"` | 见 §3 留守优先规则 | 把设施列表呈现为「建议前往」 |
| `stayPutStatus: "outside_zone"` | 正常设施候选流程 + FR-12 诚实用语 | 「最安全路线」「一定开放」等无法验证的表达 |
| `stayPutStatus: "undetermined"` | 显示无法判定；有 `stayPutZones` 时展示町丁目列表供用户自行核对 | 自行从町名推断、暗示在/不在区内 |
| `POST /api/rules/evaluate` 400 | 前端 Contract 错误（请求构造 bug），开发期修复，不向用户展示技术细节 | 把 `error.message` 直接当用户文案 |
| 网络中断 / 超时 / 5xx | 极简网络异常页（UI-11）：不显示空白页、不继续展示可能过期的实时结论、显示「当前服务受限」、保留语言切换、显示经核验的基础求助信息、提醒确认现场广播/工作人员/官方信息、提供重试入口（PRD FR-15、§9） | 空白页、误导性结果 |

## 3. 留守优先规则（stay-put priority）

当 `stayPutStatus === "in_zone"` 时：

1. UI 必须**首先**展示官方「地区内残留地区」指定信息：地区名（`stayPutZones[].name`）、町丁目列表（`chome`）、来源（`sourceUrl`/`sourceUpdatedAt`），位置在任何设施列表**之前**；
2. **不得**把按距离排序的设施候选呈现为「建议前往」的推荐——官方指引是留在地区内，不是移动到别处；
3. 设施候选仍可展示，但只能作为参考信息，并保留 FR-12 诚实用语（附近 ≠ 安全、数据中存在 ≠ 当前开放、距离短 ≠ 路线可通行）。

后端不在 `in_zone` 时删除设施数据（不在后端静默删数据），优先级表达完全是前端职责。

## 4. 超时与重试

- 定位超时建议 8 秒（PRD FR-05）；API 请求默认超时已在客户端固定为 8 秒（`DEFAULT_REQUEST_TIMEOUT_MS`）。超时后显示原因、提供重试与手动选区，不得无限等待。
- NFR-03：每个数据请求都必须有 loading / success / empty / failure 四种状态——`facilities: []` 且 `dataStatus` 正常是「空结果」，不是失败。
- 快速重复点击不得产生重复请求或错误状态（NFR-03、TC-13）：TanStack Query 对相同 queryKey 的在途请求自动去重；mutation/提交类按钮在 pending 期间必须禁用。

## 5. Attribution 义务

设施目录两个来源均为 CC BY 4.0，各自要求不同的署名串。来源与限制页（UI-10）必须逐项**原样**渲染 `sources[].attribution`：不得合并成一条通用来源说明、不得翻译、不得改写（[I18N.md](I18N.md) §5）。同时展示各来源的 `name` / `url` / `updatedAt`。

## 6. Demo 控制接口（比赛脚手架）

- 演示脚本在开场前 `POST /api/demo/alerts` 写入一条可控 alert（`fire` 类型只能由此进入系统），演示结束后 `DELETE /api/demo/alerts` 清空，保证可反复重跑。
- 省略 `title` 时服务端默认文案强制带 (デモ)/(demo)/(演示) 后缀；**自带 `title` 时后端不追加后缀**，演示脚本必须自行携带同样的后缀约定，保证演示 alert 永远不会被误认为真实官方警报。
- 这两个接口是 contest scaffold，**永远不接入面向用户的 UI**；无 D1 时返回 503 `UPSTREAM_UNAVAILABLE`。

## 7. i18n

多语言约定统一见 [I18N.md](I18N.md)：响应字段分两类——`LocalizedText`（区市町村名三语齐备；设施名、地区名、JMA 警报标题按诚实原则不机器翻译，缺什么就缺什么）与稳定枚举键（用 `ENUM_LABELS` 渲染）。显示回退顺序为「请求语言 → en → ja」，`ja` 保底；产品的默认回退语言是英文还是日语仍是 **TBD-03 待确认**，前端必须把默认回退语言实现为一个可切换常量，确认后只改一处。
