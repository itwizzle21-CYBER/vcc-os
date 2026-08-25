# Sprint 0.25 — Bills Review Queue Redesign

Completed: 2026-08-25

## Goal

Redesign Bills around a clear review queue while keeping every financial action functional, evidence-backed, and reversible.

## Changes

- Replaced the dense Bills overview with a responsive review queue that prioritizes overdue and near-term bills.
- Added open-pressure, next-30-days, paid, and overdue summary cards derived from canonical bill rows.
- Added search and status filtering, upcoming and recently-cleared rails, and a focused review panel.
- Added an account-aware payment-impact preview before recording payment.
- Routed reviewed payments through the existing canonical `payBillEvent`, preserving one linked transaction and one exact account-balance effect.
- Kept the full spreadsheet ledger available for add, edit, sort, reopen, delete, and Undo workflows.
- Added cent-safe unit coverage for review summaries and payment-impact previews.
- Preserved the established `Decision Engine bill order` accessible region contract.

## Verification

| Gate | Result |
| --- | --- |
| Production build and bundle budgets | Pass; main bundle 476,628 / 500,000 bytes; startup visual budget 87,452 / 200,000 bytes |
| ESLint | Pass; zero warnings |
| TypeScript | Pass |
| Unit tests | 186 passed across 26 files |
| Focused Bills review-engine tests | 3 passed |
| Full Playwright suite | 97 passed, 11 intentional project skips, 0 failed in 15.4 minutes |
| Accessibility route sweep | Pass on desktop and mobile |
| Responsive Bills/Transactions 320px check | Pass |
| Production dependency audit | 0 vulnerabilities |
| Product-design QA | Passed |
| Whitespace check | Pass |

The first aggregate browser run exposed the removed queue-region name. The accessible contract was restored and passed on desktop and mobile. Two later navigation timeouts were traced to a verified stale VCC Vite preview sharing port 4173; after stopping only that stale process, the unchanged final suite passed completely and released the test port.

## Financial integrity

- Account rows remain the canonical balance owners.
- Bill payment still requires a real account and valid paid date.
- A paid bill creates one deterministic linked transaction and one balance effect.
- Reopen, transaction deletion, bill deletion, and Undo retain their existing reconciliation behavior.
- No schema, migration, RLS, dependency, or production-data changes are included.

## Release decision

**GO** for commit, push, and official production deployment.

## Rollback

Redeploy the preceding production deployment or revert the Sprint 0.25 commit. No database or persisted-data rollback is required because the release changes presentation, local interaction composition, and pure derived calculations without changing stored schemas.
