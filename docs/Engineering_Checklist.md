# Engineering Checklist

Updated 2026-09-12. The old Sprint 1.3 missing-tooling/root findings are historical; current build, lint, type checking, unit tests, Git origin, and Vercel linkage work.

## Preflight

1. Verify working directory and Git root.
2. Inspect working changes before editing.
3. Verify package manifest, source, public assets, and test configurations.
4. Verify the intended Git remote and Vercel project without exposing credentials.
5. Read the active task constraints.

## Completion gate

1. Run QA commands in [QA Standards](QA_Standards.md), including the dedicated readiness audit.
2. Review source/test/documentation changes and run git diff --check.
3. Fix authorized failures and document exact constraints on remaining failures.
4. Commit and push only reviewed, authorized changes.
5. Deploy a preview when authorized; verify its deployed Git revision and relevant routes.
6. Record the release report, test counts, commit, branch, deployment URL, and limitations.

Passing build or Vercel READY does not override failing financial/security contracts. Known defects make production release NO-GO. A documentation/test review preview must be described as such.

## Current constraint

The active workspace instruction prohibits application code changes. This audit can improve tests, documentation, and compatible tooling dependencies. Product remediation is blocked by that instruction; the unresolved cases in [readiness audit](VCC_READINESS_AUDIT_2026-09-12.md) must remain visible.
