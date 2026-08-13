import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { detectDemoLang, parseAcceptLanguage } from "@/features/demo/i18n";
import { DemoApp } from "@/features/demo/components/demo-app";

export const metadata: Metadata = {
	title: "Tokyo Safe First",
};

export const viewport: Viewport = {
	// 与独立的浅蓝 Header 背景保持一致。
	themeColor: "#f1f7fb",
	width: "device-width",
	initialScale: 1,
	// 全屏铺满刘海屏，配合 demo.css 中的 env(safe-area-inset-*)。
	viewportFit: "cover",
};

export default async function Home() {
	// 服务端按 Accept-Language 决定初始语言，首帧 HTML 就是正确语言，避免客户端检测造成的闪动。
	const acceptLanguage = (await headers()).get("accept-language");
	return <DemoApp initialLang={detectDemoLang(parseAcceptLanguage(acceptLanguage))} />;
}
