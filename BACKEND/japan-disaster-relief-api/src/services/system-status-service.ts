import type { HelloResponse } from "@nikuman-yummy/shared";

export function getSystemStatus(): HelloResponse {
	return {
		message: "hello world!",
	};
}
