/**
 * ENGINEERING DRAFT language packs for API enum keys.
 *
 * PRD FR-02 requires safety-critical copy to come from reviewed fixed language
 * packs. These packs are NOT yet reviewed: they exist so engineering can wire
 * up locale rendering before the copy review lands. When the packs are
 * approved, bump I18N_LABELS_VERSION and record the review alongside the bump.
 *
 * Labels are short neutral nouns/phrases only. Do not add alarming or
 * directive safety copy here — action guidance belongs to the reviewed card
 * copy, not to enum labels.
 */
import type { LocalizedText } from "./localization";

export const I18N_LABELS_VERSION = "i18n-draft.1";

/**
 * Display labels for stable enum keys returned by the API. Top-level groups
 * are keyed by plain strings, deliberately decoupled from the enum types so
 * this file does not need to track in-flight contract work.
 */
export const ENUM_LABELS: Record<string, Record<string, LocalizedText>> = {
	facilityType: {
		evacuation_area: {
			ja: "避難場所",
			en: "Evacuation area",
			zhHans: "避难场所",
		},
		evacuation_shelter: {
			ja: "避難所",
			en: "Evacuation shelter",
			zhHans: "避难所",
		},
	},
	dataStatus: {
		confirmed: {
			ja: "確認済み",
			en: "Confirmed",
			zhHans: "已确认",
		},
		// PRD §6.2 honesty: must convey that the current open/closed status
		// cannot be confirmed — never render as "open".
		not_realtime: {
			ja: "現在開設は未確認",
			en: "Current open status not confirmed",
			zhHans: "无法确认当前开放状态",
		},
		unknown: {
			ja: "不明",
			en: "Unknown",
			zhHans: "无法确认",
		},
		unavailable: {
			ja: "取得不可",
			en: "Unavailable",
			zhHans: "数据获取失败",
		},
	},
	userState: {
		safe: {
			ja: "安全",
			en: "Safe",
			zhHans: "安全",
		},
		uncertain: {
			ja: "不明",
			en: "Uncertain",
			zhHans: "不确定",
		},
		danger: {
			ja: "危険",
			en: "Danger",
			zhHans: "危险",
		},
		need_help: {
			ja: "支援が必要",
			en: "Needs help",
			zhHans: "需要帮助",
		},
	},
	riskAnswer: {
		yes: {
			ja: "はい",
			en: "Yes",
			zhHans: "是",
		},
		no: {
			ja: "いいえ",
			en: "No",
			zhHans: "否",
		},
		uncertain: {
			ja: "不明",
			en: "Uncertain",
			zhHans: "不确定",
		},
	},
	environment: {
		indoor: {
			ja: "屋内",
			en: "Indoor",
			zhHans: "室内",
		},
		outdoor: {
			ja: "屋外",
			en: "Outdoor",
			zhHans: "室外",
		},
		transit: {
			ja: "移動中",
			en: "In transit",
			zhHans: "移动中",
		},
	},
	stayPutStatus: {
		in_zone: {
			ja: "地区内残留地区内",
			en: "Within designated stay-put zone",
			zhHans: "位于官方指定留守区域内",
		},
		outside_zone: {
			ja: "地区内残留地区外",
			en: "Outside designated stay-put zone",
			zhHans: "不在官方指定留守区域内",
		},
		undetermined: {
			ja: "判定不能",
			en: "Undetermined",
			zhHans: "无法判定",
		},
	},
	disasterType: {
		earthquake: {
			ja: "地震",
			en: "Earthquake",
			zhHans: "地震",
		},
		tsunami: {
			ja: "津波",
			en: "Tsunami",
			zhHans: "海啸",
		},
		flood: {
			ja: "洪水",
			en: "Flood",
			zhHans: "洪水",
		},
		landslide: {
			ja: "土砂災害",
			en: "Landslide",
			zhHans: "山体滑坡",
		},
		volcanic: {
			ja: "火山",
			en: "Volcanic",
			zhHans: "火山",
		},
		fire: {
			ja: "火災",
			en: "Fire",
			zhHans: "火灾",
		},
	},
	// Facility records use these data slugs. Values of the form
	// `other:<free text>` pass through with the Japanese free text after the
	// colon and get no translation — render the free text as-is.
	accessibility: {
		elevator_or_ground_floor_space: {
			ja: "エレベーターまたは1階スペース",
			en: "Elevator or ground-floor space",
			zhHans: "电梯或一层空间",
		},
		slope: {
			ja: "スロープ",
			en: "Slope",
			zhHans: "坡道",
		},
		braille_blocks: {
			ja: "点字ブロック",
			en: "Braille blocks",
			zhHans: "盲道砖",
		},
		wheelchair_accessible_toilet: {
			ja: "車椅子対応トイレ",
			en: "Wheelchair-accessible toilet",
			zhHans: "轮椅无障碍厕所",
		},
	},
};
