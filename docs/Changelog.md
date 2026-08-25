# Changelog

## 2026-08-25 - Sprint 0.25 Bills Review Queue Redesign

- Rebuilt Bills around a responsive priority review queue with canonical summaries, search/status filters, upcoming and recently-cleared rails, and a focused review panel.
- Added account-aware payment-impact previews while preserving the existing deterministic payment transaction, account reconciliation, reopen, delete, and Undo flows.
- Retained the complete spreadsheet ledger for direct bill management and restored the established accessible queue-region contract.
- Added cent-safe review-engine tests and verified 186 unit tests, 97 applicable browser tests, 11 intentional project skips, responsive/accessibility checks, bundle budgets, and a clean production dependency audit.
- Production URL: `https://vcc-os.vercel.app`.
- Rollback: redeploy the preceding Vercel production deployment or revert the Sprint 0.25 commit; no database or persisted-data rollback is required.

## 2026-08-24 - Sprint 0.24 Deterministic Playwright Server Lifecycle

- Replaced Playwright's shell-managed Vite web server with a programmatic Vite server owned by global setup and closed by its returned teardown callback.
- Disabled implicit reuse of arbitrary port-4173 servers by enforcing Vite `strictPort` startup for every browser run.
- Restored a deterministic release signal after two stale VCC development servers caused aggregate-only timeouts while every focused rerun passed.
- Verified build, lint, TypeScript, 183 unit tests, 97 applicable browser tests, 11 intentional project skips, production dependency audit, bundle budgets, automatic teardown, and port release.
- Production URL: `https://vcc-os.vercel.app`.
- Rollback: revert the Playwright configuration and `tests/e2e/global-setup.ts`; no application, schema, dependency, or persisted-data rollback is required.

## 2026-08-24 - Sprint 0.6 AI Stack Remediation Completion

- Installed the approved TypeScript, Tailwind, and interaction-design skills plus the GitHub and Supabase CLIs.
- Installed Google Chrome and documented its remaining Computer-use extension setup action.
- Raised the audited AI-stack readiness score to 94% and preserved Vercel CLI operation while documenting the app connector's project-scope limitation.
- Commit: `69e0d8cd`.
- Production deployment: READY at `https://vcc-os.vercel.app`.

## Unreleased

- Made a status-first Paid action on Bills open an accessible payment-details flow instead of rejecting the one-field row update.
- Added General, Purchase / buy, Bill payment, and Investment purposes to Transactions while keeping accounting type and sign semantics separate.
- Routed bill payments entered from either Bills or Transactions through the same evidence-backed, deterministic financial event.
- Kept receipt-style item rows exclusive to Purchase entries and added desktop/mobile regression coverage for every new entry path.

- Made bill payment status evidence-based, preserved every supported status, and cleared stale payment evidence when bills are reopened.
- Replaced repetitive bill-delete confirmation with an eight-second Undo flow that atomically reverses and restores linked payments and account effects.
- Added non-mutating chronological paycheck-history sorting and repaired multiline Inventory Notes editing without changing spreadsheet navigation elsewhere.
- Added unit and desktop/mobile browser regression coverage for the four backlog fixes.

- Installed reviewed performance and Core Web Vitals Codex skills, including the required companion link, before the next optimization sprint.
- Verified the official VCC dashboard in the in-app Browser and reconciled the AI-stack inventory without changing application code or dependencies.

- Added a repository-local VCC financial-calculations skill covering canonical ownership, cent-safe rounding, reconciliation, evidence, deterministic dates, and regression-test requirements.
- Closed the Sprint 0.6 audit's highest-priority skill gap without changing application code, dependencies, or production data.

- Added explicit same-field cloud-conflict reporting while retaining optimistic revision safety and the newer-cloud-revision tie-breaker.
- Added versioned, validated VCC backups, legacy import compatibility, a 5 MB import ceiling, and three-point local recovery history before destructive actions.
- Expanded measurable accessibility regression coverage from the dashboard to all application routes and completed a changed-surface security/release review.
- Recorded a production go/no-go and rollback plan for the combined Sprint 0.9–0.14 release.

- Removed duplicate application-state persistence while preserving current-key migration durability and normalized-load idempotence.
- Defined section reset as an isolated zero-row operation, unified all reset entry points, and corrected reset confirmation messaging.
- Added unit and desktop/mobile browser contracts for single-write persistence, reload restoration, migration writes, full reset, and isolated section reset behavior.

- Extracted Settings and its existing stylesheet into a bounded lazy-loaded route owner, reducing `src/App.tsx` from 3,211 to 2,309 lines.
- Reduced the initial application entry from 486,332 to 448,534 bytes and moved 24.67 kB of Settings CSS out of the eager graph.
- Preserved Settings preferences, data import/export, reset controls, wallpaper previews, focus containment, and responsive layout behavior across the full browser suite.

- Extracted Reports into a bounded lazy-loaded module and reduced `src/App.tsx` from 3,421 to 3,211 lines.
- Added direct unit coverage for report aggregation, trend periods, date windows, and cash-flow forecasts.
- Reduced the initial application entry from 494,779 to 486,332 bytes, increasing bundle-budget headroom to 13,668 bytes.

- Reduced the initial production JavaScript entry from 598.87 kB to 494.77 kB by deferring route-specific and optional React surfaces.
- Added a 500,000-byte build-time application chunk budget and cleared Vite's oversized-chunk warning.
- Made browser regression coverage lazy-route-aware and paint-settled while preserving all user-visible assertions.

- Stabilized the full desktop/mobile Playwright release gate at 68 passed, 10 intentional project skips, and zero failures or flaky tests.
- Self-hosted VitaScan's English Tesseract language model so receipt OCR no longer depends on a third-party runtime download.
- Added deterministic OCR configuration coverage and right-sized the multi-route desktop control-matrix timeout.

- Made Money Snapshot derived from canonical account balances and corrected Spendable, Safe-to-Spend, and Chime/SpotMe accounting.
- Added atomic bill-payment and transaction-deletion events with paying-account validation, deterministic links, balance reconciliation, and duplicate prevention.
- Added intentional mobile swipe-to-delete, conservative account/inventory deduplication, blank production initialization, and permanent access to core pages.
- Added ADR-003, a financial-integrity risk matrix, and unit/browser regression coverage for the accepted domain rules.

- Rebuilt Car Payments around the verified 2026 Lincoln MKX contract, four confirmed dealer receipts, and the supplied amortization schedule.
- Added evidence statuses, receipt revisions, dealer communications, reconciliation warnings, confirmed-payment transaction sync, and private local attachment storage.
- Separated official payoff, dealer account balance, scheduled balance, principal, interest, fees, and total cash paid across the module and dashboard.

- Established `/docs` as the canonical documentation source.
- Archived legacy export/prompt documentation under `/docs/archive/legacy-export`.
- Added Sprint 0 repository audit and project health report.
- Added engineering, architecture, security, financial, QA, UI, roadmap, and sprint-history documentation.

## Release Template

```markdown
## YYYY-MM-DD - Sprint Name

- Production URL:
- Commit:
- Feature/fix:
- Build:
- Lint:
- Type check:
- Tests:
- Deploy:
- Smoke test:
- Rollback notes:
```

