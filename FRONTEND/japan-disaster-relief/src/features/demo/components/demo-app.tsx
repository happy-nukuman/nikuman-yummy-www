"use client";

import { useEffect, useState } from "react";
import type { DemoShelterCandidate } from "@nikuman-yummy/shared";
import type { GeoPoint } from "@/lib/geo/calculate-distance";
import type { DisasterInfoItem } from "@/features/demo/disaster-info";
import { useDemoShelters } from "@/features/shelter/hooks/use-demo-shelters";
import { type DemoLang, t, WELCOME_COPY } from "@/features/demo/i18n";
import { DEMO_SYNC_STATUS, DEMO_TEAM_NAME } from "@/features/demo/demo-config";
import { FLOWS, type FlowId, getNode, resolveOption } from "@/features/demo/flows";
import { useToast } from "@/features/demo/hooks/use-toast";
import { TopBar } from "@/features/demo/components/top-bar";
import { AppFooter } from "@/features/demo/components/app-footer";
import { LocationBar } from "@/features/demo/components/location-bar";
import { LocationDialog } from "@/features/demo/components/location-dialog";
import { SupportModal } from "@/features/demo/components/support-modal";
import { WelcomeScreen } from "@/features/demo/components/screens/welcome-screen";
import {
	type EventChoice,
	EventChoiceScreen,
} from "@/features/demo/components/screens/event-choice-screen";
import { FlowScreen } from "@/features/demo/components/screens/flow-screen";
import { EvacuationScreen } from "@/features/demo/components/screens/evacuation-screen";
import { FacilitiesScreen } from "@/features/demo/components/screens/facilities-screen";
import { NavigateScreen } from "@/features/demo/components/screens/navigate-screen";
import { SosScreen } from "@/features/demo/components/screens/sos-screen";
import { EmergencyScreen } from "@/features/demo/components/screens/emergency-screen";
import { DisasterListScreen } from "@/features/demo/components/screens/disaster-list-screen";
import { DisasterDetailScreen } from "@/features/demo/components/screens/disaster-detail-screen";
import { CommunicationScreen } from "@/features/demo/components/screens/communication-screen";
import "../demo.css";

type ScreenName =
	| "welcome"
	| "event"
	| "daily"
	| "flow"
	| "shelter"
	| "facilities"
	| "navigate"
	| "sos"
	| "emergency"
	| "communication"
	| "disasters"
	| "disaster-detail";

// Demo 固定“现在地”（东京都新宿区西新宿六丁目8番付近）：demo 版不调用浏览器定位，
// 保证候选列表始终命中新宿区数据快照。
const DEMO_ORIGIN: GeoPoint = { latitude: 35.6931, longitude: 139.6887 };

const DEMO_SHELTER_LIMIT = 5;

const EVENT_CHOICES: readonly EventChoice[] = [
	{ value: "earthquake", icon: "quake", label: "地震", meta: "系统推荐 · 请确认" },
	{ value: "fire", icon: "flame", label: "火灾", available: false },
	{ value: "flood", icon: "wave", label: "水灾 / 海啸", available: false },
	{ value: "typhoon", icon: "typhoon", label: "台风", available: false },
	{ value: "unknown", icon: "help", label: "不确定", available: false },
];

const DAILY_CHOICES: readonly EventChoice[] = [
	{ value: "gas", icon: "flame", label: "煤气泄漏" },
	{ value: "lost", icon: "compass", label: "迷路", available: false },
	{ value: "unwell", icon: "thermometer", label: "身体不适", available: false },
	{ value: "lost-item", icon: "wallet", label: "丢失财物 / 护照", available: false },
	{ value: "traffic-accident", icon: "car", label: "交通事故", available: false },
	{ value: "heatstroke", icon: "sun", label: "中暑", available: false },
	{ value: "elevator", icon: "elevator", label: "被困电梯", available: false },
];

const DOCUMENT_LANG: Record<DemoLang, string> = { zh: "zh-CN", en: "en", ja: "ja" };

interface FlowPosition {
	flowId: FlowId;
	nodeId: string;
}

