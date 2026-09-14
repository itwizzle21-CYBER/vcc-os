# Sprint 0.31: Public Bundle Privacy Gate

Date: 2026-09-13. Scope: tooling, tests, CI, package scripts, and documentation. Application code is unchanged under the active instruction.

Removing owner records from source must also remove them from emitted assets. `npm run check:privacy` now recursively parses built JavaScript and compares decoded string literals against ten preserved SHA-256 fingerprints from the current loan reference identifiers. The registry contains fingerprints and string lengths, not plaintext record values. It remains independent of the reference source so deleting source records cannot silently delete the baseline.

The parser handles escaped strings, regex syntax, and ordinary template literals. Reports contain only status and counts, with no matched values, fingerprints, filenames, or source snippets. Missing JavaScript, invalid/empty registries, parse failures, and filesystem failures return a nonzero status. Symbolic links are not followed.

The aggregate readiness command runs this after build/bundle budgets and stops on failure. A fourth independent GitHub Actions job builds and checks public JavaScript; quality, financial/privacy contracts, and browser jobs remain independent.

## Evidence

| Check | Result |
| --- | --- |
| Scanner regressions | Seven pass: nested chunks, escaped/duplicate literals, clean control, quote-bearing regex/template case, empty build, parse failure, invalid registry |
| Ordinary unit suite | 28 files, 211 tests |
| Lint, application types, QA types | Pass |
| Production build and budgets | Pass; main 494,890 / 500,000 bytes; startup visuals 87,452 / 200,000 bytes |
| Built JavaScript privacy | **FAIL**, 25 files scanned, one matched file, ten matched identifiers |
| Aggregate readiness | Exit 1 at public privacy; later financial/browser/audit commands not reached |

The completed Sprint 0.30 [GitHub run 34795520097](https://github.com/itwizzle21-CYBER/vcc-os/actions/runs/34795520097) on `31c0c615` passed quality/dependency checks. Its full browser suite completed in 4.9 minutes with 100 passes, three failures, and 11 intentional skips. Desktop navigation bounds, target sizing, and retained-layout collision checks still fail. Its financial/privacy job also remains red. Browser/application code is unchanged this sprint; browser results above belong to the preceding revision, not a new local full run.

## Acceptance and limits

Remove public owner evidence through application remediation, rebuild, then require `npm run check:privacy` to pass against the preserved baseline. Do not remove or regenerate fingerprints merely to obtain a pass. Keep the S1 legacy-normalization contract and R1–R7 gates; a clean compiled bundle alone does not establish product readiness.

Coverage is deliberately bounded to known direct JavaScript string literals of at least eight characters. It does not scan images, binary/compressed assets, source-map content, HTML text, every personal financial number, or identifiers assembled dynamically. It is not a general DLP or secret scanner. Those limits do not excuse the ten actual matches.

Branch protection and a Vercel deployment dependency remain unconfigured, so a READY deployment can coexist with failing checks. Runtime privacy removal, session-adoption remediation, financial corrections, and layout/accessibility changes remain blocked by the active no-application-code instruction.
