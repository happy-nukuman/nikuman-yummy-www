import type { ApiErrorResponse, HealthResponse, HelloResponse } from "@nikuman-yummy/shared";
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
});
