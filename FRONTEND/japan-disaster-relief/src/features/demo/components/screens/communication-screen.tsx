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

// demo 界面语言 → 翻译接口的语言代码（双向共用）。
const APP_LANGUAGE: Record<DemoLang, TranslationLanguage> = {
	zh: "zh-Hans",
	en: "en",
	ja: "ja",
};

// demo 界面语言 → 语音识别的 BCP 47 语言标签。
const SPEECH_LANGUAGE: Record<DemoLang, string> = {
	zh: "zh-CN",
	en: "en-US",
	ja: "ja-JP",
};

/** toJapanese = 用户 → 日本人；fromJapanese = 日本人回应用户。 */
type Direction = "toJapanese" | "fromJapanese";

interface ChatMessage {
	id: number;
	direction: Direction;
	/** 原文：toJapanese 为用户语言，fromJapanese 为日语。 */
	sourceText: string;
	/** 译文：toJapanese 为日语，fromJapanese 为用户语言；翻译完成前为 null。 */
	translatedText: string | null;
	/** fixed = 固定审核翻译（不走接口）；ai = 调用翻译接口。 */
	kind: "fixed" | "ai";
	status: "loading" | "done" | "error";
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
	/** 上一页不是主页时才显示「返回」按钮（主页去处已由「返回主页」覆盖）。 */
	canReturn: boolean;
	/** 朗读不可用等提示走全局 toast。 */
	onToast: (message: string) => void;
	onReturn: () => void;
	onHome: () => void;
}

/** 沟通卡：聊天式双向翻译。固定短句直接出卡，自由输入调用翻译接口；
 *  「日本語で返信」模式供日本人回应，界面提示固定为日语。 */
