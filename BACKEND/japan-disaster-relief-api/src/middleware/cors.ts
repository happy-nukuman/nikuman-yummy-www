import { cors } from "hono/cors";
import { ALLOWED_METHODS, ALLOWED_ORIGINS } from "../config/cors";

export const apiCors = cors({
	origin: [...ALLOWED_ORIGINS],
	allowMethods: [...ALLOWED_METHODS],
});
