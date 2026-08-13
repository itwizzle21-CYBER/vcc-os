# Changelog

## Unreleased

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

