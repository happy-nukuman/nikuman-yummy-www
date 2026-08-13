"use client";

import { type DemoLang, t } from "@/features/demo/i18n";
import { HomeIcon, ShieldIcon } from "@/features/demo/components/app-icons";
import type { DemoSyncStatus } from "@/features/demo/demo-config";

interface AppFooterProps {
	lang: DemoLang;
	isHome: boolean;
	demoSyncStatus: DemoSyncStatus;
	teamName: string;
	onBack: () => void;
	onHome: () => void;
	onSupport: () => void;
}

/** App-shell status and navigation shared by every screen, including home. */
export function AppFooter({
	lang,
	isHome,
	demoSyncStatus,
	teamName,
	onBack,
	onHome,
	onSupport,
}: AppFooterProps) {
	const separator = lang === "en" ? ": " : "：";
	const syncText = `${t(lang, "Demo 模拟同步")}${separator}${demoSyncStatus.time} ${demoSyncStatus.timezone}`;

	return (
		<footer className={`app-footer${isHome ? " home" : ""}`}>
			{isHome ? (
				<>
					<div className="app-footer-privacy">
						<ShieldIcon className="app-footer-shield" aria-hidden />
						<div>
							<div className="app-footer-privacy-title">
								{t(lang, "无需注册・不收集个人信息")}
							</div>
							<div className="app-footer-privacy-copy">
								{t(lang, "位置信息仅用于本次查询，不会被保存。")}
							</div>
						</div>
					</div>
					<div className="app-footer-home-meta">
						<span className="app-footer-home-status">
							<span className="app-footer-data-dot" aria-hidden />
							{syncText}
						</span>
						<span className="app-footer-team">{teamName}</span>
						<button type="button" className="app-footer-support" onClick={onSupport}>
							{t(lang, "Support")}
						</button>
					</div>
				</>
			) : (
				<>
					<div className="app-footer-data-status">
						<span className="app-footer-data-dot" aria-hidden />
						<span>{syncText}</span>
					</div>
					<div className="app-footer-actions">
						<button
							type="button"
							className="app-footer-button app-footer-back"
							onClick={onBack}
						>
							<span className="app-footer-back-icon" aria-hidden>
								←
							</span>
							<span>{t(lang, "返回")}</span>
						</button>
						<button
							type="button"
							className="app-footer-button app-footer-home"
							onClick={onHome}
						>
							<HomeIcon className="app-footer-home-icon" />
							<span>{t(lang, "返回首页")}</span>
						</button>
					</div>
				</>
			)}
		</footer>
	);
}
