import { describe, expect, it } from "vitest";
import { isDemoAlertCreateRequest } from "./alerts";

describe("isDemoAlertCreateRequest", () => {
	it("accepts a type-only request", () => {
		expect(isDemoAlertCreateRequest({ type: "earthquake" })).toBe(true);
	});

	it("accepts the fire type that only the demo source can produce", () => {
		expect(isDemoAlertCreateRequest({ type: "fire" })).toBe(true);
	});

	it("accepts a request with a full trilingual title", () => {
		expect(
			isDemoAlertCreateRequest({
				type: "fire",
				title: {
					ja: "テスト火災(デモ)",
					en: "Test fire (demo)",
					zhHans: "测试火灾(演示)",
				},
			}),
		).toBe(true);
	});

	it("accepts a title that only carries the required Japanese text", () => {
		expect(
			isDemoAlertCreateRequest({ type: "tsunami", title: { ja: "テスト" } }),
		).toBe(true);
	});

	it("rejects an unsupported disaster type", () => {
		expect(isDemoAlertCreateRequest({ type: "meteor" })).toBe(false);
	});

	it("rejects a missing disaster type", () => {
		expect(isDemoAlertCreateRequest({})).toBe(false);
	});

	it("rejects a title without Japanese text", () => {
		expect(
			isDemoAlertCreateRequest({
				type: "earthquake",
				title: { en: "Earthquake (demo)" },
			}),
		).toBe(false);
	});

	it("rejects non-string optional title translations", () => {
		expect(
			isDemoAlertCreateRequest({
				type: "earthquake",
				title: { ja: "地震(デモ)", zhHans: 1 },
			}),
		).toBe(false);
	});

	it("rejects a non-object title", () => {
		expect(
			isDemoAlertCreateRequest({ type: "earthquake", title: "地震(デモ)" }),
		).toBe(false);
	});

	it.each([null, undefined, "earthquake", 1, [{ type: "earthquake" }]])(
		"rejects the non-object body %s",
		(body) => {
			expect(isDemoAlertCreateRequest(body)).toBe(false);
		},
	);
});
