import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import type { DemoLang } from "@/features/demo/i18n";

type LocalizedShelterText = {
	name: { en: string; zh: string };
	address: { en: string; zh: string };
};

// The demo dataset is a fixed Shinjuku open-data snapshot (see
// BACKEND/japan-disaster-relief-api/src/config/demo-shelters.ts), so English
// and Chinese renderings are maintained here by facilityId. Facilities missing
// from this table fall back to the Japanese originals from the API.
const SHELTER_TEXT: Record<string, LocalizedShelterText> = {
	"demo-shinjuku-nishi-shinjuku-elementary": {
		name: { en: "Nishi-Shinjuku Elementary School", zh: "西新宿小学" },
		address: {
			en: "4-35-5 Nishi-Shinjuku, Shinjuku City, Tokyo",
			zh: "东京都新宿区西新宿4-35-5",
		},
	},
	"demo-shinjuku-nishi-shinjuku-junior-high": {
		name: { en: "Nishi-Shinjuku Junior High School", zh: "西新宿中学" },
		address: {
			en: "8-2-44 Nishi-Shinjuku, Shinjuku City, Tokyo",
			zh: "东京都新宿区西新宿8-2-44",
		},
	},
	"demo-shinjuku-kashiwagi-elementary": {
		name: { en: "Kashiwagi Elementary School", zh: "柏木小学" },
		address: {
			en: "2-11-1 Kita-Shinjuku, Shinjuku City, Tokyo",
			zh: "东京都新宿区北新宿2-11-1",
		},
	},
	"demo-shinjuku-metropolitan-high-school": {
		name: { en: "Tokyo Metropolitan Shinjuku High School", zh: "都立新宿高中" },
		address: {
			en: "11-4 Naitomachi, Shinjuku City, Tokyo",
			zh: "东京都新宿区内藤町11-4",
		},
	},
	"demo-shinjuku-yodobashi-fourth-elementary": {
		name: { en: "Yodobashi No. 4 Elementary School", zh: "淀桥第四小学" },
		address: {
			en: "3-17-1 Kita-Shinjuku, Shinjuku City, Tokyo",
			zh: "东京都新宿区北新宿3-17-1",
		},
	},
	"demo-shinjuku-okubo-elementary": {
		name: { en: "Okubo Elementary School", zh: "大久保小学" },
		address: {
			en: "1-1-21 Okubo, Shinjuku City, Tokyo",
			zh: "东京都新宿区大久保1-1-21",
		},
	},
	"demo-shinjuku-tenjin-elementary": {
		name: { en: "Tenjin Elementary School", zh: "天神小学" },
		address: {
			en: "6-14-2 Shinjuku, Shinjuku City, Tokyo",
			zh: "东京都新宿区新宿6-14-2",
		},
	},
	"demo-shinjuku-toyama-elementary": {
		name: { en: "Toyama Elementary School", zh: "户山小学" },
		address: {
			en: "2-1-38 Hyakunincho, Shinjuku City, Tokyo",
			zh: "东京都新宿区百人町2-1-38",
		},
	},
	"demo-shinjuku-junior-high": {
		name: { en: "Shinjuku Junior High School", zh: "新宿中学" },
		address: {
			en: "6-15-22 Shinjuku, Shinjuku City, Tokyo",
			zh: "东京都新宿区新宿6-15-22",
		},
	},
	"demo-shinjuku-tokyo-medical-university": {
		name: { en: "Tokyo Medical University", zh: "东京医科大学" },
		address: {
			en: "6-1-1 Shinjuku, Shinjuku City, Tokyo",
			zh: "东京都新宿区新宿6-1-1",
		},
	},
};

/** Text plus the `lang` attribute it should carry ("ja" only for Japanese fallbacks). */
export type ShelterDisplayText = { text: string; lang?: "ja" };

export function shelterDisplayName(
	lang: DemoLang,
	facility: DemoShelterCandidate,
): ShelterDisplayText {
	if (lang !== "ja") {
		const localized = SHELTER_TEXT[facility.facilityId]?.name[lang];
		if (localized) return { text: localized };
	}
	return { text: facility.nameJa, lang: "ja" };
}

export function shelterDisplayAddress(
	lang: DemoLang,
	facility: DemoShelterCandidate,
): ShelterDisplayText {
	if (lang !== "ja") {
		const localized = SHELTER_TEXT[facility.facilityId]?.address[lang];
		if (localized) return { text: localized };
	}
	return { text: facility.addressJa, lang: "ja" };
}
