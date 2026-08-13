"use client";

import {
	DISASTER_SNAPSHOT_DATE,
	type DisasterInfoItem,
} from "@/features/demo/disaster-info";
import { dataSnapshotTimeText, type DemoLang, t } from "@/features/demo/i18n";

interface DisasterDetailScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 列表页选中的那条灾害信息；未选中时本画面不渲染内容。 */
	item: DisasterInfoItem | null;
}

/** 灾害信息详情页：单条信息的概述、关键数据（发表时间・震源等）和建议行动。 */
export function DisasterDetailScreen({ active, lang, item }: DisasterDetailScreenProps) {
	return (
		<section className={`screen${active ? " active" : ""}`} data-screen="disaster-detail">
			{item && (
				<>
					<div className="question-count">{t(lang, "灾害信息")}</div>
					<div className="info-head">
						<span className="info-icon" aria-hidden>
							{item.icon}
						</span>
						<span className={`info-tag ${item.level}`}>{t(lang, item.category)}</span>
					</div>
					<h1 className="title-sm">{t(lang, item.title)}</h1>
					<p className="lead-sm">
						{t(lang, item.issuedAt)} · {t(lang, item.source)}
					</p>
					<div className="panel tint">
						<div className="panel-copy">{t(lang, item.lead)}</div>
					</div>
					<div className="panel">
						<div className="source-label">{t(lang, "详细信息")}</div>
						{item.facts.map(([label, value]) => (
							<div key={label} className="fact-row">
								<span className="fact-label">{t(lang, label)}</span>
								<span className="fact-value">{t(lang, value)}</span>
							</div>
						))}
					</div>
					<div className="panel green">
						<div className="source-label">{t(lang, "建议行动")}</div>
						<ul className="advice-list">
							{item.advice.map((advice) => (
								<li key={advice}>{t(lang, advice)}</li>
							))}
						</ul>
					</div>
					<div className="panel source-panel">
						<div className="source-label">{t(lang, "Demo 数据快照")}</div>
						<div className="source-value">
							{dataSnapshotTimeText(lang, DISASTER_SNAPSHOT_DATE)}
						</div>
						<div className="source-label">{t(lang, "数据来源")}</div>
						<div className="source-value">{t(lang, item.source)}</div>
						<div className="source-note">{t(lang, "非实时信息，请以官方发布为准")}</div>
					</div>
				</>
			)}
		</section>
	);
}
