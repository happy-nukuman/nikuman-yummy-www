import type { LocalizedText } from "./localization";

export const FACILITY_TYPES = ["evacuation_area", "evacuation_shelter"] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];

export const DATA_STATUSES = ["confirmed", "not_realtime", "unknown", "unavailable"] as const;
export type DataStatus = (typeof DATA_STATUSES)[number];

export type FacilityCandidate = {
	facilityId: string;
	name: LocalizedText;
	facilityType: FacilityType;
	municipalityId: string;
	address: string;
	latitude: number;
	longitude: number;
	distanceMeters: number | null;
	accessibility?: string[];
	openStatus?: "open" | "closed";
	statusUpdatedAt?: string;
	sourceUrl: string;
	sourceUpdatedAt: string;
};

export type FacilitySearchRequest = {
	municipalityId: string;
	latitude?: number;
	longitude?: number;
	facilityTypes?: FacilityType[];
	accessibilityNeeds?: string[];
};

export type FacilitySource = {
	name: string;
	url: string;
	updatedAt: string;
	attribution?: string;
};

export type StayPutZone = {
	zoneId: string;
	name: LocalizedText;
	municipalityId: string;
	chome: string[];
	areaHa: number | null;
	population: number | null;
	sourceUrl: string;
	sourceUpdatedAt: string;
};

export type StayPutStatus = "in_zone" | "outside_zone" | "undetermined";

export type FacilitySearchResponse = {
	dataStatus: DataStatus;
	sources: FacilitySource[];
	stayPutStatus: StayPutStatus;
	stayPutZones: StayPutZone[];
	facilities: FacilityCandidate[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isFacilityType(value: unknown): value is FacilityType {
	return typeof value === "string" && FACILITY_TYPES.includes(value as FacilityType);
}

export function isDataStatus(value: unknown): value is DataStatus {
	return typeof value === "string" && DATA_STATUSES.includes(value as DataStatus);
}

export function isFacilitySearchRequest(value: unknown): value is FacilitySearchRequest {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.municipalityId === "string" &&
		value.municipalityId.trim().length > 0 &&
		(value.latitude === undefined ||
			(typeof value.latitude === "number" && Number.isFinite(value.latitude))) &&
		(value.longitude === undefined ||
			(typeof value.longitude === "number" && Number.isFinite(value.longitude))) &&
		(value.facilityTypes === undefined ||
			(Array.isArray(value.facilityTypes) && value.facilityTypes.every(isFacilityType))) &&
		(value.accessibilityNeeds === undefined || isStringArray(value.accessibilityNeeds))
	);
}
