import { describe, expect, it, vi } from "vitest";
import type { DemoAlertRepository } from "../repositories/demo-alert-repository";
import { DemoAlertService, buildDemoAlert } from "./demo-alert-service";

const NOW = new Date("2026-07-26T05:00:00.000Z");
const UUID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

function createRepository(): DemoAlertRepository {
	return {
		list: vi.fn().mockResolvedValue([]),
		create: vi.fn().mockResolvedValue(undefined),
		clear: vi.fn().mockResolvedValue(3),
	};
}

describe("buildDemoAlert", () => {
	it("uses the trilingual default title for the requested type", () => {
		expect(buildDemoAlert({ type: "fire" }, NOW, UUID)).toEqual({
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

	it.each([
		["earthquake" as const, "地震(デモ)"],
		["tsunami" as const, "津波(デモ)"],
		["flood" as const, "洪水(デモ)"],
		["landslide" as const, "土砂災害(デモ)"],
		["volcanic" as const, "火山活動(デモ)"],
		["fire" as const, "火災(デモ)"],
	])("marks the %s default title as a demo", (type, expectedJa) => {
		const alert = buildDemoAlert({ type }, NOW, UUID);

		expect(alert.title.ja).toBe(expectedJa);
		expect(alert.title.en).toContain("(demo)");
		expect(alert.title.zhHans).toContain("(演示)");
	});

	it("stores a caller-supplied title as-is", () => {
		const alert = buildDemoAlert(
			{ type: "earthquake", title: { ja: "訓練用の揺れ" } },
			NOW,
			UUID,
		);

		expect(alert.title).toEqual({ ja: "訓練用の揺れ" });
		expect(alert.id).toBe("demo-earthquake-1a2b3c4d");
	});
});

describe("DemoAlertService", () => {
	it("stores the built alert and returns it", async () => {
		const repository = createRepository();
		const service = new DemoAlertService(
			repository,
			() => NOW,
			() => UUID,
		);

		const alert = await service.create({ type: "fire" });

		expect(repository.create).toHaveBeenCalledWith(alert);
		expect(alert.id).toBe("demo-fire-1a2b3c4d");
	});

	it("returns the number of cleared alerts", async () => {
		const repository = createRepository();
		const service = new DemoAlertService(repository);

		expect(await service.clear()).toBe(3);
		expect(repository.clear).toHaveBeenCalledTimes(1);
	});
});
