import type { DemoLang } from "../demo/i18n";

/** "約 556 m" — always an approximate straight-line distance, never a route. */
export function formatApproxDistance(lang: DemoLang, distanceMeters: number): string {
	const meters = Math.round(distanceMeters);
	if (lang === "en") return `Approx. ${meters} m`;
	if (lang === "ja") return `約 ${meters} m`;
	return `约 ${meters} m`;
}
