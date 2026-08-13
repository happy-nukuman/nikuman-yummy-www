"use client";

import { DISASTER_SNAPSHOT_DATE } from "@/features/demo/disaster-info";
import { dataSnapshotTimeText, type DemoLang, t } from "@/features/demo/i18n";
import { Progress } from "@/features/demo/components/progress";

export interface EventChoice {
	value: string;
	icon: string;
	/** Chinese source label; translated through the demo i18n table. */
	label: string;
	/** Optional Chinese source sub-label (e.g. "系统推荐 · 请确认"). */
	meta?: string;
	/** False marks an intentionally unavailable flow; the option remains visible but cannot be selected. */
	available?: boolean;
}

interface EventChoiceScreenProps {
	active: boolean;
	/** data-screen name ("event" or "daily"). */
	name: string;
	lang: DemoLang;
	/** Chinese source title; defaults to the generic question. */
	title?: string;
	/** Chinese source lead text. */
	lead: string;
	/** 显示 Demo 快照的数据来源卡（仅灾害模式）。 */
	showDataSources?: boolean;
	choices: readonly EventChoice[];
	selected: string | null;
	onSelect: (value: string) => void;
	/** 「确认并继续」：以当前选中项继续（new-ui ③ 的确认式交互）。 */
	onConfirm: (value: string) => void;
}

/** Event-confirmation card: a radio-style single-choice list shared by the disaster and daily modes. */
export function EventChoiceScreen({
	active,
	name,
	lang,
	title = "现在发生了什么？",
	lead,
	showDataSources = false,
	choices,
	selected,
	onSelect,
	onConfirm,
}: EventChoiceScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen={name}>
			<Progress on={1} label={t(lang, "流程进度")} />
			<h1 className="title-sm">{t(lang, title)}</h1>
			<p className="lead-sm">{t(lang, lead)}</p>
			{showDataSources && (
				<div className="panel source-panel">
					<div className="source-label">{t(lang, "数据来源")}</div>
					<div className="source-value">
						{t(lang, "日本气象厅、东京都防灾信息、内阁府防灾信息 等")}
					</div>
					<div className="source-label">{t(lang, "Demo 数据快照")}</div>
					<div className="source-value">
						{dataSnapshotTimeText(lang, DISASTER_SNAPSHOT_DATE)}
					</div>
					<div className="source-note">{t(lang, "非实时信息，请以官方发布为准")}</div>
				</div>
			)}
			<div className="choice-list" role="radiogroup" aria-label={t(lang, title)}>
				{choices.map((choice) => (
					<button
						key={choice.value}
						type="button"
						role="radio"
						aria-checked={selected === choice.value}
						aria-disabled={choice.available === false}
						disabled={choice.available === false}
						className={`choice${selected === choice.value ? " selected" : ""}${choice.available === false ? " coming-soon" : ""}`}
						onClick={() => onSelect(choice.value)}
					>
						<span className="choice-icon">{choice.icon}</span>
						<span>
							{t(lang, choice.label)}
							{choice.meta !== undefined && (
								<div className="choice-meta">{t(lang, choice.meta)}</div>
							)}
						</span>
						{choice.available === false && (
							<span className="coming-badge choice-coming-badge">{t(lang, "准备中")}</span>
						)}
					</button>
				))}
			</div>
			<div className="actions">
				<button
					type="button"
					className="btn primary"
					disabled={selected === null}
					onClick={() => selected !== null && onConfirm(selected)}
				>
					{t(lang, "确认并继续")}
				</button>
			</div>
		</section>
	);
}
