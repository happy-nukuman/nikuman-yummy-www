"use client";

import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import { type DemoLang, t } from "@/features/demo/i18n";
import { formatApproxDistance } from "@/features/shelter/format";
import { shelterDisplayAddress, shelterDisplayName } from "@/features/shelter/localization";

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
					<div className="facility-distance">{formatApproxDistance(lang, facility.distanceMeters)}</div>
				</div>
				<span className="tag">{`${t(lang, "候选")} ${index + 1}`}</span>
			</div>
			<div className="facility-meta" lang={address.lang}>{address.text}</div>
			<div className="facility-actions">
				<button type="button" className="btn primary" onClick={() => onNavigate(facility)}>
					{t(lang, "选择并查看路线")}
				</button>
			</div>
		</div>
	);
}
