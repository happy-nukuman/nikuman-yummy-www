import { describe, expect, it } from "vitest";
import { calculateDistance } from "./calculate-distance";

describe("calculateDistance", () => {
	it("returns zero for the same point", () => {
		const tokyoStation = { latitude: 35.6812, longitude: 139.7671 };
		expect(calculateDistance(tokyoStation, tokyoStation)).toBe(0);
	});

	it("calculates the approximate distance between Tokyo and Shinjuku stations", () => {
		const distance = calculateDistance(
			{ latitude: 35.6812, longitude: 139.7671 },
			{ latitude: 35.6909, longitude: 139.7003 },
		);

		expect(distance).toBeGreaterThan(5_800);
		expect(distance).toBeLessThan(6_500);
	});

	it("rejects invalid coordinates", () => {
		expect(() =>
			calculateDistance(
				{ latitude: 91, longitude: 139.7671 },
				{ latitude: 35.6909, longitude: 139.7003 },
			),
		).toThrow(RangeError);
	});
});
