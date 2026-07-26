/**
 * Minimal readers for the binary formats published by 東京都都市整備局:
 * ZIP, XLSX (SpreadsheetML), shapefile (.shp/.dbf) and the JGD2000 plane
 * rectangular projection used by its shapefiles.
 *
 * Node standard library only - the DATA pipeline deliberately has no npm
 * dependencies. Only the subset of each format that the published files
 * actually use is implemented; anything unexpected throws instead of guessing.
 */

import { inflateRawSync } from "node:zlib";

// ---------------------------------------------------------------------------
// ZIP
// ---------------------------------------------------------------------------

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_SIGNATURE = 0x04034b50;
const ZIP_UTF8_NAME_FLAG = 0x800;

/**
 * Read every entry of a ZIP archive into memory.
 *
 * Entry names are decoded as UTF-8 when the archive says so and as Shift_JIS
 * otherwise, because the 都市整備局 shapefile archive stores Japanese names in
 * CP932 without setting the UTF-8 flag.
 */
export function readZipEntries(buffer: Buffer): Map<string, Buffer> {
	let eocd = -1;
	const lowestEocd = Math.max(0, buffer.length - 22 - 0xffff);
	for (let i = buffer.length - 22; i >= lowestEocd; i -= 1) {
		if (buffer.readUInt32LE(i) === ZIP_EOCD_SIGNATURE) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) {
		throw new Error("Not a ZIP archive: end-of-central-directory record not found.");
	}

	const entryCount = buffer.readUInt16LE(eocd + 10);
	let pointer = buffer.readUInt32LE(eocd + 16);
	const entries = new Map<string, Buffer>();

	for (let i = 0; i < entryCount; i += 1) {
		if (buffer.readUInt32LE(pointer) !== ZIP_CENTRAL_SIGNATURE) {
			throw new Error(`Corrupt ZIP: bad central directory header at entry ${i}.`);
		}
		const flags = buffer.readUInt16LE(pointer + 8);
		const method = buffer.readUInt16LE(pointer + 10);
		const compressedSize = buffer.readUInt32LE(pointer + 20);
		const nameLength = buffer.readUInt16LE(pointer + 28);
		const extraLength = buffer.readUInt16LE(pointer + 30);
		const commentLength = buffer.readUInt16LE(pointer + 32);
		const localOffset = buffer.readUInt32LE(pointer + 42);
		const rawName = buffer.subarray(pointer + 46, pointer + 46 + nameLength);
		const name =
			(flags & ZIP_UTF8_NAME_FLAG) !== 0
				? rawName.toString("utf8")
				: new TextDecoder("shift_jis").decode(rawName);

		if (buffer.readUInt32LE(localOffset) !== ZIP_LOCAL_SIGNATURE) {
			throw new Error(`Corrupt ZIP: bad local header for "${name}".`);
		}
		const localNameLength = buffer.readUInt16LE(localOffset + 26);
		const localExtraLength = buffer.readUInt16LE(localOffset + 28);
		const dataStart = localOffset + 30 + localNameLength + localExtraLength;
		const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

		if (method === 0) {
			entries.set(name, Buffer.from(compressed));
		} else if (method === 8) {
			entries.set(name, inflateRawSync(compressed));
		} else {
			throw new Error(`Unsupported ZIP compression method ${method} for "${name}".`);
		}
		pointer += 46 + nameLength + extraLength + commentLength;
	}
	return entries;
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

function unescapeXml(value: string): string {
	return value
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#(\d+);/g, (_all, code: string) => String.fromCodePoint(Number(code)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_all, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
		.replace(/&amp;/g, "&");
}

/**
 * Concatenate the text runs of one shared-string / inline-string element.
 *
 * `<rPh>` holds the furigana Excel generated for Japanese cells; it must be
 * dropped or every value comes back with its reading glued on the end
 * (e.g. "避難場所名称ヒナンバショメイショウ").
 */
function textRuns(xml: string): string {
	const withoutRuby = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").replace(/<rPh\b[^>]*\/>/g, "");
	let text = "";
	for (const match of withoutRuby.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g)) {
		text += match[1] === undefined ? "" : unescapeXml(match[1]);
	}
	return text;
}

function columnIndexFromRef(ref: string): number {
	const letters = /^([A-Z]+)/.exec(ref);
	if (letters === null) {
		return -1;
	}
	let index = 0;
	for (const char of letters[1]) {
		index = index * 26 + (char.charCodeAt(0) - 64);
	}
	return index - 1;
}

