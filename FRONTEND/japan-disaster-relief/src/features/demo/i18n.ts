// Copy/i18n dictionaries ported from DOCS/demo.html, trimmed to the strings
// the current UI actually renders.

export type DemoLang = "zh" | "en" | "ja";

// 按浏览器语言偏好顺序匹配 demo 支持的语言；中日英之外默认英语。
export function detectDemoLang(languages: readonly string[]): DemoLang {
	for (const tag of languages) {
		const primary = tag.toLowerCase().split("-")[0];
		if (primary === "zh" || primary === "en" || primary === "ja") return primary;
	}
	return "en";
}

// 把 Accept-Language 头解析成按 q 值降序的语言标签列表（q 相同保持原顺序）。
export function parseAcceptLanguage(header: string | null): string[] {
	if (!header) return [];
	return header
		.split(",")
		.map((part) => {
			const [tag, ...params] = part.trim().split(";");
			const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
			const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
			return { tag: tag.trim(), q: Number.isNaN(q) ? 0 : q };
		})
		.filter((entry) => entry.tag !== "" && entry.tag !== "*")
		.sort((a, b) => b.q - a.q)
		.map((entry) => entry.tag);
}

export interface WelcomeCopy {
	sub: string;
	title: string;
	lead: string;
	prompt: string;
	locTitle: string;
	locCopy: string;
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

// [Japanese card text (lines), default Chinese caption, Japanese text for speech]
export const PHRASES: ReadonlyArray<readonly [string[], string, string]> = [
	[["避難場所を", "教えてください。"], "请告诉我避难地点。", "避難場所を教えてください。"],
	[["助けてください。"], "请帮帮我。", "助けてください。"],
	[["救急車を呼んでください。"], "请帮我叫救护车。", "救急車を呼んでください。"],
	[["日本語が話せません。"], "我不会说日语。", "日本語が話せません。"],
	[["家族に無事を", "伝えたいです。"], "我想向家人报平安。", "家族に無事を伝えたいです。"],
	[
		["この薬が必要です。", "アレルギーがあります。"],
		"我需要这个药。我有过敏。",
		"この薬が必要です。アレルギーがあります。",
	],
];

export const PHRASE_TEXT: Record<DemoLang, string[]> = {
	zh: [
		"请告诉我避难地点。",
		"请帮帮我。",
		"请帮我叫救护车。",
		"我不会说日语。",
		"我想向家人报平安。",
		"我需要这个药。我有过敏。",
	],
	en: [
		"Please tell me where the evacuation site is.",
		"Please help me.",
		"Please call an ambulance for me.",
		"I do not speak Japanese.",
		"I want to tell my family that I am safe.",
		"I need this medicine. I have allergies.",
	],
	ja: [
		"避難場所を教えてください。",
		"助けてください。",
		"救急車を呼んでください。",
		"日本語が話せません。",
		"家族に無事を伝えたいです。",
		"この薬が必要です。アレルギーがあります。",
	],
};

// Static-text translations keyed by the original Chinese copy.
export const FULL_I18N: Record<"en" | "ja", Record<string, string>> = {
	en: {
		选择模式: "CHOOSE MODE",
		更多语言: "More languages",
		更多语言将在后续版本开放: "More languages will be available in a future version",
		本版本先提供地震流程: "This version provides the earthquake flow first",
		该应急类型即将开放: "This emergency type will be available soon",
		当前浏览器不支持朗读: "This browser does not support speech playback",
		沟通卡: "Communication card",
		"若仍处于建筑倒塌、火灾或其他直接危险中，请立即撤离并听从现场人员指示。":
			"If you are still in immediate danger such as a collapsing building or fire, evacuate now and follow on-site staff instructions.",
		"你现在需要哪种帮助？": "What kind of help do you need now?",
		"每次只完成一个判断，系统再给出下一步。":
			"Answer one simple question at a time. We will then show the next action.",
		灾害模式: "Disaster mode",
		"地震、火灾、水灾发生后，不知道下一步怎么办。":
			"Use this after an earthquake, fire, or flood when you are unsure what to do next.",
		进入灾害模式: "Enter disaster mode",
		日常应急: "Everyday emergency",
		"系统根据公开信息推荐“地震”，请你确认。":
			"Based on public information, the system suggests “Earthquake.” Please confirm.",
		地震: "Earthquake",
		"系统推荐 · 请确认": "Suggested by system · Please confirm",
		火灾: "Fire",
		"水灾 / 海啸": "Flood / Tsunami",
		不确定: "Not sure",
		"你现在在哪里？": "Where are you now?",
		"选择最接近的环境，用于匹配固定行动规则。":
			"Choose the environment that best matches your location so we can apply the fixed action rules.",
		现在不要做: "Do not do this now",
		同时确认现场信息: "Also check information on site",
		"听从工作人员、现场广播和官方发布。":
			"Follow staff instructions, on-site announcements, and official information.",
		"规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断":
			"Rule source: Official Tokyo disaster-prevention materials | Rule version v1.0 | Not a professional structural or medical assessment",
		我做不到: "I cannot do this",
		"系统会根据本次位置和官方开放数据列出候选设施。":
			"The system will list candidate facilities using your current session location and official open data.",
		重要说明: "Important",
		"“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。":
			"“Nearby” does not mean safe. Being listed in the data does not mean the facility is currently open. Route accessibility must be checked on site.",
		当前位置: "Current location",
		"東京都新宿区附近 · 仅本次使用": "Near Shinjuku City, Tokyo · Used only for this session",
		暂时不需要: "Not now",
		附近设施候选: "Nearby facility candidates",
		打开沟通卡: "Open communication card",
		请把屏幕给对方看: "Show this screen to the other person",
		"🔊 朗读日语": "🔊 Speak Japanese",
		切换其他沟通卡: "Switch phrase",
		选择要展示的沟通卡: "Choose a card to show",
		收起列表: "Hide list",
		返回: "Back",
		返回上一步: "Back to previous step",
		返回主页: "Back to home",
		"固定审核翻译 · 核心功能不依赖 AI": "Reviewed fixed translations · Core functions do not depend on AI",
		当前服务受限: "Service currently limited",
		"无法获取最新设施数据。请确认现场广播、工作人员和官方信息。":
			"The latest facility data could not be retrieved. Check on-site announcements, staff instructions, and official information.",
		重新尝试: "Try again",
		// Flow copy from DOCS/卡片・灾害定义.xlsm
		"煤气泄漏、迷路、身体不适等紧急状况。":
			"Emergencies such as a gas leak, getting lost, or feeling unwell.",
		进入日常应急: "Enter everyday emergency",
		事象确认: "Event check",
		"现在发生了什么？": "What is happening now?",
		"请手动选择日常应急类型。": "Please choose the type of everyday emergency.",
		煤气泄漏: "Gas leak",
		迷路: "Lost",
		身体不适: "Feeling unwell",
		状态确认: "Status check",
		行动: "Action",
		下一步: "Next",
		现在应该做: "Do this now",
		"我做不到 / 需要帮助": "I cannot do this / I need help",
		"是否需要避难？": "Do you need to evacuate?",
		"需要，导航到避难地点": "Yes — navigate to an evacuation site",
		"摇晃停止了吗？": "Has the shaking stopped?",
		"先确认身边的晃动情况，再进行下一步。":
			"First check whether the shaking around you has stopped before the next step.",
		停止了: "It has stopped",
		还在摇晃: "Still shaking",
		"你现在是否受伤？": "Are you injured?",
		"根据受伤情况，系统会给出不同的行动指引。":
			"The next actions depend on whether you are injured.",
		没有受伤: "Not injured",
		"受轻伤，可以移动": "Minor injury, can still move",
		"被困住或无法移动（被压 / 重伤）": "Trapped or unable to move (pinned / seriously injured)",
		自宅: "At home",
		"公司、学校、商场等建筑内": "In an office, school, shopping mall, etc.",
		其他: "Other",
		"是否寻找到工作人员？": "Have you found a staff member?",
		"优先听从现场工作人员的指示。": "Follow on-site staff instructions first.",
		找到了: "Yes, found staff",
		没有找到: "No staff nearby",
		"低下身体，保护头颈": "Get low and protect your head and neck",
		"就近进入较安全空间，远离玻璃、高柜、吊物和围墙。等待摇晃停止。":
			"Move to a safer spot nearby, away from glass, tall cabinets, hanging objects, and walls. Wait for the shaking to stop.",
		不要强行挣脱: "Do not force yourself free",
		"避免二次受伤。": "This avoids further injury.",
		"摇晃停止了，继续": "The shaking has stopped — continue",
		用敲击代替呼喊: "Knock instead of shouting",
		"有规律地敲击墙壁或管道。节省体力，避免吸入粉尘。":
			"Tap on a wall or pipe in a steady rhythm. It saves your strength and keeps you from breathing in dust.",
		穿上鞋保护双脚: "Put on shoes to protect your feet",
		"避免踩到玻璃和碎片。": "Avoid stepping on glass and debris.",
		"不取行李，不乘电梯": "Do not take luggage or use elevators",
		"沿安全出口向开阔处移动，途中不要点火、不开关电器。":
			"Move toward an open area via a safety exit. Do not light flames or switch electrical devices on the way.",
		听从工作人员指示: "Follow the staff instructions",
		"按现场引导行动，不要擅自返回建筑内。":
			"Act as directed on site and do not go back into the building on your own.",
		从安全出口离开: "Leave through a safety exit",
		"不取行李，不乘电梯，向开阔处移动。":
			"Do not take luggage or use elevators. Move toward an open area.",
		警惕余震: "Stay alert for aftershocks",
		"穿好鞋，远离高柜、玻璃窗和悬挂物。":
			"Keep your shoes on and stay away from tall furniture, glass windows, and hanging objects.",
		关注官方信息: "Keep checking official information",
		"留意 NHK、气象厅和自治体的官方发布。":
			"Follow announcements from NHK, the Japan Meteorological Agency, and your local government.",
		立刻停止使用燃气: "Stop using gas immediately",
		"关火并停止使用所有燃气器具。": "Turn off the flame and stop using every gas appliance.",
		不要使用明火和电器开关: "Do not use open flames or electrical switches",
		"不点火、不抽烟；不开关灯和排风扇，避免产生火花。":
			"Do not light flames or smoke. Do not switch lights or exhaust fans either; they can create sparks.",
		"开窗通风，关闭燃气总阀": "Open windows to ventilate and close the main gas valve",
		"如能安全操作，打开门窗通风，并关闭燃气总阀。":
			"If you can do it safely, open doors and windows to ventilate, then close the main gas valve.",
		"是否有人感到头晕、恶心或不适？": "Is anyone dizzy, nauseous, or feeling unwell?",
		"吸入燃气可能引起不适，请先确认现场所有人的状态。":
			"Breathing in gas can make people ill. Check how everyone on site is doing first.",
		有人不适: "Someone feels unwell",
		没有人不适: "No one feels unwell",
		转移到空气新鲜处: "Move to fresh air",
		"搀扶不适者到室外或通风良好处休息。":
			"Help anyone who feels unwell get outside or to a well-ventilated place to rest.",
		"拨打 119": "Call 119",
		"说明燃气泄漏情况和身体不适症状。": "Explain the gas leak and the symptoms people have.",
		联系燃气公司抢修电话: "Call the gas company's emergency repair line",
		"到室外安全处再拨打；抢修人员确认安全前，不要返回使用火和电器。":
			"Call from a safe place outside. Do not go back to use flames or electricity until repair staff confirm it is safe.",
		// SOS card and route-page helper text
		紧急求助: "Emergency help",
		"如手机有信号，立即拨打 119": "If your phone has signal, call 119 now",
		等待救援时: "While waiting for rescue",
		"保存体力，保持手机电量。有规律地敲击墙壁或管道，让救援人员发现你。":
			"Save your strength and phone battery. Tap on a wall or pipe in a steady rhythm so rescuers can find you.",
		"有人靠近时，展示沟通卡": "Someone is nearby — show the communication card",
		"到达后或需要求助时，向身边的人展示。":
			"Show this to people around you when you arrive or when you need help.",
		// Location permission dialog (demo: the location itself is hardcoded)
		"是否允许获取你的实时位置？": "Allow access to your current location?",
		"用于确认所在区和附近避难设施，仅本次使用，不保存位置历史。":
			"Used to identify your area and nearby evacuation facilities. Used only for this session; location history is not saved.",
		允许获取位置: "Allow location access",
		不允许: "Don't allow",
		"已获取当前位置：东京市新宿区": "Location acquired: Shinjuku, Tokyo",
		"未获得定位权限，将使用默认位置提供参考":
			"Location permission was not granted. A default location will be used for reference.",
		东京市新宿区: "Shinjuku, Tokyo",
		仅本次使用: "This session only",
		// Demo shelter candidates & route reference
		"正在获取附近的避难所候选…": "Loading nearby shelter candidates…",
		"根据本次位置查询官方开放数据快照。":
			"Searching a snapshot of official open data using your current session location.",
		避难所: "Shelter",
		候选: "Candidate",
		"当前开放状态：无法确认": "Current open status: cannot be confirmed",
		选择并查看路线: "Select and view route",
		"在 Google 地图中查看位置": "View location on Google Maps",
		"附近 3 公里内暂无可显示的候选设施": "No candidate facilities within 3 km",
		"请确认现场广播、工作人员和官方信息，不要依赖本页面。":
			"Check on-site announcements, staff instructions, and official information. Do not rely on this page.",
		数据出典: "Data source",
		更新日: "Updated",
		"非实时信息。附近设施不代表安全或已开放。直线距离不代表路线可通行。":
			"Not real-time information. A nearby facility is not necessarily safe or open. Straight-line distance does not mean the route is passable.",
		前往设施的路线参考: "Route reference to the facility",
		"路线仅供参考，是否可通行需要现场确认。无法确认设施当前是否开放。":
			"The route is for reference only; check on site whether it is passable. Whether the facility is currently open cannot be confirmed.",
		路线参考地图: "Route reference map",
		"地图无法加载时，请使用下方按钮打开 Google 地图。":
			"If the map does not load, use the button below to open Google Maps.",
		"在 Google 地图中打开路线": "Open route in Google Maps",
	},
	ja: {
		选择模式: "モードを選択",
		更多语言: "その他の言語",
		更多语言将在后续版本开放: "その他の言語は今後のバージョンで対応予定です",
		本版本先提供地震流程: "このバージョンではまず地震のフローを提供します",
		该应急类型即将开放: "この緊急タイプは近日対応予定です",
		当前浏览器不支持朗读: "このブラウザは読み上げに対応していません",
		沟通卡: "コミュニケーションカード",
		"若仍处于建筑倒塌、火灾或其他直接危险中，请立即撤离并听从现场人员指示。":
			"建物の倒壊や火災など差し迫った危険が続いている場合は、直ちに避難し、現場の係員の指示に従ってください。",
		"你现在需要哪种帮助？": "今、どのような助けが必要ですか？",
		"每次只完成一个判断，系统再给出下一步。": "一度に一つだけ確認し、その後に次の行動を表示します。",
		灾害模式: "災害モード",
		"地震、火灾、水灾发生后，不知道下一步怎么办。":
			"地震・火災・水害の後、次に何をすべきか分からないときに使います。",
		进入灾害模式: "災害モードを開始",
		日常应急: "日常の緊急時",
		"系统根据公开信息推荐“地震”，请你确认。":
			"公開情報に基づき「地震」が候補です。確認してください。",
		地震: "地震",
		"系统推荐 · 请确认": "システム候補 · 確認してください",
		火灾: "火災",
		"水灾 / 海啸": "水害 / 津波",
		不确定: "分からない",
		"你现在在哪里？": "今どこにいますか？",
		"选择最接近的环境，用于匹配固定行动规则。":
			"最も近い状況を選び、固定された行動ルールに照合します。",
		现在不要做: "今はしないでください",
		同时确认现场信息: "現場の情報も確認",
		"听从工作人员、现场广播和官方发布。": "係員、現場放送、公式情報に従ってください。",
		"规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断":
			"ルール出典：東京都の公式防災資料｜ルール版 v1.0｜建物・医療の専門判断ではありません",
		我做不到: "できません",
		"系统会根据本次位置和官方开放数据列出候选设施。":
			"今回の位置情報と公式オープンデータから候補施設を表示します。",
		重要说明: "重要",
		"“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。":
			"「近い」ことは安全を意味しません。データに載っていても現在開設中とは限りません。経路が通行可能かは現場で確認してください。",
		当前位置: "現在地",
		"東京都新宿区附近 · 仅本次使用": "東京都新宿区付近 · 今回のみ使用",
		暂时不需要: "今は必要ありません",
		附近设施候选: "近くの施設候補",
		打开沟通卡: "コミュニケーションカードを開く",
		请把屏幕给对方看: "相手にこの画面を見せてください",
		"🔊 朗读日语": "🔊 日本語を読み上げる",
		切换其他沟通卡: "別のカードに切り替える",
		选择要展示的沟通卡: "表示するカードを選択",
		收起列表: "リストを閉じる",
		返回: "戻る",
		返回上一步: "前のステップに戻る",
		返回主页: "ホームに戻る",
		"固定审核翻译 · 核心功能不依赖 AI": "確認済み固定翻訳 · コア機能はAIに依存しません",
		当前服务受限: "現在サービスが制限されています",
		"无法获取最新设施数据。请确认现场广播、工作人员和官方信息。":
			"最新の施設データを取得できません。現場放送、係員、公式情報を確認してください。",
		重新尝试: "再試行",
		// Flow copy from DOCS/卡片・灾害定义.xlsm
		"煤气泄漏、迷路、身体不适等紧急状况。":
			"ガス漏れ、道に迷った、体調不良などの緊急時。",
		进入日常应急: "日常の緊急時を開始",
		事象确认: "事象確認",
		"现在发生了什么？": "今、何が起きていますか？",
		"请手动选择日常应急类型。": "日常の緊急時の種類を選んでください。",
		煤气泄漏: "ガス漏れ",
		迷路: "道に迷った",
		身体不适: "体調不良",
		状态确认: "状況確認",
		行动: "行動",
		下一步: "次へ",
		现在应该做: "今すること",
		"我做不到 / 需要帮助": "できません / 助けが必要です",
		"是否需要避难？": "避難が必要ですか？",
		"需要，导航到避难地点": "必要。避難場所へ案内する",
		"摇晃停止了吗？": "揺れは止まりましたか？",
		"先确认身边的晃动情况，再进行下一步。":
			"まず周囲の揺れが止まったか確認してから、次に進みます。",
		停止了: "止まった",
		还在摇晃: "まだ揺れている",
		"你现在是否受伤？": "けがをしていますか？",
		"根据受伤情况，系统会给出不同的行动指引。":
			"けがの状況に応じて、次の行動を案内します。",
		没有受伤: "けがはない",
		"受轻伤，可以移动": "軽傷で、移動できる",
		"被困住或无法移动（被压 / 重伤）": "挟まれた・動けない（下敷き / 重傷）",
		自宅: "自宅",
		"公司、学校、商场等建筑内": "会社・学校・商業施設などの建物内",
		其他: "その他",
		"是否寻找到工作人员？": "係員は見つかりましたか？",
		"优先听从现场工作人员的指示。": "現場の係員の指示に従うことを優先してください。",
		找到了: "見つかった",
		没有找到: "見つからない",
		"低下身体，保护头颈": "姿勢を低くして頭と首を守る",
		"就近进入较安全空间，远离玻璃、高柜、吊物和围墙。等待摇晃停止。":
			"近くの安全な場所に移動し、ガラス・背の高い棚・吊り下げ物・塀から離れてください。揺れが止まるまで待ちます。",
		不要强行挣脱: "無理に抜け出そうとしない",
		"避免二次受伤。": "二次的なけがを避けるためです。",
		"摇晃停止了，继续": "揺れが止まりました。次へ",
		用敲击代替呼喊: "叫ばずに音を出して知らせる",
		"有规律地敲击墙壁或管道。节省体力，避免吸入粉尘。":
			"壁や配管を規則的に叩いてください。体力を温存し、粉じんを吸い込まないようにします。",
		穿上鞋保护双脚: "靴を履いて足を守る",
		"避免踩到玻璃和碎片。": "ガラスや破片を踏まないようにしてください。",
		"不取行李，不乘电梯": "荷物を取らず、エレベーターを使わない",
		"沿安全出口向开阔处移动，途中不要点火、不开关电器。":
			"非常口から開けた場所へ移動してください。途中で火を使ったり、電気機器のスイッチに触れたりしないでください。",
		听从工作人员指示: "係員の指示に従う",
		"按现场引导行动，不要擅自返回建筑内。":
			"現場の誘導に従って行動し、自分の判断で建物内へ戻らないでください。",
		从安全出口离开: "非常口から外へ出る",
		"不取行李，不乘电梯，向开阔处移动。":
			"荷物を取らず、エレベーターを使わずに、開けた場所へ移動してください。",
		警惕余震: "余震に警戒する",
		"穿好鞋，远离高柜、玻璃窗和悬挂物。":
			"靴を履いたままにし、背の高い家具・ガラス窓・吊り下げ物から離れてください。",
		关注官方信息: "公式情報を確認し続ける",
		"留意 NHK、气象厅和自治体的官方发布。":
			"NHK、気象庁、自治体の公式発表に注意してください。",
		立刻停止使用燃气: "ガスの使用をすぐにやめる",
		"关火并停止使用所有燃气器具。": "火を消し、すべてのガス機器の使用をやめてください。",
		不要使用明火和电器开关: "火気と電気のスイッチを使わない",
		"不点火、不抽烟；不开关灯和排风扇，避免产生火花。":
			"火をつけたり、たばこを吸ったりしないでください。火花が出るため、照明や換気扇のスイッチにも触れないでください。",
		"开窗通风，关闭燃气总阀": "窓を開けて換気し、ガスの元栓を閉める",
		"如能安全操作，打开门窗通风，并关闭燃气总阀。":
			"安全に行える場合は、ドアや窓を開けて換気し、ガスの元栓を閉めてください。",
		"是否有人感到头晕、恶心或不适？": "めまい・吐き気・体調不良の人はいますか？",
		"吸入燃气可能引起不适，请先确认现场所有人的状态。":
			"ガスを吸い込むと体調を崩すことがあります。まず現場にいる全員の状態を確認してください。",
		有人不适: "体調が悪い人がいる",
		没有人不适: "体調が悪い人はいない",
		转移到空气新鲜处: "空気の新鮮な場所へ移動する",
		"搀扶不适者到室外或通风良好处休息。":
			"体調の悪い人を支えて、屋外や換気の良い場所で休ませてください。",
		"拨打 119": "119番に電話する",
		"说明燃气泄漏情况和身体不适症状。": "ガス漏れの状況と体調不良の症状を伝えてください。",
		联系燃气公司抢修电话: "ガス会社の緊急連絡先に電話する",
		"到室外安全处再拨打；抢修人员确认安全前，不要返回使用火和电器。":
			"屋外の安全な場所から電話してください。作業員が安全を確認するまで、火や電気を使いに戻らないでください。",
		// SOS card and route-page helper text
		紧急求助: "緊急の救助要請",
		"如手机有信号，立即拨打 119": "電話がつながる場合は、すぐに119番へ",
		等待救援时: "救助を待つあいだ",
		"保存体力，保持手机电量。有规律地敲击墙壁或管道，让救援人员发现你。":
			"体力とバッテリーを温存してください。壁や配管を規則的に叩いて、救助隊に居場所を知らせます。",
		"有人靠近时，展示沟通卡": "人が近づいたらコミュニケーションカードを見せる",
		"到达后或需要求助时，向身边的人展示。":
			"到着したときや助けが必要なときに、周囲の人に見せてください。",
		// Location permission dialog (demo: the location itself is hardcoded)
		"是否允许获取你的实时位置？": "現在地の取得を許可しますか？",
		"用于确认所在区和附近避难设施，仅本次使用，不保存位置历史。":
			"現在地の区市町村と近隣の避難施設の確認に使用します。今回のみ使用し、位置履歴は保存しません。",
		允许获取位置: "位置情報を許可する",
		不允许: "許可しない",
		"已获取当前位置：东京市新宿区": "現在地を取得しました：東京都新宿区",
		"未获得定位权限，将使用默认位置提供参考":
			"位置情報の許可がないため、既定の位置を参考として使用します。",
		东京市新宿区: "東京都新宿区",
		仅本次使用: "今回のみ使用",
		// Demo shelter candidates & route reference
		"正在获取附近的避难所候选…": "近くの避難所候補を取得しています…",
		"根据本次位置查询官方开放数据快照。":
			"今回の位置情報をもとに、公式オープンデータのスナップショットを検索します。",
		避难所: "避難所",
		候选: "候補",
		"当前开放状态：无法确认": "現在の開設状況：確認できません",
		选择并查看路线: "選択して経路を見る",
		"在 Google 地图中查看位置": "Google マップで位置を確認",
		"附近 3 公里内暂无可显示的候选设施": "3km以内に表示できる候補施設がありません",
		"请确认现场广播、工作人员和官方信息，不要依赖本页面。":
			"現場放送、係員、公式情報を確認してください。このページだけに頼らないでください。",
		数据出典: "データ出典",
		更新日: "更新日",
		"非实时信息。附近设施不代表安全或已开放。直线距离不代表路线可通行。":
			"リアルタイム情報ではありません。近い施設が安全または開設中とは限りません。直線距離は経路の通行可能性を示しません。",
		前往设施的路线参考: "施設までの経路の参考",
		"路线仅供参考，是否可通行需要现场确认。无法确认设施当前是否开放。":
			"経路は参考情報です。通行可能かは現場で確認してください。施設が現在開設中かは確認できません。",
		路线参考地图: "経路参考マップ",
		"地图无法加载时，请使用下方按钮打开 Google 地图。":
			"地図が表示されない場合は、下のボタンから Google マップを開いてください。",
		"在 Google 地图中打开路线": "Google マップで経路を開く",
	},
};

// Same behavior as the demo's translateAllStatic: Chinese keys are the source
// text; strings without a translation stay as-is.
export function t(lang: DemoLang, key: string): string {
	if (lang === "zh") return key;
	return FULL_I18N[lang][key] ?? key;
}
