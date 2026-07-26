type ErrorStateProps = {
	message: string;
	onRetry?: () => void;
	retrying?: boolean;
};

export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
	return (
		<div className="flex flex-col items-center gap-3 text-center" role="alert" aria-live="assertive">
			<p className="text-lg text-red-700">{message}</p>
			{onRetry && (
				<button
					className="rounded bg-red-700 px-4 py-2 font-medium text-white disabled:opacity-60"
					type="button"
					onClick={onRetry}
					disabled={retrying}
				>
					{retrying ? "Retrying…" : "Try again"}
				</button>
			)}
		</div>
	);
}
