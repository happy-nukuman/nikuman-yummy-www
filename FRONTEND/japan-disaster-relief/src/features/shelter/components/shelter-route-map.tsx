"use client";

import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import type { GeoPoint } from "@/lib/geo/calculate-distance";
import { type DemoLang, t } from "@/features/demo/i18n";

interface ShelterRouteMapProps {
	origin: GeoPoint;
	destination: DemoShelterCandidate;
	lang: DemoLang;
}

const MAP_LOCALE: Record<DemoLang, string> = { zh: "zh-CN", en: "en", ja: "ja" };

function coordPair(point: { latitude: number; longitude: number }): string {
	return `${point.latitude},${point.longitude}`;
}

/** Keyless Google Maps embed showing a walking route between two points. */
export function buildRouteEmbedUrl(
	origin: GeoPoint,
	destination: GeoPoint,
	lang: DemoLang,
): string {
	const params = new URLSearchParams({
		saddr: coordPair(origin),
		daddr: coordPair(destination),
		dirflg: "w",
		hl: MAP_LOCALE[lang],
		output: "embed",
	});
	return `https://maps.google.com/maps?${params.toString()}`;
}

/** Full Google Maps directions page (opened in a new tab as fallback). */
export function buildRouteExternalUrl(origin: GeoPoint, destination: GeoPoint): string {
	const params = new URLSearchParams({
		api: "1",
		origin: coordPair(origin),
		destination: coordPair(destination),
		travelmode: "walking",
	});
	return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function ShelterRouteMap({ origin, destination, lang }: ShelterRouteMapProps) {
	return (
		<>
			<div className="map-embed">
				<iframe
					title={t(lang, "路线参考地图")}
					src={buildRouteEmbedUrl(origin, destination, lang)}
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
					allowFullScreen
				/>
			</div>
			<div className="source">{t(lang, "地图无法加载时，请使用下方按钮打开 Google 地图。")}</div>
			<a
				className="btn secondary"
				href={buildRouteExternalUrl(origin, destination)}
				target="_blank"
				rel="noopener noreferrer"
			>
				{t(lang, "在 Google 地图中打开路线")}
			</a>
		</>
	);
}
