import type { Hono } from "hono";
import { D1DemoAlertRepository } from "../repositories/demo-alert-repository";
import { AlertService } from "../services/alert-service";
import type { AppEnv } from "../types/app-env";

export function registerAlertRoutes(app: Hono<AppEnv>): void {
	app.get("/api/alerts", async (c) => {
		const database = c.env?.DB;
		const service = new AlertService(
			database === undefined ? null : new D1DemoAlertRepository(database),
		);

		// Alerts are advisory only (PRD FR-03): the frontend may highlight
		// 灾害模式, it must never force the mode based on this response.
		return c.json(await service.list());
	});
}
