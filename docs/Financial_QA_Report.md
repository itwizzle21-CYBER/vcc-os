# Financial QA Report

Sprint: 1.2 - Financial Core Consolidation

Date: 2026-07-04

## QA Summary

Sprint 1.2 completed an ABI audit and documentation update. No financial calculation code was refactored because the repository snapshot is not currently buildable or testable in a repeatable way.

## Validation Results

| Check | Result | Notes |
| --- | --- | --- |
| Existing calculation behavior | Not changed | No calculation implementation was modified. |
| Dashboard values remain consistent | Pass by non-change | Dashboard implementation was not edited. Existing mock/live divergence remains documented. |
| Dedicated pages remain consistent | Pass by non-change | Bills, Debt, Savings, Inventory, and vehicle tracker files were not edited. |
| No regression in calculations | Pass by non-change | No calculation code changed. |
| Rounding consistency | Needs follow-up | Existing code mixes numeric `toFixed`, string money values, and parsed currency strings. |
| Currency formatting | Needs follow-up | Formatting currently happens inside UI components and sample strings. Engine should output numbers and UI should format at boundaries. |
| `npm run build` | Not run | No `package.json` exists in this repository snapshot. |
| `npm run lint` | Not run | No `package.json` or lint config exists. |
| Type check | Not run | No TypeScript config exists. |
| Relevant tests | Not run | No package/test runner config exists. Several tests reference missing module paths or functions. |
| `git diff --check` | Run | Passed after documentation changes. |

## QA Findings

- Financial pages currently calculate values from local React state while dashboard cards often use hard-coded fallback data.
- Tests are date-sensitive and can drift because helpers use `new Date()` directly.
- Some test files appear to be copied from a fuller module tree and import from paths/functions that do not exist in the current flat export.
- `vehicleCalculations.getPaymentStatus` attempts to return `overdue`, but `calculateDaysUntilDue` clamps negative values to `0`, so overdue detection is likely unreachable through that path.
- `MoneySnapshotCard` displays precomputed totals; no source calculation proves `netWorth = assets - liabilities` or `monthlyNet = income - expenses`.
- `BuyNextCard` parses currency strings with `replace("$", "")`, which is fragile for commas, negative values, or non-dollar formatting.

## Recommended QA Gates Before Refactor

1. Restore build metadata and source structure.
2. Add deterministic clock injection for date-based calculations.
3. Add golden tests for current Bills, Debt, Savings, Money Snapshot, Buy Next, and vehicle tracker outputs.
4. Add tests for zero, missing, negative, paid, overdue, future date, and rounding boundary cases.
5. Run build, lint, type check, unit tests, and smoke tests before replacing page-local calculations.

## QA Decision

Financial behavior is preserved because no calculation code changed. Consolidation should proceed only after the repository can validate the current behavior.

