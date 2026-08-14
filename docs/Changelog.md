# Changelog

## Unreleased

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

