# Governance

## Product Vision Governance

The product vision lives in `Master_PRD.md`. Future sprint work must align with the command-center purpose: reduce stress, clarify priorities, and help the user decide what to do next.

## Architecture Principles

- Prefer one clear app structure over parallel implementations.
- Document existing architecture before changing it.
- Restore buildability before feature expansion.
- Keep module boundaries explicit.
- Avoid duplicating business logic across dashboard cards and module pages.

## Security Principles

- Treat all financial and life-operation data as sensitive.
- Require server-side authorization for user data.
- Do not expose secrets.
- If Supabase is adopted, require RLS before production data access.

## Financial Standards

Financial behavior is governed by `Financial_Standards.md`. Any change to calculations must include tests, documentation, and an explanation of the decision impact.

## Engineering Standards

Engineering workflow is governed by `Engineering_Standards.md`. Every sprint should preserve current behavior, validate changes, update docs, and produce a release report.

## Documentation Standards

- `/docs` is the single source of truth.
- Archive historical documents instead of deleting them.
- Update docs in the same sprint as code changes.
- Prefer concise, current docs over large stale exports.

## QA Standards

QA behavior is governed by `QA_Standards.md`. If validation cannot run, the blocker must be documented in the release report.

## Sprint Standards

Each sprint must define:

- Goal
- Scope
- Non-goals
- Files changed
- Validation plan
- Release plan
- Known risks

## Release Standards

Do not claim release success unless commit, push, deployment, and smoke test actually complete. If any step is blocked, stop and document the blocker.

## Decision Logging

Major product, architecture, security, financial, and release decisions should be recorded in the relevant docs. If decisions become frequent, create a dedicated `Decision_Log.md`.

## Future Roadmap Management

The roadmap should distinguish:

- Complete
- In Progress
- Planned
- Deprecated
- Needs Review

Roadmap changes must preserve the product vision and avoid hiding foundational debt behind feature work.

