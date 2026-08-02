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
	/** Chinese source lead text. */
	lead: string;
	choices: readonly EventChoice[];
	selected: string | null;
	onSelect: (value: string) => void;
	onBack: () => void;
}

/** Event-confirmation card: a single-choice list shared by the disaster and daily modes. */
export function EventChoiceScreen({
	active,
	name,
	lang,
	lead,
	choices,
	selected,
	onSelect,
	onBack,
}: EventChoiceScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen={name}>
			<Progress on={1} />
			<div className="eyebrow">{t(lang, "事象确认")}</div>
			<h1 className="hero-title">{t(lang, "现在发生了什么？")}</h1>
			<p className="lead">{t(lang, lead)}</p>
			<div className="choice-list">
				{choices.map((choice) => (
					<button
						key={choice.value}
						type="button"
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
				<button type="button" className="btn secondary" onClick={onBack}>
					{t(lang, "返回")}
				</button>
			</div>
		</section>
	);
}
