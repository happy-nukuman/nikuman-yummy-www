"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface JapaneseSpeech {
	/** 正在朗读的消息 id；空闲时为 null。 */
	speakingId: number | null;
	/** 朗读指定文本；再次调用同一 id 则停止。不支持朗读时返回 false。 */
	toggle: (id: number, text: string) => boolean;
	stop: () => void;
}

/** 日语朗读：优先挑选 ja-JP 音色，跟踪播放状态，卸载时自动停止。 */
export function useJapaneseSpeech(): JapaneseSpeech {
	const [speakingId, setSpeakingId] = useState<number | null>(null);
	const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

	useEffect(() => {
		if (!("speechSynthesis" in window)) return;

		// 音色列表是异步加载的（voiceschanged）；优先在线的 Google 日语音色，
		// 其次本地音色（如 macOS/iOS 的 Kyoko），兜底任意 ja 音色。
		const pickVoice = () => {
			const voices = speechSynthesis
				.getVoices()
				.filter((voice) => voice.lang.toLowerCase().startsWith("ja"));
			voiceRef.current =
				voices.find((voice) => voice.name.includes("Google")) ??
				voices.find((voice) => voice.localService) ??
				voices[0] ??
				null;
		};
		pickVoice();
		speechSynthesis.addEventListener("voiceschanged", pickVoice);
		return () => {
			speechSynthesis.removeEventListener("voiceschanged", pickVoice);
			speechSynthesis.cancel();
		};
	}, []);

	const stop = useCallback(() => {
		if ("speechSynthesis" in window) speechSynthesis.cancel();
		setSpeakingId(null);
	}, []);

	const toggle = useCallback(
		(id: number, text: string) => {
			if (!("speechSynthesis" in window)) return false;
			speechSynthesis.cancel();
			if (speakingId === id) {
				setSpeakingId(null);
				return true;
			}

			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = "ja-JP";
			if (voiceRef.current !== null) utterance.voice = voiceRef.current;
			// 稍放慢语速：面向嘈杂环境和非母语者的沟通场景。
			utterance.rate = 0.95;
			const clear = () => setSpeakingId((current) => (current === id ? null : current));
			utterance.onend = clear;
			utterance.onerror = clear;

			setSpeakingId(id);
			// iOS Safari 长时间待机后可能卡在 paused 状态，speak 前先 resume。
			speechSynthesis.resume();
			speechSynthesis.speak(utterance);
			return true;
		},
		[speakingId],
	);

	return { speakingId, toggle, stop };
}
