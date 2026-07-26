/**
 * Build the 地区内残留地区 (stay-put zone) dataset from Tokyo open data.
 *
 * Source (CC BY 4.0, see DATA/README.md for the full ledger):
 *   東京都都市整備局「震災時火災における避難場所等の指定（第9回）」
 *   https://catalog.data.metro.tokyo.lg.jp/dataset/t000008d0000000013
 *   DATA/raw/hinan02_02_stay_put_zones.xlsx      (地区名・区名・町丁・面積・退避人口)
 *   DATA/raw/hinan02_02_stay_put_zones_shp.zip   (zone boundaries, EPSG:2451)
 *
 * Why this exists: in a 地区内残留地区 the official instruction is to STAY IN THE
 * DISTRICT - the 不燃領域率 is high enough that residents are deliberately not
 * assigned to a 広域避難場所. Without this layer the app would show a distant
 * 避難場所 as if going there were required, contradicting the designation.
 *
 * Outputs:
 *   DATA/normalized/stay-put-zones.json
 *   DATA/normalized/stay-put-zones.seed.sql
 *
 * Run: npx tsx DATA/scripts/normalize-stay-put-zones.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Ring } from "./lib/binary-formats";
import {
	readDbf,
	readPolygonShapes,
	readWorkbook,
	readZipEntries,
	ringSignedDoubleArea,
	simplifyRing,
	zone9ToWgs84,
} from "./lib/binary-formats";
import {
	CODE_BY_MUNICIPALITY_NAME,
	MAX_SQL_STATEMENT_BYTES,
	MUNICIPALITY_NAME_BY_CODE,
	buildInsertStatements,
	compareStrings,
	hashPrefix,
	normalizeHeader,
	normalizeValue,
	sqlNullableNumber,
	sqlString,
} from "./lib/tokyo";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RAW_DIR = resolve(REPO_ROOT, "DATA", "raw");
const OUT_DIR = resolve(REPO_ROOT, "DATA", "normalized");

const WORKBOOK = "hinan02_02_stay_put_zones.xlsx";
const SHAPES = "hinan02_02_stay_put_zones_shp.zip";

const SOURCE_URL = "https://catalog.data.metro.tokyo.lg.jp/dataset/t000008d0000000013";
/** 第9回指定, 令和4年9月1日から適用. */
const SOURCE_UPDATED_AT = "2022-09-01";

const ZONE_ID_HASH_LENGTH = 8;
/**
 * Row-count ceiling. The real constraint is MAX_SQL_STATEMENT_BYTES: a zone with
 * a detailed boundary can be tens of KB on its own, so the byte budget normally
 * binds long before this does.
 */
const SQL_BATCH_SIZE = 50;
/** Source 面積 values are authored to 4 decimal places; round off float noise. */
const AREA_DECIMALS = 4;
/** Rings longer than this are simplified; see SIMPLIFY_TOLERANCE_METERS. */
const MAX_RING_POINTS = 500;
const SIMPLIFY_TOLERANCE_METERS = 10;
/** Discard slivers: degenerate rings carrying no real area. */
const MIN_RING_AREA_SQUARE_METERS = 1;

type StayPutZone = {
	zoneId: string;
	name: { ja: string };
	municipalityId: string;
	chome: string[];
	areaHa: number | null;
	population: number | null;
	polygon: [number, number][][] | null;
	sourceUrl: string;
	sourceUpdatedAt: string;
};

type SheetRow = {
	/** Zone number, only present on the first row of a zone. */
	readonly number: string;
	readonly zoneName: string;
	readonly municipalityName: string;
	readonly chomeRaw: string;
	readonly areaHa: string;
	readonly population: string;
};

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
	sheetRows: number;
	zonesRead: number;
	multiMunicipalityZones: string[];
	records: number;
	splitRecords: number;
	chomeTotal: number;
	skipped: Counter;
	perMunicipality: Counter;
	polygonsMatched: number;
	polygonsMissing: string[];
	ringsKept: number;
	ringsDropped: number;
	ringsSimplified: { zone: string; before: number; after: number }[];
	verticesBefore: number;
	verticesAfter: number;
};

