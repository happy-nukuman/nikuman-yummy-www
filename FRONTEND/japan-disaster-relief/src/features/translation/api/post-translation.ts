import type { TranslationRequest, TranslationResponse } from "@nikuman-yummy/shared";
import { apiPost } from "@/lib/api/client";

// 后端调用 Gemini 的超时是 15 秒，这里放宽到 20 秒避免先于后端超时。
const TRANSLATION_TIMEOUT_MS = 20_000;

export function postTranslation(
	request: TranslationRequest,
	signal?: AbortSignal,
): Promise<TranslationResponse> {
	return apiPost<TranslationRequest, TranslationResponse>("/api/translations", request, {
		signal,
		timeoutMs: TRANSLATION_TIMEOUT_MS,
	});
}
