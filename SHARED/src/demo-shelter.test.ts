import { describe, expect, it } from "vitest";
import { isDemoShelterNearbyRequest } from "./demo-shelter";

describe("isDemoShelterNearbyRequest", () => {
	it("accepts Tokyo coordinates and an optional bounded limit", () => {
		expect(
			isDemoShelterNearbyRequest({
				latitude: 35.6896342,
				longitude: 139.6917418,
				limit: 5,
			}),
		).toBe(true);
	});

	it.each([
		undefined,
		{},
		{ latitude: 35.6896342 },
		{ latitude: 91, longitude: 139.6917418 },
		{ latitude: 35.6896342, longitude: 181 },
		{ latitude: 35.6896342, longitude: 139.6917418, limit: 0 },
		{ latitude: 35.6896342, longitude: 139.6917418, limit: 1.5 },
		{ latitude: 35.6896342, longitude: 139.6917418, limit: 11 },
	])("rejects invalid input %#", (value) => {
		expect(isDemoShelterNearbyRequest(value)).toBe(false);
	});
});
