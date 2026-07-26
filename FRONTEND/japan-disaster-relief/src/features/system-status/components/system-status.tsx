"use client";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { useSystemStatus } from "../hooks/use-system-status";

export function SystemStatus() {
	const { data, isPending, isError, isFetching, refetch } = useSystemStatus();

	if (isPending) {
		return <LoadingState message="Checking backend connection…" />;
	}

	if (isError) {
		return (
			<ErrorState
				message="The service status is temporarily unavailable."
				onRetry={() => void refetch()}
				retrying={isFetching}
			/>
		);
	}

	if (!data) {
		return <EmptyState message="No service status is available." />;
	}

	return (
		<section className="text-center" aria-labelledby="system-status-heading">
			<h2 id="system-status-heading" className="text-sm text-gray-500">
				Backend connection
			</h2>
			<p className="text-4xl font-semibold">{data.message}</p>
		</section>
	);
}
