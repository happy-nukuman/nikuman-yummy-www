export const TRANSLATION_LANGUAGES = ["ja", "en", "zh-Hans"] as const;

export type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number];
export type TranslationSourceLanguage = TranslationLanguage | "auto";

export type TranslationRequest = {
	text: string;
	sourceLanguage?: TranslationSourceLanguage;
	targetLanguage: TranslationLanguage;
};

export type TranslationResponse = {
	translatedText: string;
	sourceLanguage: TranslationSourceLanguage;
	targetLanguage: TranslationLanguage;
	provider: "workers-ai" | "gemini";
	model: string;
};

const MAX_TRANSLATION_CHARACTERS = 2_000;

export function isTranslationRequest(value: unknown): value is TranslationRequest {
	if (!isRecord(value) || typeof value.text !== "string") {
		return false;
	}

	const sourceLanguage = value.sourceLanguage ?? "auto";
	return (
		value.text.trim().length > 0 &&
		[...value.text].length <= MAX_TRANSLATION_CHARACTERS &&
		(sourceLanguage === "auto" || isTranslationLanguage(sourceLanguage)) &&
		isTranslationLanguage(value.targetLanguage)
	);
}

function isTranslationLanguage(value: unknown): value is TranslationLanguage {
	return TRANSLATION_LANGUAGES.some((language) => language === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
