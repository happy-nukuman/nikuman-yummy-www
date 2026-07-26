CREATE TABLE facilities (
	facility_id TEXT PRIMARY KEY,
	name_ja TEXT NOT NULL,
	name_en TEXT,
	name_zh_hans TEXT,
	facility_type TEXT NOT NULL CHECK (facility_type IN ('evacuation_area', 'evacuation_shelter')),
	municipality_id TEXT NOT NULL,
	address TEXT NOT NULL,
	latitude REAL NOT NULL,
	longitude REAL NOT NULL,
	accessibility TEXT,
	source_url TEXT NOT NULL,
	source_updated_at TEXT NOT NULL
);
CREATE INDEX idx_facilities_municipality ON facilities (municipality_id);

CREATE TABLE dataset_meta (
	id INTEGER PRIMARY KEY,
	source_name TEXT NOT NULL,
	source_url TEXT NOT NULL,
	source_updated_at TEXT NOT NULL,
	license TEXT NOT NULL,
	acquired_at TEXT NOT NULL,
	realtime INTEGER NOT NULL DEFAULT 0
);
