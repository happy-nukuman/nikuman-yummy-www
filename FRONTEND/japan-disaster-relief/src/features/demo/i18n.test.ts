import { describe, expect, it } from "vitest";
import {
	dataSnapshotTimeText,
	detectDemoLang,
	formatDemoSnapshotDate,
	parseAcceptLanguage,
} from "./i18n";

describe("detectDemoLang", () => {
	it("matches supported languages regardless of region subtag", () => {
		expect(detectDemoLang(["zh-CN"])).toBe("zh");
		expect(detectDemoLang(["ja-JP"])).toBe("ja");
		expect(detectDemoLang(["en-US"])).toBe("en");
	});

	it("uses the first supported language in preference order", () => {
		expect(detectDemoLang(["ko-KR", "ja-JP", "en-US"])).toBe("ja");
	});

	it("falls back to English when no supported language is present", () => {
		expect(detectDemoLang(["ko-KR", "fr-FR"])).toBe("en");
		expect(detectDemoLang([])).toBe("en");
	});
});

describe("parseAcceptLanguage", () => {
	it("orders tags by q value, keeping header order on ties", () => {
		expect(parseAcceptLanguage("en;q=0.8,zh-CN,zh;q=0.9")).toEqual(["zh-CN", "zh", "en"]);
	});

	it("ignores wildcards and handles a missing header", () => {
		expect(parseAcceptLanguage("*;q=0.5,ja-JP")).toEqual(["ja-JP"]);
		expect(parseAcceptLanguage(null)).toEqual([]);
	});
});

describe("demo snapshot date copy", () => {
	it("formats ISO dates for all supported interface languages", () => {
		expect(formatDemoSnapshotDate("zh", "2026-08-08")).toBe("2026/08/08");
		expect(formatDemoSnapshotDate("en", "2026-08-08")).toBe("Aug 8, 2026");
		expect(formatDemoSnapshotDate("ja", "2026-08-08")).toBe("2026/08/08");
	});

	it("keeps the existing localized data snapshot sentence", () => {
		expect(dataSnapshotTimeText("zh", "2026-08-08")).toBe("数据时点：2026/08/08");
		expect(dataSnapshotTimeText("en", "2026-08-08")).toBe(
			"Data snapshot: Aug 8, 2026",
		);
		expect(dataSnapshotTimeText("ja", "2026-08-08")).toBe("データ時点：2026/08/08");
	});
});
