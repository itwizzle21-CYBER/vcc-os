# ADR-003: Canonical Financial Events and Records

Date: 2026-08-08

Status: Accepted

## Decision

VCC-OS treats account rows as the authoritative balance ledger. Money Snapshot is a derived view of those balances and other canonical domains. Cross-domain changes must enter through a domain event that reconciles every dependent record in one operation.

```text
User action
  -> canonical domain event
  -> accounts / transactions / domain record
  -> Financial Engine
  -> Money Snapshot, Dashboard, alerts, and reports
```

The first event implementations are `Bill Paid` and `Transaction Deleted` in `financialEventEngine.ts`.

## Invariants

- Spendable cash equals the sum of canonical operating-account balances; planned income and already-applied transactions are reporting signals and are not added again.
- Safe-to-spend subtracts open near-term bills, external borrowing, and unreconciled shortfalls from spendable cash.
- A negative Chime balance represents used SpotMe. Unused SpotMe capacity is not cash, and used SpotMe is not subtracted twice.
- A newly paid bill requires a paying account and paid date.
- A bill payment has one deterministic linked transaction ID, `bill-payment-<bill-id>`.
- Re-saving a paid bill cannot create a second transaction or debit the account twice.
- Deleting a linked bill-payment transaction reverses its balance effect and reopens its bill.
- Bill-linked transactions are edited from Bills so the event cannot fragment.
- Exact duplicate accounts are removed; conflicting same-name balances are preserved for review.
- Duplicate inventory names are conservatively merged using the lowest quantity, highest minimum, and highest cost. Original rows remain in merge evidence.
- Core domain routes cannot be hidden. Customization remains section/card scoped.
- A new workspace is blank. Test fixtures are injected only by automated tests and are never created by production startup.

## Migration

Stored data is normalized to schema version 5 at load time. Legacy paid bills without a payment account remain visible and are not silently deleted. The paying-account rule applies when a bill newly transitions to paid. Inventory merge evidence is retained in `duplicateMergeEvidence` and summarized in the row notes.

## Consequences

New cross-domain financial actions must extend the event layer and ship with idempotence, reversal, persistence, and engine regression tests. UI components may request an event but must not independently simulate synchronization.
