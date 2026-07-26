import type { DisasterAlert } from "@nikuman-yummy/shared";
import { describe, expect, it, vi } from "vitest";
import type { DemoAlertRepository } from "../repositories/demo-alert-repository";
import {
	AlertService,
	jmaIntensityRank,
	latestJmaFeedUpdate,
	loadDemoAlerts,
	loadJmaEarthquakeAlerts,
	mapJmaQuakeListToAlerts,
	type FetchLike,
} from "./alert-service";
import { JMA_QUAKE_LIST_FIXTURE } from "./jma-quake-list.fixture";

// Both instants come from the captured feed: shortly after the 岩手県沖 M6.1 event,
// and shortly after the 福島県会津 M3.6 event a day earlier.
const AFTER_IWATE_EVENT = new Date("2026-06-28T06:00:00+09:00");
const AFTER_AIZU_EVENT = new Date("2026-06-27T04:00:00+09:00");

const DEMO_ALERT: DisasterAlert = {
	id: "demo-fire-abcd1234",
	type: "fire",
	title: { ja: "火災(デモ)", en: "Fire (demo)", zhHans: "火灾(演示)" },
	issuedAt: "2026-06-27T21:30:00.000Z",
	source: "demo-mock",
};

function createJsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function createFixtureFetch(): FetchLike {
	return vi.fn(async () => createJsonResponse(JMA_QUAKE_LIST_FIXTURE));
}

function createRepository(alerts: DisasterAlert[]): DemoAlertRepository {
	return {
		list: vi.fn().mockResolvedValue(alerts),
		create: vi.fn(),
		clear: vi.fn(),
	};
}

describe("jmaIntensityRank", () => {
	it("ranks the feed notation in ascending intensity order", () => {
		const rank3 = jmaIntensityRank("3");
		const rank5Weak = jmaIntensityRank("5-");
		const rank6Strong = jmaIntensityRank("6+");

		expect(rank3).not.toBeNull();
		expect(rank5Weak).not.toBeNull();
		expect(rank3 ?? 0).toBeLessThan(rank5Weak ?? 0);
		expect(rank5Weak ?? 0).toBeLessThan(rank6Strong ?? 0);
	});

	it("accepts the 弱/強 spelling of the same codes", () => {
		expect(jmaIntensityRank("5弱")).toBe(jmaIntensityRank("5-"));
		expect(jmaIntensityRank("6強")).toBe(jmaIntensityRank("6+"));
	});

	it.each(["", "0", "unknown", "8"])(
		"returns null for the unusable intensity code %s",
		(code) => {
			expect(jmaIntensityRank(code)).toBeNull();
		},
	);
});

