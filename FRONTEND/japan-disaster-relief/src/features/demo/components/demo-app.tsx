"use client";

import { useEffect, useState } from "react";
import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import type { GeoPoint } from "@/lib/geo/calculate-distance";
import { useDemoShelters } from "@/features/shelter/hooks/use-demo-shelters";
import { type DemoLang, HEADER_LABELS, PHRASES, t, WELCOME_COPY } from "@/features/demo/i18n";
import { FLOWS, type FlowId, getNode, resolveOption } from "@/features/demo/flows";
import { useToast } from "@/features/demo/hooks/use-toast";
import { TopBar } from "@/features/demo/components/top-bar";
import { LocationDialog } from "@/features/demo/components/location-dialog";
import { WelcomeScreen } from "@/features/demo/components/screens/welcome-screen";
import { ModeScreen } from "@/features/demo/components/screens/mode-screen";
import {
	type EventChoice,
	EventChoiceScreen,
} from "@/features/demo/components/screens/event-choice-screen";
import { FlowScreen } from "@/features/demo/components/screens/flow-screen";
import { EvacuationScreen } from "@/features/demo/components/screens/evacuation-screen";
import { FacilitiesScreen } from "@/features/demo/components/screens/facilities-screen";
import { NavigateScreen } from "@/features/demo/components/screens/navigate-screen";
import { CommunicationScreen } from "@/features/demo/components/screens/communication-screen";
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
	| "communication";

// Demo 固定“现在地”（东京都厅附近）：demo 版不调用浏览器定位，
// 保证候选列表始终命中新宿区数据快照。
const DEMO_ORIGIN: GeoPoint = { latitude: 35.6896342, longitude: 139.6917418 };

const DEMO_SHELTER_LIMIT = 5;

const EVENT_CHOICES: readonly EventChoice[] = [
	{ value: "earthquake", icon: "🌎", label: "地震", meta: "系统推荐 · 请确认" },
	{ value: "fire", icon: "🔥", label: "火灾" },
	{ value: "flood", icon: "🌊", label: "水灾 / 海啸" },
	{ value: "unknown", icon: "❓", label: "不确定" },
];

const DAILY_CHOICES: readonly EventChoice[] = [
	{ value: "gas", icon: "🔥", label: "煤气泄漏" },
	{ value: "lost", icon: "🧭", label: "迷路" },
	{ value: "unwell", icon: "🤒", label: "身体不适" },
];

const DOCUMENT_LANG: Record<DemoLang, string> = { zh: "zh-CN", en: "en", ja: "ja" };

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
	const { toast, notify } = useToast();

	useEffect(() => {
		document.documentElement.lang = DOCUMENT_LANG[lang];
	}, [lang]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [screen]);

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
			const utterance = new SpeechSynthesisUtterance(PHRASES[phrase][2]);
			utterance.lang = "ja-JP";
			speechSynthesis.speak(utterance);
		} else {
			notify(t(lang, "当前浏览器不支持朗读"));
		}
	}

	const headerSub =
		screen === "communication" ? HEADER_LABELS[lang].communication : HEADER_LABELS[lang].default;

	// 许可后在语言页之外的页面顶部常驻显示获取到的位置。
	const showLocBar = locPermission === "granted" && !["welcome", "communication"].includes(screen);
	const locText = `${t(lang, "东京市新宿区")} · ${t(lang, "仅本次使用")}`;

	return (
		<div className="app-shell">
			<div className="phone">
				<TopBar
					lang={lang}
					subtitle={headerSub}
					onOpenCommunication={openCommunication}
					onSwitchLanguage={switchLanguage}
				/>
				<main className="main">
					{showLocBar && <div className="loc-bar">📍 {locText}</div>}
					<WelcomeScreen active={screen === "welcome"} lang={lang} onPickLanguage={pickLanguage} />
					<ModeScreen
						active={screen === "mode"}
						lang={lang}
						onEnterDisaster={() => setScreen("event")}
						onEnterDaily={() => setScreen("daily")}
						onBack={() => setScreen("welcome")}
					/>
					<EventChoiceScreen
						active={screen === "event"}
						name="event"
						lang={lang}
						lead="系统根据公开信息推荐“地震”，请你确认。"
						choices={EVENT_CHOICES}
						selected={eventChoice}
						onSelect={selectEvent}
						onBack={() => setScreen("mode")}
					/>
					<EventChoiceScreen
						active={screen === "daily"}
						name="daily"
						lang={lang}
						lead="请手动选择日常应急类型。"
						choices={DAILY_CHOICES}
						selected={dailyChoice}
						onSelect={selectDaily}
						onBack={() => setScreen("mode")}
					/>
					<FlowScreen
						active={screen === "flow"}
						lang={lang}
						node={flowNode}
						answers={flowAnswers}
						cardIndex={cardIndex}
						onAnswer={answerQuestion}
						onNextActionCard={nextActionCard}
						onOpenCommunication={openCommunication}
						onBack={goBack}
						onBackFromAction={backFromAction}
					/>
					<EvacuationScreen
						active={screen === "shelter"}
						lang={lang}
						locationLabel={
							locPermission === "granted" ? locText : t(lang, "東京都新宿区附近 · 仅本次使用")
						}
						onAnswer={answerEvacuation}
						onBack={goBack}
					/>
					<FacilitiesScreen
						active={screen === "facilities"}
						lang={lang}
						shelters={shelters}
						onRetry={searchShelters}
						onNavigate={navigateToShelter}
						onBack={goBack}
					/>
					<NavigateScreen
						active={screen === "navigate"}
						lang={lang}
						origin={DEMO_ORIGIN}
						shelter={selectedShelter}
						locationLabel={locText}
						onBack={goBack}
					/>
					<CommunicationScreen
						active={screen === "communication"}
						lang={lang}
						phrase={phrase}
						pickerOpen={phrasePickerOpen}
						onSpeak={speak}
						onTogglePicker={() => setPhrasePickerOpen((prev) => !prev)}
						onPickPhrase={pickPhrase}
						onReturn={() => setScreen(commReturn)}
						onHome={() => setScreen("mode")}
					/>
				</main>
				{locDialogOpen && <LocationDialog lang={lang} onDecide={decideLocation} />}
			</div>
			<div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
		</div>
	);
}
