import { isDisasterType, type DisasterAlert } from "@nikuman-yummy/shared";

export type DemoAlertRow = {
	id: string;
	type: string;
	title_ja: string;
	title_en: string | null;
	title_zh_hans: string | null;
	issued_at: string;
	source: string;
};

export type DemoAlertRepository = {
	list(): Promise<DisasterAlert[]>;
	create(alert: DisasterAlert): Promise<void>;
	clear(): Promise<number>;
};

const SELECT_COLUMNS = `SELECT
	id,
	type,
	title_ja,
	title_en,
	title_zh_hans,
	issued_at,
	source
FROM demo_alerts
ORDER BY issued_at DESC`;

/**
 * Tolerant row mapping: a row whose `type` is not a known DisasterType (for
 * example written by an older schema) is skipped instead of breaking the read.
 */
export function mapDemoAlertRow(row: DemoAlertRow): DisasterAlert | null {
	if (!isDisasterType(row.type)) {
		return null;
	}

	return {
		id: row.id,
		type: row.type,
		title: {
			ja: row.title_ja,
			...(row.title_en === null ? {} : { en: row.title_en }),
			...(row.title_zh_hans === null ? {} : { zhHans: row.title_zh_hans }),
		},
		issuedAt: row.issued_at,
		source: row.source,
	};
}

export class D1DemoAlertRepository implements DemoAlertRepository {
	constructor(private readonly database: D1Database) {}

	async list(): Promise<DisasterAlert[]> {
		const result = await this.database
			.prepare(SELECT_COLUMNS)
			.all<DemoAlertRow>();

		return result.results
			.map(mapDemoAlertRow)
			.filter((alert): alert is DisasterAlert => alert !== null);
	}

	async create(alert: DisasterAlert): Promise<void> {
		await this.database
			.prepare(
				`INSERT INTO demo_alerts (
					id,
					type,
					title_ja,
					title_en,
					title_zh_hans,
					issued_at,
					source
				) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				alert.id,
				alert.type,
				alert.title.ja,
				alert.title.en ?? null,
				alert.title.zhHans ?? null,
				alert.issuedAt,
				alert.source,
			)
			.run();
	}

	async clear(): Promise<number> {
		const result = await this.database
			.prepare("DELETE FROM demo_alerts")
			.run();

		return result.meta.changes;
	}
}
