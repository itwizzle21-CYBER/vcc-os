# Sprint 0.26 — Today’s Mission 2.0

## Outcome

Today’s Mission is now VCC’s single situation-aware action engine. It observes canonical financial state, chooses one primary mission, explains the priority, displays only supported metrics, opens the relevant existing workflow, and recalculates automatically when source data changes.

## Architecture

The implementation preserves the established ownership chain:

`AppData → Financial Engine → Decision Engine → Dashboard`

- Canonical Money Snapshot account rows own current cash balances.
- The Financial Engine owns Spendable / Safe, bill windows, overdue totals, and confidence metadata.
- The Decision Engine owns mission ranking, semantic state, metrics, steps, rationale, and workflow destination.
- Dashboard renders typed engine output and performs no independent financial math.
- Bills continues to own its records, ranked Review Queue, payments, transactions, and persistence. Mission routing only applies a focused view.

Supabase remains an authentication and persistence adapter for the canonical application payload. No mission-specific table, duplicate bill source, or parallel financial store was added.

## Financial integrity change

Spendable / Safe remains:

`canonical operating cash - open bill pressure due by seven days - external borrowed money - unreconciled cash`

The calculation remains in dollars at the existing Financial Engine boundary. This sprint adds a confidence invariant:

> A precise Spendable / Safe value may be presented only when at least one canonical cash account exists and every canonical cash balance is a finite numeric value.

Paycheck planner/history fallbacks remain available for legacy calculations, but they can no longer make the Dashboard present an unsupported precise amount. Missing account evidence or malformed balances produce `Unavailable` plus the exact missing input. Explicit `$0` remains valid verified data.

## Mission ranking

The final primary ranking reuses and extends the existing Decision Engine:

1. Confirmed overdue obligations — CRITICAL.
2. Confirmed account deficit — CRITICAL.
3. Missing truth-critical cash evidence — INFO.
4. Unreconciled funding source — INFO.
5. Bills due within seven days — WARNING.
6. External borrowed-money drag — WARNING.
7. High near-term bill pressure — WARNING.
8. Critical inventory replenishment — WARNING.
9. Supported debt progress — GOOD.
10. Fully funded tracked goal milestone — SUCCESS.
11. Closest supported goal advancement — GOOD.
12. Maintain a verified stable position — GOOD.

Confirmed overdue obligations remain first even when Spendable / Safe is unavailable because the overdue records and totals are independently supported by canonical Bills data. Missing information is never itself styled as a financial emergency.

## Workflow behavior

- Overdue mission → `/bills?mission=overdue`, filtered to actual overdue review records.
- Upcoming-bill mission → `/bills?mission=upcoming`, filtered to the next seven days.
- Missing account data or borrowing → Money Snapshot.
- Unreconciled funding → Transactions.
- Inventory pressure → Inventory.
- Debt progress → Debt.
- Goal progress or milestone → Goals.

The focused Bills view can be cleared with “Show all bills.” Payments still use the existing atomic bill-payment event, linked transaction, balance effect, and reversal contracts.

## State coverage

- CRITICAL: confirmed overdue bills and exact overdue total.
- WARNING: no overdue bills, with required bills approaching inside seven days.
- GOOD: no urgent/near-term exception, with a useful maintenance or advancement action.
- INFO: canonical cash evidence missing or invalid; Spendable / Safe unavailable.
- SUCCESS: all currently tracked supported goal targets fully funded.
- Transition: resolving the primary source condition produces the next mission without a manual clear.

## Compatibility

- No schema migration.
- No duplicate financial data.
- No application routes removed.
- Existing top navigation, Dashboard modules, layout views, themes, Bills persistence, Transactions, Money Snapshot, Savings, Goals, Inventory, Car Payment, authentication, and production project are preserved.
