import type {
	AlertSourceStatus,
	AlertsResponse,
	DisasterAlert,
	LocalizedText,
} from "@nikuman-yummy/shared";
import {
	DEMO_ALERT_SOURCE_NAME,
	DEMO_ALERT_SOURCE_URL,
	JMA_QUAKE_LIST_URL,
	JMA_SOURCE_NAME,
} from "../config/alerts";
import type { DemoAlertRepository } from "../repositories/demo-alert-repository";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type AlertSourceResult = {
	source: AlertSourceStatus;
	alerts: DisasterAlert[];
};

// JMA reports 最大震度 with these codes; "-" / "+" stand for 弱 / 強.
const JMA_INTENSITY_CODES: readonly string[] = [
	"1",
	"2",
	"3",
	"4",
	"5-",
	"5+",
	"6-",
	"6+",
	"7",
];

// Demo-stage thresholds. These are product choices for the contest demo, not
// official JMA advisory criteria: the feed lists every observed quake (mostly
// 震度1), and the demo only needs events a person in Japan would actually feel.
const JMA_MIN_INTENSITY_CODE = "3";
const JMA_MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;

const JMA_MIN_INTENSITY_RANK = JMA_INTENSITY_CODES.indexOf(
	JMA_MIN_INTENSITY_CODE,
);
const JMA_FETCH_TIMEOUT_MS = 5_000;
// Tolerate a small clock difference between the Worker and the feed rather than
// dropping the freshest event; anything further ahead is not a credible event time.
const JMA_MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const UNKNOWN_EPICENTER_JA = "震源地不明";

type JmaQuakeReport = {
	eventId: string;
	reportId: string;
	issuedAt: string;
	reportedAt: string | null;
	epicenterJa: string;
	epicenterEn: string;
	magnitude: string;
	intensityCode: string;
	/** 1 when the report names both epicenter and magnitude, 0 for a 震度速報. */
	detail: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value : "";
}

