export type AppEnv = {
	Bindings: {
		DB?: D1Database;
		GEMINI_API_KEY?: string;
	};
	Variables: {
		requestId: string;
	};
};
