"use client";

import { type DemoLang, t } from "@/features/demo/i18n";
import { Progress } from "@/features/demo/components/progress";

interface SosScreenProps {
	active: boolean;
	lang: DemoLang;
	/** Continues the flow to the communication card (someone came close). */
	onShowCommunication: () => void;
	onBack: () => void;
}

/**
 * SOS card: shown when the user is trapped or cannot move. The 119 button is a
 * real tel: link (the only place in the demo that dials).
 */
export function SosScreen({ active, lang, onShowCommunication, onBack }: SosScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="sos">
			<Progress on={4} />
			<div className="question-count">{t(lang, "紧急求助")}</div>
			<h1 className="hero-title">{t(lang, "如手机有信号，立即拨打 119")}</h1>
			<div className="panel green">
				<div className="panel-row">
					<div className="panel-icon">⛑️</div>
					<div>
						<div className="panel-title">{t(lang, "等待救援时")}</div>
						<div className="panel-copy">
							{t(lang, "保存体力，保持手机电量。有规律地敲击墙壁或管道，让救援人员发现你。")}
						</div>
					</div>
				</div>
			</div>
			<div className="source">
				{t(lang, "规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断")}
			</div>
			<div className="actions">
				<a className="btn primary sos-call" href="tel:119">
					📞 {t(lang, "拨打 119")}
				</a>
				<button type="button" className="btn secondary" onClick={onShowCommunication}>
					{t(lang, "有人靠近时，展示沟通卡")}
				</button>
				<button type="button" className="btn ghost" onClick={onBack}>
					{t(lang, "返回上一步")}
				</button>
			</div>
		</section>
	);
}
