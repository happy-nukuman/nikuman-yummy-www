"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CloseIcon, QrCodeIcon } from "@/features/demo/components/app-icons";
import { type DemoLang, t } from "@/features/demo/i18n";
import { appShareUrl, shareUrlLabel } from "@/features/demo/share-url";

interface ShareModalProps {
	lang: DemoLang;
	onToast: (message: string) => void;
	onClose: () => void;
}

// 二维码前景用品牌深蓝而非纯黑，与界面一致；亮度差足够，扫码不受影响。
const QR_FOREGROUND = "#082653";

// 访问地址在页面存活期间不会变，订阅是空操作；服务端渲染时不碰 window。
const subscribeToNothing = () => () => {};
const readShareUrl = () => appShareUrl(window.location.href);
const noShareUrlOnServer = () => "";

/** 灾害现场把 App 递给旁边的人：出示当前访问地址的二维码，对方扫码即用。 */
export function ShareModal({ lang, onToast, onClose }: ShareModalProps) {
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const shareUrl = useSyncExternalStore(subscribeToNothing, readShareUrl, noShareUrlOnServer);

	useEffect(() => {
		closeButtonRef.current?.focus();
		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [onClose]);

	// 复制需要安全上下文，局域网 http 下会失败：明确告诉用户改用扫码。
	async function copyShareUrl() {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			onToast(t(lang, "已复制链接"));
		} catch {
			onToast(t(lang, "复制失败，请让对方扫描二维码"));
		}
	}

	return (
		<div
			className="modal-backdrop share-modal-backdrop"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onClose();
			}}
		>
			<div
				className="modal share-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="share-title"
				aria-describedby="share-description"
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
					<QrCodeIcon />
				</div>
				<h2 className="modal-title" id="share-title">
					{t(lang, "分享这个 App")}
				</h2>
				<p className="modal-copy share-intro" id="share-description">
					{t(lang, "让身边的人扫描二维码，立即打开同一个 App。无需安装、无需注册。")}
				</p>
				<div className="share-qr">
					{shareUrl ? (
						<QRCodeSVG
							value={shareUrl}
							size={216}
							level="M"
							marginSize={2}
							bgColor="#ffffff"
							fgColor={QR_FOREGROUND}
							title={t(lang, "当前 App 访问地址的二维码")}
						/>
					) : (
						<span className="share-qr-loading">{t(lang, "正在生成二维码…")}</span>
					)}
				</div>
				<div className="share-url">{shareUrlLabel(shareUrl)}</div>
				<div className="modal-actions">
					<button type="button" className="btn secondary" onClick={copyShareUrl}>
						{t(lang, "复制链接")}
					</button>
					<button type="button" className="btn ghost" onClick={onClose}>
						{t(lang, "关闭")}
					</button>
				</div>
			</div>
		</div>
	);
}
