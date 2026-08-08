import { describe, expect, it } from "vitest";
import {
	DEMO_SHELTER_SEARCH_ORIGIN,
	DEMO_SHELTER_SEARCH_RADIUS_METERS,
	findNearbyDemoShelters,
} from "./demo-shelter-service";

describe("findNearbyDemoShelters", () => {
	it("returns Japanese shelter names ordered by distance from Tokyo Metropolitan Government Building", () => {
		const response = findNearbyDemoShelters({
			...DEMO_SHELTER_SEARCH_ORIGIN,
			limit: 3,
		});

		expect(response.dataStatus).toBe("not_realtime");
		expect(response.origin).toEqual(DEMO_SHELTER_SEARCH_ORIGIN);
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

	it("ignores request coordinates and always searches from Tokyo Metropolitan Government Building", () => {
		const tokyoStationResponse = findNearbyDemoShelters({
			latitude: 35.681236,
			longitude: 139.767125,
		});
		const overseasResponse = findNearbyDemoShelters({
			latitude: 40.7128,
			longitude: -74.006,
		});

		expect(tokyoStationResponse.origin).toEqual(DEMO_SHELTER_SEARCH_ORIGIN);
		expect(overseasResponse.origin).toEqual(DEMO_SHELTER_SEARCH_ORIGIN);
		expect(tokyoStationResponse.facilities).toEqual(
			overseasResponse.facilities,
		);
		expect(tokyoStationResponse.facilities).toHaveLength(5);
	});
});
