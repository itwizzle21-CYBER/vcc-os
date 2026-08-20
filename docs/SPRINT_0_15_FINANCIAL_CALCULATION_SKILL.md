# Sprint 0.15 — Financial Calculation Governance Skill

Completed: 2026-08-20

## Goal

Create a repository-local skill that makes VCC's established financial ownership, rounding, reconciliation, evidence, and test contracts automatically available during calculation work.

## Scope

- Added `.agents/skills/vcc-financial-calculations/SKILL.md` with a discriminating trigger and an eight-step calculation workflow.
- Added a focused reference for canonical engine ownership, cent-safe rounding, domain invariants, date behavior, and regression-test dimensions.
- Reconciled the Sprint 0.6 AI-stack report to mark its highest-priority remediation complete.
- Updated sprint history and the changelog.

Application code, dependencies, runtime configuration, databases, and production data were not changed.

## Accepted contracts

- Canonical account balances are never combined with already-applied transaction activity a second time.
- Explicit zero remains authoritative.
- Cent allocation preserves documented totals exactly.
- Cross-domain events are atomic, deterministic, idempotent, and exactly reversible.
- Protected savings, spendable cash, borrowed money, and unreconciled cash remain distinct.
- Car-loan schedules and communications cannot overwrite confirmed receipt evidence.
- Date-sensitive calculations use valid ISO dates and deterministic reference dates in tests.

## Validation

| Gate | Result |
| --- | --- |
| Skill structure and frontmatter | Pass; official `skill-creator` validator returned `Skill is valid!` |
| Repository-local discovery path | `.agents/skills/vcc-financial-calculations` |
| Application code changes | None |
| Dependency changes | None |
| Whitespace check | Pass |

## Release decision

The sprint is documentation and agent-governance only. It is eligible for commit after structural validation and does not require an application deployment.

Rollback is deletion of the repository-local skill and reversal of the related documentation entries; no user or production data is affected.
