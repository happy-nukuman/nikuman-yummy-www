import { describe, expect, it } from "vitest";
import { isShelter } from "./shelter";

const validShelter = {
	id: "sample-shelter",
	name: {
		ja: "サンプル避難所",
		en: "Sample shelter",
	},
	address: "Sample address",
	latitude: 35.6812,
	longitude: 139.7671,
	supportedDisasters: ["earthquake"],
	facilities: ["water"],
	source: "test fixture",
};

describe("isShelter", () => {
	it("accepts a normalized shelter contract", () => {
		expect(isShelter(validShelter)).toBe(true);
	});

	it("rejects unsupported disaster types", () => {
		expect(
			isShelter({
				...validShelter,
				supportedDisasters: ["unknown"],
			}),
		).toBe(false);
	});

	it("rejects non-finite coordinates", () => {
		expect(
			isShelter({
				...validShelter,
				latitude: Number.NaN,
			}),
		).toBe(false);
	});
});