/** One worksheet as a dense array of rows of trimmed cell strings. */
export type Worksheet = { readonly name: string; readonly rows: string[][] };

/**
 * Read every worksheet of an XLSX workbook.
 *
 * Worksheets come back in `xl/worksheets/*.xml` name order rather than workbook
 * order; callers locate the sheet they want by looking for its header text, so
 * the ordering does not matter.
 */
export function readWorkbook(buffer: Buffer): Worksheet[] {
	const entries = readZipEntries(buffer);

	const sharedStrings: string[] = [];
	const sharedXml = entries.get("xl/sharedStrings.xml");
	if (sharedXml !== undefined) {
		const xml = sharedXml.toString("utf8");
		for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)) {
			sharedStrings.push(match[1] === undefined ? "" : textRuns(match[1]));
		}
	}

	const sheetPaths = [...entries.keys()]
		.filter((name) => /^xl\/worksheets\/[^/]+\.xml$/.test(name))
		.sort((a, b) => a.localeCompare(b));

	return sheetPaths.map((path) => {
		const xml = entries.get(path)!.toString("utf8");
		const rows: string[][] = [];
		for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g)) {
			const inner = rowMatch[1] ?? "";
			const cells = new Map<number, string>();
			let fallbackIndex = 0;
			for (const cellMatch of inner.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
				const attributes = cellMatch[1] ?? "";
				const body = cellMatch[2] ?? "";
				const refMatch = /\br="([A-Z]+\d+)"/.exec(attributes);
				const index = refMatch === null ? fallbackIndex : columnIndexFromRef(refMatch[1]);
				fallbackIndex = index + 1;
				const typeMatch = /\bt="([^"]+)"/.exec(attributes);
				const type = typeMatch === null ? "n" : typeMatch[1];

				let value: string;
				if (type === "inlineStr") {
					value = textRuns(body);
				} else {
					const valueMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body);
					value = valueMatch === null ? "" : unescapeXml(valueMatch[1]);
					if (type === "s" && value !== "") {
						const shared = sharedStrings[Number(value)];
						value = shared ?? "";
					}
				}
				cells.set(index, value.trim());
			}
			const width = cells.size === 0 ? 0 : Math.max(...cells.keys()) + 1;
			const row: string[] = [];
			for (let i = 0; i < width; i += 1) {
				row.push(cells.get(i) ?? "");
			}
			rows.push(row);
		}
		return { name: path, rows };
	});
}

// ---------------------------------------------------------------------------
// dBASE III (.dbf)
// ---------------------------------------------------------------------------

/** Read a .dbf table as records keyed by field name (values are trimmed CP932 text). */
export function readDbf(buffer: Buffer): Record<string, string>[] {
	const recordCount = buffer.readUInt32LE(4);
	const headerLength = buffer.readUInt16LE(8);
	const recordLength = buffer.readUInt16LE(10);
	const decoder = new TextDecoder("shift_jis");

	const fields: { name: string; length: number }[] = [];
	let pointer = 32;
	while (pointer < buffer.length && buffer[pointer] !== 0x0d) {
		const rawName = buffer.subarray(pointer, pointer + 11);
		const terminator = rawName.indexOf(0);
		const name = decoder.decode(terminator === -1 ? rawName : rawName.subarray(0, terminator));
		fields.push({ name, length: buffer[pointer + 16] });
		pointer += 32;
	}

	const records: Record<string, string>[] = [];
	for (let i = 0; i < recordCount; i += 1) {
		const start = headerLength + i * recordLength;
		if (buffer[start] === 0x2a) {
			continue; // tombstoned record
		}
		let offset = start + 1;
		const record: Record<string, string> = {};
		for (const field of fields) {
			record[field.name] = decoder.decode(buffer.subarray(offset, offset + field.length)).trim();
			offset += field.length;
		}
		records.push(record);
	}
	return records;
}

// ---------------------------------------------------------------------------
// Shapefile (.shp) - polygons only
// ---------------------------------------------------------------------------

export type Ring = readonly (readonly [number, number])[];

const SHAPE_NULL = 0;
const SHAPE_POLYGON = 5;
const SHAPE_POLYGON_Z = 15;
const SHAPE_POLYGON_M = 25;

