/**
 * Trimmed real capture of https://www.jma.go.jp/bosai/quake/data/list.json
 * (fetched 2026-07-26). Only the `int` arrays were shortened; every other field is
 * exactly as the feed published it, including the quirks the mapping has to survive:
 *
 * - one event (`eid`) appears as several reports: 震度速報 without epicenter or
 *   magnitude, then 震源・震度情報, then an update whose `maxi` is empty again;
 * - the report with the newest `ctt` is therefore not always the usable one;
 * - `ser` is sometimes a string and sometimes a number;
 * - 最大震度 codes use "5-" style notation, and 震源に関する情報 has none at all.
 *
 * Reference instants used by the tests: 2026-06-28T05:21+09:00 (岩手県沖 M6.1,
 * 最大震度5-) and 2026-06-26T22:29+09:00 (山梨県東部・富士五湖 M5.6, 最大震度6-).
 */
export const JMA_QUAKE_LIST_FIXTURE: readonly unknown[] = [
	{
		"ctt": "20260628052624",
		"eid": "20260628052159",
		"rdt": "2026-06-28T05:26:00+09:00",
		"ttl": "震源・震度情報",
		"ift": "発表",
		"ser": "1",
		"at": "2026-06-28T05:21:00+09:00",
		"anm": "岩手県沖",
		"acd": "286",
		"cod": "+40.2+142.4-40000/",
		"mag": "6.1",
		"maxi": "5-",
		"int": [
			{
				"code": "02",
				"maxi": "5-",
				"city": [
					{
						"code": "0220300",
						"maxi": "5-"
					}
				]
			}
		],
		"json": "20260628052624_20260628052159_VXSE5k_1.json",
		"en_ttl": "Earthquake and Seismic Intensity Information",
		"en_anm": "Off the Coast of Iwate Prefecture"
	},
	{
		"ctt": "20260628072509",
		"eid": "20260628052159",
		"rdt": "2026-06-28T07:25:00+09:00",
		"ttl": "顕著な地震の震源要素更新のお知らせ",
		"ift": "発表",
		"ser": 0,
		"at": "2026-06-28T05:21:00+09:00",
		"anm": "岩手県沖",
		"acd": "286",
		"cod": "+4012.4+14222.0-41000/",
		"mag": "6.1",
		"maxi": "",
		"int": [],
		"json": "20260628072509_20260628052159_VXSE61_0.json",
		"en_ttl": "",
		"en_anm": "Off the Coast of Iwate Prefecture"
	},
	{
		"ctt": "20260628052429",
		"eid": "20260628052159",
		"rdt": "2026-06-28T05:24:00+09:00",
		"ttl": "震度速報",
		"ift": "発表",
		"ser": 0,
		"at": "2026-06-28T05:21:00+09:00",
		"anm": "",
		"acd": "",
		"cod": "",
		"mag": "",
		"maxi": "5-",
		"int": [
			{
				"code": "02",
				"maxi": "5-",
				"city": []
			}
		],
		"json": "20260628052429_20260628052159_VXSE51_0.json",
		"en_ttl": "Seismic Intensity Information",
		"en_anm": ""
	},
	{
		"ctt": "20260628024636",
		"eid": "20260628024359",
		"rdt": "2026-06-28T02:46:00+09:00",
		"ttl": "震源・震度情報",
		"ift": "発表",
		"ser": "1",
		"at": "2026-06-28T02:43:00+09:00",
		"anm": "岩手県沿岸南部",
		"acd": "211",
		"cod": "+39.3+141.8-70000/",
		"mag": "3.4",
		"maxi": "1",
		"int": [
			{
				"code": "03",
				"maxi": "1",
				"city": [
					{
						"code": "0321100",
						"maxi": "1"
					}
				]
			}
		],
		"json": "20260628024636_20260628024359_VXSE5k_1.json",
		"en_ttl": "Earthquake and Seismic Intensity Information",
		"en_anm": "Southern Coast of Iwate Prefecture"
	},
	{
		"ctt": "20260627023555",
		"eid": "20260627023300",
		"rdt": "2026-06-27T02:35:00+09:00",
		"ttl": "震源・震度情報",
		"ift": "発表",
		"ser": "1",
		"at": "2026-06-27T02:33:00+09:00",
		"anm": "福島県会津",
		"acd": "252",
		"cod": "+37.1+139.4-10000/",
		"mag": "3.6",
		"maxi": "3",
		"int": [
			{
				"code": "07",
				"maxi": "3",
				"city": [
					{
						"code": "0736400",
						"maxi": "3"
					}
				]
			}
		],
		"json": "20260627023555_20260627023300_VXSE5k_1.json",
		"en_ttl": "Earthquake and Seismic Intensity Information",
		"en_anm": "Aizu,  Fukushima Prefecture"
	},
	{
		"ctt": "20260627023511",
		"eid": "20260627023300",
		"rdt": "2026-06-27T02:35:00+09:00",
		"ttl": "震源に関する情報",
		"ift": "発表",
		"ser": 0,
		"at": "2026-06-27T02:33:00+09:00",
		"anm": "福島県会津",
		"acd": "252",
		"cod": "+37.1+139.4-10000/",
		"mag": "3.6",
		"maxi": "",
		"int": [],
		"json": "20260627023511_20260627023300_VXSE52_0.json",
		"en_ttl": "Earthquake Information",
		"en_anm": "Aizu,  Fukushima Prefecture"
	},
	{
		"ctt": "20260626232058",
		"eid": "20260626231746",
		"rdt": "2026-06-26T23:20:00+09:00",
		"ttl": "震源・震度情報",
		"ift": "発表",
		"ser": "1",
		"at": "2026-06-26T23:17:00+09:00",
		"anm": "山梨県東部・富士五湖",
		"acd": "412",
		"cod": "+35.5+139.0-20000/",
		"mag": "3.3",
		"maxi": "3",
		"int": [
			{
				"code": "19",
				"maxi": "3",
				"city": [
					{
						"code": "1920600",
						"maxi": "3"
					}
				]
			}
		],
		"json": "20260626232058_20260626231746_VXSE5k_1.json",
		"en_ttl": "Earthquake and Seismic Intensity Information",
		"en_anm": "Eastern Region · Fuji Five Lakes, Yamanashi Prefecture"
	},
	{
		"ctt": "20260626224113",
		"eid": "20260626222902",
		"rdt": "2026-06-26T22:41:00+09:00",
		"ttl": "震源・震度情報",
		"ift": "発表",
		"ser": "2",
		"at": "2026-06-26T22:29:00+09:00",
		"anm": "山梨県東部・富士五湖",
		"acd": "412",
		"cod": "+35.6+139.0-20000/",
		"mag": "5.6",
		"maxi": "6-",
		"int": [
			{
				"code": "19",
				"maxi": "6-",
				"city": [
					{
						"code": "1943000",
						"maxi": "6-"
					}
				]
			}
		],
		"json": "20260626224113_20260626222902_VXSE5k_2.json",
		"en_ttl": "Earthquake and Seismic Intensity Information",
		"en_anm": "Eastern Region · Fuji Five Lakes, Yamanashi Prefecture"
	},
	{
		"ctt": "20260626223412",
		"eid": "20260626222902",
		"rdt": "2026-06-26T22:34:00+09:00",
		"ttl": "震源・震度情報",
		"ift": "発表",
		"ser": "1",
		"at": "2026-06-26T22:29:00+09:00",
		"anm": "山梨県東部・富士五湖",
		"acd": "412",
		"cod": "+35.6+139.0-20000/",
		"mag": "5.6",
		"maxi": "6-",
		"int": [
			{
				"code": "19",
				"maxi": "6-",
				"city": [
					{
						"code": "1943000",
						"maxi": "6-"
					}
				]
			}
		],
		"json": "20260626223412_20260626222902_VXSE5k_1.json",
		"en_ttl": "Earthquake and Seismic Intensity Information",
		"en_anm": "Eastern Region · Fuji Five Lakes, Yamanashi Prefecture"
	}
];
