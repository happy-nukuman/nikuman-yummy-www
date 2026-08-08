import type {
	ApiErrorResponse,
	DemoShelterNearbyResponse,
} from "@nikuman-yummy/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

async function request(body: unknown): Promise<Response> {
	return await createApp().request("/api/demo/shelters/nearby", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

describe("POST /api/demo/shelters/nearby", () => {
	it("returns nearby shelter candidates without a D1 binding", async () => {
		const response = await request({
			latitude: 35.6896342,
			longitude: 139.6917418,
			limit: 2,
		});
		const body = await response.json<DemoShelterNearbyResponse>();

		expect(response.status).toBe(200);
		expect(response.headers.get("x-request-id")).toBeTruthy();
		expect(body.facilities).toHaveLength(2);
		expect(body.facilities[0]?.nameJa).toBe("西新宿小学校");
		expect(body.facilities[0]?.latitude).toBe(35.68602);
		expect(body.facilities[0]?.longitude).toBe(139.68748);
		expect(body.facilities[0]?.distanceMeters).toEqual(expect.any(Number));
		expect(body.facilities[0]?.googleMapsUrl).toContain(
			"https://www.google.com/maps/search/?api=1&query=",
		);
	});

	it("uses the fixed Tokyo Metropolitan Government Building origin for any valid request coordinates", async () => {
		const response = await request({
			latitude: 40.7128,
			longitude: -74.006,
			limit: 2,
		});
		const body = await response.json<DemoShelterNearbyResponse>();

		expect(response.status).toBe(200);
		expect(body.origin).toEqual({
			latitude: 35.6896342,
			longitude: 139.6917418,
		});
		expect(body.facilities.map((facility) => facility.nameJa)).toEqual([
			"西新宿小学校",
			"西新宿中学校",
		]);
	});

	it.each([
		"not-json",
		{},
		{ latitude: 35.6896342 },
		{ latitude: Number.NaN, longitude: 139.6917418 },
		{ latitude: 35.6896342, longitude: 139.6917418, limit: 20 },
	])("returns BAD_REQUEST for invalid input %#", async (value) => {
		const response = await request(value);
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("BAD_REQUEST");
		expect(body.error.requestId).toBe(response.headers.get("x-request-id"));
	});
});