/**
 * Split an official 町丁 enumeration into individual entries.
 *
 * The source separates entries with "、" and the final one with "及び", e.g.
 *   "勝どき五丁目、勝どき六丁目及び豊海町" -> 3 entries
 * Entries are kept verbatim, including "…の一部" (only part of that 丁目 lies in
 * the zone). This dataset never uses the compact "一・二丁目" style, so the split
 * is lossless and no raw string needs to be carried alongside.
 */
export function splitChome(raw: string): string[] {
	return raw
		.split(/、|及び|並びに|ならびに/)
		.map((entry) => normalizeValue(entry))
		.filter((entry) => entry !== "");
}

/** Read the sheet into flat rows, preserving the zone-start / continuation shape. */
function readSheetRows(buffer: Buffer): SheetRow[] {
	const worksheets = readWorkbook(buffer);
	const sheet = worksheets.find((candidate) =>
		candidate.rows.some((row) => row.map(normalizeHeader).includes("地区名")),
	);
	if (sheet === undefined) {
		throw new Error(`${WORKBOOK}: no worksheet contains a 地区名 header.`);
	}
	const headerIndex = sheet.rows.findIndex((row) => row.map(normalizeHeader).includes("地区名"));
	const header = sheet.rows[headerIndex].map(normalizeHeader);
	const columns = {
		number: header.indexOf("番号"),
		zoneName: header.indexOf("地区名"),
		municipality: header.indexOf("区名"),
		chome: header.indexOf("所在地"),
		area: header.findIndex((cell) => cell.startsWith("面積")),
		population: header.findIndex((cell) => cell.includes("退避人口")),
	};
	for (const [key, index] of Object.entries(columns)) {
		if (index < 0) {
			throw new Error(`${WORKBOOK}: missing column "${key}". Header: ${header.join(" | ")}`);
		}
	}

	const rows: SheetRow[] = [];
	for (const row of sheet.rows.slice(headerIndex + 1)) {
		const cell = (index: number): string => normalizeValue(row[index] ?? "");
		const candidate: SheetRow = {
			number: cell(columns.number),
			zoneName: cell(columns.zoneName),
			municipalityName: cell(columns.municipality),
			chomeRaw: cell(columns.chome),
			areaHa: cell(columns.area),
			population: cell(columns.population),
		};
		if (Object.values(candidate).every((value) => value === "")) {
			continue;
		}
		rows.push(candidate);
	}
	return rows;
}

type ZoneGeometry = { rings: Ring[] };

/** Zone boundaries keyed by zone number, still in EPSG:2451 metres. */
function readZoneGeometry(buffer: Buffer, summary: Summary): Map<string, ZoneGeometry> {
	const entries = readZipEntries(buffer);
	const dbfName = [...entries.keys()].find((name) => name.endsWith(".dbf"));
	if (dbfName === undefined) {
		throw new Error(`${SHAPES}: no .dbf member found.`);
	}
	const shpEntry = entries.get(dbfName.replace(/\.dbf$/, ".shp"));
	const dbfEntry = entries.get(dbfName);
	if (shpEntry === undefined || dbfEntry === undefined) {
		throw new Error(`${SHAPES}: incomplete shapefile (missing .shp or .dbf).`);
	}
	const records = readDbf(dbfEntry);
	const shapes = readPolygonShapes(shpEntry);
	if (records.length !== shapes.length) {
		throw new Error(`${SHAPES}: ${records.length} dbf records but ${shapes.length} shapes.`);
	}

	const geometry = new Map<string, ZoneGeometry>();
	for (let i = 0; i < records.length; i += 1) {
		// The layer reuses the 避難場所NO field name for the zone number.
		const number = normalizeValue(records[i]["避難場所NO"] ?? "");
		const rings = shapes[i];
		if (number === "" || rings === null) {
			continue;
		}
		// Drop slivers, then order by descending area so the outer ring comes first.
		const usable = rings
			.filter((ring) => {
				const area = Math.abs(ringSignedDoubleArea(ring)) / 2;
				if (ring.length < 4 || area < MIN_RING_AREA_SQUARE_METERS) {
					summary.ringsDropped += 1;
					return false;
				}
				return true;
			})
			.sort((a, b) => Math.abs(ringSignedDoubleArea(b)) - Math.abs(ringSignedDoubleArea(a)));
		if (usable.length === 0) {
			continue;
		}
		geometry.set(number, { rings: usable });
	}
	return geometry;
}