/**
 * Read the polygon geometries of a .shp file, in file order, as rings of
 * projected (x, y) pairs. Null shapes come back as `null` so that the result
 * stays index-aligned with the matching .dbf records.
 */
export function readPolygonShapes(buffer: Buffer): (Ring[] | null)[] {
	const shapes: (Ring[] | null)[] = [];
	let pointer = 100; // main file header
	while (pointer + 8 <= buffer.length) {
		const contentLength = buffer.readUInt32BE(pointer + 4) * 2;
		const body = buffer.subarray(pointer + 8, pointer + 8 + contentLength);
		pointer += 8 + contentLength;
		if (body.length < 4) {
			shapes.push(null);
			continue;
		}
		const shapeType = body.readUInt32LE(0);
		if (shapeType === SHAPE_NULL) {
			shapes.push(null);
			continue;
		}
		if (shapeType !== SHAPE_POLYGON && shapeType !== SHAPE_POLYGON_Z && shapeType !== SHAPE_POLYGON_M) {
			throw new Error(`Unsupported shapefile geometry type ${shapeType}; expected a polygon.`);
		}
		const partCount = body.readUInt32LE(36);
		const pointCount = body.readUInt32LE(40);
		const partsStart = 44;
		const pointsStart = partsStart + 4 * partCount;
		const parts: number[] = [];
		for (let i = 0; i < partCount; i += 1) {
			parts.push(body.readUInt32LE(partsStart + 4 * i));
		}
		const rings: Ring[] = [];
		for (let i = 0; i < partCount; i += 1) {
			const from = parts[i];
			const to = i + 1 < partCount ? parts[i + 1] : pointCount;
			const ring: [number, number][] = [];
			for (let j = from; j < to; j += 1) {
				ring.push([body.readDoubleLE(pointsStart + 16 * j), body.readDoubleLE(pointsStart + 16 * j + 8)]);
			}
			rings.push(ring);
		}
		shapes.push(rings);
	}
	return shapes;
}

/**
 * Area-weighted centroid of a (possibly multi-ring) polygon via the shoelace
 * formula. Falls back to the mean vertex for degenerate zero-area rings.
 */
export function polygonCentroid(rings: readonly Ring[]): readonly [number, number] {
	let sumX = 0;
	let sumY = 0;
	let doubleArea = 0;
	for (const ring of rings) {
		for (let i = 0; i + 1 < ring.length; i += 1) {
			const [x0, y0] = ring[i];
			const [x1, y1] = ring[i + 1];
			const cross = x0 * y1 - x1 * y0;
			doubleArea += cross;
			sumX += (x0 + x1) * cross;
			sumY += (y0 + y1) * cross;
		}
	}
	if (doubleArea !== 0) {
		// area = doubleArea / 2 ; centroid = sum((p0+p1) * cross) / (6 * area)
		return [sumX / (3 * doubleArea), sumY / (3 * doubleArea)];
	}
	const points = rings.flat();
	if (points.length === 0) {
		throw new Error("Cannot take the centroid of an empty polygon.");
	}
	const meanX = points.reduce((total, point) => total + point[0], 0) / points.length;
	const meanY = points.reduce((total, point) => total + point[1], 0) / points.length;
	return [meanX, meanY];
}

/** Twice the signed area of a ring; positive is counter-clockwise. */
export function ringSignedDoubleArea(ring: Ring): number {
	let total = 0;
	for (let i = 0; i + 1 < ring.length; i += 1) {
		total += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
	}
	return total;
}

function perpendicularDistance(
	point: readonly [number, number],
	start: readonly [number, number],
	end: readonly [number, number],
): number {
	const dx = end[0] - start[0];
	const dy = end[1] - start[1];
	if (dx === 0 && dy === 0) {
		return Math.hypot(point[0] - start[0], point[1] - start[1]);
	}
	const numerator = Math.abs(dy * (point[0] - start[0]) - dx * (point[1] - start[1]));
	return numerator / Math.hypot(dx, dy);
}

/**
 * Ramer-Douglas-Peucker simplification of a closed ring, iterative so that a
 * long ring cannot blow the stack. Coordinates must be projected (metres), so
 * `toleranceMeters` is a real distance. The closing vertex is preserved.
 */
