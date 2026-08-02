import { describe, expect, it } from "vitest";
import {
	EARTHQUAKE_FLOW,
	FLOWS,
	type Flow,
	GAS_LEAK_FLOW,
	getNode,
	resolveOption,
	validateFlow,
} from "./flows";
import { FULL_I18N } from "./i18n";

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

describe("flow structure", () => {
	it.each(Object.values(FLOWS))("flow $id is structurally valid", (flow) => {
		expect(validateFlow(flow)).toEqual([]);
	});

	it("getNode throws on unknown node ids", () => {
		expect(() => getNode(EARTHQUAKE_FLOW, "nope")).toThrow(/no node "nope"/);
	});

	it("resolveOption throws on unknown option values", () => {
		const q = question(EARTHQUAKE_FLOW, "q-shaking");
		expect(() => resolveOption(q, "nope")).toThrow(/no option "nope"/);
	});
});

describe("earthquake flow (DOCS/卡片・灾害定义.xlsm 灾害_地震流程)", () => {
	const flow = EARTHQUAKE_FLOW;

	it("starts with the shaking check", () => {
		expect(flow.start).toBe("q-shaking");
		expect(question(flow, flow.start).title).toBe("摇晃停止了吗？");
	});

	it("still shaking -> protect action card, then re-ask the shaking check", () => {
		const q = question(flow, "q-shaking");
		expect(resolveOption(q, "shaking")).toBe("act-protect");
		const protect = action(flow, "act-protect");
		expect(protect.cards).toHaveLength(1);
		expect(protect.cards[0].title).toBe("低下身体，保护头颈");
		expect(protect.next).toBe("q-shaking");
	});

	it("shaking stopped -> injury check", () => {
		expect(resolveOption(question(flow, "q-shaking"), "stopped")).toBe("q-injury");
	});

	it("trapped under a building -> 4 rescue action cards ending at the communication card", () => {
		expect(resolveOption(question(flow, "q-injury"), "trapped")).toBe("act-trapped");
		const trapped = action(flow, "act-trapped");
		expect(trapped.cards.map((c) => c.title)).toEqual([
			"不要强行挣脱",
			"大声呼救",
			"如手机有信号，拨打119",
			"等待救援",
		]);
		expect(trapped.cards[0].kind).toBe("dont");
		expect(getNode(flow, trapped.next).type).toBe("communication");
	});

	it("uninjured or lightly injured -> location check", () => {
		const q = question(flow, "q-injury");
		expect(resolveOption(q, "none")).toBe("q-location");
		expect(resolveOption(q, "minor")).toBe("q-location");
	});

	it("at home -> 3 action cards, then the evacuation check", () => {
		expect(resolveOption(question(flow, "q-location"), "home")).toBe("act-home");
		const home = action(flow, "act-home");
		expect(home.cards.map((c) => c.title)).toEqual([
			"穿鞋或厚底拖鞋",
			"不取行李，不乘电梯",
			"不点火，不开关电器",
		]);
		expect(home.next).toBe("evac");
	});

	it("in an office/school/mall -> staff check; no staff -> 2 action cards -> evacuation check", () => {
		expect(resolveOption(question(flow, "q-location"), "building")).toBe("q-staff");
		const staff = question(flow, "q-staff");
		expect(resolveOption(staff, "yes")).toBe("evac");
		expect(resolveOption(staff, "no")).toBe("act-building");
		const building = action(flow, "act-building");
		expect(building.cards.map((c) => c.title)).toEqual([
			"不取行李，不乘电梯",
			"如手机有信号，拨打119",
		]);
		expect(building.next).toBe("evac");
	});

	it("elsewhere -> straight to the evacuation check", () => {
		expect(resolveOption(question(flow, "q-location"), "other")).toBe("evac");
	});

	it("evacuation check: yes -> navigation -> communication; no -> communication", () => {
		const evac = getNode(flow, "evac");
		if (evac.type !== "evacuation") throw new Error("evac is not an evacuation node");
		const nav = getNode(flow, evac.yesNext);
		if (nav.type !== "navigation") throw new Error("yesNext is not a navigation node");
		expect(getNode(flow, nav.next).type).toBe("communication");
		expect(getNode(flow, evac.noNext).type).toBe("communication");
	});
});

describe("gas leak flow (DOCS/卡片・灾害定义.xlsm 日常应急_煤气泄露)", () => {
	const flow = GAS_LEAK_FLOW;

	it("starts with the two gas action cards", () => {
		const start = action(flow, flow.start);
		expect(start.cards.map((c) => c.title)).toEqual([
			"立刻停止使用燃气",
			"不要开关灯、排风扇",
		]);
	});

	it("action cards lead to the evacuation check, then navigation/communication", () => {
		const start = action(flow, flow.start);
		const evac = getNode(flow, start.next);
		if (evac.type !== "evacuation") throw new Error("next is not an evacuation node");
		const nav = getNode(flow, evac.yesNext);
		if (nav.type !== "navigation") throw new Error("yesNext is not a navigation node");
		expect(getNode(flow, nav.next).type).toBe("communication");
		expect(getNode(flow, evac.noNext).type).toBe("communication");
	});
});

describe("flow i18n coverage", () => {
	const strings = new Set<string>();
	for (const flow of Object.values(FLOWS)) {
		for (const node of Object.values(flow.nodes)) {
			if (node.type === "question") {
				strings.add(node.title);
				strings.add(node.lead);
				for (const option of node.options) strings.add(option.label);
			} else if (node.type === "action") {
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
