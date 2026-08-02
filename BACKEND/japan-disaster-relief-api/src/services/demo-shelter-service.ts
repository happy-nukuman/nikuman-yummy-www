import type {
	DemoShelterCandidate,
	DemoShelterNearbyRequest,
	DemoShelterNearbyResponse,
} from "@nikuman-yummy/shared";
import {
	DEMO_SHELTERS,
	DEMO_SHELTER_SOURCE,
} from "../config/demo-shelters";
import { haversineDistanceMeters } from "../lib/geo";

export const DEMO_SHELTER_SEARCH_RADIUS_METERS = 3_000;
export const DEMO_SHELTER_SEARCH_ORIGIN = {
	latitude: 35.6896342,
	longitude: 139.6917418,
} as const;
const DEFAULT_RESULT_LIMIT = 5;

function googleMapsUrl(latitude: number, longitude: number): string {
	const query = encodeURIComponent(`${latitude},${longitude}`);
	return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function findNearbyDemoShelters(
	request: DemoShelterNearbyRequest,
): DemoShelterNearbyResponse {
	// The request coordinates are intentionally ignored for the contest demo.
	// Keeping them in the contract avoids a breaking frontend change while all
	// distance, filtering and ranking use the fixed Tokyo Metropolitan Government
	// Building origin below.
	const limit = request.limit ?? DEFAULT_RESULT_LIMIT;

	const facilities: DemoShelterCandidate[] = DEMO_SHELTERS.map((facility) => ({
		...facility,
		distanceMeters: Math.round(
			haversineDistanceMeters(DEMO_SHELTER_SEARCH_ORIGIN, facility),
		),
		googleMapsUrl: googleMapsUrl(facility.latitude, facility.longitude),
	}))
		.filter(
			(facility) =>
				facility.distanceMeters <= DEMO_SHELTER_SEARCH_RADIUS_METERS,
		)
		.sort(
			(left, right) =>
				left.distanceMeters - right.distanceMeters ||
				left.nameJa.localeCompare(right.nameJa, "ja"),
		)
		.slice(0, limit);

	return {
		dataStatus: "not_realtime",
		origin: DEMO_SHELTER_SEARCH_ORIGIN,
		searchRadiusMeters: DEMO_SHELTER_SEARCH_RADIUS_METERS,
		source: DEMO_SHELTER_SOURCE,
		facilities,
		limitations: {
			openStatus: "unknown",
			routeStatus: "unknown",
		},
	};
}
