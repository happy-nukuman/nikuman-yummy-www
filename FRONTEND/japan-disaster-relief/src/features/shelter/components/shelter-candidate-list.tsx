"use client";

import type { DemoShelterCandidate, DemoShelterNearbyResponse } from "@nikuman-yummy/shared";
import { formatDemoSnapshotDate, type DemoLang, t } from "@/features/demo/i18n";
import { ShelterCandidateCard } from "./shelter-candidate-card";

interface ShelterCandidateListProps {
	response: DemoShelterNearbyResponse;
	lang: DemoLang;
	onNavigate: (facility: DemoShelterCandidate) => void;
}

export function ShelterCandidateList({ response, lang, onNavigate }: ShelterCandidateListProps) {
	return (
		<>
			{response.facilities.length === 0 ? (
				<div className="panel amber">
					<div className="panel-title">{t(lang, "附近 3 公里内暂无可显示的候选设施")}</div>
					<div className="panel-copy">
						{t(lang, "请确认现场广播、工作人员和官方信息，不要依赖本页面。")}
					</div>
				</div>
			) : (
				response.facilities.map((facility, index) => (
					<ShelterCandidateCard
						key={facility.facilityId}
						facility={facility}
						index={index}
						lang={lang}
						onNavigate={onNavigate}
					/>
				))
			)}
			<div className="source">
				{`${t(lang, "数据出典")}：`}
				<span lang="ja">{response.source.name}</span>
				{` ｜ ${t(lang, "数据源更新")}：${formatDemoSnapshotDate(lang, response.source.updatedAt)}`}
				<br />
				{t(lang, "非实时信息。附近设施不代表安全或已开放。直线距离不代表路线可通行。")}
			</div>
		</>
	);
}
