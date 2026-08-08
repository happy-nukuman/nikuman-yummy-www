import { describe, expect, it } from "vitest";
import { isTranslationRequest } from "./translation";

describe("isTranslationRequest", () => {
	it("accepts supported languages and automatic detection", () => {
		expect(
			isTranslationRequest({ text: "こんにちは", targetLanguage: "zh-Hans" }),
		).toBe(true);
		expect(
			isTranslationRequest({ text: "hello", sourceLanguage: "en", targetLanguage: "ja" }),
		).toBe(true);
	});

	it("counts Unicode code points and rejects more than 2000 characters", () => {
		expect(isTranslationRequest({ text: "😀".repeat(2_000), targetLanguage: "ja" })).toBe(true);
		expect(isTranslationRequest({ text: "😀".repeat(2_001), targetLanguage: "ja" })).toBe(false);
	});
});
