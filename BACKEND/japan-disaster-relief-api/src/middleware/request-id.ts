import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types/app-env";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

function resolveRequestId(incomingRequestId: string | undefined): string {
	return incomingRequestId && SAFE_REQUEST_ID.test(incomingRequestId)
		? incomingRequestId
		: crypto.randomUUID();
}

export const requestIdMiddleware = createMiddleware<AppEnv>(async (c, next) => {
	const requestId = resolveRequestId(c.req.header("x-request-id"));
	c.set("requestId", requestId);
	c.header("X-Request-ID", requestId);

	await next();
});
