export type ApiResponseMeta = {
	source?: string;
	updatedAt?: string;
	fallback?: boolean;
};

export type ApiResponse<T> = {
	data: T;
	meta?: ApiResponseMeta;
};

export type ApiErrorCode =
	| "BAD_REQUEST"
	| "NOT_FOUND"
	| "INTERNAL_ERROR"
	| "UPSTREAM_UNAVAILABLE";

export type ApiErrorResponse = {
	error: {
		code: ApiErrorCode;
		message: string;
		requestId: string;
	};
};

export type HealthResponse = {
	status: "ok";
};

export type HelloResponse = {
	message: string;
};
