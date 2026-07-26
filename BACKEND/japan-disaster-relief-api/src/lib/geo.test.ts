import { describe, expect, it } from "vitest";
import {
	haversineDistanceMeters,
	pointInPolygon,
	type PolygonRings,
} from "./geo";

describe("haversineDistanceMeters", () => {
	it("returns zero for identical coordinates", () => {
		const coordinate = { latitude: 35.6812, longitude: 139.7671 };

		expect(haversineDistanceMeters(coordinate, coordinate)).toBe(0);
	});

	it("returns the approximate distance between two Tokyo points", () => {
		const distance = haversineDistanceMeters(
			{ latitude: 35.6812, longitude: 139.7671 },
			{ latitude: 35.6896, longitude: 139.6917 },
		);

		expect(distance).toBeGreaterThan(6_000);
		expect(distance).toBeLessThan(7_000);
	});
});

const SQUARE_WITH_HOLE: PolygonRings = [
	[
		[35, 139],
		[35, 140],
		[36, 140],
		[36, 139],
	],
	[
		[35.4, 139.4],
		[35.4, 139.6],
		[35.6, 139.6],
		[35.6, 139.4],
	],
];

describe("pointInPolygon", () => {
	it("detects points inside and outside the outer ring", () => {
		expect(
			pointInPolygon(
				{ latitude: 35.2, longitude: 139.2 },
				SQUARE_WITH_HOLE,
			),
		).toBe(true);
		expect(
			pointInPolygon(
				{ latitude: 36.2, longitude: 139.2 },
				SQUARE_WITH_HOLE,
			),
		).toBe(false);
	});

	it.each([
		{ latitude: 35, longitude: 139 },
		{ latitude: 35.5, longitude: 139 },
		{ latitude: 35.4, longitude: 139.5 },
	])("counts polygon vertices and edges as hits", (point) => {
		expect(pointInPolygon(point, SQUARE_WITH_HOLE)).toBe(true);
	});

	it("excludes the interior of additional hole rings", () => {
		expect(
			pointInPolygon(
				{ latitude: 35.5, longitude: 139.5 },
				SQUARE_WITH_HOLE,
			),
		).toBe(false);
	});

	it("returns false for an empty polygon", () => {
		expect(
			pointInPolygon({ latitude: 35.5, longitude: 139.5 }, []),
		).toBe(false);
	});
});
