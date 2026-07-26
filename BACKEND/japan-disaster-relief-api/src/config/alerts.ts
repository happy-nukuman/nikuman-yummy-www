import type { DisasterType, LocalizedText } from "@nikuman-yummy/shared";

// The demo-mock source is contest scaffold: it exists so a demo can trigger a
// controllable alert (including 火災, which has no public realtime feed in Tokyo).
// The URL points at the control endpoint itself, because there is no upstream.
export const DEMO_ALERT_SOURCE_NAME = "demo-mock";
export const DEMO_ALERT_SOURCE_URL = "/api/demo/alerts";

// JMA publishes this JSON list on its public website (bosai feed). It is not a
// documented API with an SLA, so it is consumed strictly best-effort.
export const JMA_SOURCE_NAME = "気象庁 (JMA)";
export const JMA_QUAKE_LIST_URL = "https://www.jma.go.jp/bosai/quake/data/list.json";

// Every default title keeps a (デモ)/(demo)/(演示) suffix so a demo alert can never
// be mistaken for a real official warning. A caller-supplied title is stored as-is.
export const DEMO_ALERT_DEFAULT_TITLES: Record<DisasterType, LocalizedText> = {
	earthquake: {
		ja: "地震(デモ)",
		en: "Earthquake (demo)",
		zhHans: "地震(演示)",
	},
	tsunami: {
		ja: "津波(デモ)",
		en: "Tsunami (demo)",
		zhHans: "海啸(演示)",
	},
	flood: {
		ja: "洪水(デモ)",
		en: "Flood (demo)",
		zhHans: "洪水(演示)",
	},
	landslide: {
		ja: "土砂災害(デモ)",
		en: "Landslide (demo)",
		zhHans: "泥石流(演示)",
	},
	volcanic: {
		ja: "火山活動(デモ)",
		en: "Volcanic activity (demo)",
		zhHans: "火山活动(演示)",
	},
	fire: {
		ja: "火災(デモ)",
		en: "Fire (demo)",
		zhHans: "火灾(演示)",
	},
};
