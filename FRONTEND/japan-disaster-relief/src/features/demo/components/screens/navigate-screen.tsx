"use client";

import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import { type DemoLang, t } from "@/features/demo/i18n";
import { Progress } from "@/features/demo/components/progress";
import { formatApproxDistance } from "@/features/shelter/format";
import { shelterDisplayAddress, shelterDisplayName } from "@/features/shelter/localization";
import { ShelterRouteMap } from "@/features/shelter/components/shelter-route-map";
import type { GeoPoint } from "@/lib/geo/calculate-distance";

interface NavigateScreenProps {
	active: boolean;
	lang: DemoLang;
	origin: GeoPoint;
	shelter: DemoShelterCandidate | null;
	/** Location line shown in the current-location panel. */
	locationLabel: string;
	/** Continues the flow to the communication card. */
	onOpenCommunication: () => void;
	onBack: () => void;
}

/** Route reference from the demo origin to the selected shelter. */
export function NavigateScreen({
	active,
	lang,
	origin,
	shelter,
	locationLabel,
	onOpenCommunication,
	onBack,
}: NavigateScreenProps) {
	const name = shelter ? shelterDisplayName(lang, shelter) : null;
	const address = shelter ? shelterDisplayAddress(lang, shelter) : null;

	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="navigate">
			<Progress on={5} />
			<h1 className="hero-title">{t(lang, "前往设施的路线参考")}</h1>
			{shelter && name && address && (
				<>
					<div className="panel">
						<div className="panel-row">
							<div className="panel-icon">📍</div>
							<div>
								<div className="panel-title">{t(lang, "当前位置")}</div>
								<div className="panel-copy">{locationLabel}</div>
							</div>
						</div>
						<div className="panel-row">
							<div className="panel-icon">🏫</div>
							<div>
								<div className="panel-title" lang={name.lang}>
									{name.text}
								</div>
								<div className="panel-copy">
									<span lang={address.lang}>{address.text}</span>
									{` · ${formatApproxDistance(lang, shelter.distanceMeters)}`}
								</div>
							</div>
						</div>
					</div>
					<ShelterRouteMap origin={origin} destination={shelter} lang={lang} />
					<div className="panel amber">
						<div className="panel-title">{t(lang, "重要说明")}</div>
						<div className="panel-copy">
							{t(lang, "路线仅供参考，是否可通行需要现场确认。无法确认设施当前是否开放。")}
						</div>
					</div>
				</>
			)}
			<div className="source">{t(lang, "到达后或需要求助时，向身边的人展示。")}</div>
			<div className="actions">
				<button type="button" className="btn secondary" onClick={onOpenCommunication}>
					{t(lang, "打开沟通卡")}
				</button>
				<button type="button" className="btn ghost" onClick={onBack}>
					← {t(lang, "返回上一步")}
				</button>
			</div>
		</section>
	);
}
