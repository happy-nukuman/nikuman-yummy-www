import {
	isMunicipalityMatchRequest,
} from "@nikuman-yummy/shared";
import type { Hono } from "hono";
import { createApiErrorResponse } from "../schemas/api-error";
import {
	listMunicipalities,
	matchMunicipality,
} from "../services/municipality-service";
import type { AppEnv } from "../types/app-env";

export function registerMunicipalityRoutes(app: Hono<AppEnv>): void {
	app.get("/api/municipalities", (c) => c.json(listMunicipalities()));

	app.post("/api/location/municipality", async (c) => {
		const body: unknown = await c.req.json().catch(() => undefined);

		if (!isMunicipalityMatchRequest(body)) {
			return c.json(
				createApiErrorResponse(
					"BAD_REQUEST",
					"Request body must contain finite latitude and longitude numbers.",
					c.get("requestId"),
				),
				400,
			);
		}

		return c.json(matchMunicipality(body));
	});
}
