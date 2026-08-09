# Financial Integrity and Regression Prevention Release

Date: 2026-08-08

Status: Ready for production deployment

## Scope

- Canonical account balances and derived Money Snapshot calculations
- Chime / SpotMe accounting boundary
- Atomic, idempotent bill-payment and transaction-deletion events
- Mobile swipe-to-reveal deletion with confirmation
- Conservative account and inventory deduplication
- Permanent core-page availability
- Blank production initialization without demo records

## Verification

| Gate | Result | Evidence |
|---|---|---|
| TypeScript | Passed | `npm run typecheck` |
| Lint | Passed, zero warnings | `npm run lint` |
| Build | Passed | `npm run build` |
| Unit/regression | 147 passed across 22 files | `npm test` |
| Financial integrity | Passed targeted checks | Five-event canonical event tests plus calculation boundaries |
| Decision Engine | Passed in unit suite | Borrowing lifecycle and inventory status derive from canonical data |
| Desktop browser | Passed | Dashboard plus all core routes, bill event, transaction reconciliation, layouts, and VitaScan |
| Mobile browser | Passed | Pixel 7 navigation, responsive layout, swipe reveal, confirmation, and reconciliation |
| Full E2E | 60 passed, 10 intentional device skips | 70 checks across Desktop Chromium + Pixel 7 |
| Dependency audit | 0 vulnerabilities | Patched transitive `nanoid` and `js-yaml`; final `npm audit --omit=dev` clean |
| Production smoke | Pending deployment | Core routes and linked event behavior |

## Migration and rollback

Local storage normalizes to version 5. Exact duplicate accounts are removed; conflicting balances remain. Duplicate inventory rows retain original evidence. Legacy paid bills are preserved even when their historical paying account is unknown.

Rollback is the prior production commit. Because version 5 retains the existing `vcc-os:data:v2` storage key and additive cell metadata, the prior release can still read the core row data, but it will not enforce the new cross-domain invariants.

## User verification after deployment

- Confirm any preserved same-name accounts with different balances are legitimate.
- Review legacy paid bills that do not contain a historical paying account.
