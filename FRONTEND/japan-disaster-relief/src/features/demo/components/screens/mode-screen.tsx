"use client";

import { type DemoLang, t } from "@/features/demo/i18n";

interface ModeScreenProps {
	active: boolean;
	lang: DemoLang;
	onEnterDisaster: () => void;
	onEnterDaily: () => void;
}

export function ModeScreen({ active, lang, onEnterDisaster, onEnterDaily }: ModeScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="mode">
			<div className="eyebrow">{t(lang, "选择模式")}</div>
			<h1 className="hero-title">{t(lang, "你现在需要哪种帮助？")}</h1>
			<p className="lead">{t(lang, "每次只完成一个判断，系统再给出下一步。")}</p>
			<div className="mode-card">
				<div className="mode-head">
					<div className="mode-icon">🚨</div>
					<div>
						<div className="mode-title">{t(lang, "灾害模式")}</div>
						<div className="mode-copy">
							{t(lang, "地震、火灾、水灾发生后，不知道下一步怎么办。")}
						</div>
					</div>
				</div>
				<button type="button" className="btn primary" onClick={onEnterDisaster}>
					{t(lang, "进入灾害模式")}
				</button>
			</div>
			<div className="mode-card">
				<div className="mode-head">
					<div className="mode-icon">🩹</div>
					<div>
						<div className="mode-title">{t(lang, "日常应急")}</div>
						<div className="mode-copy">{t(lang, "煤气泄漏、迷路、身体不适等紧急状况。")}</div>
					</div>
				</div>
				<button type="button" className="btn ghost" onClick={onEnterDaily}>
					{t(lang, "进入日常应急")}
				</button>
			</div>
			<div className="safe-banner">
				⚠️ {t(lang, "若仍处于建筑倒塌、火灾或其他直接危险中，请立即撤离并听从现场人员指示。")}
			</div>
		</section>
	);
}
