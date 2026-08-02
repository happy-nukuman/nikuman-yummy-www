"use client";

import type { FlowNode } from "@/features/demo/flows";
import { type DemoLang, t } from "@/features/demo/i18n";
import { Progress } from "@/features/demo/components/progress";

interface FlowScreenProps {
	active: boolean;
	lang: DemoLang;
	node: FlowNode | null;
	/** Selected option value per question node id. */
	answers: Record<string, string>;
	/** Index of the action card currently shown (action nodes only). */
	cardIndex: number;
	onAnswer: (value: string) => void;
	onNextActionCard: () => void;
	onOpenCommunication: () => void;
	onBack: () => void;
	onBackFromAction: () => void;
}

/** Renders question and action nodes; other node types have dedicated screens. */
export function FlowScreen({
	active,
	lang,
	node,
	answers,
	cardIndex,
	onAnswer,
	onNextActionCard,
	onOpenCommunication,
	onBack,
	onBackFromAction,
}: FlowScreenProps) {
	const actionCard = node?.type === "action" ? node.cards[cardIndex] : null;

	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="flow">
			{node?.type === "question" && (
				<>
					<Progress on={2} />
					<div className="question-count">{t(lang, "状态确认")}</div>
					<h1 className="hero-title">{t(lang, node.title)}</h1>
					<p className="lead">{t(lang, node.lead)}</p>
					<div className="choice-list">
						{node.options.map((option) => (
							<button
								key={option.value}
								type="button"
								className={`choice${answers[node.id] === option.value ? " selected" : ""}`}
								onClick={() => onAnswer(option.value)}
							>
								<span className="choice-icon">{option.icon}</span>
								<span>{t(lang, option.label)}</span>
							</button>
						))}
					</div>
					<div className="actions">
						<button type="button" className="btn secondary" onClick={onOpenCommunication}>
							{t(lang, "我做不到 / 需要帮助")}
						</button>
						<button type="button" className="btn ghost" onClick={onBack}>
							{t(lang, "返回上一步")}
						</button>
					</div>
				</>
			)}
			{node?.type === "action" && actionCard && (
				<>
					<Progress on={3} />
					<div className="question-count">
						{`${t(lang, "行动")} ${cardIndex + 1} / ${node.cards.length}`}
					</div>
					<div className={`action-hero${actionCard.kind === "dont" ? " dont" : ""}`}>
						<div className="eyebrow">
							{t(lang, actionCard.kind === "dont" ? "现在不要做" : "现在应该做")}
						</div>
						<h2>{t(lang, actionCard.title)}</h2>
						<p className="lead">{t(lang, actionCard.detail)}</p>
					</div>
					<div className="panel green">
						<div className="panel-row">
							<div className="panel-icon">👂</div>
							<div>
								<div className="panel-title">{t(lang, "同时确认现场信息")}</div>
								<div className="panel-copy">
									{t(lang, "听从工作人员、现场广播和官方发布。")}
								</div>
							</div>
						</div>
					</div>
					<div className="source">
						{t(lang, "规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断")}
					</div>
					<div className="actions">
						<button type="button" className="btn primary" onClick={onNextActionCard}>
							{t(lang, "下一步")}
						</button>
						<button type="button" className="btn secondary" onClick={onOpenCommunication}>
							{t(lang, "我做不到")}
						</button>
						<button type="button" className="btn ghost" onClick={onBackFromAction}>
							{t(lang, "返回上一步")}
						</button>
					</div>
				</>
			)}
		</section>
	);
}
