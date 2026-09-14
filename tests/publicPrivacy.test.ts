import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { fingerprint, scanPublicJavaScript } from "../scripts/check-public-privacy.mjs";

const identifier = "invented-owner-record";
const registry = { format: 1, markers: [{ sha256: fingerprint(identifier), length: identifier.length }] };
let directory: string;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "vcc-privacy-test-")); });
afterEach(async () => {
  const target = resolve(directory);
  if (!target.startsWith(resolve(tmpdir()) + sep) || !basename(target).startsWith("vcc-privacy-test-")) {
    throw new Error("Refusing cleanup outside the test temporary directory.");
  }
  await rm(target, { recursive: true, force: true });
});

it("detects private literals in nested chunks without disclosing their values", async () => {
  await mkdir(join(directory, "assets"));
  await writeFile(join(directory, "assets", "chunk.js"), `export const record = ${JSON.stringify(identifier)};`);
  const report = await scanPublicJavaScript(directory, registry);
  expect(report).toEqual({ status: "FAIL", filesScanned: 1, matchedFiles: 1, matchedIdentifiers: 1 });
  expect(JSON.stringify(report).includes(identifier)).toBe(false);
});

it("decodes escaped JavaScript strings and detects duplicate records once", async () => {
  const escaped = identifier.split("").map((value) => `\\u${value.charCodeAt(0).toString(16).padStart(4, "0")}`).join("");
  await writeFile(join(directory, "chunk.js"), `const a = "${escaped}", b = ${JSON.stringify(identifier)};`);
  expect((await scanPublicJavaScript(directory, registry)).matchedIdentifiers).toBe(1);
});

it("accepts a synthetic clean bundle with a preserved fingerprint baseline", async () => {
  await writeFile(join(directory, "chunk.js"), 'export const record = "unrelated-synthetic-record";');
  expect((await scanPublicJavaScript(directory, registry)).status).toBe("PASS");
});

it("detects a minified literal after a regex containing quote characters", async () => {
  await writeFile(join(directory, "chunk.js"), `const r=/["']/g;const a=\`${identifier}\`;`);
  expect((await scanPublicJavaScript(directory, registry)).status).toBe("FAIL");
});

it("fails closed when the distribution is empty", async () => {
  await expect(scanPublicJavaScript(directory, registry)).rejects.toThrow("No emitted JavaScript");
});

it("fails closed when JavaScript cannot be parsed completely", async () => {
  await writeFile(join(directory, "chunk.js"), 'const record = "unfinished');
  await expect(scanPublicJavaScript(directory, registry)).rejects.toThrow("could not be parsed");
});

it("fails closed when the fingerprint registry is invalid or empty", async () => {
  await expect(scanPublicJavaScript(directory, { format: 1, markers: [] })).rejects.toThrow("Invalid privacy");
  await expect(scanPublicJavaScript(directory, { format: 1, markers: [{ sha256: "invalid", length: 20 }] }))
    .rejects.toThrow("Invalid privacy");
});
