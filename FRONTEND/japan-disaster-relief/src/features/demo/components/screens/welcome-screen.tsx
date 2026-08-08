"use client";

import { type DemoLang, t, WELCOME_COPY } from "@/features/demo/i18n";

interface WelcomeScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 进入首页前询问的定位许可结果，决定位置卡片内容和功能是否可用。 */
	locPermission: "unknown" | "granted" | "denied";
	/** 主 CTA「查看现在应该做什么」：进入模式选择（需要定位许可）。 */
	onStart: () => void;
	/** 「紧急求助」：进入 119 / 110 紧急求助画面（不依赖位置）。 */
	onEmergency: () => void;
	/** 「附近避难设施」磁贴：进入避难所候选列表（需要定位许可）。 */
	onOpenFacilities: () => void;
	/** 「灾害信息」磁贴：进入附近灾害信息列表（需要定位许可）。 */
	onOpenDisasterInfo: () => void;
	/** 拒绝后重新弹出定位许可弹窗。 */
	onRequestLocation: () => void;
}

export function WelcomeScreen({
	active,
	lang,
	locPermission,
	onStart,
	onEmergency,
	onOpenFacilities,
	onOpenDisasterInfo,
	onRequestLocation,
}: WelcomeScreenProps) {
	const welcome = WELCOME_COPY[lang];
	// 未获许可（含未作答）时，位置相关功能不可用。
	const locked = locPermission !== "granted";
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="welcome">
			{locPermission === "denied" ? (
				// 拒绝定位：不显示地址，说明位置相关功能不可用，并提供重新授权入口。
				<div className="panel amber">
					<div className="panel-row">
						<div className="panel-icon">📍</div>
						<div>
							<div className="panel-title">{t(lang, "未获得定位权限")}</div>
							<div className="panel-copy">{t(lang, "允许定位后才能使用位置相关功能。")}</div>
						</div>
					</div>
					<button type="button" className="btn secondary loc-retry" onClick={onRequestLocation}>
						{t(lang, "允许获取位置")}
					</button>
				</div>
			) : (
				<div className="panel tint">
					<div className="panel-row">
						<div className="panel-icon">📍</div>
						<div>
							<div className="panel-title">
								{locPermission === "unknown"
									? t(lang, "正在获取当前位置…")
									: t(lang, "東京都新宿区西新宿六丁目8番附近 · 仅本次使用")}
							</div>
							{locPermission === "granted" && (
								<div className="panel-copy">{t(lang, "定位精度：大致位置")}</div>
							)}
						</div>
					</div>
				</div>
			)}
			<h1 className="hero-title">{welcome.title}</h1>
			<p className="lead">{welcome.lead}</p>
			<div className="home-actions">
				<button type="button" className="home-cta go" onClick={onStart} disabled={locked}>
					<span className="cta-icon" aria-hidden>
						🧭
					</span>
					<span className="cta-text">
						<span className="cta-title">{t(lang, "查看现在应该做什么")}</span>
						<span className="cta-sub">{t(lang, "帮助您做出正确的下一步判断")}</span>
					</span>
					<span className="cta-arrow" aria-hidden>
						›
					</span>
				</button>
				<button type="button" className="home-cta sos" onClick={onEmergency}>
					<span className="cta-icon" aria-hidden>
						📞
					</span>
					<span className="cta-text">
						<span className="cta-title">{t(lang, "紧急求助")}</span>
						<span className="cta-sub">{t(lang, "灾害・急病・事故・危险情况时使用")}</span>
					</span>
					<span className="cta-arrow" aria-hidden>
						›
					</span>
				</button>
			</div>
			<div className="tile-grid">
				<button type="button" className="tile" onClick={onOpenFacilities} disabled={locked}>
					<span className="tile-icon" aria-hidden>
						📍
					</span>
					<span className="tile-title">{t(lang, "附近避难设施")}</span>
					<span className="tile-copy">{t(lang, "查看最近的避难设施")}</span>
				</button>
				<button type="button" className="tile" onClick={onOpenDisasterInfo} disabled={locked}>
					<span className="tile-icon" aria-hidden>
						🔔
					</span>
					<span className="tile-title">{t(lang, "灾害信息")}</span>
					<span className="tile-copy">{t(lang, "获取最新灾害通知")}</span>
				</button>
			</div>
			<div className="privacy-note">
				<div className="privacy-title">{t(lang, "无需注册 · 不收集个人信息")}</div>
				<div className="privacy-copy">{t(lang, "位置信息仅用于本次查询，不会被保存。")}</div>
			</div>
		</section>
	);
}