function toIsoTimestamp(value: string): string | null {
	if (value === "") {
		return null;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeIntensityCode(value: string): string {
	return value.replace("弱", "-").replace("強", "+");
}

export function jmaIntensityRank(value: string): number | null {
	const rank = JMA_INTENSITY_CODES.indexOf(normalizeIntensityCode(value));
	return rank === -1 ? null : rank;
}

function toQuakeReport(entry: unknown, now: Date): JmaQuakeReport | null {
	if (!isRecord(entry)) {
		return null;
	}

	const eventId = readString(entry, "eid");
	const issuedAt = toIsoTimestamp(readString(entry, "at"));
	const intensityCode = normalizeIntensityCode(readString(entry, "maxi"));
	const intensityRank = jmaIntensityRank(intensityCode);

	if (eventId === "" || issuedAt === null || intensityRank === null) {
		// Entries such as 震源に関する情報 carry no 最大震度 and cannot be checked
		// against the demo threshold, so they are skipped.
		return null;
	}

	const ageMs = now.getTime() - new Date(issuedAt).getTime();

	if (
		intensityRank < JMA_MIN_INTENSITY_RANK ||
		ageMs > JMA_MAX_EVENT_AGE_MS ||
		ageMs < -JMA_MAX_FUTURE_SKEW_MS
	) {
		return null;
	}

	const epicenterJa = readString(entry, "anm");
	const magnitude = readString(entry, "mag");

	return {
		eventId,
		reportId: readString(entry, "ctt"),
		issuedAt,
		reportedAt: toIsoTimestamp(readString(entry, "rdt")),
		epicenterJa,
		epicenterEn: readString(entry, "en_anm"),
		magnitude,
		intensityCode,
		detail: epicenterJa !== "" && magnitude !== "" ? 1 : 0,
	};
}

/**
 * The feed repeats one event (same `eid`) as several reports: a preliminary
 * 震度速報 without epicenter, then 震源・震度情報, sometimes followed by an update
 * that drops 最大震度 entirely. Prefer the most detailed report, then the newest
 * publication (`ctt`), so one quake becomes exactly one alert.
 */
function chooseBetterReport(
	left: JmaQuakeReport,
	right: JmaQuakeReport,
): JmaQuakeReport {
	if (left.detail !== right.detail) {
		return left.detail > right.detail ? left : right;
	}
	return left.reportId >= right.reportId ? left : right;
}

function buildQuakeTitle(report: JmaQuakeReport): LocalizedText {
	const epicenterJa =
		report.epicenterJa === "" ? UNKNOWN_EPICENTER_JA : report.epicenterJa;
	const magnitudeJa = report.magnitude === "" ? [] : [`M${report.magnitude}`];
	const ja = [
		epicenterJa,
		...magnitudeJa,
		`最大震度${report.intensityCode}`,
	].join(" ");

	if (report.epicenterEn === "") {
		// zhHans is never filled here: the feed ships ja/en only and translating
		// safety-relevant official wording server-side is out of scope (PRD §7.2).
		return { ja };
	}

	return {
		ja,
		en: [
			report.epicenterEn,
			...magnitudeJa,
			`max JMA intensity ${report.intensityCode}`,
		].join(" "),
	};
}

function toQuakeAlert(report: JmaQuakeReport): DisasterAlert {
	const magnitude = Number.parseFloat(report.magnitude);
	// Structured parts let the frontend language packs compose localized alert
	// text; the backend never translates safety wording or epicenter proper nouns.
	const epicenter: LocalizedText | undefined =
		report.epicenterJa === ""
			? undefined
			: report.epicenterEn === ""
				? { ja: report.epicenterJa }
				: { ja: report.epicenterJa, en: report.epicenterEn };

	return {
		id: `jma-${report.eventId}`,
		type: "earthquake",
		title: buildQuakeTitle(report),
		issuedAt: report.issuedAt,
		source: JMA_SOURCE_NAME,
		...(report.reportedAt === null
			? {}
			: { sourceUpdatedAt: report.reportedAt }),
		...(epicenter === undefined ? {} : { epicenter }),
		...(Number.isFinite(magnitude) ? { magnitude } : {}),
		jmaMaxIntensity: report.intensityCode,
	};
}

function compareByIssuedAtDescending(
	left: DisasterAlert,
	right: DisasterAlert,
): number {
	if (left.issuedAt !== right.issuedAt) {
		return left.issuedAt < right.issuedAt ? 1 : -1;
	}
	return left.id.localeCompare(right.id);
}

/**
 * Pure mapping of the JMA quake list payload. Throws when the payload is not an
 * array; individual malformed entries are skipped instead.
 */
export function mapJmaQuakeListToAlerts(
	payload: unknown,
	now: Date,
): DisasterAlert[] {
	if (!Array.isArray(payload)) {
		throw new TypeError("JMA quake list payload is not an array.");
	}

	const bestByEvent = new Map<string, JmaQuakeReport>();

	for (const entry of payload) {
		const report = toQuakeReport(entry, now);

		if (report === null) {
			continue;
		}

		const current = bestByEvent.get(report.eventId);
		bestByEvent.set(
			report.eventId,
			current === undefined ? report : chooseBetterReport(current, report),
		);
	}

	return [...bestByEvent.values()]
		.map(toQuakeAlert)
		.sort(compareByIssuedAtDescending);
}

/** Newest report publication time in the feed, used as honest source freshness. */
export function latestJmaFeedUpdate(payload: unknown): string | null {
	if (!Array.isArray(payload)) {
		return null;
	}

	let latest: string | null = null;

	for (const entry of payload) {
		if (!isRecord(entry)) {
			continue;
		}

		const reportedAt = toIsoTimestamp(readString(entry, "rdt"));

		if (reportedAt !== null && (latest === null || reportedAt > latest)) {
			latest = reportedAt;
		}
	}

	return latest;
}

function jmaSourceStatus(
	status: AlertSourceStatus["status"],
	updatedAt: string | null,
): AlertSourceStatus {
	return {
		name: JMA_SOURCE_NAME,
		url: JMA_QUAKE_LIST_URL,
		realtime: true,
		status,
		updatedAt,
	};
}

function demoSourceStatus(
	status: AlertSourceStatus["status"],
	updatedAt: string | null,
): AlertSourceStatus {
	return {
		name: DEMO_ALERT_SOURCE_NAME,
		url: DEMO_ALERT_SOURCE_URL,
		realtime: false,
		status,
		updatedAt,
	};
}

function latestIssuedAt(alerts: readonly DisasterAlert[]): string | null {
	let latest: string | null = null;

	for (const alert of alerts) {
		if (latest === null || alert.issuedAt > latest) {
			latest = alert.issuedAt;
		}
	}

	return latest;
}

export async function loadJmaEarthquakeAlerts(
	fetchImpl: FetchLike,
	now: Date,
): Promise<AlertSourceResult> {
	try {
		const response = await fetchImpl(JMA_QUAKE_LIST_URL, {
			headers: { accept: "application/json" },
			signal: AbortSignal.timeout(JMA_FETCH_TIMEOUT_MS),
		});

		if (!response.ok) {
			throw new Error(
				`JMA quake list responded with status ${response.status}.`,
			);
		}

		const payload: unknown = await response.json();

		return {
			source: jmaSourceStatus("ok", latestJmaFeedUpdate(payload)),
			alerts: mapJmaQuakeListToAlerts(payload, now),
		};
	} catch {
		// Timeout, network failure, non-2xx or malformed payload: report the source
		// as unavailable and keep the rest of the response intact (PRD §9).
		return { source: jmaSourceStatus("unavailable", null), alerts: [] };
	}
}

export async function loadDemoAlerts(
	repository: DemoAlertRepository | null,
): Promise<AlertSourceResult> {
	if (repository === null) {
		return { source: demoSourceStatus("unavailable", null), alerts: [] };
	}

	try {
		const alerts = await repository.list();
		return {
			source: demoSourceStatus("ok", latestIssuedAt(alerts)),
			alerts,
		};
	} catch {
		return { source: demoSourceStatus("unavailable", null), alerts: [] };
	}
}

function defaultFetch(input: string, init?: RequestInit): Promise<Response> {
	return fetch(input, init);
}

export class AlertService {
	constructor(
		private readonly demoAlerts: DemoAlertRepository | null,
		private readonly fetchImpl: FetchLike = defaultFetch,
		private readonly clock: () => Date = () => new Date(),
	) {}

	/**
	 * Both sources degrade independently: a failing JMA fetch never removes demo
	 * alerts, and a missing D1 binding never hides the JMA feed.
	 */
	async list(): Promise<AlertsResponse> {
		const now = this.clock();
		const [demo, jma] = await Promise.all([
			loadDemoAlerts(this.demoAlerts),
			loadJmaEarthquakeAlerts(this.fetchImpl, now),
		]);

		return {
			alerts: [...demo.alerts, ...jma.alerts].sort(
				compareByIssuedAtDescending,
			),
			sources: [demo.source, jma.source],
		};
	}
}
