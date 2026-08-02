import { describe, expect, it } from "vitest";
import {
	DEMO_SHELTER_SEARCH_RADIUS_METERS,
	findNearbyDemoShelters,
} from "./demo-shelter-service";

const TOKYO_METROPOLITAN_GOVERNMENT_BUILDING = {
	latitude: 35.6896342,
	longitude: 139.6917418,
};

describe("findNearbyDemoShelters", () => {
	it("returns Japanese shelter names ordered by distance from Tokyo Metropolitan Government Building", () => {
		const response = findNearbyDemoShelters({
			...TOKYO_METROPOLITAN_GOVERNMENT_BUILDING,
			limit: 3,
		});

		expect(response.dataStatus).toBe("not_realtime");
		expect(response.origin).toEqual(TOKYO_METROPOLITAN_GOVERNMENT_BUILDING);
		expect(response.searchRadiusMeters).toBe(DEMO_SHELTER_SEARCH_RADIUS_METERS);
		expect(response.facilities).toHaveLength(3);
		expect(response.facilities.map((facility) => facility.nameJa)).toEqual([
			"西新宿小学校",
			"西新宿中学校",
			"柏木小学校",
		]);
		expect(response.facilities[0]?.distanceMeters).toBeGreaterThan(500);
		expect(response.facilities[0]?.distanceMeters).toBeLessThan(600);
		expect(response.facilities[0]?.googleMapsUrl).toBe(
			"https://www.google.com/maps/search/?api=1&query=35.68602%2C139.68748",
		);
		expect(response.limitations).toEqual({
			openStatus: "unknown",
			routeStatus: "unknown",
		});
	});

	it("returns no candidates when the request is outside the demo radius", () => {
		const response = findNearbyDemoShelters({
			latitude: 35.681236,
			longitude: 139.767125,
		});

		expect(response.facilities).toEqual([]);
	});
});
