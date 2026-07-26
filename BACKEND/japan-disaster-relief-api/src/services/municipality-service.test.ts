import { describe, expect, it } from "vitest";
import type { MunicipalityReference } from "../config/municipalities";
import {
	listMunicipalities,
	matchMunicipality,
} from "./municipality-service";

describe("municipality service", () => {
	it("lists all 23 special wards in municipality ID order", () => {
		const result = listMunicipalities();
		const ids = result.municipalities.map(
			(municipality) => municipality.municipalityId,
		);

		expect(ids).toHaveLength(23);
		expect(ids).toEqual([...ids].sort());
		expect(ids[0]).toBe("13101");
		expect(ids.at(-1)).toBe("13123");
	});

	it("matches a point inside Chiyoda", () => {
		expect(
			matchMunicipality({
				latitude: 35.6852,
				longitude: 139.7528,
			}),
		).toEqual({
			municipalityId: "13101",
			municipalityName: {
				ja: "千代田区",
				en: "Chiyoda City",
				zhHans: "千代田区",
			},
			matched: true,
		});
	});

	it("returns an unmatched result outside the covered area", () => {
		expect(
			matchMunicipality({
				latitude: 34,
				longitude: 139,
			}),
		).toEqual({
			municipalityId: null,
			municipalityName: null,
			matched: false,
		});
	});

	it("returns the same match for repeated input", () => {
		const request = {
			latitude: 35.6852,
			longitude: 139.7528,
		};

		expect(matchMunicipality(request)).toEqual(matchMunicipality(request));
	});

	it("uses municipality ID order to break equal-distance ties", () => {
		const references: readonly MunicipalityReference[] = [
			{
				municipalityId: "13102",
				name: { ja: "中央区" },
				bounds: { minLat: 35, maxLat: 36, minLng: 139, maxLng: 140 },
				centroid: { latitude: 35.5, longitude: 139.5 },
			},
			{
				municipalityId: "13101",
				name: { ja: "千代田区" },
				bounds: { minLat: 35, maxLat: 36, minLng: 139, maxLng: 140 },
				centroid: { latitude: 35.5, longitude: 139.5 },
			},
		];

		expect(
			matchMunicipality(
				{ latitude: 35.5, longitude: 139.5 },
				references,
			).municipalityId,
		).toBe("13101");
	});
});
