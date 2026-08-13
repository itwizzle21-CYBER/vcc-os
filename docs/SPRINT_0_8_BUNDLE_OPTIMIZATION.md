# Sprint 0.8 — Production Bundle Optimization

Completed: 2026-08-13

## Goal

Bring the initial production JavaScript entry below Vite's 500 kB warning threshold without changing financial behavior, route availability, accessibility, or VitaScan OCR reliability.

## Baseline

The Sprint 0.7 production build emitted one eager application entry at:

- 598.87 kB minified
- 173.02 kB gzip
- Vite oversized-chunk warning: present

VitaScan and its Tesseract runtime were already deferred. Dashboard, Transactions, Car Payment, Paycheck Planner, VCC Agent, and Cloud Sync UI still entered through the eager application graph.

## Changes

- Deferred Dashboard, Transactions, Car Payment, Paycheck Planner, VCC Agent, Cloud Sync UI, and the existing VitaScan route behind React `lazy` and `Suspense` boundaries.
- Kept cloud synchronization state and effects eager; only the optional Cloud Sync control UI is deferred.
- Extracted companion metadata and artwork into a lightweight shared module so Settings does not load the full conversational Agent.
- Added an accessible route-loading status for deferred page content.
- Added a build-time application chunk budget of 500,000 bytes. The checker excludes WebAssembly wrapper assets, which are separately fetched OCR runtime resources rather than initial application chunks.
- Updated browser tests to wait for deferred user-visible content, start virtual time only after Agent mount, and measure responsive layouts after two settled paint frames with reduced motion.
- Assigned explicit whole-test budgets only to multi-route or exhaustive visual journeys; their assertions and product behavior remain unchanged.

## Bundle Result

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Initial application entry | 598.87 kB | 494.77 kB | -104.10 kB (-17.4%) |
| Initial entry gzip | 173.02 kB | 146.44 kB | -26.58 kB (-15.4%) |
| Vite oversized-chunk warning | Present | Absent | Cleared |
| Enforced application chunk budget | None | 500,000 bytes | Added |

Deferred JavaScript chunks now include:

- Dashboard: 13.87 kB
- VCC Agent: 17.68 kB
- Car Payment: 23.13 kB
- VitaScan UI: 26.15 kB
- Transactions UI: 28.53 kB
- Cloud Sync UI: 11.77 kB
- Paycheck Planner: 4.80 kB

## Verification

| Gate | Result |
| --- | --- |
| Production build and bundle budget | Pass; largest application chunk 494,779 bytes |
| ESLint | Pass, zero warnings |
| TypeScript | Pass |
| Unit tests | 147 passed across 22 files |
| Focused lazy-route browser checks | 8 passed, 2 intentional project skips |
| Full Playwright release suite | 68 passed, 10 intentional project skips, 0 failed, 0 flaky |
| Production dependency audit | 0 vulnerabilities |

The final full Playwright run completed in 12.2 minutes. The 30-layout responsive matrix passed in 2.8 minutes during the same authoritative run.

## Release Decision

**GO** for Sprint 0.8's bundle-performance objective. The initial application entry is below the enforced budget, Vite no longer reports an oversized application chunk, and the complete desktop/mobile browser suite is green.

Deployment, commit, and push were not part of this sprint and were not performed.

## Known Constraints

- The entry is 5,221 bytes below the current hard budget. Future eager imports must either remain within that headroom or introduce another intentional lazy boundary.
- The OCR language model and WebAssembly assets remain several megabytes by design, but they are loaded only by VitaScan and are not part of the initial application entry.
- The application still uses a large central `App.tsx`; this sprint reduced delivery cost without attempting a broad architectural rewrite.

## Rollback

Revert the Sprint 0.8 changes to `src/App.tsx`, `src/components/agent`, the bundle-budget script and package command, browser tests, and sprint documentation. No database migration, persisted-data transformation, financial calculation, or deployment change was introduced.
