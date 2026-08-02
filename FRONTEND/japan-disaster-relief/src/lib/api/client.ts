import { API_BASE_URL, DEFAULT_REQUEST_TIMEOUT_MS, USE_API_MOCK } from "./config";
import { getMockResponse } from "./mock";

export type ApiClientErrorCode =
	| "HTTP_ERROR"
	| "INVALID_RESPONSE"
	| "NETWORK_ERROR"
	| "REQUEST_ABORTED"
	| "REQUEST_TIMEOUT";

export class ApiClientError extends Error {
	constructor(
		readonly code: ApiClientErrorCode,
		message: string,
		readonly status?: number,
	) {
		super(message);
		this.name = "ApiClientError";
	}
}

export type ApiRequestOptions = {
	signal?: AbortSignal;
	timeoutMs?: number;
};

type ApiMethod = "GET" | "POST";

async function apiRequest<TResponse>(
	method: ApiMethod,
	path: string,
	body: unknown,
	options: ApiRequestOptions,
): Promise<TResponse> {
	const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
	const controller = new AbortController();
	let didTimeout = false;

	const handleExternalAbort = () => controller.abort(options.signal?.reason);
	if (options.signal?.aborted) {
		handleExternalAbort();
	} else {
		options.signal?.addEventListener("abort", handleExternalAbort, { once: true });
	}

	const timeoutId = globalThis.setTimeout(() => {
		didTimeout = true;
		controller.abort();
	}, timeoutMs);

	try {
		if (USE_API_MOCK) {
			return await getMockResponse<TResponse>(method, path, controller.signal, body);
		}

		const response = await fetch(`${API_BASE_URL}${path}`, {
			method,
			headers: {
				Accept: "application/json",
				...(body !== undefined && { "Content-Type": "application/json" }),
			},
			...(body !== undefined && { body: JSON.stringify(body) }),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new ApiClientError(
				"HTTP_ERROR",
				`${method} ${path} returned HTTP ${response.status}.`,
				response.status,
			);
		}

		try {
			return (await response.json()) as TResponse;
		} catch {
			throw new ApiClientError("INVALID_RESPONSE", `${method} ${path} returned invalid JSON.`);
		}
	} catch (error) {
		if (error instanceof ApiClientError) {
			throw error;
		}

		if (controller.signal.aborted) {
			throw new ApiClientError(
				didTimeout ? "REQUEST_TIMEOUT" : "REQUEST_ABORTED",
				didTimeout ? `${method} ${path} timed out.` : `${method} ${path} was aborted.`,
			);
		}

		throw new ApiClientError(
			"NETWORK_ERROR",
			`${method} ${path} failed before receiving a response.`,
		);
	} finally {
		globalThis.clearTimeout(timeoutId);
		options.signal?.removeEventListener("abort", handleExternalAbort);
	}
}

export function apiGet<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
	return apiRequest<TResponse>("GET", path, undefined, options);
}

export function apiPost<TRequest, TResponse>(
	path: string,
	body: TRequest,
	options: ApiRequestOptions = {},
): Promise<TResponse> {
	return apiRequest<TResponse>("POST", path, body, options);
}
