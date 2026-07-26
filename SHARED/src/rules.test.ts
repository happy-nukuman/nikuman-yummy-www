import { describe, expect, it } from "vitest";
import {
	isEnvironment,
	isRiskAnswer,
	isRuleEvaluationRequest,
	isUserState,
} from "./rules";

const validRequest = {
	mode: "disaster",
	directDangerCleared: true,
	environment: "outdoor",
	answers: ["no", "no", "no"],
	needsHelp: false,
	locationStatus: "available",
};

describe("isUserState", () => {
	it("accepts the four flow states", () => {
		expect(isUserState("safe")).toBe(true);
		expect(isUserState("uncertain")).toBe(true);
		expect(isUserState("danger")).toBe(true);
		expect(isUserState("need_help")).toBe(true);
	});

	it("rejects unknown states", () => {
		expect(isUserState("evacuated")).toBe(false);
	});
});

describe("isRiskAnswer", () => {
	it("accepts yes, no and uncertain", () => {
		expect(isRiskAnswer("yes")).toBe(true);
		expect(isRiskAnswer("no")).toBe(true);
		expect(isRiskAnswer("uncertain")).toBe(true);
	});

	it("rejects other answers", () => {
		expect(isRiskAnswer("maybe")).toBe(false);
	});
});

describe("isEnvironment", () => {
	it("accepts the three P0 environments", () => {
		expect(isEnvironment("indoor")).toBe(true);
		expect(isEnvironment("outdoor")).toBe(true);
		expect(isEnvironment("transit")).toBe(true);
	});

	it("rejects unknown environments", () => {
		expect(isEnvironment("underground")).toBe(false);
	});
});

describe("isRuleEvaluationRequest", () => {
	it("accepts a complete rule evaluation request", () => {
		expect(isRuleEvaluationRequest(validRequest)).toBe(true);
	});

	it("rejects a mode other than disaster", () => {
		expect(isRuleEvaluationRequest({ ...validRequest, mode: "daily" })).toBe(false);
	});

	it("rejects an answer count other than three", () => {
		expect(isRuleEvaluationRequest({ ...validRequest, answers: ["no", "no"] })).toBe(false);
		expect(
			isRuleEvaluationRequest({ ...validRequest, answers: ["no", "no", "no", "no"] }),
		).toBe(false);
	});

	it("rejects unsupported answer values", () => {
		expect(isRuleEvaluationRequest({ ...validRequest, answers: ["no", "maybe", "no"] })).toBe(
			false,
		);
	});

	it("rejects unsupported environments", () => {
		expect(isRuleEvaluationRequest({ ...validRequest, environment: "underground" })).toBe(false);
	});

	it("rejects unsupported location statuses", () => {
		expect(isRuleEvaluationRequest({ ...validRequest, locationStatus: "cached" })).toBe(false);
	});

	it("rejects non-boolean flags", () => {
		expect(isRuleEvaluationRequest({ ...validRequest, directDangerCleared: "true" })).toBe(false);
		expect(isRuleEvaluationRequest({ ...validRequest, needsHelp: 1 })).toBe(false);
	});

	it("rejects missing fields and non-object bodies", () => {
		expect(
			isRuleEvaluationRequest({
				mode: "disaster",
				directDangerCleared: true,
				environment: "outdoor",
				answers: ["no", "no", "no"],
				locationStatus: "available",
			}),
		).toBe(false);
		expect(isRuleEvaluationRequest(null)).toBe(false);
		expect(isRuleEvaluationRequest([validRequest])).toBe(false);
		expect(isRuleEvaluationRequest("disaster")).toBe(false);
	});
});
