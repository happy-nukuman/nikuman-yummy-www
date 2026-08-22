"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { type DemoLang, t, WELCOME_COPY } from "@/features/demo/i18n";
import {
	CloseIcon,
	GlobeIcon,
	QrCodeIcon,
	TranslateIcon,
} from "@/features/demo/components/app-icons";

interface TopBarProps {
	lang: DemoLang;
	/** 点击左上角 logo：回到首页（欢迎页）。 */
	onHome: () => void;
	onOpenCommunication: () => void;
	/** 出示二维码，把当前 App 地址分享给身边的人。 */
	onOpenShare: () => void;
	onSwitchLanguage: (lang: DemoLang) => void;
}

const LANGUAGE_LABELS: Record<DemoLang, string> = {
	zh: "简体中文",
	en: "English",
	ja: "日本語",
};

const OTHER_LANGUAGES = [
	"한국어",
	"Tiếng Việt",
	"ภาษาไทย",
	"Bahasa Indonesia",
	"Español",
	"Português",
	"Français",
];

export function TopBar({
	lang,
	onHome,
	onOpenCommunication,
	onOpenShare,
	onSwitchLanguage,
}: TopBarProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [otherLanguagesOpen, setOtherLanguagesOpen] = useState(false);

	useEffect(() => {
		if (!menuOpen && !otherLanguagesOpen) return;
		function closeOnEscape(event: KeyboardEvent) {
			if (event.key !== "Escape") return;
			setMenuOpen(false);
			setOtherLanguagesOpen(false);
		}
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [menuOpen, otherLanguagesOpen]);

	function chooseLanguage(next: DemoLang) {
		setMenuOpen(false);
		onSwitchLanguage(next);
	}

	return (
		<>
			<header className="topbar home">
				<button type="button" className="brand-logo" aria-label={t(lang, "返回主页")} onClick={onHome}>
					<Image
						src="/logo-tokyo-safe-first.png"
						alt="Tokyo Safe First"
						width={270}
						height={106}
						priority
						sizes="(max-width: 399px) 122px, 140px"
					/>
				</button>
				<div className="top-actions">
					<button
						type="button"
						className="top-action share-action"
						aria-label={t(lang, "分享这个 App")}
						title={t(lang, "分享这个 App")}
						onClick={onOpenShare}
					>
						<QrCodeIcon className="top-action-icon" />
					</button>
					<button
						type="button"
						className="top-action communication-action"
						aria-label={t(lang, "翻译沟通")}
						onClick={onOpenCommunication}
					>
						<TranslateIcon className="top-action-icon" />
						<span className="communication-action-label">{t(lang, "翻译沟通")}</span>
					</button>
					<div className="language-control">
						<button
							type="button"
							className="top-action language-trigger"
							aria-label={WELCOME_COPY[lang].prompt}
							aria-haspopup="menu"
							aria-expanded={menuOpen}
							onClick={() => setMenuOpen((open) => !open)}
						>
							<GlobeIcon className="top-action-icon" />
							<span className="current-language">{lang === "zh" ? "中文" : LANGUAGE_LABELS[lang]}</span>
							<span className="language-chevron" aria-hidden>⌄</span>
						</button>
						{menuOpen && (
							<>
								<button
									type="button"
									className="menu-scrim"
									aria-label={t(lang, "关闭")}
									onClick={() => setMenuOpen(false)}
								/>
								<div className="language-menu" role="menu">
									{(["zh", "en", "ja"] as const).map((language) => (
										<button
											key={language}
											type="button"
											className="language-option"
											role="menuitemradio"
											aria-checked={lang === language}
											onClick={() => chooseLanguage(language)}
										>
											<span className="language-check" aria-hidden>{lang === language ? "✓" : ""}</span>
											{LANGUAGE_LABELS[language]}
										</button>
									))}
									<div className="language-divider" />
									<button
										type="button"
										className="language-option"
										role="menuitem"
										onClick={() => {
											setMenuOpen(false);
											setOtherLanguagesOpen(true);
										}}
									>
										<span className="language-check" aria-hidden>＋</span>
										{t(lang, "其他语言…")}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			</header>

			{otherLanguagesOpen && (
				<div
					className="modal-backdrop language-modal-backdrop"
					onMouseDown={(event) => {
						if (event.currentTarget === event.target) setOtherLanguagesOpen(false);
					}}
				>
					<div className="modal language-modal" role="dialog" aria-modal="true" aria-labelledby="other-language-title">
						<button
							type="button"
							className="modal-close"
							aria-label={t(lang, "关闭")}
							onClick={() => setOtherLanguagesOpen(false)}
						>
							<CloseIcon />
						</button>
						<div className="modal-icon"><GlobeIcon /></div>
						<h2 className="modal-title" id="other-language-title">{t(lang, "选择其他语言")}</h2>
						<p className="modal-copy">{t(lang, "以下语言正在准备中，当前版本尚未开放。")}</p>
						<div className="coming-language-list">
							{OTHER_LANGUAGES.map((language) => (
								<div className="coming-language" key={language} aria-disabled="true">
									<span>{language}</span>
									<span className="coming-badge">{t(lang, "准备中")}</span>
								</div>
							))}
						</div>
						<button type="button" className="btn secondary" onClick={() => setOtherLanguagesOpen(false)}>
							{t(lang, "关闭")}
						</button>
					</div>
				</div>
			)}
		</>
	);
}
