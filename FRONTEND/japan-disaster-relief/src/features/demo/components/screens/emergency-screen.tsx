"use client";

import { type DemoLang, t } from "@/features/demo/i18n";
import {
	AlertTriangleIcon,
	PhoneIcon,
	SirenIcon,
} from "@/features/demo/components/app-icons";

interface EmergencyScreenProps {
	active: boolean;
	lang: DemoLang;
}

/**
 * 紧急求助画面（DOCS/new-ui.png ⑦）：从首页直达的 119 / 110 拨打入口。
 * 与流程内的 SOS 卡（被困场景）不同，这里不属于任何流程节点。
 * 已获取位置时顶部由 demo-app 的 loc-bar 显示当前位置。
 */
export function EmergencyScreen({ active, lang }: EmergencyScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="emergency">
			<div className="question-count">{t(lang, "紧急求助")}</div>
			<div className="sos-banner">
				<SirenIcon className="btn-icon" />
				{t(lang, "如果遇到危险，请立即求助")}
			</div>
			<a className="btn stacked call-119" href="tel:119">
				<span className="btn-main"><PhoneIcon className="btn-icon" />{t(lang, "拨打 119")}</span>
				<span className="btn-sub">{t(lang, "火灾・救护・急病")}</span>
			</a>
			<a className="btn stacked call-110" href="tel:110">
				<span className="btn-main"><PhoneIcon className="btn-icon" />{t(lang, "拨打 110")}</span>
				<span className="btn-sub">{t(lang, "警察・犯罪・纠纷・危险人物")}</span>
			</a>
			<div className="panel amber">
				<div className="panel-row">
					<div className="panel-icon">
						<AlertTriangleIcon />
					</div>
					<div>
						<div className="panel-copy">
							{t(lang, "确保自身安全后再拨打电话。尽量在安全地点使用。")}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
