"use client";

import { DISASTER_INFO_ITEMS, type DisasterInfoItem } from "@/features/demo/disaster-info";
import { type DemoLang, t } from "@/features/demo/i18n";

interface DisasterListScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 点击某条信息：进入该条灾害信息的详情页。 */
	onOpenDetail: (item: DisasterInfoItem) => void;
	onBack: () => void;
}

/**
 * 首页「灾害信息」磁贴的列表页：展示定位地点附近的最新公开灾害信息快照。
 * demo 版数据固定在 disaster-info.ts，点击条目进入详情画面。
 */
export function DisasterListScreen({ active, lang, onOpenDetail, onBack }: DisasterListScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="disasters">
			<div className="question-count">{t(lang, "灾害信息")}</div>
			<h1 className="title-sm">{t(lang, "当前位置附近的灾害信息")}</h1>
			<p className="lead-sm">{t(lang, "以下是根据本次位置整理的公开灾害信息，点击查看详情。")}</p>
			<div className="panel green">
				<div className="panel-row">
					<div className="panel-icon">✅</div>
					<div>
						<div className="panel-title">{t(lang, "新宿区当前没有生效的警报・注意报")}</div>
						<div className="panel-copy">{t(lang, "2026年8月8日 10:01 气象厅发表")}</div>
					</div>
				</div>
			</div>
			<div className="info-list">
				{DISASTER_INFO_ITEMS.map((item) => (
					<button
						key={item.id}
						type="button"
						className="info-card"
						onClick={() => onOpenDetail(item)}
					>
						<span className="info-head">
							<span className="info-icon" aria-hidden>
								{item.icon}
							</span>
							<span className="info-title">{t(lang, item.title)}</span>
							<span className={`info-tag ${item.level}`}>{t(lang, item.category)}</span>
						</span>
						<span className="info-summary">{t(lang, item.summary)}</span>
						<span className="info-meta">
							{t(lang, item.issuedAt)} · {t(lang, item.source)}
						</span>
					</button>
				))}
			</div>
			<div className="panel source-panel">
				<div className="source-label">{t(lang, "数据来源")}</div>
				<div className="source-value">{t(lang, "日本气象厅、东京都防灾信息、内阁府防灾信息 等")}</div>
				<div className="source-note">{t(lang, "非实时信息。请以官方最新发布为准。")}</div>
			</div>
			<div className="actions">
				<button type="button" className="btn ghost" onClick={onBack}>
					{t(lang, "返回上一步")}
				</button>
			</div>
		</section>
	);
}
