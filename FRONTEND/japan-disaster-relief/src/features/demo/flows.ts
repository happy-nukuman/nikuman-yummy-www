// Flow definitions ported from DOCS/卡片・灾害定义.xlsm.
// Sheet 灾害_地震流程  -> EARTHQUAKE_FLOW
// Sheet 日常应急_煤气泄露 -> GAS_LEAK_FLOW
//
// Card types (sheet 流程和卡片定义): 事象确认卡 (event confirmation, rendered by
// the event/daily screens), 状态确认卡 (question nodes), 动作卡 (action nodes),
// 避难确认卡 (evacuation nodes), 导航卡 (navigation nodes), SOS卡 (sos nodes,
// 被困时的 119 求助画面), 沟通卡 (communication).
//
// 两张流程图（xlsm 的 灾害_地震流程 / 日常应急_煤气泄露 sheet）已随本文件同步
// 重新生成：v1.1 · 2026-08-03。改流程时请连同 xlsm 一起更新。

export type FlowId = "earthquake" | "gas-leak";

export interface FlowOption {
	value: string;
	/** Chinese source label; translated through the demo i18n table. */
	label: string;
	/** Icon key resolved by OptionGlyph (app-icons.tsx); unknown keys render as raw text. */
	icon: string;
	next: string;
}

export interface QuestionNode {
	type: "question";
	id: string;
	title: string;
	lead: string;
	options: FlowOption[];
	/** Progress-bar step; defaults to the question step when omitted. */
	stage?: number;
}

export interface FlowActionCard {
	/** "do" renders as a next-step instruction, "dont" as a prohibition. */
	kind: "do" | "dont";
	title: string;
	detail: string;
	/** Phone number rendered as a tel: call button on this card. */
	tel?: string;
}

export interface ActionNode {
	type: "action";
	id: string;
	cards: FlowActionCard[];
	next: string;
	/** Label of the next button on the last card; defaults to 下一步. */
	nextLabel?: string;
	/** Progress-bar step; defaults to the action step when omitted. */
	stage?: number;
}

export interface EvacuationNode {
	type: "evacuation";
	id: string;
	yesNext: string;
	noNext: string;
}

export interface NavigationNode {
	type: "navigation";
	id: string;
	next: string;
}

/** 被困/无法移动时的紧急求助画面（拨打 119 + 等待救援指引）。 */
export interface SosNode {
	type: "sos";
	id: string;
	next: string;
}

export interface CommunicationNode {
	type: "communication";
	id: string;
}

export type FlowNode =
	| QuestionNode
	| ActionNode
	| EvacuationNode
	| NavigationNode
	| SosNode
	| CommunicationNode;

export interface Flow {
	id: FlowId;
	/** Chinese source name of the disaster/emergency. */
	name: string;
	start: string;
	nodes: Record<string, FlowNode>;
}

