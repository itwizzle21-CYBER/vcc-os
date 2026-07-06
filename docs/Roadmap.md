# Roadmap

## Sprint 0: Repository Recovery, Governance, And Documentation

Status: In progress until commit/push/deploy is completed outside the current Git permission blocker.

Completed scope:

- Verified real app root.
- Added `/docs` source-of-truth structure.
- Added governance framework.
- Documented architecture, security, finance, QA, UI, audit, and project health.

## Recommended Sprint 1: Release Pipeline Recovery

- Fix `.git/index.lock` permission issue.
- Commit existing package/test workflow changes intentionally.
- Push current main.
- Deploy to Vercel.
- Run production smoke.

## Recommended Sprint 2: Financial Engine Test Coverage

- Add targeted tests for `computeFinancialState()`.
- Add targeted tests for `computeDecisionEngine()`.
- Add import normalization tests.
- Add blank-row and malformed-row regression tests.

## Recommended Sprint 2A: Dashboard Intelligence Hardening

- Start from `Dashboard_Audit.md`, `Dashboard_Backlog.md`, `Dashboard_Architecture_Review.md`, `Dashboard_QA_Checklist.md`, and `Dashboard_Risk_Assessment.md`.
- Add dashboard/module financial consistency tests before refactoring.
- Consolidate duplicated bill and inventory derivation between financial and decision engines.
- Clarify dashboard card semantics for Transactions Preview, Balance, Cash Flow, and Statistics.
- Preserve the current dashboard layout and read-only behavior.

## Recommended Sprint 3: Settings And Data Safety Hardening

- Improve backup/restore UX.
- Add import preview/validation summary.
- Add data export metadata.

## Later Roadmap

- Supabase/auth architecture decision.
- Remote sync and offline conflict rules.
- Observability.
- Deeper accessibility QA.
