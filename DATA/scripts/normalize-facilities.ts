/**
 * Build the Facility dataset used by BACKEND / SHARED from Tokyo open data.
 *
 * Sources (both CC BY 4.0, see DATA/README.md for the full ledger):
 *
 *   1. 東京都総務局総合防災部「東京都防災マップ 避難所・避難場所一覧データ」
 *      https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d0000000093
 *      DATA/raw/130001_evacuation_center.csv  (避難所   -> evacuation_shelter, Shift_JIS)
 *      DATA/raw/130001_evacuation_area.csv    (避難場所 -> evacuation_area,    UTF-8 BOM)
 *
 *   2. 東京都都市整備局「震災時火災における避難場所等の指定（第9回）」
 *      https://catalog.data.metro.tokyo.lg.jp/dataset/t000008d0000000013
 *      DATA/raw/hinan02_01_evacuation_area.xlsx      (名称・所在地)
 *      DATA/raw/hinan02_01_evacuation_area_shp.zip   (polygon geometry, EPSG:2451)
 *
 * Pipeline:
 *   Stage A  a 所在地 naming several wards yields one record per ward, instead of
 *            only the first ward. Recovers the cross-ward 広域避難場所 that were
 *            previously attributed to a single neighbouring ward.
 *   Stage B  merge the 都市整備局 designation (the legal source of 区部 広域避難場所)
 *            to add sites missing from the 総務局 extract - most importantly
 *            渋谷区, which has no rows of its own in source 1.
 *
 * Outputs:
 *   DATA/normalized/facilities.json
 *   DATA/normalized/facilities.meta.json
 *   DATA/normalized/facilities.seed.sql
 *
 * Run: npx tsx DATA/scripts/normalize-facilities.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Ring } from "./lib/binary-formats";
import {
	polygonCentroid,
	readDbf,
	readPolygonShapes,
	readWorkbook,
	readZipEntries,
	zone9ToWgs84,
} from "./lib/binary-formats";
import {
	CODE_BY_MUNICIPALITY_NAME,
	MAX_SQL_STATEMENT_BYTES,
	MUNICIPALITY_NAMES_LONGEST_FIRST,
	MUNICIPALITY_NAME_BY_CODE,
	SPECIAL_WARD_CODES,
	TOKYO_MUNICIPALITIES,
	buildInsertStatements,
	compareStrings,
	hashPrefix,
	normalizeHeader,
	normalizeValue,
	sqlNullableString,
	sqlString,
} from "./lib/tokyo";

// ---------------------------------------------------------------------------
// Sources. Keep in sync with the ledger in DATA/README.md.
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RAW_DIR = resolve(REPO_ROOT, "DATA", "raw");
const OUT_DIR = resolve(REPO_ROOT, "DATA", "normalized");

const ACQUIRED_AT = "2026-07-26";

type SourceDescriptor = {
	/** dataset_meta primary key. */
	readonly id: number;
	readonly name: string;
	readonly url: string;
	readonly updatedAt: string;
	readonly license: string;
	readonly attribution: string;
};

/** Publisher-mandated attribution: the dataset notes require this exact wording. */
const SOMUKYOKU: SourceDescriptor = {
	id: 1,
	name: "東京都総務局総合防災部「東京都防災マップ 避難所・避難場所一覧データ」",
	url: "https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d0000000093",
	updatedAt: "2023-06-05",
	license: "CC BY 4.0",
	attribution: "「避難所、避難場所データ オープンデータ」（東京都提供）",
};

/**
 * 第9回指定, 令和4年9月1日から適用. The publisher mandates no specific wording
 * (unlike source 1), so this is our own CC BY attribution naming the edition.
 * Per-record sourceUrl is the dataset page rather than a single file because a
 * record combines the xlsx (name, 所在地) with the shapefile (geometry).
 */
const TOSHISEIBI: SourceDescriptor = {
	id: 2,
	name: "東京都都市整備局「震災時火災における避難場所等の指定（第9回）」",
	url: "https://catalog.data.metro.tokyo.lg.jp/dataset/t000008d0000000013",
	updatedAt: "2022-09-01",
	license: "CC BY 4.0",
	attribution: "「震災時火災における避難場所等の指定（第9回）」（東京都都市整備局提供）",
};

const SOURCES: readonly SourceDescriptor[] = [SOMUKYOKU, TOSHISEIBI];

const TOSHISEIBI_WORKBOOK = "hinan02_01_evacuation_area.xlsx";
const TOSHISEIBI_SHAPES = "hinan02_01_evacuation_area_shp.zip";

/** Tokyo mainland bounding box mandated by the data contract. */
const LAT_MIN = 35.4;
const LAT_MAX = 36.0;
const LON_MIN = 138.7;
const LON_MAX = 140.1;

/** Row ceiling per INSERT; MAX_SQL_STATEMENT_BYTES also caps each statement. */
const SQL_BATCH_SIZE = 50;
/** First N hex characters of the SHA-256 digest used in facilityId. */
const FACILITY_ID_HASH_LENGTH = 8;
/**
 * Two records with the same facility type, municipality and 施設名 this close
 * together are the same place listed twice (the 都 and the 区 both list some
 * 広域避難場所). Same-name facilities further apart stay distinct.
 */
const DUPLICATE_RADIUS_METERS = 200;
/**
 * Stage B compares a polygon centroid against the 総務局 representative point,
 * which sit up to ~3.3 km apart on long river-corridor polygons. Distance is
 * therefore only used to reject coincidental name matches, not to confirm them.
 */
const STAGE_B_MAX_MATCH_METERS = 5000;
/** A subsequence name match must cover at least this fraction of the longer name. */
const SUBSEQUENCE_MIN_RATIO = 0.6;

type FacilityType = "evacuation_area" | "evacuation_shelter";

type CsvSourceFile = {
	readonly file: string;
	/** Direct download URL, recorded per record as sourceUrl. */
	readonly url: string;
	/** Publication date of this individual resource (ISO-8601 date). */
	readonly updatedAt: string;
	readonly facilityType: FacilityType;
	/** Normalized header labels (whitespace removed) used to locate columns. */
	readonly columns: {
		readonly name: string;
		readonly code: string;
		/** Municipality name column; "東京都" for prefecture-designated rows. */
		readonly municipality: string;
		readonly address: string;
		readonly latitude: string;
		readonly longitude: string;
		/** Accessibility flag columns marked with "○". */
		readonly accessibilityFlags: readonly { readonly header: string; readonly slug: string }[];
		/** Free-text accessibility column. */
		readonly accessibilityOther: string;
	};
};

const ACCESSIBILITY_FLAGS = [
	{ header: "エレベーター有/避難スペースが１階", slug: "elevator_or_ground_floor_space" },
	{ header: "スロープ等", slug: "slope" },
	{ header: "点字ブロック", slug: "braille_blocks" },
	{ header: "車椅子使用者対応トイレ", slug: "wheelchair_accessible_toilet" },
] as const;

