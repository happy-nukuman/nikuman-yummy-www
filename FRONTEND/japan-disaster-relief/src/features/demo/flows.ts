// Flow definitions ported from DOCS/卡片・灾害定义.xlsm.
// Sheet 灾害_地震流程  -> EARTHQUAKE_FLOW
// Sheet 日常应急_煤气泄露 -> GAS_LEAK_FLOW
//
// Card types (sheet 流程和卡片定义): 事象确认卡 (event confirmation, rendered by
// the event/daily screens), 状态确认卡 (question nodes), 动作卡 (action nodes),
// 避难确认卡 (evacuation nodes), 导航卡 (navigation nodes), 沟通卡 (communication).

export type FlowId = "earthquake" | "gas-leak";

export interface FlowOption {
	value: string;
	/** Chinese source label; translated through the demo i18n table. */
	label: string;
	icon: string;
	next: string;
}

export interface QuestionNode {
	type: "question";
	id: string;
	title: string;
	lead: string;
	options: FlowOption[];
}

export interface FlowActionCard {
	/** "do" renders as a next-step instruction, "dont" as a prohibition. */
	kind: "do" | "dont";
	title: string;
	detail: string;
}

export interface ActionNode {
	type: "action";
	id: string;
	cards: FlowActionCard[];
	next: string;
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

export interface CommunicationNode {
	type: "communication";
	id: string;
}

export type FlowNode =
	| QuestionNode
	| ActionNode
	| EvacuationNode
	| NavigationNode
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
				{ value: "stopped", label: "停止了", icon: "✅", next: "q-injury" },
				{ value: "shaking", label: "还在摇晃", icon: "⚠️", next: "act-protect" },
			],
		},
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
			next: "q-shaking",
		},
		"q-injury": {
			type: "question",
			id: "q-injury",
			title: "你现在是否受伤？",
			lead: "根据受伤情况，系统会给出不同的行动指引。",
			options: [
				{ value: "none", label: "没有受伤", icon: "✅", next: "q-location" },
				{ value: "minor", label: "受到轻伤，不影响移动", icon: "🩹", next: "q-location" },
				{ value: "trapped", label: "被建筑物压住", icon: "🆘", next: "act-trapped" },
			],
		},
		"act-trapped": {
			type: "action",
			id: "act-trapped",
			cards: [
				{ kind: "dont", title: "不要强行挣脱", detail: "避免二次受伤。" },
				{ kind: "do", title: "大声呼救", detail: "或敲击墙壁、管道发出规律声音。" },
				{ kind: "do", title: "如手机有信号，拨打119", detail: "或发送求救信息。" },
				{ kind: "do", title: "等待救援", detail: "节省体力和电量。" },
			],
			next: "comm",
		},
		"q-location": {
			type: "question",
			id: "q-location",
			title: "你现在在哪里？",
			lead: "选择最接近的环境，用于匹配固定行动规则。",
			options: [
				{ value: "home", label: "自宅", icon: "🏠", next: "act-home" },
				{
					value: "building",
					label: "公司、学校、商场等建筑内",
					icon: "🏢",
					next: "q-staff",
				},
				{ value: "other", label: "其他", icon: "❔", next: "evac" },
			],
		},
		"act-home": {
			type: "action",
			id: "act-home",
			cards: [
				{ kind: "do", title: "穿鞋或厚底拖鞋", detail: "避免踩到玻璃和碎片。" },
				{ kind: "do", title: "不取行李，不乘电梯", detail: "沿可见安全出口向开阔处移动。" },
				{ kind: "dont", title: "不点火，不开关电器", detail: "离开该区域后再求助。" },
			],
			next: "evac",
		},
		"q-staff": {
			type: "question",
			id: "q-staff",
			title: "是否寻找到工作人员？",
			lead: "优先听从现场工作人员的指示。",
			options: [
				{ value: "yes", label: "找到了", icon: "✅", next: "evac" },
				{ value: "no", label: "没有找到", icon: "❌", next: "act-building" },
			],
		},
		"act-building": {
			type: "action",
			id: "act-building",
			cards: [
				{ kind: "do", title: "不取行李，不乘电梯", detail: "沿可见安全出口向开阔处移动。" },
				{ kind: "do", title: "如手机有信号，拨打119", detail: "或发送求救信息。" },
			],
			next: "evac",
		},
		evac: { type: "evacuation", id: "evac", yesNext: "nav", noNext: "comm" },
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
				{ kind: "do", title: "立刻停止使用燃气", detail: "别点火、抽烟。" },
				{ kind: "dont", title: "不要开关灯、排风扇", detail: "也不要触碰电器或插头。" },
			],
			next: "evac",
		},
		evac: { type: "evacuation", id: "evac", yesNext: "nav", noNext: "comm" },
		nav: { type: "navigation", id: "nav", next: "comm" },
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
		case "communication":
			return [];
	}
}

/**
 * Structural validation used by tests: every referenced node exists, every
 * node is reachable from the start, and every path can reach the
 * communication card (the terminal card of both flows in the spec).
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

	const hasTerminal = Object.values(flow.nodes).some(
		(node) => node.type === "communication" && reachable.has(node.id),
	);
	if (!hasTerminal) errors.push("no reachable communication card");

	return errors;
}
