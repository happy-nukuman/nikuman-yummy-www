// Verbatim port of the copy/i18n dictionaries in DOCS/demo.html.

export type DemoLang = "zh" | "en" | "ja";

export interface WelcomeCopy {
	sub: string;
	title: string;
	lead: string;
	prompt: string;
	locTitle: string;
	locCopy: string;
	continue: string;
	privacy: string;
	toast: string;
}

export const WELCOME_COPY: Record<DemoLang, WelcomeCopy> = {
	zh: {
		sub: "灾后下一步行动",
		title: "紧急时，先完成正确的下一步",
		lead: "为在东京生活或短期停留的外国人优先设计，任何人都能使用。",
		prompt: "请选择界面语言",
		locTitle: "位置仅用于本次匹配",
		locCopy: "用于确认所在区和附近设施，不保存精确位置历史。",
		continue: "使用中文继续",
		privacy: "无需注册 · 不收集姓名、住址或在留资格",
		toast: "已切换为中文",
	},
	en: {
		sub: "Your next step after a disaster",
		title: "In an emergency, take the right next step first",
		lead: "Designed primarily for foreign residents and visitors in Tokyo, and available to everyone.",
		prompt: "Choose your interface language",
		locTitle: "Location is used only for this session",
		locCopy:
			"Used to identify your area and nearby facilities. Precise location history is not saved.",
		continue: "Continue in English",
		privacy: "No registration · No name, address, or residence status collected",
		toast: "Language changed to English",
	},
	ja: {
		sub: "災害後の次の行動",
		title: "緊急時は、正しい次の一歩から",
		lead: "東京で暮らす・滞在する外国人を優先して設計し、誰でも利用できます。",
		prompt: "表示言語を選択してください",
		locTitle: "位置情報は今回の照合にのみ使用",
		locCopy: "現在地の区市町村と近隣施設の確認に使用し、正確な位置履歴は保存しません。",
		continue: "日本語で続ける",
		privacy: "登録不要 · 氏名、住所、在留資格は収集しません",
		toast: "日本語に切り替えました",
	},
};

// Header sub-label shown by show(): the communication screen has its own label,
// every other screen uses the default one.
export const HEADER_LABELS: Record<DemoLang, { default: string; communication: string }> = {
	zh: { default: "灾后下一步行动", communication: "日语沟通卡" },
	en: { default: "Post-disaster next step", communication: "Japanese communication card" },
	ja: { default: "災害後の次の行動", communication: "日本語コミュニケーションカード" },
};

export const LANG_QUICK_LABEL: Record<DemoLang, string> = { zh: "中", en: "EN", ja: "日" };

// [Japanese card text (lines), default Chinese caption, Japanese text for speech]
export const PHRASES: ReadonlyArray<readonly [string[], string, string]> = [
	[["避難場所を", "教えてください。"], "请告诉我避难地点。", "避難場所を教えてください。"],
	[["助けてください。"], "请帮帮我。", "助けてください。"],
	[["救急車を呼んでください。"], "请帮我叫救护车。", "救急車を呼んでください。"],
	[["日本語が話せません。"], "我不会说日语。", "日本語が話せません。"],
];

export const PHRASE_TEXT: Record<DemoLang, string[]> = {
	zh: ["请告诉我避难地点。", "请帮帮我。", "请帮我叫救护车。", "我不会说日语。"],
	en: [
		"Please tell me where the evacuation site is.",
		"Please help me.",
		"Please call an ambulance for me.",
		"I do not speak Japanese.",
	],
	ja: ["避難場所を教えてください。", "助けてください。", "救急車を呼んでください。", "日本語が話せません。"],
};

export interface ActionI18n {
	select: string;
	danger: [string, string, string];
	injury: [string, string, string];
	indoor: [string, string, string];
	default: [string, string, string];
}

