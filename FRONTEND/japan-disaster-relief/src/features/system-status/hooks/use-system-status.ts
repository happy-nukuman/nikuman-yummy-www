"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSystemStatus } from "../api/fetch-system-status";

export function useSystemStatus() {
	return useQuery({
		queryKey: ["system-status"],
		queryFn: ({ signal }) => fetchSystemStatus(signal),
	});
}
