# Sprint 0.18 Bill and Transaction Entry Release

Date: 2026-08-21

## Go/No-Go

Scope: medium. The release changes Bills and Transactions entry behavior, but does not change database schema, Supabase RLS, authentication, dependencies, or existing production records.

Go criteria:

- Build, bundle budget, lint, TypeScript, unit, and browser checks pass.
- A bill cannot become financially paid without an existing bill ID, a valid Paid From account, and a valid ISO Paid Date.
- Bills and Transactions produce the same deterministic linked bill-payment record and exactly one account effect.
- General and Investment entries persist as one transaction; only Purchase produces line-item rows.
- Official production routes and built assets respond successfully after deployment.

Rollback triggers:

- A bill is shown paid without complete stored evidence.
- A payment is applied twice, applied to the wrong account, or cannot be exactly reversed.
- General or Investment entries are coerced into itemized purchases or lose their stored purpose.
- The official alias fails its route or asset smoke checks.

## Validation Evidence

- Production build and 500,000-byte entry bundle budget: pass.
- ESLint: pass with zero warnings.
- TypeScript: pass.
- Unit tests: 174 passed.
- Targeted Bills/Transactions Playwright matrix: 20 passed across desktop and mobile Chromium.
- Final transaction-originated bill-payment retest: 2 passed across desktop and mobile Chromium.
- Full desktop/mobile Playwright matrix: 83 passed, 11 intentional project skips, zero failures.
- Whitespace validation: pass.

## Financial Integrity

- Canonical account rows remain the balance owner.
- `payBillEvent` is the shared mutation owner for a complete payment request.
- Generated payment IDs remain deterministic and retries remain idempotent.
- Accounting Type owns sign semantics; transaction Purpose owns workflow classification.
- No financial prediction, inferred payment, or production-data mutation was introduced.

## Rollback

Revert the focused Sprint 0.18 commit, push the revert, and redeploy production. No database rollback or data migration is required.

Production target: `https://vcc-os.vercel.app/`

Go/no-go approver: production deployment explicitly authorized by the user in the release task. The complete browser matrix passed; post-deployment smoke evidence will be recorded in the task report.