const CSV_SOURCE_FILES: readonly CsvSourceFile[] = [
	{
		file: "130001_evacuation_center.csv",
		url: "https://www.opendata.metro.tokyo.lg.jp/soumu/130001_evacuation_center.csv",
		updatedAt: "2022-06-20",
		facilityType: "evacuation_shelter",
		columns: {
			name: "避難所_施設名称",
			code: "地方公共団体コード",
			municipality: "指定市区町村名",
			address: "所在地住所",
			latitude: "緯度",
			longitude: "経度",
			accessibilityFlags: ACCESSIBILITY_FLAGS,
			accessibilityOther: "その他",
		},
	},
	{
		file: "130001_evacuation_area.csv",
		url: "https://www.opendata.metro.tokyo.lg.jp/soumu/130001_evacuation_area.csv",
		updatedAt: "2023-06-05",
		facilityType: "evacuation_area",
		columns: {
			name: "施設名",
			code: "区市町村コード",
			municipality: "区市町村",
			address: "所在地住所",
			latitude: "緯度",
			longitude: "経度",
			accessibilityFlags: ACCESSIBILITY_FLAGS,
			accessibilityOther: "その他（具体的に）",
		},
	},
];

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Decode UTF-8 (with or without BOM) or Shift_JIS, detected by content. */
export function decodeCsvBuffer(buffer: Buffer): { encoding: "utf-8" | "shift_jis"; text: string } {
	const bytes = new Uint8Array(buffer);
	try {
		const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		return { encoding: "utf-8", text: text.charCodeAt(0) === 0xfeff ? text.slice(1) : text };
	} catch {
		return { encoding: "shift_jis", text: new TextDecoder("shift_jis").decode(bytes) };
	}
}

/** Minimal RFC 4180 CSV reader: quoted fields, escaped quotes, embedded newlines. */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;

	const endField = (): void => {
		row.push(field);
		field = "";
	};
	const endRow = (): void => {
		endField();
		rows.push(row);
		row = [];
	};

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		if (inQuotes) {
			if (char !== '"') {
				field += char;
			} else if (text[i + 1] === '"') {
				field += '"';
				i += 1;
			} else {
				inQuotes = false;
			}
			continue;
		}
		if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			endField();
		} else if (char === "\n") {
			endRow();
		} else if (char === "\r") {
			if (text[i + 1] === "\n") {
				i += 1;
			}
			endRow();
		} else {
			field += char;
		}
	}
	if (field !== "" || row.length > 0) {
		endRow();
	}
	return rows;
}

function isBlankRow(row: readonly string[]): boolean {
	return row.every((cell) => cell.trim() === "");
}

/** Equirectangular approximation, accurate enough for the radii used here. */
export function approximateDistanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
	const meanLatRadians = (((aLat + bLat) / 2) * Math.PI) / 180;
	const northing = (bLat - aLat) * 111_320;
	const easting = (bLon - aLon) * 111_320 * Math.cos(meanLatRadians);
	return Math.hypot(northing, easting);
}

/**
 * Leading non-numeric token of an address remainder, used to resolve rows whose
 * address omits the municipality (e.g. "滝野川3-72-1"). ヶ/ケ are unified because
 * the sources mix them (箱根ケ崎 / 箱根ヶ崎).
 */
export function addressToken(rest: string): string | null {
	const match = /^[^\s0-9０-９]+/.exec(rest.trim());
	return match ? match[0].replace(/ヶ/g, "ケ") : null;
}

/**
 * Strip an optional 東京都 and 郡 prefix, then return the Tokyo municipality the
 * address segment starts with plus the remaining text.
 */
export function splitAddress(address: string): { municipality: string | null; rest: string } {
	let rest = address.trim().replace(/^東京都/, "");
	rest = rest.replace(/^[^\s0-9０-９]{1,4}郡/, "");
	for (const name of MUNICIPALITY_NAMES_LONGEST_FIRST) {
		if (rest.startsWith(name)) {
			return { municipality: name, rest: rest.slice(name.length) };
		}
	}
	return { municipality: null, rest };
}

/**
 * Every municipality named in an 所在地, in order of appearance (Stage A).
 *
 * The sources list the wards a 広域避難場所 spans as "、"-separated (CSV) or
 * newline-separated (xlsx) segments, e.g.
 *   "港区北青山、新宿区霞ヶ丘町、渋谷区神宮前、千駄ケ谷" -> 港区, 新宿区, 渋谷区
 * Matching only at the start of each segment avoids false hits on 町-suffixed
 * chōme names such as 岩淵町 or 代々木神園町.
 *
 * 及び／並びに are also separators: 国営昭和記念公園 is recorded as
 * "立川市緑町、泉町地内及び昭島市もくせいの杜3丁目" and spans both municipalities.
 */
export function addressMunicipalityCodes(address: string): string[] {
	const codes: string[] = [];
	for (const segment of address.split(/[、\r\n]+|及び|並びに|ならびに/)) {
		const { municipality } = splitAddress(segment);
		if (municipality === null) {
			continue;
		}
		const code = CODE_BY_MUNICIPALITY_NAME.get(municipality);
		if (code !== undefined && !codes.includes(code)) {
			codes.push(code);
		}
	}
	return codes;
}

/**
 * Aggressive name key for Stage B matching: NFKC, drop parenthesised suffixes,
 * middots, whitespace, and unify ヶ/ヵ. Deliberately lossier than the name we
 * store, which stays verbatim.
 */
export function normalizedFacilityName(name: string): string {
	return name
		.normalize("NFKC")
		.replace(/\([^)]*\)/g, "")
		.replace(/[・･]/g, "")
		.replace(/\s+/g, "")
		.replace(/ヶ/g, "ケ")
		.replace(/ヵ/g, "カ");
}

function isSubsequence(short: string, long: string): boolean {
	let index = 0;
	for (const char of long) {
		if (char === short[index]) {
			index += 1;
			if (index === short.length) {
				return true;
			}
		}
	}
	return index === short.length;
}

/**
 * How two normalized facility names relate, or null when they are different
 * places. Containment and subsequence catch the naming variants between the two
 * publishers, e.g. 水元公園 / 水元公園・江戸川緑地一帯 (containment) and
 * 練馬総合運動場一帯 / 練馬総合運動場公園一帯 (subsequence).
 */
export function nameMatchKind(a: string, b: string): "exact" | "containment" | "subsequence" | null {
	if (a === b) {
		return "exact";
	}
	if (a === "" || b === "") {
		return null;
	}
	const [short, long] = a.length <= b.length ? [a, b] : [b, a];
	if (long.includes(short)) {
		return "containment";
	}
	if (short.length / long.length >= SUBSEQUENCE_MIN_RATIO && isSubsequence(short, long)) {
		return "subsequence";
	}
	return null;
}

