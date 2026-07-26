import type {
	ApiErrorResponse,
	DemoAlertClearResponse,
	DemoAlertCreateResponse,
} from "@nikuman-yummy/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import type { DemoAlertRow } from "../repositories/demo-alert-repository";

/**
 * Minimal in-memory stand-in for the `demo_alerts` table: enough to prove the
 * create/read/clear roundtrip through the real route and repository code.
 */
function createDemoAlertDatabase(): { database: D1Database; rows: DemoAlertRow[] } {
	const rows: DemoAlertRow[] = [];
	const database = {
		prepare: (query: string) => {
			let binds: unknown[] = [];
			const statement = {
				bind: (...values: unknown[]) => {
					binds = values;
					return statement;
				},
				all: async () => ({ results: [...rows] }),
				run: async () => {
					if (query.includes("INSERT INTO demo_alerts")) {
						rows.push({
							id: binds[0] as string,
							type: binds[1] as string,
							title_ja: binds[2] as string,
							title_en: binds[3] as string | null,
							title_zh_hans: binds[4] as string | null,
							issued_at: binds[5] as string,
							source: binds[6] as string,
						});
						return { meta: { changes: 1 } };
					}

					const changes = rows.length;
					rows.length = 0;
					return { meta: { changes } };
				},
			};
			return statement;
		},
	} as unknown as D1Database;

	return { database, rows };
}

async function createRequest(
	body: unknown,
	database?: D1Database,
): Promise<Response> {
	return await createApp().request(
		"/api/demo/alerts",
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: typeof body === "string" ? body : JSON.stringify(body),
		},
		database === undefined ? {} : { DB: database },
	);
}

async function clearRequest(database?: D1Database): Promise<Response> {
	return await createApp().request(
		"/api/demo/alerts",
		{ method: "DELETE" },
		database === undefined ? {} : { DB: database },
	);
}

describe("POST /api/demo/alerts", () => {
	it("stores a demo alert with the trilingual default title", async () => {
		const { database, rows } = createDemoAlertDatabase();

		const response = await createRequest({ type: "fire" }, database);
		const body = await response.json<DemoAlertCreateResponse>();

		expect(response.status).toBe(200);
		expect(body.alert.id).toMatch(/^demo-fire-[0-9a-f]{8}$/);
		expect(body.alert.type).toBe("fire");
		expect(body.alert.title).toEqual({
			ja: "火災(デモ)",
			en: "Fire (demo)",
			zhHans: "火灾(演示)",
		});
		expect(body.alert.source).toBe("demo-mock");
		expect(Date.parse(body.alert.issuedAt)).not.toBeNaN();
		expect(rows).toHaveLength(1);
		expect(rows[0]?.title_ja).toBe("火災(デモ)");
	});

	it("stores a caller-supplied title as-is", async () => {
		const { database } = createDemoAlertDatabase();

		const response = await createRequest(
			{ type: "earthquake", title: { ja: "訓練用の揺れ", en: "Drill shake" } },
			database,
		);
		const body = await response.json<DemoAlertCreateResponse>();

		expect(response.status).toBe(200);
		expect(body.alert.title).toEqual({ ja: "訓練用の揺れ", en: "Drill shake" });
	});

	it.each([
		["an unsupported type", { type: "meteor" }],
		["a missing type", {}],
		["a title without Japanese text", { type: "fire", title: { en: "Fire" } }],
		["a non-JSON body", "not json"],
	])("returns BAD_REQUEST for %s", async (_label, body) => {
		const { database } = createDemoAlertDatabase();

		const response = await createRequest(body, database);
		const error = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(error.error.code).toBe("BAD_REQUEST");
		expect(error.error.requestId).toBe(response.headers.get("x-request-id"));
	});

	it("returns UPSTREAM_UNAVAILABLE without a D1 binding", async () => {
		const response = await createRequest({ type: "fire" });
		const error = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(503);
		expect(error.error.code).toBe("UPSTREAM_UNAVAILABLE");
	});

	it("returns UPSTREAM_UNAVAILABLE when the insert fails", async () => {
		const database = {
			prepare: () => {
				throw new Error("D1 write failure");
			},
		} as unknown as D1Database;

		const response = await createRequest({ type: "fire" }, database);
		const error = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(503);
		expect(error.error.code).toBe("UPSTREAM_UNAVAILABLE");
	});
});

describe("DELETE /api/demo/alerts", () => {
	it("clears every stored demo alert and reports the count", async () => {
		const { database, rows } = createDemoAlertDatabase();
		await createRequest({ type: "fire" }, database);
		await createRequest({ type: "earthquake" }, database);

		const response = await clearRequest(database);
		const body = await response.json<DemoAlertClearResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({ cleared: 2 });
		expect(rows).toHaveLength(0);
	});

	it("reports zero cleared alerts on an empty store", async () => {
		const { database } = createDemoAlertDatabase();

		const response = await clearRequest(database);

		expect(await response.json<DemoAlertClearResponse>()).toEqual({
			cleared: 0,
		});
	});

	it("returns UPSTREAM_UNAVAILABLE without a D1 binding", async () => {
		const response = await clearRequest();
		const error = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(503);
		expect(error.error.code).toBe("UPSTREAM_UNAVAILABLE");
	});
});
