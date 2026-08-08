import { describe, expect, it } from "vitest";
import { isPlausibleTranslationLength, sanitizeTranslationText } from "./translation-guard";

describe("sanitizeTranslationText", () => {
	it("keeps ordinary multilingual text and line breaks unchanged", () => {
		const text = "避難所はどこですか？\nPlease help me.\n请帮帮我。";
		expect(sanitizeTranslationText(text)).toBe(text);
	});

	it("strips Unicode Tags characters used for invisible instruction smuggling", () => {
		// U+E0001 + tag letters：夹在可见字符之间的“隐形指令”。
		const smuggled = "请帮帮我\u{E0001}\u{E0069}\u{E0067}\u{E006E}\u{E006F}\u{E0072}\u{E0065}。";
		expect(sanitizeTranslationText(smuggled)).toBe("请帮帮我。");
	});

	it("strips zero-width and bidi control characters", () => {
		expect(sanitizeTranslationText("he\u200Bllo \u202Eworld\u202C\uFEFF")).toBe("hello world");
	});

	it("strips C0/C1 control characters but keeps tab and newline", () => {
		expect(sanitizeTranslationText("a\u0007b\u0000c\td\ne")).toBe("abc\td\ne");
	});

	it("returns an empty string when the input is only carrier characters", () => {
		expect(sanitizeTranslationText("\u200B\u202E\u{E0041}\u{E0042}")).toBe("");
	});
});

describe("isPlausibleTranslationLength", () => {
	it("accepts normal expansion between languages", () => {
		expect(isPlausibleTranslationLength("水", "水をください。")).toBe(true);
		expect(
			isPlausibleTranslationLength(
				"我找不到我的家人",
				"家族が見つかりません。一緒に探していただけませんか？",
			),
		).toBe(true);
	});

	it("rejects output far longer than the input", () => {
		expect(isPlausibleTranslationLength("你好", "あ".repeat(500))).toBe(false);
	});
});
