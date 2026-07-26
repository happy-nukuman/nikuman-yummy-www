import { describe, expect, it } from "vitest";
import type { FacilityType } from "@nikuman-yummy/shared";
import {
	StaticFacilityRepository,
	type FacilityCatalogueMetadata,
	type FacilityRecord,
	type FacilityRepository,
	type StayPutZoneRecord,
} from "../repositories/facility-repository";
import { FacilityService } from "./facility-service";

const TEST_FIXTURE_CATALOGUE: FacilityCatalogueMetadata = {
	connected: true,
	sources: [
		{
			name: "Facility service test fixture A",
			url: "https://fixture.invalid/catalogue-a",
			updatedAt: "2026-01-01T00:00:00.000Z",
			attribution: "Fixture A attribution",
		},
		{
			name: "Facility service test fixture B",
			url: "https://fixture.invalid/catalogue-b",
			updatedAt: "2026-01-02T00:00:00.000Z",
		},
	],
	realtime: false,
};

function createTestFixture(
	facilityId: string,
	name: string,
	latitude: number,
	overrides: {
		municipalityId?: string;
		facilityType?: FacilityType;
		accessibility?: string[];
		openStatus?: "open" | "closed";
	} = {},
): FacilityRecord {
	return {
		facilityId,
		name: { ja: name },
		facilityType: overrides.facilityType ?? "evacuation_shelter",
		municipalityId: overrides.municipalityId ?? "13101",
		address: "Facility service test fixture address",
		latitude,
		longitude: 139.75,
		...(overrides.accessibility === undefined
			? {}
			: { accessibility: overrides.accessibility }),
		...(overrides.openStatus === undefined
			? {}
			: {
					openStatus: overrides.openStatus,
					statusUpdatedAt: "2026-01-01T01:00:00.000Z",
				}),
		sourceUrl: "https://fixture.invalid/facility",
		sourceUpdatedAt: "2026-01-01T00:00:00.000Z",
	};
}

function createService(
	facilities: readonly FacilityRecord[],
	catalogue: FacilityCatalogueMetadata = TEST_FIXTURE_CATALOGUE,
	stayPutZones: readonly StayPutZoneRecord[] = [],
): FacilityService {
	return new FacilityService(
		new StaticFacilityRepository(facilities, catalogue, stayPutZones),
	);
}

function createStayPutZone(
	polygon: StayPutZoneRecord["polygon"],
): StayPutZoneRecord {
	return {
		zoneId: "stay-put-fixture-13101",
		name: { ja: "丸の内地区" },
		municipalityId: "13101",
		chome: ["丸の内一丁目", "丸の内二丁目"],
		areaHa: 120.5,
		population: 8_000,
		polygon,
		sourceUrl: "https://fixture.invalid/stay-put",
		sourceUpdatedAt: "2022-09-01",
	};
}

const TEST_POLYGON: NonNullable<StayPutZoneRecord["polygon"]> = [
	[
		[35.67, 139.74],
		[35.67, 139.76],
		[35.69, 139.76],
		[35.69, 139.74],
	],
];

