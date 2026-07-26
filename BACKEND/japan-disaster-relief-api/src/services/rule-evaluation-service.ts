import type { RuleEvaluationRequest, RuleEvaluationResponse } from "@nikuman-yummy/shared";
import {
	ASSISTANCE_ANSWER_INDEX,
	CONSERVATIVE_FALLBACK_RULE,
	RULE_TABLE,
} from "../config/rules";
import type { RuleCondition, RuleRecord } from "../config/rules";

/**
 * Evaluates the draft fixed rule table (PRD FR-10, §10.3).
 *
 * The function is pure and deterministic: no clock, no randomness, no I/O and no generative AI.
 * PRD §7.2 forbids AI from deciding `userState` or `cardId`, and PRD FR-08 requires the same
 * input to always produce the same state and action card.
 *
 * `locationStatus` is accepted but never used here: in this version it only influences facility
 * candidate lookup (PRD FR-05/FR-11), not `userState` or `cardId`.
 *
 * The rule table is a draft pending A组 confirmation (PRD TBD-01); see `../config/rules`.
 */
export function evaluateRules(request: RuleEvaluationRequest): RuleEvaluationResponse {
	const rule = RULE_TABLE.find((candidate) => matchesRule(candidate, request));

	return toResponse(rule ?? CONSERVATIVE_FALLBACK_RULE);
}

function toResponse(rule: RuleRecord): RuleEvaluationResponse {
	return {
		ruleVersion: rule.ruleVersion,
		userState: rule.resultState,
		cardId: rule.cardId,
		nextActions: [...rule.nextActions],
		sourceIds: [...rule.sourceIds],
	};
}

function matchesRule(rule: RuleRecord, request: RuleEvaluationRequest): boolean {
	if (rule.mode !== request.mode) {
		return false;
	}

	if (rule.environment !== "any" && rule.environment !== request.environment) {
		return false;
	}

	return matchesCondition(rule.condition, request);
}

function matchesCondition(condition: RuleCondition, request: RuleEvaluationRequest): boolean {
	switch (condition.kind) {
		case "directDangerNotCleared":
			return !request.directDangerCleared;
		case "anyAnswerYes":
			return condition.answerIndexes.some((index) => request.answers[index] === "yes");
		case "anyAnswerUncertain":
			return request.answers.some((answer) => answer === "uncertain");
		case "assistanceRequested":
			return request.answers[ASSISTANCE_ANSWER_INDEX] === "yes" || request.needsHelp;
		case "always":
			return true;
	}
}
