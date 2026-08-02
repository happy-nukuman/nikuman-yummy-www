"use client";

import { type DemoLang, t } from "@/features/demo/i18n";
import { Progress } from "@/features/demo/components/progress";

interface EvacuationScreenProps {
	active: boolean;
	lang: DemoLang;
	/** Location line shown in the current-location panel. */
	locationLabel: string;
	onAnswer: (needsEvacuation: boolean) => void;
	onBack: () => void;
}

/** Evacuation-confirmation card: asks whether nearby shelters should be listed. */
export function EvacuationScreen({
	active,
	lang,
	locationLabel,
	onAnswer,
	onBack,
}: EvacuationScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="shelter">
			<Progress on={4} />
			<h1 className="hero-title">{t(lang, "是否需要避难？")}</h1>
			<p className="lead">{t(lang, "系统会根据本次位置和官方开放数据列出候选设施。")}</p>
			<div className="panel amber">
				<div className="panel-title">{t(lang, "重要说明")}</div>
				<div className="panel-copy">
					{t(lang, "“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。")}
				</div>
			</div>
			<div className="panel">
				<div className="panel-row">
					<div className="panel-icon">📍</div>
					<div>
						<div className="panel-title">{t(lang, "当前位置")}</div>
						<div className="panel-copy">{locationLabel}</div>
					</div>
				</div>
			</div>
			<div className="actions">
				<button type="button" className="btn primary" onClick={() => onAnswer(true)}>
					{t(lang, "需要，导航到避难地点")}
				</button>
				<button type="button" className="btn secondary" onClick={() => onAnswer(false)}>
					{t(lang, "暂时不需要")}
				</button>
				<button type="button" className="btn ghost" onClick={onBack}>
					{t(lang, "返回上一步")}
				</button>
			</div>
		</section>
	);
}
