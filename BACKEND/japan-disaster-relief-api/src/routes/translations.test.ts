import type {
	ApiErrorResponse,
	TranslationResponse,
} from "@nikuman-yummy/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const VALID_REQUEST = {
	text: "避難所はどこですか？",
	sourceLanguage: "ja",
	targetLanguage: "zh-Hans",
} as const;

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("POST /api/translations", () => {
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

async function translateRequest(body: unknown, apiKey?: string): Promise<Response> {
	return await createApp().request(
		"/api/translations",
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: typeof body === "string" ? body : JSON.stringify(body),
		},
		apiKey === undefined ? {} : { GEMINI_API_KEY: apiKey },
	);
}
