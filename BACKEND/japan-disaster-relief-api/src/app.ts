import { Hono } from "hono";
import { apiCors } from "./middleware/cors";
import { handleError, handleNotFound } from "./middleware/error-handler";
import { requestIdMiddleware } from "./middleware/request-id";
import { registerAlertRoutes } from "./routes/alerts";
import { registerDemoAlertRoutes } from "./routes/demo-alerts";
import { registerDemoShelterRoutes } from "./routes/demo-shelters";
import { registerFacilityRoutes } from "./routes/facilities";
import { registerHealthRoutes } from "./routes/health";
import { registerMunicipalityRoutes } from "./routes/municipalities";
import { registerRulesRoutes } from "./routes/rules";
import { registerSystemRoutes } from "./routes/system";
import type { AppEnv } from "./types/app-env";

export function createApp(): Hono<AppEnv> {
	const app = new Hono<AppEnv>();

	app.use("*", requestIdMiddleware);
	app.use("/api/*", apiCors);

	registerHealthRoutes(app);
	registerSystemRoutes(app);
	registerMunicipalityRoutes(app);
	registerFacilityRoutes(app);
	registerRulesRoutes(app);
	registerAlertRoutes(app);
	registerDemoAlertRoutes(app);
	registerDemoShelterRoutes(app);

	app.notFound(handleNotFound);
	app.onError(handleError);

	return app;
}
