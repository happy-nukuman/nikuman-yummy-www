import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	);
}

export function TranslateIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M7 18.5 3.5 21l1.2-4.2A8 8 0 1 1 7 18.5Z" />
		</IconBase>
	);
}

export function GlobeIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
		</IconBase>
	);
}

export function LocationIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
			<circle cx="12" cy="10" r="2.5" />
		</IconBase>
	);
}

export function ChecklistIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M9 5h9M9 12h9M9 19h9M3.5 5l1 1 2-2M3.5 12l1 1 2-2M3.5 19l1 1 2-2" />
		</IconBase>
	);
}

export function SirenIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M7 17v-6a5 5 0 0 1 10 0v6M5 21h14M4 17h16M12 2v2M4.2 5.2l1.5 1.5M19.8 5.2l-1.5 1.5" />
		</IconBase>
	);
}

export function ShelterIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="5" r="2" />
			<path d="m9 21 1.5-7-3-2 2-4 4 1 2 4M10.5 14l4 3.5M6 21h12" />
		</IconBase>
	);
}

export function DisasterIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M4 14h3l2-5 3 9 2-6 2 2h4M5 5h14v14H5z" />
		</IconBase>
	);
}

export function CommunicationIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M21 11.5a8 8 0 0 1-8.5 8 9 9 0 0 1-3.8-.8L3 21l1.8-5A8 8 0 1 1 21 11.5Z" />
			<path d="M8 11h.01M12 11h.01M16 11h.01" />
		</IconBase>
	);
}

export function ShieldIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M12 3 4.5 6v5.5c0 4.7 3.2 7.7 7.5 9.5 4.3-1.8 7.5-4.8 7.5-9.5V6L12 3Z" />
			<path d="m9 12 2 2 4-4" />
		</IconBase>
	);
}

export function ChevronRightIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="m9 5 7 7-7 7" />
		</IconBase>
	);
}

export function CloseIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="m6 6 12 12M18 6 6 18" />
		</IconBase>
	);
}
