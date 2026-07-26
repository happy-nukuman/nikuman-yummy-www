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

type ApiGetOptions = {
	signal?: AbortSignal;
	timeoutMs?: number;
};

export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
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
			return await getMockResponse<T>("GET", path, controller.signal);
		}

		const response = await fetch(`${API_BASE_URL}${path}`, {
			headers: {
				Accept: "application/json",
			},
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new ApiClientError(
				"HTTP_ERROR",
				`GET ${path} returned HTTP ${response.status}.`,
				response.status,
			);
		}

		try {
			return (await response.json()) as T;
		} catch {
			throw new ApiClientError("INVALID_RESPONSE", `GET ${path} returned invalid JSON.`);
		}
	} catch (error) {
		if (error instanceof ApiClientError) {
			throw error;
		}

		if (controller.signal.aborted) {
			throw new ApiClientError(
				didTimeout ? "REQUEST_TIMEOUT" : "REQUEST_ABORTED",
				didTimeout ? `GET ${path} timed out.` : `GET ${path} was aborted.`,
			);
		}

		throw new ApiClientError("NETWORK_ERROR", `GET ${path} failed before receiving a response.`);
	} finally {
		globalThis.clearTimeout(timeoutId);
		options.signal?.removeEventListener("abort", handleExternalAbort);
	}
}
