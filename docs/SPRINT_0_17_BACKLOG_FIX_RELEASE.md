# Sprint 0.17 Backlog Fix Release

Date: 2026-08-20

## Scope

This sprint repairs bill payment evidence and status handling, reversible bill deletion, paycheck-history ordering, and Inventory Notes editing. It does not change Supabase schema or RLS, authentication, dependencies, or production records.

## Root Causes and Fixes

- Bills: UI options, derived status logic, and payment sync did not share one definition of a paid bill. Paid now requires stored `paid` status, a nonblank Paid From account, and a valid ISO Paid Date. Reopening clears stale payment evidence, and all supported statuses survive persistence and reload.
- Bill deletion: the table required a browser confirmation and ordinary row sync deliberately retained generated payment transactions. A bill-domain delete event now removes the bill and deterministic linked payment together, reverses the exact account effect, and captures a complete snapshot for an eight-second Undo.
- Paycheck History: records rendered in insertion order. A pure derived sorter now provides Newest to Oldest and Oldest to Newest while leaving persisted rows untouched.
- Inventory Notes: the shared spreadsheet intercepted Enter and caret-navigation keys during textarea editing. Native multiline editing is now scoped to Inventory Notes; Escape and Tab still preserve the spreadsheet workflow.

## Validation Evidence

- `npm run build`: pass, including TypeScript and the 500,000-byte entry bundle budget.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm test`: 170 passed.
- `npm run test:e2e`: 79 passed, 11 intentional project skips, zero failures across desktop and mobile Chromium.
- `git diff --check`: pass.

## Financial and Data Integrity

- Stored evidence remains authoritative; a status label alone cannot make a bill financially paid.
- Delete and Undo use deterministic bill-payment links and the canonical transfer reconciliation path.
- Undo is idempotent and restores complete bill and linked-payment records at their original positions.
- Paycheck sorting is display-only and never writes reordered data.

## Release and Rollback

Production target: `https://vcc-os.vercel.app/`

Rollback is the focused sprint commit revert followed by a production redeploy. No database rollback is required.
