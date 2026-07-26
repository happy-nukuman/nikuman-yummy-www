import { Hono } from "hono";
import { apiCors } from "./middleware/cors";
import { handleError, handleNotFound } from "./middleware/error-handler";
import { requestIdMiddleware } from "./middleware/request-id";
import { registerHealthRoutes } from "./routes/health";
import { registerSystemRoutes } from "./routes/system";
import type { AppEnv } from "./types/app-env";

export function createApp(): Hono<AppEnv> {
	const app = new Hono<AppEnv>();

	app.use("*", requestIdMiddleware);
	app.use("/api/*", apiCors);

	registerHealthRoutes(app);
	registerSystemRoutes(app);

	app.notFound(handleNotFound);
	app.onError(handleError);

	return app;
}
