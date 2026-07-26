// DRAFT ENGINEERING PLACEHOLDER — NOT CONFIRMED SAFETY RULES.
//
// PRD TBD-01 states that the final wording, order and official basis of the three risk
// questions, and therefore the resulting rule table, are still to be confirmed by A组
// (饼叔牵头，三人确认). Every record below carries `reviewStatus: "draft"` and placeholder
// `sourceIds`. This table exists so that the API contract, the deterministic engine and the
// tests can be built in parallel with that confirmation.
//
// Consequences of the draft status:
// - No record may be presented to users, in the PPT or in the demo script as a confirmed
//   official action rule (PRD FR-10: 没有官方依据的分支不得进入正式比赛版本).
// - Card texts, action texts and official sources stay out of this file; the table only
//   carries ids that A组-confirmed language packs and card definitions will resolve later.
// - When A组 confirms the questions and rules, bump `RULE_VERSION`, replace the placeholder
//   `sourceIds` with real source ids and switch `reviewStatus` to the confirmed value.

import type { Environment, UserState } from "@nikuman-yummy/shared";

/** Rule table version reported by every evaluation (PRD FR-10: 修改规则时需要记录规则版本). */
export const RULE_VERSION = "p0-draft.1";

/**
 * Draft order of the three PRD FR-07 risk questions:
 * 0. 附近是否仍有火焰、烟雾或其他明显危险？
 * 1. 自己或身边的人是否严重受伤、无法移动或失去意识？
 * 2. 是否因语言、年龄、行动不便等原因需要帮助？
 *
 * The order itself is TBD-01; these constants keep the dependency explicit and easy to move.
 */
export const DANGER_NEARBY_ANSWER_INDEX = 0;
export const SERIOUS_INJURY_ANSWER_INDEX = 1;
export const ASSISTANCE_ANSWER_INDEX = 2;

/**
 * Placeholder source ids. They are deliberately marked as draft/pending so that no reviewer,
 * card text or slide can mistake them for verified official citations (PRD FR-10, §13).
 */
const DRAFT_SOURCE_IDS = [
	"src-tokyo-bousai-guide-draft",
	"src-a-group-confirmation-pending",
] as const;

/** Authoring date of this draft table, not an approved effective date. */
const DRAFT_EFFECTIVE_DATE = "2026-07-26";

/**
 * Matching condition of a rule record. Each kind maps to one small predicate in the rule
 * evaluation service, so the whole table stays readable and checkable.
 */
export type RuleCondition =
	/** The user answered that they have not left immediate danger (PRD FR-04). */
	| { readonly kind: "directDangerNotCleared" }
	/** Any of the listed risk questions was answered "yes". */
	| { readonly kind: "anyAnswerYes"; readonly answerIndexes: readonly number[] }
	/** Any of the three risk questions was answered "uncertain" (PRD §9 保守分支). */
	| { readonly kind: "anyAnswerUncertain" }
	/** The assistance question was answered "yes", or the client set `needsHelp`. */
	| { readonly kind: "assistanceRequested" }
	/** Always matches; used for the residual branch of a mode/environment. */
	| { readonly kind: "always" };

export type RuleRecord = {
	readonly ruleId: string;
	readonly ruleVersion: string;
	readonly mode: "disaster";
	/** A specific environment, or `"any"` when the environment does not change the result. */
	readonly environment: Environment | "any";
	readonly condition: RuleCondition;
	readonly resultState: UserState;
	readonly cardId: string;
	readonly nextActions: readonly string[];
	readonly sourceIds: readonly string[];
	readonly effectiveDate: string;
	readonly reviewStatus: "draft";
};

/**
 * Draft priority order. The first matching record wins, so record order is the rule priority:
 *
 * 1. `directDangerCleared === false` → `danger` boundary card, no complex questions (FR-04).
 * 2. danger nearby or serious injury answered "yes" → `danger`.
 * 3. any answer "uncertain" → `uncertain` (conservative branch, TC-07).
 * 4. assistance question "yes" or `needsHelp` → `need_help`.
 * 5. otherwise → `safe`.
 *
 * `locationStatus` intentionally does not appear in any condition: in this version it only
 * affects facility candidate lookup (PRD FR-05/FR-11), never `userState` or `cardId`.
 *
 * `transit` cards stay at 基础引导 level and point at staff guidance instead of facility
 * candidates, because PRD FR-06 forbids complex route judgement inside transit facilities.
 */
