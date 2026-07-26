import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// The shared workspace publishes TypeScript source so both runtimes consume
	// one contract without a generated-file synchronization step.
	transpilePackages: ["@nikuman-yummy/shared"],
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
