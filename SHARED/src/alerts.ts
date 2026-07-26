import { isDisasterType, type DisasterAlert, type DisasterType } from "./disaster";
import type { LocalizedText } from "./localization";

export type AlertSourceStatus = {
	name: string;
	url: string;
	realtime: boolean;
	status: "ok" | "unavailable";
	updatedAt: string | null;
};

export type AlertsResponse = {
	alerts: DisasterAlert[];
	sources: AlertSourceStatus[];
};

export type DemoAlertCreateRequest = {
	type: DisasterType;
	title?: LocalizedText;
};

export type DemoAlertCreateResponse = {
	alert: DisasterAlert;
};

export type DemoAlertClearResponse = {
	cleared: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLocalizedText(value: unknown): value is LocalizedText {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.ja === "string" &&
		(value.en === undefined || typeof value.en === "string") &&
		(value.zhHans === undefined || typeof value.zhHans === "string")
	);
}

export function isDemoAlertCreateRequest(value: unknown): value is DemoAlertCreateRequest {
	if (!isRecord(value)) {
		return false;
	}

	return (
		isDisasterType(value.type) &&
		(value.title === undefined || isLocalizedText(value.title))
	);
}
