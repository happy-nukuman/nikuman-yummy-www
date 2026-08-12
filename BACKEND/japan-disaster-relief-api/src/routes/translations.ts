import {
	isTranslationRequest,
	type TranslationResponse,
} from "@nikuman-yummy/shared";
import type { Context, Hono } from "hono";
import { createApiErrorResponse } from "../schemas/api-error";
import { GeminiTranslationClient } from "../services/gemini-translation-client";
import {
	isPlausibleTranslationLength,
	sanitizeTranslationText,
} from "../services/translation-guard";
import { WorkersAiTranslationClient } from "../services/workers-ai-translation-client";
import type { AppEnv } from "../types/app-env";

export function registerTranslationRoutes(app: Hono<AppEnv>): void {
	app.post("/api/translations", async (c) => {
		const body: unknown = await c.req.json().catch(() => null);
		if (!isTranslationRequest(body)) {
			return badRequest(c);
		}

		// 注入防御第一层：剥离隐形指令载体字符后再交给翻译模型。
		const request = { ...body, text: sanitizeTranslationText(body.text) };
		if (request.text.length === 0) {
			return badRequest(c);
		}

		// 主通道：Workers AI 的专用翻译模型（配额宽松，且 NMT 模型不受提示注入影响）。
		const ai = c.env?.AI;
		if (ai !== undefined) {
			try {
				return c.json(
					assertPlausibleTranslation(
						request.text,
						await new WorkersAiTranslationClient(ai).translate(request),
					),
				);
			} catch (error) {
				// 回退到 Gemini。错误进日志便于区分额度耗尽 / 接口变更等原因。
				console.error("Workers AI translation failed:", error);
			}
		}

		const apiKey = c.env?.GEMINI_API_KEY;
		if (apiKey === undefined || apiKey.length === 0) {
			return translationUnavailable(c, "The translation service has not been configured.");
		}

		try {
			return c.json(
				assertPlausibleTranslation(
					request.text,
					await new GeminiTranslationClient().translate(apiKey, request),
				),
			);
		} catch (error) {
			console.error("Gemini translation failed:", error);
			return translationUnavailable(c);
		}
	});
}

// 注入防御第二层：译文长度远超原文说明模型输出了翻译之外的内容，按上游失败处理。
function assertPlausibleTranslation(
	inputText: string,
	response: TranslationResponse,
): TranslationResponse {
	if (!isPlausibleTranslationLength(inputText, response.translatedText)) {
		throw new Error("Translation output is implausibly long for the given input.");
	}
	return response;
}

function badRequest(c: Context<AppEnv>): Response {
	return c.json(
		createApiErrorResponse(
			"BAD_REQUEST",
			"Request body must contain 1-2000 characters of text, an optional sourceLanguage, and a supported targetLanguage (ja, en, or zh-Hans).",
			c.get("requestId"),
		),
		400,
	);
}

function translationUnavailable(
	c: Context<AppEnv>,
	message = "The translation service is not available.",
): Response {
	return c.json(
		createApiErrorResponse("UPSTREAM_UNAVAILABLE", message, c.get("requestId")),
		503,
	);
}
