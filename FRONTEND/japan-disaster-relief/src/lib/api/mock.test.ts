import { describe, expect, it } from "vitest";
import type { DemoShelterNearbyResponse } from "@nikuman-yummy/shared";
import { getMockResponse } from "./mock";

const TOKYO_METRO_GOV = { latitude: 35.6896342, longitude: 139.6917418 };

function postShelters(body: unknown): Promise<DemoShelterNearbyResponse> {
	return getMockResponse<DemoShelterNearbyResponse>(
		"POST",
		"/api/demo/shelters/nearby",
		new AbortController().signal,
		body,
	);
}

describe("POST /api/demo/shelters/nearby mock", () => {
	it("returns nearby facilities sorted by ascending distance within 3 km", async () => {
		const response = await postShelters({ ...TOKYO_METRO_GOV, limit: 10 });

		expect(response.dataStatus).toBe("not_realtime");
		expect(response.origin).toEqual(TOKYO_METRO_GOV);
		expect(response.searchRadiusMeters).toBe(3000);
		expect(response.facilities.length).toBeGreaterThan(0);

		const distances = response.facilities.map((facility) => facility.distanceMeters);
		expect(distances).toEqual([...distances].sort((a, b) => a - b));
		for (const facility of response.facilities) {
			expect(facility.distanceMeters).toBeLessThanOrEqual(3000);
			expect(facility.googleMapsUrl).toContain("https://www.google.com/maps/search/?api=1");
		}
	});

	it("truncates results to the requested limit (default 5)", async () => {
		const defaulted = await postShelters(TOKYO_METRO_GOV);
		expect(defaulted.facilities.length).toBeLessThanOrEqual(5);

		const limited = await postShelters({ ...TOKYO_METRO_GOV, limit: 2 });
		expect(limited.facilities.length).toBeLessThanOrEqual(2);
	});

	it("returns an empty list far away from the demo snapshot", async () => {
		const response = await postShelters({ latitude: 34.6937, longitude: 135.5023 });
		expect(response.facilities).toEqual([]);
	});

	it("rejects invalid request bodies like the backend contract", async () => {
		await expect(
			postShelters({ latitude: "35.68", longitude: "139.69" }),
		).rejects.toThrow(/latitude\/longitude/);
	});
});
