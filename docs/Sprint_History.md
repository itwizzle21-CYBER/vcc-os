# Sprint History

## Sprint 0: Repository Governance And Documentation Foundation

Date: 2026-07-04

Mission:

- Establish documentation as the single source of truth.
- Audit repository health.
- Preserve existing functionality.
- Avoid feature changes, UI redesign, and financial logic changes.

Completed:

- Created `/docs`.
- Archived legacy docs under `/docs/archive/legacy-export`.
- Added Master PRD, architecture docs, engineering standards, QA standards, security standards, financial standards, UI guidelines, roadmap, changelog, repository audit, and project health report.

Validation:

- Build/lint/type/test commands are blocked because this snapshot has no project manifest or tool config.
- `git diff --check` is the available validation gate.

## Future Entries

Add a new entry for every sprint with:

- Date
- Goal
- Scope
- Files changed
- Validation
- Release status
- Known issues

## Sprint 0.7: E2E Release Signal Stabilization

Date: 2026-08-13

Goal:

- Make the full desktop/mobile Playwright suite deterministic under release conditions.
- Remove VitaScan OCR's runtime dependency on an external language-model host.

Completed:

- Serialized the resource-intensive Playwright projects.
- Packaged and served the English Tesseract model from the application build.
- Added deterministic OCR runtime coverage and a realistic timeout for the multi-route desktop control matrix.
- Recorded the full evidence and rollback path in `docs/SPRINT_0_7_E2E_RELEASE_SIGNAL.md`.

Validation:

- Build, lint, TypeScript, 147 unit tests, 68 browser tests, and the production dependency audit passed.
- 10 browser cases were intentionally skipped by project; no failures or flaky tests remained.

Release status:

- GO for the release-signal objective.
- Deployment was not requested or performed.

Known issue:

- The main production JavaScript chunk remains above Vite's 500 kB warning threshold.

## Sprint 0.8: Production Bundle Optimization

Date: 2026-08-13

Goal:

- Reduce the initial production JavaScript entry below 500 kB without changing application behavior.
- Prevent future application chunks from silently exceeding the same budget.

Completed:

- Deferred route-specific Dashboard, Transactions, Car Payment, Paycheck Planner, VitaScan, Agent, and Cloud Sync UI code.
- Extracted lightweight companion metadata from the full conversational Agent.
- Added a 500,000-byte build-time application chunk budget.
- Stabilized lazy-route browser readiness and paint-settled responsive-layout measurements.
- Recorded evidence and rollback guidance in `docs/SPRINT_0_8_BUNDLE_OPTIMIZATION.md`.

Validation:

- Initial entry fell from 598.87 kB to 494.77 kB, a 17.4% reduction; the Vite oversized-chunk warning is cleared.
- Build, bundle budget, lint, TypeScript, 147 unit tests, 68 browser tests, and the production dependency audit passed.
- 10 browser cases were intentionally skipped by project; no failures or flaky tests remained.

Release status:

- GO for the bundle-performance objective.
- Deployment, commit, and push were not requested or performed.

Known constraints:

- The initial entry has 5,221 bytes of headroom under the enforced budget.
- VitaScan's deferred OCR model and WebAssembly assets remain intentionally large.

## Sprint 0.9: Reports Module Extraction

Date: 2026-08-13

Goal:

- Begin the audit-recommended incremental decomposition of `src/App.tsx` with one self-contained route.
- Preserve Reports behavior while giving its calculations and rendering a bounded owner.

Completed:

- Extracted Reports into a lazy-loaded module with a narrow transaction/layout contract.
- Moved report filters, aggregations, forecasts, and charts with the route.
- Added direct unit coverage for the extracted calculations and corrected the period selector semantics.
- Reduced `src/App.tsx` by 210 lines and the initial entry by another 8,447 bytes.
- Recorded evidence and rollback guidance in `docs/SPRINT_0_9_REPORTS_MODULE_EXTRACTION.md`.

Validation:

- Build, bundle budget, lint, TypeScript, 151 unit tests, 68 browser tests, dependency audit, and whitespace checks passed.
- 10 browser cases were intentionally skipped by project; no failures remained.

Release status:

- GO for the bounded architecture objective.
- Sprint 0.8 was committed, pushed, and deployed first; Sprint 0.9 was later committed with Sprint 0.10 when requested, without deployment.

Known constraint:

- `App.tsx` remains large at 3,211 lines and should continue to be decomposed one bounded route at a time.

## Sprint 0.10: Settings Ownership Extraction

Date: 2026-08-14

Goal:

- Give Settings a bounded React and stylesheet owner.
- Preserve every preference, local-data, accessibility, and responsive-layout behavior.

Completed:

- Extracted Settings and its helper components into a lazy-loaded route module.
- Moved the existing Settings stylesheet from the eager root CSS graph to the route owner.
- Removed Settings-only imports from the central application module.
- Reduced `src/App.tsx` by 902 lines, initial JavaScript by 37,798 bytes, and eager CSS by 24.68 kB.
- Recorded release evidence and rollback guidance in `docs/SPRINT_0_10_SETTINGS_OWNERSHIP_EXTRACTION.md`.

Validation:

- Build, bundle budget, lint, TypeScript, 151 unit tests, 6 focused Settings browser journeys, 68 full-suite browser tests, dependency audit, and whitespace checks passed.
- 10 full-suite browser cases were intentionally skipped by project; no failures remained.

Release status:

- GO for the bounded ownership objective.
- Sprint 0.10 was committed with Sprint 0.9 when requested; neither sprint was deployed.

Known constraint:

- Persistence and section-reset contracts still need direct coverage before redundant local-storage writes or reset semantics are changed.