/** Simplify if needed, then reproject to WGS84 `[lat, lng]` pairs. */
function toWgs84Polygon(number: string, geometry: ZoneGeometry, summary: Summary): [number, number][][] {
	return geometry.rings.map((ring) => {
		summary.verticesBefore += ring.length;
		let working = ring;
		if (ring.length > MAX_RING_POINTS) {
			working = simplifyRing(ring, SIMPLIFY_TOLERANCE_METERS);
			summary.ringsSimplified.push({ zone: number, before: ring.length, after: working.length });
		}
		summary.ringsKept += 1;
		summary.verticesAfter += working.length;
		return working.map((point) => {
			const [latitude, longitude] = zone9ToWgs84(point[0], point[1]);
			return [latitude, longitude] as [number, number];
		});
	});
}

function roundArea(value: number): number {
	const factor = 10 ** AREA_DECIMALS;
	return Math.round(value * factor) / factor;
}

function buildZones(rows: readonly SheetRow[], geometry: Map<string, ZoneGeometry>, summary: Summary): StayPutZone[] {
	summary.sheetRows = rows.length;

	// Group the flat sheet into zones: a row with a 番号 starts one, the rows
	// after it are additional municipalities of the same zone.
	type ZoneGroup = {
		number: string;
		name: string;
		areaHa: string;
		population: string;
		parts: { municipalityName: string; chomeRaw: string }[];
	};
	const groups: ZoneGroup[] = [];
	for (const row of rows) {
		if (/^\d+$/.test(row.number)) {
			groups.push({
				number: row.number,
				name: row.zoneName,
				areaHa: row.areaHa,
				population: row.population,
				parts: [{ municipalityName: row.municipalityName, chomeRaw: row.chomeRaw }],
			});
			continue;
		}
		const current = groups[groups.length - 1];
		if (current === undefined) {
			bump(summary.skipped, "row_before_first_zone");
			continue;
		}
		if (row.municipalityName === "") {
			// A continuation row with no 区名: the source leaves the municipality
			// undetermined (zone 336's 中央防波堤埋立地, whose jurisdiction was
			// historically disputed). Never guess - record and skip.
			bump(summary.skipped, "chome_without_municipality");
			continue;
		}
		current.parts.push({ municipalityName: row.municipalityName, chomeRaw: row.chomeRaw });
	}
	summary.zonesRead = groups.length;

	const zones: StayPutZone[] = [];
	for (const group of groups) {
		if (group.name === "") {
			bump(summary.skipped, "missing_zone_name");
			continue;
		}
		const municipalities = new Map<string, string[]>();
		for (const part of group.parts) {
			const code = CODE_BY_MUNICIPALITY_NAME.get(part.municipalityName);
			if (code === undefined) {
				bump(summary.skipped, `unknown_municipality:${part.municipalityName}`);
				continue;
			}
			const chome = municipalities.get(code) ?? [];
			chome.push(...splitChome(part.chomeRaw));
			municipalities.set(code, chome);
		}
		if (municipalities.size === 0) {
			bump(summary.skipped, "no_resolvable_municipality");
			continue;
		}

		const isSplit = municipalities.size > 1;
		if (isSplit) {
			summary.multiMunicipalityZones.push(
				`${group.number} ${group.name} -> ${[...municipalities.keys()]
					.map((code) => MUNICIPALITY_NAME_BY_CODE.get(code) ?? code)
					.join(" + ")} (source totals: ${group.areaHa || "-"} ha / ${group.population || "-"} 人)`,
			);
		}

		const geo = geometry.get(group.number);
		if (geo === undefined) {
			summary.polygonsMissing.push(`${group.number} ${group.name}`);
		} else {
			summary.polygonsMatched += 1;
		}
		// The published boundary covers the whole zone; it is not clipped per
		// municipality. That is what a point-in-polygon test needs, so every
		// record of a split zone carries the same full-zone geometry.
		const polygon = geo === undefined ? null : toWgs84Polygon(group.number, geo, summary);

		const areaNumber = Number(group.areaHa);
		const populationNumber = Number(group.population);
		for (const [municipalityId, chome] of [...municipalities.entries()].sort((a, b) =>
			compareStrings(a[0], b[0]),
		)) {
			zones.push({
				zoneId: `zone-${municipalityId}-${hashPrefix(
					[municipalityId, group.name.normalize("NFKC")].join("|"),
					ZONE_ID_HASH_LENGTH,
				)}`,
				name: { ja: group.name },
				municipalityId,
				chome,
				// The source publishes 面積/人口 for the zone as a whole only, so a
				// zone spanning several municipalities gets null rather than an
				// invented proportional split.
				areaHa: isSplit || group.areaHa === "" || !Number.isFinite(areaNumber) ? null : roundArea(areaNumber),
				population:
					isSplit || group.population === "" || !Number.isInteger(populationNumber)
						? null
						: populationNumber,
				polygon: polygon === null ? null : polygon.map((ring) => ring.map((point) => [...point])),
				sourceUrl: SOURCE_URL,
				sourceUpdatedAt: SOURCE_UPDATED_AT,
			});
			summary.chomeTotal += chome.length;
			bump(summary.perMunicipality, municipalityId);
			if (isSplit) {
				summary.splitRecords += 1;
			}
		}
	}

	const seen = new Map<string, StayPutZone>();
	for (const zone of zones) {
		const clash = seen.get(zone.zoneId);
		if (clash !== undefined) {
			throw new Error(
				`zoneId collision on ${zone.zoneId}: "${clash.name.ja}" vs "${zone.name.ja}" ` +
					"in the same municipality. Resolve the source data or lengthen ZONE_ID_HASH_LENGTH deliberately.",
			);
		}
		seen.set(zone.zoneId, zone);
	}

	zones.sort(
		(a, b) => compareStrings(a.municipalityId, b.municipalityId) || compareStrings(a.name.ja, b.name.ja),
	);
	summary.records = zones.length;
	return zones;
}

