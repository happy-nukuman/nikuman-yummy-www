import type { DemoShelterNearbyResponse, HelloResponse } from "@nikuman-yummy/shared";
import { isDemoShelterNearbyRequest } from "@nikuman-yummy/shared";
import { calculateDistance } from "../geo/calculate-distance";

// Mirrors BACKEND/japan-disaster-relief-api/src/config/demo-shelters.ts — the
// fixed Shinjuku open-data snapshot used by the demo endpoint (not realtime).
const DEMO_SHELTERS = [
	{
		facilityId: "demo-shinjuku-nishi-shinjuku-elementary",
		nameJa: "西新宿小学校",
		addressJa: "東京都新宿区西新宿4-35-5",
		latitude: 35.68602,
		longitude: 139.68748,
	},
	{
		facilityId: "demo-shinjuku-nishi-shinjuku-junior-high",
		nameJa: "西新宿中学校",
		addressJa: "東京都新宿区西新宿8-2-44",
		latitude: 35.6963,
		longitude: 139.69505,
	},
	{
		facilityId: "demo-shinjuku-kashiwagi-elementary",
		nameJa: "柏木小学校",
		addressJa: "東京都新宿区北新宿2-11-1",
		latitude: 35.70024,
		longitude: 139.6895,
	},
	{
		facilityId: "demo-shinjuku-metropolitan-high-school",
		nameJa: "都立新宿高等学校",
		addressJa: "東京都新宿区内藤町11-4",
		latitude: 35.68932,
		longitude: 139.70537,
	},
	{
		facilityId: "demo-shinjuku-yodobashi-fourth-elementary",
		nameJa: "淀橋第四小学校",
		addressJa: "東京都新宿区北新宿3-17-1",
		latitude: 35.70396,
		longitude: 139.69121,
	},
	{
		facilityId: "demo-shinjuku-okubo-elementary",
		nameJa: "大久保小学校",
		addressJa: "東京都新宿区大久保1-1-21",
		latitude: 35.69895,
		longitude: 139.70615,
	},
	{
		facilityId: "demo-shinjuku-tenjin-elementary",
		nameJa: "天神小学校",
		addressJa: "東京都新宿区新宿6-14-2",
		latitude: 35.69531,
		longitude: 139.70984,
	},
	{
		facilityId: "demo-shinjuku-toyama-elementary",
		nameJa: "戸山小学校",
		addressJa: "東京都新宿区百人町2-1-38",
		latitude: 35.70296,
		longitude: 139.70207,
	},
	{
		facilityId: "demo-shinjuku-junior-high",
		nameJa: "新宿中学校",
		addressJa: "東京都新宿区新宿6-15-22",
		latitude: 35.69507,
		longitude: 139.71135,
	},
	{
		facilityId: "demo-shinjuku-tokyo-medical-university",
		nameJa: "東京医科大学",
		addressJa: "東京都新宿区新宿6-1-1",
		latitude: 35.69355,
		longitude: 139.71225,
	},
] as const;

const DEMO_SHELTER_SOURCE = {
	name: "新宿区の避難所情報",
	url: "https://catalog.data.metro.tokyo.lg.jp/dataset/t131041d0000000055",
	updatedAt: "2025-12-12",
	realtime: false,
} as const;

const DEMO_SEARCH_RADIUS_METERS = 3_000;
const DEMO_DEFAULT_LIMIT = 5;

// Same contract as the backend service: validate, Haversine, 3 km filter,
// ascending distance, limit truncation, Google Maps place URL.
function buildDemoShelterNearbyResponse(body: unknown): DemoShelterNearbyResponse {
	if (!isDemoShelterNearbyRequest(body)) {
		throw new Error(
			"Mock POST /api/demo/shelters/nearby requires numeric latitude/longitude (limit 1-10).",
		);
	}

	const origin = { latitude: body.latitude, longitude: body.longitude };
	const limit = body.limit ?? DEMO_DEFAULT_LIMIT;

	const facilities = DEMO_SHELTERS.map((shelter) => ({
		facilityId: shelter.facilityId,
		nameJa: shelter.nameJa,
		addressJa: shelter.addressJa,
		latitude: shelter.latitude,
		longitude: shelter.longitude,
		distanceMeters: Math.round(
			calculateDistance(origin, { latitude: shelter.latitude, longitude: shelter.longitude }),
		),
		googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
			`${shelter.latitude},${shelter.longitude}`,
		)}`,
	}))
		.filter((facility) => facility.distanceMeters <= DEMO_SEARCH_RADIUS_METERS)
		.sort((a, b) => a.distanceMeters - b.distanceMeters)
		.slice(0, limit);

	return {
		dataStatus: "not_realtime",
		origin,
		searchRadiusMeters: DEMO_SEARCH_RADIUS_METERS,
		source: DEMO_SHELTER_SOURCE,
		facilities,
		limitations: {
			openStatus: "unknown",
			routeStatus: "unknown",
		},
	};
}

type MockResolver = unknown | ((body: unknown) => unknown);

const mocks = new Map<string, MockResolver>([
	["GET /api/hello", { message: "hello world!" } satisfies HelloResponse],
	["POST /api/demo/shelters/nearby", buildDemoShelterNearbyResponse],
]);

async function waitForMockLatency(signal: AbortSignal): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const handleResolve = () => {
			signal.removeEventListener("abort", handleAbort);
			resolve();
		};
		const handleAbort = () => {
			globalThis.clearTimeout(timeoutId);
			reject(new DOMException("Mock request aborted.", "AbortError"));
		};
		const timeoutId = globalThis.setTimeout(handleResolve, 300);

		if (signal.aborted) {
			handleAbort();
		} else {
			signal.addEventListener("abort", handleAbort, { once: true });
		}
	});
}

export async function getMockResponse<T>(
	method: "GET" | "POST",
	path: string,
	signal: AbortSignal,
	body?: unknown,
): Promise<T> {
	const mock = mocks.get(`${method} ${path}`);
	if (mock === undefined) {
		throw new Error(`No mock registered for ${method} ${path}`);
	}

	await waitForMockLatency(signal);
	return (typeof mock === "function" ? mock(body) : mock) as T;
}
