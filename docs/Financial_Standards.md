# Financial Standards

## Principles

- Financial logic must be deterministic.
- Derived numbers should be calculated, not manually stored, when practical.
- Dashboard should explain what action a number supports.
- Savings protection must be preserved.
- Blank starter rows must not create false financial pressure.

## Current Domains

- Money Snapshot
- Bills
- Income
- Budget
- Transactions
- Debt
- Protected Savings Vault
- Inventory
- Buy Next
- Activity
- Goals
- Missions

## Calculation Standards

- Parse and normalize inputs before calculation.
- Keep money formatting at presentation boundaries.
- Treat missing values conservatively.
- Do not count protected savings as spendable cash.
- Imported data must pass through `normalizeSections()`.
- Engine changes require build, lint, diff check, and targeted financial tests or documented QA.

## Decision Engine Standards

- Recommendations must map to a source section.
- Alerts must have proof and action.
- Do not generate unsupported financial claims.
- New sections must be wired into metrics and recommendations intentionally.

