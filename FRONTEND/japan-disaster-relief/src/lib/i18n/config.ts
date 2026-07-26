import type { LocalizedText } from "@nikuman-yummy/shared";

export const SUPPORTED_LOCALES = ["ja", "en", "zh-Hans"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function getLocalizedText(text: LocalizedText, locale: Locale): string {
	switch (locale) {
		case "en":
			return text.en ?? text.ja;
		case "zh-Hans":
			return text.zhHans ?? text.ja;
		case "ja":
			return text.ja;
	}
}
