import type { AlertsResponse } from "@nikuman-yummy/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import type { DemoAlertRow } from "../repositories/demo-alert-repository";
import { JMA_QUAKE_LIST_FIXTURE } from "../services/jma-quake-list.fixture";

// Shortly after the 岩手県沖 M6.1 event in the captured JMA feed.
const AFTER_IWATE_EVENT = new Date("2026-06-28T06:00:00+09:00");

const DEMO_ROW: DemoAlertRow = {
	id: "demo-fire-1a2b3c4d",
	type: "fire",
	title_ja: "火災(デモ)",
	title_en: "Fire (demo)",
	title_zh_hans: "火灾(演示)",
	issued_at: "2026-06-27T21:30:00.000Z",
	source: "demo-mock",
};

function createReadOnlyDatabase(rows: DemoAlertRow[]): D1Database {
	return {
		prepare: () => ({ all: async () => ({ results: rows }) }),
	} as unknown as D1Database;
}

function stubJmaFetch(response: () => Promise<Response>): void {
	vi.stubGlobal("fetch", vi.fn(response));
}

async function alertsRequest(database?: D1Database): Promise<Response> {
	return await createApp().request(
		"/api/alerts",
		undefined,
		database === undefined ? {} : { DB: database },
	);
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ["Date"] });
	vi.setSystemTime(AFTER_IWATE_EVENT);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("GET /api/alerts", () => {
	it("merges demo alerts and JMA earthquakes with both sources reported ok", async () => {
		stubJmaFetch(async () => new Response(JSON.stringify(JMA_QUAKE_LIST_FIXTURE)));

		const response = await alertsRequest(createReadOnlyDatabase([DEMO_ROW]));
		const body = await response.json<AlertsResponse>();

		expect(response.status).toBe(200);
		expect(body.alerts.map((alert) => alert.id)).toEqual([
			"demo-fire-1a2b3c4d",
			"jma-20260628052159",
		]);
		expect(body.sources).toEqual([
			{
				name: "demo-mock",
				url: "/api/demo/alerts",
				realtime: false,
				status: "ok",
				updatedAt: "2026-06-27T21:30:00.000Z",
			},
			{
				name: "気象庁 (JMA)",
				url: "https://www.jma.go.jp/bosai/quake/data/list.json",
				realtime: true,
				status: "ok",
				updatedAt: "2026-06-27T22:25:00.000Z",
			},
		]);
	});

	it("still returns demo alerts with HTTP 200 when the JMA feed fails", async () => {
		stubJmaFetch(async () => {
			throw new Error("JMA feed unreachable");
		});

		const response = await alertsRequest(createReadOnlyDatabase([DEMO_ROW]));
		const body = await response.json<AlertsResponse>();

		expect(response.status).toBe(200);
		expect(body.alerts.map((alert) => alert.id)).toEqual([
			"demo-fire-1a2b3c4d",
		]);
		expect(body.sources.map((source) => source.status)).toEqual([
			"ok",
			"unavailable",
		]);
	});

	it("reports the demo source unavailable without a D1 binding", async () => {
		stubJmaFetch(async () => new Response(JSON.stringify(JMA_QUAKE_LIST_FIXTURE)));

		const response = await alertsRequest();
		const body = await response.json<AlertsResponse>();

		expect(response.status).toBe(200);
		expect(body.alerts.map((alert) => alert.id)).toEqual([
			"jma-20260628052159",
		]);
		expect(body.sources.map((source) => source.status)).toEqual([
			"unavailable",
			"ok",
		]);
	});

	it("keeps HTTP 200 when the demo store read fails", async () => {
		stubJmaFetch(async () => new Response(JSON.stringify(JMA_QUAKE_LIST_FIXTURE)));
		const database = {
			prepare: () => {
				throw new Error("D1 read failure");
			},
		} as unknown as D1Database;

		const response = await alertsRequest(database);
		const body = await response.json<AlertsResponse>();

		expect(response.status).toBe(200);
		expect(body.sources.map((source) => source.status)).toEqual([
			"unavailable",
			"ok",
		]);
	});
});