export function CommunicationScreen({
	active,
	lang,
	canReturn,
	onToast,
	onReturn,
	onHome,
}: CommunicationScreenProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	// true = 日本人回应模式（输入区切换为日语界面）。
	const [replyMode, setReplyMode] = useState(false);
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

	async function translate(id: number, text: string, direction: Direction) {
		const request =
			direction === "toJapanese"
				? { text, sourceLanguage: APP_LANGUAGE[lang], targetLanguage: "ja" as const }
				: { text, sourceLanguage: "ja" as const, targetLanguage: APP_LANGUAGE[lang] };
		try {
			const response = await postTranslation(request);
			updateMessage(id, { translatedText: response.translatedText, status: "done" });
		} catch {
			updateMessage(id, { status: "error" });
		}
	}

	// 固定沟通卡（用户 → 日本人）：使用既有的审核译文，不经过翻译接口。
	function sendFixedPhrase(index: number) {
		appendMessage({
			direction: "toJapanese",
			sourceText: PHRASE_TEXT[lang][index],
			translatedText: PHRASES[index][2],
			kind: "fixed",
			status: "done",
		});
	}

	// 固定回应（日本人 → 用户）：日语原文与译文都是审核文案。
	function sendFixedReply(index: number) {
		appendMessage({
			direction: "fromJapanese",
			sourceText: REPLY_PHRASES[index][0],
			translatedText: replyPhraseTranslation(lang, index),
			kind: "fixed",
			status: "done",
		});
	}

	function sendInput() {
		const text = input.trim();
		if (text.length === 0) return;
		setInput("");
		const direction: Direction = replyMode ? "fromJapanese" : "toJapanese";
		const id = appendMessage({
			direction,
			sourceText: text,
			translatedText: null,
			kind: "ai",
			status: "loading",
		});
		void translate(id, text, direction);
	}

	function retry(message: ChatMessage) {
		updateMessage(message.id, { status: "loading" });
		void translate(message.id, message.sourceText, message.direction);
	}

	// 切换输入方向时清空未发送的草稿并停止录音（通常伴随把手机递给对方）。
	function switchMode(nextReplyMode: boolean) {
		if (nextReplyMode === replyMode) return;
		recognition.stop();
		setReplyMode(nextReplyMode);
		setInput("");
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
			lang: replyMode ? "ja-JP" : SPEECH_LANGUAGE[lang],
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
						{t(lang, "点选下方常用沟通卡，或输入文字，系统会翻译成日语展示给对方。")}
					</div>
					{messages.map((message) => {
						const translated = message.translatedText;
						const incoming = message.direction === "fromJapanese";
						return (
							<div
								key={message.id}
								className={`bubble msg${incoming ? " incoming" : ""}${
									message.status === "error" ? " error" : ""
								}`}
							>
								<div className="bubble-source" lang={incoming ? "ja" : undefined}>
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
										<div className="bubble-jp-text" lang={incoming ? undefined : "ja"}>
											{translated}
										</div>
										<div className="bubble-foot">
											<span className="bubble-tag">
												{t(lang, message.kind === "fixed" ? "固定审核翻译" : "AI 翻译 · 仅供参考")}
											</span>
											{!incoming && (
												<button
													type="button"
													className={`bubble-speak${
														speech.speakingId === message.id ? " speaking" : ""
													}`}
													onClick={() => speak(message.id, translated)}
												>
													{t(lang, speech.speakingId === message.id ? "⏹ 停止" : "🔊 朗读日语")}
												</button>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>
				<div className="chat-mode">
					<button
						type="button"
						className={`chat-mode-btn${replyMode ? "" : " active"}`}
						onClick={() => switchMode(false)}
					>
						{t(lang, "我说")}
					</button>
					{/* 操作这个模式的人是日本人：标签与输入提示固定用日语，不随界面语言变化。 */}
					<button
						type="button"
						className={`chat-mode-btn${replyMode ? " active" : ""}`}
						lang="ja"
						onClick={() => switchMode(true)}
					>
						日本語で返信
					</button>
				</div>
				{replyMode && (
					<div className="chat-reply-hint" lang="ja">
						日本語で入力すると、相手の言語に翻訳して表示されます。
					</div>
				)}
				<div className="chat-phrases">
					<div className="chat-phrases-label" lang={replyMode ? "ja" : undefined}>
						{replyMode ? "よく使う返信" : t(lang, "常用沟通卡")}
					</div>
					<div className="chat-chips">
						{replyMode
							? REPLY_PHRASES.map(([ja], i) => (
									<button
										key={ja}
										type="button"
										className="chat-chip"
										lang="ja"
										onClick={() => sendFixedReply(i)}
									>
										{ja}
									</button>
								))
							: PHRASE_TEXT[lang].map((text, i) => (
									<button
										key={text}
										type="button"
										className="chat-chip"
										onClick={() => sendFixedPhrase(i)}
									>
										{text}
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
						aria-label={voiceMode ? t(lang, "键盘输入") : t(lang, "语音输入")}
					>
						{voiceMode ? <KeyboardIcon /> : <MicIcon />}
					</button>
					{voiceMode ? (
						// 微信同款「按住 说话」：按住录音，松开后识别文本填入输入框待确认。
						<button
							type="button"
							className={`chat-hold${recognition.listening ? " holding" : ""}`}
							lang={replyMode ? "ja" : undefined}
							onPointerDown={startHoldToTalk}
							onPointerUp={endHoldToTalk}
							onPointerCancel={endHoldToTalk}
							onContextMenu={(event) => event.preventDefault()}
						>
							{recognition.listening
								? replyMode
									? "離して 終了"
									: t(lang, "松开 结束")
								: replyMode
									? "長押しして 話す"
									: t(lang, "按住 说话")}
						</button>
					) : (
						<>
							<input
								className="chat-input"
								value={input}
								onChange={(event) => setInput(event.target.value)}
								lang={replyMode ? "ja" : undefined}
								placeholder={replyMode ? "日本語で入力…" : t(lang, "输入想说的话，翻译成日语")}
								enterKeyHint="send"
							/>
							<button type="submit" className="chat-send" disabled={input.trim().length === 0}>
								{replyMode ? "送信" : t(lang, "发送")}
							</button>
						</>
					)}
				</form>
				<div className={`comm-nav${canReturn ? "" : " single"}`}>
					{canReturn && (
						<button type="button" className="btn ghost" onClick={onReturn}>
							← {t(lang, "返回上一步")}
						</button>
					)}
					<button type="button" className="btn ghost" onClick={onHome}>
						{t(lang, "返回首页")}
					</button>
				</div>
			</div>
		</section>
	);
}
