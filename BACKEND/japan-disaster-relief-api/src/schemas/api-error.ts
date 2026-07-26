import type { ApiErrorCode, ApiErrorResponse } from "@nikuman-yummy/shared";

export function createApiErrorResponse(
	code: ApiErrorCode,
	message: string,
	requestId: string,
): ApiErrorResponse {
	return {
		error: {
			code,
			message,
			requestId,
		},
	};
}
