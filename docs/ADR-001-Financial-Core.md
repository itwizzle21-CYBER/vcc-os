# ADR-001: Financial Core

Date: 2026-07-04

Status: Accepted

## Decision

All financial values shall originate from a single Financial Engine whenever practical.

## Context

The current VCC-OS snapshot contains duplicate financial calculations across helper files, database helpers, dashboard fallback data, cards, and module pages. This creates a risk that the Dashboard, Money Snapshot, Bills, Debt, Savings, Goals, Cash Flow, Buy Next, Priority Alerts, Reports, Analytics, future AI, and future automation can disagree about the user's financial state.

## Rationale

This decision is intended to:

- Prevent duplication.
- Improve maintainability.
- Improve testing.
- Increase trust in financial accuracy.
- Support AI and automation.

## Consequences

- New financial values should be added to the Financial Engine first.
- UI components should display financial values, not recalculate them, unless the calculation is purely presentational.
- Database helpers should fetch and normalize data, not become a second source of financial truth.
- Future AI and automation must consume engine outputs instead of raw, duplicated calculations.
- Refactors should be incremental and covered by behavior-preserving tests.

## Target Flow

```text
Financial Engine
Money Snapshot
Dashboard
Bills
Debt
Savings
Goals
Decision Engine
Reports
Analytics
Future AI
Future Automation
```

## Implementation Notes

The initial Financial Engine should be a pure TypeScript module with deterministic inputs and outputs. Server/database adapters can then feed normalized records into the engine. React components should consume typed summaries from tRPC or equivalent data hooks.

