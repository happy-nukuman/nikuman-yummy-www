const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = configuredBaseUrl || "http://localhost:8787";
export const USE_API_MOCK = process.env.NEXT_PUBLIC_API_MOCK !== "false";
export const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;
