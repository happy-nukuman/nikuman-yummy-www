import {
	isTranslationRequest,
	type TranslationResponse,
} from "@nikuman-yummy/shared";
import type { Context, Hono } from "hono";
import { createApiErrorResponse } from "../schemas/api-error";
import { GeminiTranslationClient } from "../services/gemini-translation-client";
import type { AppEnv } from "../types/app-env";

export function registerTranslationRoutes(app: Hono<AppEnv>): void {
	app.post("/api/translations", async (c) => {
		const body: unknown = await c.req.json().catch(() => null);
		if (!isTranslationRequest(body)) {
			return c.json(
				createApiErrorResponse(
					"BAD_REQUEST",
					"Request body must contain 1-2000 characters of text, an optional sourceLanguage, and a supported targetLanguage (ja, en, or zh-Hans).",
					c.get("requestId"),
				),
				400,
			);
		}

		const apiKey = c.env?.GEMINI_API_KEY;
		if (apiKey === undefined || apiKey.length === 0) {
			return translationUnavailable(c, "The Gemini API key has not been configured.");
		}

		try {
			const response: TranslationResponse =
				await new GeminiTranslationClient().translate(apiKey, body);
			return c.json(response);
		} catch {
			return translationUnavailable(c);
		}
	});
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
