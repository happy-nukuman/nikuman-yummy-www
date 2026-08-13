import { describe, expect, it } from "vitest";
import {
	EARTHQUAKE_FLOW,
	FLOWS,
	type Flow,
	type FlowNode,
	GAS_LEAK_FLOW,
	getNode,
	resolveOption,
	validateFlow,
} from "./flows";
import { DISASTER_INFO_ITEMS } from "./disaster-info";
import { FULL_I18N, PHRASES, PHRASE_TEXT } from "./i18n";

function question(flow: Flow, id: string) {
	const node = getNode(flow, id);
	if (node.type !== "question") throw new Error(`${id} is not a question node`);
	return node;
}

function action(flow: Flow, id: string) {
	const node = getNode(flow, id);
	if (node.type !== "action") throw new Error(`${id} is not an action node`);
	return node;
}

/** Same edges as the private nextIds() in flows.ts, for the graph-wide checks. */
function nextIdsOf(node: FlowNode): string[] {
	switch (node.type) {
		case "question":
			return node.options.map((o) => o.next);
		case "action":
		case "navigation":
		case "sos":
			return [node.next];
		case "evacuation":
			return [node.yesNext, node.noNext];
		case "communication":
			return [];
	}
}

// 一个节点占多少页：行动卡按卡片张数，导航卡是“设施候选 + 路线”两屏，其余各一屏。
function viewCost(node: FlowNode): number {
	if (node.type === "action") return node.cards.length;
	if (node.type === "navigation") return 2;
	return 1;
}

/** DAG 上 start 到终端节点的最长加权路径 = 最坏分支要翻多少页。 */
function worstPathViews(flow: Flow): number {
	const memo = new Map<string, number>();
	function longest(id: string): number {
		const cached = memo.get(id);
		if (cached !== undefined) return cached;
		const node = getNode(flow, id);
		const nexts = nextIdsOf(node);
		const total = viewCost(node) + (nexts.length === 0 ? 0 : Math.max(...nexts.map(longest)));
		memo.set(id, total);
		return total;
	}
	return longest(flow.start);
}

// PRD 约束：任何一条分支从头走到沟通卡不超过 10 页。
const MAX_VIEWS_PER_BRANCH = 10;

describe("flow structure", () => {
	it.each(Object.values(FLOWS))("flow $id is structurally valid", (flow) => {
		expect(validateFlow(flow)).toEqual([]);
	});

	it.each(Object.values(FLOWS))(
		`flow $id needs at most ${MAX_VIEWS_PER_BRANCH} views on its worst branch`,
		(flow) => {
			expect(worstPathViews(flow)).toBeLessThanOrEqual(MAX_VIEWS_PER_BRANCH);
		},
	);

	it("getNode throws on unknown node ids", () => {
		expect(() => getNode(EARTHQUAKE_FLOW, "nope")).toThrow(/no node "nope"/);
	});

	it("resolveOption throws on unknown option values", () => {
		const q = question(EARTHQUAKE_FLOW, "q-shaking");
		expect(() => resolveOption(q, "nope")).toThrow(/no option "nope"/);
	});

	it("validateFlow reports cycles", () => {
		const cyclic: Flow = {
			id: "earthquake",
			name: "合成环",
			start: "a",
			nodes: {
				a: {
					type: "action",
					id: "a",
					cards: [{ kind: "do", title: "A", detail: "A" }],
					next: "b",
				},
				b: {
					type: "question",
					id: "b",
					title: "B",
					lead: "B",
					options: [
						{ value: "loop", label: "回到 A", icon: "↩️", next: "a" },
						{ value: "done", label: "结束", icon: "✅", next: "comm" },
					],
				},
				comm: { type: "communication", id: "comm" },
			},
		};
		expect(validateFlow(cyclic)).toContain('cycle detected involving node "a"');
	});
});

