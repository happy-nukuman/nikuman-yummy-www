CREATE TABLE demo_alerts (
	id TEXT PRIMARY KEY,
	type TEXT NOT NULL,
	title_ja TEXT NOT NULL,
	title_en TEXT,
	title_zh_hans TEXT,
	issued_at TEXT NOT NULL,
	source TEXT NOT NULL DEFAULT 'demo-mock'
);
