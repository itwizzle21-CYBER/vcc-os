import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export function fingerprint(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function scanPublicJavaScript(directory, registry) {
  if (registry?.format !== 1 || !Array.isArray(registry.markers) || registry.markers.length === 0
    || registry.markers.some((marker) => !/^[a-f0-9]{64}$/.test(marker.sha256)
      || !Number.isInteger(marker.length) || marker.length < 8)) {
    throw new Error("Invalid privacy fingerprint registry.");
  }
  const protectedHashes = new Set(registry.markers.map((marker) => marker.sha256));
  const lengths = new Set(registry.markers.map((marker) => marker.length));
  const found = new Set();
  let filesScanned = 0;
  let matchedFiles = 0;

  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error("Privacy scan does not follow symbolic links.");
      const target = join(path, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) {
        filesScanned += 1;
        const source = await readFile(target, "utf8");
        const parsed = ts.createSourceFile(entry.name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        if (parsed.parseDiagnostics.length) throw new Error("Emitted JavaScript could not be parsed for privacy checking.");
        const pending = [parsed];
        let matched = false;
        while (pending.length) {
          const node = pending.pop();
          if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            const value = node.text;
            if (lengths.has(value.length)) {
              const hash = fingerprint(value);
              if (protectedHashes.has(hash)) { found.add(hash); matched = true; }
            }
          }
          ts.forEachChild(node, (child) => { pending.push(child); });
        }
        if (matched) matchedFiles += 1;
      }
    }
  }
  await visit(directory);
  if (filesScanned === 0) throw new Error("No emitted JavaScript found; build before checking privacy.");
  return { status: found.size ? "FAIL" : "PASS", filesScanned, matchedFiles, matchedIdentifiers: found.size };
}

async function main() {
  try {
    const registry = JSON.parse(await readFile(new URL("./public-privacy-fingerprints.json", import.meta.url), "utf8"));
    const report = await scanPublicJavaScript(fileURLToPath(new URL("../dist/", import.meta.url)), registry);
    console.log(JSON.stringify(report));
    process.exitCode = report.status === "PASS" ? 0 : 1;
  } catch {
    // Files, parser errors, and record values may themselves contain private text.
    console.error("Public privacy check failed to complete. Verify the build and fingerprint registry.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
