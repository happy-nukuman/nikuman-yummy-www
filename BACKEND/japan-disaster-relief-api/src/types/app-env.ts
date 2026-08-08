export type AppEnv = {
	Bindings: {
		DB?: D1Database;
		AI?: Ai;
		GEMINI_API_KEY?: string;
	};
	Variables: {
		requestId: string;
	};
};
