"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import type { GeoPoint } from "../../../lib/geo/calculate-distance";
import { useDemoShelters } from "../../shelter/hooks/use-demo-shelters";
import { ShelterCandidateList } from "../../shelter/components/shelter-candidate-list";
import { ShelterRouteMap } from "../../shelter/components/shelter-route-map";
import { formatApproxDistance } from "../../shelter/format";
import { shelterDisplayAddress, shelterDisplayName } from "../../shelter/localization";
import {
	type DemoLang,
	HEADER_LABELS,
	PHRASES,
	PHRASE_TEXT,
	t,
	WELCOME_COPY,
} from "../i18n";
import { FLOWS, type FlowId, getNode, resolveOption } from "../flows";
import "../demo.css";

type ScreenName =
	| "welcome"
	| "mode"
	| "event"
	| "daily"
	| "flow"
	| "shelter"
	| "facilities"
	| "navigate"
	| "communication"
	| "offline";

// Demo 固定“现在地”（东京都厅附近）：demo 版不调用浏览器定位，
// 保证候选列表始终命中新宿区数据快照。
const DEMO_ORIGIN: GeoPoint = { latitude: 35.6896342, longitude: 139.6917418 };

const DEMO_SHELTER_LIMIT = 5;

interface FlowPosition {
	flowId: FlowId;
	nodeId: string;
}

// 选项点选后立即跳转，跳转前把当前画面压栈，供“返回上一步”恢复。
interface NavSnapshot {
	screen: ScreenName;
	flowPos: FlowPosition | null;
	cardIndex: number;
}

