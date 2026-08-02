export type DemoShelterNearbyRequest = {
	latitude: number;
	longitude: number;
	limit?: number;
};

export type DemoShelterCandidate = {
	facilityId: string;
	nameJa: string;
	addressJa: string;
	latitude: number;
	longitude: number;
	distanceMeters: number;
	googleMapsUrl: string;
};

export type DemoShelterNearbyResponse = {
	dataStatus: "not_realtime";
	origin: {
		latitude: number;
		longitude: number;
	};
	searchRadiusMeters: number;
	source: {
		name: string;
		url: string;
		updatedAt: string;
		realtime: false;
	};
	facilities: DemoShelterCandidate[];
	limitations: {
		openStatus: "unknown";
		routeStatus: "unknown";
	};
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDemoShelterNearbyRequest(
	value: unknown,
): value is DemoShelterNearbyRequest {
	if (!isRecord(value)) {
		return false;
	}

	const { latitude, longitude, limit } = value;
	return (
		typeof latitude === "number" &&
		Number.isFinite(latitude) &&
		latitude >= -90 &&
		latitude <= 90 &&
		typeof longitude === "number" &&
		Number.isFinite(longitude) &&
		longitude >= -180 &&
		longitude <= 180 &&
		(limit === undefined ||
			(typeof limit === "number" &&
				Number.isInteger(limit) &&
				limit >= 1 &&
				limit <= 10))
	);
}
