"use client";

import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import { type DemoLang, t } from "@/features/demo/i18n";
import { ShelterCandidateList } from "@/features/shelter/components/shelter-candidate-list";
import type { useDemoShelters } from "@/features/shelter/hooks/use-demo-shelters";

interface FacilitiesScreenProps {
	active: boolean;
	lang: DemoLang;
	shelters: ReturnType<typeof useDemoShelters>;
	onRetry: () => void;
	onNavigate: (facility: DemoShelterCandidate) => void;
	onBack: () => void;
}

/** Nearby shelter candidates: loading / error / result states of the demo query. */
export function FacilitiesScreen({
	active,
	lang,
	shelters,
	onRetry,
	onNavigate,
	onBack,
}: FacilitiesScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="facilities">
			<h1 className="hero-title">{t(lang, "附近设施候选")}</h1>
			{shelters.isPending && (
				<div className="panel">
					<div className="panel-row">
						<div className="panel-icon">⏳</div>
						<div>
							<div className="panel-title">{t(lang, "正在获取附近的避难所候选…")}</div>
							<div className="panel-copy">{t(lang, "根据本次位置查询官方开放数据快照。")}</div>
						</div>
					</div>
				</div>
			)}
			{shelters.isError && (
				<>
					<div className="panel amber">
						<div className="panel-title">{t(lang, "当前服务受限")}</div>
						<div className="panel-copy">
							{t(lang, "无法获取最新设施数据。请确认现场广播、工作人员和官方信息。")}
						</div>
					</div>
					<div className="actions">
						<button type="button" className="btn primary" onClick={onRetry}>
							{t(lang, "重新尝试")}
						</button>
					</div>
				</>
			)}
			{shelters.isSuccess && (
				<ShelterCandidateList response={shelters.data} lang={lang} onNavigate={onNavigate} />
			)}
			<div className="actions">
				<button type="button" className="btn ghost" onClick={onBack}>
					{t(lang, "返回上一步")}
				</button>
			</div>
		</section>
	);
}
