"use client";

import { type DemoLang, t } from "@/features/demo/i18n";

interface LocationDialogProps {
	lang: DemoLang;
	onDecide: (allow: boolean) => void;
}

/** Demo location-permission prompt; the granted location itself is hardcoded. */
export function LocationDialog({ lang, onDecide }: LocationDialogProps) {
	return (
		<div className="modal-backdrop">
			<div
				className="modal"
				role="dialog"
				aria-modal="true"
				aria-label={t(lang, "是否允许获取你的实时位置？")}
			>
				<div className="modal-icon">📍</div>
				<h2 className="modal-title">{t(lang, "是否允许获取你的实时位置？")}</h2>
				<p className="modal-copy">
					{t(lang, "用于确认所在区和附近避难设施，仅本次使用，不保存位置历史。")}
				</p>
				<div className="modal-actions">
					<button type="button" className="btn primary" onClick={() => onDecide(true)}>
						{t(lang, "允许获取位置")}
					</button>
					<button type="button" className="btn secondary" onClick={() => onDecide(false)}>
						{t(lang, "不允许")}
					</button>
				</div>
			</div>
		</div>
	);
}
