import type {
	FacilityCandidate,
	FacilitySearchRequest,
	FacilitySearchResponse,
	StayPutStatus,
	StayPutZone,
} from "@nikuman-yummy/shared";
import {
	FACILITY_CATALOGUE,
	FACILITY_DATASET,
} from "../config/facilities";
import { MUNICIPALITIES } from "../config/municipalities";
import {
	haversineDistanceMeters,
	pointInPolygon,
} from "../lib/geo";
import { StaticFacilityRepository } from "../repositories/facility-repository";
import type {
	FacilityRecord,
	FacilityRepository,
	FacilityRepositorySnapshot,
	StayPutZoneRecord,
} from "../repositories/facility-repository";

// TBD-08: keep this adjustable once product ranking and result-count rules are confirmed.
const DEFAULT_FACILITY_RESULT_LIMIT = 20;
const KNOWN_MUNICIPALITY_IDS = new Set(
	MUNICIPALITIES.map((municipality) => municipality.municipalityId),
);

function compareJapaneseNames(
	left: FacilityCandidate,
	right: FacilityCandidate,
): number {
	if (left.name.ja < right.name.ja) {
		return -1;
	}
	if (left.name.ja > right.name.ja) {
		return 1;
	}
	return left.facilityId.localeCompare(right.facilityId);
}

function hasAllAccessibilityNeeds(
	facility: FacilityRecord,
	accessibilityNeeds: readonly string[],
): boolean {
	const accessibility = facility.accessibility ?? [];
	return accessibilityNeeds.every((need) => accessibility.includes(need));
}

function toCandidate(
	facility: FacilityRecord,
	request: FacilitySearchRequest,
): FacilityCandidate {
	const latitude = request.latitude;
	const longitude = request.longitude;
	const hasCoordinates =
		typeof latitude === "number" &&
		Number.isFinite(latitude) &&
		typeof longitude === "number" &&
		Number.isFinite(longitude);

	return {
		...facility,
		distanceMeters:
			hasCoordinates
			? Math.round(
					haversineDistanceMeters(
						{
							latitude,
							longitude,
						},
						facility,
					),
				)
			: null,
	};
}

function toStayPutZone(zone: StayPutZoneRecord): StayPutZone {
	return {
		zoneId: zone.zoneId,
		name: zone.name,
		municipalityId: zone.municipalityId,
		chome: zone.chome,
		areaHa: zone.areaHa,
		population: zone.population,
		sourceUrl: zone.sourceUrl,
		sourceUpdatedAt: zone.sourceUpdatedAt,
	};
}

function getStayPutStatus(
	request: FacilitySearchRequest,
	zones: readonly StayPutZoneRecord[],
): StayPutStatus {
	const latitude = request.latitude;
	const longitude = request.longitude;

	if (
		typeof latitude !== "number" ||
		!Number.isFinite(latitude) ||
		typeof longitude !== "number" ||
		!Number.isFinite(longitude)
	) {
		return "undetermined";
	}

	const polygons = zones.flatMap((zone) =>
		zone.polygon === null ? [] : [zone.polygon],
	);

	if (polygons.length === 0) {
		return "undetermined";
	}

	return polygons.some((polygon) =>
		pointInPolygon({ latitude, longitude }, polygon),
	)
		? "in_zone"
		: "outside_zone";
}

function buildResponse(
	snapshot: FacilityRepositorySnapshot,
	request: FacilitySearchRequest,
): FacilitySearchResponse {
	const zoneRecords = snapshot.stayPutZones.filter(
		(zone) => zone.municipalityId === request.municipalityId,
	);
	const stayPutStatus = getStayPutStatus(request, zoneRecords);
	const stayPutZones = zoneRecords.map(toStayPutZone);

	if (!snapshot.catalogue.connected || snapshot.catalogue.sources.length === 0) {
		return {
			dataStatus: "unknown",
			sources: [],
			stayPutStatus,
			stayPutZones,
			facilities: [],
		};
	}

	const facilityTypes = request.facilityTypes ?? [];
	const accessibilityNeeds = request.accessibilityNeeds ?? [];
	const hasCoordinates =
		typeof request.latitude === "number" &&
		Number.isFinite(request.latitude) &&
		typeof request.longitude === "number" &&
		Number.isFinite(request.longitude);
	const municipalityIsKnown = KNOWN_MUNICIPALITY_IDS.has(request.municipalityId);

	const facilities = municipalityIsKnown
		? snapshot.facilities
				.filter((facility) => facility.municipalityId === request.municipalityId)
				.filter(
					(facility) =>
						facilityTypes.length === 0 ||
						facilityTypes.includes(facility.facilityType),
				)
				.filter((facility) =>
					hasAllAccessibilityNeeds(facility, accessibilityNeeds),
				)
				.map((facility) => toCandidate(facility, request))
				.sort((left, right) =>
					hasCoordinates
						? (left.distanceMeters ?? Number.POSITIVE_INFINITY) -
								(right.distanceMeters ?? Number.POSITIVE_INFINITY) ||
							compareJapaneseNames(left, right)
						: compareJapaneseNames(left, right),
				)
				.slice(0, DEFAULT_FACILITY_RESULT_LIMIT)
		: [];

	return {
		// Readable catalogue data is confirmed only when every source is realtime;
		// an empty municipality result remains a successful catalogue read.
		dataStatus: snapshot.catalogue.realtime ? "confirmed" : "not_realtime",
		sources: snapshot.catalogue.sources,
		stayPutStatus,
		stayPutZones,
		facilities,
	};
}

/**
 * Catalogue-level status contract:
 * - disconnected or source-less snapshots are unknown and expose no facilities;
 * - readable snapshots are confirmed only when every source is realtime;
 * - repository failures are unavailable and degrade to an empty HTTP 200 payload.
 */
export class FacilityService {
	constructor(private readonly repository: FacilityRepository) {}

	async search(request: FacilitySearchRequest): Promise<FacilitySearchResponse> {
		try {
			const snapshot = await this.repository.load();
			return buildResponse(snapshot, request);
		} catch {
			return {
				dataStatus: "unavailable",
				sources: [],
				stayPutStatus: "undetermined",
				stayPutZones: [],
				facilities: [],
			};
		}
	}
}

export const facilityService = new FacilityService(
	new StaticFacilityRepository(FACILITY_DATASET, FACILITY_CATALOGUE),
);
