import type {
	ApiErrorResponse,
	FacilitySearchResponse,
	HealthResponse,
	HelloResponse,
	MunicipalityListResponse,
	MunicipalityMatchResponse,
} from "@nikuman-yummy/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("API scaffold", () => {
	it("returns health status", async () => {
		const response = await createApp().request("/health");
		const body = await response.json<HealthResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({ status: "ok" });
		expect(response.headers.get("x-request-id")).toBeTruthy();
	});

	it("returns the system connection response", async () => {
		const response = await createApp().request("/api/hello");
		const body = await response.json<HelloResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({ message: "hello world!" });
	});

	it("returns the shared error contract for unknown routes", async () => {
		const response = await createApp().request("/missing");
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(404);
		expect(body.error.code).toBe("NOT_FOUND");
		expect(body.error.message).toBe("The requested resource was not found.");
		expect(body.error.requestId).toBe(response.headers.get("x-request-id"));
	});

	it("returns the sorted municipality reference list", async () => {
		const response = await createApp().request("/api/municipalities");
		const body = await response.json<MunicipalityListResponse>();
		const ids = body.municipalities.map(
			(municipality) => municipality.municipalityId,
		);

		expect(response.status).toBe(200);
		expect(ids).toHaveLength(23);
		expect(ids).toEqual([...ids].sort());
		expect(body.municipalities[0]).toEqual({
			municipalityId: "13101",
			name: {
				ja: "千代田区",
				en: "Chiyoda City",
				zhHans: "千代田区",
			},
		});
	});

	it("matches valid coordinates to a municipality", async () => {
		const response = await createApp().request("/api/location/municipality", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				latitude: 35.6852,
				longitude: 139.7528,
			}),
		});
		const body = await response.json<MunicipalityMatchResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			municipalityId: "13101",
			municipalityName: {
				ja: "千代田区",
				en: "Chiyoda City",
				zhHans: "千代田区",
			},
			matched: true,
		});
	});

	it("returns a non-blocking unmatched municipality response", async () => {
		const response = await createApp().request("/api/location/municipality", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				latitude: 34,
				longitude: 139,
			}),
		});
		const body = await response.json<MunicipalityMatchResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			municipalityId: null,
			municipalityName: null,
			matched: false,
		});
	});

	it("returns BAD_REQUEST for a malformed municipality match body", async () => {
		const response = await createApp().request("/api/location/municipality", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				latitude: "35.6852",
				longitude: 139.7528,
			}),
		});
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("BAD_REQUEST");
		expect(body.error.requestId).toBe(response.headers.get("x-request-id"));
	});

	it("returns unknown while no facility catalogue is connected", async () => {
		const response = await createApp().request("/api/facilities/search", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				municipalityId: "13101",
			}),
		});
		const body = await response.json<FacilitySearchResponse>();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			dataStatus: "unknown",
			sources: [],
			stayPutStatus: "undetermined",
			stayPutZones: [],
			facilities: [],
		});
	});

	it("returns BAD_REQUEST for a malformed facility search body", async () => {
		const response = await createApp().request("/api/facilities/search", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				municipalityId: "13101",
				facilityTypes: ["unsupported"],
			}),
		});
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("BAD_REQUEST");
		expect(body.error.requestId).toBe(response.headers.get("x-request-id"));
	});
});
