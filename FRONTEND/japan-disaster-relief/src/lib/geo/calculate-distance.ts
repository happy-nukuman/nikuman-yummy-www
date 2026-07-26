export type GeoPoint = {
	latitude: number;
	longitude: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

function assertValidPoint(point: GeoPoint): void {
	if (
		!Number.isFinite(point.latitude) ||
		point.latitude < -90 ||
		point.latitude > 90 ||
		!Number.isFinite(point.longitude) ||
		point.longitude < -180 ||
		point.longitude > 180
	) {
		throw new RangeError("Latitude or longitude is outside its valid range.");
	}
}

export function calculateDistance(from: GeoPoint, to: GeoPoint): number {
	assertValidPoint(from);
	assertValidPoint(to);

	const latitudeDelta = toRadians(to.latitude - from.latitude);
	const longitudeDelta = toRadians(to.longitude - from.longitude);
	const fromLatitude = toRadians(from.latitude);
	const toLatitude = toRadians(to.latitude);

	const haversine =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

	return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}
