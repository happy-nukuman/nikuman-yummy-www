"use client";

import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import { type DemoLang, t } from "../../demo/i18n";
import { formatApproxDistance } from "../format";
import { shelterDisplayAddress, shelterDisplayName } from "../localization";

interface ShelterCandidateCardProps {
	facility: DemoShelterCandidate;
	index: number;
	lang: DemoLang;
	onNavigate: (facility: DemoShelterCandidate) => void;
}

export function ShelterCandidateCard({
	facility,
	index,
	lang,
	onNavigate,
}: ShelterCandidateCardProps) {
	const name = shelterDisplayName(lang, facility);
	const address = shelterDisplayAddress(lang, facility);
	return (
		<div className="facility">
			<div className="facility-head">
				<div>
					<div className="facility-name" lang={name.lang}>
						{name.text}
					</div>
					<div className="facility-meta">
						{`${t(lang, "避难所")} · ${formatApproxDistance(lang, facility.distanceMeters)}`}
					</div>
				</div>
				<span className="tag">{`${t(lang, "候选")} ${index + 1}`}</span>
			</div>
			<div className="facility-meta" lang={address.lang}>
				{address.text}
			</div>
			<div className="facility-meta">{t(lang, "当前开放状态：无法确认")}</div>
			<div className="facility-actions">
				<button type="button" className="btn primary" onClick={() => onNavigate(facility)}>
					{t(lang, "选择并查看路线")}
				</button>
				<a
					className="btn secondary"
					href={facility.googleMapsUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					{t(lang, "在 Google 地图中查看位置")}
				</a>
			</div>
		</div>
	);
}