export const EARTHQUAKE_FLOW: Flow = {
	id: "earthquake",
	name: "地震",
	start: "q-shaking",
	nodes: {
		"q-shaking": {
			type: "question",
			id: "q-shaking",
			title: "摇晃停止了吗？",
			lead: "先确认身边的晃动情况，再进行下一步。",
			options: [
				{ value: "stopped", label: "停止了", icon: "check", next: "q-injury" },
				{ value: "shaking", label: "还在摇晃", icon: "warning", next: "act-protect" },
			],
		},
		// 摇晃中的防护卡结束后直接进入受伤确认，不回到 q-shaking（避免流程成环）。
		"act-protect": {
			type: "action",
			id: "act-protect",
			cards: [
				{
					kind: "do",
					title: "低下身体，保护头颈",
					detail: "就近进入较安全空间，远离玻璃、高柜、吊物和围墙。等待摇晃停止。",
				},
			],
			next: "q-injury",
			nextLabel: "摇晃停止了，继续",
			stage: 2,
		},
		"q-injury": {
			type: "question",
			id: "q-injury",
			title: "你现在是否受伤？",
			lead: "根据受伤情况，系统会给出不同的行动指引。",
			options: [
				{ value: "none", label: "没有受伤", icon: "check", next: "q-location" },
				{ value: "minor", label: "受轻伤，可以移动", icon: "bandage", next: "q-location" },
				{
					value: "trapped",
					label: "被困住或无法移动（被压 / 重伤）",
					icon: "sos",
					next: "act-trapped",
				},
			],
		},
		"act-trapped": {
			type: "action",
			id: "act-trapped",
			cards: [
				{ kind: "dont", title: "不要强行挣脱", detail: "避免二次受伤。" },
				{
					kind: "do",
					title: "用敲击代替呼喊",
					detail: "有规律地敲击墙壁或管道。节省体力，避免吸入粉尘。",
				},
			],
			next: "sos",
		},
		// 被困时身边通常没有可以看屏幕的人，先进 SOS 画面拨打 119，再按需展示沟通卡。
		sos: { type: "sos", id: "sos", next: "comm" },
		"q-location": {
			type: "question",
			id: "q-location",
			title: "你现在在哪里？",
			lead: "选择最接近的环境，用于匹配固定行动规则。",
			options: [
				{ value: "home", label: "自宅", icon: "home", next: "act-home" },
				{
					value: "building",
					label: "公司、学校、商场等建筑内",
					icon: "building",
					next: "q-staff",
				},
				{ value: "other", label: "其他", icon: "help", next: "evac" },
			],
		},
		"act-home": {
			type: "action",
			id: "act-home",
			cards: [
				{ kind: "do", title: "穿上鞋保护双脚", detail: "避免踩到玻璃和碎片。" },
				{
					kind: "do",
					title: "不取行李，不乘电梯",
					detail: "沿安全出口向开阔处移动，途中不要点火、不开关电器。",
				},
			],
			next: "evac",
		},
		"q-staff": {
			type: "question",
			id: "q-staff",
			title: "是否寻找到工作人员？",
			lead: "优先听从现场工作人员的指示。",
			options: [
				{ value: "yes", label: "找到了", icon: "check", next: "act-follow" },
				{ value: "no", label: "没有找到", icon: "no", next: "act-building" },
			],
		},
		"act-follow": {
			type: "action",
			id: "act-follow",
			cards: [
				{
					kind: "do",
					title: "听从工作人员指示",
					detail: "按现场引导行动，不要擅自返回建筑内。",
				},
			],
			next: "evac",
		},
		"act-building": {
			type: "action",
			id: "act-building",
			cards: [
				{
					kind: "do",
					title: "从安全出口离开",
					detail: "不取行李，不乘电梯，向开阔处移动。",
				},
			],
			next: "evac",
		},
		evac: { type: "evacuation", id: "evac", yesNext: "nav", noNext: "act-standby" },
		// 暂不避难时给出待命指引，进度停在第 4 段，避免进度条回退。
		"act-standby": {
			type: "action",
			id: "act-standby",
			cards: [
				{ kind: "do", title: "警惕余震", detail: "穿好鞋，远离高柜、玻璃窗和悬挂物。" },
				{ kind: "do", title: "关注官方信息", detail: "留意 NHK、气象厅和自治体的官方发布。" },
			],
			next: "comm",
			stage: 4,
		},
		nav: { type: "navigation", id: "nav", next: "comm" },
		comm: { type: "communication", id: "comm" },
	},
};

export const GAS_LEAK_FLOW: Flow = {
	id: "gas-leak",
	name: "煤气泄漏",
	start: "act-gas",
	nodes: {
		"act-gas": {
			type: "action",
			id: "act-gas",
			cards: [
				{ kind: "do", title: "立刻停止使用燃气", detail: "关火并停止使用所有燃气器具。" },
				{
					kind: "dont",
					title: "不要使用明火和电器开关",
					detail: "不点火、不抽烟；不开关灯和排风扇，避免产生火花。",
				},
				{
					kind: "do",
					title: "开窗通风，关闭燃气总阀",
					detail: "如能安全操作，打开门窗通风，并关闭燃气总阀。",
				},
			],
			next: "q-symptom",
			stage: 2,
		},
		"q-symptom": {
			type: "question",
			id: "q-symptom",
			title: "是否有人感到头晕、恶心或不适？",
			lead: "吸入燃气可能引起不适，请先确认现场所有人的状态。",
			options: [
				{ value: "yes", label: "有人不适", icon: "nausea", next: "act-gas-med" },
				{ value: "no", label: "没有人不适", icon: "check", next: "act-gas-report" },
			],
			stage: 3,
		},
		"act-gas-med": {
			type: "action",
			id: "act-gas-med",
			cards: [
				{ kind: "do", title: "转移到空气新鲜处", detail: "搀扶不适者到室外或通风良好处休息。" },
				{
					kind: "do",
					title: "拨打 119",
					detail: "说明燃气泄漏情况和身体不适症状。",
					tel: "119",
				},
			],
			next: "comm",
			stage: 4,
		},
		"act-gas-report": {
			type: "action",
			id: "act-gas-report",
			cards: [
				{
					kind: "do",
					title: "联系燃气公司抢修电话",
					detail: "到室外安全处再拨打；抢修人员确认安全前，不要返回使用火和电器。",
				},
			],
			next: "comm",
			stage: 4,
		},
		// 日常应急类不经过避难所环节，行动卡结束后直接进入沟通卡。
		comm: { type: "communication", id: "comm" },
	},
};

