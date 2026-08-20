# VCC Calculation Contracts

Read this reference whenever VCC financial computation or persistence behavior changes.

## Canonical owners

| Concern | Primary owner | Established contract |
| --- | --- | --- |
| Numeric parsing, currency/date formatting | `src/lib/calculations/currency.ts` | Calculate with numbers, format at UI boundaries, validate ISO calendar dates. |
| Receipt line totals and tax allocation | `src/lib/calculations/receiptMath.ts` | Convert to integer cents and preserve the exact ticket tax total with deterministic largest-remainder allocation. |
| Dashboard and Money Snapshot totals | `src/lib/engine/financialEngine.ts` | Consume canonical balances and domain records without replaying already-applied activity. |
| Transaction type, sign, and category | `src/lib/engine/transactionEngine.ts` | Income is positive, expense is negative, and transfer retains its recorded direction. |
| Cross-domain financial mutations | `src/lib/engine/financialEventEngine.ts` | Apply and reverse linked records together with deterministic identifiers. |
| Account and savings transfers | `src/lib/engine/savingsTransferEngine.ts` | Preserve total cash, link endpoints by stable identifiers, and make retries idempotent. |
| Paycheck deposits and repayments | `src/lib/engine/paycheckPlannerEngine.ts` | Apply a locked paycheck exactly once and avoid duplicating liabilities already represented by balances. |
| Bill state and payment sync | `src/lib/engine/billPaymentSync.ts`, `src/lib/engine/recurringBillEngine.ts` | Paid bills leave bill pressure; payment links and recurrence must be explicit and deterministic. |
| Car-loan evidence and reconciliation | `src/lib/engine/carLoanEngine.ts` | Confirmed receipts drive actuals; schedules and communications do not overwrite receipt evidence. |
| Canonical record normalization | `src/lib/engine/canonicalRecords.ts` | Normalize persisted records without erasing conflicting evidence. |

If two modules appear to own the same value, follow `docs/ADR-001-Financial-Core.md` and move the calculation toward the Financial Engine or a single domain engine. Do not create another UI formula.

## Monetary units and rounding

- Use decimal display strings only at persistence or UI boundaries required by the existing schema.
- Use integer cents when exact allocation, conservation, equality, or reversal matters.
- Convert dollars to cents with one documented rounding step, perform the allocation in cents, and convert back only at the output boundary.
- Preserve the total as an invariant: `sum(partsInCents) === documentedTotalInCents`.
- For legacy number-based comparisons, use the repository's cent-scale tolerance only at the compatibility edge; prefer cents for new identity checks.
- Do not introduce a new decimal library or global storage representation without an ADR and migration plan.

## Domain invariants

### Balances and safe-to-spend

- Account rows are the authoritative current ledger balances.
- Savings rows own protected and available savings; mirrored Money Snapshot rows are not added again.
- `spendableCash` is operating cash. `safeToSpend` additionally subtracts open bill pressure, external borrowed money, and unreconciled cash shortfalls.
- A negative Chime balance already represents used SpotMe. Subtract external borrowing only; unused SpotMe capacity is never cash.

### Transactions and events

- Applying a transfer changes both endpoints by equal cents and preserves aggregate cash.
- Applying the same event ID twice produces the same result as applying it once.
- Editing or deleting an applied event first reverses its previous exact effect, then applies the new effect if requested.
- Renaming a display label must not break stable account, vault, bill, receipt, or transaction links.
- A paid bill creates one deterministic linked transaction and one balance effect. Removing the linked transaction reopens the bill and restores the balance.

### Evidence-backed debt

- A schedule is a forecast, not proof of payment.
- Keep multiple legitimate payments on the same date as separate records.
- Do not collapse official payoff into dealer balance or scheduled balance.
- Component totals must reconcile to the documented receipt total at cent precision.
- Conflicting communications create a review issue; they do not silently rewrite confirmed receipts.

### Dates and missing data

- Use `YYYY-MM-DD` for date-only financial records and validate real calendar dates.
- Pass a reference date into period calculations and freeze it in tests.
- Treat `0` as data. Distinguish it from blank, absent, invalid, or unknown.
- Invalid required financial input must produce a validation result, not a plausible-looking zero.

## Test matrix

Cover the dimensions that apply:

| Dimension | Minimum cases |
| --- | --- |
| Money | zero, one cent, half-cent input, large amount, negative where valid, non-finite or malformed input |
| Allocation | indivisible cent, multiple equal remainders, zero tax, zero subtotal, exact conservation |
| State event | first apply, retry, edit, delete/reverse, renamed endpoint, persistence reload |
| Dates | exact boundary, prior/next day, month or week rollover, leap day, impossible date |
| Reconciliation | canonical source plus mirror, missing evidence, conflicting evidence, exact component total, one-cent mismatch |
| Dashboard | canonical balances, explicit zero, overdraft, bill pressure, external borrowing, protected savings |

Prefer golden examples for documented receipts or contracts and invariant-focused tests for generated combinations. A regression test must fail under the incorrect formula it protects against.

## Review handoff

Summarize:

- the formula and units;
- the canonical input owner;
- the conservation, sign, idempotence, and reversal behavior;
- the rounding policy;
- focused and full validation results;
- any data migration, evidence limitation, or unresolved ambiguity.
