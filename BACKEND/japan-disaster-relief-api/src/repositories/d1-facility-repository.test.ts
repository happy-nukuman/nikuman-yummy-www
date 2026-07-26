import { describe, expect, it, vi } from "vitest";
import {
	D1FacilityRepository,
	mapD1FacilityRow,
	mapD1StayPutZoneRow,
	type D1FacilityRow,
	type D1StayPutZoneRow,
} from "./d1-facility-repository";

const TEST_ROW: D1FacilityRow = {
	facility_id: "fixture-13101-1",
	name_ja: "千代田テスト避難所",
	name_en: "Chiyoda Test Shelter",
	name_zh_hans: "千代田测试避难所",
	facility_type: "evacuation_shelter",
	municipality_id: "13101",
	address: "東京都千代田区テスト1-1",
	latitude: 35.6852,
	longitude: 139.7528,
	accessibility: '["wheelchair","toilet"]',
	source_url: "https://fixture.invalid/facilities/1",
	source_updated_at: "2026-07-01T00:00:00.000Z",
};

const TEST_ZONE_ROW: D1StayPutZoneRow = {
	zone_id: "stay-put-13101-1",
	name_ja: "丸の内地区",
	municipality_id: "13101",
	chome_json: '["丸の内一丁目","丸の内二丁目"]',
	area_ha: 120.5,
	population: 8_000,
	polygon_json:
		"[[[35.67,139.75],[35.67,139.77],[35.69,139.77],[35.69,139.75]]]",
	source_url: "https://fixture.invalid/stay-put/1",
	source_updated_at: "2022-09-01",
};

describe("mapD1FacilityRow", () => {
	it("maps snake-case D1 columns to a facility record", () => {
		expect(mapD1FacilityRow(TEST_ROW)).toEqual({
			facilityId: "fixture-13101-1",
			name: {
				ja: "千代田テスト避難所",
				en: "Chiyoda Test Shelter",
				zhHans: "千代田测试避难所",
			},
			facilityType: "evacuation_shelter",
			municipalityId: "13101",
			address: "東京都千代田区テスト1-1",
			latitude: 35.6852,
			longitude: 139.7528,
			accessibility: ["wheelchair", "toilet"],
			sourceUrl: "https://fixture.invalid/facilities/1",
			sourceUpdatedAt: "2026-07-01T00:00:00.000Z",
		});
	});

	it.each(["not-json", '["wheelchair",1]', '{"wheelchair":true}'])(
		"omits malformed accessibility value %s",
		(accessibility) => {
			const result = mapD1FacilityRow({
				...TEST_ROW,
				name_en: null,
				name_zh_hans: null,
				accessibility,
			});

			expect(result).not.toHaveProperty("accessibility");
			expect(result.name).toEqual({ ja: TEST_ROW.name_ja });
		},
	);
});

describe("mapD1StayPutZoneRow", () => {
	it("maps a valid zone and its internal polygon", () => {
		expect(mapD1StayPutZoneRow(TEST_ZONE_ROW)).toEqual({
			zoneId: "stay-put-13101-1",
			name: { ja: "丸の内地区" },
			municipalityId: "13101",
			chome: ["丸の内一丁目", "丸の内二丁目"],
			areaHa: 120.5,
			population: 8_000,
			polygon: [
				[
					[35.67, 139.75],
					[35.67, 139.77],
					[35.69, 139.77],
					[35.69, 139.75],
				],
			],
			sourceUrl: "https://fixture.invalid/stay-put/1",
			sourceUpdatedAt: "2022-09-01",
		});
	});

	it.each(["not-json", '["丸の内",1]', '{"丸の内":true}'])(
		"skips a row with malformed chome JSON %s",
		(chome_json) => {
			expect(mapD1StayPutZoneRow({ ...TEST_ZONE_ROW, chome_json })).toBe(
				undefined,
			);
		},
	);

	it("keeps a zone but ignores malformed polygon JSON", () => {
		expect(
			mapD1StayPutZoneRow({
				...TEST_ZONE_ROW,
				polygon_json: "[[[35.67,139.75],[35.68]]]",
			})?.polygon,
		).toBeNull();
	});
});

