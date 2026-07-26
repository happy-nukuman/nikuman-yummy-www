import { describe, expect, it } from "vitest";
import { getLocalizedText, SUPPORTED_LOCALES } from "./config";

describe("locale configuration", () => {
	it("defines the initial supported locales", () => {
		expect(SUPPORTED_LOCALES).toEqual(["ja", "en", "zh-Hans"]);
	});

	it("falls back to Japanese when a translation is unavailable", () => {
		expect(getLocalizedText({ ja: "避難所" }, "en")).toBe("避難所");
		expect(getLocalizedText({ ja: "避難所" }, "zh-Hans")).toBe("避難所");
	});
});
