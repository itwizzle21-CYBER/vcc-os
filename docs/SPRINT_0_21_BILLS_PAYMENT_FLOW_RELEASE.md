# Sprint 0.21 Bills Payment Flow Release

Release candidate: `codex/backlog-fix-sprint`

Scope:

- Make Status and Paid From work together directly in the Bills table.
- Remove the payment modal that made a Paid selection appear to revert.
- Support either order: Paid then Paid From, or Paid From then Paid.
- Keep payment posting atomic and evidence-backed.

## Root cause

Selecting Paid without a paying account aborted the row update and opened a separate modal. The visible Status control therefore snapped back to its prior value, which made it look nonfunctional and disconnected Paid From from the action the user had just taken.

## Financial invariant

A bill remains in its stored pre-payment state until a valid paying account and paid date exist. Completing the flow marks the bill Paid, creates exactly one deterministic linked transaction, and applies exactly one account balance effect. Canceling or stopping before Paid From is chosen moves no money and creates no transaction.

## Release gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint | Pass | ESLint completed with zero warnings. |
| TypeScript | Pass | `tsc --noEmit` completed successfully. |
| Unit tests | Pass | 180 tests passed across 25 files; 15 focused payment-engine tests passed. |
| Production build | Pass | Vite build and bundle budgets passed; main JavaScript is 138.22 KB gzip. |
| Browser QA | Pass | Four focused payment-flow scenarios passed on desktop and mobile. Manual in-app browser QA completed the Status-first flow without a modal. |
| Financial integrity | Pass | Tests prove the incomplete flow leaves status, linked transactions, and account balance unchanged; completion creates one payment and one debit; reopen/delete/undo reconciliation remains covered. |
| Data/platform scope | Pass | No schema, Supabase, authentication, RLS, dependency, or production-data migration changes. |

## Approval and rollback

The repository owner explicitly requested this fix be committed and deployed to the official VCC project.

Rollback point: redeploy commit `48ef0f5` if the live Bills smoke test fails or the new payment flow produces an unexpected status, transaction, or balance effect. Production smoke testing is read-only and will not submit a bill payment.

## Residual risk

The pending instruction is component state and intentionally does not persist across a page refresh. No financial state has changed at that stage, so refreshing safely returns the bill to its stored pre-payment status.