describe("D1FacilityRepository", () => {
	it("loads municipality facilities, zones, and catalogue metadata", async () => {
		const facilityStatement = {
			bind: vi.fn(),
			all: vi.fn().mockResolvedValue({ results: [TEST_ROW] }),
		};
		facilityStatement.bind.mockReturnValue(facilityStatement);
		const metadataStatement = {
			all: vi.fn().mockResolvedValue({
				results: [
					{
						source_name: "Tokyo General Affairs test fixture",
						source_url: "https://fixture.invalid/general-affairs",
						source_updated_at: "2026-07-01T00:00:00.000Z",
						realtime: 1,
						attribution: "General Affairs attribution",
					},
					{
						source_name: "Tokyo Urban Development test fixture",
						source_url: "https://fixture.invalid/urban-development",
						source_updated_at: "2026-07-02T00:00:00.000Z",
						realtime: 0,
						attribution: null,
					},
				],
			}),
		};
		const zoneStatement = {
			bind: vi.fn(),
			all: vi.fn().mockResolvedValue({ results: [TEST_ZONE_ROW] }),
		};
		zoneStatement.bind.mockReturnValue(zoneStatement);
		const prepare = vi.fn((query: string) => {
			if (query.includes("FROM facilities")) {
				return facilityStatement;
			}
			if (query.includes("FROM stay_put_zones")) {
				return zoneStatement;
			}
			return metadataStatement;
		});
		const database = { prepare } as unknown as D1Database;

		const result = await new D1FacilityRepository(database, "13101").load();

		expect(prepare).toHaveBeenCalledTimes(3);
		expect(prepare.mock.calls[0]?.[0]).toContain(
			"WHERE municipality_id = ?",
		);
		expect(prepare.mock.calls[1]?.[0]).toContain("ORDER BY id");
		expect(prepare.mock.calls[1]?.[0]).not.toContain("LIMIT");
		expect(prepare.mock.calls[2]?.[0]).toContain("FROM stay_put_zones");
		expect(prepare.mock.calls[2]?.[0]).toContain("ORDER BY zone_id");
		expect(facilityStatement.bind).toHaveBeenCalledWith("13101");
		expect(zoneStatement.bind).toHaveBeenCalledWith("13101");
		expect(result.catalogue).toEqual({
			connected: true,
			sources: [
				{
					name: "Tokyo General Affairs test fixture",
					url: "https://fixture.invalid/general-affairs",
					updatedAt: "2026-07-01T00:00:00.000Z",
					attribution: "General Affairs attribution",
				},
				{
					name: "Tokyo Urban Development test fixture",
					url: "https://fixture.invalid/urban-development",
					updatedAt: "2026-07-02T00:00:00.000Z",
				},
			],
			realtime: false,
		});
		expect(result.facilities).toEqual([mapD1FacilityRow(TEST_ROW)]);
		expect(result.stayPutZones).toEqual([
			mapD1StayPutZoneRow(TEST_ZONE_ROW),
		]);
	});

	it("reports a disconnected catalogue when dataset metadata is absent", async () => {
		const facilityStatement = {
			bind: vi.fn(),
			all: vi.fn().mockResolvedValue({ results: [] }),
		};
		facilityStatement.bind.mockReturnValue(facilityStatement);
		const database = {
			prepare: (query: string) =>
				query.includes("FROM facilities")
					? facilityStatement
					: query.includes("FROM stay_put_zones")
						? {
								bind: vi.fn().mockReturnValue({
									all: vi.fn().mockResolvedValue({ results: [] }),
								}),
							}
						: { all: vi.fn().mockResolvedValue({ results: [] }) },
		} as unknown as D1Database;

		const result = await new D1FacilityRepository(database, "13101").load();

		expect(result.catalogue.connected).toBe(false);
		expect(result.catalogue.sources).toEqual([]);
		expect(result.facilities).toEqual([]);
		expect(result.stayPutZones).toEqual([]);
	});

	it("degrades a zone query failure without losing facility results", async () => {
		const facilityStatement = {
			bind: vi.fn(),
			all: vi.fn().mockResolvedValue({ results: [TEST_ROW] }),
		};
		facilityStatement.bind.mockReturnValue(facilityStatement);
		const metadataStatement = {
			all: vi.fn().mockResolvedValue({
				results: [
					{
						source_name: "Facility fixture",
						source_url: "https://fixture.invalid/catalogue",
						source_updated_at: "2026-07-01T00:00:00.000Z",
						realtime: 0,
						attribution: null,
					},
				],
			}),
		};
		const zoneStatement = {
			bind: vi.fn(),
			all: vi.fn().mockRejectedValue(new Error("Missing zone table")),
		};
		zoneStatement.bind.mockReturnValue(zoneStatement);
		const database = {
			prepare: (query: string) => {
				if (query.includes("FROM facilities")) {
					return facilityStatement;
				}
				if (query.includes("FROM stay_put_zones")) {
					return zoneStatement;
				}
				return metadataStatement;
			},
		} as unknown as D1Database;

		const result = await new D1FacilityRepository(database, "13101").load();

		expect(result.facilities).toEqual([mapD1FacilityRow(TEST_ROW)]);
		expect(result.stayPutZones).toEqual([]);
		expect(result.catalogue.connected).toBe(true);
	});
});
