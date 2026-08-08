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
	title: string;
	lead: string;
	prompt: string;
	toast: string;
}

export const WELCOME_COPY: Record<DemoLang, WelcomeCopy> = {
	zh: {
		title: "紧急时，从正确的下一步开始",
		lead: "为在东京生活和滞在的外国人提供母语的灾害行动指引。",
		prompt: "请选择界面语言",
		toast: "已切换为中文",
	},
	en: {
		title: "In an emergency, start with the right next step",
		lead: "Disaster action guidance in your own language, for foreign residents and visitors in Tokyo.",
		prompt: "Choose your interface language",
		toast: "Language changed to English",
	},
	ja: {
		title: "緊急時は、正しい次の一歩から",
		lead: "東京で暮らす・滞在する外国人に、母語での災害行動ガイドを提供します。",
		prompt: "表示言語を選択してください",
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
		本版本先提供地震流程: "This version provides the earthquake flow first",
		// Home screen (redesigned per DOCS/new-ui.png ①)
		查看现在应该做什么: "See what to do now",
		帮助您做出正确的下一步判断: "Helps you decide the right next step",
		"灾害・急病・事故・危险情况时使用": "For disasters, sudden illness, accidents, or danger",
		附近避难设施: "Nearby shelters",
		查看最近的避难设施: "Find the closest evacuation facilities",
		灾害信息: "Disaster info",
		获取最新灾害通知: "Get the latest disaster notices",
		多语言沟通卡: "Multilingual communication card",
		用日语短句与周围的人沟通: "Talk to people nearby with Japanese phrases",
		"无需注册 · 不收集个人信息": "No registration · No personal data collected",
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
		进入灾害模式: "Enter disaster mode",
		日常应急: "Everyday emergency",
		"系统根据公开信息推荐“地震”，请你确认。":
			"Based on public information, the system suggests “Earthquake.” Please confirm.",
		// Event-confirmation data-source card (DOCS/new-ui.png ③)
		"根据公开信息，可能发生了地震": "Based on public information, an earthquake may have occurred",
		"以下是系统根据公开灾害信息的建议，请结合现场情况确认。":
			"The suggestion below is based on public disaster information. Please confirm it against the actual situation on site.",
		数据来源: "Data sources",
		"日本气象厅、东京都防灾信息、内阁府防灾信息 等":
			"Japan Meteorological Agency, Tokyo Metropolitan disaster information, Cabinet Office disaster information, etc.",
		更新时间: "Updated",
		"此信息仅供参考，请以实际情况为准。":
			"This information is for reference only. Follow the actual situation on site.",
		确认并继续: "Confirm and continue",
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
		"東京都新宿区西新宿六丁目8番附近 · 仅本次使用":
			"Near Nishi-Shinjuku 6-8, Shinjuku City, Tokyo · Used only for this session",
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
		// Heatstroke Warning Alert (issued for Tokyo on Aug 7, 2026)
		高温: "Heat",
		"中暑警戒警报（东京地方）": "Heatstroke Warning Alert (Tokyo area)",
		"2026年8月7日 05:00 发表": "Issued Aug 7, 2026, 05:00",
		"环境省・气象厅": "Ministry of the Environment / Japan Meteorological Agency",
		"预计将出现危害健康的显著高温，请注意防暑降温、及时补水。":
			"Dangerously high temperatures are expected. Guard against heatstroke and stay hydrated.",
		"环境省和气象厅向东京都发布了中暑警戒警报。气温将显著升高，可能对健康造成危害，请采取防暑措施。":
			"The Ministry of the Environment and the Japan Meteorological Agency have issued a Heatstroke Warning Alert for Tokyo. Temperatures will be significantly high and may harm your health. Take precautions against the heat.",
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
			"Epicenter and intensity information from the JMA: on the evening of August 5, an M3.5 earthquake occurred in Tokyo's 23 wards. The shaking was minor and there is no tsunami risk.",
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
		"留意气象厅的后续发布。": "Keep an eye on further announcements from the JMA.",
		// Thunderstorm advisory (Western Tama, issued Aug 8, 2026)
		气象: "Weather",
		"雷注意报（东京都多摩西部）": "Thunderstorm advisory (Western Tama, Tokyo)",
		"2026年8月8日 10:01 发表": "Issued Aug 8, 2026, 10:01",
		"多摩西部发布了雷注意报；东京23区（含新宿区）目前没有警报・注意报。":
			"A thunderstorm advisory is in effect for Western Tama. No warnings or advisories for Tokyo's 23 wards (including Shinjuku).",
		"气象厅向东京都多摩西部（青梅市、あきる野市等）发布了雷注意报。您所在的东京23区（含新宿区）目前没有生效的警报・注意报，但天气可能突变，请留意天空变化。":
			"The JMA has issued a thunderstorm advisory for Western Tama in Tokyo (Ome, Akiruno, and nearby cities). No warnings or advisories are in effect for Tokyo's 23 wards (including Shinjuku), but the weather can change suddenly — keep an eye on the sky.",
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
		本版本先提供地震流程: "このバージョンではまず地震のフローを提供します",
		// Home screen (redesigned per DOCS/new-ui.png ①)
		查看现在应该做什么: "今すべきことを確認",
		帮助您做出正确的下一步判断: "正しい次の一歩の判断をサポートします",
		"灾害・急病・事故・危险情况时使用": "災害・急病・事故・危険なときに使用",
		附近避难设施: "近くの避難施設",
		查看最近的避难设施: "最寄りの避難施設を確認",
		灾害信息: "災害情報",
		获取最新灾害通知: "最新の災害情報を取得",
		多语言沟通卡: "多言語コミュニケーションカード",
		用日语短句与周围的人沟通: "日本語フレーズで周囲の人に伝える",
		"无需注册 · 不收集个人信息": "登録不要 · 個人情報は収集しません",
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
		进入灾害模式: "災害モードを開始",
		日常应急: "日常の緊急時",
		"系统根据公开信息推荐“地震”，请你确认。":
			"公開情報に基づき「地震」が候補です。確認してください。",
		// Event-confirmation data-source card (DOCS/new-ui.png ③)
		"根据公开信息，可能发生了地震": "公開情報によると、地震が発生した可能性があります",
		"以下是系统根据公开灾害信息的建议，请结合现场情况确认。":
			"以下は公開されている災害情報に基づく候補です。現場の状況と合わせて確認してください。",
		数据来源: "データ出典",
		"日本气象厅、东京都防灾信息、内阁府防灾信息 等":
			"気象庁、東京都防災情報、内閣府防災情報 など",
		更新时间: "更新時刻",
		"此信息仅供参考，请以实际情况为准。":
			"この情報は参考情報です。実際の状況を優先してください。",
		确认并继续: "確認して続行",
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
		"東京都新宿区西新宿六丁目8番附近 · 仅本次使用": "東京都新宿区西新宿六丁目8番付近 · 今回のみ使用",
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
		// Heatstroke Warning Alert (issued for Tokyo on Aug 7, 2026)
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
