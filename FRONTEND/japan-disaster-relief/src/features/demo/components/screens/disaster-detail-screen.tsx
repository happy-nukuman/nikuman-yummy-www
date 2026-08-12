"use client";

import type { DisasterInfoItem } from "@/features/demo/disaster-info";
import { type DemoLang, t } from "@/features/demo/i18n";

interface DisasterDetailScreenProps {
	active: boolean;
	lang: DemoLang;
	/** 列表页选中的那条灾害信息；未选中时本画面不渲染内容。 */
	item: DisasterInfoItem | null;
	onBack: () => void;
}

/** 灾害信息详情页：单条信息的概述、关键数据（发表时间・震源等）和建议行动。 */
export function DisasterDetailScreen({ active, lang, item, onBack }: DisasterDetailScreenProps) {
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
						<div className="source-label">{t(lang, "发表机关")}</div>
						<div className="source-value">{t(lang, item.source)}</div>
						<div className="source-note">{t(lang, "此信息仅供参考，请以实际情况为准。")}</div>
					</div>
				</>
			)}
			<div className="actions">
				<button type="button" className="btn ghost" onClick={onBack}>
					← {t(lang, "返回上一步")}
				</button>
			</div>
		</section>
	);
}
