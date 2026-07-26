import { describe, expect, it } from "vitest";
import { isMunicipalityMatchRequest } from "./geo";

describe("isMunicipalityMatchRequest", () => {
	it("accepts finite coordinates", () => {
		expect(
			isMunicipalityMatchRequest({
				latitude: 35.6812,
				longitude: 139.7671,
			}),
		).toBe(true);
	});

	it("rejects a missing coordinate", () => {
		expect(
			isMunicipalityMatchRequest({
				latitude: 35.6812,
			}),
		).toBe(false);
	});

	it("rejects non-finite coordinates", () => {
		expect(
			isMunicipalityMatchRequest({
				latitude: Number.NaN,
				longitude: 139.7671,
			}),
		).toBe(false);
	});
});
