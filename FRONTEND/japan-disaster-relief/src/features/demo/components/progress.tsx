const TOTAL_STEPS = 5;

/** Five-segment progress bar; the first `on` segments are highlighted. */
export function Progress({ on, label }: { on: number; label: string }) {
	const currentStep = Math.min(TOTAL_STEPS, Math.max(1, on));
	return (
		<div
			className="progress"
			role="progressbar"
			aria-label={label}
			aria-valuemin={1}
			aria-valuemax={TOTAL_STEPS}
			aria-valuenow={currentStep}
		>
			{Array.from({ length: TOTAL_STEPS }, (_, i) => (
				<span key={i} className={i < currentStep ? "on" : undefined} />
			))}
		</div>
	);
}
