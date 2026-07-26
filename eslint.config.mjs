import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"**/node_modules/**",
			"**/.next/**",
			"**/.open-next/**",
			"**/.wrangler/**",
			"**/dist/**",
			"FRONTEND/japan-disaster-relief/cloudflare-env.d.ts",
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: [
			"BACKEND/japan-disaster-relief-api/src/**/*.ts",
			"SHARED/src/**/*.ts",
			"DATA/scripts/**/*.ts",
		],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.worker,
			},
		},
		rules: {
			"@typescript-eslint/consistent-type-imports": "error",
		},
	},
);