function buildSeedSql(zones: readonly StayPutZone[]): string {
	const lines: string[] = [
		"-- Generated by DATA/scripts/normalize-stay-put-zones.ts. Do not edit by hand.",
		"-- 地区内残留地区 (stay-put districts): the official instruction is to remain in",
		"-- the district; residents are deliberately not assigned to a 広域避難場所.",
		`-- Source: 東京都都市整備局「震災時火災における避難場所等の指定（第9回）」 <${SOURCE_URL}>`,
		`-- CC BY 4.0. Effective ${SOURCE_UPDATED_AT}. Static data.`,
		"",
		"DELETE FROM stay_put_zones;",
		"",
	];

	const columns =
		"(zone_id, name_ja, municipality_id, chome_json, area_ha, population, polygon_json, source_url, source_updated_at)";

	const values = zones.map((zone) =>
		[
			sqlString(zone.zoneId),
			sqlString(zone.name.ja),
			sqlString(zone.municipalityId),
			sqlString(JSON.stringify(zone.chome)),
			sqlNullableNumber(zone.areaHa),
			sqlNullableNumber(zone.population),
			zone.polygon === null ? "NULL" : sqlString(JSON.stringify(zone.polygon)),
			sqlString(zone.sourceUrl),
			sqlString(zone.sourceUpdatedAt),
		].join(", "),
	);
	for (const statement of buildInsertStatements("stay_put_zones", columns, values, {
		maxRows: SQL_BATCH_SIZE,
		maxBytes: MAX_SQL_STATEMENT_BYTES,
	})) {
		lines.push(statement);
		lines.push("");
	}
	return lines.join("\n");
}

