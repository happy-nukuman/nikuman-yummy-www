export const ALLOWED_ORIGINS = [
	"http://localhost:3000",
	"https://front-japan-disaster-relief.tokyo-odh-108.workers.dev",
] as const;

// DELETE is only needed by the contest demo alert control endpoint.
export const ALLOWED_METHODS = ["GET", "POST", "DELETE", "OPTIONS"] as const;