describe("earthquake flow (DOCS/卡片・灾害定义.xlsm 灾害_地震流程)", () => {
	const flow = EARTHQUAKE_FLOW;

	it("starts with the shaking check", () => {
		expect(flow.start).toBe("q-shaking");
		expect(question(flow, flow.start).title).toBe("摇晃停止了吗？");
	});

	it("still shaking -> protect action card -> injury check (no cycle back to the shaking check)", () => {
		const q = question(flow, "q-shaking");
		expect(resolveOption(q, "shaking")).toBe("act-protect");
		const protect = action(flow, "act-protect");
		expect(protect.cards).toHaveLength(1);
		expect(protect.cards[0].title).toBe("低下身体，保护头颈");
		expect(protect.next).toBe("q-injury");
		expect(protect.nextLabel).toBe("摇晃停止了，继续");
	});

	it("shaking stopped -> injury check", () => {
		expect(resolveOption(question(flow, "q-shaking"), "stopped")).toBe("q-injury");
	});

	it("trapped -> 2 action cards -> SOS card -> communication card", () => {
		expect(resolveOption(question(flow, "q-injury"), "trapped")).toBe("act-trapped");
		const trapped = action(flow, "act-trapped");
		expect(trapped.cards.map((c) => c.title)).toEqual(["不要强行挣脱", "用敲击代替呼喊"]);
		expect(trapped.cards.map((c) => c.kind)).toEqual(["dont", "do"]);
		expect(trapped.next).toBe("sos");
		const sos = getNode(flow, "sos");
		expect(sos.type).toBe("sos");
		if (sos.type !== "sos") throw new Error("sos is not an sos node");
		expect(getNode(flow, sos.next).type).toBe("communication");
	});

	it("uninjured or lightly injured -> location check", () => {
		const q = question(flow, "q-injury");
		expect(resolveOption(q, "none")).toBe("q-location");
		expect(resolveOption(q, "minor")).toBe("q-location");
	});

	it("at home -> 2 action cards, then the evacuation check", () => {
		expect(resolveOption(question(flow, "q-location"), "home")).toBe("act-home");
		const home = action(flow, "act-home");
		expect(home.cards.map((c) => c.title)).toEqual(["穿上鞋保护双脚", "不取行李，不乘电梯"]);
		expect(home.next).toBe("evac");
	});

	it("in an office/school/mall -> staff check; staff found -> follow-instructions card -> evacuation check", () => {
		expect(resolveOption(question(flow, "q-location"), "building")).toBe("q-staff");
		expect(resolveOption(question(flow, "q-staff"), "yes")).toBe("act-follow");
		const follow = action(flow, "act-follow");
		expect(follow.cards.map((c) => c.title)).toEqual(["听从工作人员指示"]);
		expect(follow.next).toBe("evac");
	});

	it("no staff -> a single exit card (no 119 card) -> evacuation check", () => {
		expect(resolveOption(question(flow, "q-staff"), "no")).toBe("act-building");
		const building = action(flow, "act-building");
		expect(building.cards.map((c) => c.title)).toEqual(["从安全出口离开"]);
		expect(building.cards.some((c) => c.title.includes("119"))).toBe(false);
		expect(building.next).toBe("evac");
	});

	it("elsewhere -> straight to the evacuation check", () => {
		expect(resolveOption(question(flow, "q-location"), "other")).toBe("evac");
	});

	it("evacuation check: yes -> navigation -> communication; no -> standby cards -> communication", () => {
		const evac = getNode(flow, "evac");
		if (evac.type !== "evacuation") throw new Error("evac is not an evacuation node");
		const nav = getNode(flow, evac.yesNext);
		if (nav.type !== "navigation") throw new Error("yesNext is not a navigation node");
		expect(getNode(flow, nav.next).type).toBe("communication");

		expect(evac.noNext).toBe("act-standby");
		const standby = action(flow, "act-standby");
		expect(standby.cards.map((c) => c.title)).toEqual(["警惕余震", "关注官方信息"]);
		expect(getNode(flow, standby.next).type).toBe("communication");
	});
});

describe("gas leak flow (DOCS/卡片・灾害定义.xlsm 日常应急_煤气泄露)", () => {
	const flow = GAS_LEAK_FLOW;

	it("starts with the three gas action cards, then the symptom check", () => {
		const start = action(flow, flow.start);
		expect(start.cards.map((c) => c.title)).toEqual([
			"立刻停止使用燃气",
			"不要使用明火和电器开关",
			"开窗通风，关闭燃气总阀",
		]);
		expect(start.next).toBe("q-symptom");
	});

	it("someone feels unwell -> fresh air + a 119 call card -> communication card", () => {
		expect(resolveOption(question(flow, "q-symptom"), "yes")).toBe("act-gas-med");
		const med = action(flow, "act-gas-med");
		expect(med.cards.map((c) => c.title)).toEqual(["转移到空气新鲜处", "拨打 119"]);
		expect(med.cards[1].tel).toBe("119");
		expect(getNode(flow, med.next).type).toBe("communication");
	});

	it("nobody feels unwell -> call the gas company -> communication card", () => {
		expect(resolveOption(question(flow, "q-symptom"), "no")).toBe("act-gas-report");
		const report = action(flow, "act-gas-report");
		expect(report.cards.map((c) => c.title)).toEqual(["联系燃气公司抢修电话"]);
		expect(getNode(flow, report.next).type).toBe("communication");
	});

	it("action cards lead straight to the communication card (no shelter step)", () => {
		expect(
			Object.values(flow.nodes).filter(
				(node) => node.type === "evacuation" || node.type === "navigation",
			),
		).toEqual([]);
	});
});

