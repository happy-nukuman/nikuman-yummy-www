import { describe, expect, it } from "vitest";
import { DEMO_SYNC_STATUS, DEMO_TEAM_NAME } from "./demo-config";

describe("demo presentation config", () => {
	it("keeps the simulated sync time in one shared configuration", () => {
		expect(DEMO_SYNC_STATUS).toEqual({ time: "08:30", timezone: "JST" });
	});

	it("keeps the team name separate from the service name", () => {
		expect(DEMO_TEAM_NAME).toBe("焼き小籠包 Team");
		expect(DEMO_TEAM_NAME).not.toBe("Tokyo Safe First");
	});
});
