import type { ReactElement, SVGProps } from "react";

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

export function HomeIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="m3 11 9-8 9 8" />
			<path d="M5 10v10h14V10M9 20v-6h6v6" />
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

export function PhoneIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M8.2 3.8 10 8.2 7.8 9.7a14.8 14.8 0 0 0 6.5 6.5l1.5-2.2 4.4 1.8v3.4c0 1-1 1.8-2 1.7A17.1 17.1 0 0 1 3.1 5.8c-.1-1 .7-2 1.7-2h3.4Z" />
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

export function CheckIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="m4.5 12.5 5 5L19.5 7" />
		</IconBase>
	);
}

export function AlertTriangleIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M10.3 4.6 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0Z" />
			<path d="M12 9.5v4.5M12 17.3h.01" />
		</IconBase>
	);
}

export function FirstAidIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<rect x="3" y="7" width="18" height="13" rx="2.5" />
			<path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
			<path d="M12 10.5v6M9 13.5h6" />
		</IconBase>
	);
}

export function LifeBuoyIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="9" />
			<circle cx="12" cy="12" r="3.8" />
			<path d="M12 3v5.2M12 15.8V21M3 12h5.2M15.8 12H21" />
		</IconBase>
	);
}

export function BuildingIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
			<path d="M15 9h2a2 2 0 0 1 2 2v10" />
			<path d="M3 21h18" />
			<path d="M8.5 7h3M8.5 11h3M8.5 15h3" />
		</IconBase>
	);
}

export function HelpIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M9.4 9.3a2.7 2.7 0 1 1 3.9 3c-.8.5-1.3 1-1.3 1.9" />
			<path d="M12 17.2h.01" />
		</IconBase>
	);
}

export function NauseaIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M8.7 9.8h.01M15.3 9.8h.01" />
			<path d="M8.2 15.4c1.1-1 2-1 2.9-.3.9.7 1.8.7 2.7 0 .9-.7 1.8-.7 2.9.3" />
		</IconBase>
	);
}

export function MegaphoneIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="m3 11 18-5v12L3 14v-3Z" />
			<path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
		</IconBase>
	);
}

export function HardHatIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M10 9.5V6a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 14 6v3.5" />
			<path d="M4 15.5v-.7a8 8 0 0 1 5-7.4M15 7.4a8 8 0 0 1 5 7.4v.7" />
			<path d="M3.5 15.5h17a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
		</IconBase>
	);
}

export function FlameIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
		</IconBase>
	);
}

export function WaveIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M2 8c.6.5 1.2 1 2.5 1C7 9 7 7 9.5 7c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
			<path d="M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
		</IconBase>
	);
}

export function CompassIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="m15.6 8.4-1.9 5.3-5.3 1.9 1.9-5.3 5.3-1.9Z" />
		</IconBase>
	);
}

export function ThermometerIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
		</IconBase>
	);
}

export function SpeakerIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M11 5 6.5 8.5H3.5v7h3L11 19V5Z" />
			<path d="M14.5 9.5a3.8 3.8 0 0 1 0 5M17 7a7.2 7.2 0 0 1 0 10" />
		</IconBase>
	);
}

export function StopIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<rect x="6" y="6" width="12" height="12" rx="2" />
		</IconBase>
	);
}

export function WalletIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M18.5 8V6a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18V9.5A1.5 1.5 0 0 0 18.5 8H4" />
			<path d="M15.8 13.7h.01" />
		</IconBase>
	);
}

export function CarIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M19.5 16.5H21a1 1 0 0 0 1-1v-2.6c0-.9-.6-1.7-1.5-1.9l-3.3-.7-2.3-2.6a2 2 0 0 0-1.5-.7H7.2a2 2 0 0 0-1.7 1L4 10.8l-1.3.5A1.6 1.6 0 0 0 2 12.8v2.7a1 1 0 0 0 1 1h1.5" />
			<circle cx="7" cy="16.5" r="2" />
			<circle cx="17" cy="16.5" r="2" />
			<path d="M9 16.5h6" />
		</IconBase>
	);
}

export function SunIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
		</IconBase>
	);
}

export function ElevatorIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<rect x="4.5" y="3.5" width="15" height="17" rx="2" />
			<path d="m7.5 10.2 2-2.7 2 2.7" />
			<path d="m12.5 13.8 2 2.7 2-2.7" />
		</IconBase>
	);
}

export function TyphoonIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M20 5.5H4M18 9.5H7M16.5 13.5H9.5M14.5 17.5h-3.5M12.5 21h-.5" />
		</IconBase>
	);
}

export function StormIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M17.5 16.5a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7 1.2A3.7 3.7 0 0 0 7.5 17" />
			<path d="m12.5 12-2.5 4.5h4L11.5 21" />
		</IconBase>
	);
}

/**
 * 选项 / 信息卡图标注册表：flows.ts、demo-app.tsx、disaster-info.ts 里的
 * icon 键在这里解析成与首页一致的线条图标和语义配色（tone-* 类）。
 */
const GLYPHS: Record<string, { Icon: (props: IconProps) => ReactElement; tone: string }> = {
	check: { Icon: CheckIcon, tone: "green" },
	warning: { Icon: AlertTriangleIcon, tone: "amber" },
	bandage: { Icon: FirstAidIcon, tone: "red" },
	sos: { Icon: LifeBuoyIcon, tone: "red" },
	home: { Icon: HomeIcon, tone: "blue" },
	building: { Icon: BuildingIcon, tone: "blue" },
	help: { Icon: HelpIcon, tone: "slate" },
	no: { Icon: CloseIcon, tone: "slate" },
	nausea: { Icon: NauseaIcon, tone: "amber" },
	quake: { Icon: GlobeIcon, tone: "blue" },
	flame: { Icon: FlameIcon, tone: "red" },
	wave: { Icon: WaveIcon, tone: "blue" },
	compass: { Icon: CompassIcon, tone: "green" },
	thermometer: { Icon: ThermometerIcon, tone: "amber" },
	storm: { Icon: StormIcon, tone: "blue" },
	typhoon: { Icon: TyphoonIcon, tone: "blue" },
	wallet: { Icon: WalletIcon, tone: "blue" },
	car: { Icon: CarIcon, tone: "red" },
	sun: { Icon: SunIcon, tone: "amber" },
	elevator: { Icon: ElevatorIcon, tone: "slate" },
};

/** 渲染一个图标键；未注册的键按原文本回退显示（兼容测试数据）。 */
export function OptionGlyph({ name, className }: { name: string; className: string }) {
	const glyph = GLYPHS[name];
	if (!glyph) {
		return (
			<span className={className} aria-hidden>
				{name}
			</span>
		);
	}
	return (
		<span className={`${className} tone-${glyph.tone}`} aria-hidden>
			<glyph.Icon />
		</span>
	);
}

export function CloseIcon(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="m6 6 12 12M18 6 6 18" />
		</IconBase>
	);
}
