# Gemini 翻译 API：部署设置与前端接入指南

## 1. 实现概要

后端通过 Cloudflare Worker 调用 Gemini Interactions API，使用模型 `gemini-2.5-flash`。

- API Key 保存在 Cloudflare Worker Secret `GEMINI_API_KEY` 中。
- API Key 不保存在 Git、前端、D1 或普通环境变量中。
- 前端只能调用本项目的翻译 API，无法读取 Secret。
- 发往 Gemini 的请求设置了 `store: false`。
- 单次最多翻译 2,000 个 Unicode 字符。
- 支持日语、英语、简体中文，也支持自动识别源语言。

> 翻译结果由生成式 AI 产生。固定的避难指示、生命安全提示和行政机关原文不应只依赖 AI 翻译，正式发布前应使用已审核的多语言文案。

## 2. 接口

### `POST /api/translations`

请求头：

```http
Content-Type: application/json
```

请求体：

```json
{
  "text": "避難所はどこですか？",
  "sourceLanguage": "ja",
  "targetLanguage": "zh-Hans"
}
```

字段说明：

| 字段 | 必填 | 可选值 | 说明 |
|---|---:|---|---|
| `text` | 是 | 1～2,000 字符 | 要翻译的文本 |
| `sourceLanguage` | 否 | `auto`、`ja`、`en`、`zh-Hans` | 省略时等同于 `auto` |
| `targetLanguage` | 是 | `ja`、`en`、`zh-Hans` | 目标语言 |

成功响应（HTTP 200）：

```json
{
  "translatedText": "避难所在哪里？",
  "sourceLanguage": "ja",
  "targetLanguage": "zh-Hans",
  "provider": "gemini",
  "model": "gemini-2.5-flash"
}
```

请求错误（HTTP 400）：

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request body must contain ...",
    "requestId": "..."
  }
}
```

未设置 Secret、Gemini 超时、认证失败或上游异常时返回 HTTP 503，错误码为 `UPSTREAM_UNAVAILABLE`。响应不会包含 API Key 或 Gemini 返回的敏感错误细节。

### 前端调用示例

```ts
type TranslationLanguage = "ja" | "en" | "zh-Hans";

export async function translateText(
  text: string,
  targetLanguage: TranslationLanguage,
  sourceLanguage: TranslationLanguage | "auto" = "auto",
) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/translations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  return (await response.json()) as {
    translatedText: string;
    sourceLanguage: TranslationLanguage | "auto";
    targetLanguage: TranslationLanguage;
    provider: "gemini";
    model: string;
  };
}
```

## 3. 获取 Gemini API Key

1. 登录 [Google AI Studio](https://aistudio.google.com/)。
2. 打开 API Keys 页面，创建 Gemini API Key。
3. 不要把 Key 复制到前端代码、GitHub、聊天记录或普通 Cloudflare 变量中。

## 4. 本地设置

进入后端目录：

```powershell
cd "C:\Users\Administrator\Documents\东京都知事杯\nikuman-yummy-www\BACKEND\japan-disaster-relief-api"
Copy-Item .dev.vars.example .dev.vars
```

编辑 `.dev.vars`：

```dotenv
GEMINI_API_KEY=你的实际Gemini_API_Key
```

`.dev.vars` 已被 `.gitignore` 排除，不能提交。启动本地 Worker：

```powershell
npm run dev
```

测试：

```powershell
$body = @{
  text = "避難所はどこですか？"
  sourceLanguage = "ja"
  targetLanguage = "zh-Hans"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8787/api/translations" `
  -ContentType "application/json" `
  -Body $body
```

## 5. Cloudflare 生产环境设置

### 方法 A：Wrangler（推荐）

在后端目录执行：

```powershell
npx wrangler secret put GEMINI_API_KEY
```

出现输入提示后粘贴 Gemini API Key。该命令不会把值写进代码或 `wrangler.jsonc`。之后部署：

```powershell
npm run deploy
```

更换 Gemini Key 时再次执行同一条 `secret put` 命令即可。

### 方法 B：Cloudflare 控制台

1. 打开 **Workers & Pages**。
2. 选择截图中的 Worker：`api-japan-disaster-relief`。
3. 打开 **Settings / 设置** → **Variables and Secrets / 变量和机密**。
4. 选择 **Add / 添加**。
5. 名称填写 `GEMINI_API_KEY`。
6. 类型必须选择 **Secret / 机密**，不要选择普通文本变量。
7. 值粘贴 Gemini API Key，保存并部署。

D1 的 `DB` 绑定可以继续保留，但此翻译功能不使用 D1 存储密钥，也不需要新增 migration。

## 6. 上线检查

部署后把 URL 换成实际 Worker 域名：

```powershell
$body = @{
  text = "地震が発生しました。"
  sourceLanguage = "ja"
  targetLanguage = "zh-Hans"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://你的Worker域名/api/translations" `
  -ContentType "application/json" `
  -Body $body
```

检查以下事项：

- 成功响应中没有 API Key。
- Cloudflare 日志中没有请求正文或 Key。
- 前端代码和浏览器网络请求中没有 Gemini Key。
- 正式域名已加入后端 CORS 允许列表。
- 在 Cloudflare 为 `/api/translations` 配置 Rate Limiting，避免公开接口被滥用并产生费用。

## 7. 常见问题

### 返回 503，提示 API Key 未配置

确认 Secret 名称严格为 `GEMINI_API_KEY`，并确认设置的是当前 Worker 和当前环境。设置 Secret 后重新部署或确认新版本已生效。

### 本地可以、生产环境不可以

`.dev.vars` 只用于本地。生产环境必须通过 `wrangler secret put` 或 Cloudflare 控制台单独设置。

### Gemini Key 更换后要修改代码吗？

不需要。更新 `GEMINI_API_KEY` Secret 即可。

### 为什么不直接从前端调用 Gemini？

浏览器无法安全保存服务端 API Key。任何放在前端 bundle、公开环境变量或网络请求中的 Key 都能被用户读取。
