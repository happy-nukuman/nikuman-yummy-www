import type { HelloResponse } from "@nikuman-yummy/shared";
import { apiGet } from "@/lib/api/client";

export function fetchSystemStatus(signal?: AbortSignal): Promise<HelloResponse> {
	return apiGet<HelloResponse>("/api/hello", { signal });
}
