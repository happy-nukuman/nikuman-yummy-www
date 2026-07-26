import { isDisasterType, type DisasterType } from "./disaster";
import type { LocalizedText } from "./localization";

export type Shelter = {
	id: string;
	name: LocalizedText;
	address: string;
	latitude: number;
	longitude: number;
	supportedDisasters: DisasterType[];
	facilities: string[];
	source: string;
	sourceUpdatedAt?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isLocalizedText(value: unknown): value is LocalizedText {
	if (!isRecord(value) || typeof value.ja !== "string") {
		return false;
	}

	return (
		(value.en === undefined || typeof value.en === "string") &&
		(value.zhHans === undefined || typeof value.zhHans === "string")
	);
}

export function isShelter(value: unknown): value is Shelter {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.id === "string" &&
		isLocalizedText(value.name) &&
		typeof value.address === "string" &&
		typeof value.latitude === "number" &&
		Number.isFinite(value.latitude) &&
		typeof value.longitude === "number" &&
		Number.isFinite(value.longitude) &&
		Array.isArray(value.supportedDisasters) &&
		value.supportedDisasters.every(isDisasterType) &&
		isStringArray(value.facilities) &&
		typeof value.source === "string" &&
		(value.sourceUpdatedAt === undefined || typeof value.sourceUpdatedAt === "string")
	);
}
