import type {
	DemoAlertClearResponse,
	DemoAlertCreateResponse,
} from "@nikuman-yummy/shared";
import { isDemoAlertCreateRequest } from "@nikuman-yummy/shared";
import type { Context, Hono } from "hono";
import { D1DemoAlertRepository } from "../repositories/demo-alert-repository";
import { createApiErrorResponse } from "../schemas/api-error";
import { DemoAlertService } from "../services/demo-alert-service";
import type { AppEnv } from "../types/app-env";

/**
 * Contest-demo control endpoints. They exist so a demo can trigger a controllable
 * alert (the only way a 火災 alert can appear at all) and are not part of the
 * evacuation business API.
 */
export function registerDemoAlertRoutes(app: Hono<AppEnv>): void {
	app.post("/api/demo/alerts", async (c) => {
		const body = await readJsonBody(c);

		if (!isDemoAlertCreateRequest(body)) {
			return c.json(
				createApiErrorResponse(
					"BAD_REQUEST",
					"Request body must contain a supported disaster type and an optional localized title.",
					c.get("requestId"),
				),
				400,
			);
		}

		const service = createDemoAlertService(c);

		if (service === null) {
			return demoStoreUnavailable(c);
		}

		try {
			const response: DemoAlertCreateResponse = {
				alert: await service.create(body),
			};
			return c.json(response);
		} catch {
			return demoStoreUnavailable(c);
		}
	});

	app.delete("/api/demo/alerts", async (c) => {
		const service = createDemoAlertService(c);

		if (service === null) {
			return demoStoreUnavailable(c);
		}

		try {
			const response: DemoAlertClearResponse = {
				cleared: await service.clear(),
			};
			return c.json(response);
		} catch {
			return demoStoreUnavailable(c);
		}
	});
}

function createDemoAlertService(c: Context<AppEnv>): DemoAlertService | null {
	const database = c.env?.DB;

	return database === undefined
		? null
		: new DemoAlertService(new D1DemoAlertRepository(database));
}

function demoStoreUnavailable(c: Context<AppEnv>): Response {
	return c.json(
		createApiErrorResponse(
			"UPSTREAM_UNAVAILABLE",
			"The demo alert store is not available.",
			c.get("requestId"),
		),
		503,
	);
}

async function readJsonBody(c: Context<AppEnv>): Promise<unknown> {
	try {
		return await c.req.json();
	} catch {
		// A malformed or non-JSON body is a client error, not an internal error.
		return null;
	}
}
