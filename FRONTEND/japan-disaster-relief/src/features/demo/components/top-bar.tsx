"use client";

import { type DemoLang, t, WELCOME_COPY } from "@/features/demo/i18n";

interface TopBarProps {
	lang: DemoLang;
	subtitle: string;
	onOpenCommunication: () => void;
	onSwitchLanguage: (lang: DemoLang) => void;
}

export function TopBar({ lang, subtitle, onOpenCommunication, onSwitchLanguage }: TopBarProps) {
	return (
		<header className="topbar">
			<div className="brand">
				<div className="logo">
					<img src="/logo.png" alt="Tokyo Safe First" />
				</div>
				<div>
					<div className="brand-text">Tokyo Safe First</div>
					<div className="brand-sub">{subtitle}</div>
				</div>
			</div>
			<div className="top-actions">
				<button
					type="button"
					className="icon-btn"
					aria-label={t(lang, "沟通卡")}
					onClick={onOpenCommunication}
				>
					<img className="icon-btn-img" src="/communication-card.png" alt="" />
				</button>
				<select
					className="lang-select"
					aria-label={WELCOME_COPY[lang].prompt}
					value={lang}
					onChange={(event) => onSwitchLanguage(event.target.value as DemoLang)}
				>
					<option value="zh">中文</option>
					<option value="en">English</option>
					<option value="ja">日本語</option>
				</select>
			</div>
		</header>
	);
}
