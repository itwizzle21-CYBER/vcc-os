# Sprint 0.29: Release Gates

Date: 2026-09-13. Production decision: **NO-GO**.

The next roadmap product sprint needs application changes, which the active instruction prohibits. This sprint advances release verification through package scripts, tests, CI, and documentation. It does not repair or certify the product.

## Implemented

- `npm run typecheck:qa` checks audit and browser test types.
- `npm run test:readiness` runs the dedicated financial/privacy contracts.
- `npm run check:readiness` requires lint, application/QA types, ordinary tests, build budgets, readiness contracts, browser tests, and the dependency audit. It stops at the first failure and returns that failure.
- `.github/workflows/readiness.yml` runs quality/dependency, financial/privacy, and browser jobs independently on pushes, pull requests, and manual runs. No failure is ignored. Jobs use Node 24, bounded timeouts, read-only repository permissions, and checkout without persisted credentials.
- S1 reproduces the legacy-workspace fallback to another owner's loan evidence. Assertions print only booleans/counts. The suite now has nine cases: eight unresolved contracts and one passing idempotent-payment control.

Action revisions were verified against the official release tags: [checkout v6.1.0](https://github.com/actions/checkout/releases/tag/v6.1.0), commit `d23441a48e516b6c34aea4fa41551a30e30af803`; [setup-node v6.5.0](https://github.com/actions/setup-node/releases/tag/v6.5.0), commit `249970729cb0ef3589644e2896645e5dc5ba9c38`.

Browser artifacts remain local to each runner and are not uploaded. `createStarterData()` currently includes owner loan evidence, and runtime assets also retain it. Test isolation alone does not remove that privacy defect. Replace the fixtures and public records before enabling artifact publication.

## Local validation

`npm run check:readiness` exited **1**, correctly stopping at the dedicated contract suite:

| Check | Result |
| --- | --- |
| Lint | Pass |
| Application types | Pass |
| Audit/browser test types | Pass |
| Ordinary Vitest | 26 files, 201 tests pass |
| Production build | Pass |
| Main bundle budget | 494,890 / 500,000 bytes |
| Startup visual budget | 87,452 / 200,000 bytes |
| Readiness contracts | 8 fail, 1 pass; S1 and R1–R7 unresolved |
| Browser suite in aggregate command | Not reached after contract failure |
| Dependency audit, run separately with registry access | Pass, zero vulnerabilities |
| Workflow YAML | Parses with push, pull-request, and manual triggers; three jobs |

The previous complete browser run remains the latest local browser evidence: 99 passed, four failed, 11 intentional project skips. A focused rerun after correcting stale test controls still failed desktop target sizing and layout sweeps. Browser/application code is unchanged this sprint, so that suite was not repeated locally. Hosted execution must be checked separately after pushing the workflow.

## Enforcement and release limits

These are executable checks, not configured branch protection or a dependency enforced by Vercel. Required branch checks and deployment policy have not been changed. Automatic previews may become READY while GitHub checks fail. Production promotion remains blocked by unresolved financial, privacy, session-adoption, accessibility, and layout findings from the [readiness audit](VCC_READINESS_AUDIT_2026-09-12.md).

No application source, database schema, production data, or production deployment was changed. Reverting this sprint removes its scripts/workflow/privacy reproducer; it does not resolve the underlying defects.
