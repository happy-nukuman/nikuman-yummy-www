type LoadingStateProps = {
	message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
	return (
		<p className="text-lg" role="status" aria-live="polite">
			{message}
		</p>
	);
}