describe("mapJmaQuakeListToAlerts", () => {
	it("maps the newest qualifying event from the real feed capture", () => {
		expect(
			mapJmaQuakeListToAlerts(JMA_QUAKE_LIST_FIXTURE, AFTER_IWATE_EVENT),
		).toEqual([
			{
				id: "jma-20260628052159",
				type: "earthquake",
				title: {
					ja: "岩手県沖 M6.1 最大震度5-",
					en: "Off the Coast of Iwate Prefecture M6.1 max JMA intensity 5-",
				},
				issuedAt: "2026-06-27T20:21:00.000Z",
				source: "気象庁 (JMA)",
				sourceUpdatedAt: "2026-06-27T20:26:00.000Z",
				epicenter: {
					ja: "岩手県沖",
					en: "Off the Coast of Iwate Prefecture",
				},
				magnitude: 6.1,
				jmaMaxIntensity: "5-",
			},
		]);
	});

	it("keeps one alert per event and prefers the report that names epicenter and magnitude", () => {
		const alerts = mapJmaQuakeListToAlerts(
			JMA_QUAKE_LIST_FIXTURE,
			AFTER_IWATE_EVENT,
		);

		// The feed holds three reports for eid 20260628052159, and the newest one
		// (顕著な地震の震源要素更新のお知らせ) has no 最大震度 at all.
		expect(alerts).toHaveLength(1);
		expect(alerts[0]?.title.ja).toContain("岩手県沖");
	});

	it("drops events below the demo intensity threshold and older than 24 hours", () => {
		const alerts = mapJmaQuakeListToAlerts(
			JMA_QUAKE_LIST_FIXTURE,
			AFTER_IWATE_EVENT,
		);
		const ids = alerts.map((alert) => alert.id);

		// 最大震度1 event inside the window, and 最大震度3/6- events a day earlier.
		expect(ids).not.toContain("jma-20260628024359");
		expect(ids).not.toContain("jma-20260627023300");
		expect(ids).not.toContain("jma-20260626222902");
	});

	it("sorts qualifying events by issuedAt descending and ignores future reports", () => {
		const alerts = mapJmaQuakeListToAlerts(
			JMA_QUAKE_LIST_FIXTURE,
			AFTER_AIZU_EVENT,
		);

		expect(alerts.map((alert) => alert.id)).toEqual([
			"jma-20260627023300",
			"jma-20260626231746",
			"jma-20260626222902",
		]);
		expect(alerts.map((alert) => alert.issuedAt)).toEqual([
			"2026-06-26T17:33:00.000Z",
			"2026-06-26T14:17:00.000Z",
			"2026-06-26T13:29:00.000Z",
		]);
	});

	it("uses the newest publication when two reports are equally detailed", () => {
		const alerts = mapJmaQuakeListToAlerts(
			JMA_QUAKE_LIST_FIXTURE,
			AFTER_AIZU_EVENT,
		);
		const yamanashi = alerts.find(
			(alert) => alert.id === "jma-20260626222902",
		);

		expect(yamanashi?.sourceUpdatedAt).toBe("2026-06-26T13:41:00.000Z");
		expect(yamanashi?.title.ja).toBe("山梨県東部・富士五湖 M5.6 最大震度6-");
	});

	it("skips malformed entries instead of failing the whole feed", () => {
		const alerts = mapJmaQuakeListToAlerts(
			[
				null,
				"not an entry",
				{ eid: "no-time", maxi: "5-" },
				{ eid: "bad-time", at: "not a date", maxi: "5-" },
				{
					eid: "20260628052159",
					at: "2026-06-28T05:21:00+09:00",
					anm: "岩手県沖",
					mag: "6.1",
					maxi: "5-",
				},
			],
			AFTER_IWATE_EVENT,
		);

		expect(alerts.map((alert) => alert.id)).toEqual(["jma-20260628052159"]);
		expect(alerts[0]).not.toHaveProperty("sourceUpdatedAt");
	});

	it("names an unknown epicenter instead of inventing one", () => {
		const alerts = mapJmaQuakeListToAlerts(
			[
				{
					eid: "20260628052159",
					at: "2026-06-28T05:21:00+09:00",
					anm: "",
					mag: "",
					maxi: "5-",
				},
			],
			AFTER_IWATE_EVENT,
		);

		expect(alerts[0]?.title).toEqual({ ja: "震源地不明 最大震度5-" });
		// Empty `anm`/`mag` must not yield structured fields: the backend never
		// invents an epicenter, and `magnitude` is only set when `mag` parses.
		expect(alerts[0]).not.toHaveProperty("epicenter");
		expect(alerts[0]).not.toHaveProperty("magnitude");
		expect(alerts[0]?.jmaMaxIntensity).toBe("5-");
	});

	it("omits epicenter.en when the feed ships no en_anm, keeping epicenter.ja", () => {
		const alerts = mapJmaQuakeListToAlerts(
			[
				{
					eid: "20260628052159",
					at: "2026-06-28T05:21:00+09:00",
					anm: "岩手県沖",
					mag: "6.1",
					maxi: "5-",
				},
			],
			AFTER_IWATE_EVENT,
		);

		expect(alerts[0]?.epicenter).toEqual({ ja: "岩手県沖" });
		expect(alerts[0]?.epicenter).not.toHaveProperty("en");
		expect(alerts[0]?.magnitude).toBe(6.1);
		expect(alerts[0]?.jmaMaxIntensity).toBe("5-");
	});

	it("throws when the payload is not an array", () => {
		expect(() =>
			mapJmaQuakeListToAlerts({ list: [] }, AFTER_IWATE_EVENT),
		).toThrow(TypeError);
	});
});

describe("latestJmaFeedUpdate", () => {
	it("reports the newest publication time in the feed", () => {
		expect(latestJmaFeedUpdate(JMA_QUAKE_LIST_FIXTURE)).toBe(
			"2026-06-27T22:25:00.000Z",
		);
	});

	it("returns null for a payload without usable timestamps", () => {
		expect(latestJmaFeedUpdate([{ rdt: "" }, "junk"])).toBeNull();
		expect(latestJmaFeedUpdate("junk")).toBeNull();
	});
});

