import type { LocalizedText } from "./localization";

export const DISASTER_TYPES = [
	"earthquake",
	"tsunami",
	"flood",
	"landslide",
	"volcanic",
	// "fire" has no public realtime feed in Tokyo (東京消防庁 publishes no open API),
	// so it only ever reaches the API through the demo-mock alert source.
	"fire",
] as const;

export type DisasterType = (typeof DISASTER_TYPES)[number];

export type DisasterAlert = {
	id: string;
	type: DisasterType;
	title: LocalizedText;
	issuedAt: string;
	source: string;
	sourceUpdatedAt?: string;
	// Structured parts for frontend i18n composition. The backend does NOT
	// machine-translate safety wording or epicenter proper nouns (PRD §7.2);
	// frontend reviewed language packs compose localized sentences from these.
	epicenter?: LocalizedText;
	magnitude?: number;
	// JMA 震度 scale code (e.g. "3", "5-", "6+"), NOT a numeric magnitude.
	jmaMaxIntensity?: string;
};

export function isDisasterType(value: unknown): value is DisasterType {
	return typeof value === "string" && DISASTER_TYPES.includes(value as DisasterType);
}
