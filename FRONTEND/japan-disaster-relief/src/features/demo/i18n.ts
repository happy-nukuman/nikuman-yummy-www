// Copy/i18n dictionaries ported from DOCS/demo.html, trimmed to the strings
// the current UI actually renders.

export type DemoLang = "zh" | "en" | "ja";

const ENGLISH_MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

/** 将接口的 ISO 日期统一为 Footer 与数据来源卡所用的本地化短日期。 */
export function formatDemoSnapshotDate(lang: DemoLang, value: string): string {
	const match = /^(\d{4})[-/](\d{2})[-/](\d{2})/.exec(value);
	if (!match) return value;
	const [, year, month, day] = match;
	if (lang === "en") {
		const monthName = ENGLISH_MONTHS[Number(month) - 1];
		if (!monthName) return value;
		return `${monthName} ${Number(day)}, ${year}`;
	}
	return `${year}/${month}/${day}`;
}

/** 生成与现有来源卡文案一致的“数据时点”文本。 */
export function dataSnapshotTimeText(lang: DemoLang, value: string): string {
	const separator = lang === "en" ? ": " : "：";
	return `${t(lang, "数据时点")}${separator}${formatDemoSnapshotDate(lang, value)}`;
}

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
	title: string;
	lead: string;
	prompt: string;
	toast: string;
}

