import { describe, expect, it } from "vitest";
import {
	isDataStatus,
	isFacilitySearchRequest,
	isFacilityType,
} from "./facility";

describe("isFacilityType", () => {
	it("accepts a supported facility type", () => {
		expect(isFacilityType("evacuation_shelter")).toBe(true);
	});

	it("rejects an unsupported facility type", () => {
		expect(isFacilityType("temporary_shelter")).toBe(false);
	});
});

describe("isDataStatus", () => {
	it("accepts a supported data status", () => {
		expect(isDataStatus("not_realtime")).toBe(true);
	});

	it("rejects an unsupported data status", () => {
		expect(isDataStatus("realtime")).toBe(false);
	});
});

describe("isFacilitySearchRequest", () => {
	it("accepts a municipality-only request", () => {
		expect(
			isFacilitySearchRequest({
				municipalityId: "13101",
			}),
		).toBe(true);
	});

	it("accepts optional filters and finite coordinates", () => {
		expect(
			isFacilitySearchRequest({
				municipalityId: "13101",
				latitude: 35.6812,
				longitude: 139.7671,
				facilityTypes: ["evacuation_area"],
				accessibilityNeeds: ["wheelchair"],
			}),
		).toBe(true);
	});

	it("rejects a blank municipality identifier", () => {
		expect(
			isFacilitySearchRequest({
				municipalityId: " ",
			}),
		).toBe(false);
	});

	it("rejects non-finite optional coordinates", () => {
		expect(
			isFacilitySearchRequest({
				municipalityId: "13101",
				longitude: Number.POSITIVE_INFINITY,
			}),
		).toBe(false);
	});

	it("rejects unsupported facility types", () => {
		expect(
			isFacilitySearchRequest({
				municipalityId: "13101",
				facilityTypes: ["temporary_shelter"],
			}),
		).toBe(false);
	});

	it("rejects non-string accessibility needs", () => {
		expect(
			isFacilitySearchRequest({
				municipalityId: "13101",
				accessibilityNeeds: ["wheelchair", 1],
			}),
		).toBe(false);
	});
});
