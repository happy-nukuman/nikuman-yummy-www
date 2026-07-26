import type { FacilitySearchResponse } from "@nikuman-yummy/shared";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import type {
	D1FacilityRow,
	D1StayPutZoneRow,
} from "../repositories/d1-facility-repository";

const TEST_ROW: D1FacilityRow = {
	facility_id: "route-fixture-1",
	name_ja: "経路テスト避難所",
	name_en: null,
	name_zh_hans: null,
	facility_type: "evacuation_shelter",
	municipality_id: "13101",
	address: "東京都千代田区経路テスト1-1",
	latitude: 35.6852,
	longitude: 139.7528,
	accessibility: null,
	source_url: "https://fixture.invalid/facilities/route-1",
	source_updated_at: "2026-07-01T00:00:00.000Z",
};

const TEST_ZONE_ROW: D1StayPutZoneRow = {
	zone_id: "route-stay-put-13101",
	name_ja: "丸の内地区",
	municipality_id: "13101",
	chome_json: '["丸の内一丁目","丸の内二丁目"]',
	area_ha: 120.5,
	population: 8_000,
	polygon_json:
		"[[[35.67,139.74],[35.67,139.76],[35.69,139.76],[35.69,139.74]]]",
	source_url: "https://fixture.invalid/stay-put",
	source_updated_at: "2022-09-01",
};

function createTestDatabase(options: { zoneQueryFails?: boolean } = {}): D1Database {
	const facilityStatement = {
		bind: vi.fn(),
		all: vi.fn().mockResolvedValue({ results: [TEST_ROW] }),
	};
	facilityStatement.bind.mockReturnValue(facilityStatement);
	const zoneStatement = {
		bind: vi.fn(),
		all: vi.fn().mockImplementation(() =>
			options.zoneQueryFails === true
				? Promise.reject(new Error("Route test zone query failure"))
				: Promise.resolve({ results: [TEST_ZONE_ROW] }),
		),
	};
	zoneStatement.bind.mockReturnValue(zoneStatement);

	return {
		prepare: (query: string) => {
			if (query.includes("FROM facilities")) {
				return facilityStatement;
			}
			if (query.includes("FROM stay_put_zones")) {
				return zoneStatement;
			}
			return {
						all: vi.fn().mockResolvedValue({
							results: [
								{
									source_name: "Route test catalogue A",
									source_url: "https://fixture.invalid/catalogue-a",
									source_updated_at: "2026-07-01T00:00:00.000Z",
									realtime: 1,
									attribution: "Route fixture attribution A",
								},
								{
									source_name: "Route test catalogue B",
									source_url: "https://fixture.invalid/catalogue-b",
									source_updated_at: "2026-07-02T00:00:00.000Z",
									realtime: 0,
									attribution: null,
								},
							],
						}),
					};
		},
	} as unknown as D1Database;
}

async function searchRequest(
	database: D1Database,
	request: Record<string, unknown> = { municipalityId: "13101" },
): Promise<Response> {
	return await createApp().request(
		"/api/facilities/search",
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(request),
		},
		{ DB: database },
	);
}

describe("facility routes with D1", () => {
	it("uses the D1 repository when the binding is present", async () => {
		const response = await searchRequest(createTestDatabase());
		const body = await response.json<FacilitySearchResponse>();

		expect(response.status).toBe(200);
		expect(body.dataStatus).toBe("not_realtime");
		expect(body.sources).toEqual([
			{
				name: "Route test catalogue A",
				url: "https://fixture.invalid/catalogue-a",
				updatedAt: "2026-07-01T00:00:00.000Z",
				attribution: "Route fixture attribution A",
			},
			{
				name: "Route test catalogue B",
				url: "https://fixture.invalid/catalogue-b",
				updatedAt: "2026-07-02T00:00:00.000Z",
			},
		]);
		expect(body.stayPutStatus).toBe("undetermined");
		expect(body.stayPutZones).toEqual([
			{
				zoneId: "route-stay-put-13101",
				name: { ja: "丸の内地区" },
				municipalityId: "13101",
				chome: ["丸の内一丁目", "丸の内二丁目"],
				areaHa: 120.5,
				population: 8_000,
				sourceUrl: "https://fixture.invalid/stay-put",
				sourceUpdatedAt: "2022-09-01",
			},
		]);
		expect(body.facilities).toEqual([
			{
				facilityId: "route-fixture-1",
				name: { ja: "経路テスト避難所" },
				facilityType: "evacuation_shelter",
				municipalityId: "13101",
				address: "東京都千代田区経路テスト1-1",
				latitude: 35.6852,
				longitude: 139.7528,
				distanceMeters: null,
				sourceUrl: "https://fixture.invalid/facilities/route-1",
				sourceUpdatedAt: "2026-07-01T00:00:00.000Z",
			},
		]);
	});

	it("keeps facilities and degrades only zone facts when zone querying fails", async () => {
		const response = await searchRequest(
			createTestDatabase({ zoneQueryFails: true }),
			{
				municipalityId: "13101",
				latitude: 35.68,
				longitude: 139.75,
			},
		);
		const body = await response.json<FacilitySearchResponse>();

		expect(response.status).toBe(200);
		expect(body.dataStatus).toBe("not_realtime");
		expect(body.stayPutStatus).toBe("undetermined");
		expect(body.stayPutZones).toEqual([]);
		expect(body.facilities).toHaveLength(1);
		expect(body.facilities[0]?.facilityId).toBe("route-fixture-1");
	});

	it("returns unavailable rather than 500 when D1 querying fails", async () => {
		const database = {
			prepare: () => {
				throw new Error("Route test D1 failure");
			},
		} as unknown as D1Database;

		const response = await searchRequest(database);
		const body = await response.json<FacilitySearchResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			dataStatus: "unavailable",
			sources: [],
			stayPutStatus: "undetermined",
			stayPutZones: [],
			facilities: [],
		});
	});
});
