export type Coordinates = {
	latitude: number;
	longitude: number;
};

export type PolygonPosition = readonly [latitude: number, longitude: number];
export type PolygonRings = readonly (readonly PolygonPosition[])[];

const EARTH_RADIUS_METERS = 6_371_000;
const BOUNDARY_EPSILON = 1e-10;

function degreesToRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function haversineDistanceMeters(
	origin: Coordinates,
	destination: Coordinates,
): number {
	const latitudeDelta = degreesToRadians(destination.latitude - origin.latitude);
	const longitudeDelta = degreesToRadians(destination.longitude - origin.longitude);
	const originLatitude = degreesToRadians(origin.latitude);
	const destinationLatitude = degreesToRadians(destination.latitude);

	const haversine =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(originLatitude) *
			Math.cos(destinationLatitude) *
			Math.sin(longitudeDelta / 2) ** 2;

	return (
		2 *
		EARTH_RADIUS_METERS *
		Math.asin(Math.min(1, Math.sqrt(haversine)))
	);
}

function pointIsOnSegment(
	point: Coordinates,
	start: PolygonPosition,
	end: PolygonPosition,
): boolean {
	const [startLatitude, startLongitude] = start;
	const [endLatitude, endLongitude] = end;
	const crossProduct =
		(point.longitude - startLongitude) * (endLatitude - startLatitude) -
		(point.latitude - startLatitude) * (endLongitude - startLongitude);

	if (Math.abs(crossProduct) > BOUNDARY_EPSILON) {
		return false;
	}

	return (
		point.latitude >= Math.min(startLatitude, endLatitude) - BOUNDARY_EPSILON &&
		point.latitude <= Math.max(startLatitude, endLatitude) + BOUNDARY_EPSILON &&
		point.longitude >= Math.min(startLongitude, endLongitude) -
			BOUNDARY_EPSILON &&
		point.longitude <= Math.max(startLongitude, endLongitude) +
			BOUNDARY_EPSILON
	);
}

function pointInRing(
	point: Coordinates,
	ring: readonly PolygonPosition[],
): "boundary" | "inside" | "outside" {
	if (ring.length < 3) {
		return "outside";
	}

	let inside = false;

	for (let currentIndex = 0; currentIndex < ring.length; currentIndex += 1) {
		const current = ring[currentIndex];
		const previous = ring[(currentIndex + ring.length - 1) % ring.length];

		if (current === undefined || previous === undefined) {
			continue;
		}

		if (pointIsOnSegment(point, previous, current)) {
			return "boundary";
		}

		const [currentLatitude, currentLongitude] = current;
		const [previousLatitude, previousLongitude] = previous;
		const crossesLatitude =
			currentLatitude > point.latitude !== previousLatitude > point.latitude;

		if (
			crossesLatitude &&
			point.longitude <
				((previousLongitude - currentLongitude) *
					(point.latitude - currentLatitude)) /
					(previousLatitude - currentLatitude) +
					currentLongitude
		) {
			inside = !inside;
		}
	}

	return inside ? "inside" : "outside";
}

/**
 * Tests WGS84 [latitude, longitude] polygon rings. The first ring is the
 * exterior and subsequent rings are holes. Polygon boundaries count as hits.
 */
export function pointInPolygon(
	point: Coordinates,
	rings: PolygonRings,
): boolean {
	const outerRing = rings[0];

	if (outerRing === undefined) {
		return false;
	}

	const outerResult = pointInRing(point, outerRing);
	if (outerResult === "boundary") {
		return true;
	}
	if (outerResult === "outside") {
		return false;
	}

	for (const hole of rings.slice(1)) {
		const holeResult = pointInRing(point, hole);
		if (holeResult === "boundary") {
			return true;
		}
		if (holeResult === "inside") {
			return false;
		}
	}

	return true;
}
