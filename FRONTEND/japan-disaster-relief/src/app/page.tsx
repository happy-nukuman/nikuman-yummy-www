import type { Metadata, Viewport } from "next";
import { DemoApp } from "@/features/demo/components/demo-app";

export const metadata: Metadata = {
	title: "Tokyo Safe First",
};

export const viewport: Viewport = {
	// 浅色主题色与毛玻璃顶栏（aurora 渐变上端）保持一致。
	themeColor: "#eef5ff",
	width: "device-width",
	initialScale: 1,
	// 全屏铺满刘海屏，配合 demo.css 中的 env(safe-area-inset-*)。
	viewportFit: "cover",
};

export default function Home() {
	return <DemoApp />;
}
