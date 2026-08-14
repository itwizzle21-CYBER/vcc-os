# Sprint 0.12 — Cloud Conflict Safety

Completed: 2026-08-14

## Goal

Make concurrent device edits deterministic, directly tested, and understandable to the person using VCC.

## Changes

- Added a structured three-way merge result containing the merged app data and every same-field conflict path.
- Preserved independent row additions, deletions, and different-field edits by stable row ID.
- Kept the newer protected cloud revision when both devices changed the same field from their shared base.
- Added a persistent sync-dialog disclosure that reports the last same-field conflict count and the remote-wins rule.
- Added direct tests for one and multiple same-field conflicts without flagging compatible edits.

The implementation retains optimistic revision filtering on `user_id` and `revision`. Current Supabase RLS, filtered update, upsert, and 2026 changelog guidance were reviewed before changing the client contract; no database or policy migration was required.

## Verification

- Focused cloud merge suite: 6 passed.
- TypeScript and ESLint: pass.
- Full unit gate: included in the release candidate's 165 passing tests.

## Release Decision

**GO.** Same-field conflict behavior is explicit, deterministic, tested, and disclosed. Rollback is code-only: restore the previous `mergeAppData` API and remove the conflict disclosure. No persisted-data or database rollback is required.
