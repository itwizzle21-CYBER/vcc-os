# VCC Car Loan Evidence Sprint

Date: 2026-07-17

## Release Scope

The Car Payments module was rebuilt from the supplied contract, amortization page, and four dealer receipts for the used 2012 Lincoln MKX. The module separates legal terms, scheduled reference data, actual receipts, dealer communications, and current confirmed status.

## Verified Source Data

- Contract date: 2026-02-26
- APR: 17.000%
- Amount financed: $8,995.00
- Finance charge: $1,730.48
- Total scheduled payments: $11,125.48
- Schedule: 108 weekly payments of $99.31 beginning 2026-03-12
- Confirmed receipts: 2026-03-04, 2026-03-12, and two distinct receipts on 2026-03-18
- Latest documented official payoff: $8,740.04
- Latest documented dealer account balance: $10,378.42

## Financial Boundaries

- Receipt fields contain only values documented by that receipt.
- Dealer “Next Period” values are not stored as payments or VCC predictions.
- Official payoff and dealer account balance remain separate.
- The original amortization schedule remains unchanged.
- Confirmed receipts alone create Transactions and affect Money Snapshot.
- Missing values remain blank rather than inferred.

## Reconciliation

The engine flags the duplicate dealer receipt number `4-1`, the two valid same-day March 18 payments, and the difference between scheduled and documented March 12 principal. It also detects component-total mismatches and conflicting dealer communications.

## Persistence And Security

This build preserves VCC's current versioned local persistence. Structured evidence is stored in localStorage and file attachments in IndexedDB. Private source photos are not deployed. The connected Supabase project was inactive, and this application has no authenticated Supabase client or RLS boundary; introducing cloud persistence in this sprint would expose unacceptable financial-data risk.

## Migration And Rollback

Existing version-2 browser data migrates to version 3 and receives the verified car-loan aggregate plus synchronized confirmed receipt Transactions. Existing unrelated rows are preserved. Rollback is the focused sprint commit revert; browser export remains available before reset or rollback.

## Validation Plan

- Unit tests for financial totals, same-day payments, supersession, duplicate receipts, and conflicting communications.
- TypeScript, lint, production build, and diff checks.
- Desktop and mobile browser checks of all five Car Payments views.
- Production deployment and route smoke test.

## Open Architecture Item

Restore the Supabase project, add authentication, create user-owned evidence tables and a private Storage bucket with RLS, test migration and rollback on a branch, then move local evidence to the cloud in a dedicated security sprint.
