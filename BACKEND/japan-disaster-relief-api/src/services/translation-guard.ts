// 提示词注入防御：输入净化 + 输出合理性校验。
// 主通道 m2m100 是纯 NMT 模型、不执行指令；这里的防御主要覆盖
// LLM fallback（Gemini）以及通过隐形字符走私指令的输入。

// 对翻译无正当用途、常被用来隐藏注入指令的字符：
// - C0/C1 控制符（保留 \t \n \r）
// - 零宽字符与 BOM（U+200B-200F、U+2060-2064、U+FEFF）
// - 双向文本控制符（U+202A-202E、U+2066-2069，可视觉伪装内容）
// - Unicode Tags 区（U+E0000-E007F，"隐形指令"走私的标准载体）
const INJECTION_CARRIER_CHARACTERS =
	// eslint-disable-next-line no-control-regex
	/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2060-\u2064\uFEFF\u202A-\u202E\u2066-\u2069]|[\u{E0000}-\u{E007F}]/gu;

/** 剥离隐形注入载体字符；保留换行等正常排版。 */
export function sanitizeTranslationText(text: string): string {
	return text.replace(INJECTION_CARRIER_CHARACTERS, "").trim();
}

// 正常翻译的长度不会远超原文（ja/en/zh 互译的膨胀率远小于此）；
// 超出视为模型在译文之外生成了额外内容（被注入带跑的典型特征）。
const MAX_OUTPUT_TO_INPUT_RATIO = 4;
const OUTPUT_SLACK_CHARACTERS = 80;

/** 译文长度是否在原文的合理范围内。 */
export function isPlausibleTranslationLength(inputText: string, outputText: string): boolean {
	return (
		[...outputText].length <=
		[...inputText].length * MAX_OUTPUT_TO_INPUT_RATIO + OUTPUT_SLACK_CHARACTERS
	);
}
