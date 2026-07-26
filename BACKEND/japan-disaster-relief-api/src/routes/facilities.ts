import { isFacilitySearchRequest } from "@nikuman-yummy/shared";
import type { Hono } from "hono";
import { D1FacilityRepository } from "../repositories/d1-facility-repository";
import { createApiErrorResponse } from "../schemas/api-error";
import {
	FacilityService,
	facilityService,
} from "../services/facility-service";
import type { AppEnv } from "../types/app-env";

export function registerFacilityRoutes(app: Hono<AppEnv>): void {
	app.post("/api/facilities/search", async (c) => {
		const body: unknown = await c.req.json().catch(() => undefined);

		if (!isFacilitySearchRequest(body)) {
			return c.json(
				createApiErrorResponse(
					"BAD_REQUEST",
					"Request body must contain a municipalityId and valid optional filters.",
					c.get("requestId"),
				),
				400,
			);
		}

		const database = c.env?.DB;
		const service =
			database === undefined
				? facilityService
				: new FacilityService(
						new D1FacilityRepository(database, body.municipalityId),
					);

		return c.json(await service.search(body));
	});
}
