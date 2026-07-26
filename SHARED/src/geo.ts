import type { LocalizedText } from "./localization";

export type Municipality = {
	municipalityId: string;
	name: LocalizedText;
};

export type MunicipalityMatchRequest = {
	latitude: number;
	longitude: number;
};

export type MunicipalityMatchResponse = {
	municipalityId: string | null;
	municipalityName: LocalizedText | null;
	matched: boolean;
};

export type MunicipalityListResponse = {
	municipalities: Municipality[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isMunicipalityMatchRequest(value: unknown): value is MunicipalityMatchRequest {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.latitude === "number" &&
		Number.isFinite(value.latitude) &&
		typeof value.longitude === "number" &&
		Number.isFinite(value.longitude)
	);
}
