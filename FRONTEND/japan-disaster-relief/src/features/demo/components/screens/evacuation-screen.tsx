"use client";

import { type DemoLang, t } from "@/features/demo/i18n";
import { Progress } from "@/features/demo/components/progress";

interface EvacuationScreenProps {
	active: boolean;
	lang: DemoLang;
	/** Whether demo location has already been granted. */
	hasLocation: boolean;
	onAnswer: (needsEvacuation: boolean) => void;
}

/** Evacuation-confirmation card: asks whether nearby shelters should be listed. */
export function EvacuationScreen({
	active,
	lang,
	hasLocation,
	onAnswer,
}: EvacuationScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="shelter">
			<Progress on={4} label={t(lang, "流程进度")} />
			<h1 className="hero-title">{t(lang, "是否需要避难？")}</h1>
			<p className="lead">
				{t(lang, hasLocation
					? "系统会根据本次位置和官方开放数据列出候选设施。"
					: "选择导航到避难地点时，将询问是否使用演示位置。")}
			</p>
			<div className="panel amber">
				<div className="panel-title">{t(lang, "重要说明")}</div>
				<div className="panel-copy">
					{t(lang, "“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。")}
				</div>
			</div>
			<div className="actions">
				<button type="button" className="btn primary" onClick={() => onAnswer(true)}>
					{t(lang, "需要，导航到避难地点")}
				</button>
				<button type="button" className="btn secondary" onClick={() => onAnswer(false)}>
					{t(lang, "暂时不需要")}
				</button>
			</div>
		</section>
	);
}