/**
 * facilityId = `<municipalityId>-<first 8 hex of SHA-256>` over
 *   `<municipalityId>|<facilityType>|<NFKC name.ja>|<NFKC address>`
 * Content-addressed, so ids survive data refreshes and re-ordering. Global
 * uniqueness is asserted at build time.
 */
export function facilityId(
	municipalityId: string,
	facilityType: FacilityType,
	nameJa: string,
	address: string,
): string {
	const payload = [municipalityId, facilityType, nameJa.normalize("NFKC"), address.normalize("NFKC")].join("|");
	return `${municipalityId}-${hashPrefix(payload, FACILITY_ID_HASH_LENGTH)}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawRow = {
	readonly source: CsvSourceFile;
	readonly name: string;
	readonly sourceCode: string;
	readonly municipalityName: string;
	readonly address: string;
	readonly latitude: string;
	readonly longitude: string;
	readonly accessibility: string[];
};

type Facility = {
	facilityId: string;
	name: { ja: string; en?: string; zhHans?: string };
	facilityType: FacilityType;
	municipalityId: string;
	address: string;
	latitude: number;
	longitude: number;
	accessibility: string[];
	sourceUrl: string;
	sourceUpdatedAt: string;
};

type Candidate = Omit<Facility, "facilityId"> & { readonly nameKey: string };

type Counter = Map<string, number>;

function bump(counter: Counter, key: string, by = 1): void {
	counter.set(key, (counter.get(key) ?? 0) + by);
}

function counterTotal(counter: Counter): number {
	let total = 0;
	for (const value of counter.values()) {
		total += value;
	}
	return total;
}

type Summary = {
	csvFiles: { file: string; encoding: string; totalRows: number; blankRows: number }[];
	skipped: Counter;
	resolvedVia: Counter;
	codeMismatches: Counter;
	stageAExtraByWard: Counter;
	stageAMultiWardRows: number;
	stageADuplicatesDropped: number;
	somuDeduped: number;
	toshiseibiRecords: number;
	toshiseibiEmitted: number;
	toshiseibiMatched: Counter;
	toshiseibiAdded: number;
	toshiseibiSkipped: Counter;
	toshiseibiAddedByWard: Counter;
	perType: Counter;
	perMunicipality: Counter;
};

// ---------------------------------------------------------------------------
// Source 1: 総務局 CSVs
// ---------------------------------------------------------------------------

/** Locate the header row (the files start with blank spacer rows) and index it. */
function indexHeader(
	rows: readonly string[][],
	source: CsvSourceFile,
): { headerIndex: number; columns: Map<string, number> } {
	for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
		const normalized = rows[i].map(normalizeHeader);
		if (!normalized.includes(source.columns.name)) {
			continue;
		}
		const columns = new Map<string, number>();
		normalized.forEach((header, index) => {
			if (header !== "" && !columns.has(header)) {
				columns.set(header, index);
			}
		});
		return { headerIndex: i, columns };
	}
	throw new Error(`${source.file}: could not find a header row containing "${source.columns.name}".`);
}

function requireColumn(columns: Map<string, number>, header: string, file: string): number {
	const index = columns.get(header);
	if (index === undefined) {
		throw new Error(`${file}: missing expected column "${header}". Columns: ${[...columns.keys()].join(" | ")}`);
	}
	return index;
}

async function readCsvRows(
	source: CsvSourceFile,
): Promise<{ rows: RawRow[]; totalRows: number; blankRows: number; encoding: string }> {
	const buffer = await readFile(resolve(RAW_DIR, source.file));
	const { encoding, text } = decodeCsvBuffer(buffer);
	const csv = parseCsv(text);
	const { headerIndex, columns } = indexHeader(csv, source);
	const spec = source.columns;

	const nameIndex = requireColumn(columns, spec.name, source.file);
	const codeIndex = requireColumn(columns, spec.code, source.file);
	const municipalityIndex = requireColumn(columns, spec.municipality, source.file);
	const addressIndex = requireColumn(columns, spec.address, source.file);
	const latitudeIndex = requireColumn(columns, spec.latitude, source.file);
	const longitudeIndex = requireColumn(columns, spec.longitude, source.file);
	const otherIndex = requireColumn(columns, spec.accessibilityOther, source.file);
	const flagIndexes = spec.accessibilityFlags.map((flag) => ({
		slug: flag.slug,
		index: requireColumn(columns, flag.header, source.file),
	}));

	const rows: RawRow[] = [];
	let blankRows = 0;
	let totalRows = 0;

	for (let i = headerIndex + 1; i < csv.length; i += 1) {
		const row = csv[i];
		if (isBlankRow(row)) {
			blankRows += 1;
			continue;
		}
		totalRows += 1;
		const accessibility: string[] = [];
		for (const flag of flagIndexes) {
			if (normalizeValue(row[flag.index] ?? "") !== "") {
				accessibility.push(flag.slug);
			}
		}
		const other = normalizeValue(row[otherIndex] ?? "");
		if (other !== "") {
			accessibility.push(`other:${other}`);
		}
		rows.push({
			source,
			name: normalizeValue(row[nameIndex] ?? ""),
			sourceCode: normalizeValue(row[codeIndex] ?? ""),
			municipalityName: normalizeValue(row[municipalityIndex] ?? ""),
			address: normalizeValue(row[addressIndex] ?? ""),
			latitude: normalizeValue(row[latitudeIndex] ?? ""),
			longitude: normalizeValue(row[longitudeIndex] ?? ""),
			accessibility,
		});
	}

	return { rows, totalRows, blankRows, encoding };
}

/**
 * Guard against a stale TOKYO_MUNICIPALITIES table: every 5-digit code derived
 * from the sources' own 6-digit codes must exist in the table.
 */
function assertMunicipalityTableMatchesSource(rows: readonly RawRow[]): void {
	const unknown = new Set<string>();
	for (const row of rows) {
		if (!/^\d{6}$/.test(row.sourceCode)) {
			continue;
		}
		const code = row.sourceCode.slice(0, 5);
		// 13000 is the prefecture itself (東京都-designated rows), not a municipality.
		if (code !== "13000" && !MUNICIPALITY_NAME_BY_CODE.has(code)) {
			unknown.add(`${row.sourceCode} (${row.municipalityName})`);
		}
	}
	if (unknown.size > 0) {
		throw new Error(
			`Source contains municipality codes missing from TOKYO_MUNICIPALITIES: ${[...unknown].join(", ")}`,
		);
	}
}

type Resolution = {
	municipalityId: string;
	via: "municipality_name" | "address_prefix" | "address_token_index";
};

/**
 * Build a 町名 -> municipality index purely from rows that already resolved, so
 * that prefix-less addresses can be resolved from the dataset itself rather
 * than from outside knowledge. Ambiguous tokens are dropped.
 */
function buildAddressTokenIndex(rows: readonly RawRow[]): Map<string, string> {
	const candidates = new Map<string, Set<string>>();
	for (const row of rows) {
		const { municipality, rest } = splitAddress(row.address);
		if (municipality === null) {
			continue;
		}
		const token = addressToken(rest);
		const code = CODE_BY_MUNICIPALITY_NAME.get(municipality);
		if (token === null || code === undefined) {
			continue;
		}
		const set = candidates.get(token) ?? new Set<string>();
		set.add(code);
		candidates.set(token, set);
	}
	const index = new Map<string, string>();
	for (const [token, codes] of candidates) {
		if (codes.size === 1) {
			index.set(token, [...codes][0]);
		}
	}
	return index;
}

function resolveMunicipality(row: RawRow, tokenIndex: Map<string, string>): Resolution | null {
	const byName = CODE_BY_MUNICIPALITY_NAME.get(row.municipalityName);
	if (byName !== undefined) {
		return { municipalityId: byName, via: "municipality_name" };
	}
	const { municipality, rest } = splitAddress(row.address);
	if (municipality !== null) {
		const code = CODE_BY_MUNICIPALITY_NAME.get(municipality);
		if (code !== undefined) {
			return { municipalityId: code, via: "address_prefix" };
		}
	}
	const token = addressToken(rest);
	if (token !== null) {
		const code = tokenIndex.get(token);
		if (code !== undefined) {
			return { municipalityId: code, via: "address_token_index" };
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Source 2: 都市整備局 designation (xlsx attributes + shapefile geometry)
// ---------------------------------------------------------------------------

type DesignatedArea = {
	readonly number: string;
	readonly name: string;
	readonly address: string;
	readonly latitude: number;
	readonly longitude: number;
};

/** Pick exactly the 避難場所 layer; the archive also holds a 地区割当 layer. */
function findShapefileMember(entries: Map<string, Buffer>, extension: string): Buffer {
	const matches = [...entries.keys()].filter(
		(name) => basename(name) === `第９回避難場所${extension}` || basename(name) === `第9回避難場所${extension}`,
	);
	if (matches.length !== 1) {
		throw new Error(
			`${TOSHISEIBI_SHAPES}: expected exactly one "避難場所${extension}" member, found ${matches.length}: ${[
				...entries.keys(),
			].join(", ")}`,
		);
	}
	return entries.get(matches[0])!;
}

async function readDesignatedAreas(): Promise<DesignatedArea[]> {
	const workbook = readWorkbook(await readFile(resolve(RAW_DIR, TOSHISEIBI_WORKBOOK)));
	const sheet = workbook.find((candidate) =>
		candidate.rows.some((row) => row.map(normalizeHeader).includes("避難場所名称")),
	);
	if (sheet === undefined) {
		throw new Error(`${TOSHISEIBI_WORKBOOK}: no worksheet contains a 避難場所名称 header.`);
	}
	const headerIndex = sheet.rows.findIndex((row) => row.map(normalizeHeader).includes("避難場所名称"));
	const header = sheet.rows[headerIndex].map(normalizeHeader);
	const numberIndex = header.indexOf("番号");
	const nameIndex = header.indexOf("避難場所名称");
	const addressIndex = header.indexOf("所在地");
	if (numberIndex < 0 || nameIndex < 0 || addressIndex < 0) {
		throw new Error(`${TOSHISEIBI_WORKBOOK}: expected 番号 / 避難場所名称 / 所在地 columns, got ${header.join(" | ")}`);
	}

	// Attribute rows carry a 番号; the rows in between are 地区割当 continuations.
	const attributes = new Map<string, { name: string; address: string }>();
	for (const row of sheet.rows.slice(headerIndex + 1)) {
		const number = (row[numberIndex] ?? "").trim();
		if (!/^\d+$/.test(number)) {
			continue;
		}
		attributes.set(number, {
			name: normalizeValue(row[nameIndex] ?? ""),
			// Wards are newline-separated in the workbook; "、" matches the CSV style
			// so that a single Stage A splitter handles both sources.
			address: normalizeValue((row[addressIndex] ?? "").replace(/[\r\n]+/g, "、")),
		});
	}

	const entries = readZipEntries(await readFile(resolve(RAW_DIR, TOSHISEIBI_SHAPES)));
	const records = readDbf(findShapefileMember(entries, ".dbf"));
	const shapes = readPolygonShapes(findShapefileMember(entries, ".shp"));
	if (records.length !== shapes.length) {
		throw new Error(`${TOSHISEIBI_SHAPES}: ${records.length} dbf records but ${shapes.length} shapes.`);
	}

	const areas: DesignatedArea[] = [];
	for (let i = 0; i < records.length; i += 1) {
		const number = (records[i]["避難場所番"] ?? "").trim();
		const rings: Ring[] | null = shapes[i];
		const attribute = attributes.get(number);
		if (attribute === undefined) {
			throw new Error(`${TOSHISEIBI_SHAPES}: shapefile record 番号 ${number} is absent from the workbook.`);
		}
		if (rings === null) {
			throw new Error(`${TOSHISEIBI_SHAPES}: 番号 ${number} has no polygon geometry.`);
		}
		const [easting, northing] = polygonCentroid(rings);
		const [latitude, longitude] = zone9ToWgs84(easting, northing);
		areas.push({ number, name: attribute.name, address: attribute.address, latitude, longitude });
	}
	if (areas.length !== attributes.size) {
		throw new Error(
			`${TOSHISEIBI_WORKBOOK}: ${attributes.size} workbook records but ${areas.length} matched geometries.`,
		);
	}
	// Sort by 番号 so the merge order never depends on file layout.
	areas.sort((a, b) => Number(a.number) - Number(b.number));
	return areas;
}

// ---------------------------------------------------------------------------
// Stage A + validation + dedupe (source 1)
// ---------------------------------------------------------------------------

/**
 * Prefer the record with the more specific address (the 区 rows carry a full
 * 丁目/番地, the 都-designated rows often only a 町名); ties fall back to the
 * name key so the choice never depends on input order.
 */
function isMoreSpecific(candidate: Candidate, incumbent: Candidate): boolean {
	if (candidate.address.length !== incumbent.address.length) {
		return candidate.address.length > incumbent.address.length;
	}
	// Within a group the 施設名 is identical, so break ties on the remaining
	// content to keep the winner independent of input order.
	const key = (item: Candidate): string =>
		`${item.address}|${item.latitude.toFixed(6)}|${item.longitude.toFixed(6)}|${item.sourceUrl}`;
	return compareStrings(key(candidate), key(incumbent)) < 0;
}

type CandidateStore = {
	readonly all: Candidate[];
	/** `facilityType|municipalityId|name.ja` -> candidates, for dedupe lookups. */
	readonly groups: Map<string, Candidate[]>;
};

/**
 * Dedupe groups on the *verbatim* 施設名, not the normalized match key: the
 * parenthesised part is load-bearing within a municipality. Merging on the
 * normalized key would collapse 三鷹市「第一小学校（体育館・校舎）」/「（校庭）」
 * and, worse, 町田市「ゆくのき学園（武蔵岡中学校）」/「（大戸小学校）」 - two
 * different schools 150 m apart. The looser key is used only by Stage B, where
 * it reconciles naming differences *between* the two publishers.
 */
function groupKey(facilityType: FacilityType, municipalityId: string, nameJa: string): string {
	return `${facilityType}|${municipalityId}|${nameJa}`;
}

/** Add a candidate unless an equivalent one is already present within the radius. */
function addCandidate(store: CandidateStore, candidate: Candidate, radiusMeters: number): "added" | "duplicate" {
	const key = groupKey(candidate.facilityType, candidate.municipalityId, candidate.name.ja);
	const group = store.groups.get(key) ?? [];
	const twin = group.find(
		(other) =>
			approximateDistanceMeters(other.latitude, other.longitude, candidate.latitude, candidate.longitude) <=
			radiusMeters,
	);
	if (twin !== undefined) {
		if (isMoreSpecific(candidate, twin)) {
			store.all[store.all.indexOf(twin)] = candidate;
			group[group.indexOf(twin)] = candidate;
		}
		return "duplicate";
	}
	group.push(candidate);
	store.groups.set(key, group);
	store.all.push(candidate);
	return "added";
}

function buildSomuCandidates(rawRows: readonly RawRow[], summary: Summary): CandidateStore {
	const tokenIndex = buildAddressTokenIndex(rawRows);
	const store: CandidateStore = { all: [], groups: new Map() };

	for (const row of rawRows) {
		if (row.name === "") {
			bump(summary.skipped, "missing_name");
			continue;
		}
		if (row.address === "") {
			bump(summary.skipped, "missing_address");
			continue;
		}

		const resolution = resolveMunicipality(row, tokenIndex);
		if (resolution === null) {
			bump(summary.skipped, "municipality_unresolved");
			continue;
		}
		if (
			!/^13\d{3}$/.test(resolution.municipalityId) ||
			!MUNICIPALITY_NAME_BY_CODE.has(resolution.municipalityId)
		) {
			bump(summary.skipped, "invalid_municipality_code");
			continue;
		}

		const latitude = Number(row.latitude);
		const longitude = Number(row.longitude);
		if (row.latitude === "" || row.longitude === "" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
			bump(summary.skipped, "missing_or_unparsable_coordinates");
			continue;
		}
		if (latitude < LAT_MIN || latitude > LAT_MAX || longitude < LON_MIN || longitude > LON_MAX) {
			bump(summary.skipped, "coordinates_outside_tokyo_mainland_bbox");
			continue;
		}

		bump(summary.resolvedVia, resolution.via);

		// Record (do not "fix") rows whose own code column contradicts the name.
		if (/^\d{6}$/.test(row.sourceCode)) {
			const stripped = row.sourceCode.slice(0, 5);
			if (stripped !== "13000" && stripped !== resolution.municipalityId) {
				bump(
					summary.codeMismatches,
					`${row.source.facilityType}: code ${row.sourceCode}->${stripped} (${
						MUNICIPALITY_NAME_BY_CODE.get(stripped) ?? "?"
					}) vs name/address ${resolution.municipalityId} (${MUNICIPALITY_NAME_BY_CODE.get(
						resolution.municipalityId,
					)})`,
				);
			}
		}

		// Stage A: a 所在地 naming several wards belongs to all of them. A single
		// named ward never overrides the (authoritative) municipality column.
		const named = addressMunicipalityCodes(row.address);
		const emitFor =
			named.length >= 2
				? [resolution.municipalityId, ...named.filter((code) => code !== resolution.municipalityId)]
				: [resolution.municipalityId];
		if (named.length >= 2) {
			summary.stageAMultiWardRows += 1;
		}

		emitFor.forEach((municipalityId, index) => {
			const candidate: Candidate = {
				name: { ja: row.name },
				facilityType: row.source.facilityType,
				municipalityId,
				address: row.address,
				latitude,
				longitude,
				accessibility: row.accessibility,
				sourceUrl: row.source.url,
				sourceUpdatedAt: row.source.updatedAt,
				nameKey: normalizedFacilityName(row.name),
			};
			const outcome = addCandidate(store, candidate, DUPLICATE_RADIUS_METERS);
			if (outcome === "duplicate") {
				if (index === 0) {
					summary.somuDeduped += 1;
				} else {
					summary.stageADuplicatesDropped += 1;
				}
				return;
			}
			if (index > 0) {
				bump(summary.stageAExtraByWard, municipalityId);
			}
		});
	}
	return store;
}

// ---------------------------------------------------------------------------
// Stage B: merge the 都市整備局 designation
// ---------------------------------------------------------------------------

function mergeDesignatedAreas(store: CandidateStore, areas: readonly DesignatedArea[], summary: Summary): void {
	summary.toshiseibiRecords = areas.length;

	/** Existing evacuation_area candidates by municipality, for name matching. */
	const byMunicipality = new Map<string, Candidate[]>();
	for (const candidate of store.all) {
		if (candidate.facilityType !== "evacuation_area") {
			continue;
		}
		const bucket = byMunicipality.get(candidate.municipalityId) ?? [];
		bucket.push(candidate);
		byMunicipality.set(candidate.municipalityId, bucket);
	}

	for (const area of areas) {
		if (area.name === "" || area.address === "") {
			bump(summary.toshiseibiSkipped, "missing_name_or_address");
			continue;
		}
		if (
			area.latitude < LAT_MIN ||
			area.latitude > LAT_MAX ||
			area.longitude < LON_MIN ||
			area.longitude > LON_MAX
		) {
			bump(summary.toshiseibiSkipped, "coordinates_outside_tokyo_mainland_bbox");
			continue;
		}
		const municipalities = addressMunicipalityCodes(area.address);
		if (municipalities.length === 0) {
			bump(summary.toshiseibiSkipped, "municipality_unresolved");
			continue;
		}

		const nameKey = normalizedFacilityName(area.name);
		for (const municipalityId of municipalities) {
			summary.toshiseibiEmitted += 1;
			const existing = byMunicipality.get(municipalityId) ?? [];
			let matched: { kind: string; candidate: Candidate } | null = null;
			for (const candidate of existing) {
				const kind = nameMatchKind(nameKey, candidate.nameKey);
				if (kind === null) {
					continue;
				}
				// Distance only rejects coincidental name matches.
				const distance = approximateDistanceMeters(
					candidate.latitude,
					candidate.longitude,
					area.latitude,
					area.longitude,
				);
				if (distance > STAGE_B_MAX_MATCH_METERS) {
					continue;
				}
				if (matched === null || kind === "exact") {
					matched = { kind, candidate };
				}
				if (kind === "exact") {
					break;
				}
			}

			if (matched !== null) {
				// Keep the 総務局 record: finer address plus accessibility flags.
				bump(summary.toshiseibiMatched, matched.kind);
				continue;
			}

			const candidate: Candidate = {
				name: { ja: area.name },
				facilityType: "evacuation_area",
				municipalityId,
				address: area.address,
				latitude: area.latitude,
				longitude: area.longitude,
				accessibility: [],
				sourceUrl: TOSHISEIBI.url,
				sourceUpdatedAt: TOSHISEIBI.updatedAt,
				nameKey,
			};
			const outcome = addCandidate(store, candidate, DUPLICATE_RADIUS_METERS);
			if (outcome === "duplicate") {
				bump(summary.toshiseibiMatched, "proximity");
				continue;
			}
			summary.toshiseibiAdded += 1;
			bump(summary.toshiseibiAddedByWard, municipalityId);
			const bucket = byMunicipality.get(municipalityId) ?? [];
			bucket.push(candidate);
			byMunicipality.set(municipalityId, bucket);
		}
	}
}

// ---------------------------------------------------------------------------
// Finalisation
// ---------------------------------------------------------------------------

function finalise(store: CandidateStore, summary: Summary): Facility[] {
	const facilities: Facility[] = store.all.map((candidate) => ({
		facilityId: facilityId(
			candidate.municipalityId,
			candidate.facilityType,
			candidate.name.ja,
			candidate.address,
		),
		name: candidate.name,
		facilityType: candidate.facilityType,
		municipalityId: candidate.municipalityId,
		address: candidate.address,
		latitude: candidate.latitude,
		longitude: candidate.longitude,
		accessibility: candidate.accessibility,
		sourceUrl: candidate.sourceUrl,
		sourceUpdatedAt: candidate.sourceUpdatedAt,
	}));

	const seen = new Map<string, Facility>();
	for (const facility of facilities) {
		const clash = seen.get(facility.facilityId);
		if (clash !== undefined) {
			throw new Error(
				`facilityId collision on ${facility.facilityId}: ` +
					`"${clash.name.ja}" @ ${clash.address} vs "${facility.name.ja}" @ ${facility.address}. ` +
					"Resolve the source data or lengthen FACILITY_ID_HASH_LENGTH deliberately.",
			);
		}
		seen.set(facility.facilityId, facility);
	}

	facilities.sort(
		(a, b) =>
			compareStrings(a.municipalityId, b.municipalityId) ||
			compareStrings(a.name.ja, b.name.ja) ||
			compareStrings(a.facilityType, b.facilityType) ||
			compareStrings(a.address, b.address),
	);

	for (const facility of facilities) {
		bump(summary.perType, facility.facilityType);
		bump(summary.perMunicipality, facility.municipalityId);
	}
	return facilities;
}

function buildSeedSql(facilities: readonly Facility[]): string {
	const lines: string[] = [
		"-- Generated by DATA/scripts/normalize-facilities.ts. Do not edit by hand.",
		"-- Sources (both CC BY 4.0):",
		...SOURCES.map((source) => `--   ${source.id}. ${source.name} <${source.url}> updated ${source.updatedAt}`),
		`-- Acquired ${ACQUIRED_AT}. Static data: no realtime open status (realtime = 0).`,
		"",
		"DELETE FROM facilities;",
		"DELETE FROM dataset_meta;",
		"",
	];

	const columns =
		"(facility_id, name_ja, name_en, name_zh_hans, facility_type, municipality_id, address, latitude, longitude, accessibility, source_url, source_updated_at)";

	const values = facilities.map((facility) => {
		const accessibility =
			facility.accessibility.length > 0 ? sqlString(JSON.stringify(facility.accessibility)) : "NULL";
		return [
			sqlString(facility.facilityId),
			sqlString(facility.name.ja),
			sqlNullableString(facility.name.en),
			sqlNullableString(facility.name.zhHans),
			sqlString(facility.facilityType),
			sqlString(facility.municipalityId),
			sqlString(facility.address),
			String(facility.latitude),
			String(facility.longitude),
			accessibility,
			sqlString(facility.sourceUrl),
			sqlString(facility.sourceUpdatedAt),
		].join(", ");
	});
	for (const statement of buildInsertStatements("facilities", columns, values, {
		maxRows: SQL_BATCH_SIZE,
		maxBytes: MAX_SQL_STATEMENT_BYTES,
	})) {
		lines.push(statement);
		lines.push("");
	}

	lines.push(
		"INSERT INTO dataset_meta (id, source_name, source_url, source_updated_at, license, acquired_at, realtime, attribution) VALUES",
	);
	lines.push(
		SOURCES.map((source, index) => {
			const row = [
				String(source.id),
				sqlString(source.name),
				sqlString(source.url),
				sqlString(source.updatedAt),
				sqlString(source.license),
				sqlString(ACQUIRED_AT),
				"0",
				sqlString(source.attribution),
			].join(", ");
			return `\t(${row})${index === SOURCES.length - 1 ? ";" : ","}`;
		}).join("\n"),
	);
	lines.push("");
	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function printCounter(counter: Counter, indent = "  "): void {
	if (counter.size === 0) {
		console.log(`${indent}(none)`);
		return;
	}
	for (const [key, value] of [...counter.entries()].sort((a, b) => b[1] - a[1] || compareStrings(a[0], b[0]))) {
		console.log(`${indent}${key}: ${value}`);
	}
}

function wardLabel(code: string): string {
	return `${code} ${MUNICIPALITY_NAME_BY_CODE.get(code) ?? "?"}`;
}

function printSummary(summary: Summary, facilities: readonly Facility[]): void {
	console.log("=== Source 1: 東京都総務局 CSVs ===");
	for (const entry of summary.csvFiles) {
		console.log(
			`  ${entry.file}: encoding=${entry.encoding} data rows=${entry.totalRows} (blank rows ignored: ${entry.blankRows})`,
		);
	}
	const totalCsvRows = summary.csvFiles.reduce((total, entry) => total + entry.totalRows, 0);
	const totalSkipped = counterTotal(summary.skipped);
	const stageAExtras = counterTotal(summary.stageAExtraByWard);
	const validRows = totalCsvRows - totalSkipped;
	const somuKept = validRows + stageAExtras + summary.stageADuplicatesDropped - summary.somuDeduped;

	console.log("\n  rows read:            " + totalCsvRows);
	console.log("  rows skipped:         " + totalSkipped);
	console.log("  rows valid:           " + validRows);
	console.log("  Stage A multi-ward rows:      " + summary.stageAMultiWardRows);
	console.log("  Stage A extra records kept:   " + stageAExtras);
	console.log("  Stage A extra records deduped:" + summary.stageADuplicatesDropped);
	console.log("  primary records deduped:      " + summary.somuDeduped);
	console.log("  source 1 records kept:        " + somuKept);

	console.log("\n=== Skipped by reason (source 1) ===");
	printCounter(summary.skipped);

	console.log("\n=== Municipality resolved via (source 1) ===");
	printCounter(summary.resolvedVia);

	console.log("\n=== Source code/name disagreements (kept, name+address win) ===");
	printCounter(summary.codeMismatches);

	console.log("\n=== Stage A: extra records by ward ===");
	if (summary.stageAExtraByWard.size === 0) {
		console.log("  (none)");
	} else {
		for (const [code, count] of [...summary.stageAExtraByWard.entries()].sort((a, b) =>
			compareStrings(a[0], b[0]),
		)) {
			console.log(`  ${wardLabel(code)}: ${count}`);
		}
	}

	console.log("\n=== Source 2: 東京都都市整備局 第9回指定 (Stage B) ===");
	console.log(`  designated 避難場所 in source:  ${summary.toshiseibiRecords}`);
	console.log(`  ward-level records emitted:     ${summary.toshiseibiEmitted}`);
	console.log(`  matched existing (not re-added):${counterTotal(summary.toshiseibiMatched)}`);
	printCounter(summary.toshiseibiMatched, "    by ");
	console.log(`  newly added:                    ${summary.toshiseibiAdded}`);
	if (summary.toshiseibiAddedByWard.size > 0) {
		for (const [code, count] of [...summary.toshiseibiAddedByWard.entries()].sort((a, b) =>
			compareStrings(a[0], b[0]),
		)) {
			console.log(`    ${wardLabel(code)}: ${count}`);
		}
	}
	console.log("  skipped:");
	printCounter(summary.toshiseibiSkipped, "    ");

	if (summary.toshiseibiEmitted !== counterTotal(summary.toshiseibiMatched) + summary.toshiseibiAdded) {
		throw new Error("Stage B accounting mismatch: emitted != matched + added.");
	}
	if (somuKept + summary.toshiseibiAdded !== facilities.length) {
		throw new Error(
			`Record accounting mismatch: ${somuKept} + ${summary.toshiseibiAdded} != ${facilities.length}.`,
		);
	}

	console.log("\n=== Totals ===");
	console.log(`  facilities: ${facilities.length}`);
	for (const [type, count] of [...summary.perType.entries()].sort((a, b) => compareStrings(a[0], b[0]))) {
		console.log(`    ${type}: ${count}`);
	}

	console.log("\n=== Per municipality ===");
	const ideographicSpace = "　";
	for (const [code, count] of [...summary.perMunicipality.entries()].sort((a, b) => compareStrings(a[0], b[0]))) {
		const shelters = facilities.filter(
			(f) => f.municipalityId === code && f.facilityType === "evacuation_shelter",
		).length;
		console.log(
			`  ${code} ${(MUNICIPALITY_NAME_BY_CODE.get(code) ?? "?").padEnd(6, ideographicSpace)} total=${String(
				count,
			).padStart(4)} shelter=${String(shelters).padStart(4)} area=${String(count - shelters).padStart(4)}`,
		);
	}

	const covered = new Set(summary.perMunicipality.keys());
	console.log("\n=== Coverage ===");
	console.log(`  municipalities covered: ${covered.size} / ${TOKYO_MUNICIPALITIES.length}`);
	const missingWards = SPECIAL_WARD_CODES.filter((code) => !covered.has(code));
	console.log(`  23 special wards: ${missingWards.length === 0 ? "all covered" : `MISSING ${missingWards.join(", ")}`}`);
	const wardsMissingType = SPECIAL_WARD_CODES.filter(
		(code) =>
			!facilities.some((f) => f.municipalityId === code && f.facilityType === "evacuation_shelter") ||
			!facilities.some((f) => f.municipalityId === code && f.facilityType === "evacuation_area"),
	);
	console.log(
		`  23 wards with both facility types: ${
			wardsMissingType.length === 0 ? "yes" : `no (incomplete: ${wardsMissingType.map(wardLabel).join(", ")})`
		}`,
	);
	const missing = TOKYO_MUNICIPALITIES.filter(([code]) => !covered.has(code));
	if (missing.length > 0) {
		console.log(`  no kept record: ${missing.map(([code, name]) => `${code} ${name}`).join(", ")}`);
	}

	const shibuya = facilities.filter((f) => f.municipalityId === "13113" && f.facilityType === "evacuation_area");
	console.log(`\n=== 渋谷区 evacuation_area (${shibuya.length}) ===`);
	for (const facility of shibuya) {
		console.log(
			`  ${facility.facilityId}  ${facility.name.ja}  (${facility.latitude.toFixed(6)}, ${facility.longitude.toFixed(
				6,
			)})  ${facility.address}`,
		);
	}
}

// ---------------------------------------------------------------------------
// Self-checks (pure helpers only; synthetic inputs)
// ---------------------------------------------------------------------------

function selfCheck(): void {
	const parsed = parseCsv('a,"b,1","line\nbreak"\r\n"q""uote",,z\n');
	const expected = [
		["a", "b,1", "line\nbreak"],
		['q"uote', "", "z"],
	];
	if (JSON.stringify(parsed) !== JSON.stringify(expected)) {
		throw new Error(`selfCheck: parseCsv mismatch: ${JSON.stringify(parsed)}`);
	}
	if (sqlString("O'Brien") !== "'O''Brien'") {
		throw new Error("selfCheck: sqlString must double single quotes.");
	}
	if (normalizeHeader("区市町村\nコード") !== "区市町村コード") {
		throw new Error("selfCheck: normalizeHeader must strip line breaks.");
	}
	const split = splitAddress("東京都西多摩郡瑞穂町箱根ケ崎2287");
	if (split.municipality !== "瑞穂町" || split.rest !== "箱根ケ崎2287") {
		throw new Error(`selfCheck: splitAddress mismatch: ${JSON.stringify(split)}`);
	}
	if (splitAddress("千代田区神田猿楽町1-1-1").municipality !== "千代田区") {
		throw new Error("selfCheck: splitAddress must match a ward prefix.");
	}
	if (splitAddress("滝野川3-72-1").municipality !== null) {
		throw new Error("selfCheck: splitAddress must return null for a prefix-less address.");
	}
	if (addressToken("箱根ヶ崎2189") !== "箱根ケ崎") {
		throw new Error("selfCheck: addressToken must unify ヶ and ケ.");
	}

	// Stage A splitting.
	const multi = addressMunicipalityCodes("港区北青山、新宿区霞ヶ丘町、渋谷区神宮前、千駄ケ谷");
	if (JSON.stringify(multi) !== JSON.stringify(["13103", "13104", "13113"])) {
		throw new Error(`selfCheck: addressMunicipalityCodes mismatch: ${JSON.stringify(multi)}`);
	}
	if (JSON.stringify(addressMunicipalityCodes("北区赤羽、赤羽北、岩淵町、志茂")) !== JSON.stringify(["13117"])) {
		throw new Error("selfCheck: 町-suffixed chōme must not be read as a municipality.");
	}
	if (addressMunicipalityCodes("桐ケ丘2-6-11").length !== 0) {
		throw new Error("selfCheck: a prefix-less address names no municipality.");
	}
	if (JSON.stringify(addressMunicipalityCodes("港区元赤坂\r\n新宿区南元町、四谷、若葉")) !==
		JSON.stringify(["13103", "13104"])) {
		throw new Error("selfCheck: newline-separated wards must split.");
	}
	if (
		JSON.stringify(addressMunicipalityCodes("立川市緑町、泉町地内及び昭島市もくせいの杜3丁目")) !==
		JSON.stringify(["13202", "13207"])
	) {
		throw new Error("selfCheck: 及び must separate municipalities.");
	}

	// Stage B name matching, including the known cross-publisher variants.
	if (nameMatchKind(normalizedFacilityName("水元公園"), normalizedFacilityName("水元公園・江戸川緑地一帯")) !== "containment") {
		throw new Error("selfCheck: 水元公園 variant must match by containment.");
	}
	if (
		nameMatchKind(normalizedFacilityName("練馬総合運動場一帯"), normalizedFacilityName("練馬総合運動場公園一帯")) !==
		"subsequence"
	) {
		throw new Error("selfCheck: 練馬総合運動場 variant must match by subsequence.");
	}
	if (
		nameMatchKind(
			normalizedFacilityName("墨田区役所・隅田公園広場一帯"),
			normalizedFacilityName("墨田区役所・隅田公園自由広場一帯"),
		) !== "subsequence"
	) {
		throw new Error("selfCheck: 隅田公園広場 variant must match by subsequence.");
	}
	if (nameMatchKind(normalizedFacilityName("上野公園一帯"), normalizedFacilityName("芝公園・慶応大学一帯")) !== null) {
		throw new Error("selfCheck: unrelated names must not match.");
	}
	if (normalizedFacilityName("実践女子大学（校庭一部）") !== "実践女子大学") {
		throw new Error("selfCheck: parenthesised suffixes must be stripped from the match key.");
	}

	// facilityId is content-addressed and stable.
	const idA = facilityId("13113", "evacuation_area", "明治神宮・代々木公園一帯", "渋谷区神南、代々木神園町");
	const idB = facilityId("13113", "evacuation_area", "明治神宮・代々木公園一帯", "渋谷区神南、代々木神園町");
	if (idA !== idB || !/^13113-[0-9a-f]{8}$/.test(idA)) {
		throw new Error(`selfCheck: facilityId must be stable and well-formed, got ${idA} / ${idB}`);
	}
	if (facilityId("13113", "evacuation_shelter", "明治神宮・代々木公園一帯", "渋谷区神南、代々木神園町") === idA) {
		throw new Error("selfCheck: facilityId must depend on facilityType.");
	}

	// Distance + projection.
	const near = approximateDistanceMeters(35.6, 139.7, 35.601, 139.7);
	if (near < 100 || near > 120) {
		throw new Error(`selfCheck: approximateDistanceMeters out of range: ${near}`);
	}
	const [originLat, originLon] = zone9ToWgs84(0, 0);
	if (Math.abs(originLat - 36) > 1e-6 || Math.abs(originLon - 139.8333333333333) > 1e-9) {
		throw new Error(`selfCheck: zone IX origin must map to 36N 139°50'E, got ${originLat}, ${originLon}`);
	}

	const decoded = decodeCsvBuffer(Buffer.from([0xef, 0xbb, 0xbf, 0x61, 0x2c, 0x62]));
	if (decoded.encoding !== "utf-8" || decoded.text !== "a,b") {
		throw new Error("selfCheck: decodeCsvBuffer must strip the UTF-8 BOM.");
	}
	// 0x93 0xFA = 日 in Shift_JIS, invalid as UTF-8.
	if (decodeCsvBuffer(Buffer.from([0x93, 0xfa])).encoding !== "shift_jis") {
		throw new Error("selfCheck: decodeCsvBuffer must fall back to Shift_JIS.");
	}
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	selfCheck();

	const summary: Summary = {
		csvFiles: [],
		skipped: new Map(),
		resolvedVia: new Map(),
		codeMismatches: new Map(),
		stageAExtraByWard: new Map(),
		stageAMultiWardRows: 0,
		stageADuplicatesDropped: 0,
		somuDeduped: 0,
		toshiseibiRecords: 0,
		toshiseibiEmitted: 0,
		toshiseibiMatched: new Map(),
		toshiseibiAdded: 0,
		toshiseibiSkipped: new Map(),
		toshiseibiAddedByWard: new Map(),
		perType: new Map(),
		perMunicipality: new Map(),
	};

	const rawRows: RawRow[] = [];
	for (const source of CSV_SOURCE_FILES) {
		const result = await readCsvRows(source);
		summary.csvFiles.push({
			file: source.file,
			encoding: result.encoding,
			totalRows: result.totalRows,
			blankRows: result.blankRows,
		});
		rawRows.push(...result.rows);
	}
	assertMunicipalityTableMatchesSource(rawRows);

	const store = buildSomuCandidates(rawRows, summary);
	mergeDesignatedAreas(store, await readDesignatedAreas(), summary);
	const facilities = finalise(store, summary);

	if (facilities.length === 0) {
		throw new Error("No facilities survived validation; refusing to write empty outputs.");
	}

	const meta = {
		sources: SOURCES.map((source) => ({
			name: source.name,
			url: source.url,
			updatedAt: source.updatedAt,
			license: source.license,
			attribution: source.attribution,
		})),
		acquiredAt: ACQUIRED_AT,
		realtime: false,
		recordCount: facilities.length,
		municipalityCoverage: [...new Set(facilities.map((facility) => facility.municipalityId))].sort(compareStrings),
		transform: "DATA/scripts/normalize-facilities.ts",
	};

	await writeFile(resolve(OUT_DIR, "facilities.json"), `${JSON.stringify(facilities, null, 2)}\n`, "utf8");
	await writeFile(resolve(OUT_DIR, "facilities.meta.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");
	await writeFile(resolve(OUT_DIR, "facilities.seed.sql"), buildSeedSql(facilities), "utf8");

	printSummary(summary, facilities);
	console.log("\n=== Written ===");
	console.log("  DATA/normalized/facilities.json");
	console.log("  DATA/normalized/facilities.meta.json");
	console.log("  DATA/normalized/facilities.seed.sql");
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : "Unknown error";
	console.error(`normalize-facilities failed: ${message}`);
	process.exitCode = 1;
});
