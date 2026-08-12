"use client";

import { type DemoLang, t } from "@/features/demo/i18n";
import { Progress } from "@/features/demo/components/progress";

export interface EventChoice {
	value: string;
	icon: string;
	/** Chinese source label; translated through the demo i18n table. */
	label: string;
	/** Optional Chinese source sub-label (e.g. "系统推荐 · 请确认"). */
	meta?: string;
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
	/** 显示“数据来源 / 更新时间”卡（DOCS/new-ui.png ③，仅灾害模式）。 */
	showDataSources?: boolean;
	choices: readonly EventChoice[];
	selected: string | null;
	onSelect: (value: string) => void;
	/** 「确认并继续」：以当前选中项继续（new-ui ③ 的确认式交互）。 */
	onConfirm: (value: string) => void;
	onBack: () => void;
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
	onBack,
}: EventChoiceScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen={name}>
			<Progress on={1} />
			<h1 className="title-sm">{t(lang, title)}</h1>
			<p className="lead-sm">{t(lang, lead)}</p>
			{showDataSources && (
				<div className="panel source-panel">
					<div className="source-label">{t(lang, "数据来源")}</div>
					<div className="source-value">
						{t(lang, "日本气象厅、东京都防灾信息、内阁府防灾信息 等")}
					</div>
					<div className="source-label">{t(lang, "更新时间")}</div>
					<div className="source-value">2025/08/06 19:42</div>
					<div className="source-note">{t(lang, "此信息仅供参考，请以实际情况为准。")}</div>
				</div>
			)}
			<div className="choice-list" role="radiogroup" aria-label={t(lang, title)}>
				{choices.map((choice) => (
					<button
						key={choice.value}
						type="button"
						role="radio"
						aria-checked={selected === choice.value}
						className={`choice${selected === choice.value ? " selected" : ""}`}
						onClick={() => onSelect(choice.value)}
					>
						<span className="choice-icon">{choice.icon}</span>
						<span>
							{t(lang, choice.label)}
							{choice.meta !== undefined && (
								<div className="choice-meta">{t(lang, choice.meta)}</div>
							)}
						</span>
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
				<button type="button" className="btn ghost" onClick={onBack}>
					← {t(lang, "返回上一步")}
				</button>
			</div>
		</section>
	);
}