function printSummary(summary: Summary, zones: readonly StayPutZone[]): void {
	console.log("=== Source ===");
	console.log(`  ${WORKBOOK}: ${summary.sheetRows} data rows`);
	console.log(`  ${SHAPES}: zone boundaries, EPSG:2451 polygons`);

	console.log("\n=== Zones ===");
	console.log(`  zones read:              ${summary.zonesRead}`);
	console.log(`  records emitted:         ${summary.records}`);
	console.log(`  of which split rows:     ${summary.splitRecords}`);
	console.log(`  多丁目 entries total:     ${summary.chomeTotal}`);
	console.log(`  skipped:                 ${counterTotal(summary.skipped)}`);
	if (summary.skipped.size === 0) {
		console.log("    (none)");
	}
	for (const [reason, count] of [...summary.skipped.entries()].sort((a, b) => compareStrings(a[0], b[0]))) {
		console.log(`    ${reason}: ${count}`);
	}

	console.log("\n=== Zones spanning several municipalities (areaHa/population -> null) ===");
	if (summary.multiMunicipalityZones.length === 0) {
		console.log("  (none)");
	}
	for (const line of summary.multiMunicipalityZones) {
		console.log(`  ${line}`);
	}

	console.log("\n=== Polygons ===");
	console.log(`  zones with published boundary: ${summary.polygonsMatched} / ${summary.zonesRead}`);
	console.log(
		`  zones without boundary:        ${summary.polygonsMissing.length}${
			summary.polygonsMissing.length > 0 ? ` (${summary.polygonsMissing.join(", ")})` : ""
		}`,
	);
	console.log(`  rings kept: ${summary.ringsKept} | degenerate rings dropped: ${summary.ringsDropped}`);
	console.log(`  vertices: ${summary.verticesBefore} -> ${summary.verticesAfter}`);
	if (summary.ringsSimplified.length === 0) {
		console.log(`  simplified rings (> ${MAX_RING_POINTS} pts): none`);
	} else {
		console.log(
			`  simplified rings (> ${MAX_RING_POINTS} pts, Douglas-Peucker ${SIMPLIFY_TOLERANCE_METERS} m):`,
		);
		for (const entry of summary.ringsSimplified) {
			console.log(`    zone ${entry.zone}: ${entry.before} -> ${entry.after} pts`);
		}
	}

	console.log("\n=== Per municipality ===");
	const ideographicSpace = "　";
	for (const [code, count] of [...summary.perMunicipality.entries()].sort((a, b) => compareStrings(a[0], b[0]))) {
		const chome = zones
			.filter((zone) => zone.municipalityId === code)
			.reduce((total, zone) => total + zone.chome.length, 0);
		console.log(
			`  ${code} ${(MUNICIPALITY_NAME_BY_CODE.get(code) ?? "?").padEnd(6, ideographicSpace)} zones=${String(
				count,
			).padStart(3)} chome=${String(chome).padStart(4)}`,
		);
	}

	const shibuya = zones.filter((zone) => zone.municipalityId === "13113");
	console.log("\n=== 渋谷区 ===");
	for (const zone of shibuya) {
		console.log(
			`  ${zone.zoneId}  ${zone.name.ja}  areaHa=${zone.areaHa}  population=${zone.population}  chome=${
				zone.chome.length
			}  rings=${zone.polygon === null ? "none" : zone.polygon.length}`,
		);
		console.log(`    chome: ${zone.chome.join("、")}`);
	}
}

