import type { HelloResponse } from "@nikuman-yummy/shared";

const mocks = new Map<string, unknown>([
	["GET /api/hello", { message: "hello world!" } satisfies HelloResponse],
]);

async function waitForMockLatency(signal: AbortSignal): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const handleResolve = () => {
			signal.removeEventListener("abort", handleAbort);
			resolve();
		};
		const handleAbort = () => {
			globalThis.clearTimeout(timeoutId);
			reject(new DOMException("Mock request aborted.", "AbortError"));
		};
		const timeoutId = globalThis.setTimeout(handleResolve, 300);

		if (signal.aborted) {
			handleAbort();
		} else {
			signal.addEventListener("abort", handleAbort, { once: true });
		}
	});
}

export async function getMockResponse<T>(
	method: "GET",
	path: string,
	signal: AbortSignal,
): Promise<T> {
	const mock = mocks.get(`${method} ${path}`);
	if (mock === undefined) {
		throw new Error(`No mock registered for ${method} ${path}`);
	}

	await waitForMockLatency(signal);
	return mock as T;
}