export const WELCOME_COPY: Record<DemoLang, WelcomeCopy> = {
	zh: {
		title: "先安全，再行动",
		lead: "为在东京生活和滞留的外国人提供母语的灾害行动指引。",
		prompt: "请选择界面语言",
		toast: "已切换为中文",
	},
	en: {
		title: "Safety first. Then act.",
		lead: "Disaster-response guidance in your own language for international residents and visitors in Tokyo.",
		prompt: "Choose your interface language",
		toast: "Language changed to English",
	},
	ja: {
		title: "まず安全を確保し、それから行動",
		lead: "東京で暮らす・滞在する外国人に、母語で災害時の行動を案内します。",
		prompt: "表示言語を選択してください",
		toast: "日本語に切り替えました",
	},
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

// 日本人回应外国人用的固定短句：[日语原文, 中文译文, 英文译文]。
// 原文和译文都是审核过的固定文案，不经过翻译接口。
export const REPLY_PHRASES: ReadonlyArray<readonly [string, string, string]> = [
	["わかりました。", "明白了。", "Understood."],
	["大丈夫ですか？", "您还好吗？", "Are you okay?"],
	["少々お待ちください。", "请稍等一下。", "Please wait a moment."],
	["ついてきてください。", "请跟我来。", "Please follow me."],
	["避難所まで案内します。", "我带您去避难所。", "I will take you to the evacuation shelter."],
	["救急車を呼びました。", "已经叫了救护车。", "An ambulance has been called."],
];

/** 按界面语言取日方固定回应的译文（ja 界面直接显示日语原文）。 */
export function replyPhraseTranslation(lang: DemoLang, index: number): string {
	const [ja, zh, en] = REPLY_PHRASES[index];
	return lang === "zh" ? zh : lang === "en" ? en : ja;
}

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
		本版本先提供地震流程: "This version provides the earthquake flow first",
		翻译沟通: "Translate",
		"其他语言…": "Other languages…",
		选择其他语言: "Choose another language",
		"以下语言正在准备中，当前版本尚未开放。":
			"These languages are being prepared and are not available in this version.",
		准备中: "Coming soon",
		关闭: "Close",
		本次演示: "Demo",
		"是否允许使用演示位置？": "Use the demo location?",
		"本 Demo 使用固定的新宿位置，仅用于本次查询，不会读取或保存实时 GPS。":
			"This demo uses a fixed Shinjuku location for this session only. It does not read or save live GPS data.",
		使用演示位置: "Use demo location",
		// Home screen (redesigned per DOCS/new-ui.png ①)
		"灾害・急病・事故・危险情况时使用": "For disasters, sudden illness, accidents, or danger",
		附近避难设施: "Nearby shelters",
		查看最近的避难设施: "Find the closest evacuation facilities",
		灾害信息: "Disaster info",
		公开灾害信息: "Public disaster information",
		获取最新灾害通知: "Get the latest disaster updates",
		需要位置权限: "Location required",
		"附近避难设施和灾害信息暂不可用，其他功能仍可使用。":
			"Nearby shelters and disaster information are unavailable without location access. Other features still work.",
		"无需注册・不收集个人信息": "No registration · No personal data collected",
		"位置信息仅用于本次查询，不会被保存。":
			"Location is used only for this search and is not saved.",
		"定位精度：大致位置": "Location accuracy: approximate",
		"正在获取当前位置…": "Acquiring current location…",
		// Emergency help screen (DOCS/new-ui.png ⑦)
		"如果遇到危险，请立即求助": "If you are in danger, call for help immediately",
		"火灾・救护・急病": "Fire / Ambulance / Sudden illness",
		"拨打 110": "Call 110",
		"警察・犯罪・纠纷・危险人物": "Police / Crime / Disputes / Dangerous person",
		"确保自身安全后再拨打电话。尽量在安全地点使用。":
			"Make sure you are safe before calling. Use from a safe place whenever possible.",
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
		日常应急: "Everyday emergencies",
		"系统根据公开信息推荐“地震”，请你确认。":
			"Public information indicates a possible earthquake. Please confirm against what is happening around you.",
		// Event-confirmation data-source card (DOCS/new-ui.png ③)
		"根据公开信息，可能发生了地震": "Public information indicates a possible earthquake",
		"以下是系统根据公开灾害信息的建议，请结合现场情况确认。":
			"Please confirm against what is happening around you.",
		数据来源: "Data sources",
		"日本气象厅、东京都防灾信息、内阁府防灾信息 等":
			"Japan Meteorological Agency, Tokyo Metropolitan disaster information, Cabinet Office disaster information, etc.",
		"Demo 数据快照": "Demo data snapshot",
		数据时点: "Data snapshot",
		"Demo 模拟同步": "Demo sync (simulated)",
		流程进度: "Flow progress",
		Support: "Support",
		联系我们: "Contact",
		"Tokyo Safe First 是面向东京外国居民和游客的灾害行动 Demo。":
			"Tokyo Safe First is a disaster-response guidance demo for international residents and visitors in Tokyo.",
		"如发生真实紧急情况：": "Emergency contacts",
		"消防 / 救护": "Fire / Ambulance",
		警察: "Police",
		"本 Demo 信息仅供辅助参考，请同时确认现场人员及官方发布。":
			"This demo is for guidance only. Also follow on-site staff and official announcements.",
		"非实时信息，请以官方发布为准":
			"Not real-time information. Follow official announcements.",
		"此信息仅供参考，请以实际情况为准。":
			"This information is for reference only. Follow the actual situation on site.",
		确认并继续: "Confirm and continue",
		地震: "Earthquake",
		"系统推荐 · 请确认": "Based on public data · Please confirm",
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
		"系统会根据本次位置和官方开放数据列出候选设施。":
			"The system will list candidate facilities using your current session location and official open data.",
		"选择导航到避难地点时，将询问是否使用演示位置。":
			"If you choose shelter navigation, you will be asked whether to use the demo location.",
		重要说明: "Important",
		"“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。":
			"“Nearby” does not mean safe. Being listed in the data does not mean the facility is currently open. Route accessibility must be checked on site.",
		当前位置: "Current location",
		"東京都新宿区西新宿六丁目8番附近 · 仅本次使用":
			"Near Nishi-Shinjuku 6-8, Shinjuku City, Tokyo · Used only for this session",
		暂时不需要: "Not now",
		附近设施候选: "Nearby evacuation facilities",
		打开沟通卡: "Open communication card",
		打开翻译沟通: "Open translation support",
		请把屏幕给对方看: "Show this screen to the other person",
		"🔊 朗读日语": "🔊 Speak Japanese",
		"⏹ 停止": "⏹ Stop",
		"点选下方常用沟通卡，或输入文字，系统会翻译成日语展示给对方。":
			"Tap a common phrase below, or type your own words — they will be translated into Japanese to show the other person.",
		常用沟通卡: "Common phrases",
		"输入想说的话，翻译成日语": "Type what you want to say…",
		发送: "Send",
		我说: "I speak",
		语音输入: "Voice input",
		键盘输入: "Keyboard input",
		"按住 说话": "Hold to Talk",
		"松开 结束": "Release to End",
		当前浏览器不支持语音输入: "This browser does not support voice input",
		未获得麦克风权限: "Microphone permission was not granted",
		"语音识别失败，请重试": "Voice recognition failed. Please try again.",
		固定审核翻译: "Reviewed fixed translation",
		"AI 翻译 · 仅供参考": "AI translation · For reference only",
		"翻译中…": "Translating…",
		翻译失败: "Translation failed",
		返回: "Back",
		返回上一步: "Back",
		返回主页: "Back to home",
		返回首页: "Home",
		当前服务受限: "Service currently limited",
		"无法读取 Demo 设施快照。请确认现场广播、工作人员和官方信息。":
			"The demo facility snapshot could not be loaded. Check on-site announcements, staff instructions, and official information.",
		重新尝试: "Try again",
		// Flow copy from DOCS/卡片・灾害定义.xlsm
		"煤气泄漏、迷路、身体不适等紧急状况。":
			"For situations such as gas leaks, getting lost, or feeling unwell.",
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
			"Tap on a wall or pipe in a steady rhythm. Save your strength and avoid breathing in dust.",
		穿上鞋保护双脚: "Put on shoes to protect your feet",
		"避免踩到玻璃和碎片。": "Avoid stepping on glass and debris.",
		"不取行李，不乘电梯": "Do not take luggage or use elevators",
		"沿安全出口向开阔处移动，途中不要点火、不开关电器。":
			"Move toward an open area via a safety exit. Do not light flames or switch electrical devices on the way.",
		听从工作人员指示: "Follow staff instructions",
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
		"关火并停止使用所有燃气器具。": "Turn off all flames and stop using gas appliances.",
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
			"Call from a safe place outside. Do not return or use flames or electricity until repair staff confirm it is safe.",
		// SOS card and route-page helper text
		紧急求助: "Emergency help",
		"如手机有信号，立即拨打 119": "If your phone has signal, call 119 now",
		等待救援时: "While waiting for rescue",
		"保存体力，保持手机电量。有规律地敲击墙壁或管道，让救援人员发现你。":
			"Save your strength and phone battery. Tap on a wall or pipe in a steady rhythm so rescuers can find you.",
		"到达后或需要求助时，向身边的人展示。":
			"Show this to people around you when you arrive or when you need help.",
		// Location permission dialog (demo: the location itself is hardcoded)
		"是否允许获取你的实时位置？": "Allow access to your current location?",
		"用于确认所在区和附近避难设施，仅本次使用，不保存位置历史。":
			"Used to identify your area and nearby evacuation facilities. Used only for this session; location history is not saved.",
		允许获取位置: "Allow location access",
		不允许: "Don't allow",
		"已获取当前位置：东京都新宿区西新宿六丁目8番":
			"Location acquired: Nishi-Shinjuku 6-8, Shinjuku City, Tokyo",
		"未获得定位权限，位置相关功能不可用":
			"Location permission was not granted. Location-based features are unavailable.",
		未获得定位权限: "Location permission not granted",
		"允许定位后才能使用位置相关功能。": "Allow location access to use location-based features.",
		东京都新宿区西新宿六丁目8番: "Nishi-Shinjuku 6-8, Shinjuku City, Tokyo",
		仅本次使用: "This session only",
		// Disaster info list & detail (home tile → nearby disaster info snapshot)
		当前位置附近的灾害信息: "Disaster information near your location",
		"以下为当前位置附近可参考的公开防灾信息，点击查看详情。":
			"Public disaster-prevention information near your location is shown below for reference. Tap an item for details.",
		"以下为当前位置附近可参考的公开防灾信息":
			"The information below is public disaster-prevention information near your location for reference.",
		"新宿区当前没有生效中的气象警报・注意报":
			"No weather warnings or advisories are currently in effect for Shinjuku City",
		"以下是根据本次位置整理的公开灾害信息，点击查看详情。":
			"Public disaster information for this session's location. Tap an item for details.",
		"新宿区当前没有生效的警报・注意报":
			"No warnings or advisories are currently in effect for Shinjuku City",
		"2026年8月8日 10:01 气象厅发表":
			"Issued by the Japan Meteorological Agency, Aug 8, 2026, 10:01",
		"非实时信息。请以官方最新发布为准。":
			"Not real-time information. Always follow the latest official announcements.",
		详细信息: "Details",
		建议行动: "Recommended actions",
		发表时间: "Issued at",
		发表机关: "Issued by",
		对象地域: "Target area",
		// Heat Stroke Alert (issued for Tokyo on Aug 7, 2026)
		高温: "Heat",
		"中暑警戒警报（东京地方）": "Heat Stroke Alert (Tokyo area)",
		"2026年8月7日 05:00 发表": "Issued Aug 7, 2026, 05:00",
		"环境省・气象厅": "Ministry of the Environment / Japan Meteorological Agency",
		"预计将出现危害健康的显著高温，请注意防暑降温、及时补水。":
			"Dangerously high temperatures are expected. Guard against heatstroke and stay hydrated.",
		"环境省和气象厅向东京都发布了中暑警戒警报。气温将显著升高，可能对健康造成危害，请采取防暑措施。":
			"The Ministry of the Environment and the Japan Meteorological Agency have issued a Heat Stroke Alert for Tokyo. Temperatures will be significantly high and may harm your health. Take precautions against the heat.",
		"东京地方（含新宿区）": "Tokyo area (including Shinjuku City)",
		"2026年8月7日 05:00": "Aug 7, 2026, 05:00",
		"在室内适当使用空调，保持凉爽环境。":
			"Use air conditioning appropriately indoors and stay in a cool environment.",
		"尽量减少外出，避免长时间在烈日下活动。":
			"Go outside as little as possible and avoid long activity under the strong sun.",
		"勤补充水分和盐分，注意休息。": "Take in water and salt frequently, and rest often.",
		"多留意老人、儿童等不易察觉中暑人群的状况。":
			"Check often on older people, children, and others who may not notice heatstroke symptoms.",
		// Earthquake information (Tokyo 23 wards, Aug 5, 2026, M3.5)
		"震源・震度信息：东京都23区": "Earthquake information: Tokyo 23 wards",
		"2026年8月5日 18:06 左右发生": "Occurred around 18:06, Aug 5, 2026",
		气象厅: "Japan Meteorological Agency",
		"东京都23区发生 M3.5 地震，最大震度1，无海啸风险。":
			"An M3.5 earthquake occurred in Tokyo's 23 wards. Maximum intensity 1; no tsunami risk.",
		"气象厅发布的震源・震度信息：8月5日傍晚，东京都23区发生了 M3.5 的地震。此次地震震度较小，无海啸风险。":
			"Epicenter and intensity information from the Japan Meteorological Agency: on the evening of August 5, an M3.5 earthquake occurred in Tokyo's 23 wards. The shaking was minor and there is no tsunami risk.",
		发生时刻: "Time of occurrence",
		"2026年8月5日 18:06 左右": "Around 18:06, Aug 5, 2026",
		震源地: "Epicenter",
		东京都23区: "Tokyo 23 wards",
		规模: "Magnitude",
		"M3.5": "M3.5",
		震源深度: "Depth",
		约120公里: "About 120 km",
		最大震度: "Maximum intensity",
		"震度1（栃木县宇都宫市）": "Intensity 1 (Utsunomiya, Tochigi)",
		海啸: "Tsunami",
		无海啸风险: "No tsunami risk",
		"此次地震震度较小，通常无需特别行动。":
			"The shaking was minor; usually no special action is needed.",
		"如再次感到摇晃，先保护头部，远离可能坠落的物品。":
			"If you feel shaking again, protect your head first and stay away from objects that could fall.",
		"留意气象厅的后续发布。":
			"Keep an eye on further announcements from the Japan Meteorological Agency.",
		// Thunderstorm advisory (Western Tama, issued Aug 8, 2026)
		气象: "Weather",
		"雷注意报（东京都多摩西部）": "Thunderstorm advisory (Western Tama, Tokyo)",
		"2026年8月8日 10:01 发表": "Issued Aug 8, 2026, 10:01",
		"多摩西部发布了雷注意报；东京23区（含新宿区）目前没有警报・注意报。":
			"A thunderstorm advisory is in effect for Western Tama. No warnings or advisories for Tokyo's 23 wards (including Shinjuku).",
		"气象厅向东京都多摩西部（青梅市、あきる野市等）发布了雷注意报。您所在的东京23区（含新宿区）目前没有生效的警报・注意报，但天气可能突变，请留意天空变化。":
			"The Japan Meteorological Agency has issued a thunderstorm advisory for Western Tama in Tokyo (Ome, Akiruno, and nearby cities). No warnings or advisories are in effect for Tokyo's 23 wards (including Shinjuku), but the weather can change suddenly — keep an eye on the sky.",
		东京都多摩西部: "Western Tama, Tokyo",
		"23区（含新宿区）": "Tokyo 23 wards (incl. Shinjuku)",
		"无警报・注意报": "No warnings or advisories",
		"2026年8月8日 10:01": "Aug 8, 2026, 10:01",
		"天气突变时，警惕雷电和局部强降雨。":
			"If the weather changes suddenly, watch out for lightning and localized heavy rain.",
		"听到雷声时，远离空旷场地和大树，进入牢固的建筑物内。":
			"When you hear thunder, stay away from open ground and tall trees, and move inside a sturdy building.",
		// Demo shelter candidates & route reference
		"正在获取附近的避难所候选…": "Loading nearby shelter candidates…",
		"根据本次位置查询官方开放数据快照。":
			"Searching a snapshot of official open data using your current session location.",
		避难所: "Shelter",
		候选: "Candidate",
		"当前开放状态：无法确认": "Opening status: unconfirmed",
		选择并查看路线: "Select and view route",
		"在 Google 地图中查看位置": "View location on Google Maps",
		"附近 3 公里内暂无可显示的候选设施":
			"No evacuation facilities found within 3 km",
		"请确认现场广播、工作人员和官方信息，不要依赖本页面。":
			"Check on-site announcements, staff instructions, and official information. Do not rely on this page.",
		数据出典: "Data source",
		更新日: "Updated",
		数据源更新: "Source data updated",
		"非实时信息。附近设施不代表安全或已开放。直线距离不代表路线可通行。":
			"Not real-time information. A nearby facility is not necessarily safe or open. Straight-line distance does not mean the route is passable.",
		前往设施的路线参考: "Route to this facility (reference only)",
		"路线仅供参考，是否可通行需要现场确认。无法确认设施当前是否开放。":
			"The route is for reference only; check on site whether it is passable. Whether the facility is currently open cannot be confirmed.",
		路线参考地图: "Route reference map",
		"地图无法加载时，请使用下方按钮打开 Google 地图。":
			"If the map does not load, use the button below to open Google Maps.",
		"在 Google 地图中打开路线": "Open route in Google Maps",
	},
	ja: {
		本版本先提供地震流程: "このバージョンではまず地震のフローを提供します",
		翻译沟通: "翻訳・会話",
		"其他语言…": "その他の言語…",
		选择其他语言: "その他の言語を選択",
		"以下语言正在准备中，当前版本尚未开放。":
			"以下の言語は準備中のため、現在のバージョンでは利用できません。",
		准备中: "準備中",
		关闭: "閉じる",
		本次演示: "デモ",
		"是否允许使用演示位置？": "デモ用の位置情報を使用しますか？",
		"本 Demo 使用固定的新宿位置，仅用于本次查询，不会读取或保存实时 GPS。":
			"このデモでは新宿の固定位置を今回の検索にのみ使用します。リアルタイムGPSの取得・保存は行いません。",
		使用演示位置: "デモ位置を使用",
		// Home screen (redesigned per DOCS/new-ui.png ①)
		"灾害・急病・事故・危险情况时使用": "災害・急病・事故・危険なときに使用",
		附近避难设施: "近くの避難施設",
		查看最近的避难设施: "最寄りの避難施設を確認",
		灾害信息: "災害情報",
		公开灾害信息: "公開災害情報",
		获取最新灾害通知: "最新の災害情報を確認",
		需要位置权限: "位置情報が必要",
		"附近避难设施和灾害信息暂不可用，其他功能仍可使用。":
			"付近の避難施設と災害情報は現在利用できません。その他の機能は引き続き利用できます。",
		"无需注册・不收集个人信息": "登録不要・個人情報は収集しません",
		"位置信息仅用于本次查询，不会被保存。":
			"位置情報は今回の検索のみに使用し、保存されません。",
		"定位精度：大致位置": "位置精度：おおよその位置",
		"正在获取当前位置…": "現在地を取得しています…",
		// Emergency help screen (DOCS/new-ui.png ⑦)
		"如果遇到危险，请立即求助": "危険なときは、すぐに助けを求めてください",
		"火灾・救护・急病": "火事・救急・急病",
		"拨打 110": "110番に電話する",
		"警察・犯罪・纠纷・危险人物": "警察・犯罪・トラブル・不審者",
		"确保自身安全后再拨打电话。尽量在安全地点使用。":
			"自身の安全を確保してから電話してください。できるだけ安全な場所で使用してください。",
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
		日常应急: "日常の緊急対応",
		"系统根据公开信息推荐“地震”，请你确认。":
			"公開情報では地震の可能性があります。現場の状況と合わせて確認してください。",
		// Event-confirmation data-source card (DOCS/new-ui.png ③)
		"根据公开信息，可能发生了地震": "公開情報では地震の可能性があります",
		"以下是系统根据公开灾害信息的建议，请结合现场情况确认。":
			"現場の状況と合わせて確認してください。",
		数据来源: "データ出典",
		"日本气象厅、东京都防灾信息、内阁府防灾信息 等":
			"気象庁、東京都防災情報、内閣府防災情報 など",
		"Demo 数据快照": "デモデータのスナップショット",
		数据时点: "データ時点",
		"Demo 模拟同步": "デモ同期（模擬）",
		流程进度: "フローの進行状況",
		Support: "サポート",
		联系我们: "お問い合わせ",
		"Tokyo Safe First 是面向东京外国居民和游客的灾害行动 Demo。":
			"Tokyo Safe First は、東京で暮らす・滞在する外国人向けの災害時行動支援デモです。",
		"如发生真实紧急情况：": "緊急時の連絡先",
		"消防 / 救护": "消防 / 救急",
		警察: "警察",
		"本 Demo 信息仅供辅助参考，请同时确认现场人员及官方发布。":
			"本デモは補助的な参考情報です。現場の係員や公式発表も確認してください。",
		"非实时信息，请以官方发布为准":
			"リアルタイム情報ではありません。公式発表を優先してください。",
		"此信息仅供参考，请以实际情况为准。":
			"この情報は参考情報です。実際の状況を優先してください。",
		确认并继续: "確認して次へ",
		地震: "地震",
		"系统推荐 · 请确认": "公開情報から推定 · 要確認",
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
		"系统会根据本次位置和官方开放数据列出候选设施。":
			"今回の位置情報と公式オープンデータから候補施設を表示します。",
		"选择导航到避难地点时，将询问是否使用演示位置。":
			"避難先へのナビを選ぶと、デモ位置を使用するか確認します。",
		重要说明: "重要",
		"“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。":
			"「近い」ことは安全を意味しません。データに載っていても現在開設中とは限りません。経路が通行可能かは現場で確認してください。",
		当前位置: "現在地",
		"東京都新宿区西新宿六丁目8番附近 · 仅本次使用": "東京都新宿区西新宿六丁目8番付近 · 今回のみ使用",
		暂时不需要: "今は必要ありません",
		附近设施候选: "近くの避難施設",
		打开沟通卡: "コミュニケーションカードを開く",
		打开翻译沟通: "翻訳・会話を開く",
		请把屏幕给对方看: "相手にこの画面を見せてください",
		"🔊 朗读日语": "🔊 日本語を読み上げる",
		"⏹ 停止": "⏹ 停止",
		"点选下方常用沟通卡，或输入文字，系统会翻译成日语展示给对方。":
			"下のよく使うフレーズを選ぶか、伝えたいことを入力してください。日本語に翻訳して相手に表示します。",
		常用沟通卡: "よく使うフレーズ",
		"输入想说的话，翻译成日语": "伝えたいことを入力…",
		发送: "送信",
		我说: "自分が話す",
		语音输入: "音声入力",
		键盘输入: "キーボード入力",
		"按住 说话": "長押しして 話す",
		"松开 结束": "離して 終了",
		当前浏览器不支持语音输入: "このブラウザは音声入力に対応していません",
		未获得麦克风权限: "マイクの使用が許可されていません",
		"语音识别失败，请重试": "音声認識に失敗しました。もう一度お試しください。",
		固定审核翻译: "確認済みの固定翻訳",
		"AI 翻译 · 仅供参考": "AI翻訳 · 参考情報",
		"翻译中…": "翻訳中…",
		翻译失败: "翻訳に失敗しました",
		返回: "戻る",
		返回上一步: "前に戻る",
		返回主页: "ホームに戻る",
		返回首页: "ホーム",
		当前服务受限: "現在、この機能を利用できません",
		"无法读取 Demo 设施快照。请确认现场广播、工作人员和官方信息。":
			"避難施設のデモデータを読み込めません。現場放送、係員、公式情報を確認してください。",
		重新尝试: "再試行",
		// Flow copy from DOCS/卡片・灾害定义.xlsm
		"煤气泄漏、迷路、身体不适等紧急状况。":
			"ガス漏れ、道に迷ったとき、体調不良などの日常の緊急時に使います。",
		事象确认: "事象確認",
		"现在发生了什么？": "今、何が起きていますか？",
		"请手动选择日常应急类型。": "日常の緊急対応の種類を選んでください。",
		煤气泄漏: "ガス漏れ",
		迷路: "道に迷った",
		身体不适: "体調不良",
		状态确认: "状況確認",
		行动: "行動",
		下一步: "次へ",
		现在应该做: "今すること",
		"是否需要避难？": "避難が必要ですか？",
		"需要，导航到避难地点": "はい、避難場所を探す",
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
		"优先听从现场工作人员的指示。": "まず現場の係員の指示に従ってください。",
		找到了: "見つかった",
		没有找到: "見つからない",
		"低下身体，保护头颈": "姿勢を低くして頭と首を守る",
		"就近进入较安全空间，远离玻璃、高柜、吊物和围墙。等待摇晃停止。":
			"近くの安全な場所に移動し、ガラス・背の高い棚・吊り下げ物・塀から離れてください。揺れが止まるまで待ってください。",
		不要强行挣脱: "無理に抜け出そうとしない",
		"避免二次受伤。": "二次的なけがを避けるためです。",
		"摇晃停止了，继续": "揺れが止まりました。次へ",
		用敲击代替呼喊: "叫ばずに音を出して知らせる",
		"有规律地敲击墙壁或管道。节省体力，避免吸入粉尘。":
			"壁や配管を規則的に叩いてください。体力を温存し、粉じんを吸い込まないでください。",
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
		紧急求助: "救助を要請",
		"如手机有信号，立即拨打 119": "電話がつながる場合は、すぐに119番へ",
		等待救援时: "救助を待つあいだ",
		"保存体力，保持手机电量。有规律地敲击墙壁或管道，让救援人员发现你。":
			"体力とバッテリーを温存してください。壁や配管を規則的に叩いて、救助隊に居場所を知らせてください。",
		"到达后或需要求助时，向身边的人展示。":
			"到着したときや助けが必要なときに、周囲の人に見せてください。",
		// Location permission dialog (demo: the location itself is hardcoded)
		"是否允许获取你的实时位置？": "現在地の取得を許可しますか？",
		"用于确认所在区和附近避难设施，仅本次使用，不保存位置历史。":
			"現在地の区市町村と近隣の避難施設の確認に使用します。今回のみ使用し、位置履歴は保存しません。",
		允许获取位置: "位置情報を許可する",
		不允许: "許可しない",
		"已获取当前位置：东京都新宿区西新宿六丁目8番":
			"現在地を取得しました：東京都新宿区西新宿六丁目8番",
		"未获得定位权限，位置相关功能不可用":
			"位置情報の許可がないため、位置情報を利用する機能は使用できません。",
		未获得定位权限: "位置情報が許可されていません",
		"允许定位后才能使用位置相关功能。":
			"位置情報を許可すると、位置情報を利用する機能が使えます。",
		东京都新宿区西新宿六丁目8番: "東京都新宿区西新宿六丁目8番",
		仅本次使用: "今回のみ使用",
		// Disaster info list & detail (home tile → nearby disaster info snapshot)
		当前位置附近的灾害信息: "現在地周辺の災害情報",
		"以下为当前位置附近可参考的公开防灾信息，点击查看详情。":
			"現在地周辺の参考となる公開防災情報です。タップすると詳細を表示します。",
		"以下为当前位置附近可参考的公开防灾信息":
			"以下は現在地周辺で参考にできる公開防災情報です。",
		"新宿区当前没有生效中的气象警报・注意报":
			"新宿区には現在、有効な気象警報・注意報はありません",
		"以下是根据本次位置整理的公开灾害信息，点击查看详情。":
			"今回の位置情報をもとに整理した公開災害情報です。タップすると詳細を表示します。",
		"新宿区当前没有生效的警报・注意报": "新宿区には現在、警報・注意報は発表されていません",
		"2026年8月8日 10:01 气象厅发表": "2026年8月8日 10:01 気象庁発表",
		"非实时信息。请以官方最新发布为准。":
			"リアルタイム情報ではありません。最新の公式発表を優先してください。",
		详细信息: "詳細情報",
		建议行动: "推奨される行動",
		发表时间: "発表時刻",
		发表机关: "発表機関",
		对象地域: "対象地域",
		// Heat Stroke Alert (issued for Tokyo on Aug 7, 2026)
		高温: "高温",
		"中暑警戒警报（东京地方）": "熱中症警戒アラート（東京地方）",
		"2026年8月7日 05:00 发表": "2026年8月7日 05:00 発表",
		"环境省・气象厅": "環境省・気象庁",
		"预计将出现危害健康的显著高温，请注意防暑降温、及时补水。":
			"健康に影響が出るおそれのある危険な暑さが予想されます。暑さ対策と水分補給を心がけてください。",
		"环境省和气象厅向东京都发布了中暑警戒警报。气温将显著升高，可能对健康造成危害，请采取防暑措施。":
			"環境省と気象庁は東京都に熱中症警戒アラートを発表しました。気温が著しく高くなり、健康被害が生じるおそれがあります。暑さへの対策をとってください。",
		"东京地方（含新宿区）": "東京地方（新宿区を含む）",
		"2026年8月7日 05:00": "2026年8月7日 05:00",
		"在室内适当使用空调，保持凉爽环境。":
			"屋内ではエアコンを適切に使用し、涼しい環境で過ごしてください。",
		"尽量减少外出，避免长时间在烈日下活动。":
			"外出はできるだけ控え、炎天下での長時間の活動は避けてください。",
		"勤补充水分和盐分，注意休息。": "こまめに水分・塩分を補給し、休憩をとってください。",
		"多留意老人、儿童等不易察觉中暑人群的状况。":
			"高齢者や子どもなど、熱中症に気づきにくい人の様子に気を配ってください。",
		// Earthquake information (Tokyo 23 wards, Aug 5, 2026, M3.5)
		"震源・震度信息：东京都23区": "震源・震度情報：東京都23区",
		"2026年8月5日 18:06 左右发生": "2026年8月5日 18時06分ごろ発生",
		气象厅: "気象庁",
		"东京都23区发生 M3.5 地震，最大震度1，无海啸风险。":
			"東京都23区で M3.5 の地震が発生しました。最大震度1、津波の心配はありません。",
		"气象厅发布的震源・震度信息：8月5日傍晚，东京都23区发生了 M3.5 的地震。此次地震震度较小，无海啸风险。":
			"気象庁発表の震源・震度情報：8月5日夕方、東京都23区で M3.5 の地震が発生しました。揺れは小さく、津波の心配はありません。",
		发生时刻: "発生時刻",
		"2026年8月5日 18:06 左右": "2026年8月5日 18時06分ごろ",
		震源地: "震源地",
		东京都23区: "東京都23区",
		规模: "マグニチュード",
		"M3.5": "M3.5",
		震源深度: "震源の深さ",
		约120公里: "約120km",
		最大震度: "最大震度",
		"震度1（栃木县宇都宫市）": "震度1（栃木県宇都宮市）",
		海啸: "津波",
		无海啸风险: "津波の心配はありません",
		"此次地震震度较小，通常无需特别行动。":
			"今回の揺れは小さく、通常は特別な行動は必要ありません。",
		"如再次感到摇晃，先保护头部，远离可能坠落的物品。":
			"再び揺れを感じたら、まず頭を守り、落下しそうな物から離れてください。",
		"留意气象厅的后续发布。": "気象庁の続報に注意してください。",
		// Thunderstorm advisory (Western Tama, issued Aug 8, 2026)
		气象: "気象",
		"雷注意报（东京都多摩西部）": "雷注意報（東京都多摩西部）",
		"2026年8月8日 10:01 发表": "2026年8月8日 10:01 発表",
		"多摩西部发布了雷注意报；东京23区（含新宿区）目前没有警报・注意报。":
			"多摩西部に雷注意報が発表されています。東京23区（新宿区を含む）には警報・注意報はありません。",
		"气象厅向东京都多摩西部（青梅市、あきる野市等）发布了雷注意报。您所在的东京23区（含新宿区）目前没有生效的警报・注意报，但天气可能突变，请留意天空变化。":
			"気象庁は東京都多摩西部（青梅市・あきる野市など）に雷注意報を発表しました。東京23区（新宿区を含む）には現在、警報・注意報は発表されていませんが、天気が急変するおそれがあるため、空の変化に注意してください。",
		东京都多摩西部: "東京都多摩西部",
		"23区（含新宿区）": "23区（新宿区を含む）",
		"无警报・注意报": "警報・注意報なし",
		"2026年8月8日 10:01": "2026年8月8日 10:01",
		"天气突变时，警惕雷电和局部强降雨。":
			"天気が急変したときは、落雷や局地的な激しい雨に注意してください。",
		"听到雷声时，远离空旷场地和大树，进入牢固的建筑物内。":
			"雷の音が聞こえたら、開けた場所や高い木から離れ、頑丈な建物の中に入ってください。",
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
		数据源更新: "データソース更新日",
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