export function DemoApp() {
	const [screen, setScreen] = useState<ScreenName>("welcome");
	const [lang, setLang] = useState<DemoLang>("zh");
	// 位置许可：demo 版允许后固定使用东京都厅演示坐标（DEMO_ORIGIN）。
	const [locPermission, setLocPermission] = useState<"unknown" | "granted" | "denied">("unknown");
	// 用户在候选列表中选择的避难设施（路线页的目的地）。
	const [selectedShelter, setSelectedShelter] = useState<DemoShelterCandidate | null>(null);
	const shelters = useDemoShelters();
	// 选完语言后以弹窗形式询问位置许可；不允许则停留在语言页无法继续。
	const [locDialogOpen, setLocDialogOpen] = useState(false);
	// 事象确认卡：灾害模式自动识别推荐地震并高亮，日常应急为手动选择。
	const [eventChoice, setEventChoice] = useState("earthquake");
	const [dailyChoice, setDailyChoice] = useState<string | null>(null);
	const [flowPos, setFlowPos] = useState<FlowPosition | null>(null);
	const [flowAnswers, setFlowAnswers] = useState<Record<string, string>>({});
	const [cardIndex, setCardIndex] = useState(0);
	const [phrase, setPhrase] = useState(0);
	const [phrasePickerOpen, setPhrasePickerOpen] = useState(false);
	// Screen to go back to when leaving the communication card.
	const [commReturn, setCommReturn] = useState<ScreenName>("mode");
	const [history, setHistory] = useState<NavSnapshot[]>([]);
	const [toast, setToast] = useState({ msg: "", show: false });
	const toastTimer = useRef<number | undefined>(undefined);

	const welcome = WELCOME_COPY[lang];

	useEffect(() => {
		document.documentElement.lang = lang === "zh" ? "zh-CN" : lang === "en" ? "en" : "ja";
	}, [lang]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [screen]);

	function notify(msg: string) {
		setToast({ msg, show: true });
		window.clearTimeout(toastTimer.current);
		toastTimer.current = window.setTimeout(
			() => setToast((prev) => ({ ...prev, show: false })),
			1800,
		);
	}

	function pushHistory() {
		setHistory((prev) => [...prev, { screen, flowPos, cardIndex }]);
	}

	function goBack() {
		const prev = history[history.length - 1];
		if (!prev) return;
		setHistory(history.slice(0, -1));
		setFlowPos(prev.flowPos);
		setCardIndex(prev.cardIndex);
		setScreen(prev.screen);
	}

	// 顶栏下拉框：随时切换语言，停留在当前页面，不重走首页流程。
	function switchLanguage(next: DemoLang) {
		if (next === lang) return;
		setLang(next);
		notify(WELCOME_COPY[next].toast);
	}

	function pickLanguage(next: string) {
		if (next === "more") {
			notify(t(lang, "更多语言将在后续版本开放"));
			return;
		}
		const picked = next as DemoLang;
		setLang(picked);
		notify(WELCOME_COPY[picked].toast);
		// 已允许过则直接进入下一页；否则（含之前拒绝过）弹窗询问位置许可。
		if (locPermission === "granted") {
			pushHistory();
			setScreen("mode");
		} else {
			setLocDialogOpen(true);
		}
	}

	function decideLocation(allow: boolean) {
		setLocPermission(allow ? "granted" : "denied");
		setLocDialogOpen(false);
		if (allow) {
			notify(t(lang, "已获取当前位置：东京市新宿区"));
			pushHistory();
			setScreen("mode");
		} else {
			// 拒绝后停留在语言选择页，不能继续；重新选择语言可再次弹窗。
			notify(t(lang, "未获得位置许可，无法继续下一步"));
		}
	}

	// 进入“附近设施候选”页时用演示坐标请求 Demo 避难所列表。
	function searchShelters() {
		shelters.mutate({
			latitude: DEMO_ORIGIN.latitude,
			longitude: DEMO_ORIGIN.longitude,
			limit: DEMO_SHELTER_LIMIT,
		});
	}

	// 在候选列表中选择设施后，进入路线参考页。
	function navigateToShelter(facility: DemoShelterCandidate) {
		pushHistory();
		setSelectedShelter(facility);
		setScreen("navigate");
	}

	function openCommunication() {
		if (screen !== "communication") setCommReturn(screen);
		setPhrasePickerOpen(false);
		setScreen("communication");
	}

	function goToNode(flowId: FlowId, nodeId: string) {
		const node = getNode(FLOWS[flowId], nodeId);
		if (node.type === "communication") {
			openCommunication();
			return;
		}
		setFlowPos({ flowId, nodeId });
		setCardIndex(0);
		// 避难确认卡和导航卡有专属画面，其余节点在 flow 画面内渲染。
		if (node.type === "evacuation") setScreen("shelter");
		else if (node.type === "navigation") {
			setScreen("facilities");
			searchShelters();
		} else setScreen("flow");
	}

	// 前进到流程节点：沟通卡有自己的返回逻辑，其余目标先压栈再跳转。
	function advanceTo(flowId: FlowId, nodeId: string) {
		if (getNode(FLOWS[flowId], nodeId).type !== "communication") pushHistory();
		goToNode(flowId, nodeId);
	}

	function startFlow(flowId: FlowId) {
		setFlowAnswers({});
		advanceTo(flowId, FLOWS[flowId].start);
	}

	function selectEvent(value: string) {
		setEventChoice(value);
		if (value !== "earthquake") {
			notify(t(lang, "本版本先提供地震流程"));
			return;
		}
		startFlow("earthquake");
	}

	function selectDaily(value: string) {
		setDailyChoice(value);
		if (value !== "gas") {
			notify(t(lang, "该应急类型即将开放"));
			return;
		}
		startFlow("gas-leak");
	}

	const flowNode = flowPos ? getNode(FLOWS[flowPos.flowId], flowPos.nodeId) : null;

	function answerQuestion(value: string) {
		if (!flowPos || flowNode?.type !== "question") return;
		setFlowAnswers((prev) => ({ ...prev, [flowNode.id]: value }));
		advanceTo(flowPos.flowId, resolveOption(flowNode, value));
	}

	function nextActionCard() {
		if (!flowPos || flowNode?.type !== "action") return;
		if (cardIndex + 1 < flowNode.cards.length) setCardIndex((i) => i + 1);
		else advanceTo(flowPos.flowId, flowNode.next);
	}

	// 行动卡内部先逐张回退，退到第一张后再返回上一个画面。
	function backFromAction() {
		if (cardIndex > 0) setCardIndex((i) => i - 1);
		else goBack();
	}

	function answerEvacuation(need: boolean) {
		if (flowPos) {
			const node = getNode(FLOWS[flowPos.flowId], flowPos.nodeId);
			if (node.type === "evacuation") {
				advanceTo(flowPos.flowId, need ? node.yesNext : node.noNext);
				return;
			}
		}
		if (need) {
			pushHistory();
			setScreen("facilities");
			searchShelters();
		} else {
			openCommunication();
		}
	}

	// 选择后保持列表展开：立即收起会让整页高度骤变、滚动位置跳回顶部，看起来像重新加载了页面。
	function pickPhrase(index: number) {
		if ("speechSynthesis" in window) speechSynthesis.cancel();
		setPhrase(index);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function speak() {
		if ("speechSynthesis" in window) {
			speechSynthesis.cancel();
			const u = new SpeechSynthesisUtterance(PHRASES[phrase][2]);
			u.lang = "ja-JP";
			speechSynthesis.speak(u);
		} else {
			notify(t(lang, "当前浏览器不支持朗读"));
		}
	}

	const headerSub =
		screen === "communication" ? HEADER_LABELS[lang].communication : HEADER_LABELS[lang].default;

	const screenClass = (name: ScreenName) => `screen${screen === name ? " active" : ""}`;

	const progress = (on: number) => (
		<div className="progress">
			{[0, 1, 2, 3, 4].map((i) => (
				<span key={i} className={i < on ? "on" : undefined} />
			))}
		</div>
	);

	const actionCard = flowNode?.type === "action" ? flowNode.cards[cardIndex] : null;

	// 许可后在语言页之外的页面顶部常驻显示获取到的位置。
	const showLocBar =
		locPermission === "granted" && !["welcome", "communication", "offline"].includes(screen);
	const locText = `${t(lang, "东京市新宿区")} · ${t(lang, "仅本次使用")}`;

	return (
		<div className="app-shell">
			<div className="phone">
				<header className="topbar">
					<div className="brand">
						<div className="logo">
							<img src="/logo.png" alt="Tokyo Safe First" />
						</div>
						<div>
							<div className="brand-text">Tokyo Safe First</div>
							<div className="brand-sub">{headerSub}</div>
						</div>
					</div>
					<div className="top-actions">
						<button
							type="button"
							className="icon-btn"
							aria-label={t(lang, "沟通卡")}
							onClick={openCommunication}
						>
							<img className="icon-btn-img" src="/communication-card.png" alt="" />
						</button>
						<select
							className="lang-select"
							aria-label={welcome.prompt}
							value={lang}
							onChange={(event) => switchLanguage(event.target.value as DemoLang)}
						>
							<option value="zh">中文</option>
							<option value="en">English</option>
							<option value="ja">日本語</option>
						</select>
					</div>
				</header>
				<main className="main">
					{showLocBar && <div className="loc-bar">📍 {locText}</div>}
					<section className={screenClass("welcome")} data-screen="welcome">
						<div className="hero-mark">🛡️</div>
						<div className="eyebrow">{welcome.sub}</div>
						<h1 className="hero-title">{welcome.title}</h1>
						<p className="lead">{welcome.lead}</p>
						<h3>{welcome.prompt}</h3>
						<div className="grid2">
							{(
								[
									["zh", "中文"],
									["en", "English"],
									["ja", "日本語"],
									["more", "更多语言"],
								] as const
							).map(([value, label]) => (
								<button
									key={value}
									type="button"
									className={`lang-btn${lang === value ? " active" : ""}`}
									onClick={() => pickLanguage(value)}
								>
									{value === "more" ? t(lang, label) : label}
								</button>
							))}
						</div>
						<div className="panel tint">
							<div className="panel-row">
								<div className="panel-icon">📍</div>
								<div>
									<div className="panel-title">{welcome.locTitle}</div>
									<div className="panel-copy">{welcome.locCopy}</div>
								</div>
							</div>
						</div>
						<div className="actions">
							<div className="privacy">{welcome.privacy}</div>
						</div>
					</section>

					<section className={screenClass("mode")} data-screen="mode">
						<div className="eyebrow">{t(lang, "选择模式")}</div>
						<h1 className="hero-title">{t(lang, "你现在需要哪种帮助？")}</h1>
						<p className="lead">{t(lang, "每次只完成一个判断，系统再给出下一步。")}</p>
						<div className="mode-card">
							<div className="mode-head">
								<div className="mode-icon">🚨</div>
								<div>
									<div className="mode-title">{t(lang, "灾害模式")}</div>
									<div className="mode-copy">
										{t(lang, "地震、火灾、水灾发生后，不知道下一步怎么办。")}
									</div>
								</div>
							</div>
							<button type="button" className="btn danger" onClick={() => setScreen("event")}>
								{t(lang, "进入灾害模式")}
							</button>
						</div>
						<div className="mode-card">
							<div className="mode-head">
								<div className="mode-icon">🩹</div>
								<div>
									<div className="mode-title">{t(lang, "日常应急")}</div>
									<div className="mode-copy">
										{t(lang, "煤气泄漏、迷路、身体不适等紧急状况。")}
									</div>
								</div>
							</div>
							<button type="button" className="btn ghost" onClick={() => setScreen("daily")}>
								{t(lang, "进入日常应急")}
							</button>
						</div>
						<div className="safe-banner">
							⚠️ {t(lang, "若仍处于建筑倒塌、火灾或其他直接危险中，请立即撤离并听从现场人员指示。")}
						</div>
						<div className="actions">
							<button type="button" className="btn ghost" onClick={() => setScreen("welcome")}>
								{t(lang, "返回上一步")}
							</button>
						</div>
					</section>

					<section className={screenClass("event")} data-screen="event">
						{progress(1)}
						<div className="eyebrow">{t(lang, "事象确认")}</div>
						<h1 className="hero-title">{t(lang, "现在发生了什么？")}</h1>
						<p className="lead">{t(lang, "系统根据公开信息推荐“地震”，请你确认。")}</p>
						<div className="choice-list">
							{(
								[
									["earthquake", "🌎", "地震", "系统推荐 · 请确认"],
									["fire", "🔥", "火灾", undefined],
									["flood", "🌊", "水灾 / 海啸", undefined],
									["unknown", "❓", "不确定", undefined],
								] as const
							).map(([value, icon, label, meta]) => (
								<button
									key={value}
									type="button"
									className={`choice${eventChoice === value ? " selected" : ""}`}
									onClick={() => selectEvent(value)}
								>
									<span className="choice-icon">{icon}</span>
									<span>
										{t(lang, label)}
										{meta !== undefined && <div className="choice-meta">{t(lang, meta)}</div>}
									</span>
								</button>
							))}
						</div>
						<div className="actions">
							<button type="button" className="btn secondary" onClick={() => setScreen("mode")}>
								{t(lang, "返回")}
							</button>
						</div>
					</section>

					<section className={screenClass("daily")} data-screen="daily">
						{progress(1)}
						<div className="eyebrow">{t(lang, "事象确认")}</div>
						<h1 className="hero-title">{t(lang, "现在发生了什么？")}</h1>
						<p className="lead">{t(lang, "请手动选择日常应急类型。")}</p>
						<div className="choice-list">
							{(
								[
									["gas", "🔥", "煤气泄漏"],
									["lost", "🧭", "迷路"],
									["unwell", "🤒", "身体不适"],
								] as const
							).map(([value, icon, label]) => (
								<button
									key={value}
									type="button"
									className={`choice${dailyChoice === value ? " selected" : ""}`}
									onClick={() => selectDaily(value)}
								>
									<span className="choice-icon">{icon}</span>
									<span>{t(lang, label)}</span>
								</button>
							))}
						</div>
						<div className="actions">
							<button type="button" className="btn secondary" onClick={() => setScreen("mode")}>
								{t(lang, "返回")}
							</button>
						</div>
					</section>

					<section className={screenClass("flow")} data-screen="flow">
						{flowNode?.type === "question" && (
							<>
								{progress(2)}
								<div className="question-count">{t(lang, "状态确认")}</div>
								<h1 className="hero-title">{t(lang, flowNode.title)}</h1>
								<p className="lead">{t(lang, flowNode.lead)}</p>
								<div className="choice-list">
									{flowNode.options.map((option) => (
										<button
											key={option.value}
											type="button"
											className={`choice${flowAnswers[flowNode.id] === option.value ? " selected" : ""}`}
											onClick={() => answerQuestion(option.value)}
										>
											<span className="choice-icon">{option.icon}</span>
											<span>{t(lang, option.label)}</span>
										</button>
									))}
								</div>
								<div className="actions">
									<button
										type="button"
										className="btn secondary"
										onClick={openCommunication}
									>
										{t(lang, "我做不到 / 需要帮助")}
									</button>
									<button type="button" className="btn ghost" onClick={goBack}>
										{t(lang, "返回上一步")}
									</button>
								</div>
							</>
						)}
						{flowNode?.type === "action" && actionCard && (
							<>
								{progress(3)}
								<div className="question-count">
									{`${t(lang, "行动")} ${cardIndex + 1} / ${flowNode.cards.length}`}
								</div>
								<div className={`action-hero${actionCard.kind === "dont" ? " dont" : ""}`}>
									<div className="eyebrow">
										{t(lang, actionCard.kind === "dont" ? "现在不要做" : "现在应该做")}
									</div>
									<h2>{t(lang, actionCard.title)}</h2>
									<p className="lead">{t(lang, actionCard.detail)}</p>
								</div>
								<div className="panel green">
									<div className="panel-row">
										<div className="panel-icon">👂</div>
										<div>
											<div className="panel-title">{t(lang, "同时确认现场信息")}</div>
											<div className="panel-copy">
												{t(lang, "听从工作人员、现场广播和官方发布。")}
											</div>
										</div>
									</div>
								</div>
								<div className="source">
									{t(lang, "规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断")}
								</div>
								<div className="actions">
									<button type="button" className="btn primary" onClick={nextActionCard}>
										{t(lang, "下一步")}
									</button>
									<button
										type="button"
										className="btn secondary"
										onClick={openCommunication}
									>
										{t(lang, "我做不到")}
									</button>
									<button type="button" className="btn ghost" onClick={backFromAction}>
										{t(lang, "返回上一步")}
									</button>
								</div>
							</>
						)}
					</section>

					<section className={screenClass("shelter")} data-screen="shelter">
						{progress(4)}
						<div className="hero-mark">🏫</div>
						<h1 className="hero-title">{t(lang, "是否需要避难？")}</h1>
						<p className="lead">{t(lang, "系统会根据本次位置和官方开放数据列出候选设施。")}</p>
						<div className="panel amber">
							<div className="panel-title">{t(lang, "重要说明")}</div>
							<div className="panel-copy">
								{t(lang, "“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。")}
							</div>
						</div>
						<div className="panel">
							<div className="panel-row">
								<div className="panel-icon">📍</div>
								<div>
									<div className="panel-title">{t(lang, "当前位置")}</div>
									<div className="panel-copy">
										{locPermission === "granted" ? locText : t(lang, "東京都新宿区附近 · 仅本次使用")}
									</div>
								</div>
							</div>
						</div>
						<div className="actions">
							<button
								type="button"
								className="btn primary"
								onClick={() => answerEvacuation(true)}
							>
								{t(lang, "需要，导航到避难地点")}
							</button>
							<button
								type="button"
								className="btn secondary"
								onClick={() => answerEvacuation(false)}
							>
								{t(lang, "暂时不需要")}
							</button>
							<button type="button" className="btn ghost" onClick={goBack}>
								{t(lang, "返回上一步")}
							</button>
						</div>
					</section>

					<section className={screenClass("facilities")} data-screen="facilities">
						{progress(5)}
						<h1 className="hero-title">{t(lang, "附近设施候选")}</h1>
						{shelters.isPending && (
							<div className="panel">
								<div className="panel-row">
									<div className="panel-icon">⏳</div>
									<div>
										<div className="panel-title">{t(lang, "正在获取附近的避难所候选…")}</div>
										<div className="panel-copy">
											{t(lang, "根据本次位置查询官方开放数据快照。")}
										</div>
									</div>
								</div>
							</div>
						)}
						{shelters.isError && (
							<>
								<div className="panel amber">
									<div className="panel-title">{t(lang, "当前服务受限")}</div>
									<div className="panel-copy">
										{t(lang, "无法获取最新设施数据。请确认现场广播、工作人员和官方信息。")}
									</div>
								</div>
								<div className="actions">
									<button type="button" className="btn primary" onClick={searchShelters}>
										{t(lang, "重新尝试")}
									</button>
								</div>
							</>
						)}
						{shelters.isSuccess && (
							<ShelterCandidateList
								response={shelters.data}
								lang={lang}
								onNavigate={navigateToShelter}
							/>
						)}
						<div className="actions">
							<button
								type="button"
								className="btn secondary"
								onClick={openCommunication}
							>
								{t(lang, "打开沟通卡")}
							</button>
							<button type="button" className="btn ghost" onClick={goBack}>
								{t(lang, "返回上一步")}
							</button>
						</div>
					</section>

					<section className={screenClass("navigate")} data-screen="navigate">
						{progress(5)}
						<h1 className="hero-title">{t(lang, "前往设施的路线参考")}</h1>
						{selectedShelter && (
							<>
								<div className="panel">
									<div className="panel-row">
										<div className="panel-icon">📍</div>
										<div>
											<div className="panel-title">{t(lang, "当前位置")}</div>
											<div className="panel-copy">{locText}</div>
										</div>
									</div>
									<div className="panel-row">
										<div className="panel-icon">🏫</div>
										<div>
											<div
												className="panel-title"
												lang={shelterDisplayName(lang, selectedShelter).lang}
											>
												{shelterDisplayName(lang, selectedShelter).text}
											</div>
											<div className="panel-copy">
												<span lang={shelterDisplayAddress(lang, selectedShelter).lang}>
													{shelterDisplayAddress(lang, selectedShelter).text}
												</span>
												{` · ${formatApproxDistance(lang, selectedShelter.distanceMeters)}`}
											</div>
										</div>
									</div>
								</div>
								<ShelterRouteMap
									origin={DEMO_ORIGIN}
									destination={selectedShelter}
									lang={lang}
								/>
								<div className="panel amber">
									<div className="panel-title">{t(lang, "重要说明")}</div>
									<div className="panel-copy">
										{t(lang, "路线仅供参考，是否可通行需要现场确认。无法确认设施当前是否开放。")}
									</div>
								</div>
							</>
						)}
						<div className="actions">
							<button
								type="button"
								className="btn secondary"
								onClick={openCommunication}
							>
								{t(lang, "打开沟通卡")}
							</button>
							<button type="button" className="btn ghost" onClick={goBack}>
								{t(lang, "返回上一步")}
							</button>
						</div>
					</section>

					<section className={screenClass("communication")} data-screen="communication">
						<div className="comm">
							<div className="eyebrow">{t(lang, "请把屏幕给对方看")}</div>
							<div className="jp-card">
								{PHRASES[phrase][0].map((line, i) => (
									<Fragment key={line}>
										{i > 0 && <br />}
										{line}
									</Fragment>
								))}
							</div>
							<div className="cn-text">{PHRASE_TEXT[lang][phrase]}</div>
							<div className="actions">
								<button type="button" className="btn primary" onClick={speak}>
									{t(lang, "🔊 朗读日语")}
								</button>
								<button
									type="button"
									className="btn secondary"
									onClick={() => setPhrasePickerOpen((prev) => !prev)}
								>
									{t(lang, phrasePickerOpen ? "收起列表" : "切换其他沟通卡")}
								</button>
								{phrasePickerOpen && (
									<div className="phrase-list">
										<div className="phrase-list-title">{t(lang, "选择要展示的沟通卡")}</div>
										{PHRASE_TEXT[lang].map((text, i) => (
											<button
												key={text}
												type="button"
												className={`phrase-option${i === phrase ? " selected" : ""}`}
												onClick={() => pickPhrase(i)}
											>
												<span className="phrase-native">{text}</span>
												{lang !== "ja" && <span className="phrase-jp">{PHRASES[i][2]}</span>}
											</button>
										))}
									</div>
								)}
								<div className="comm-nav">
									<button
										type="button"
										className="btn ghost"
										onClick={() => setScreen(commReturn)}
									>
										{t(lang, "返回")}
									</button>
									<button type="button" className="btn ghost" onClick={() => setScreen("mode")}>
										{t(lang, "返回主页")}
									</button>
								</div>
								<div className="privacy trust">
									{t(lang, "固定审核翻译 · 核心功能不依赖 AI")}
								</div>
							</div>
						</div>
					</section>

					<section className={screenClass("offline")} data-screen="offline">
						<div className="offline">
							<div>
								<div className="offline-icon">📡</div>
								<h2>{t(lang, "当前服务受限")}</h2>
								<p className="lead">
									{t(lang, "无法获取最新设施数据。请确认现场广播、工作人员和官方信息。")}
								</p>
								<button type="button" className="btn primary" onClick={() => setScreen("mode")}>
									{t(lang, "重新尝试")}
								</button>
							</div>
						</div>
					</section>
				</main>
				{locDialogOpen && (
					<div className="modal-backdrop">
						<div
							className="modal"
							role="dialog"
							aria-modal="true"
							aria-label={t(lang, "是否允许获取你的实时位置？")}
						>
							<div className="modal-icon">📍</div>
							<h2 className="modal-title">{t(lang, "是否允许获取你的实时位置？")}</h2>
							<p className="modal-copy">
								{t(lang, "用于确认所在区和附近避难设施，仅本次使用，不保存位置历史。")}
							</p>
							<div className="modal-actions">
								<button
									type="button"
									className="btn primary"
									onClick={() => decideLocation(true)}
								>
									{t(lang, "允许获取位置")}
								</button>
								<button
									type="button"
									className="btn secondary"
									onClick={() => decideLocation(false)}
								>
									{t(lang, "不允许")}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
			<div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
		</div>
	);
}
