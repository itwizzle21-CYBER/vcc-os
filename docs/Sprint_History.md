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

## Sprint 0.11: Persistence and Reset Contracts

Date: 2026-08-14

Goal:

- Remove proven duplicate application-state persistence without losing migration durability.
- Define one consistent, testable section-reset contract.

Completed:

- Made explicit mutations the single owner of normal application-state saves.
- Persisted current-key migrations during load and avoided rewrites for already-normalized snapshots.
- Defined section reset as clearing only the selected table without replaying linked financial events.
- Unified Settings and spreadsheet reset entry points and corrected the confirmation copy.
- Added unit and desktop/mobile browser contract coverage.
- Recorded evidence and rollback guidance in `docs/SPRINT_0_11_PERSISTENCE_RESET_CONTRACTS.md`.

Validation:

- Build, bundle budget, lint, TypeScript, 156 unit tests, 4 focused browser tests, 72 full-suite browser tests, dependency audit, and whitespace checks passed.
- 10 full-suite browser cases were intentionally skipped by project; no failures remained.

Release status:

- GO for the persistence/reset objective.
- Included in the combined Sprint 0.11–0.14 release candidate.

Known constraint:

- Same-field cloud conflict behavior is deterministic but still lacks explicit conflict-contract tests and user-visible resolution disclosure.

## Sprint 0.12: Cloud Conflict Safety

Date: 2026-08-14

Completed:

- Added structured same-field conflict diagnostics to the three-way merge.
- Preserved newer-cloud-revision resolution and exposed the last conflict count in the sync dialog.
- Added direct compatible-edit and same-field collision tests.

Validation: focused cloud suite 6 passed; release build, lint, typecheck, unit, browser, audit, and whitespace gates completed with Sprint 0.14.

Release status: GO; included in the combined production release.

## Sprint 0.13: Backup and Recovery

Date: 2026-08-14

Completed:

- Added versioned and validated exports with legacy import support and a 5 MB safety ceiling.
- Added three local recovery points before imports, resets, explicit cloud restores, and recovery restores.
- Added one-click recovery and desktop/mobile persistence recovery coverage.

Validation: backup suite 7 passed; persistence/recovery browser coverage passed on desktop and mobile.

Release status: GO; included in the combined production release.

## Sprint 0.14: Security, Accessibility, and Release Hardening

Date: 2026-08-14

Completed:

- Reviewed all release-diff surfaces against the financial-data, import, local-storage, and cloud-sync threat model.
- Remediated the unbounded backup-file parsing risk.
- Ran the built-in measurable accessibility auditor across all routes with zero failures and made the all-route audit permanent.
- Added the release go/no-go record and rollback criteria.

Validation:

- Build and 450,778-byte application bundle: pass.
- ESLint, TypeScript, 165 unit tests, production dependency audit, and whitespace checks: pass.
- Browser matrix reached 69 passes and 10 intentional skips; all three infrastructure-timeout cases passed on exact isolated rerun.

Release status: GO for commit, push, and official production deployment.

## Sprint 0.15: Financial Calculation Governance Skill

Date: 2026-08-20

Goal:

- Turn VCC's established financial calculation contracts into an automatically discoverable repository-local skill.
- Close the highest-priority capability gap identified by the Sprint 0.6 AI-stack audit without changing application behavior.

Completed:

- Added a focused skill for formula ownership, cent-safe rounding, reconciliation, idempotence, reversal, date, evidence, and test requirements.
- Added a project reference mapping each financial domain to its canonical implementation owner and regression-test matrix.
- Reconciled the AI-stack inventory and remediation plan.
- Recorded evidence and rollback guidance in `docs/SPRINT_0_15_FINANCIAL_CALCULATION_SKILL.md`.

Validation:

- Skill structure/frontmatter validation and whitespace checks passed.
- No application code, dependencies, runtime configuration, database, or production data changed.

Release status:

- GO for commit.
- No deployment is required for repository-local agent governance.

## Sprint 0.16: Performance and Core Web Vitals Skills

Date: 2026-08-20

Goal:

- Close the AI-stack audit's performance-specialization gap before the next application optimization sprint.
- Preserve the recommended skill's direct Core Web Vitals reference by installing the companion skill with it.

Completed:

- Reviewed and installed the Markdown-only `performance` and `core-web-vitals` skills from `addyosmani/web-quality-skills`.
- Validated both skill structures and their reciprocal local references.
- Verified the official VCC dashboard in the in-app Browser with no observed console errors.
- Reconciled the AI-stack inventory, readiness score, recommendations, and missing-capability record.
- Recorded the evidence and rollback path in `docs/SPRINT_0_16_PERFORMANCE_SKILLS.md`.

Validation:

- Both official skill-structure validations passed.
- The official deployment rendered `VCC-OS Dashboard` with no observed browser console errors.
- Repository whitespace checks passed.
- No application code, dependencies, runtime configuration, database, or production data changed.

Release status:

- GO for commit.
- No application deployment is required for user-level agent capabilities.

