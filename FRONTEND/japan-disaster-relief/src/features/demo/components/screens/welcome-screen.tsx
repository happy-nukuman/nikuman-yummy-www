"use client";

import { type DemoLang, t, WELCOME_COPY } from "@/features/demo/i18n";

const LANGUAGE_OPTIONS = [
	["zh", "中文"],
	["en", "English"],
	["ja", "日本語"],
	["more", "更多语言"],
] as const;

interface WelcomeScreenProps {
	active: boolean;
	lang: DemoLang;
	onPickLanguage: (value: string) => void;
}

export function WelcomeScreen({ active, lang, onPickLanguage }: WelcomeScreenProps) {
	const welcome = WELCOME_COPY[lang];
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="welcome">
			<div className="eyebrow">{welcome.sub}</div>
			<h1 className="hero-title">{welcome.title}</h1>
			<p className="lead">{welcome.lead}</p>
			<h3>{welcome.prompt}</h3>
			<div className="grid2">
				{LANGUAGE_OPTIONS.map(([value, label]) => (
					<button
						key={value}
						type="button"
						className={`lang-btn${lang === value ? " active" : ""}`}
						onClick={() => onPickLanguage(value)}
					>
						{value === "more" ? t(lang, label) : label}
					</button>
				))}
			</div>
			<div className="panel tint">
				<div className="panel-row">
					<div className="panel-icon">📍</div>
					<div>
						<div className="panel-title">{welcome.locTitle}</div>
						<div className="panel-copy">{welcome.locCopy}</div>
					</div>
				</div>
			</div>
			<div className="actions">
				<div className="privacy">{welcome.privacy}</div>
			</div>
		</section>
	);
}
