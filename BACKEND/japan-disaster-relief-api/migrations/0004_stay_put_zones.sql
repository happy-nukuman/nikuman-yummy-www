CREATE TABLE stay_put_zones (
	zone_id TEXT PRIMARY KEY,
	name_ja TEXT NOT NULL,
	municipality_id TEXT NOT NULL,
	chome_json TEXT NOT NULL,
	area_ha REAL,
	population INTEGER,
	polygon_json TEXT,
	source_url TEXT NOT NULL,
	source_updated_at TEXT NOT NULL
);
CREATE INDEX idx_stay_put_zones_municipality ON stay_put_zones (municipality_id);
