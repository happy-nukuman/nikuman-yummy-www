import type { DisasterAlert } from "@nikuman-yummy/shared";
import { describe, expect, it, vi } from "vitest";
import {
	D1DemoAlertRepository,
	mapDemoAlertRow,
	type DemoAlertRow,
} from "./demo-alert-repository";

const TEST_ROW: DemoAlertRow = {
	id: "demo-fire-1a2b3c4d",
	type: "fire",
	title_ja: "火災(デモ)",
	title_en: "Fire (demo)",
	title_zh_hans: "火灾(演示)",
	issued_at: "2026-07-26T05:00:00.000Z",
	source: "demo-mock",
};

const TEST_ALERT: DisasterAlert = {
	id: "demo-earthquake-9f8e7d6c",
	type: "earthquake",
	title: { ja: "地震(デモ)", en: "Earthquake (demo)", zhHans: "地震(演示)" },
	issuedAt: "2026-07-26T05:30:00.000Z",
	source: "demo-mock",
};

describe("mapDemoAlertRow", () => {
	it("maps snake-case D1 columns to a disaster alert", () => {
		expect(mapDemoAlertRow(TEST_ROW)).toEqual({
			id: "demo-fire-1a2b3c4d",
			type: "fire",
			title: {
				ja: "火災(デモ)",
				en: "Fire (demo)",
				zhHans: "火灾(演示)",
			},
			issuedAt: "2026-07-26T05:00:00.000Z",
			source: "demo-mock",
		});
	});

	it("omits absent translations", () => {
		const alert = mapDemoAlertRow({
			...TEST_ROW,
			title_en: null,
			title_zh_hans: null,
		});

		expect(alert?.title).toEqual({ ja: "火災(デモ)" });
	});

	it("skips a row whose disaster type is not part of the contract", () => {
		expect(mapDemoAlertRow({ ...TEST_ROW, type: "meteor" })).toBeNull();
	});
});

describe("D1DemoAlertRepository", () => {
	it("lists stored alerts newest first and drops unusable rows", async () => {
		const statement = {
			all: vi.fn().mockResolvedValue({
				results: [TEST_ROW, { ...TEST_ROW, id: "broken", type: "meteor" }],
			}),
		};
		const queries: string[] = [];
		const database = {
			prepare: (query: string) => {
				queries.push(query);
				return statement;
			},
		} as unknown as D1Database;

		const alerts = await new D1DemoAlertRepository(database).list();

		expect(queries[0]).toContain("ORDER BY issued_at DESC");
		expect(alerts).toEqual([mapDemoAlertRow(TEST_ROW)]);
	});

	it("inserts every alert column and stores absent translations as null", async () => {
		const statement = {
			bind: vi.fn(),
			run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
		};
		statement.bind.mockReturnValue(statement);
		const database = {
			prepare: vi.fn(() => statement),
		} as unknown as D1Database;

		await new D1DemoAlertRepository(database).create({
			...TEST_ALERT,
			title: { ja: "地震(デモ)" },
		});

		expect(statement.bind).toHaveBeenCalledWith(
			"demo-earthquake-9f8e7d6c",
			"earthquake",
			"地震(デモ)",
			null,
			null,
			"2026-07-26T05:30:00.000Z",
			"demo-mock",
		);
		expect(statement.run).toHaveBeenCalledTimes(1);
	});

	it("returns the number of deleted rows when clearing", async () => {
		const statement = {
			run: vi.fn().mockResolvedValue({ meta: { changes: 2 } }),
		};
		const prepare = vi.fn(() => statement);
		const database = { prepare } as unknown as D1Database;

		expect(await new D1DemoAlertRepository(database).clear()).toBe(2);
		expect(prepare).toHaveBeenCalledWith("DELETE FROM demo_alerts");
	});
});
