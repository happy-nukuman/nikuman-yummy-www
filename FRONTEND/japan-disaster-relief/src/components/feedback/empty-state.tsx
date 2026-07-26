type EmptyStateProps = {
	message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
	return (
		<p className="text-lg text-gray-600" role="status" aria-live="polite">
			{message}
		</p>
	);
}
