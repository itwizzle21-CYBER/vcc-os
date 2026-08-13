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

