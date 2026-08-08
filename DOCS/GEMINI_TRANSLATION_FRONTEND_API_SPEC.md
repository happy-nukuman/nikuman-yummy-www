# Gemini 翻译 API｜前端调用接口规范

版本：`v1`

状态：可供前端联调

模型：`gemini-2.5-flash`

## 1. 接口概要

| 项目 | 内容 |
|---|---|
| Method | `POST` |
| Path | `/api/translations` |
| Content-Type | `application/json` |
| 前端是否需要 Gemini API Key | 不需要，禁止传递 |
| 支持语言 | 日语、英语、简体中文 |
| 单次文本长度 | 1～2,000 个 Unicode 字符 |
| 流式响应 | 不支持 |
| 批量翻译 | 不支持，一次请求翻译一段文本 |

前端通过 `NEXT_PUBLIC_API_BASE_URL` 指定后端地址，不要在组件中写死 Worker 域名。

```dotenv
# 本地开发
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787

# 部署环境：以实际 Cloudflare Worker URL 为准
# NEXT_PUBLIC_API_BASE_URL=https://api-japan-disaster-relief.<account>.workers.dev
```

最终请求地址：

```text
${NEXT_PUBLIC_API_BASE_URL}/api/translations
```

## 2. 语言代码

| 代码 | 语言 | 可作为源语言 | 可作为目标语言 |
|---|---|---:|---:|
| `ja` | 日语 | 是 | 是 |
| `en` | 英语 | 是 | 是 |
| `zh-Hans` | 简体中文 | 是 | 是 |
| `auto` | 自动识别 | 是 | 否 |

前端已经明确知道原文语言时，应传入准确的 `sourceLanguage`。只有语言未知时才使用 `auto`。

## 3. 请求规范

### TypeScript 类型

```ts
export type TranslationLanguage = "ja" | "en" | "zh-Hans";
export type TranslationSourceLanguage = TranslationLanguage | "auto";

export type TranslationRequest = {
  text: string;
  sourceLanguage?: TranslationSourceLanguage;
  targetLanguage: TranslationLanguage;
};
```

### 字段

| 字段 | 类型 | 必填 | 规则 |
|---|---|---:|---|
| `text` | `string` | 是 | 去除首尾空白后不能为空；最多 2,000 个 Unicode 字符 |
| `sourceLanguage` | `string` | 否 | `auto`、`ja`、`en`、`zh-Hans`；省略等同于 `auto` |
| `targetLanguage` | `string` | 是 | `ja`、`en`、`zh-Hans` |

### 示例：日语翻译为简体中文

```http
POST /api/translations HTTP/1.1
Content-Type: application/json

{
  "text": "この建物は一時滞在施設ですが、避難所ではありません。",
  "sourceLanguage": "ja",
  "targetLanguage": "zh-Hans"
}
```

### 示例：自动识别源语言

```json
{
  "text": "The evacuation shelter is open.",
  "sourceLanguage": "auto",
  "targetLanguage": "ja"
}
```

也可以省略 `sourceLanguage`：

```json
{
  "text": "The evacuation shelter is open.",
  "targetLanguage": "ja"
}
```

## 4. 成功响应

HTTP Status：`200 OK`

```ts
export type TranslationResponse = {
  translatedText: string;
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: TranslationLanguage;
  provider: "gemini";
  model: string;
};
```

示例：

```json
{
  "translatedText": "这座建筑是临时滞留设施，但不是避难所。",
  "sourceLanguage": "ja",
  "targetLanguage": "zh-Hans",
  "provider": "gemini",
  "model": "gemini-2.5-flash"
}
```

注意：`sourceLanguage` 为 `auto` 时，响应仍返回 `auto`，目前不会返回 Gemini 推测出的具体语言。

## 5. 错误响应

所有错误使用统一结构：

