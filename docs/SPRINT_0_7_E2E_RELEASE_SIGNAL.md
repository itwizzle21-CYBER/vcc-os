# Sprint 0.7 — E2E Release Signal Stabilization

Completed: 2026-08-13

## Goal

Restore a deterministic browser release signal for the desktop/mobile application suite without weakening user-visible assertions or changing financial behavior.

## Baseline

The initial full Playwright run used two workers and finished with:

- 58 passed
- 10 intentionally skipped by project
- 10 failed
- 17.8 minutes total runtime

Focused serial reruns showed that most failures were cross-project resource contention. Two independent issues remained:

1. The 30-layout viewport matrix exceeded its five-minute budget while competing with the mobile project.
2. VitaScan OCR stalled while downloading the English Tesseract language model from a third-party host at runtime.

## Changes

- Configured Playwright to use one worker so the resource-intensive layout matrix, OCR worker, and mobile project do not compete for the same browser resources.
- Added `@tesseract.js-data/eng` as a production dependency.
- Added a Vite plugin that serves the packaged English trained-data file during development and emits it at `dist/tessdata/eng.traineddata.gz` during production builds.
- Pointed VitaScan OCR at the local `/tessdata` asset and gave the new model a distinct cache key.
- Extended the four-route desktop control matrix from the default 30-second whole-test budget to 60 seconds. Assertions and interactions were unchanged; the final run completed it in 20.8 seconds.
- Updated the OCR runtime unit test to require a local, non-HTTP language-model path.

## Verification

| Gate | Result |
| --- | --- |
| ESLint | Pass, zero warnings |
| TypeScript | Pass |
| Unit tests | 147 passed across 22 files |
| Playwright | 68 passed, 10 intentionally skipped, 0 failed, 0 flaky |
| Production build | Pass in 6.22 seconds |
| OCR production asset | Emitted, 2,952.87 kB compressed |
| Production dependency audit | 0 vulnerabilities |

The final Playwright run completed in 13.5 minutes. The 30-layout matrix passed in 4.6 minutes, VitaScan OCR passed in 14.9 seconds, and the desktop control matrix passed in 20.8 seconds.

## Release Decision

**GO** for this sprint's release-signal objective. The verification evidence is green and the browser failures reproduced at baseline no longer occur under the committed execution policy.

Deployment was not part of this sprint and was not performed.

## Known Issue

The production build still reports a pre-existing main JavaScript chunk of 598.87 kB after minification, above Vite's 500 kB warning threshold. This is non-blocking for the E2E stabilization objective but should be the next performance sprint target.

## Rollback

Revert the Sprint 0.7 changes to the Playwright configuration, OCR runtime/configuration, Vite configuration, tests, and dependency manifests. No database migration, persisted-data transformation, or financial calculation change was introduced.
