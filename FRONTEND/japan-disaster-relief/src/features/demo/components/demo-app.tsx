"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
	ACTION_I18N,
	type DemoLang,
	HEADER_LABELS,
	LANG_QUICK_LABEL,
	PHRASES,
	PHRASE_TEXT,
	t,
	WELCOME_COPY,
} from "../i18n";
import "../demo.css";

type ScreenName =
	| "welcome"
	| "mode"
	| "event"
	| "danger"
	| "injury"
	| "environment"
	| "action"
	| "shelter"
	| "facilities"
	| "communication"
	| "offline";

type ChoiceGroup = "event" | "danger" | "injury" | "environment";

interface ActionCard {
	title: string;
	copy: string;
	dont: string;
}

const INITIAL_ACTION: ActionCard = {
	title: "先留在空旷、安全的位置",
	copy: "远离玻璃、外墙、招牌、电线杆和可能掉落的物体。",
	dont: "不要急着进入受损建筑；不要使用电梯；不要仅凭距离判断路线安全。",
};

export function DemoApp() {
	const [screen, setScreen] = useState<ScreenName>("welcome");
	const [lang, setLang] = useState<DemoLang>("zh");
	const [choices, setChoices] = useState<Record<ChoiceGroup, string | null>>({
		event: "earthquake",
		danger: null,
		injury: null,
		environment: null,
	});
	const [phrase, setPhrase] = useState(0);
	const [phrasePickerOpen, setPhrasePickerOpen] = useState(false);
	// Screen to go back to when leaving the communication card.
	const [commReturn, setCommReturn] = useState<ScreenName>("mode");
	const [action, setAction] = useState<ActionCard>(INITIAL_ACTION);
	const [toast, setToast] = useState({ msg: "", show: false });
	const toastTimer = useRef<number | undefined>(undefined);

	const welcome = WELCOME_COPY[lang];

	useEffect(() => {
		document.documentElement.lang = lang === "zh" ? "zh-CN" : lang === "en" ? "en" : "ja";
	}, [lang]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [screen]);

	function notify(msg: string) {
		setToast({ msg, show: true });
		window.clearTimeout(toastTimer.current);
		toastTimer.current = window.setTimeout(
			() => setToast((prev) => ({ ...prev, show: false })),
			1800,
		);
	}

	function selectChoice(group: ChoiceGroup, value: string) {
		setChoices((prev) => ({ ...prev, [group]: value }));
	}

	function pickLanguage(next: string) {
		if (next === "more") {
			notify("更多语言将在后续版本开放");
			return;
		}
		const picked = next as DemoLang;
		setLang(picked);
		notify(WELCOME_COPY[picked].toast);
	}

	function calculateAction() {
		if (!choices.environment) {
			notify(lang === "zh" ? "请先选择当前环境" : ACTION_I18N[lang].select);
			return;
		}
		if (lang === "zh") {
			// Same as the demo: the indoor/default branches keep the previous "don't" copy.
			if (choices.danger === "yes") {
				setAction({
					title: "立即离开直接危险区域并求助",
					copy: "停止复杂操作，优先撤离，并向现场工作人员或周围人员出示沟通卡。",
					dont: "不要停留拍摄；不要返回取物；不要等待系统进一步判断。",
				});
			} else if (choices.injury === "yes") {
				setAction({
					title: "立即向周围人员求助并呼叫救护车",
					copy: "保持当前位置可被发现，使用沟通卡说明需要救护车。",
					dont: "不要自行进行复杂医疗判断；不要让严重伤者独自移动。",
				});
			} else if (choices.environment === "indoor") {
				setAction((prev) => ({
					...prev,
					title: "确认出口安全后，按现场指示移动",
					copy: "远离玻璃与可能掉落物，不使用电梯，先听从工作人员和广播。",
				}));
			} else {
				setAction((prev) => ({
					...prev,
					title: "先留在空旷、安全的位置",
					copy: "远离玻璃、外墙、招牌、电线杆和可能掉落的物体。",
				}));
			}
		} else {
			const a = ACTION_I18N[lang];
			const x =
				choices.danger === "yes"
					? a.danger
					: choices.injury === "yes"
						? a.injury
						: choices.environment === "indoor"
							? a.indoor
							: a.default;
			setAction({ title: x[0], copy: x[1], dont: x[2] });
		}
		setScreen("action");
	}

	function openCommunication() {
		if (screen !== "communication") setCommReturn(screen);
		setPhrasePickerOpen(false);
		setScreen("communication");
	}

	function pickPhrase(index: number) {
		if ("speechSynthesis" in window) speechSynthesis.cancel();
		setPhrase(index);
		setPhrasePickerOpen(false);
	}

	function speak() {
		if ("speechSynthesis" in window) {
			speechSynthesis.cancel();
			const u = new SpeechSynthesisUtterance(PHRASES[phrase][2]);
			u.lang = "ja-JP";
			speechSynthesis.speak(u);
		} else {
			notify("当前浏览器不支持朗读");
		}
	}

	const headerSub =
		screen === "communication" ? HEADER_LABELS[lang].communication : HEADER_LABELS[lang].default;

	const screenClass = (name: ScreenName) => `screen${screen === name ? " active" : ""}`;

	const progress = (on: number) => (
		<div className="progress">
			{[0, 1, 2, 3, 4].map((i) => (
				<span key={i} className={i < on ? "on" : undefined} />
			))}
		</div>
	);

	const choice = (
		group: ChoiceGroup,
		value: string,
		icon: string,
		label: string,
		meta?: string,
	) => (
		<button
			type="button"
			className={`choice${choices[group] === value ? " selected" : ""}`}
			onClick={() => selectChoice(group, value)}
		>
			<span className="choice-icon">{icon}</span>
			<span>
				{label}
				{meta !== undefined && <div className="choice-meta">{meta}</div>}
			</span>
		</button>
	);

	return (
		<div className="app-shell">
			<div className="phone">
				<header className="topbar">
					<div className="brand">
						<div className="logo">盾</div>
						<div>
							<div className="brand-text">Tokyo Safe First</div>
							<div className="brand-sub">{headerSub}</div>
						</div>
					</div>
					<div className="top-actions">
						<button
							type="button"
							className="icon-btn"
							aria-label="沟通卡"
							onClick={openCommunication}
						>
							译
						</button>
						<button type="button" className="icon-btn" onClick={() => setScreen("welcome")}>
							{LANG_QUICK_LABEL[lang]}
						</button>
					</div>
				</header>
				<main className="main">
					<section className={screenClass("welcome")} data-screen="welcome">
						<div className="hero-mark">🛡️</div>
						<div className="eyebrow">Emergency guidance</div>
						<h1 className="hero-title">{welcome.title}</h1>
						<p className="lead">{welcome.lead}</p>
						<h3>{welcome.prompt}</h3>
						<div className="grid2">
							{(
								[
									["zh", "中文"],
									["en", "English"],
									["ja", "日本語"],
									["more", "更多语言"],
								] as const
							).map(([value, label]) => (
								<button
									key={value}
									type="button"
									className={`lang-btn${lang === value ? " active" : ""}`}
									onClick={() => pickLanguage(value)}
								>
									{label}
								</button>
							))}
						</div>
						<div className="panel tint">
							<div className="panel-row">
								<div className="panel-icon">📍</div>
								<div>
									<div className="panel-title">{welcome.locTitle}</div>
									<div className="panel-copy">{welcome.locCopy}</div>
								</div>
							</div>
						</div>
						<div className="actions">
							<button type="button" className="btn primary" onClick={() => setScreen("mode")}>
								{welcome.continue}
							</button>
							<div className="privacy">{welcome.privacy}</div>
						</div>
					</section>

					<section className={screenClass("mode")} data-screen="mode">
						<div className="eyebrow">{t(lang, "Choose mode")}</div>
						<h1 className="hero-title">{t(lang, "你现在需要哪种帮助？")}</h1>
						<p className="lead">{t(lang, "每次只完成一个判断，系统再给出下一步。")}</p>
						<div className="mode-card">
							<div className="mode-head">
								<div className="mode-icon">🚨</div>
								<div>
									<div className="mode-title">{t(lang, "灾害模式")}</div>
									<div className="mode-copy">
										{t(lang, "地震、火灾、水灾发生后，不知道下一步怎么办。")}
									</div>
								</div>
							</div>
							<button type="button" className="btn danger" onClick={() => setScreen("event")}>
								{t(lang, "进入灾害模式")}
							</button>
						</div>
						<div className="mode-card">
							<div className="mode-head">
								<div className="mode-icon">🩹</div>
								<div>
									<div className="mode-title">{t(lang, "日常应急")}</div>
									<div className="mode-copy">{t(lang, "迷路、身体不适、需要警察或医疗帮助。")}</div>
								</div>
							</div>
							<button
								type="button"
								className="btn ghost"
								onClick={() => notify("比赛版先展示入口说明")}
							>
								{t(lang, "查看功能说明")}
							</button>
						</div>
						<div className="safe-banner">
							⚠️ 若仍处于建筑倒塌、火灾或其他直接危险中，请立即撤离并听从现场人员指示。
						</div>
					</section>

					<section className={screenClass("event")} data-screen="event">
						{progress(1)}
						<div className="eyebrow">{t(lang, "第 1 步")}</div>
						<h1 className="hero-title">{t(lang, "刚才发生了什么？")}</h1>
						<p className="lead">{t(lang, "系统根据公开信息推荐“地震”，请你确认。")}</p>
						<div className="choice-list">
							{choice("event", "earthquake", "🌎", t(lang, "地震"), t(lang, "系统推荐 · 请确认"))}
							{choice("event", "fire", "🔥", t(lang, "火灾"))}
							{choice("event", "flood", "🌊", t(lang, "水灾 / 海啸"))}
							{choice("event", "unknown", "❓", t(lang, "不确定"))}
						</div>
						<div className="actions">
							<button type="button" className="btn primary" onClick={() => setScreen("danger")}>
								{t(lang, "确认并继续")}
							</button>
							<button type="button" className="btn secondary" onClick={() => setScreen("mode")}>
								{t(lang, "返回")}
							</button>
						</div>
					</section>

					<section className={screenClass("danger")} data-screen="danger">
						{progress(2)}
						<div className="question-count">{t(lang, "问题 1 / 3")}</div>
						<h1 className="hero-title">{t(lang, "你现在仍处于直接危险中吗？")}</h1>
						<p className="lead">
							{t(lang, "例如建筑正在倒塌、附近有火、玻璃持续掉落或必须立即撤离。")}
						</p>
						<div className="choice-list">
							{choice("danger", "no", "✅", t(lang, "没有"))}
							{choice("danger", "yes", "🆘", t(lang, "有"))}
							{choice("danger", "unknown", "❔", t(lang, "不确定"))}
						</div>
						<div className="actions">
							<button type="button" className="btn primary" onClick={() => setScreen("injury")}>
								{t(lang, "继续")}
							</button>
							<button
								type="button"
								className="btn secondary"
								onClick={openCommunication}
							>
								{t(lang, "我做不到 / 需要帮助")}
							</button>
						</div>
					</section>

					<section className={screenClass("injury")} data-screen="injury">
						{progress(2)}
						<div className="question-count">{t(lang, "问题 2 / 3")}</div>
						<h1 className="hero-title">{t(lang, "你或身边的人是否严重受伤？")}</h1>
						<p className="lead">{t(lang, "例如大量出血、无法呼吸、失去意识或无法移动。")}</p>
						<div className="choice-list">
							{choice("injury", "no", "✅", t(lang, "没有"))}
							{choice("injury", "yes", "🆘", t(lang, "有"))}
							{choice("injury", "unknown", "❔", t(lang, "不确定"))}
						</div>
						<div className="panel amber">
							<div className="panel-row">
								<div className="panel-icon">⚠️</div>
								<div>
									<div className="panel-title">{t(lang, "无法判断也没关系")}</div>
									<div className="panel-copy">
										{t(lang, "选择“不确定”后会进入更保守的固定规则分支。")}
									</div>
								</div>
							</div>
						</div>
						<div className="actions">
							<button
								type="button"
								className="btn primary"
								onClick={() => setScreen("environment")}
							>
								{t(lang, "继续")}
							</button>
							<button
								type="button"
								className="btn secondary"
								onClick={openCommunication}
							>
								{t(lang, "我做不到 / 需要帮助")}
							</button>
						</div>
					</section>

					<section className={screenClass("environment")} data-screen="environment">
						{progress(2)}
						<div className="question-count">{t(lang, "问题 3 / 3")}</div>
						<h1 className="hero-title">{t(lang, "你现在在哪里？")}</h1>
						<p className="lead">{t(lang, "选择最接近的环境，用于匹配固定行动规则。")}</p>
						<div className="choice-list">
							{choice("environment", "outdoor", "🌳", t(lang, "室外 / 空旷处"))}
							{choice("environment", "indoor", "🏢", t(lang, "建筑物内"))}
							{choice("environment", "transit", "🚇", t(lang, "车站 / 交通工具内"))}
							{choice("environment", "unknown", "❔", t(lang, "不确定"))}
						</div>
						<div className="actions">
							<button type="button" className="btn primary" onClick={calculateAction}>
								{t(lang, "生成下一步行动")}
							</button>
						</div>
					</section>

					<section className={screenClass("action")} data-screen="action">
						{progress(3)}
						<div className="action-hero">
							<div className="eyebrow">{t(lang, "现在只做这一件事")}</div>
							<h2>{action.title}</h2>
							<p className="lead">{action.copy}</p>
						</div>
						<div className="panel red">
							<div className="panel-row">
								<div className="panel-icon">✋</div>
								<div>
									<div className="panel-title">{t(lang, "现在不要做")}</div>
									<div className="panel-copy">{action.dont}</div>
								</div>
							</div>
						</div>
						<div className="panel green">
							<div className="panel-row">
								<div className="panel-icon">👂</div>
								<div>
									<div className="panel-title">{t(lang, "同时确认现场信息")}</div>
									<div className="panel-copy">{t(lang, "听从工作人员、现场广播和官方发布。")}</div>
								</div>
							</div>
						</div>
						<div className="source">
							{t(lang, "规则来源：东京都防灾相关官方资料｜规则版本 v1.0｜非专业建筑或医疗判断")}
						</div>
						<div className="actions">
							<button type="button" className="btn primary" onClick={() => setScreen("shelter")}>
								{t(lang, "我已完成，查看附近设施")}
							</button>
							<button
								type="button"
								className="btn secondary"
								onClick={openCommunication}
							>
								{t(lang, "我做不到")}
							</button>
						</div>
					</section>

					<section className={screenClass("shelter")} data-screen="shelter">
						{progress(4)}
						<div className="hero-mark">🏫</div>
						<h1 className="hero-title">{t(lang, "需要查看附近的避难设施吗？")}</h1>
						<p className="lead">{t(lang, "系统会根据本次位置和官方开放数据列出候选设施。")}</p>
						<div className="panel amber">
							<div className="panel-title">{t(lang, "重要说明")}</div>
							<div className="panel-copy">
								{t(lang, "“附近”不代表安全；“数据中存在”不代表现在开放；路线是否可通行需要现场确认。")}
							</div>
						</div>
						<div className="panel">
							<div className="panel-row">
								<div className="panel-icon">📍</div>
								<div>
									<div className="panel-title">{t(lang, "当前位置")}</div>
									<div className="panel-copy">{t(lang, "東京都新宿区附近 · 仅本次使用")}</div>
								</div>
							</div>
						</div>
						<div className="actions">
							<button
								type="button"
								className="btn primary"
								onClick={() => setScreen("facilities")}
							>
								{t(lang, "查看设施候选")}
							</button>
							<button
								type="button"
								className="btn secondary"
								onClick={() => notify("已保留当前行动卡")}
							>
								{t(lang, "暂时不需要")}
							</button>
						</div>
					</section>

					<section className={screenClass("facilities")} data-screen="facilities">
						{progress(5)}
						<h1 className="hero-title">{t(lang, "附近设施候选")}</h1>
						<div className="map">
							<div className="river" />
							<div className="pin p1">📍</div>
							<div className="pin p2">📍</div>
							<div className="pin me">🔵</div>
						</div>
						<div className="facility">
							<div className="facility-head">
								<div>
									<div className="facility-name">新宿区立 ○○小学校</div>
									<div className="facility-meta">{t(lang, "指定避难所 · 约 620m")}</div>
								</div>
								<span className="tag">{t(lang, "候选 1")}</span>
							</div>
							<div className="facility-meta">
								{t(lang, "开放状态：无法确认｜数据更新：2026-07-20")}
							</div>
							<button
								type="button"
								className="btn primary"
								onClick={() => notify("比赛原型：打开外部地图")}
							>
								{t(lang, "在地图中查看")}
							</button>
						</div>
						<div className="facility">
							<div className="facility-head">
								<div>
									<div className="facility-name">○○地域センター</div>
									<div className="facility-meta">{t(lang, "避难设施 · 约 940m")}</div>
								</div>
								<span className="tag">{t(lang, "候选 2")}</span>
							</div>
							<div className="facility-meta">
								{t(lang, "开放状态：非实时｜数据更新：2026-07-18")}
							</div>
						</div>
						<div className="source">
							{t(lang, "来源：东京都 / 新宿区开放数据。距离最短不代表路线可通行。")}
						</div>
						<div className="actions">
							<button
								type="button"
								className="btn secondary"
								onClick={openCommunication}
							>
								{t(lang, "打开沟通卡")}
							</button>
						</div>
					</section>

					<section className={screenClass("communication")} data-screen="communication">
						<div className="comm">
							<div className="eyebrow">{t(lang, "请把屏幕给对方看")}</div>
							<div className="jp-card">
								{PHRASES[phrase][0].map((line, i) => (
									<Fragment key={line}>
										{i > 0 && <br />}
										{line}
									</Fragment>
								))}
							</div>
							<div className="cn-text">{PHRASE_TEXT[lang][phrase]}</div>
							<div className="actions">
								<button type="button" className="btn primary" onClick={speak}>
									{t(lang, "🔊 朗读日语")}
								</button>
								<button
									type="button"
									className="btn secondary"
									onClick={() => setPhrasePickerOpen((prev) => !prev)}
								>
									{t(lang, phrasePickerOpen ? "收起列表" : "切换其他沟通卡")}
								</button>
								{phrasePickerOpen && (
									<div className="phrase-list">
										<div className="phrase-list-title">{t(lang, "选择要展示的沟通卡")}</div>
										{PHRASE_TEXT[lang].map((text, i) => (
											<button
												key={text}
												type="button"
												className={`phrase-option${i === phrase ? " selected" : ""}`}
												onClick={() => pickPhrase(i)}
											>
												<span className="phrase-native">{text}</span>
												{lang !== "ja" && <span className="phrase-jp">{PHRASES[i][2]}</span>}
											</button>
										))}
									</div>
								)}
								<div className="comm-nav">
									<button
										type="button"
										className="btn ghost"
										onClick={() => setScreen(commReturn)}
									>
										{t(lang, "返回")}
									</button>
									<button type="button" className="btn ghost" onClick={() => setScreen("mode")}>
										{t(lang, "返回主页")}
									</button>
								</div>
								<div className="privacy trust">
									{t(lang, "固定审核翻译 · 核心功能不依赖 AI")}
								</div>
							</div>
						</div>
					</section>

					<section className={screenClass("offline")} data-screen="offline">
						<div className="offline">
							<div>
								<div className="offline-icon">📡</div>
								<h2>{t(lang, "当前服务受限")}</h2>
								<p className="lead">
									{t(lang, "无法获取最新设施数据。请确认现场广播、工作人员和官方信息。")}
								</p>
								<button type="button" className="btn primary" onClick={() => setScreen("mode")}>
									{t(lang, "重新尝试")}
								</button>
							</div>
						</div>
					</section>
				</main>
			</div>
			<div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
		</div>
	);
}
