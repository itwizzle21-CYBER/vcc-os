import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const assetsDirectory = new URL("../dist/assets/", import.meta.url);
const assetsPath = fileURLToPath(assetsDirectory);
const applicationChunkBudget = 500_000;
const assetNames = await readdir(assetsDirectory);
const applicationChunks = assetNames.filter((name) => name.endsWith(".js") && !name.includes(".wasm-"));

const measuredChunks = await Promise.all(applicationChunks.map(async (name) => ({
  name,
  bytes: (await stat(join(assetsPath, name))).size,
})));

const oversizedChunks = measuredChunks.filter(({ bytes }) => bytes > applicationChunkBudget);
if (oversizedChunks.length > 0) {
  const details = oversizedChunks.map(({ name, bytes }) => `${name}: ${bytes} bytes`).join("\n");
  throw new Error(`Application chunk budget exceeded (${applicationChunkBudget} bytes):\n${details}`);
}

const largestChunk = measuredChunks.sort((left, right) => right.bytes - left.bytes)[0];
console.log(`Bundle budget passed: ${largestChunk.name} is ${largestChunk.bytes} bytes (limit ${applicationChunkBudget}).`);
