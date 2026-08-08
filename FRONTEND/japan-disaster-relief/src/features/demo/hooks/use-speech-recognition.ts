"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// lib.dom 尚未内置 Web Speech API 的识别部分，这里声明用到的最小结构。
interface SpeechRecognitionResultLike {
	readonly isFinal: boolean;
	readonly 0: { readonly transcript: string };
}

interface SpeechRecognitionEventLike {
	readonly results: { readonly length: number; readonly [index: number]: SpeechRecognitionResultLike };
}

interface SpeechRecognitionErrorEventLike {
	readonly error: string;
}

interface SpeechRecognitionLike {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	onresult: ((event: SpeechRecognitionEventLike) => void) | null;
	onend: (() => void) | null;
	onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
	if (typeof window === "undefined") return null;
	const speechWindow = window as {
		SpeechRecognition?: SpeechRecognitionConstructor;
		webkitSpeechRecognition?: SpeechRecognitionConstructor;
	};
	return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

/** 识别失败的分类：权限被拒 / 没听到内容（静默忽略）/ 其他。 */
export type SpeechRecognitionFailure = "not-allowed" | "no-speech" | "other";

interface StartOptions {
	/** BCP 47 语言标签，如 "zh-CN" / "ja-JP"。 */
	lang: string;
	/** 中间与最终识别结果都会回调（整段覆盖式文本）。 */
	onText: (text: string) => void;
	onError: (failure: SpeechRecognitionFailure) => void;
}

interface SpeechRecognitionControls {
	listening: boolean;
	/** 开始识别；浏览器不支持时返回 false（由调用方提示）。 */
	start: (options: StartOptions) => boolean;
	stop: () => void;
}

/** 语音输入（Web Speech API）：单句识别，实时回调中间结果，卸载时中止。 */
export function useSpeechRecognition(): SpeechRecognitionControls {
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

	useEffect(() => {
		return () => recognitionRef.current?.abort();
	}, []);

	const stop = useCallback(() => {
		recognitionRef.current?.stop();
		setListening(false);
	}, []);

	const start = useCallback(({ lang, onText, onError }: StartOptions) => {
		const SpeechRecognitionImpl = getSpeechRecognitionConstructor();
		if (SpeechRecognitionImpl === null) return false;
		recognitionRef.current?.abort();

		const recognition = new SpeechRecognitionImpl();
		recognition.lang = lang;
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.onresult = (event) => {
			let transcript = "";
			for (let i = 0; i < event.results.length; i++) {
				transcript += event.results[i][0].transcript;
			}
			onText(transcript.trim());
		};
		recognition.onend = () => setListening(false);
		recognition.onerror = (event) => {
			setListening(false);
			if (event.error === "not-allowed" || event.error === "service-not-allowed") {
				onError("not-allowed");
			} else if (event.error === "no-speech" || event.error === "aborted") {
				onError("no-speech");
			} else {
				onError("other");
			}
		};

		recognitionRef.current = recognition;
		setListening(true);
		recognition.start();
		return true;
	}, []);

	return { listening, start, stop };
}
