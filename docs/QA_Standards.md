# QA Standards

Updated 2026-09-12. The repository has a working React/Vite toolchain, Vitest, and Playwright. Historical Sprint 0 tooling limitations are superseded.

## Required validation

Run from the Git root:

- `npm run lint`
- `npm run typecheck`
- `npx tsc --project tests/audit/tsconfig.json`
- `npm test`
- `npm run build`
- `npx vitest run --config tests/audit/vitest.config.ts`
- `npm run test:e2e`
- `npm audit`
- `git diff --check`

There is no `npm run smoke` script. Use the Playwright route/navigation suite for local smoke coverage; verify a deployed preview separately.

## Readiness gate

The ordinary unit suite is regression coverage, not a release certificate. The dedicated audit suite contains correct financial/reporting/backup expectations for known unresolved defects. Its seven current failures block readiness. Do not skip them, invert expectations, or report the ordinary suite alone as a passing release.

See [current readiness audit](VCC_READINESS_AUDIT_2026-09-12.md) for reproductions and priorities. Application code edits are prohibited by the active workspace instruction; that restriction does not make failing contracts acceptable.

## Browser contracts

Bills starts in Review Queue. Open the All Bills tab for spreadsheet tests. Choosing paid status opens payment review; only the explicit Mark Paid submission should change cash and create the linked transaction. Exercise delete/undo, reload persistence, cancellation/reopening, keyboard navigation, dashboard mission CTA navigation, and narrow-screen usability.

Use invented financial fixtures and isolated browser storage. Do not test account attacks or private data transfers against live services.

## Release evidence

Record exact commands, exit status, passed/failed/skipped counts, reviewed revision, and deployment identity. Distinguish local browser tests from live Supabase authentication/RLS and production verification. Keep traces/screenshots for failures. Report incomplete checks as incomplete.
