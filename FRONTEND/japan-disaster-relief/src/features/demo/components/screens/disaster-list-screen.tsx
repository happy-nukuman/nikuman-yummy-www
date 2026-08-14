"use client";

import {
	DISASTER_INFO_ITEMS,
	DISASTER_SNAPSHOT_DATE,
	type DisasterInfoItem,
} from "@/features/demo/disaster-info";
import { dataSnapshotTimeText, type DemoLang, t } from "@/features/demo/i18n";
import { CheckIcon, OptionGlyph } from "@/features/demo/components/app-icons";

interface DisasterListScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 点击某条信息：进入该条灾害信息的详情页。 */
	onOpenDetail: (item: DisasterInfoItem) => void;
}

/**
 * 首页「灾害信息」磁贴的列表页：展示定位地点附近的公开灾害信息 Demo 快照。
 * demo 版数据固定在 disaster-info.ts，点击条目进入详情画面。
 */
export function DisasterListScreen({ active, lang, onOpenDetail }: DisasterListScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="disasters">
			<div className="question-count">{t(lang, "灾害信息")}</div>
			<h1 className="title-sm">{t(lang, "当前位置附近的灾害信息")}</h1>
			<p className="lead-sm">{t(lang, "以下为当前位置附近可参考的公开防灾信息，点击查看详情。")}</p>
			<div className="panel green">
				<div className="panel-row">
					<div className="panel-icon">
						<CheckIcon />
					</div>
					<div>
						<div className="panel-title">{t(lang, "新宿区当前没有生效中的气象警报・注意报")}</div>
						<div className="panel-copy">{t(lang, "以下为当前位置附近可参考的公开防灾信息")}</div>
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
							<OptionGlyph className="info-icon" name={item.icon} />
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
				<div className="source-label">{t(lang, "Demo 数据快照")}</div>
				<div className="source-value">
					{dataSnapshotTimeText(lang, DISASTER_SNAPSHOT_DATE)}
				</div>
				<div className="source-label">{t(lang, "数据来源")}</div>
				<div className="source-value">{t(lang, "日本气象厅、东京都防灾信息、内阁府防灾信息 等")}</div>
				<div className="source-note">{t(lang, "非实时信息，请以官方发布为准")}</div>
			</div>
		</section>
	);
}
