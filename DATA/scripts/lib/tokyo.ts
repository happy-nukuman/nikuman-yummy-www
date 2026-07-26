/**
 * Shared reference data and text helpers for the DATA pipelines.
 *
 * Kept in one place so `normalize-facilities.ts` and `normalize-stay-put-zones.ts`
 * cannot drift apart on municipality codes or SQL escaping.
 */

import { createHash } from "node:crypto";

/**
 * 総務省 全国地方公共団体コード (5 digits) for all 62 Tokyo municipalities.
 * The open data sources carry 6-digit codes with a check digit; stripping the
 * last digit yields these values, which the pipelines verify at runtime rather
 * than trusting this table blindly.
 */
export const TOKYO_MUNICIPALITIES: readonly (readonly [string, string])[] = [
	["13101", "千代田区"],
	["13102", "中央区"],
	["13103", "港区"],
	["13104", "新宿区"],
	["13105", "文京区"],
	["13106", "台東区"],
	["13107", "墨田区"],
	["13108", "江東区"],
	["13109", "品川区"],
	["13110", "目黒区"],
	["13111", "大田区"],
	["13112", "世田谷区"],
	["13113", "渋谷区"],
	["13114", "中野区"],
	["13115", "杉並区"],
	["13116", "豊島区"],
	["13117", "北区"],
	["13118", "荒川区"],
	["13119", "板橋区"],
	["13120", "練馬区"],
	["13121", "足立区"],
	["13122", "葛飾区"],
	["13123", "江戸川区"],
	["13201", "八王子市"],
	["13202", "立川市"],
	["13203", "武蔵野市"],
	["13204", "三鷹市"],
	["13205", "青梅市"],
	["13206", "府中市"],
	["13207", "昭島市"],
	["13208", "調布市"],
	["13209", "町田市"],
	["13210", "小金井市"],
	["13211", "小平市"],
	["13212", "日野市"],
	["13213", "東村山市"],
	["13214", "国分寺市"],
	["13215", "国立市"],
	["13218", "福生市"],
	["13219", "狛江市"],
	["13220", "東大和市"],
	["13221", "清瀬市"],
	["13222", "東久留米市"],
	["13223", "武蔵村山市"],
	["13224", "多摩市"],
	["13225", "稲城市"],
	["13227", "羽村市"],
	["13228", "あきる野市"],
	["13229", "西東京市"],
	["13303", "瑞穂町"],
	["13305", "日の出町"],
	["13307", "檜原村"],
	["13308", "奥多摩町"],
	["13361", "大島町"],
	["13362", "利島村"],
	["13363", "新島村"],
	["13364", "神津島村"],
	["13381", "三宅村"],
	["13382", "御蔵島村"],
	["13401", "八丈町"],
	["13402", "青ヶ島村"],
	["13421", "小笠原村"],
];

export const CODE_BY_MUNICIPALITY_NAME = new Map(TOKYO_MUNICIPALITIES.map(([code, name]) => [name, code]));
export const MUNICIPALITY_NAME_BY_CODE = new Map(TOKYO_MUNICIPALITIES.map(([code, name]) => [code, name]));

/** The 23 special wards, used for coverage reporting. */
export const SPECIAL_WARD_CODES = TOKYO_MUNICIPALITIES.filter(
	([code]) => code >= "13101" && code <= "13123",
).map(([code]) => code);

/** Longest-first so that e.g. 西東京市 wins over any shorter prefix. */
export const MUNICIPALITY_NAMES_LONGEST_FIRST = TOKYO_MUNICIPALITIES.map(([, name]) => name).sort(
	(a, b) => b.length - a.length,
);

/** Byte-order comparison; avoids locale/ICU differences so output stays stable. */
export function compareStrings(a: string, b: string): number {
	if (a < b) {
		return -1;
	}
	return a > b ? 1 : 0;
}

/** Header cells contain line breaks and ideographic spaces; strip all whitespace. */
export function normalizeHeader(value: string): string {
	// JavaScript's \s already covers the ideographic space U+3000.
	return value.replace(/\s+/g, "");
}

/** Collapse whitespace runs inside a value and trim the ends. */
export function normalizeValue(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

/** Escape a value for a single-quoted SQL literal. */
export function sqlString(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

export function sqlNullableString(value: string | undefined): string {
	return value === undefined ? "NULL" : sqlString(value);
}

export function sqlNullableNumber(value: number | null): string {
	return value === null ? "NULL" : String(value);
}

/** First `length` lowercase hex characters of the SHA-256 digest of `payload`. */
export function hashPrefix(payload: string, length: number): string {
	return createHash("sha256").update(payload, "utf8").digest("hex").slice(0, length);
}

/**
 * Cloudflare D1 rejects a single statement over roughly 100 KB with
 * SQLITE_TOOBIG, so stay comfortably below that. The sqlite3 CLI defaults to a
 * 1 MB limit and will happily run statements D1 refuses - always size-check
 * here rather than trusting a local sqlite3 run.
 */
export const MAX_SQL_STATEMENT_BYTES = 90_000;

/**
 * Group pre-rendered VALUES tuples into multi-row INSERT statements, bounded by
 * BOTH a row count and a byte budget.
 *
 * The byte budget is what protects D1: a polygon-heavy row can be tens of KB, so
 * a fixed row count is not enough. A row too large to ever fit is an error, not
 * something to silently drop or quietly re-simplify.
 */
export function buildInsertStatements(
	table: string,
	columns: string,
	rows: readonly string[],
	limits: { readonly maxRows: number; readonly maxBytes: number },
): string[] {
	const header = `INSERT INTO ${table} ${columns} VALUES`;
	const headerBytes = Buffer.byteLength(`${header}\n`, "utf8");
	// Worst case per row as it appears in the statement: tab, parens, separator.
	const rowBytes = (row: string): number => Buffer.byteLength(`\t(${row}),\n`, "utf8");

	const statements: string[] = [];
	const flush = (group: readonly string[]): void => {
		if (group.length === 0) {
			return;
		}
		const body = group
			.map((row, index) => `\t(${row})${index === group.length - 1 ? ";" : ","}`)
			.join("\n");
		statements.push(`${header}\n${body}`);
	};

	let group: string[] = [];
	let bytes = headerBytes;
	for (const row of rows) {
		const size = rowBytes(row);
		if (headerBytes + size > limits.maxBytes) {
			throw new Error(
				`A single ${table} row needs ${headerBytes + size} bytes, over the ${limits.maxBytes} byte ` +
					"statement budget. Reduce the row (e.g. simplify geometry) and say so in DATA/README.md; " +
					"do not drop it silently.",
			);
		}
		if (group.length > 0 && (group.length >= limits.maxRows || bytes + size > limits.maxBytes)) {
			flush(group);
			group = [];
			bytes = headerBytes;
		}
		group.push(row);
		bytes += size;
	}
	flush(group);
	return statements;
}
