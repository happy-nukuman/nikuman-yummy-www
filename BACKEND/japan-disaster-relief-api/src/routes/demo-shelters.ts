import {
	isDemoShelterNearbyRequest,
	type DemoShelterNearbyResponse,
} from "@nikuman-yummy/shared";
import type { Hono } from "hono";
import { createApiErrorResponse } from "../schemas/api-error";
import { findNearbyDemoShelters } from "../services/demo-shelter-service";
import type { AppEnv } from "../types/app-env";

export function registerDemoShelterRoutes(app: Hono<AppEnv>): void {
	app.post("/api/demo/shelters/nearby", async (c) => {
		const body: unknown = await c.req.json().catch(() => undefined);

		if (!isDemoShelterNearbyRequest(body)) {
			return c.json(
				createApiErrorResponse(
					"BAD_REQUEST",
					"Request body must contain valid latitude and longitude values; limit must be an integer from 1 to 10.",
					c.get("requestId"),
				),
				400,
			);
		}

		const response: DemoShelterNearbyResponse = findNearbyDemoShelters(body);
		return c.json(response);
	});
}
