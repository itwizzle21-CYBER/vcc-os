# Sprint 0.13 — Backup and Recovery

Completed: 2026-08-14

## Goal

Turn VCC's JSON export/import feature into a versioned, validated recovery workflow with a safe way back after destructive local actions.

## Changes

- Added a versioned `VCC-OS` backup envelope with format version, data version, export time, normalized app data, and boolean smart-feature preferences.
- Preserved compatibility with legacy raw app-data exports.
- Rejected foreign-app, future-format, structurally incomplete, and over-5-MB imports before application state changes.
- Added a three-point local recovery history with quota-aware pruning.
- Saved recovery points before backup import, section reset, full reset, explicit cloud restore, and recovery-point restore.
- Added one-click recovery in Settings with accessible live status feedback.

## Verification

- Backup/recovery unit suite: 7 passed.
- Combined focused backup and cloud suite: 13 passed.
- Desktop persistence/recovery browser flow: 2 passed.
- Mobile persistence/recovery browser flow: 2 passed in the release matrix.

## Release Decision

**GO.** Export, import, reset, cloud restore, and recovery paths now have bounded and directly tested safety contracts. Recovery history remains browser-local and intentionally stores the same private financial data already held by VCC local storage.

Rollback is code-only. Existing recovery-history entries can remain safely ignored by the previous release; there is no schema or cloud migration to reverse.
