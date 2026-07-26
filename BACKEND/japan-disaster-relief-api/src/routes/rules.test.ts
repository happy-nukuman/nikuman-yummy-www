import type {
	ApiErrorResponse,
	RuleEvaluationRequest,
	RuleEvaluationResponse,
} from "@nikuman-yummy/shared";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { RULE_VERSION } from "../config/rules";

const validRequest: RuleEvaluationRequest = {
	mode: "disaster",
	directDangerCleared: true,
	environment: "outdoor",
	answers: ["no", "no", "no"],
	needsHelp: false,
	locationStatus: "available",
};

async function evaluate(body: unknown): Promise<Response> {
	return await createApp().request("/api/rules/evaluate", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/rules/evaluate", () => {
	it("returns the safe branch for a request without reported risk", async () => {
		const response = await evaluate(validRequest);
		const body = await response.json<RuleEvaluationResponse>();

		expect(response.status).toBe(200);
		expect(body.ruleVersion).toBe(RULE_VERSION);
		expect(body.userState).toBe("safe");
		expect(body.cardId).toBe("card-safe-outdoor");
		expect(body.nextActions.length).toBeGreaterThan(0);
		expect(body.sourceIds.length).toBeGreaterThan(0);
		expect(response.headers.get("x-request-id")).toBeTruthy();
	});

	// TC-05: still in direct danger, so the three questions must not drive the result.
	it("returns the boundary danger card when direct danger is not cleared", async () => {
		const response = await evaluate({
			...validRequest,
			directDangerCleared: false,
			answers: ["no", "no", "no"],
		});
		const body = await response.json<RuleEvaluationResponse>();

		expect(response.status).toBe(200);
		expect(body.userState).toBe("danger");
		expect(body.cardId).toBe("card-boundary-danger");
	});

	// TC-06: serious injury enters the high risk branch.
	it("returns the danger branch for serious injury", async () => {
		const response = await evaluate({ ...validRequest, answers: ["no", "yes", "no"] });
		const body = await response.json<RuleEvaluationResponse>();

		expect(body.userState).toBe("danger");
		expect(body.cardId).toBe("card-danger-outdoor");
	});

	// TC-07: an uncertain answer never produces a confident safe conclusion.
	it("returns the conservative branch for an uncertain answer", async () => {
		const response = await evaluate({ ...validRequest, answers: ["no", "no", "uncertain"] });
		const body = await response.json<RuleEvaluationResponse>();

		expect(body.userState).toBe("uncertain");
		expect(body.cardId).toBe("card-uncertain-outdoor");
	});

	it("returns the need_help branch when the user requests help", async () => {
		const response = await evaluate({ ...validRequest, environment: "indoor", needsHelp: true });
		const body = await response.json<RuleEvaluationResponse>();

		expect(body.userState).toBe("need_help");
		expect(body.cardId).toBe("card-need-help-indoor");
	});

	it("rejects an answer count other than three", async () => {
		const response = await evaluate({ ...validRequest, answers: ["no", "no"] });
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("BAD_REQUEST");
		expect(body.error.message).toBe("Invalid rule evaluation request body.");
		expect(body.error.requestId).toBe(response.headers.get("x-request-id"));
	});

	it("rejects unsupported enum values", async () => {
		const invalidEnvironment = await evaluate({ ...validRequest, environment: "underground" });
		const invalidAnswer = await evaluate({ ...validRequest, answers: ["no", "maybe", "no"] });
		const invalidMode = await evaluate({ ...validRequest, mode: "daily" });
		const invalidLocationStatus = await evaluate({ ...validRequest, locationStatus: "cached" });

		expect(invalidEnvironment.status).toBe(400);
		expect(invalidAnswer.status).toBe(400);
		expect(invalidMode.status).toBe(400);
		expect(invalidLocationStatus.status).toBe(400);
	});

	it("rejects missing fields", async () => {
		const response = await evaluate({
			mode: "disaster",
			directDangerCleared: true,
			environment: "outdoor",
		});

		expect(response.status).toBe(400);
	});

	it("rejects a non-JSON body", async () => {
		const response = await createApp().request("/api/rules/evaluate", {
			method: "POST",
			body: "not json",
		});
		const body = await response.json<ApiErrorResponse>();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("BAD_REQUEST");
	});

	it("rejects an empty body", async () => {
		const response = await createApp().request("/api/rules/evaluate", { method: "POST" });

		expect(response.status).toBe(400);
	});

	it("does not expose the endpoint over GET", async () => {
		const response = await createApp().request("/api/rules/evaluate");

		expect(response.status).toBe(404);
	});
});