export function simplifyRing(ring: Ring, toleranceMeters: number): Ring {
	const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
	const path = closed ? ring.slice(0, -1) : ring.slice();
	if (path.length < 4) {
		return ring;
	}
	const keep = new Array<boolean>(path.length).fill(false);
	keep[0] = true;
	keep[path.length - 1] = true;
	const stack: [number, number][] = [[0, path.length - 1]];
	while (stack.length > 0) {
		const segment = stack.pop();
		if (segment === undefined) {
			break;
		}
		const [first, last] = segment;
		let worstIndex = -1;
		let worstDistance = toleranceMeters;
		for (let i = first + 1; i < last; i += 1) {
			const distance = perpendicularDistance(path[i], path[first], path[last]);
			if (distance > worstDistance) {
				worstDistance = distance;
				worstIndex = i;
			}
		}
		if (worstIndex !== -1) {
			keep[worstIndex] = true;
			stack.push([first, worstIndex], [worstIndex, last]);
		}
	}
	const simplified = path.filter((_point, index) => keep[index]);
	if (closed) {
		simplified.push(simplified[0]);
	}
	return simplified;
}

// ---------------------------------------------------------------------------
// JGD2000 / Japan Plane Rectangular CS zone IX (EPSG:2451) -> WGS84
// ---------------------------------------------------------------------------

const GRS80_SEMI_MAJOR = 6378137.0;
const GRS80_INVERSE_FLATTENING = 298.257222101;
const E2 = 1 - (1 - 1 / GRS80_INVERSE_FLATTENING) ** 2;
const EP2 = E2 / (1 - E2);
/** Zone IX parameters: scale 0.9999 on the 139°50' meridian, origin at 36°N. */
const ZONE9_SCALE = 0.9999;
const ZONE9_ORIGIN_LATITUDE = (36 * Math.PI) / 180;
const ZONE9_CENTRAL_MERIDIAN = (139.8333333333333 * Math.PI) / 180;

function meridianArc(latitude: number): number {
	return (
		GRS80_SEMI_MAJOR *
		((1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256) * latitude -
			((3 * E2) / 8 + (3 * E2 ** 2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * latitude) +
			((15 * E2 ** 2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * latitude) -
			((35 * E2 ** 3) / 3072) * Math.sin(6 * latitude))
	);
}

const ZONE9_ORIGIN_ARC = meridianArc(ZONE9_ORIGIN_LATITUDE);

/**
 * Inverse transverse Mercator for EPSG:2451, returning WGS84 degrees.
 *
 * JGD2000 and WGS84 differ by well under a metre in Japan, which is far below
 * the precision of a 避難場所 polygon centroid, so no datum shift is applied.
 */
export function zone9ToWgs84(easting: number, northing: number): readonly [number, number] {
	const arc = ZONE9_ORIGIN_ARC + northing / ZONE9_SCALE;
	const mu = arc / (GRS80_SEMI_MAJOR * (1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256));
	const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
	const footprint =
		mu +
		((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
		((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
		((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
		((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

	const cosSquared = EP2 * Math.cos(footprint) ** 2;
	const tanSquared = Math.tan(footprint) ** 2;
	const primeVertical = GRS80_SEMI_MAJOR / Math.sqrt(1 - E2 * Math.sin(footprint) ** 2);
	const meridional = (GRS80_SEMI_MAJOR * (1 - E2)) / (1 - E2 * Math.sin(footprint) ** 2) ** 1.5;
	const d = easting / (primeVertical * ZONE9_SCALE);

	const latitude =
		footprint -
		((primeVertical * Math.tan(footprint)) / meridional) *
			(d ** 2 / 2 -
				((5 + 3 * tanSquared + 10 * cosSquared - 4 * cosSquared ** 2 - 9 * EP2) * d ** 4) / 24 +
				((61 + 90 * tanSquared + 298 * cosSquared + 45 * tanSquared ** 2 - 252 * EP2 - 3 * cosSquared ** 2) *
					d ** 6) /
					720);
	const longitude =
		ZONE9_CENTRAL_MERIDIAN +
		(d -
			((1 + 2 * tanSquared + cosSquared) * d ** 3) / 6 +
			((5 - 2 * cosSquared + 28 * tanSquared - 3 * cosSquared ** 2 + 8 * EP2 + 24 * tanSquared ** 2) * d ** 5) /
				120) /
			Math.cos(footprint);

	return [(latitude * 180) / Math.PI, (longitude * 180) / Math.PI];
}
