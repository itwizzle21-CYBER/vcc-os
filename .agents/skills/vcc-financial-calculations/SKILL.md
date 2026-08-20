---
name: vcc-financial-calculations
description: Review or change financial calculations in VCC-OS, including account balances, bills, transactions, savings, debt, goals, receipts, transfers, paychecks, and car-loan summaries. Use for formulas, rounding, reconciliation, financial invariants, or tests; do not use for display-only currency styling.
---

# VCC Financial Calculations

Protect the correctness and traceability of VCC financial math. Treat this as calculation engineering, not financial advice.

## Required workflow

1. Identify the calculation's inputs, outputs, units, signs, and canonical owner.
2. Read [references/vcc-calculation-contracts.md](references/vcc-calculation-contracts.md) and the relevant engine, tests, ADRs, and standards before editing.
3. State the invariant being preserved or introduced. If ownership is ambiguous, resolve it before adding another formula.
4. Keep domain math in a pure calculation or engine module. Let React components render typed outputs instead of independently recalculating them.
5. Normalize external values at the boundary. Reject or visibly flag invalid required inputs; never let `NaN` or infinity enter stored state.
6. Add deterministic tests for the normal case, zero, negative or signed values where valid, missing and invalid inputs, rounding boundaries, date boundaries, idempotent retries, and exact reversal when relevant.
7. Run the smallest focused test first. For application-code changes, also run the repository typecheck, unit tests, lint, build, and relevant browser coverage.
8. Report the formula, canonical source, rounding unit, changed invariants, test evidence, and any migration or compatibility impact.

## Non-negotiable contracts

- Never double-count a value mirrored across modules. Canonical account rows own current balances; transactions and planned income are reporting signals unless a domain event explicitly applies them.
- Preserve explicit zero. Do not replace a real zero with historical, planned, sample, or fallback money.
- Keep signed semantics explicit. Income increases cash, expenses decrease cash, transfers preserve total cash, and negative account balances remain negative.
- Use integer cents for allocation and identity-preserving receipt math. Ensure allocated parts sum exactly to the documented total.
- Round monetary mutations once at a defined boundary. Avoid repeated binary-float arithmetic and never compare money using unbounded exact floating-point equality.
- Make cross-domain events atomic, deterministic, and idempotent. Replaying an event identifier must not apply its balance effect twice.
- Make reversals restore the exact prior cent effect and reconcile every linked record.
- Use valid ISO calendar dates. Inject or freeze the reference date in date-sensitive tests.
- Distinguish protected savings, spendable cash, borrowed money, and unreconciled cash. Unused credit or overdraft capacity is not cash.
- Treat confirmed evidence as authoritative for car-loan payments. Keep official payoff, dealer account balance, scheduled balance, principal, interest, fees, and total cash paid separate.
- Never mutate production data, external financial accounts, or Supabase records without an explicit user request and a verified rollback path.

## Completion gate

Do not call a calculation change complete until its canonical owner is clear, conservation and reconciliation invariants pass, rounding is deterministic, and downstream summaries agree with the same source.