```ts
export type ApiErrorResponse = {
  error: {
    code: "BAD_REQUEST" | "UPSTREAM_UNAVAILABLE" | "INTERNAL_ERROR";
    message: string;
    requestId: string;
  };
};
```

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request body must contain ...",
    "requestId": "b3f9d8e8-..."
  }
}
```

| HTTP Status | `error.code` | 场景 | 前端处理 |
|---:|---|---|---|
| `400` | `BAD_REQUEST` | 空文本、超过 2,000 字符、语言代码错误、JSON 格式错误 | 提示用户修改输入；不要自动重试 |
| `503` | `UPSTREAM_UNAVAILABLE` | Gemini Key 未配置、Gemini 限流/超时/异常、响应格式异常 | 显示“暂时无法翻译”；可延迟后重试一次 |
| `500` | `INTERNAL_ERROR` | 后端未预期错误 | 显示通用错误并记录 `requestId` |

排查问题时，请记录响应体中的 `requestId` 和响应头 `x-request-id`，但不要记录用户输入的敏感文本。

## 6. 推荐的前端封装

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export type TranslationLanguage = "ja" | "en" | "zh-Hans";
export type TranslationSourceLanguage = TranslationLanguage | "auto";

export type TranslationResult = {
  translatedText: string;
  sourceLanguage: TranslationSourceLanguage;
  targetLanguage: TranslationLanguage;
  provider: "gemini";
  model: string;
};

type ApiError = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

export class TranslationApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(`Translation failed: ${code}`);
  }
}

export async function translateText(params: {
  text: string;
  sourceLanguage?: TranslationSourceLanguage;
  targetLanguage: TranslationLanguage;
  signal?: AbortSignal;
}): Promise<TranslationResult> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/api/translations`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: params.text,
      sourceLanguage: params.sourceLanguage ?? "auto",
      targetLanguage: params.targetLanguage,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new TranslationApiError(
      response.status,
      body?.error.code ?? "UNKNOWN_ERROR",
      body?.error.requestId,
    );
  }

  return (await response.json()) as TranslationResult;
}
```

## 7. React / Next.js 调用示例

```tsx
"use client";

import { useRef, useState } from "react";
import { translateText, type TranslationLanguage } from "@/lib/api/translation";

export function TranslationButton({
  text,
  sourceLanguage,
  targetLanguage,
}: {
  text: string;
  sourceLanguage: TranslationLanguage;
  targetLanguage: TranslationLanguage;
}) {
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleTranslate() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await translateText({
        text,
        sourceLanguage,
        targetLanguage,
        signal: controller.signal,
      });
      setTranslatedText(result.translatedText);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("暂时无法翻译，请稍后重试。");
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }

  return (
    <section>
      <button type="button" disabled={loading || text.trim().length === 0} onClick={handleTranslate}>
        {loading ? "翻译中…" : "翻译"}
      </button>
      {translatedText && <p lang={targetLanguage}>{translatedText}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
```

## 8. 前端实现要求

1. 禁止把 `GEMINI_API_KEY`、Google API Key 或任何服务端 Secret 放入前端环境变量。
2. 前端只调用本后端 `/api/translations`，不能直接调用 Google Gemini API。
3. 提交前校验空文本和 2,000 字符上限，减少无效请求。
4. 用户连续点击或输入变化时取消旧请求，避免旧译文覆盖新译文。
5. 不要对同一段内容并发发起重复翻译，以免触发 Gemini 限流和额外费用。
6. `400` 不重试；`503` 最多延迟重试一次，避免重试风暴。
7. 翻译失败时保留原文，不要显示空白内容。
8. 固定避难指令、行政机关原文和生命安全提示优先使用人工审核的多语言文案；AI 翻译作为辅助或降级方案。
9. 使用正确的 HTML `lang` 属性：日语 `ja`、英语 `en`、简体中文 `zh-Hans`。

## 9. 联调命令

```powershell
$body = @{
  text = "地震時はエレベーターを使用しないでください。"
  sourceLanguage = "ja"
  targetLanguage = "zh-Hans"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8787/api/translations" `
  -ContentType "application/json; charset=utf-8" `
  -Body ([Text.Encoding]::UTF8.GetBytes($body))
```

## 10. CORS

当前后端允许以下前端来源：

- `http://localhost:3000`
- `https://front-japan-disaster-relief.tokyo-odh-108.workers.dev`

如果前端部署到新域名，后端必须先把该域名加入 CORS allowlist，否则浏览器会阻止调用。
