export const USER_STATES = ["safe", "uncertain", "danger", "need_help"] as const;

export type UserState = (typeof USER_STATES)[number];

export const RISK_ANSWERS = ["yes", "no", "uncertain"] as const;

export type RiskAnswer = (typeof RISK_ANSWERS)[number];

export const ENVIRONMENTS = ["indoor", "outdoor", "transit"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

export const LOCATION_STATUSES = ["available", "manual", "unavailable"] as const;

export type LocationStatus = (typeof LOCATION_STATUSES)[number];

export type RuleEvaluationRequest = {
	mode: "disaster";
	directDangerCleared: boolean;
	environment: Environment;
	answers: RiskAnswer[];
	needsHelp: boolean;
	locationStatus: LocationStatus;
};

export type RuleEvaluationResponse = {
	ruleVersion: string;
	userState: UserState;
	cardId: string;
	nextActions: string[];
	sourceIds: string[];
};

// PRD FR-07 defines exactly three risk questions. The final wording and order are
// still TBD-01, but the answer count is part of the agreed interface shape.
const RISK_ANSWER_COUNT = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isUserState(value: unknown): value is UserState {
	return typeof value === "string" && USER_STATES.includes(value as UserState);
}

export function isRiskAnswer(value: unknown): value is RiskAnswer {
	return typeof value === "string" && RISK_ANSWERS.includes(value as RiskAnswer);
}

export function isEnvironment(value: unknown): value is Environment {
	return typeof value === "string" && ENVIRONMENTS.includes(value as Environment);
}

function isLocationStatus(value: unknown): value is LocationStatus {
	return typeof value === "string" && LOCATION_STATUSES.includes(value as LocationStatus);
}

export function isRuleEvaluationRequest(value: unknown): value is RuleEvaluationRequest {
	if (!isRecord(value)) {
		return false;
	}

	return (
		value.mode === "disaster" &&
		typeof value.directDangerCleared === "boolean" &&
		isEnvironment(value.environment) &&
		Array.isArray(value.answers) &&
		value.answers.length === RISK_ANSWER_COUNT &&
		value.answers.every(isRiskAnswer) &&
		typeof value.needsHelp === "boolean" &&
		isLocationStatus(value.locationStatus)
	);
}
