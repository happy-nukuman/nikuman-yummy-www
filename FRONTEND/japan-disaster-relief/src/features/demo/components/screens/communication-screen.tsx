"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import type { TranslationLanguage } from "@nikuman-yummy/shared";
import { useJapaneseSpeech } from "@/features/demo/hooks/use-japanese-speech";
import { useSpeechRecognition } from "@/features/demo/hooks/use-speech-recognition";
import {
	type DemoLang,
	PHRASES,
	PHRASE_TEXT,
	REPLY_PHRASES,
	replyPhraseTranslation,
	t,
} from "@/features/demo/i18n";
import { postTranslation } from "@/features/translation/api/post-translation";
import { SpeakerIcon, StopIcon } from "@/features/demo/components/app-icons";

// demo 界面语言 → 翻译接口的语言代码（用于默认源语言）。
const APP_LANGUAGE: Record<DemoLang, TranslationLanguage> = {
	zh: "zh-Hans",
	en: "en",
	ja: "ja",
};

interface LanguageOption {
	value: TranslationLanguage;
	/** 语言名称的中文文案键，经 t() 翻译为当前界面语言显示。 */
	label: string;
	/** 对应的 demo 界面语言，用于取该语言的输入区提示文案与固定短句。 */
	demo: DemoLang;
	/** 语音识别的 BCP 47 语言标签。 */
	speech: string;
}

// 可选的源语言 / 目标语言（与翻译接口支持的语言一致）。
const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
	{ value: "zh-Hans", label: "中文", demo: "zh", speech: "zh-CN" },
	{ value: "en", label: "英语", demo: "en", speech: "en-US" },
	{ value: "ja", label: "日语", demo: "ja", speech: "ja-JP" },
];

function languageOption(value: TranslationLanguage): LanguageOption {
	return LANGUAGE_OPTIONS.find((option) => option.value === value) ?? LANGUAGE_OPTIONS[0];
}

/** 默认目标语言：界面语言不是日语时译成日语；日语界面则默认译成英语。 */
function defaultTarget(lang: DemoLang): TranslationLanguage {
	return lang === "ja" ? "en" : "ja";
}

interface ChatMessage {
	id: number;
	sourceLanguage: TranslationLanguage;
	targetLanguage: TranslationLanguage;
	sourceText: string;
	/** 译文；翻译完成前为 null。 */
	translatedText: string | null;
	/** fixed = 固定审核翻译（不走接口）；ai = 调用翻译接口。 */
	kind: "fixed" | "ai";
	status: "loading" | "done" | "error";
}

// 线条风格的左右交换箭头（源语言 ⇄ 目标语言）。
function SwapIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width="20"
			height="20"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M4 8h14" />
			<path d="M15 5l3 3-3 3" />
			<path d="M20 16H6" />
			<path d="M9 13l-3 3 3 3" />
		</svg>
	);
}

// 微信同款线条麦克风图标（胶囊话筒 + 拾音弧 + 支杆）。
function MicIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width="26"
			height="26"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="9" y="3" width="6" height="11" rx="3" />
			<path d="M5 11a7 7 0 0 0 14 0" />
			<line x1="12" y1="18" x2="12" y2="21" />
		</svg>
	);
}

// 微信同款线条键盘图标（语音模式下用于切回文字输入）。
function KeyboardIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width="26"
			height="26"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="6" width="18" height="12" rx="2.5" />
			<line x1="7" y1="10" x2="7" y2="10" />
			<line x1="12" y1="10" x2="12" y2="10" />
			<line x1="17" y1="10" x2="17" y2="10" />
			<line x1="8" y1="14" x2="16" y2="14" />
		</svg>
	);
}

interface CommunicationScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 朗读不可用等提示走全局 toast。 */
	onToast: (message: string) => void;
}

/** 沟通卡：聊天式双向翻译。固定短句直接出卡，自由输入调用翻译接口；
 *  源语言 / 目标语言可自由选择，输入区提示跟随源语言（由说该语言的人操作）。 */
