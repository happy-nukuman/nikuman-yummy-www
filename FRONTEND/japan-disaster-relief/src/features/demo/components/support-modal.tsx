"use client";

import { useEffect, useRef } from "react";
import { CloseIcon, ShieldIcon } from "@/features/demo/components/app-icons";
import { type DemoLang, t } from "@/features/demo/i18n";

interface SupportModalProps {
	lang: DemoLang;
	onClose: () => void;
}

const SUPPORT_EMAIL = "songlabs.dev@gmail.com";

/** Lightweight Demo notice and real emergency-number reference. */
export function SupportModal({ lang, onClose }: SupportModalProps) {
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		closeButtonRef.current?.focus();
		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [onClose]);

	return (
		<div
			className="modal-backdrop support-modal-backdrop"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onClose();
			}}
		>
			<div
				className="modal support-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="support-title"
				aria-describedby="support-description"
			>
				<button
					ref={closeButtonRef}
					type="button"
					className="modal-close"
					aria-label={t(lang, "关闭")}
					onClick={onClose}
				>
					<CloseIcon />
				</button>
				<div className="modal-icon">
					<ShieldIcon />
				</div>
				<h2 className="modal-title" id="support-title">
					{t(lang, "Support")}
				</h2>
				<p className="modal-copy support-intro" id="support-description">
					{t(lang, "Tokyo Safe First 是面向东京外国居民和游客的灾害行动 Demo。")}
				</p>
				<div className="support-emergency">
					<div className="support-emergency-title">{t(lang, "如发生真实紧急情况：")}</div>
					<div className="support-emergency-row">
						<strong>119</strong>
						<span>{t(lang, "消防 / 救护")}</span>
					</div>
					<div className="support-emergency-row">
						<strong>110</strong>
						<span>{t(lang, "警察")}</span>
					</div>
				</div>
				<p className="support-note">
					{t(lang, "本 Demo 信息仅供辅助参考，请同时确认现场人员及官方发布。")}
				</p>
				<div className="support-contact">
					<div className="support-contact-title">{t(lang, "联系我们")}</div>
					<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
				</div>
				<button type="button" className="btn secondary" onClick={onClose}>
					{t(lang, "关闭")}
				</button>
			</div>
		</div>
	);
}
