# Financial Standards

## Principles

- Financial calculations must be conservative, transparent, and testable.
- Dashboard outputs should explain the action they support.
- Mock/demo data must never be confused with live user data.
- Date-sensitive calculations must be deterministic in tests.

## Current Financial Domains

- Bills
- Debt
- Vehicle debt
- Savings
- Inventory and Buy Next
- Goals
- Trading
- Transactions
- Daily/weekly AI briefing cache

## Calculation Standards

- Use numeric values internally and format money at UI boundaries.
- Avoid parsing display strings when calculating.
- Validate required financial inputs.
- Treat missing or invalid numeric input as a visible validation problem, not silent success.
- Tests must cover zero, negative, missing, overdue, paid, pending, and boundary-date cases.
- Account rows are the authoritative current balances. Do not add already-applied transaction activity or planned income to those balances again.
- Spendable cash is canonical operating cash. Safe-to-spend additionally subtracts near-term open bills, external borrowing, and unreconciled shortfalls.
- Unused overdraft capacity is not cash. A negative Chime balance is the canonical representation of used SpotMe and must not be subtracted twice.

## Bills Standards

- Upcoming bills are pending bills due within the selected window.
- Overdue bills are pending bills due before today.
- Paid bills should not appear in overdue/upcoming pressure.
- Recurring behavior must be explicit before automation.
- A newly paid bill requires a paying account and paid date.
- Bill payment IDs must be deterministic and idempotent so one paid bill produces exactly one transaction and one balance effect.
- Reversing a bill payment must reconcile the transaction, paying balance, bill state, and dependent engine values together.

## Debt Standards

- Debt balances and minimum payments must remain separate.
- Payoff estimates must disclose assumptions.
- Interest calculations must be tested and documented.

## Inventory Standards

- Critical, Low, and Good status thresholds must be consistent across UI, tests, and server logic.
- Buy Next should sort by urgency and user-defined priority when available.
- Inventory status must be derived from canonical quantity and minimum values, never stale status text or sample fallback data.
- Duplicate cleanup must preserve evidence and favor the most conservative stock position.

## AI/Decision Standards

- AI recommendations must cite the underlying data signal.
- AI must not invent financial facts.
- AI-generated briefings should be cacheable, inspectable, and refreshable.