export const ACTION_I18N: Record<"en" | "ja", ActionI18n> = {
	en: {
		select: "Please select your current environment first",
		danger: [
			"Leave the immediate danger area and ask for help now",
			"Stop complex tasks, evacuate first, and show the communication card to staff or people nearby.",
			"Do not stop to film. Do not return for belongings. Do not wait for further system assessment.",
		],
		injury: [
			"Ask people nearby for help and call an ambulance now",
			"Stay where you can be found and use the communication card to explain that an ambulance is needed.",
			"Do not make complex medical judgments yourself. Do not let a seriously injured person move alone.",
		],
		indoor: [
			"Move according to on-site instructions after confirming the exit is safe",
			"Stay away from glass and falling objects. Do not use elevators. Listen to staff and announcements first.",
			"Do not enter damaged areas. Do not use elevators. Do not ignore on-site instructions.",
		],
		default: [
			"Stay in an open, safer location for now",
			"Keep away from glass, exterior walls, signs, utility poles, and objects that may fall.",
			"Do not rush into a damaged building. Do not use elevators. Do not assume a route is safe because it is short.",
		],
	},
	ja: {
		select: "現在の環境を選択してください",
		danger: [
			"差し迫った危険区域から直ちに離れ、助けを求めてください",
			"複雑な操作を止め、避難を優先し、係員や周囲の人にコミュニケーションカードを見せてください。",
			"撮影のために立ち止まらないでください。物を取りに戻らないでください。",
		],
		injury: [
			"周囲の人に助けを求め、救急車を呼んでください",
			"見つけてもらえる場所にとどまり、コミュニケーションカードで救急車が必要だと伝えてください。",
			"自分で複雑な医療判断をしないでください。重傷者を一人で移動させないでください。",
		],
		indoor: [
			"出口の安全を確認し、現場の指示に従って移動してください",
			"ガラスや落下物から離れ、エレベーターを使わず、まず係員と放送に従ってください。",
			"損傷区域に入らないでください。エレベーターを使わないでください。",
		],
		default: [
			"まず開けた安全性の高い場所にとどまってください",
			"ガラス、外壁、看板、電柱、落下しそうな物から離れてください。",
			"損傷した建物に急いで入らないでください。エレベーターを使わないでください。",
		],
	},
};

