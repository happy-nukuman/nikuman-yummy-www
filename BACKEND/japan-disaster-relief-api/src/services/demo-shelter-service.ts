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
const DEFAULT_RESULT_LIMIT = 5;

function googleMapsUrl(latitude: number, longitude: number): string {
	const query = encodeURIComponent(`${latitude},${longitude}`);
	return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function findNearbyDemoShelters(
	request: DemoShelterNearbyRequest,
): DemoShelterNearbyResponse {
	const origin = {
		latitude: request.latitude,
		longitude: request.longitude,
	};
	const limit = request.limit ?? DEFAULT_RESULT_LIMIT;

	const facilities: DemoShelterCandidate[] = DEMO_SHELTERS.map((facility) => ({
		...facility,
		distanceMeters: Math.round(haversineDistanceMeters(origin, facility)),
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
		origin,
		searchRadiusMeters: DEMO_SHELTER_SEARCH_RADIUS_METERS,
		source: DEMO_SHELTER_SOURCE,
		facilities,
		limitations: {
			openStatus: "unknown",
			routeStatus: "unknown",
		},
	};
}
