import type { Context } from "hono";
import { createApiErrorResponse } from "../schemas/api-error";
import type { AppEnv } from "../types/app-env";

export function handleNotFound(c: Context<AppEnv>) {
	return c.json(
		createApiErrorResponse("NOT_FOUND", "The requested resource was not found.", c.get("requestId")),
		404,
	);
}

export function handleError(error: Error, c: Context<AppEnv>) {
	const requestId = c.get("requestId");
	console.error("Unhandled request error", {
		requestId,
		error,
	});

	return c.json(
		createApiErrorResponse("INTERNAL_ERROR", "Unexpected server error.", requestId),
		500,
	);
}