describe("FacilityService", () => {
	it("returns unknown when no catalogue is connected", async () => {
		const service = createService([], {
			connected: false,
			sources: [],
			note: "No open-data source connected yet.",
		});

		await expect(service.search({ municipalityId: "13101" })).resolves.toEqual({
			dataStatus: "unknown",
			sources: [],
			stayPutStatus: "undetermined",
			stayPutZones: [],
			facilities: [],
		});
	});

	it("returns catalogue status and sources when a search has no facilities", async () => {
		const service = createService([]);

		await expect(service.search({ municipalityId: "13101" })).resolves.toEqual({
			dataStatus: "not_realtime",
			sources: TEST_FIXTURE_CATALOGUE.connected
				? TEST_FIXTURE_CATALOGUE.sources
				: [],
			stayPutStatus: "undetermined",
			stayPutZones: [],
			facilities: [],
		});
	});

	it("returns injected fixture data as not realtime", async () => {
		const service = createService([
			createTestFixture("fixture-1", "テスト施設", 35.68),
		]);

		await expect(service.search({ municipalityId: "13101" })).resolves.toEqual({
			dataStatus: "not_realtime",
			sources: TEST_FIXTURE_CATALOGUE.connected
				? TEST_FIXTURE_CATALOGUE.sources
				: [],
			stayPutStatus: "undetermined",
			stayPutZones: [],
			facilities: [
				{
					...createTestFixture("fixture-1", "テスト施設", 35.68),
					distanceMeters: null,
				},
			],
		});
	});

	it("filters by municipality, facility type, and accessibility subset", async () => {
		const service = createService([
			createTestFixture("matching", "一致", 35.68, {
				facilityType: "evacuation_area",
				accessibility: ["wheelchair", "toilet"],
			}),
			createTestFixture("wrong-type", "種別違い", 35.68, {
				accessibility: ["wheelchair", "toilet"],
			}),
			createTestFixture("missing-tag", "属性不足", 35.68, {
				facilityType: "evacuation_area",
				accessibility: ["wheelchair"],
			}),
			createTestFixture("wrong-city", "区域違い", 35.68, {
				municipalityId: "13102",
				facilityType: "evacuation_area",
				accessibility: ["wheelchair", "toilet"],
			}),
		]);

		const result = await service.search({
			municipalityId: "13101",
			facilityTypes: ["evacuation_area"],
			accessibilityNeeds: ["wheelchair", "toilet"],
		});

		expect(result.facilities.map((facility) => facility.facilityId)).toEqual([
			"matching",
		]);
	});

	it("sorts by rounded distance when both coordinates are provided", async () => {
		const service = createService([
			createTestFixture("far", "遠い施設", 35.7),
			createTestFixture("near", "近い施設", 35.681),
		]);

		const result = await service.search({
			municipalityId: "13101",
			latitude: 35.68,
			longitude: 139.75,
		});

		expect(result.facilities.map((facility) => facility.facilityId)).toEqual([
			"near",
			"far",
		]);
		expect(result.facilities[0]?.distanceMeters).toBe(111);
		expect(result.facilities[1]?.distanceMeters).toBe(2_224);
	});

	it("sorts by Japanese name and returns null distance without coordinates", async () => {
		const service = createService([
			createTestFixture("z", "湾岸施設", 35.68),
			createTestFixture("a", "中央施設", 35.69),
		]);

		const result = await service.search({ municipalityId: "13101" });

		expect(
			result.facilities.map((facility) => ({
				id: facility.facilityId,
				distance: facility.distanceMeters,
			})),
		).toEqual([
			{ id: "a", distance: null },
			{ id: "z", distance: null },
		]);
	});

	it("caps the sorted result at 20 facilities", async () => {
		const fixtures = Array.from({ length: 25 }, (_, index) =>
			createTestFixture(
				`fixture-${String(index).padStart(2, "0")}`,
				`施設${String(index).padStart(2, "0")}`,
				35.68,
			),
		);
		const service = createService(fixtures);

		const result = await service.search({ municipalityId: "13101" });

		expect(result.facilities).toHaveLength(20);
		expect(result.facilities.at(-1)?.facilityId).toBe("fixture-19");
	});

	it("returns an honest empty result for an unknown municipality", async () => {
		const service = createService([
			createTestFixture("fixture-1", "テスト施設", 35.68),
		]);

		const result = await service.search({ municipalityId: "99999" });

		expect(result.dataStatus).toBe("not_realtime");
		expect(result.facilities).toEqual([]);
	});

	it("returns confirmed data only for a realtime catalogue", async () => {
		const service = createService(
			[
				createTestFixture("fixture-open", "開設状況付き施設", 35.68, {
					openStatus: "open",
				}),
			],
			{
				...TEST_FIXTURE_CATALOGUE,
				realtime: true,
			},
		);

		const result = await service.search({ municipalityId: "13101" });

		expect(result.dataStatus).toBe("confirmed");
		expect(result.facilities[0]?.openStatus).toBe("open");
	});

	it("returns municipality zones but leaves status undetermined without coordinates", async () => {
		const service = createService(
			[createTestFixture("fixture-1", "テスト施設", 35.68)],
			TEST_FIXTURE_CATALOGUE,
			[createStayPutZone(TEST_POLYGON)],
		);

		const result = await service.search({ municipalityId: "13101" });

		expect(result.stayPutStatus).toBe("undetermined");
		expect(result.stayPutZones).toEqual([
			{
				zoneId: "stay-put-fixture-13101",
				name: { ja: "丸の内地区" },
				municipalityId: "13101",
				chome: ["丸の内一丁目", "丸の内二丁目"],
				areaHa: 120.5,
				population: 8_000,
				sourceUrl: "https://fixture.invalid/stay-put",
				sourceUpdatedAt: "2022-09-01",
			},
		]);
		expect(result.stayPutZones[0]).not.toHaveProperty("polygon");
	});

	it("leaves status undetermined when every municipality zone lacks a polygon", async () => {
		const service = createService([], TEST_FIXTURE_CATALOGUE, [
			createStayPutZone(null),
		]);

		const result = await service.search({
			municipalityId: "13101",
			latitude: 35.68,
			longitude: 139.75,
		});

		expect(result.stayPutStatus).toBe("undetermined");
		expect(result.stayPutZones).toHaveLength(1);
	});

	it.each([
		{
			label: "inside",
			latitude: 35.68,
			longitude: 139.75,
			expected: "in_zone",
		},
		{
			label: "outside",
			latitude: 35.7,
			longitude: 139.75,
			expected: "outside_zone",
		},
	] as const)(
		"reports $expected for coordinates $label a synthetic polygon",
		async ({ latitude, longitude, expected }) => {
			const service = createService([], TEST_FIXTURE_CATALOGUE, [
				createStayPutZone(TEST_POLYGON),
			]);

			const result = await service.search({
				municipalityId: "13101",
				latitude,
				longitude,
			});

			expect(result.stayPutStatus).toBe(expected);
		},
	);

	it("treats non-finite coordinates as undetermined in direct service calls", async () => {
		const service = createService([], TEST_FIXTURE_CATALOGUE, [
			createStayPutZone(TEST_POLYGON),
		]);

		const result = await service.search({
			municipalityId: "13101",
			latitude: Number.NaN,
			longitude: 139.75,
		});

		expect(result.stayPutStatus).toBe("undetermined");
	});

	it("returns unavailable when the repository fails", async () => {
		const failingRepository: FacilityRepository = {
			load: () => Promise.reject(new Error("Test fixture repository failure")),
		};
		const service = new FacilityService(failingRepository);

		await expect(service.search({ municipalityId: "13101" })).resolves.toEqual({
			dataStatus: "unavailable",
			sources: [],
			stayPutStatus: "undetermined",
			stayPutZones: [],
			facilities: [],
		});
	});
});
