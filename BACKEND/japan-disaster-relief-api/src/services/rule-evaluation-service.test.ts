import { ENVIRONMENTS, LOCATION_STATUSES, RISK_ANSWERS } from "@nikuman-yummy/shared";
import type { RiskAnswer, RuleEvaluationRequest } from "@nikuman-yummy/shared";
import { describe, expect, it } from "vitest";
import { CONSERVATIVE_FALLBACK_RULE, RULE_TABLE, RULE_VERSION } from "../config/rules";
import { evaluateRules } from "./rule-evaluation-service";

function request(overrides: Partial<RuleEvaluationRequest> = {}): RuleEvaluationRequest {
	return {
		mode: "disaster",
		directDangerCleared: true,
		environment: "outdoor",
		answers: ["no", "no", "no"],
		needsHelp: false,
		locationStatus: "available",
		...overrides,
	};
}

const ANSWER_COMBINATIONS: RiskAnswer[][] = RISK_ANSWERS.flatMap((first) =>
	RISK_ANSWERS.flatMap((second) => RISK_ANSWERS.map((third) => [first, second, third])),
);

const ALL_REQUESTS: RuleEvaluationRequest[] = ENVIRONMENTS.flatMap((environment) =>
	[true, false].flatMap((directDangerCleared) =>
		ANSWER_COMBINATIONS.flatMap((answers) =>
			[true, false].flatMap((needsHelp) =>
				LOCATION_STATUSES.map((locationStatus) =>
					request({ environment, directDangerCleared, answers, needsHelp, locationStatus }),
				),
			),
		),
	),
);

describe("evaluateRules draft priority", () => {
	it("reports safe when no risk is reported", () => {
		expect(evaluateRules(request())).toEqual({
			ruleVersion: RULE_VERSION,
			userState: "safe",
			cardId: "card-safe-outdoor",
			nextActions: ["card-facility-candidates", "card-communication-help", "card-official-sources"],
			sourceIds: ["src-tokyo-bousai-guide-draft", "src-a-group-confirmation-pending"],
		});
	});

	it("varies the card by environment", () => {
		const cardIds = ENVIRONMENTS.map((environment) => evaluateRules(request({ environment })).cardId);

		expect(cardIds).toEqual(["card-safe-indoor", "card-safe-outdoor", "card-safe-transit"]);
	});

	it("keeps transit cards at basic guidance level", () => {
		const result = evaluateRules(request({ environment: "transit" }));

		expect(result.nextActions).toEqual(["card-transit-staff-guidance", "card-communication-help"]);
		expect(result.nextActions).not.toContain("card-facility-candidates");
	});

	// TC-05: the user is still in direct danger, so the complex flow must not decide the result.
	it("returns the boundary danger card when direct danger is not cleared", () => {
		for (const environment of ENVIRONMENTS) {
			const result = evaluateRules(
				request({
					environment,
					directDangerCleared: false,
					answers: ["no", "no", "no"],
					needsHelp: true,
					locationStatus: "unavailable",
				}),
			);

			expect(result.userState).toBe("danger");
			expect(result.cardId).toBe("card-boundary-danger");
		}
	});

	it("reports danger when danger is nearby", () => {
		const result = evaluateRules(request({ answers: ["yes", "no", "no"] }));

		expect(result.userState).toBe("danger");
		expect(result.cardId).toBe("card-danger-outdoor");
	});

	// TC-06: serious injury enters the high risk branch even if help was also requested.
	it("reports danger for serious injury before the need_help branch", () => {
		const result = evaluateRules(request({ answers: ["no", "yes", "yes"], needsHelp: true }));

		expect(result.userState).toBe("danger");
		expect(result.cardId).toBe("card-danger-outdoor");
	});

	// TC-07: any "uncertain" answer must lead to the conservative branch.
	it("reports uncertain for any uncertain answer", () => {
		const answerSets: RiskAnswer[][] = [
			["uncertain", "no", "no"],
			["no", "uncertain", "no"],
			["no", "no", "uncertain"],
		];

		for (const answers of answerSets) {
			const result = evaluateRules(request({ answers }));

			expect(result.userState).toBe("uncertain");
			expect(result.cardId).toBe("card-uncertain-outdoor");
		}
	});

	it("prefers the uncertain branch over the need_help branch", () => {
		const result = evaluateRules(request({ answers: ["no", "uncertain", "yes"], needsHelp: true }));

		expect(result.userState).toBe("uncertain");
	});

	it("reports need_help from the assistance answer or the needsHelp flag", () => {
		expect(evaluateRules(request({ answers: ["no", "no", "yes"] })).userState).toBe("need_help");
		expect(evaluateRules(request({ needsHelp: true })).userState).toBe("need_help");
		expect(evaluateRules(request({ needsHelp: true })).cardId).toBe("card-need-help-outdoor");
	});

	it("ignores locationStatus when deciding the state and card", () => {
		const results = LOCATION_STATUSES.map((locationStatus) =>
			evaluateRules(request({ locationStatus })),
		);

		for (const result of results) {
			expect(result).toEqual(results[0]);
		}
	});
});