// Static-text translations keyed by the original Chinese copy, exactly as in the demo.
export const FULL_I18N: Record<"en" | "ja", Record<string, string>> = {
	en: {
		"Choose mode": "CHOOSE MODE",
		"你现在需要哪种帮助？": "What kind of help do you need now?",
		"每次只完成一个判断，系统再给出下一步。":
			"Answer one simple question at a time. We will then show the next action.",
		灾害模式: "Disaster mode",
		"地震、火灾、水灾发生后，不知道下一步怎么办。":
			"Use this after an earthquake, fire, or flood when you are unsure what to do next.",
		进入灾害模式: "Enter disaster mode",
		日常应急: "Everyday emergency",
		"迷路、身体不适、需要警察或医疗帮助。":
			"For getting lost, feeling unwell, or needing police or medical help.",
		查看功能说明: "View feature information",
		"第 1 步": "Step 1",
		"刚才发生了什么？": "What just happened?",
		"系统根据公开信息推荐“地震”，请你确认。":
			"Based on public information, the system suggests “Earthquake.” Please confirm.",
		地震: "Earthquake",
		"系统推荐 · 请确认": "Suggested by system · Please confirm",
		火灾: "Fire",
		"水灾 / 海啸": "Flood / Tsunami",
		不确定: "Not sure",
		确认并继续: "Confirm and continue",
		"问题 1 / 3": "Question 1 of 3",
		"你现在仍处于直接危险中吗？": "Are you still in immediate danger?",
		"例如建筑正在倒塌、附近有火、玻璃持续掉落或必须立即撤离。":
			"For example: a building is collapsing, fire is nearby, glass is still falling, or you must evacuate immediately.",
		没有: "No",
		有: "Yes",
		继续: "Continue",
		"问题 2 / 3": "Question 2 of 3",
		"你或身边的人是否严重受伤？": "Are you or someone nearby seriously injured?",
		"例如大量出血、无法呼吸、失去意识或无法移动。":
			"For example: heavy bleeding, difficulty breathing, unconsciousness, or inability to move.",
		"问题 3 / 3": "Question 3 of 3",
		"你现在在哪里？": "Where are you now?",
		"选择最接近的环境，用于匹配固定行动规则。":
			"Choose the environment that best matches your location so we can apply the fixed action rules.",
		"室外 / 空旷处": "Outdoors / Open area",
		建筑物内: "Inside a building",
		"车站 / 交通工具内": "Station / Public transport",
		生成下一步行动: "Generate next action",
		现在只做这一件事: "Do only this now",
		现在不要做: "Do not do this now",
		同时确认现场信息: "Also check information on site",
		"听从工作人员、现场广播和官方发布。":
			"Follow staff instructions, on-site announcements, and official information.",
		"规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断":
			"Rule source: Official Tokyo disaster-prevention materials | Rule version v1.0 | Not a professional structural or medical assessment",
		"我已完成，查看附近设施": "Done — view nearby facilities",
		我做不到: "I cannot do this",
		"需要查看附近的避难设施吗？": "Would you like to view nearby evacuation facilities?",
		"系统会根据本次位置和官方开放数据列出候选设施。":
			"The system will list candidate facilities using your current session location and official open data.",
		重要说明: "Important",
		"“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。":
			"“Nearby” does not mean safe. Being listed in the data does not mean the facility is currently open. Route accessibility must be checked on site.",
		当前位置: "Current location",
		"東京都新宿区附近 · 仅本次使用": "Near Shinjuku City, Tokyo · Used only for this session",
		查看设施候选: "View facility candidates",
		暂时不需要: "Not now",
		附近设施候选: "Nearby facility candidates",
		"指定避难所 · 约 620m": "Designated shelter · Approx. 620 m",
		"候选 1": "Candidate 1",
		"开放状态：无法确认｜数据更新：2026-07-20": "Open status: Unknown | Data updated: 2026-07-20",
		在地图中查看: "View on map",
		"避难设施 · 约 940m": "Evacuation facility · Approx. 940 m",
		"候选 2": "Candidate 2",
		"开放状态：非实时｜数据更新：2026-07-18":
			"Open status: Not real-time | Data updated: 2026-07-18",
		"来源：东京都 / 新宿区开放数据。距离最短不代表路线可通行。":
			"Source: Tokyo Metropolitan Government / Shinjuku City open data. The shortest distance does not mean the route is passable.",
		打开沟通卡: "Open communication card",
		请把屏幕给对方看: "Show this screen to the other person",
		"🔊 朗读日语": "🔊 Speak Japanese",
		切换其他沟通卡: "Switch phrase",
		返回: "Back",
		"固定审核翻译 · 核心功能不依赖 AI": "Reviewed fixed translations · Core functions do not depend on AI",
		当前服务受限: "Service currently limited",
		"无法获取最新设施数据。请确认现场广播、工作人员和官方信息。":
			"The latest facility data could not be retrieved. Check on-site announcements, staff instructions, and official information.",
		重新尝试: "Try again",
	},
	ja: {
		"Choose mode": "モードを選択",
		"你现在需要哪种帮助？": "今、どのような助けが必要ですか？",
		"每次只完成一个判断，系统再给出下一步。": "一度に一つだけ確認し、その後に次の行動を表示します。",
		灾害模式: "災害モード",
		"地震、火灾、水灾发生后，不知道下一步怎么办。":
			"地震・火災・水害の後、次に何をすべきか分からないときに使います。",
		进入灾害模式: "災害モードを開始",
		日常应急: "日常の緊急時",
		"迷路、身体不适、需要警察或医疗帮助。":
			"道に迷った、体調が悪い、警察や医療の助けが必要な場合。",
		查看功能说明: "機能説明を見る",
		"第 1 步": "ステップ1",
		"刚才发生了什么？": "何が起きましたか？",
		"系统根据公开信息推荐“地震”，请你确认。":
			"公開情報に基づき「地震」が候補です。確認してください。",
		地震: "地震",
		"系统推荐 · 请确认": "システム候補 · 確認してください",
		火灾: "火災",
		"水灾 / 海啸": "水害 / 津波",
		不确定: "分からない",
		确认并继续: "確認して続ける",
		"问题 1 / 3": "質問 1 / 3",
		"你现在仍处于直接危险中吗？": "今も差し迫った危険の中にいますか？",
		"例如建筑正在倒塌、附近有火、玻璃持续掉落或必须立即撤离。":
			"例：建物が崩れそう、近くに火がある、ガラスが落ち続けている、すぐ避難する必要がある。",
		没有: "いいえ",
		有: "はい",
		继续: "続ける",
		"问题 2 / 3": "質問 2 / 3",
		"你或身边的人是否严重受伤？": "あなたや近くの人に重傷がありますか？",
		"例如大量出血、无法呼吸、失去意识或无法移动。":
			"例：大量出血、呼吸困難、意識がない、動けない。",
		"问题 3 / 3": "質問 3 / 3",
		"你现在在哪里？": "今どこにいますか？",
		"选择最接近的环境，用于匹配固定行动规则。":
			"最も近い状況を選び、固定された行動ルールに照合します。",
		"室外 / 空旷处": "屋外 / 開けた場所",
		建筑物内: "建物の中",
		"车站 / 交通工具内": "駅 / 交通機関の中",
		生成下一步行动: "次の行動を表示",
		现在只做这一件事: "今はこれだけ行ってください",
		现在不要做: "今はしないでください",
		同时确认现场信息: "現場の情報も確認",
		"听从工作人员、现场广播和官方发布。": "係員、現場放送、公式情報に従ってください。",
		"规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断":
			"ルール出典：東京都の公式防災資料｜ルール版 v1.0｜建物・医療の専門判断ではありません",
		"我已完成，查看附近设施": "完了しました。近くの施設を見る",
		我做不到: "できません",
		"需要查看附近的避难设施吗？": "近くの避難施設を確認しますか？",
		"系统会根据本次位置和官方开放数据列出候选设施。":
			"今回の位置情報と公式オープンデータから候補施設を表示します。",
		重要说明: "重要",
		"“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。":
			"「近い」ことは安全を意味しません。データに載っていても現在開設中とは限りません。経路が通行可能かは現場で確認してください。",
		当前位置: "現在地",
		"東京都新宿区附近 · 仅本次使用": "東京都新宿区付近 · 今回のみ使用",
		查看设施候选: "施設候補を見る",
		暂时不需要: "今は必要ありません",
		附近设施候选: "近くの施設候補",
		"指定避难所 · 约 620m": "指定避難所 · 約620m",
		"候选 1": "候補1",
		"开放状态：无法确认｜数据更新：2026-07-20": "開設状況：確認できません｜データ更新：2026-07-20",
		在地图中查看: "地図で見る",
		"避难设施 · 约 940m": "避難施設 · 約940m",
		"候选 2": "候補2",
		"开放状态：非实时｜数据更新：2026-07-18":
			"開設状況：リアルタイムではありません｜データ更新：2026-07-18",
		"来源：东京都 / 新宿区开放数据。距离最短不代表路线可通行。":
			"出典：東京都 / 新宿区オープンデータ。最短距離でも通行可能とは限りません。",
		打开沟通卡: "コミュニケーションカードを開く",
		请把屏幕给对方看: "相手にこの画面を見せてください",
		"🔊 朗读日语": "🔊 日本語を読み上げる",
		切换其他沟通卡: "別のカードに切り替える",
		返回: "戻る",
		"固定审核翻译 · 核心功能不依赖 AI": "確認済み固定翻訳 · コア機能はAIに依存しません",
		当前服务受限: "現在サービスが制限されています",
		"无法获取最新设施数据。请确认现场广播、工作人员和官方信息。":
			"最新の施設データを取得できません。現場放送、係員、公式情報を確認してください。",
		重新尝试: "再試行",
	},
};

// Same behavior as the demo's translateAllStatic: Chinese keys are the source
// text; strings without a translation stay as-is.
export function t(lang: DemoLang, key: string): string {
	if (lang === "zh") return key;
	return FULL_I18N[lang][key] ?? key;
}