export const FLOWS: Record<FlowId, Flow> = {
	earthquake: EARTHQUAKE_FLOW,
	"gas-leak": GAS_LEAK_FLOW,
};

export function getNode(flow: Flow, nodeId: string): FlowNode {
	const node = flow.nodes[nodeId];
	if (!node) throw new Error(`Flow "${flow.id}" has no node "${nodeId}"`);
	return node;
}

export function resolveOption(node: QuestionNode, value: string): string {
	const option = node.options.find((o) => o.value === value);
	if (!option) throw new Error(`Question "${node.id}" has no option "${value}"`);
	return option.next;
}

/** Every node id a node can transition to. */
function nextIds(node: FlowNode): string[] {
	switch (node.type) {
		case "question":
			return node.options.map((o) => o.next);
		case "action":
			return [node.next];
		case "evacuation":
			return [node.yesNext, node.noNext];
		case "navigation":
			return [node.next];
		case "sos":
			return [node.next];
		case "communication":
			return [];
	}
}

/**
 * 迭代式 DFS 三色标记（未访问 / grey 在当前路径上 / black 已完成）：
 * 指向 grey 节点的边就是回边，说明流程里存在环。
 */
function detectCycles(flow: Flow): string[] {
	const errors: string[] = [];
	const state = new Map<string, "grey" | "black">();

	for (const rootId of Object.keys(flow.nodes)) {
		if (state.has(rootId)) continue;
		state.set(rootId, "grey");
		// 栈帧记录当前节点和已经处理到第几个后继。
		const stack: { id: string; index: number }[] = [{ id: rootId, index: 0 }];
		while (stack.length > 0) {
			const frame = stack[stack.length - 1];
			const node = flow.nodes[frame.id];
			const next = node ? nextIds(node) : [];
			if (frame.index >= next.length) {
				state.set(frame.id, "black");
				stack.pop();
				continue;
			}
			const childId = next[frame.index];
			frame.index += 1;
			// 缺失节点由引用检查单独报错，这里跳过即可。
			if (!flow.nodes[childId]) continue;
			const childState = state.get(childId);
			if (childState === "grey") {
				errors.push(`cycle detected involving node "${childId}"`);
			} else if (childState === undefined) {
				state.set(childId, "grey");
				stack.push({ id: childId, index: 0 });
			}
		}
	}

	return errors;
}

/**
 * Structural validation used by tests: every referenced node exists, every
 * node is reachable from the start, the graph has no cycles, and every path
 * can reach the communication card (the terminal card of both flows in the
 * spec).
 */
export function validateFlow(flow: Flow): string[] {
	const errors: string[] = [];
	if (!flow.nodes[flow.start]) errors.push(`start node "${flow.start}" does not exist`);

	for (const [id, node] of Object.entries(flow.nodes)) {
		if (node.id !== id) errors.push(`node key "${id}" does not match node.id "${node.id}"`);
		for (const next of nextIds(node)) {
			if (!flow.nodes[next]) errors.push(`node "${id}" points to missing node "${next}"`);
		}
	}

	const reachable = new Set<string>();
	const queue = [flow.start];
	while (queue.length > 0) {
		const id = queue.pop();
		if (id === undefined || reachable.has(id) || !flow.nodes[id]) continue;
		reachable.add(id);
		queue.push(...nextIds(flow.nodes[id]));
	}
	for (const id of Object.keys(flow.nodes)) {
		if (!reachable.has(id)) errors.push(`node "${id}" is unreachable from start`);
	}

	errors.push(...detectCycles(flow));

	const hasTerminal = Object.values(flow.nodes).some(
		(node) => node.type === "communication" && reachable.has(node.id),
	);
	if (!hasTerminal) errors.push("no reachable communication card");

	return errors;
}