describe("evaluateRules safety properties", () => {
	it("enumerates every valid request combination", () => {
		expect(ALL_REQUESTS).toHaveLength(972);
	});

	it("is deterministic for every valid request", () => {
		for (const candidate of ALL_REQUESTS) {
			expect(evaluateRules(candidate)).toEqual(evaluateRules(candidate));
		}
	});

	it("never concludes safe for uncertain answers or uncleared direct danger", () => {
		for (const candidate of ALL_REQUESTS) {
			const result = evaluateRules(candidate);
			const conservative =
				!candidate.directDangerCleared || candidate.answers.includes("uncertain");

			if (conservative) {
				expect(result.userState).not.toBe("safe");
			}
		}
	});

	it("always returns a versioned card without reaching the defensive fallback", () => {
		for (const candidate of ALL_REQUESTS) {
			const result = evaluateRules(candidate);

			expect(result.ruleVersion).toBe(RULE_VERSION);
			expect(result.cardId).not.toBe(CONSERVATIVE_FALLBACK_RULE.cardId);
			expect(result.cardId.length).toBeGreaterThan(0);
			expect(result.nextActions.length).toBeGreaterThan(0);
			expect(result.sourceIds.length).toBeGreaterThan(0);
		}
	});

	it("keeps every reachable state available", () => {
		const states = new Set(ALL_REQUESTS.map((candidate) => evaluateRules(candidate).userState));

		expect([...states].sort()).toEqual(["danger", "need_help", "safe", "uncertain"]);
	});
});

describe("rule table draft status", () => {
	it("exposes the draft rule version", () => {
		expect(RULE_VERSION).toBe("p0-draft.1");
	});

	it("marks every rule as draft pending A group confirmation", () => {
		for (const rule of RULE_TABLE) {
			expect(rule.reviewStatus).toBe("draft");
			expect(rule.ruleVersion).toBe(RULE_VERSION);
			expect(rule.sourceIds.length).toBeGreaterThan(0);
			expect(rule.effectiveDate).toBe("2026-07-26");
		}
	});

	it("keeps the defensive fallback conservative", () => {
		expect(CONSERVATIVE_FALLBACK_RULE.reviewStatus).toBe("draft");
		expect(CONSERVATIVE_FALLBACK_RULE.resultState).toBe("uncertain");
	});

	it("uses unique rule ids and card ids", () => {
		const ruleIds = RULE_TABLE.map((rule) => rule.ruleId);
		const cardIds = RULE_TABLE.map((rule) => rule.cardId);

		expect(new Set(ruleIds).size).toBe(ruleIds.length);
		expect(new Set(cardIds).size).toBe(cardIds.length);
	});
});