type LocationIntent =
	| { type: "facilities" }
	| { type: "disasters" }
	| { type: "flow-navigation"; flowId: FlowId; nodeId: string };

// 选项点选后立即跳转，跳转前把当前画面压栈，供“返回上一步”恢复。
// 一并快照作答记录：返回到问题页时该题恢复为未作答，避免旧答案继续高亮。
interface NavSnapshot {
	screen: ScreenName;
	flowPos: FlowPosition | null;
	cardIndex: number;
	flowAnswers: Record<string, string>;
}

interface DemoAppProps {
	// 服务端根据 Accept-Language 解析出的初始语言，保证首帧渲染即为用户语言。
	initialLang: DemoLang;
}

export function DemoApp({ initialLang }: DemoAppProps) {
	const [screen, setScreen] = useState<ScreenName>("welcome");
	const [lang, setLang] = useState<DemoLang>(initialLang);
	// 位置许可：demo 版允许后固定使用东京都厅演示坐标（DEMO_ORIGIN）。
	const [locPermission, setLocPermission] = useState<"unknown" | "granted" | "denied">("unknown");
	// 用户在候选列表中选择的避难设施（路线页的目的地）。
	const [selectedShelter, setSelectedShelter] = useState<DemoShelterCandidate | null>(null);
	// 灾害信息列表中选中的那条信息（详情页的数据源）。
	const [selectedDisaster, setSelectedDisaster] = useState<DisasterInfoItem | null>(null);
	const shelters = useDemoShelters();
	// 仅在用户主动进入位置功能时询问；首页与灾害判断主流程不预先请求位置。
	const [locDialogOpen, setLocDialogOpen] = useState(false);
	const [supportOpen, setSupportOpen] = useState(false);
	const [locationIntent, setLocationIntent] = useState<LocationIntent | null>(null);
	// 事象确认卡：灾害模式自动识别推荐地震并高亮，日常应急为手动选择。
	const [eventChoice, setEventChoice] = useState("earthquake");
	const [dailyChoice, setDailyChoice] = useState<string | null>(null);
	const [flowPos, setFlowPos] = useState<FlowPosition | null>(null);
	const [flowAnswers, setFlowAnswers] = useState<Record<string, string>>({});
	const [cardIndex, setCardIndex] = useState(0);
	const [history, setHistory] = useState<NavSnapshot[]>([]);
	const { toast, notify } = useToast();

	useEffect(() => {
		document.documentElement.lang = DOCUMENT_LANG[lang];
	}, [lang]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [screen]);

	function pushHistory() {
		setHistory((prev) => [...prev, { screen, flowPos, cardIndex, flowAnswers }]);
	}

	function goBack() {
		const prev = history[history.length - 1];
		if (!prev) return;
		setHistory(history.slice(0, -1));
		setFlowPos(prev.flowPos);
		setCardIndex(prev.cardIndex);
		setFlowAnswers(prev.flowAnswers);
		setScreen(prev.screen);
	}

	// 顶栏下拉框：随时切换语言，停留在当前页面，不重走首页流程。
	function switchLanguage(next: DemoLang) {
		if (next === lang) return;
		setLang(next);
		notify(WELCOME_COPY[next].toast);
	}

	// 首页两张模式卡分别直达对应的事象确认页，不再经过“选择模式”中间页。
	function enterDisasterMode() {
		pushHistory();
		setScreen("event");
	}

	function enterDailyMode() {
		pushHistory();
		setScreen("daily");
	}

	// 首页「紧急求助」：直达 119 / 110 求助画面，不经过定位询问。
	function openEmergency() {
		pushHistory();
		setScreen("emergency");
	}

	function showFacilities() {
		pushHistory();
		setScreen("facilities");
		searchShelters();
	}

	function showDisasterInfo() {
		pushHistory();
		setScreen("disasters");
	}

	function runLocationIntent(intent: LocationIntent) {
		if (intent.type === "facilities") showFacilities();
		else if (intent.type === "disasters") showDisasterInfo();
		else advanceTo(intent.flowId, intent.nodeId);
	}

	function requestLocationFor(intent: LocationIntent) {
		if (locPermission === "granted") {
			runLocationIntent(intent);
			return;
		}
		setLocationIntent(intent);
		setLocDialogOpen(true);
	}

	// 只有这两个首页磁贴及流程内的“导航到避难地点”会触发位置询问。
	function openFacilities() {
		requestLocationFor({ type: "facilities" });
	}

	function openDisasterInfo() {
		requestLocationFor({ type: "disasters" });
	}

	// 列表中点击某条信息：进入该条灾害信息的详情页。
	function openDisasterDetail(item: DisasterInfoItem) {
		pushHistory();
		setSelectedDisaster(item);
		setScreen("disaster-detail");
	}

	// 同意后执行刚才请求的位置功能；拒绝则留在原画面，不影响其他流程。
	function decideLocation(allow: boolean) {
		setLocPermission(allow ? "granted" : "denied");
		setLocDialogOpen(false);
		const intent = locationIntent;
		setLocationIntent(null);
		if (allow) {
			notify(t(lang, "已获取当前位置：东京都新宿区西新宿六丁目8番"));
			if (intent) runLocationIntent(intent);
		} else {
			notify(t(lang, "未获得定位权限，位置相关功能不可用"));
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

	// 只负责切到沟通卡画面，压栈由调用方决定。
	function showCommunication() {
		setScreen("communication");
	}

	// 顶栏沟通卡按钮：已经在沟通卡上时不做任何事，避免把自己压进历史栈。
	function openCommunication() {
		if (screen === "communication") return;
		pushHistory();
		showCommunication();
	}

	function goToNode(flowId: FlowId, nodeId: string) {
		const node = getNode(FLOWS[flowId], nodeId);
		// 沟通卡不更新 flowPos：返回后 SOS / 导航页的前进判断仍指向原节点。
		if (node.type === "communication") {
			showCommunication();
			return;
		}
		setFlowPos({ flowId, nodeId });
		setCardIndex(0);
		// 避难确认卡、导航卡和 SOS 卡有专属画面，其余节点在 flow 画面内渲染。
		if (node.type === "evacuation") setScreen("shelter");
		else if (node.type === "navigation") {
			setScreen("facilities");
			searchShelters();
		} else if (node.type === "sos") setScreen("sos");
		else setScreen("flow");
	}

	// 前进到流程节点：先把当前画面压栈，再跳转（沟通卡同样走历史栈）。
	function advanceTo(flowId: FlowId, nodeId: string) {
		pushHistory();
		goToNode(flowId, nodeId);
	}

	function startFlow(flowId: FlowId) {
		// 重新开始一条流程：清空作答、卡片位置和历史栈。
		setFlowAnswers({});
		setCardIndex(0);
		setHistory([]);
		setFlowPos(null);
		advanceTo(flowId, FLOWS[flowId].start);
	}

	// 沟通卡、紧急求助页的“返回主页”和顶栏 logo：清空状态回到首页（欢迎页）。
	function goWelcome() {
		setFlowPos(null);
		setFlowAnswers({});
		setCardIndex(0);
		setHistory([]);
		setSelectedShelter(null);
		setSelectedDisaster(null);
		setScreen("welcome");
	}

	// 事象确认页（new-ui ③）：点选只更新选中态，「确认并继续」才前进。
	function confirmEvent(value: string) {
		if (value !== "earthquake") {
			notify(t(lang, "本版本先提供地震流程"));
			return;
		}
		startFlow("earthquake");
	}

	function confirmDaily(value: string) {
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
		if (!flowPos || flowNode?.type !== "evacuation") return;
		const nodeId = need ? flowNode.yesNext : flowNode.noNext;
		const nextNode = getNode(FLOWS[flowPos.flowId], nodeId);
		if (need && nextNode.type === "navigation") {
			requestLocationFor({ type: "flow-navigation", flowId: flowPos.flowId, nodeId });
			return;
		}
		advanceTo(flowPos.flowId, nodeId);
	}

	// 路线页“打开沟通卡”：沿导航节点的 next 前进，让流程真正走完。
	// 从首页磁贴进入时没有流程上下文，直接打开沟通卡。
	function proceedFromNavigate() {
		if (flowPos && flowNode?.type === "navigation") advanceTo(flowPos.flowId, flowNode.next);
		else openCommunication();
	}

	// SOS 页“打开翻译沟通”：沿 SOS 节点的既有 next 前进。
	function proceedFromSos() {
		if (flowPos && flowNode?.type === "sos") advanceTo(flowPos.flowId, flowNode.next);
	}

	// 许可后在沟通卡之外的页面（含首页、紧急求助）顶部常驻显示获取到的位置。
	const showLocBar = locPermission === "granted" && screen !== "communication";
	const locText = `${t(lang, "东京都新宿区西新宿六丁目8番")} · ${t(lang, "本次演示")} · ${t(lang, "仅本次使用")}`;

	return (
		<div className="app-shell">
			<div className="phone">
				<TopBar
					lang={lang}
					onHome={goWelcome}
					onOpenCommunication={openCommunication}
					onSwitchLanguage={switchLanguage}
				/>
				<main className="main has-footer">
					{showLocBar && <LocationBar label={locText} />}
					<WelcomeScreen
						active={screen === "welcome"}
						lang={lang}
						locPermission={locPermission}
						onEnterDisaster={enterDisasterMode}
						onEnterDaily={enterDailyMode}
						onEmergency={openEmergency}
						onOpenFacilities={openFacilities}
						onOpenDisasterInfo={openDisasterInfo}
					/>
					<EventChoiceScreen
						active={screen === "event"}
						name="event"
						lang={lang}
						title="根据公开信息，可能发生了地震"
						lead="以下是系统根据公开灾害信息的建议，请结合现场情况确认。"
						showDataSources
						choices={EVENT_CHOICES}
						selected={eventChoice}
						onSelect={setEventChoice}
						onConfirm={confirmEvent}
					/>
					<EventChoiceScreen
						active={screen === "daily"}
						name="daily"
						lang={lang}
						lead="请手动选择日常应急类型。"
						choices={DAILY_CHOICES}
						selected={dailyChoice}
						onSelect={setDailyChoice}
						onConfirm={confirmDaily}
					/>
					<FlowScreen
						active={screen === "flow"}
						lang={lang}
						node={flowNode}
						answers={flowAnswers}
						cardIndex={cardIndex}
						onAnswer={answerQuestion}
						onNextActionCard={nextActionCard}
						onEmergency={openEmergency}
						onOpenCommunication={openCommunication}
					/>
					<EvacuationScreen
						active={screen === "shelter"}
						lang={lang}
						hasLocation={locPermission === "granted"}
						onAnswer={answerEvacuation}
					/>
					<FacilitiesScreen
						active={screen === "facilities"}
						lang={lang}
						shelters={shelters}
						onRetry={searchShelters}
						onNavigate={navigateToShelter}
					/>
					<NavigateScreen
						active={screen === "navigate"}
						lang={lang}
						origin={DEMO_ORIGIN}
						shelter={selectedShelter}
						onOpenCommunication={proceedFromNavigate}
					/>
					<SosScreen
						active={screen === "sos"}
						lang={lang}
						onShowCommunication={proceedFromSos}
					/>
					<EmergencyScreen active={screen === "emergency"} lang={lang} />
					<DisasterListScreen
						active={screen === "disasters"}
						lang={lang}
						onOpenDetail={openDisasterDetail}
					/>
					<DisasterDetailScreen
						active={screen === "disaster-detail"}
						lang={lang}
						item={selectedDisaster}
					/>
					<CommunicationScreen
						active={screen === "communication"}
						lang={lang}
						onToast={notify}
					/>
				</main>
				<AppFooter
					lang={lang}
					isHome={screen === "welcome"}
					demoSyncStatus={DEMO_SYNC_STATUS}
					teamName={DEMO_TEAM_NAME}
					onBack={screen === "flow" && flowNode?.type === "action" ? backFromAction : goBack}
					onHome={goWelcome}
					onSupport={() => setSupportOpen(true)}
				/>
				{locDialogOpen && <LocationDialog lang={lang} onDecide={decideLocation} />}
				{supportOpen && <SupportModal lang={lang} onClose={() => setSupportOpen(false)} />}
			</div>
			<div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
		</div>
	);
}