export const RULE_TABLE: readonly RuleRecord[] = [
	{
		ruleId: "rule-boundary-direct-danger",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "any",
		condition: { kind: "directDangerNotCleared" },
		resultState: "danger",
		cardId: "card-boundary-danger",
		nextActions: ["card-communication-help", "card-official-sources"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-danger-indoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "indoor",
		condition: {
			kind: "anyAnswerYes",
			answerIndexes: [DANGER_NEARBY_ANSWER_INDEX, SERIOUS_INJURY_ANSWER_INDEX],
		},
		resultState: "danger",
		cardId: "card-danger-indoor",
		nextActions: ["card-communication-help", "card-official-sources"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-danger-outdoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "outdoor",
		condition: {
			kind: "anyAnswerYes",
			answerIndexes: [DANGER_NEARBY_ANSWER_INDEX, SERIOUS_INJURY_ANSWER_INDEX],
		},
		resultState: "danger",
		cardId: "card-danger-outdoor",
		nextActions: ["card-communication-help", "card-official-sources"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-danger-transit",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "transit",
		condition: {
			kind: "anyAnswerYes",
			answerIndexes: [DANGER_NEARBY_ANSWER_INDEX, SERIOUS_INJURY_ANSWER_INDEX],
		},
		resultState: "danger",
		cardId: "card-danger-transit",
		nextActions: ["card-transit-staff-guidance", "card-communication-help"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-uncertain-indoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "indoor",
		condition: { kind: "anyAnswerUncertain" },
		resultState: "uncertain",
		cardId: "card-uncertain-indoor",
		nextActions: ["card-uncertain-recheck", "card-communication-help", "card-official-sources"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-uncertain-outdoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "outdoor",
		condition: { kind: "anyAnswerUncertain" },
		resultState: "uncertain",
		cardId: "card-uncertain-outdoor",
		nextActions: ["card-uncertain-recheck", "card-communication-help", "card-official-sources"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-uncertain-transit",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "transit",
		condition: { kind: "anyAnswerUncertain" },
		resultState: "uncertain",
		cardId: "card-uncertain-transit",
		nextActions: ["card-transit-staff-guidance", "card-communication-help"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-need-help-indoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "indoor",
		condition: { kind: "assistanceRequested" },
		resultState: "need_help",
		cardId: "card-need-help-indoor",
		nextActions: ["card-communication-help", "card-facility-candidates"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-need-help-outdoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "outdoor",
		condition: { kind: "assistanceRequested" },
		resultState: "need_help",
		cardId: "card-need-help-outdoor",
		nextActions: ["card-communication-help", "card-facility-candidates"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-need-help-transit",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "transit",
		condition: { kind: "assistanceRequested" },
		resultState: "need_help",
		cardId: "card-need-help-transit",
		nextActions: ["card-transit-staff-guidance", "card-communication-help"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-safe-indoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "indoor",
		condition: { kind: "always" },
		resultState: "safe",
		cardId: "card-safe-indoor",
		nextActions: ["card-facility-candidates", "card-communication-help", "card-official-sources"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-safe-outdoor",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "outdoor",
		condition: { kind: "always" },
		resultState: "safe",
		cardId: "card-safe-outdoor",
		nextActions: ["card-facility-candidates", "card-communication-help", "card-official-sources"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
	{
		ruleId: "rule-safe-transit",
		ruleVersion: RULE_VERSION,
		mode: "disaster",
		environment: "transit",
		condition: { kind: "always" },
		resultState: "safe",
		cardId: "card-safe-transit",
		nextActions: ["card-transit-staff-guidance", "card-communication-help"],
		sourceIds: DRAFT_SOURCE_IDS,
		effectiveDate: DRAFT_EFFECTIVE_DATE,
		reviewStatus: "draft",
	},
];

/**
 * Defensive residual rule. `RULE_TABLE` already covers every valid request, so this record is
 * only used if the table and the request contract ever drift apart. It stays conservative: it
 * never reports `safe`. Tests assert that valid input never reaches it.
 */
export const CONSERVATIVE_FALLBACK_RULE: RuleRecord = {
	ruleId: "rule-fallback-uncertain",
	ruleVersion: RULE_VERSION,
	mode: "disaster",
	environment: "any",
	condition: { kind: "always" },
	resultState: "uncertain",
	cardId: "card-uncertain-fallback",
	nextActions: ["card-communication-help", "card-official-sources"],
	sourceIds: DRAFT_SOURCE_IDS,
	effectiveDate: DRAFT_EFFECTIVE_DATE,
	reviewStatus: "draft",
};
