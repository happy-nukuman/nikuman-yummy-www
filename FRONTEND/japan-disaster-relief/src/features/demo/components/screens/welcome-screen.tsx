"use client";

import { type DemoLang, t, WELCOME_COPY } from "@/features/demo/i18n";
import {
	ChecklistIcon,
	ChevronRightIcon,
	CommunicationIcon,
	DisasterIcon,
	ShelterIcon,
	ShieldIcon,
	SirenIcon,
} from "@/features/demo/components/app-icons";

interface WelcomeScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 位置许可结果，仅影响附近设施与灾害信息。 */
	locPermission: "unknown" | "granted" | "denied";
	/** 主 CTA「查看现在应该做什么」：始终可进入模式选择。 */
	onStart: () => void;
	/** 「紧急求助」：进入 119 / 110 紧急求助画面（不依赖位置）。 */
	onEmergency: () => void;
	/** 「附近避难设施」磁贴：进入避难所候选列表（需要定位许可）。 */
	onOpenFacilities: () => void;
	/** 「灾害信息」磁贴：进入附近灾害信息列表（需要定位许可）。 */
	onOpenDisasterInfo: () => void;
	/** 「多语言沟通卡」磁贴：打开沟通卡（不依赖位置）。 */
	onOpenCommunication: () => void;
}

export function WelcomeScreen({
	active,
	lang,
	locPermission,
	onStart,
	onEmergency,
	onOpenFacilities,
	onOpenDisasterInfo,
	onOpenCommunication,
}: WelcomeScreenProps) {
	const welcome = WELCOME_COPY[lang];
	const locationDenied = locPermission === "denied";
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="welcome">
			{locPermission === "denied" && (
				// 拒绝定位只影响两个位置功能；主判断流程继续可用。
				<div className="panel amber">
					<div className="panel-row">
						<div className="panel-icon">📍</div>
						<div>
							<div className="panel-title">{t(lang, "未获得定位权限")}</div>
							<div className="panel-copy">{t(lang, "附近避难设施和灾害信息暂不可用，其他功能仍可使用。")}</div>
						</div>
					</div>
				</div>
			)}
			<h1 className="hero-title">{welcome.title}</h1>
			<p className="lead">{welcome.lead}</p>
			<div className="home-actions">
				<button type="button" className="home-cta go" onClick={onStart}>
					<span className="cta-icon" aria-hidden><ChecklistIcon /></span>
					<span className="cta-text">
						<span className="cta-title">{t(lang, "查看现在应该做什么")}</span>
						<span className="cta-sub">{t(lang, "帮助您做出正确的下一步判断")}</span>
					</span>
					<span className="cta-arrow" aria-hidden><ChevronRightIcon /></span>
				</button>
				<button type="button" className="home-cta sos" onClick={onEmergency}>
					<span className="cta-icon" aria-hidden><SirenIcon /></span>
					<span className="cta-text">
						<span className="cta-title">{t(lang, "紧急求助")}</span>
						<span className="cta-sub">{t(lang, "灾害・急病・事故・危险情况时使用")}</span>
					</span>
					<span className="cta-arrow" aria-hidden><ChevronRightIcon /></span>
				</button>
			</div>
			<div className="tile-grid">
				<button
					type="button"
					className={`tile${locationDenied ? " location-locked" : ""}`}
					onClick={onOpenFacilities}
					disabled={locationDenied}
				>
					<span className="tile-icon shelter" aria-hidden><ShelterIcon /></span>
					<span className="tile-title">{t(lang, "附近避难设施")}</span>
					<span className="tile-copy">{t(lang, "查看最近的避难设施")}</span>
					{locationDenied && <span className="tile-status">{t(lang, "需要位置权限")}</span>}
					<ChevronRightIcon className="tile-chevron" />
				</button>
				<button
					type="button"
					className={`tile${locationDenied ? " location-locked" : ""}`}
					onClick={onOpenDisasterInfo}
					disabled={locationDenied}
				>
					<span className="tile-icon disaster" aria-hidden><DisasterIcon /></span>
					<span className="tile-title">{t(lang, "灾害信息")}</span>
					<span className="tile-copy">{t(lang, "公开灾害信息")}</span>
					{locationDenied && <span className="tile-status">{t(lang, "需要位置权限")}</span>}
					<ChevronRightIcon className="tile-chevron" />
				</button>
				<button type="button" className="tile communication-tile" onClick={onOpenCommunication}>
					<span className="tile-icon communication" aria-hidden><CommunicationIcon /></span>
					<span className="tile-title">{t(lang, "多语言沟通卡")}</span>
					<span className="tile-copy">{t(lang, "用日语短句与周围的人沟通")}</span>
					<ChevronRightIcon className="tile-chevron" />
				</button>
			</div>
			<div className="privacy-note">
				<ShieldIcon className="privacy-icon" aria-hidden />
				<div>
					<div className="privacy-title">{t(lang, "无需注册 · 不收集个人信息")}</div>
					<div className="privacy-copy">{t(lang, "位置信息仅用于本次查询，不会被保存。")}</div>
				</div>
			</div>
		</section>
	);
}
