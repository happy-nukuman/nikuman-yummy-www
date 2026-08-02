export type DemoShelterRecord = {
	facilityId: string;
	nameJa: string;
	addressJa: string;
	latitude: number;
	longitude: number;
};

/**
 * P0 demo snapshot around 東京都庁. Names, addresses and coordinates come from
 * Shinjuku City's shelter dataset in the Tokyo Open Data Catalogue.
 * This dataset is not a live feed of shelter opening status.
 */
export const DEMO_SHELTERS: readonly DemoShelterRecord[] = [
	{
		facilityId: "demo-shinjuku-nishi-shinjuku-elementary",
		nameJa: "西新宿小学校",
		addressJa: "東京都新宿区西新宿4-35-5",
		latitude: 35.68602,
		longitude: 139.68748,
	},
	{
		facilityId: "demo-shinjuku-nishi-shinjuku-junior-high",
		nameJa: "西新宿中学校",
		addressJa: "東京都新宿区西新宿8-2-44",
		latitude: 35.6963,
		longitude: 139.69505,
	},
	{
		facilityId: "demo-shinjuku-kashiwagi-elementary",
		nameJa: "柏木小学校",
		addressJa: "東京都新宿区北新宿2-11-1",
		latitude: 35.70024,
		longitude: 139.6895,
	},
	{
		facilityId: "demo-shinjuku-metropolitan-high-school",
		nameJa: "都立新宿高等学校",
		addressJa: "東京都新宿区内藤町11-4",
		latitude: 35.68932,
		longitude: 139.70537,
	},
	{
		facilityId: "demo-shinjuku-yodobashi-fourth-elementary",
		nameJa: "淀橋第四小学校",
		addressJa: "東京都新宿区北新宿3-17-1",
		latitude: 35.70396,
		longitude: 139.69121,
	},
	{
		facilityId: "demo-shinjuku-okubo-elementary",
		nameJa: "大久保小学校",
		addressJa: "東京都新宿区大久保1-1-21",
		latitude: 35.69895,
		longitude: 139.70615,
	},
	{
		facilityId: "demo-shinjuku-tenjin-elementary",
		nameJa: "天神小学校",
		addressJa: "東京都新宿区新宿6-14-2",
		latitude: 35.69531,
		longitude: 139.70984,
	},
	{
		facilityId: "demo-shinjuku-toyama-elementary",
		nameJa: "戸山小学校",
		addressJa: "東京都新宿区百人町2-1-38",
		latitude: 35.70296,
		longitude: 139.70207,
	},
	{
		facilityId: "demo-shinjuku-junior-high",
		nameJa: "新宿中学校",
		addressJa: "東京都新宿区新宿6-15-22",
		latitude: 35.69507,
		longitude: 139.71135,
	},
	{
		facilityId: "demo-shinjuku-tokyo-medical-university",
		nameJa: "東京医科大学",
		addressJa: "東京都新宿区新宿6-1-1",
		latitude: 35.69355,
		longitude: 139.71225,
	},
] as const;

export const DEMO_SHELTER_SOURCE = {
	name: "新宿区の避難所情報",
	url: "https://catalog.data.metro.tokyo.lg.jp/dataset/t131041d0000000055",
	updatedAt: "2025-12-12",
	realtime: false,
} as const;