/** Unit-style self-checks on the pure helpers. Synthetic inputs only. */
function selfCheck(): void {
	const chome = splitChome("勝どき五丁目、勝どき六丁目及び豊海町");
	if (JSON.stringify(chome) !== JSON.stringify(["勝どき五丁目", "勝どき六丁目", "豊海町"])) {
		throw new Error(`selfCheck: splitChome mismatch: ${JSON.stringify(chome)}`);
	}
	if (JSON.stringify(splitChome("南元町の一部")) !== JSON.stringify(["南元町の一部"])) {
		throw new Error("selfCheck: splitChome must keep …の一部 verbatim.");
	}
	if (splitChome("").length !== 0) {
		throw new Error("selfCheck: splitChome of an empty string is empty.");
	}
	if (roundArea(374.94830000000002) !== 374.9483) {
		throw new Error(`selfCheck: roundArea must strip float noise, got ${roundArea(374.94830000000002)}`);
	}
	// A square keeps its corners; a near-collinear midpoint is dropped at 10 m.
	const square: Ring = [
		[0, 0],
		[100, 0],
		[100, 100],
		[0, 100],
		[0, 0],
	];
	if (simplifyRing(square, SIMPLIFY_TOLERANCE_METERS).length !== square.length) {
		throw new Error("selfCheck: simplifyRing must keep the corners of a square.");
	}
	const withNoise: Ring = [
		[0, 0],
		[50, 1],
		[100, 0],
		[100, 100],
		[0, 100],
		[0, 0],
	];
	if (simplifyRing(withNoise, SIMPLIFY_TOLERANCE_METERS).length !== 5) {
		throw new Error("selfCheck: simplifyRing must drop a 1 m deviation at a 10 m tolerance.");
	}
	if (Math.abs(ringSignedDoubleArea(square) / 2) !== 10000) {
		throw new Error("selfCheck: ringSignedDoubleArea must give 10000 m^2 for a 100 m square.");
	}
	const [originLat, originLon] = zone9ToWgs84(0, 0);
	if (Math.abs(originLat - 36) > 1e-6 || Math.abs(originLon - 139.8333333333333) > 1e-9) {
		throw new Error(`selfCheck: zone IX origin must map to 36N 139°50'E, got ${originLat}, ${originLon}`);
	}
	const idA = hashPrefix(["13113", "渋谷地区"].join("|"), ZONE_ID_HASH_LENGTH);
	if (idA !== hashPrefix(["13113", "渋谷地区"].join("|"), ZONE_ID_HASH_LENGTH) || !/^[0-9a-f]{8}$/.test(idA)) {
		throw new Error(`selfCheck: hashPrefix must be stable and well-formed, got ${idA}`);
	}
}

async function main(): Promise<void> {
	selfCheck();

	const summary: Summary = {
		sheetRows: 0,
		zonesRead: 0,
		multiMunicipalityZones: [],
		records: 0,
		splitRecords: 0,
		chomeTotal: 0,
		skipped: new Map(),
		perMunicipality: new Map(),
		polygonsMatched: 0,
		polygonsMissing: [],
		ringsKept: 0,
		ringsDropped: 0,
		ringsSimplified: [],
		verticesBefore: 0,
		verticesAfter: 0,
	};

	const rows = readSheetRows(await readFile(resolve(RAW_DIR, WORKBOOK)));
	const geometry = readZoneGeometry(await readFile(resolve(RAW_DIR, SHAPES)), summary);
	const zones = buildZones(rows, geometry, summary);

	if (zones.length === 0) {
		throw new Error("No stay-put zones survived validation; refusing to write empty outputs.");
	}

	await writeFile(resolve(OUT_DIR, "stay-put-zones.json"), `${JSON.stringify(zones, null, 2)}\n`, "utf8");
	await writeFile(resolve(OUT_DIR, "stay-put-zones.seed.sql"), buildSeedSql(zones), "utf8");

	printSummary(summary, zones);
	console.log("\n=== Written ===");
	console.log("  DATA/normalized/stay-put-zones.json");
	console.log("  DATA/normalized/stay-put-zones.seed.sql");
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : "Unknown error";
	console.error(`normalize-stay-put-zones failed: ${message}`);
	process.exitCode = 1;
});
