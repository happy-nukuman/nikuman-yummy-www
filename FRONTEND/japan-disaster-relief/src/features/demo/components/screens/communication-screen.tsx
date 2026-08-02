"use client";

import { Fragment } from "react";
import { type DemoLang, PHRASES, PHRASE_TEXT, t } from "@/features/demo/i18n";

interface CommunicationScreenProps {
	active: boolean;
	lang: DemoLang;
	/** Index of the phrase currently shown. */
	phrase: number;
	pickerOpen: boolean;
	onSpeak: () => void;
	onTogglePicker: () => void;
	onPickPhrase: (index: number) => void;
	onReturn: () => void;
	onHome: () => void;
}

/** Japanese communication card: fixed reviewed phrases with speech playback. */
export function CommunicationScreen({
	active,
	lang,
	phrase,
	pickerOpen,
	onSpeak,
	onTogglePicker,
	onPickPhrase,
	onReturn,
	onHome,
}: CommunicationScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="communication">
			<div className="comm">
				<div className="eyebrow">{t(lang, "请把屏幕给对方看")}</div>
				<div className="jp-card">
					{PHRASES[phrase][0].map((line, i) => (
						<Fragment key={line}>
							{i > 0 && <br />}
							{line}
						</Fragment>
					))}
				</div>
				<div className="cn-text">{PHRASE_TEXT[lang][phrase]}</div>
				<div className="actions">
					<button type="button" className="btn primary" onClick={onSpeak}>
						{t(lang, "🔊 朗读日语")}
					</button>
					<button type="button" className="btn secondary" onClick={onTogglePicker}>
						{t(lang, pickerOpen ? "收起列表" : "切换其他沟通卡")}
					</button>
					{pickerOpen && (
						<div className="phrase-list">
							<div className="phrase-list-title">{t(lang, "选择要展示的沟通卡")}</div>
							{PHRASE_TEXT[lang].map((text, i) => (
								<button
									key={text}
									type="button"
									className={`phrase-option${i === phrase ? " selected" : ""}`}
									onClick={() => onPickPhrase(i)}
								>
									<span className="phrase-native">{text}</span>
									{lang !== "ja" && <span className="phrase-jp">{PHRASES[i][2]}</span>}
								</button>
							))}
						</div>
					)}
					<div className="comm-nav">
						<button type="button" className="btn ghost" onClick={onReturn}>
							{t(lang, "返回")}
						</button>
						<button type="button" className="btn ghost" onClick={onHome}>
							{t(lang, "返回主页")}
						</button>
					</div>
					<div className="privacy trust">{t(lang, "固定审核翻译 · 核心功能不依赖 AI")}</div>
				</div>
			</div>
		</section>
	);
}
