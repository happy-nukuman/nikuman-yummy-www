// 首页「灾害信息」页的 demo 数据快照：内容取自下方统一时点的真实公开发布
// （環境省・気象庁の熱中症警戒アラート、気象庁の震源・震度情報と警報・注意報）。
// demo 版不做实时拉取；所有文案与其他画面一样以中文为键走 i18n。

/** 灾害判断、列表、详情和 Footer 共用的 Demo 快照时点。 */
export const DISASTER_SNAPSHOT_DATE = "2026-08-08";

export type DisasterLevel = "warning" | "advisory" | "info";

export interface DisasterInfoItem {
	id: string;
	/** Icon key resolved by OptionGlyph (app-icons.tsx). */
	icon: string;
	/** 分类角标（如「高温」「地震」），同时决定角标配色的 level。 */
	category: string;
	level: DisasterLevel;
	title: string;
	issuedAt: string;
	source: string;
	/** 列表卡片上的一句话摘要。 */
	summary: string;
	/** 详情页开头的概述段落。 */
	lead: string;
	/** 详情页的关键信息表（标签 → 值）。 */
	facts: ReadonlyArray<readonly [string, string]>;
	/** 详情页的建议行动列表。 */
	advice: readonly string[];
}

export const DISASTER_INFO_ITEMS: readonly DisasterInfoItem[] = [
	{
		id: "heatstroke-alert",
		icon: "thermometer",
		category: "高温",
		level: "warning",
		title: "中暑警戒警报（东京地方）",
		issuedAt: "2026年8月7日 05:00 发表",
		source: "环境省・气象厅",
		summary: "预计将出现危害健康的显著高温，请注意防暑降温、及时补水。",
		lead: "环境省和气象厅向东京都发布了中暑警戒警报。气温将显著升高，可能对健康造成危害，请采取防暑措施。",
		facts: [
			["对象地域", "东京地方（含新宿区）"],
			["发表时间", "2026年8月7日 05:00"],
			["发表机关", "环境省・气象厅"],
		],
		advice: [
			"在室内适当使用空调，保持凉爽环境。",
			"尽量减少外出，避免长时间在烈日下活动。",
			"勤补充水分和盐分，注意休息。",
			"多留意老人、儿童等不易察觉中暑人群的状况。",
		],
	},
	{
		id: "quake-20260805",
		icon: "quake",
		category: "地震",
		level: "info",
		title: "震源・震度信息：东京都23区",
		issuedAt: "2026年8月5日 18:06 左右发生",
		source: "气象厅",
		summary: "东京都23区发生 M3.5 地震，最大震度1，无海啸风险。",
		lead: "气象厅发布的震源・震度信息：8月5日傍晚，东京都23区发生了 M3.5 的地震。此次地震震度较小，无海啸风险。",
		facts: [
			["发生时刻", "2026年8月5日 18:06 左右"],
			["震源地", "东京都23区"],
			["规模", "M3.5"],
			["震源深度", "约120公里"],
			["最大震度", "震度1（栃木县宇都宫市）"],
			["海啸", "无海啸风险"],
		],
		advice: [
			"此次地震震度较小，通常无需特别行动。",
			"如再次感到摇晃，先保护头部，远离可能坠落的物品。",
			"留意气象厅的后续发布。",
		],
	},
	{
		id: "thunder-advisory",
		icon: "storm",
		category: "气象",
		level: "advisory",
		title: "雷注意报（东京都多摩西部）",
		issuedAt: "2026年8月8日 10:01 发表",
		source: "气象厅",
		summary: "多摩西部发布了雷注意报；东京23区（含新宿区）目前没有警报・注意报。",
		lead: "气象厅向东京都多摩西部（青梅市、あきる野市等）发布了雷注意报。您所在的东京23区（含新宿区）目前没有生效的警报・注意报，但天气可能突变，请留意天空变化。",
		facts: [
			["对象地域", "东京都多摩西部"],
			["23区（含新宿区）", "无警报・注意报"],
			["发表时间", "2026年8月8日 10:01"],
		],
		advice: [
			"天气突变时，警惕雷电和局部强降雨。",
			"听到雷声时，远离空旷场地和大树，进入牢固的建筑物内。",
		],
	},
];
