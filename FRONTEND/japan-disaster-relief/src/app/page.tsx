import type { Metadata, Viewport } from "next";
import { DemoApp } from "@/features/demo/components/demo-app";

export const metadata: Metadata = {
	title: "Tokyo Safe First",
};

export const viewport: Viewport = {
	themeColor: "#123B68",
};

export default function Home() {
	return <DemoApp />;
}
