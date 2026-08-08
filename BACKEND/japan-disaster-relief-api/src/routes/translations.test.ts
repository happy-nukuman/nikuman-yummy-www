import type {
	ApiErrorResponse,
	TranslationResponse,
} from "@nikuman-yummy/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import { WORKERS_AI_TRANSLATION_MODEL } from "../services/workers-ai-translation-client";

const VALID_REQUEST = {
	text: "避難所はどこですか？",
	sourceLanguage: "ja",
	targetLanguage: "zh-Hans",
} as const;

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("POST /api/translations (Workers AI primary)", () => {
	it("translates via the Workers AI binding without touching Gemini", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const runMock = vi.fn().mockResolvedValue({ translated_text: "避难所在哪里？" });

		const response = await translateRequest(VALID_REQUEST, {
			AI: { run: runMock },
			GEMINI_API_KEY: "secret-gemini-key",
		});
		const body = await response.json<TranslationResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			translatedText: "避难所在哪里？",
			sourceLanguage: "ja",
			targetLanguage: "zh-Hans",
			provider: "workers-ai",
			model: WORKERS_AI_TRANSLATION_MODEL,
		});
		expect(runMock).toHaveBeenCalledWith(WORKERS_AI_TRANSLATION_MODEL, {
			text: VALID_REQUEST.text,
			source_lang: "ja",
			target_lang: "zh",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("maps zh-Hans to the m2m100 code zh and omits source_lang for auto", async () => {
		const runMock = vi.fn().mockResolvedValue({ translated_text: "こんにちは" });

		await translateRequest(
			{ text: "你好", sourceLanguage: "zh-Hans", targetLanguage: "ja" },
			{ AI: { run: runMock } },
		);
		expect(runMock).toHaveBeenLastCalledWith(WORKERS_AI_TRANSLATION_MODEL, {
			text: "你好",
			source_lang: "zh",
			target_lang: "ja",
		});

		await translateRequest({ text: "你好", targetLanguage: "ja" }, { AI: { run: runMock } });
		expect(runMock).toHaveBeenLastCalledWith(WORKERS_AI_TRANSLATION_MODEL, {
			text: "你好",
			target_lang: "ja",
		});
	});

	it("falls back to Gemini when the Workers AI call fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({
					status: "completed",
					steps: [
						{
							type: "model_output",
							content: [{ type: "text", text: '{"translatedText":"避难所在哪里？"}' }],
						},
					],
				}),
			),
		);
		const runMock = vi.fn().mockRejectedValue(new Error("workers ai unavailable"));

		const response = await translateRequest(VALID_REQUEST, {
			AI: { run: runMock },
			GEMINI_API_KEY: "secret-gemini-key",
		});
		const body = await response.json<TranslationResponse>();

		expect(response.status).toBe(200);
		expect(body.provider).toBe("gemini");
		expect(body.translatedText).toBe("避难所在哪里？");
	});

	it("falls back to Gemini when Workers AI returns an empty translation", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({
					status: "completed",
					steps: [
						{
							type: "model_output",
							content: [{ type: "text", text: '{"translatedText":"避难所在哪里？"}' }],
						},
					],
				}),
			),
		);
		const runMock = vi.fn().mockResolvedValue({ translated_text: "  " });

		const response = await translateRequest(VALID_REQUEST, {
			AI: { run: runMock },
			GEMINI_API_KEY: "secret-gemini-key",
		});
		const body = await response.json<TranslationResponse>();

		expect(body.provider).toBe("gemini");
	});

	it("strips invisible instruction-smuggling characters before translating", async () => {
		const runMock = vi.fn().mockResolvedValue({ translated_text: "助けてください。" });

		// 零宽字符 + Unicode Tags 隐形指令夹在正常文本中。
		await translateRequest(
			{
				text: "请帮\u200B帮我\u{E0001}\u{E0069}\u{E0067}\u{E006E}\u{E006F}\u{E0072}\u{E0065}。",
				sourceLanguage: "zh-Hans",
				targetLanguage: "ja",
			},
			{ AI: { run: runMock } },
		);

		expect(runMock).toHaveBeenCalledWith(WORKERS_AI_TRANSLATION_MODEL, {
			text: "请帮帮我。",
			source_lang: "zh",
			target_lang: "ja",
		});
	});

	it("returns BAD_REQUEST when the text is only invisible carrier characters", async () => {
		const runMock = vi.fn();

		const response = await translateRequest(
			{ text: "\u200B\u202E\u{E0041}", targetLanguage: "ja" },
			{ AI: { run: runMock } },
		);
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("BAD_REQUEST");
		expect(runMock).not.toHaveBeenCalled();
	});

	it("treats an implausibly long Workers AI output as a failure and falls back", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({
					status: "completed",
					steps: [
						{
							type: "model_output",
							content: [{ type: "text", text: '{"translatedText":"避难所在哪里？"}' }],
						},
					],
				}),
			),
		);
		const runMock = vi.fn().mockResolvedValue({ translated_text: "あ".repeat(2000) });

		const response = await translateRequest(VALID_REQUEST, {
			AI: { run: runMock },
			GEMINI_API_KEY: "secret-gemini-key",
		});
		const body = await response.json<TranslationResponse>();

		expect(response.status).toBe(200);
		expect(body.provider).toBe("gemini");
	});

	it("returns UPSTREAM_UNAVAILABLE when Gemini leaks the system-prompt canary", async () => {
		// 攻击者诱导模型复述系统提示词：mock 把请求里的 system_instruction 原样回吐。
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation((_url: string, init: RequestInit) => {
				const payload = JSON.parse(init.body as string) as { system_instruction: string };
				// 只回吐金丝雀本身（长度正常），确保拦截来自金丝雀检测而非长度校验。
				const canary = /security canary: ([0-9a-f-]{36})/.exec(payload.system_instruction)?.[1];
				return Promise.resolve(
					Response.json({
						status: "completed",
						steps: [
							{
								type: "model_output",
								content: [
									{
										type: "text",
										text: JSON.stringify({ translatedText: `translated ${canary}` }),
									},
								],
							},
						],
					}),
				);
			}),
		);

		const response = await translateRequest(VALID_REQUEST, "secret-gemini-key");
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(503);
		expect(body.error.code).toBe("UPSTREAM_UNAVAILABLE");
	});

	it("returns UPSTREAM_UNAVAILABLE when Workers AI fails and no Gemini key is set", async () => {
		const runMock = vi.fn().mockRejectedValue(new Error("workers ai unavailable"));

		const response = await translateRequest(VALID_REQUEST, { AI: { run: runMock } });
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(503);
		expect(body.error.code).toBe("UPSTREAM_UNAVAILABLE");
	});
});

