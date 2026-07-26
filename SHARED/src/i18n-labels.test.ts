import { describe, expect, it } from "vitest";
import { ENUM_LABELS, I18N_LABELS_VERSION } from "./i18n-labels";

describe("i18n labels", () => {
	it("uses a versioned i18n- identifier", () => {
		expect(I18N_LABELS_VERSION).toMatch(/^i18n-/);
	});

	it("provides non-empty ja, en and zhHans for every label entry", () => {
		for (const [groupName, group] of Object.entries(ENUM_LABELS)) {
			for (const [key, label] of Object.entries(group)) {
				expect(label.ja, `${groupName}.${key}.ja`).not.toBe("");
				expect(label.en, `${groupName}.${key}.en`).not.toBe("");
				expect(label.zhHans, `${groupName}.${key}.zhHans`).not.toBe("");
			}
		}
	});
});
