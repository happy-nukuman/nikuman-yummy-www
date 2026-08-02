const TOTAL_STEPS = 5;

/** Five-segment progress bar; the first `on` segments are highlighted. */
export function Progress({ on }: { on: number }) {
	return (
		<div className="progress">
			{Array.from({ length: TOTAL_STEPS }, (_, i) => (
				<span key={i} className={i < on ? "on" : undefined} />
			))}
		</div>
	);
}
