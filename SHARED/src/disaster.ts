import type { LocalizedText } from "./localization";

export const DISASTER_TYPES = [
	"earthquake",
	"tsunami",
	"flood",
	"landslide",
	"volcanic",
] as const;

export type DisasterType = (typeof DISASTER_TYPES)[number];

export type DisasterAlert = {
	id: string;
	type: DisasterType;
	title: LocalizedText;
	issuedAt: string;
	source: string;
	sourceUpdatedAt?: string;
};

export function isDisasterType(value: unknown): value is DisasterType {
	return typeof value === "string" && DISASTER_TYPES.includes(value as DisasterType);
}