// 沟通卡以外的固定文案不在 flow 数据里，手动列出来一起做覆盖检查。
const STATIC_SCREEN_KEYS = [
	"紧急求助",
	"如手机有信号，立即拨打 119",
	"等待救援时",
	"保存体力，保持手机电量。有规律地敲击墙壁或管道，让救援人员发现你。",
	"有人靠近时，展示沟通卡",
	"到达后或需要求助时，向身边的人展示。",
	"拨打 119",
	// 首页（new-ui ①）
	"查看现在应该做什么",
	"帮助您做出正确的下一步判断",
	"灾害・急病・事故・危险情况时使用",
	"附近避难设施",
	"查看最近的避难设施",
	"灾害信息",
	"公开灾害信息",
	"需要位置权限",
	"无需注册 · 不收集个人信息",
	"位置信息仅用于本次查询，不会被保存。",
	"未获得定位权限",
	"附近避难设施和灾害信息暂不可用，其他功能仍可使用。",
	"未获得定位权限，位置相关功能不可用",
	"已获取当前位置：东京都新宿区西新宿六丁目8番",
	"东京都新宿区西新宿六丁目8番",
	"选择导航到避难地点时，将询问是否使用演示位置。",
	// 灾害信息列表 + 详情
	"当前位置附近的灾害信息",
	"以下为当前位置附近可参考的公开防灾信息，点击查看详情。",
	"以下为当前位置附近可参考的公开防灾信息",
	"新宿区当前没有生效中的气象警报・注意报",
	"详细信息",
	"建议行动",
	"发表机关",
	// 事象确认页数据来源卡（new-ui ③）
	"根据公开信息，可能发生了地震",
	"以下是系统根据公开灾害信息的建议，请结合现场情况确认。",
	"数据来源",
	"日本气象厅、东京都防灾信息、内阁府防灾信息 等",
	"Demo 数据快照",
	"数据时点",
	"Demo 模拟同步",
	"流程进度",
	"水煎包",
	"Support",
	"联系我们",
	"Tokyo Safe First 是面向东京外国居民和游客的灾害行动 Demo。",
	"如发生真实紧急情况：",
	"消防 / 救护",
	"警察",
	"本 Demo 信息仅供辅助参考，请同时确认现场人员及官方发布。",
	"数据源更新",
	"非实时信息，请以官方发布为准",
	"确认并继续",
	"准备中",
	// 紧急求助（new-ui ⑦）
	"如果遇到危险，请立即求助",
	"火灾・救护・急病",
	"拨打 110",
	"警察・犯罪・纠纷・危险人物",
	"确保自身安全后再拨打电话。尽量在安全地点使用。",
];

describe("flow i18n coverage", () => {
	const strings = new Set<string>(STATIC_SCREEN_KEYS);
	// 灾害信息 demo 数据的所有文案同样以中文为键，一并检查覆盖。
	for (const item of DISASTER_INFO_ITEMS) {
		strings.add(item.category);
		strings.add(item.title);
		strings.add(item.issuedAt);
		strings.add(item.source);
		strings.add(item.summary);
		strings.add(item.lead);
		for (const [label, value] of item.facts) {
			strings.add(label);
			strings.add(value);
		}
		for (const advice of item.advice) strings.add(advice);
	}
	for (const flow of Object.values(FLOWS)) {
		for (const node of Object.values(flow.nodes)) {
			if (node.type === "question") {
				strings.add(node.title);
				strings.add(node.lead);
				for (const option of node.options) strings.add(option.label);
			} else if (node.type === "action") {
				if (node.nextLabel) strings.add(node.nextLabel);
				for (const card of node.cards) {
					strings.add(card.title);
					strings.add(card.detail);
				}
			}
		}
	}

	it.each([...strings].map((s) => [s]))("%s has en and ja translations", (s) => {
		expect(FULL_I18N.en[s], `missing en translation for "${s}"`).toBeDefined();
		expect(FULL_I18N.ja[s], `missing ja translation for "${s}"`).toBeDefined();
	});
});

describe("communication card phrases", () => {
	it("has a caption in every language for every phrase", () => {
		expect(PHRASE_TEXT.zh).toHaveLength(PHRASES.length);
		expect(PHRASE_TEXT.en).toHaveLength(PHRASES.length);
		expect(PHRASE_TEXT.ja).toHaveLength(PHRASES.length);
	});
});
