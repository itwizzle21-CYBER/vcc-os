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

## Bills Standards

- Upcoming bills are pending bills due within the selected window.
- Overdue bills are pending bills due before today.
- Paid bills should not appear in overdue/upcoming pressure.
- Recurring behavior must be explicit before automation.

## Debt Standards

- Debt balances and minimum payments must remain separate.
- Payoff estimates must disclose assumptions.
- Interest calculations must be tested and documented.

## Inventory Standards

- Critical, Low, and Good status thresholds must be consistent across UI, tests, and server logic.
- Buy Next should sort by urgency and user-defined priority when available.

## AI/Decision Standards

- AI recommendations must cite the underlying data signal.
- AI must not invent financial facts.
- AI-generated briefings should be cacheable, inspectable, and refreshable.

