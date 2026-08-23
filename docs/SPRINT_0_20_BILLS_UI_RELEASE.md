# Sprint 0.20 Bills UI Release

Release candidate: `codex/backlog-fix-sprint`

Scope:

- Remove the nested spreadsheet editor focus box so one selected Bills cell has one clear highlight.
- Give Paid From enough desktop width to remain readable.
- Disambiguate Paid From accounts with their stable account label and currency-formatted balance.
- Prove that selecting Paid From alone persists without marking a bill paid, debiting an account, or creating a linked transaction.

## Release gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint | Pass | ESLint completed with zero warnings. |
| TypeScript | Pass | `tsc --noEmit` completed successfully. |
| Unit tests | Pass | 180 tests passed across 25 files. |
| Production build | Pass | Vite production build and bundle budgets passed; main JavaScript is 138.22 KB gzip. |
| Browser QA | Pass with infrastructure caveat | The bounded desktop/mobile run completed 85 scenarios with 10 intentional project skips. One unrelated mobile pointer-interception timeout passed immediately in isolation. Bills payment integrity, Paid From persistence, and single-highlight coverage passed on both projects. |
| Financial integrity | Pass | Paid From selection was verified to leave status, account balance, and linked transaction count unchanged until a valid paid event is posted. Reopening a paid bill clears its stored payment evidence and linked transaction through the existing event engine. |
| Data/platform scope | Pass | No schema, Supabase, authentication, RLS, or production-data changes are included. |

## Root cause and correction

- Spreadsheet cells and their focused inputs/selects each rendered independent focus treatments, creating nested selection boxes. The cell now owns the visible focus treatment while its active editor remains visually quiet.
- The Bills Paid From column was undersized on desktop, clipping both the placeholder and account choices. The Bills table and Paid From column now reserve sufficient width.
- Account choices reused shortened display labels, which could be ambiguous when accounts shared a name. Choices now show the stable disambiguated account value plus a formatted balance without changing the stored account identifier.

## Approval and rollback

The repository owner explicitly requested this fix be committed, pushed, and deployed to the official VCC Vercel project.

Rollback point: redeploy commit `b2928612` if production smoke testing finds a release-specific regression. Deployment does not migrate or rewrite stored financial data.

## Residual risk

The pre-existing exhaustive 30-layout local matrix twice reached a blank, unrendered preview document after several minutes instead of producing a layout assertion. Targeted Bills desktop/mobile visual checks and the remainder of the desktop/mobile suite passed; the matrix infrastructure stall should be hardened separately so it can retry a lost local preview navigation.
