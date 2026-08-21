import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const assetsDirectory = new URL("../dist/assets/", import.meta.url);
const assetsPath = fileURLToPath(assetsDirectory);
const distributionPath = fileURLToPath(new URL("../dist/", import.meta.url));
const applicationChunkBudget = 500_000;
const startupVisualBudget = 200_000;
const startupVisualAssets = ["vcc-logo-ui.webp", "companions/vcc-companions-concept.webp"];
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

const measuredStartupVisuals = await Promise.all(startupVisualAssets.map(async (name) => ({
  name,
  bytes: (await stat(join(distributionPath, name))).size,
})));
const startupVisualBytes = measuredStartupVisuals.reduce((total, asset) => total + asset.bytes, 0);
if (startupVisualBytes > startupVisualBudget) {
  const details = measuredStartupVisuals.map(({ name, bytes }) => `${name}: ${bytes} bytes`).join("\n");
  throw new Error(`Startup visual budget exceeded (${startupVisualBudget} bytes):\n${details}`);
}

console.log(`Startup visual budget passed: ${startupVisualBytes} bytes (limit ${startupVisualBudget}).`);
