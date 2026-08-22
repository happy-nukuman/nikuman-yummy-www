import { describe, expect, it } from "vitest";
import { appShareUrl, shareUrlLabel } from "./share-url";

describe("appShareUrl", () => {
	it("keeps the deployment origin as the shared entry point", () => {
		expect(appShareUrl("https://front-japan-disaster-relief.example.dev/")).toBe(
			"https://front-japan-disaster-relief.example.dev",
		);
	});

	it("drops query strings and hashes so the code stays short", () => {
		expect(appShareUrl("https://example.dev/?lang=ja#shelter")).toBe("https://example.dev");
	});

	it("keeps a sub-path deployment reachable", () => {
		expect(appShareUrl("https://example.dev/app/?x=1")).toBe("https://example.dev/app");
	});

	it("keeps the port used by local development", () => {
		expect(appShareUrl("http://192.168.1.20:3000/")).toBe("http://192.168.1.20:3000");
	});
});

describe("shareUrlLabel", () => {
	it("hides the https prefix for the address people read or type", () => {
		expect(shareUrlLabel("https://example.dev")).toBe("example.dev");
	});

	it("keeps other schemes visible", () => {
		expect(shareUrlLabel("http://192.168.1.20:3000")).toBe("http://192.168.1.20:3000");
	});
});
