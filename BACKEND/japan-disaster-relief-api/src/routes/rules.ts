import { isRuleEvaluationRequest } from "@nikuman-yummy/shared";
import type { Context, Hono } from "hono";
import { createApiErrorResponse } from "../schemas/api-error";
import { evaluateRules } from "../services/rule-evaluation-service";
import type { AppEnv } from "../types/app-env";

export function registerRulesRoutes(app: Hono<AppEnv>): void {
	app.post("/api/rules/evaluate", async (c) => {
		const body = await readJsonBody(c);

		if (!isRuleEvaluationRequest(body)) {
			return c.json(
				createApiErrorResponse(
					"BAD_REQUEST",
					"Invalid rule evaluation request body.",
					c.get("requestId"),
				),
				400,
			);
		}

		return c.json(evaluateRules(body));
	});
}

async function readJsonBody(c: Context<AppEnv>): Promise<unknown> {
	try {
		return await c.req.json();
	} catch {
		// A malformed or non-JSON body is a client error, not an internal error.
		return null;
	}
}
