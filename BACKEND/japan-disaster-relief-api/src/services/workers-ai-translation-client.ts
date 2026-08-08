import type { TranslationRequest, TranslationResponse } from "@nikuman-yummy/shared";

export const WORKERS_AI_TRANSLATION_MODEL = "@cf/meta/m2m100-1.2b";

// m2m100 使用不带地区后缀的 ISO 639-1 语言代码。
const M2M100_LANGUAGE = { ja: "ja", en: "en", "zh-Hans": "zh" } as const;

// Ai binding 的最小结构类型：便于测试注入，也避免依赖 workers-types 的泛型签名。
export interface WorkersAiRunner {
	run(
		model: typeof WORKERS_AI_TRANSLATION_MODEL,
		inputs: { text: string; source_lang?: string; target_lang: string },
	): Promise<unknown>;
}

export class WorkersAiTranslationClient {
	constructor(private readonly ai: WorkersAiRunner) {}

	async translate(request: TranslationRequest): Promise<TranslationResponse> {
		const sourceLanguage = request.sourceLanguage ?? "auto";
		const output = await this.ai.run(WORKERS_AI_TRANSLATION_MODEL, {
			text: request.text,
			// m2m100 没有自动语言检测；"auto" 时省略 source_lang，交给模型默认值。
			...(sourceLanguage !== "auto" && { source_lang: M2M100_LANGUAGE[sourceLanguage] }),
			target_lang: M2M100_LANGUAGE[request.targetLanguage],
		});

		const translatedText = extractTranslatedText(output);
		if (translatedText.length === 0) {
			throw new Error("Workers AI returned an empty translation.");
		}

		return {
			translatedText,
			sourceLanguage,
			targetLanguage: request.targetLanguage,
			provider: "workers-ai",
			model: WORKERS_AI_TRANSLATION_MODEL,
		};
	}
}

function extractTranslatedText(output: unknown): string {
	if (
		typeof output !== "object" ||
		output === null ||
		!("translated_text" in output) ||
		typeof output.translated_text !== "string"
	) {
		throw new Error("Workers AI returned an invalid translation response.");
	}

	return output.translated_text.trim();
}
