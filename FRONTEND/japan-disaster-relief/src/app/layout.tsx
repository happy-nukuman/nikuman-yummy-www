import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { Providers } from "./providers";

const notoSans = Noto_Sans({
	variable: "--font-noto-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const notoSansSC = Noto_Sans_SC({
	variable: "--font-noto-sans-sc",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	preload: false,
});

const notoSansJP = Noto_Sans_JP({
	variable: "--font-noto-sans-jp",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	preload: false,
});

export const metadata: Metadata = {
	title: "Japan Disaster Relief",
	description: "Japan disaster relief web application",
	// 防止 iOS 把文案中的 110 / 119 等数字自动渲染成电话链接。
	formatDetection: { telephone: false },
	appleWebApp: { capable: true, title: "Tokyo Safe First", statusBarStyle: "default" },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang={DEFAULT_LOCALE}
			className={`${notoSans.variable} ${notoSansSC.variable} ${notoSansJP.variable}`}
		>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className="antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
