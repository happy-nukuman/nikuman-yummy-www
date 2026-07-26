import type {
	FacilitySource,
	FacilityType,
} from "@nikuman-yummy/shared";
import type {
	FacilityRecord,
	FacilityRepository,
	FacilityRepositorySnapshot,
	StayPutPolygon,
	StayPutPosition,
	StayPutZoneRecord,
} from "./facility-repository";

export type D1FacilityRow = {
	facility_id: string;
	name_ja: string;
	name_en: string | null;
	name_zh_hans: string | null;
	facility_type: FacilityType;
	municipality_id: string;
	address: string;
	latitude: number;
	longitude: number;
	accessibility: string | null;
	source_url: string;
	source_updated_at: string;
};

type D1DatasetMetaRow = {
	source_name: string;
	source_url: string;
	source_updated_at: string;
	realtime: number;
	attribution: string | null;
};

export type D1StayPutZoneRow = {
	zone_id: string;
	name_ja: string;
	municipality_id: string;
	chome_json: string;
	area_ha: number | null;
	population: number | null;
	polygon_json: string | null;
	source_url: string;
	source_updated_at: string;
};

function parseAccessibility(value: string | null): string[] | undefined {
	if (value === null) {
		return undefined;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) &&
			parsed.every((item) => typeof item === "string")
			? parsed
			: undefined;
	} catch {
		return undefined;
	}
}

function parseStringArray(value: string): string[] | undefined {
	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) &&
			parsed.every((item) => typeof item === "string")
			? parsed
			: undefined;
	} catch {
		return undefined;
	}
}

function isStayPutPosition(value: unknown): value is StayPutPosition {
	return (
		Array.isArray(value) &&
		value.length === 2 &&
		typeof value[0] === "number" &&
		Number.isFinite(value[0]) &&
		typeof value[1] === "number" &&
		Number.isFinite(value[1])
	);
}

function isStayPutRing(value: unknown): value is readonly StayPutPosition[] {
	return (
		Array.isArray(value) &&
		value.length >= 3 &&
		value.every(isStayPutPosition)
	);
}

function parseStayPutPolygon(value: string | null): StayPutPolygon | null {
	if (value === null) {
		return null;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) &&
			parsed.length > 0 &&
			parsed.every(isStayPutRing)
			? parsed
			: null;
	} catch {
		return null;
	}
}

export function mapD1FacilityRow(row: D1FacilityRow): FacilityRecord {
	const accessibility = parseAccessibility(row.accessibility);

	return {
		facilityId: row.facility_id,
		name: {
			ja: row.name_ja,
			...(row.name_en === null ? {} : { en: row.name_en }),
			...(row.name_zh_hans === null ? {} : { zhHans: row.name_zh_hans }),
		},
		facilityType: row.facility_type,
		municipalityId: row.municipality_id,
		address: row.address,
		latitude: row.latitude,
		longitude: row.longitude,
		...(accessibility === undefined ? {} : { accessibility }),
		sourceUrl: row.source_url,
		sourceUpdatedAt: row.source_updated_at,
	};
}

export function mapD1StayPutZoneRow(
	row: D1StayPutZoneRow,
): StayPutZoneRecord | undefined {
	const chome = parseStringArray(row.chome_json);

	if (chome === undefined) {
		return undefined;
	}

	return {
		zoneId: row.zone_id,
		name: { ja: row.name_ja },
		municipalityId: row.municipality_id,
		chome,
		areaHa: row.area_ha,
		population: row.population,
		polygon: parseStayPutPolygon(row.polygon_json),
		sourceUrl: row.source_url,
		sourceUpdatedAt: row.source_updated_at,
	};
}

function mapD1DatasetMetaRow(row: D1DatasetMetaRow): FacilitySource {
	return {
		name: row.source_name,
		url: row.source_url,
		updatedAt: row.source_updated_at,
		...(row.attribution === null ? {} : { attribution: row.attribution }),
	};
}

export class D1FacilityRepository implements FacilityRepository {
	constructor(
		private readonly database: D1Database,
		private readonly municipalityId: string,
	) {}

	private async loadStayPutZones(): Promise<StayPutZoneRecord[]> {
		try {
			const result = await this.database
				.prepare(
					`SELECT
						zone_id,
						name_ja,
						municipality_id,
						chome_json,
						area_ha,
						population,
						polygon_json,
						source_url,
						source_updated_at
					FROM stay_put_zones
					WHERE municipality_id = ?
					ORDER BY zone_id`,
				)
				.bind(this.municipalityId)
				.all<D1StayPutZoneRow>();

			return result.results.flatMap((row) => {
				const zone = mapD1StayPutZoneRow(row);
				return zone === undefined ? [] : [zone];
			});
		} catch {
			return [];
		}
	}

	async load(): Promise<FacilityRepositorySnapshot> {
		const [facilityResult, metadataResult, stayPutZones] = await Promise.all([
			this.database
				.prepare(
					`SELECT
						facility_id,
						name_ja,
						name_en,
						name_zh_hans,
						facility_type,
						municipality_id,
						address,
						latitude,
						longitude,
						accessibility,
						source_url,
						source_updated_at
					FROM facilities
					WHERE municipality_id = ?`,
				)
				.bind(this.municipalityId)
				.all<D1FacilityRow>(),
			this.database
				.prepare(
					`SELECT
						source_name,
						source_url,
						source_updated_at,
						realtime,
						attribution
					FROM dataset_meta
					ORDER BY id`,
				)
				.all<D1DatasetMetaRow>(),
			this.loadStayPutZones(),
		]);

		const metadataRows = metadataResult.results;

		return {
			catalogue:
				metadataRows.length === 0
					? {
							connected: false,
							sources: [],
							note: "No facility dataset metadata is available.",
						}
					: {
							connected: true,
							sources: metadataRows.map(mapD1DatasetMetaRow),
							// A multi-source catalogue is confirmed only when every
							// publisher explicitly marks its dataset as realtime.
							realtime: metadataRows.every((metadata) => metadata.realtime === 1),
						},
			facilities: facilityResult.results.map(mapD1FacilityRow),
			stayPutZones,
		};
	}
}