describe("POST /api/translations (Gemini fallback path)", () => {
	it("returns a Gemini translation without exposing the API key", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			Response.json({
				status: "completed",
				steps: [
					{
						type: "model_output",
						content: [
							{ type: "text", text: '```json\n"避难所在哪里？"\n```' },
						],
					},
				],
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const response = await translateRequest(VALID_REQUEST, "secret-gemini-key");
		const body = await response.json<TranslationResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			translatedText: "避难所在哪里？",
			sourceLanguage: "ja",
			targetLanguage: "zh-Hans",
			provider: "gemini",
			model: "gemini-2.5-flash",
		});
		expect(JSON.stringify(body)).not.toContain("secret-gemini-key");

		const init = (fetchMock.mock.calls[0] as [string, RequestInit])[1];
		expect(new Headers(init.headers).get("x-goog-api-key")).toBe("secret-gemini-key");
		expect(JSON.parse(init.body as string)).toMatchObject({
			model: "gemini-2.5-flash",
			store: false,
			response_format: {
				type: "text",
				mime_type: "application/json",
			},
		});
	});

	it("uses automatic source-language detection when omitted", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({
					status: "completed",
					steps: [
						{
							type: "model_output",
							content: [
								{ type: "text", text: '{"translatedText":"Evacuation shelter"}' },
							],
						},
					],
				}),
			),
		);

		const response = await translateRequest(
			{ text: "避難所", targetLanguage: "en" },
			"secret-gemini-key",
		);
		const body = await response.json<TranslationResponse>();

		expect(body.sourceLanguage).toBe("auto");
	});

	it.each([
		["an empty string", { text: "", targetLanguage: "en" }],
		["an unsupported language", { text: "hello", targetLanguage: "fr" }],
		["a missing text field", { targetLanguage: "ja" }],
		["a non-JSON body", "not json"],
	])("returns BAD_REQUEST for %s", async (_label, requestBody) => {
		const response = await translateRequest(requestBody, "secret-gemini-key");
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("BAD_REQUEST");
	});

	it("returns UPSTREAM_UNAVAILABLE when the Worker secret is missing", async () => {
		const response = await translateRequest(VALID_REQUEST);
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(503);
		expect(body.error.code).toBe("UPSTREAM_UNAVAILABLE");
		expect(body.error.message).toContain("has not been configured");
	});

	it("returns UPSTREAM_UNAVAILABLE without leaking Gemini error details", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({ error: { message: "API key invalid: secret" } }, { status: 401 }),
			),
		);

		const response = await translateRequest(VALID_REQUEST, "invalid-key");
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(503);
		expect(body.error.message).toBe("The translation service is not available.");
		expect(JSON.stringify(body)).not.toContain("API key invalid");
	});
});

interface TranslationTestEnv {
	AI?: { run: (model: string, inputs: unknown) => Promise<unknown> };
	GEMINI_API_KEY?: string;
}

async function translateRequest(
	body: unknown,
	env: TranslationTestEnv | string = {},
): Promise<Response> {
	// 兼容旧签名：直接传字符串时视为 GEMINI_API_KEY（无 AI binding 的 Gemini 直连路径）。
	const bindings = typeof env === "string" ? { GEMINI_API_KEY: env } : env;
	return await createApp().request(
		"/api/translations",
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: typeof body === "string" ? body : JSON.stringify(body),
		},
		bindings,
	);
}
