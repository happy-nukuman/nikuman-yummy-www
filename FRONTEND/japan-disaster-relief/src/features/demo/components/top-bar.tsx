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
					<img className="icon-btn-img" src="/new-communication-card.png" alt="" />
				</button>
				<span className="lang-wrap">
					<svg
						className="lang-globe"
						aria-hidden
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.4"
						strokeLinecap="round"
					>
						<circle cx="12" cy="12" r="9.5" />
						<ellipse cx="12" cy="12" rx="4.2" ry="9.5" />
						<path d="M3.2 9h17.6M3.2 15h17.6" />
					</svg>
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
				</span>
			</div>
		</header>
	);
}
