# VCC-OS Release 0.14 — Go/No-Go Record

Date: 2026-08-14

## Scope

This release combines Sprints 0.9 through 0.14: Reports and Settings ownership extraction, persistence/reset contracts, cloud-conflict disclosure, versioned backup/recovery, and final security/accessibility hardening.

## Go/No-Go Evidence

- Build and 500,000-byte application bundle budget: pass at 450,778 bytes.
- ESLint and TypeScript: pass.
- Unit tests: 165 passed across 24 files.
- Browser evidence: 69 passed and 10 intentional project skips in the matrix; all three infrastructure-timeout cases passed on exact isolated rerun.
- Accessibility: built-in measurable auditor reports zero failures across 15 routes; permanent desktop/mobile route checks pass.
- Security: release-diff review complete; the oversized-import risk was remediated; zero remaining reportable findings.
- Dependencies: `npm audit --omit=dev` reports zero vulnerabilities.
- Database: no migration.
- Release notes and sprint records: complete.

Decision before deployment: **GO**.

## Rollback Criteria

Rollback immediately if any of these occur after deployment:

- an official route does not reach the Vercel READY deployment;
- a critical navigation or persistence flow fails;
- any cross-account cloud data exposure is observed;
- an import, reset, or cloud restore loses the prior local workspace;
- client error rate or 5xx rate rises above twice the prior baseline for five minutes.

## Rollback Procedure

1. Promote or redeploy the previous known-good Vercel production deployment.
2. Confirm the official alias points to the previous READY artifact.
3. Run the production route/status checks permitted by the deployment workflow.
4. Preserve user recovery history; no database rollback or destructive cleanup is required.
5. Record the incident and add a regression test before redeploying.

## Deployment Record

- Release commit: `585b2b4f` (`feat: harden VCC data safety and release readiness`)
- GitHub push: `main` synchronized with `origin/main`
- Vercel deployment: `dpl_BU8qTK3RseKBmuzbFgc2FdgopqV6`
- Official alias: `https://vcc-os.vercel.app`
- Deployment status: `READY` (production)
