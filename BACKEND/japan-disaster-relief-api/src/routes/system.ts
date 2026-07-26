import type { Hono } from "hono";
import { getSystemStatus } from "../services/system-status-service";
import type { AppEnv } from "../types/app-env";

export function registerSystemRoutes(app: Hono<AppEnv>): void {
	app.get("/api/hello", (c) => c.json(getSystemStatus()));
}
