# Sprint 0.11 — Persistence and Reset Contracts

Completed: 2026-08-14

## Goal

Make application persistence and section reset behavior explicit, testable, and consistent before changing any linked financial-domain semantics.

## Confirmed Problems

- Ordinary application mutations called `saveAppData` directly and were then saved a second time by a blanket React effect.
- Current-key data migrations depended on that blanket effect to persist their normalized form.
- Resetting Transactions from a spreadsheet could reconcile linked balances, while resetting the same section from Settings only cleared its rows.
- Spreadsheet reset confirmation promised “default rows,” although the implemented reset result was zero rows.

## Contract Decisions

### Persistence

- Every explicit application mutation writes one versioned app snapshot before updating React state.
- Mission-completion activity remains a separate state mutation with its own explicit save.
- Current-key storage migrations are persisted during `loadAppData`, where migration ownership belongs.
- Already-normalized snapshots are not rewritten during load.
- Theme preference remains a separate device-level key.

### Section Reset

- A section reset clears only the selected section to zero rows.
- It does not undo or replay historical cross-section financial events.
- All reset entry points route through the same application handler.
- Full reset remains the only operation that clears the complete workspace.

This isolated reset contract avoids surprising changes to balances, bill status, history, or other domains when the user explicitly chooses one section. Transaction deletion continues to use the existing event-aware deletion path; section reset is a different, table-level data-management action.

## Changes

- Removed the redundant `saveAppData(data)` call from the visual/document-title effect.
- Exported the canonical app-data storage key for contract tests.
- Added idempotent current-key migration persistence to `loadAppData`.
- Routed Settings section resets through the same application reset handler used by spreadsheets.
- Removed the Transactions-only reset side effect so every section follows the isolated contract.
- Corrected spreadsheet reset confirmation copy to promise zero rows and unchanged other areas.
- Added unit coverage for explicit saves, migration writes, normalized-load idempotence, blank reset reloads, and isolated section resets.
- Added desktop/mobile browser coverage proving a mutation writes exactly one snapshot, survives reload, and a Settings reset preserves other sections.

## Verification

| Gate | Result |
| --- | --- |
| Production build and 500,000-byte bundle budget | Pass; largest application chunk 448,521 bytes |
| ESLint | Pass, zero warnings |
| TypeScript | Pass |
| Unit tests | 156 passed across 23 files |
| Focused persistence/reset browser tests | 4 passed across desktop and mobile |
| Full Playwright release suite | 72 passed, 10 intentional project skips, 0 failed |
| Production dependency audit | 0 vulnerabilities |
| Git whitespace check | Pass |

The full browser suite ran 82 cases in 12.4 minutes. It retained the prior 68 passing regression cases and added four passing persistence/reset contract cases.

## Release Decision

**GO** for Sprint 0.11's persistence/reset objective. The duplicate write is removed without losing migration durability, reset behavior is uniform, and all release gates are green.

Sprints 0.9 and 0.10 were committed locally as `17f97b40` before this sprint began. Sprint 0.11 remains uncommitted and undeployed.

## Next Bounded Step

Add explicit same-field cloud-conflict tests around optimistic revisions and three-way merge behavior, then decide whether remote-wins resolutions need a user-visible disclosure.

## Rollback

Restore the blanket persistence call in the application effect, remove current-key migration persistence from `loadAppData`, restore the prior Transactions-only reset branch and direct Settings reset call, and remove the contract tests/copy change. No database, environment, or persisted-data migration rollback is required.
