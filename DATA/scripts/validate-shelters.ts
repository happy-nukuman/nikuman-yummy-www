import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isShelter } from "@nikuman-yummy/shared";

const inputPath = process.argv[2];

async function main(): Promise<void> {
	if (!inputPath) {
		console.error("Usage: npm run data:validate -- <normalized-shelters.json>");
		process.exitCode = 1;
		return;
	}

	try {
		const contents = await readFile(resolve(inputPath), "utf8");
		const value: unknown = JSON.parse(contents);

		if (!Array.isArray(value)) {
			throw new Error("Expected a JSON array.");
		}

		const invalidIndexes = value.flatMap((item, index) => (isShelter(item) ? [] : [index]));
		if (invalidIndexes.length > 0) {
			throw new Error(`Invalid shelter entries at indexes: ${invalidIndexes.join(", ")}`);
		}

		console.log(`Validated ${value.length} shelter records.`);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown validation error";
		console.error(`Shelter validation failed: ${message}`);
		process.exitCode = 1;
	}
}

void main();
