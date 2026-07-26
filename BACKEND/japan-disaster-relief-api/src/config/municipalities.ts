/**
 * Municipality IDs are based on the 総務省 code registry. Boundaries below are
 * approximate bounding boxes, NOT official polygons; matching is advisory only,
 * and the user can always manually select a municipality.
 * reviewStatus: draft — codes and coordinates must be verified against official
 * data before the 比赛版本.
 */
import type { Municipality } from "@nikuman-yummy/shared";

export type MunicipalityReference = Municipality & {
	bounds: {
		minLat: number;
		maxLat: number;
		minLng: number;
		maxLng: number;
	};
	centroid: {
		latitude: number;
		longitude: number;
	};
};

export const MUNICIPALITIES: readonly MunicipalityReference[] = [
	{
		municipalityId: "13101",
		name: { ja: "千代田区", en: "Chiyoda City", zhHans: "千代田区" },
		bounds: { minLat: 35.669, maxLat: 35.705, minLng: 139.738, maxLng: 139.782 },
		centroid: { latitude: 35.694, longitude: 139.7536 },
	},
	{
		municipalityId: "13102",
		name: { ja: "中央区", en: "Chuo City", zhHans: "中央区" },
		bounds: { minLat: 35.648, maxLat: 35.696, minLng: 139.755, maxLng: 139.81 },
		centroid: { latitude: 35.6707, longitude: 139.7727 },
	},
	{
		municipalityId: "13103",
		name: { ja: "港区", en: "Minato City", zhHans: "港区" },
		bounds: { minLat: 35.623, maxLat: 35.682, minLng: 139.708, maxLng: 139.776 },
		centroid: { latitude: 35.6581, longitude: 139.7516 },
	},
	{
		municipalityId: "13104",
		name: { ja: "新宿区", en: "Shinjuku City", zhHans: "新宿区" },
		bounds: { minLat: 35.673, maxLat: 35.729, minLng: 139.673, maxLng: 139.748 },
		centroid: { latitude: 35.6938, longitude: 139.7034 },
	},
	{
		municipalityId: "13105",
		name: { ja: "文京区", en: "Bunkyo City", zhHans: "文京区" },
		bounds: { minLat: 35.699, maxLat: 35.735, minLng: 139.727, maxLng: 139.779 },
		centroid: { latitude: 35.7081, longitude: 139.7522 },
	},
	{
		municipalityId: "13106",
		name: { ja: "台東区", en: "Taito City", zhHans: "台东区" },
		bounds: { minLat: 35.7, maxLat: 35.735, minLng: 139.768, maxLng: 139.806 },
		centroid: { latitude: 35.7126, longitude: 139.78 },
	},
	{
		municipalityId: "13107",
		name: { ja: "墨田区", en: "Sumida City", zhHans: "墨田区" },
		bounds: { minLat: 35.686, maxLat: 35.733, minLng: 139.791, maxLng: 139.843 },
		centroid: { latitude: 35.7107, longitude: 139.8016 },
	},
	{
		municipalityId: "13108",
		name: { ja: "江東区", en: "Koto City", zhHans: "江东区" },
		bounds: { minLat: 35.585, maxLat: 35.702, minLng: 139.786, maxLng: 139.85 },
		centroid: { latitude: 35.6728, longitude: 139.8174 },
	},
	{
		municipalityId: "13109",
		name: { ja: "品川区", en: "Shinagawa City", zhHans: "品川区" },
		bounds: { minLat: 35.58, maxLat: 35.642, minLng: 139.7, maxLng: 139.776 },
		centroid: { latitude: 35.6092, longitude: 139.7302 },
	},
	{
		municipalityId: "13110",
		name: { ja: "目黒区", en: "Meguro City", zhHans: "目黑区" },
		bounds: { minLat: 35.6, maxLat: 35.659, minLng: 139.667, maxLng: 139.72 },
		centroid: { latitude: 35.6415, longitude: 139.6982 },
	},
	{
		municipalityId: "13111",
		name: { ja: "大田区", en: "Ota City", zhHans: "大田区" },
		bounds: { minLat: 35.52, maxLat: 35.605, minLng: 139.65, maxLng: 139.815 },
		centroid: { latitude: 35.5614, longitude: 139.7161 },
	},
	{
		municipalityId: "13112",
		name: { ja: "世田谷区", en: "Setagaya City", zhHans: "世田谷区" },
		bounds: { minLat: 35.59, maxLat: 35.682, minLng: 139.582, maxLng: 139.686 },
		centroid: { latitude: 35.6466, longitude: 139.6532 },
	},
	{
		municipalityId: "13113",
		name: { ja: "渋谷区", en: "Shibuya City", zhHans: "涩谷区" },
		bounds: { minLat: 35.638, maxLat: 35.692, minLng: 139.668, maxLng: 139.724 },
		centroid: { latitude: 35.664, longitude: 139.6982 },
	},
	{
		municipalityId: "13114",
		name: { ja: "中野区", en: "Nakano City", zhHans: "中野区" },
		bounds: { minLat: 35.683, maxLat: 35.735, minLng: 139.624, maxLng: 139.693 },
		centroid: { latitude: 35.7074, longitude: 139.6638 },
	},
	{
		municipalityId: "13115",
		name: { ja: "杉並区", en: "Suginami City", zhHans: "杉并区" },
		bounds: { minLat: 35.673, maxLat: 35.735, minLng: 139.585, maxLng: 139.652 },
		centroid: { latitude: 35.6995, longitude: 139.6364 },
	},
	{
		municipalityId: "13116",
		name: { ja: "豊島区", en: "Toshima City", zhHans: "丰岛区" },
		bounds: { minLat: 35.713, maxLat: 35.743, minLng: 139.678, maxLng: 139.75 },
		centroid: { latitude: 35.7263, longitude: 139.7167 },
	},
	{
		municipalityId: "13117",
		name: { ja: "北区", en: "Kita City", zhHans: "北区" },
		bounds: { minLat: 35.735, maxLat: 35.798, minLng: 139.68, maxLng: 139.765 },
		centroid: { latitude: 35.7528, longitude: 139.7335 },
	},
	{
		municipalityId: "13118",
		name: { ja: "荒川区", en: "Arakawa City", zhHans: "荒川区" },
		bounds: { minLat: 35.724, maxLat: 35.754, minLng: 139.755, maxLng: 139.81 },
		centroid: { latitude: 35.7361, longitude: 139.7834 },
	},
	{
		municipalityId: "13119",
		name: { ja: "板橋区", en: "Itabashi City", zhHans: "板桥区" },
		bounds: { minLat: 35.736, maxLat: 35.801, minLng: 139.624, maxLng: 139.722 },
		centroid: { latitude: 35.7512, longitude: 139.7093 },
	},
	{
		municipalityId: "13120",
		name: { ja: "練馬区", en: "Nerima City", zhHans: "练马区" },
		bounds: { minLat: 35.711, maxLat: 35.779, minLng: 139.562, maxLng: 139.681 },
		centroid: { latitude: 35.7356, longitude: 139.6517 },
	},
	{
		municipalityId: "13121",
		name: { ja: "足立区", en: "Adachi City", zhHans: "足立区" },
		bounds: { minLat: 35.735, maxLat: 35.817, minLng: 139.735, maxLng: 139.845 },
		centroid: { latitude: 35.7757, longitude: 139.8049 },
	},
	{
		municipalityId: "13122",
		name: { ja: "葛飾区", en: "Katsushika City", zhHans: "葛饰区" },
		bounds: { minLat: 35.716, maxLat: 35.793, minLng: 139.81, maxLng: 139.898 },
		centroid: { latitude: 35.7434, longitude: 139.8472 },
	},
	{
		municipalityId: "13123",
		name: { ja: "江戸川区", en: "Edogawa City", zhHans: "江户川区" },
		bounds: { minLat: 35.632, maxLat: 35.783, minLng: 139.839, maxLng: 139.924 },
		centroid: { latitude: 35.7066, longitude: 139.8683 },
	},
];
