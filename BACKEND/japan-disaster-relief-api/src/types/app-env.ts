export type AppEnv = {
	Bindings: {
		DB?: D1Database;
	};
	Variables: {
		requestId: string;
	};
};
