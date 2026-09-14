# QA Standards

Updated 2026-09-13. The repository has a working React/Vite toolchain, Vitest, and Playwright. Historical Sprint 0 tooling limitations are superseded.

## Required validation

Run `npm run check:readiness` from the Git root, followed by `git diff --check`. The readiness command stops at the first failed gate. To collect remaining evidence independently, run:

- `npm run lint`
- `npm run typecheck`
- `npm run typecheck:qa`
- `npm test`
- `npm run build`
- `npm run test:readiness`
- `npm run test:e2e`
- `npm audit`
- `git diff --check`

There is no `npm run smoke` script. Use the Playwright route/navigation suite for local smoke coverage; verify a deployed preview separately.

## Readiness gate

The ordinary unit suite is regression coverage, not a release certificate. The dedicated audit suite contains correct financial/reporting/backup/privacy expectations for known unresolved defects. Its eight current failures (R1–R7 and S1) block readiness; the idempotent payment control passes. Do not skip them, invert expectations, or report the ordinary suite alone as a passing release.

The [readiness workflow](../.github/workflows/readiness.yml) runs quality/dependency, financial/privacy, and browser gates independently on pushes and pull requests. Failed contracts fail CI. Required branch checks and a Vercel deployment dependency have not been configured; automatic previews can still build when CI is red. See [Sprint 0.29](SPRINT_0_29_RELEASE_GATES.md).

See [current readiness audit](VCC_READINESS_AUDIT_2026-09-12.md) for reproductions and priorities. Application code edits are prohibited by the active workspace instruction; that restriction does not make failing contracts acceptable.

## Browser contracts

Bills starts in Review Queue. Open the All Bills tab for spreadsheet tests. Choosing paid status opens payment review; only the explicit Mark Paid submission should change cash and create the linked transaction. Exercise delete/undo, reload persistence, cancellation/reopening, keyboard navigation, dashboard mission CTA navigation, and narrow-screen usability.

Use invented financial fixtures and isolated browser storage. Both browser suites use `tests/fixtures/browserData.ts`, which replaces inherited loan evidence, the legacy loan summary, and linked receipt transactions with invented records. Fixture tests check serialized identifiers, cent-level component reconciliation, and workspace isolation. Runtime assets still contain owner evidence under S1; do not publish browser traces or screenshots until that is repaired. Do not test account attacks or private data transfers against live services.

## Release evidence

Record exact commands, exit status, passed/failed/skipped counts, reviewed revision, and deployment identity. Distinguish local browser tests from live Supabase authentication/RLS and production verification. Keep failure traces/screenshots locally; review their privacy before sharing. Report incomplete checks as incomplete.
