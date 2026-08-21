# Sprint 0.19 Release Readiness

Release candidate: `codex/backlog-fix-sprint`

Scope:

- Add safe edit, delete, lock, and unlock controls to Money Snapshot paycheck history.
- Replace the Current Week Planner lock control with a direct Record Paycheck action.
- Reconcile paycheck edits and deletions against their exact stored account and repayment effects using integer cents.
- Reduce normal-launch visual transfer and remove the duplicate startup data load.

## Release gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Lint | Pass | ESLint completed with zero warnings. |
| TypeScript | Pass | `tsc --noEmit` completed successfully. |
| Unit tests | Pass | 180 tests passed across 25 files. |
| Production build | Pass | Vite production build and bundle budgets passed. |
| Browser QA | Pass | 81 scenarios passed in the full run, 11 project-specific scenarios were intentionally skipped, and both navigation scenarios affected by a transient long-lived dev-server stall passed immediately in isolated reruns (effective full-suite coverage: 83 passed). A new paycheck edit/lock/delete reconciliation test also passed on desktop and mobile. |
| Accessibility/runtime | Pass | Full-route accessibility check passed on desktop and mobile; the mobile all-route runtime check passed on isolated rerun. |
| Financial integrity | Pass | Unit and browser coverage verify cent-accurate account/repayment reversal, locked-record protection, saved edits, and paycheck deletion. No database, Supabase, authentication, or RLS changes are included. |
| Performance budget | Pass | Main JavaScript is 138.2 KB gzip. Normal-launch logo/companion assets total 87,452 bytes against a 200,000-byte budget. |

## Performance evidence

- Normal-launch logo and companion assets: 2,785,403 bytes before; 87,452 bytes after (96.9% reduction).
- Selectable wallpaper assets: 4,923,897 bytes before; 247,568 bytes after (95.0% reduction).
- Startup persistence normalization now runs once instead of twice.
- Explicit logo dimensions reduce avoidable layout movement.

## Approval and rollback

The repository owner explicitly requested that this sprint and the preceding paycheck-history work be committed and deployed to the official VCC Vercel project.

Rollback point: redeploy commit `6e4789ae` if production smoke testing finds a release-specific regression. This sprint contains no schema migration and does not mutate production data during deployment.

## Residual risk

Saved paycheck records created by older releases can lack newer audit metadata. Those legacy rows remain readable, but destructive financial reconciliation is rejected unless the app can prove the exact stored effects. This favors data safety over guessing.