export function CommunicationScreen({
	active,
	lang,
	onToast,
}: CommunicationScreenProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	// 用户手动选择的语言对；记录选择时的界面语言，切换界面语言后回到默认组合。
	const [chosen, setChosen] = useState<{
		forLang: DemoLang;
		source: TranslationLanguage;
		target: TranslationLanguage;
	} | null>(null);
	const source = chosen?.forLang === lang ? chosen.source : APP_LANGUAGE[lang];
	const target = chosen?.forLang === lang ? chosen.target : defaultTarget(lang);
	// true = 语音输入模式：输入框替换为微信式「按住 说话」长条按钮。
	const [voiceMode, setVoiceMode] = useState(false);
	const nextIdRef = useRef(0);
	const listRef = useRef<HTMLDivElement>(null);
	const speech = useJapaneseSpeech();
	const recognition = useSpeechRecognition();

	// 新消息（含翻译完成的状态更新）出现时滚到列表底部。
	useEffect(() => {
		if (!active) return;
		const list = listRef.current;
		if (list) list.scrollTop = list.scrollHeight;
	}, [messages, active]);

	// 离开沟通卡画面时停止朗读和语音输入。
	const stopSpeech = speech.stop;
	const stopRecognition = recognition.stop;
	useEffect(() => {
		if (!active) {
			stopSpeech();
			stopRecognition();
		}
	}, [active, stopSpeech, stopRecognition]);

	function updateMessage(id: number, patch: Partial<ChatMessage>) {
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
	}

	function appendMessage(message: Omit<ChatMessage, "id">) {
		const id = nextIdRef.current++;
		setMessages((prev) => [...prev, { ...message, id }]);
		return id;
	}

	async function translate(
		id: number,
		text: string,
		sourceLanguage: TranslationLanguage,
		targetLanguage: TranslationLanguage,
	) {
		try {
			const response = await postTranslation({ text, sourceLanguage, targetLanguage });
			updateMessage(id, { translatedText: response.translatedText, status: "done" });
		} catch {
			updateMessage(id, { status: "error" });
		}
	}

	const sourceOption = languageOption(source);
	const targetOption = languageOption(target);
	// 输入区文案用源语言显示（操作输入的人说的是源语言）。
	const inputLang = sourceOption.demo;

	// 固定短句：源语言为日语时用「日本人回应外国人」的固定回应，否则用「外国人求助」的沟通卡。
	// 原文和译文都是审核过的固定文案，不经过翻译接口。
	const fixedPhrases: ReadonlyArray<{ text: string; translated: string }> =
		source === "ja"
			? REPLY_PHRASES.map((_, i) => ({
					text: REPLY_PHRASES[i][0],
					translated: replyPhraseTranslation(targetOption.demo, i),
				}))
			: PHRASE_TEXT[sourceOption.demo].map((text, i) => ({
					text,
					translated: target === "ja" ? PHRASES[i][2] : PHRASE_TEXT[targetOption.demo][i],
				}));

	function sendFixedPhrase(index: number) {
		const phrase = fixedPhrases[index];
		appendMessage({
			sourceLanguage: source,
			targetLanguage: target,
			sourceText: phrase.text,
			translatedText: phrase.translated,
			kind: "fixed",
			status: "done",
		});
	}

	function sendInput() {
		const text = input.trim();
		if (text.length === 0) return;
		setInput("");
		const id = appendMessage({
			sourceLanguage: source,
			targetLanguage: target,
			sourceText: text,
			translatedText: null,
			kind: "ai",
			status: "loading",
		});
		void translate(id, text, source, target);
	}

	function retry(message: ChatMessage) {
		updateMessage(message.id, { status: "loading" });
		void translate(message.id, message.sourceText, message.sourceLanguage, message.targetLanguage);
	}

	// 改变语言方向时清空未发送的草稿并停止录音（通常伴随把手机递给对方）。
	function setLanguages(nextSource: TranslationLanguage, nextTarget: TranslationLanguage) {
		setChosen({ forLang: lang, source: nextSource, target: nextTarget });
		recognition.stop();
		setInput("");
	}

	// 选源语言：与目标语言相同则自动交换，保证两侧始终不同。
	function changeSource(next: TranslationLanguage) {
		if (next === source) return;
		setLanguages(next, next === target ? source : target);
	}

	function changeTarget(next: TranslationLanguage) {
		if (next === target) return;
		setLanguages(next === source ? target : source, next);
	}

	function swapLanguages() {
		setLanguages(target, source);
	}

	function speak(messageId: number, japanese: string) {
		if (!speech.toggle(messageId, japanese)) {
			onToast(t(lang, "当前浏览器不支持朗读"));
		}
	}

	// 🎤 / ⌨️：在文字输入和「按住 说话」两种输入方式之间切换（微信同款交互）。
	function toggleVoiceMode() {
		if (voiceMode) recognition.stop();
		setVoiceMode(!voiceMode);
	}

	// 按住开始识别；识别结果实时填入输入框，由用户确认后发送
	//（不自动发送，避免误识别直接出卡）。
	function startHoldToTalk(event: ReactPointerEvent<HTMLButtonElement>) {
		// 手指滑出按钮也能收到 pointerup，避免录音停不下来。
		event.currentTarget.setPointerCapture(event.pointerId);
		// 录音与朗读互斥，否则会把播放的声音识别进去。
		speech.stop();
		const started = recognition.start({
			lang: sourceOption.speech,
			onText: setInput,
			onError: (failure) => {
				if (failure === "not-allowed") onToast(t(lang, "未获得麦克风权限"));
				else if (failure === "other") onToast(t(lang, "语音识别失败，请重试"));
			},
		});
		if (!started) {
			onToast(t(lang, "当前浏览器不支持语音输入"));
			setVoiceMode(false);
		}
	}

	// 松开结束识别并切回文字输入，识别文本留在输入框内等用户确认发送。
	function endHoldToTalk() {
		if (!recognition.listening) return;
		recognition.stop();
		setVoiceMode(false);
	}

	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="communication">
			<div className="comm-chat">
				<div className="eyebrow">{t(lang, "请把屏幕给对方看")}</div>
				<div className="chat-messages" ref={listRef}>
					<div className="bubble jp intro">
						{t(lang, "点选下方常用沟通卡，或输入文字，系统会翻译成对方的语言展示给对方。")}
					</div>
					{messages.map((message) => {
						const translated = message.translatedText;
						// 原文不是界面语言 → 由对方输入，显示为对方气泡。
						const incoming = message.sourceLanguage !== APP_LANGUAGE[lang];
						const sourceHtmlLang = languageOption(message.sourceLanguage).demo;
						const targetHtmlLang = languageOption(message.targetLanguage).demo;
						return (
							<div
								key={message.id}
								className={`bubble msg${incoming ? " incoming" : ""}${
									message.status === "error" ? " error" : ""
								}`}
							>
								<div className="bubble-source" lang={sourceHtmlLang}>
									{message.sourceText}
								</div>
								{message.status === "loading" && (
									<div className="bubble-status">{t(lang, "翻译中…")}</div>
								)}
								{message.status === "error" && (
									<div className="bubble-status">
										{t(lang, "翻译失败")}
										<button type="button" className="bubble-retry" onClick={() => retry(message)}>
											{t(lang, "重新尝试")}
										</button>
									</div>
								)}
								{message.status === "done" && translated !== null && (
									<>
										<div className="bubble-jp-text" lang={targetHtmlLang}>
											{translated}
										</div>
										<div className="bubble-foot">
											<span className="bubble-tag">
												{t(lang, message.kind === "fixed" ? "固定审核翻译" : "AI 翻译 · 仅供参考")}
											</span>
											{message.targetLanguage === "ja" && (
												<button
													type="button"
													className={`bubble-speak${
														speech.speakingId === message.id ? " speaking" : ""
													}`}
													onClick={() => speak(message.id, translated)}
												>
													{speech.speakingId === message.id ? (
													<StopIcon className="bubble-speak-icon" />
												) : (
													<SpeakerIcon className="bubble-speak-icon" />
												)}
												{t(lang, speech.speakingId === message.id ? "停止" : "朗读日语")}
												</button>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>
				<div className="chat-langs">
					<label className="chat-lang">
						<span className="chat-lang-label">{t(lang, "源语言")}</span>
						<select
							className="chat-lang-select"
							value={source}
							onChange={(event) => changeSource(event.target.value as TranslationLanguage)}
						>
							{LANGUAGE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{t(lang, option.label)}
								</option>
							))}
						</select>
					</label>
					<button
						type="button"
						className="chat-lang-swap"
						onClick={swapLanguages}
						aria-label={t(lang, "交换语言")}
						title={t(lang, "交换语言")}
					>
						<SwapIcon />
					</button>
					<label className="chat-lang">
						<span className="chat-lang-label">{t(lang, "目标语言")}</span>
						<select
							className="chat-lang-select"
							value={target}
							onChange={(event) => changeTarget(event.target.value as TranslationLanguage)}
						>
							{LANGUAGE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{t(lang, option.label)}
								</option>
							))}
						</select>
					</label>
				</div>
				<div className="chat-phrases">
					<div className="chat-phrases-label" lang={inputLang}>
						{t(inputLang, "常用沟通卡")}
					</div>
					<div className="chat-chips">
						{fixedPhrases.map((phrase, i) => (
							<button
								key={phrase.text}
								type="button"
								className="chat-chip"
								lang={inputLang}
								onClick={() => sendFixedPhrase(i)}
							>
								{phrase.text}
							</button>
						))}
					</div>
				</div>
				<form
					className="chat-input-row"
					onSubmit={(event) => {
						event.preventDefault();
						sendInput();
					}}
				>
					<button
						type="button"
						className="chat-mic"
						onClick={toggleVoiceMode}
						aria-label={voiceMode ? t(inputLang, "键盘输入") : t(inputLang, "语音输入")}
					>
						{voiceMode ? <KeyboardIcon /> : <MicIcon />}
					</button>
					{voiceMode ? (
						// 微信同款「按住 说话」：按住录音，松开后识别文本填入输入框待确认。
						<button
							type="button"
							className={`chat-hold${recognition.listening ? " holding" : ""}`}
							lang={inputLang}
							onPointerDown={startHoldToTalk}
							onPointerUp={endHoldToTalk}
							onPointerCancel={endHoldToTalk}
							onContextMenu={(event) => event.preventDefault()}
						>
							{t(inputLang, recognition.listening ? "松开 结束" : "按住 说话")}
						</button>
					) : (
						<>
							<input
								className="chat-input"
								value={input}
								onChange={(event) => setInput(event.target.value)}
								lang={inputLang}
								placeholder={t(inputLang, "输入想说的话…")}
								enterKeyHint="send"
							/>
							<button type="submit" className="chat-send" disabled={input.trim().length === 0}>
								{t(inputLang, "发送")}
							</button>
						</>
					)}
				</form>
			</div>
		</section>
	);
}
