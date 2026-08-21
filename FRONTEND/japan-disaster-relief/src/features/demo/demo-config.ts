/**
 * Demo-only presentation configuration.
 * Replace this object with Backend `lastSuccessfulSyncAt` when real scheduled
 * ingestion exists; it must not be described as an official-source sync time.
 */
export const DEMO_SYNC_STATUS = {
	time: "08:30",
	timezone: "JST",
} as const;

/** 团队名与服务名 Tokyo Safe First 分开维护。 */
export const DEMO_TEAM_NAME = "焼き小籠包 Team";

export type DemoSyncStatus = typeof DEMO_SYNC_STATUS;