describe("loadJmaEarthquakeAlerts", () => {
	it("requests the public JMA feed with a timeout signal", async () => {
		const fetchImpl = createFixtureFetch();

		const result = await loadJmaEarthquakeAlerts(fetchImpl, AFTER_IWATE_EVENT);

		expect(fetchImpl).toHaveBeenCalledWith(
			"https://www.jma.go.jp/bosai/quake/data/list.json",
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(result.source).toEqual({
			name: "気象庁 (JMA)",
			url: "https://www.jma.go.jp/bosai/quake/data/list.json",
			realtime: true,
			status: "ok",
			updatedAt: "2026-06-27T22:25:00.000Z",
		});
		expect(result.alerts).toHaveLength(1);
	});

	it.each([
		[
			"a rejected fetch",
			(): FetchLike => async () => {
				throw new Error("network down");
			},
		],
		[
			"a non-2xx response",
			(): FetchLike => async () => createJsonResponse([], 503),
		],
		[
			"a malformed payload",
			(): FetchLike => async () => createJsonResponse({ list: [] }),
		],
		[
			"a non-JSON body",
			(): FetchLike => async () => new Response("<html>error</html>"),
		],
	])("reports the source unavailable for %s", async (_label, createFetch) => {
		const result = await loadJmaEarthquakeAlerts(
			createFetch(),
			AFTER_IWATE_EVENT,
		);

		expect(result.alerts).toEqual([]);
		expect(result.source.status).toBe("unavailable");
		expect(result.source.updatedAt).toBeNull();
		expect(result.source.realtime).toBe(true);
	});
});

describe("loadDemoAlerts", () => {
	it("reports the demo source unavailable without a repository", async () => {
		const result = await loadDemoAlerts(null);

		expect(result.alerts).toEqual([]);
		expect(result.source).toEqual({
			name: "demo-mock",
			url: "/api/demo/alerts",
			realtime: false,
			status: "unavailable",
			updatedAt: null,
		});
	});

	it("reports the newest demo alert as the source freshness", async () => {
		const result = await loadDemoAlerts(createRepository([DEMO_ALERT]));

		expect(result.alerts).toEqual([DEMO_ALERT]);
		expect(result.source.status).toBe("ok");
		expect(result.source.updatedAt).toBe(DEMO_ALERT.issuedAt);
	});

	it("reports the demo source unavailable when the store read fails", async () => {
		const repository: DemoAlertRepository = {
			list: vi.fn().mockRejectedValue(new Error("D1 unavailable")),
			create: vi.fn(),
			clear: vi.fn(),
		};

		const result = await loadDemoAlerts(repository);

		expect(result.alerts).toEqual([]);
		expect(result.source.status).toBe("unavailable");
	});
});

describe("AlertService", () => {
	it("merges both sources and sorts all alerts by issuedAt descending", async () => {
		const service = new AlertService(
			createRepository([DEMO_ALERT]),
			createFixtureFetch(),
			() => AFTER_IWATE_EVENT,
		);

		const response = await service.list();

		expect(response.alerts.map((alert) => alert.id)).toEqual([
			"demo-fire-abcd1234",
			"jma-20260628052159",
		]);
		expect(response.sources.map((source) => source.status)).toEqual([
			"ok",
			"ok",
		]);
	});

	it("keeps demo alerts when the JMA feed fails", async () => {
		const service = new AlertService(
			createRepository([DEMO_ALERT]),
			async () => {
				throw new Error("JMA timeout");
			},
			() => AFTER_IWATE_EVENT,
		);

		const response = await service.list();

		expect(response.alerts).toEqual([DEMO_ALERT]);
		expect(response.sources).toEqual([
			expect.objectContaining({ name: "demo-mock", status: "ok" }),
			expect.objectContaining({ name: "気象庁 (JMA)", status: "unavailable" }),
		]);
	});

	it("keeps JMA alerts when the demo store is missing", async () => {
		const service = new AlertService(
			null,
			createFixtureFetch(),
			() => AFTER_IWATE_EVENT,
		);

		const response = await service.list();

		expect(response.alerts.map((alert) => alert.id)).toEqual([
			"jma-20260628052159",
		]);
		expect(response.sources).toEqual([
			expect.objectContaining({ name: "demo-mock", status: "unavailable" }),
			expect.objectContaining({ name: "気象庁 (JMA)", status: "ok" }),
		]);
	});

	it("still answers with both source entries when everything fails", async () => {
		const service = new AlertService(
			null,
			async () => {
				throw new Error("JMA timeout");
			},
			() => AFTER_IWATE_EVENT,
		);

		const response = await service.list();

		expect(response.alerts).toEqual([]);
		expect(response.sources).toHaveLength(2);
		expect(
			response.sources.every((source) => source.status === "unavailable"),
		).toBe(true);
	});
});
