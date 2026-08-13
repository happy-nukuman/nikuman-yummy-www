"use client";

import Image from "next/image";
import { type DemoLang, t, WELCOME_COPY } from "@/features/demo/i18n";
import { ChevronRightIcon } from "@/features/demo/components/app-icons";

interface WelcomeScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 位置许可结果，仅影响附近设施与灾害信息。 */
	locPermission: "unknown" | "granted" | "denied";
	/** 首页灾害模式卡：直达灾害事象确认页。 */
	onEnterDisaster: () => void;
	/** 首页日常应急卡：直达日常应急类型选择页。 */
	onEnterDaily: () => void;
	/** 「紧急求助」：进入现有 119 / 110 紧急求助画面（不依赖位置）。 */
	onEmergency: () => void;
	/** 「附近避难设施」：进入避难所候选列表（需要定位许可）。 */
	onOpenFacilities: () => void;
	/** 「灾害信息」：进入附近灾害信息列表（需要定位许可）。 */
	onOpenDisasterInfo: () => void;
}

export function WelcomeScreen({
	active,
	lang,
	locPermission,
	onEnterDisaster,
	onEnterDaily,
	onEmergency,
	onOpenFacilities,
	onOpenDisasterInfo,
}: WelcomeScreenProps) {
	const welcome = WELCOME_COPY[lang];
	const locationDenied = locPermission === "denied";

	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="welcome">
			{locationDenied && (
				// 拒绝定位只影响两个位置功能；模式入口与紧急求助继续可用。
				<div className="panel amber location-warning">
					<div className="panel-row">
						<div className="panel-icon">📍</div>
						<div>
							<div className="panel-title">{t(lang, "未获得定位权限")}</div>
							<div className="panel-copy">
								{t(lang, "附近避难设施和灾害信息暂不可用，其他功能仍可使用。")}
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="welcome-heading">
				<h1 className="hero-title welcome-title">{welcome.title}</h1>
				<p className="lead welcome-lead">{welcome.lead}</p>
			</div>

			<div className="home-mode-list">
				<button
					type="button"
					className="mode-entry disaster-mode-entry"
					onClick={onEnterDisaster}
				>
					<span className="mode-entry-icon" aria-hidden>
						<Image
							className="provided-home-icon"
							src="/icons/disaster-mode.png"
							alt=""
							fill
							unoptimized
							sizes="(max-width: 399px) 68px, 78px"
						/>
					</span>
					<span className="mode-entry-copy">
						<span className="mode-entry-title">{t(lang, "灾害模式")}</span>
						<span className="mode-entry-description">
							{t(lang, "地震、火灾、水灾发生后，不知道下一步怎么办。")}
						</span>
					</span>
					<ChevronRightIcon className="mode-entry-arrow" />
				</button>

				<button
					type="button"
					className="mode-entry daily-mode-entry"
					onClick={onEnterDaily}
				>
					<span className="mode-entry-icon" aria-hidden>
						<Image
							className="provided-home-icon"
							src="/icons/daily-emergency.png"
							alt=""
							fill
							unoptimized
							sizes="(max-width: 399px) 68px, 78px"
						/>
					</span>
					<span className="mode-entry-copy">
						<span className="mode-entry-title">{t(lang, "日常应急")}</span>
						<span className="mode-entry-description">
							{t(lang, "煤气泄漏、迷路、身体不适等紧急状况。")}
						</span>
					</span>
					<ChevronRightIcon className="mode-entry-arrow" />
				</button>
			</div>

			<div className="home-feature-grid">
				<button
					type="button"
					className={`feature-card facility-feature${locationDenied ? " location-locked" : ""}`}
					onClick={onOpenFacilities}
					disabled={locationDenied}
				>
					<span className="feature-icon" aria-hidden>
						<Image
							className="provided-home-icon"
							src="/icons/shelter.png"
							alt=""
							fill
							unoptimized
							sizes="(max-width: 399px) 44px, 48px"
						/>
					</span>
					<span className="feature-title">{t(lang, "附近避难设施")}</span>
					<span className="feature-copy">{t(lang, "查看最近的避难设施")}</span>
					{locationDenied && <span className="feature-status">{t(lang, "需要位置权限")}</span>}
					<ChevronRightIcon className="feature-chevron" />
				</button>

				<button
					type="button"
					className={`feature-card disaster-feature${locationDenied ? " location-locked" : ""}`}
					onClick={onOpenDisasterInfo}
					disabled={locationDenied}
				>
					<span className="feature-icon" aria-hidden>
						<Image
							className="provided-home-icon"
							src="/icons/disaster-info.png"
							alt=""
							fill
							unoptimized
							sizes="(max-width: 399px) 44px, 48px"
						/>
					</span>
					<span className="feature-title">{t(lang, "灾害信息")}</span>
					<span className="feature-copy">{t(lang, "获取最新灾害通知")}</span>
					{locationDenied && <span className="feature-status">{t(lang, "需要位置权限")}</span>}
					<ChevronRightIcon className="feature-chevron" />
				</button>

				<button type="button" className="feature-card emergency-feature" onClick={onEmergency}>
					<span className="feature-icon" aria-hidden>
						<Image
							className="provided-home-icon"
							src="/icons/emergency-call.png"
							alt=""
							fill
							unoptimized
							sizes="(max-width: 399px) 44px, 48px"
						/>
					</span>
					<span className="feature-title">{t(lang, "紧急求助")}</span>
					<span className="feature-copy">
						{t(lang, "灾害・急病・事故・危险情况时使用")}
					</span>
					<ChevronRightIcon className="feature-chevron" />
				</button>
			</div>
		</section>
	);
}
