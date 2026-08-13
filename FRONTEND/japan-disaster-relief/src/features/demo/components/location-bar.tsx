import { LocationIcon } from "@/features/demo/components/app-icons";

interface LocationBarProps {
	label: string;
}

/** App-shell location status shared by every screen that displays demo location. */
export function LocationBar({ label }: LocationBarProps) {
	return (
		<div className="loc-bar">
			<LocationIcon aria-hidden />
			<span>{label}</span>
		</div>
	);
}
