# Sprint 0.24 — Deterministic Playwright Server Lifecycle

Completed: 2026-08-24

## Goal

Restore a deterministic full-suite release signal on Windows by ensuring Playwright owns one fresh Vite server, never silently reuses a stale development server, and releases the server and test port automatically after the run.

## Baseline evidence

The pre-release gate initially ran while two VCC-OS Vite server trees from August 20 and August 23 were still active on the configured test port. The aggregate browser run produced 95 passes, 11 intentional project skips, and two timeouts/failures. Every failed case passed on an immediate focused rerun, including VitaScan OCR, cross-route loading, and the major control matrix.

After stopping only the verified stale VCC server trees, the unchanged full suite completed with 97 passes, 11 intentional skips, and zero failures. Its shell-managed Vite child then remained alive and held Playwright teardown open until that exact server process was stopped. This proved that the release blocker was server ownership and teardown, not application behavior.

## Changes

- Removed the shell-based `webServer` command from `playwright.config.ts`.
- Added `tests/e2e/global-setup.ts`, which creates Vite through its programmatic API on `127.0.0.1:4173` with `strictPort: true`.
- Registered that setup through Playwright's `globalSetup` configuration.
- Returned an asynchronous teardown callback that awaits `server.close()` on the exact owned Vite instance.
- Kept one worker, both Chromium projects, all timeouts, all assertions, and all product behavior unchanged.

Playwright documents that `webServer` graceful `SIGINT` and `SIGTERM` settings are ignored on Windows. The programmatic lifecycle avoids relying on those unsupported signals: [Playwright web-server documentation](https://playwright.dev/docs/test-webserver).

## Verification

| Gate | Result |
| --- | --- |
| Focused lifecycle test | Pass; process exited normally in 11.1 seconds |
| Port ownership after focused test | Port 4173 released |
| Production build | Pass in 5.22 seconds |
| Application bundle budget | 465,440 / 500,000 bytes |
| Startup visual budget | 87,452 / 200,000 bytes |
| ESLint | Pass; zero warnings |
| TypeScript | Pass |
| Unit tests | 183 passed across 25 files |
| Full Playwright suite | 97 passed, 11 intentional project skips, 0 failed in 17.9 minutes |
| Automatic full-suite teardown | Pass; exit code 0 without manual process termination |
| Port ownership after full suite | Port 4173 released |
| Production dependency audit | 0 vulnerabilities |
| Whitespace check | Pass |

## Release decision

**GO** for the focused Sprint 0.24 commit, push, and official production deployment. The change hardens only the local/CI release harness. It does not modify application code, dependencies, financial calculations, Supabase schema or RLS, production data, or persisted browser data.

## Rollback

Revert the Sprint 0.24 changes to `playwright.config.ts`, remove `tests/e2e/global-setup.ts`, and revert the associated documentation. No database, user-data, dependency, or application rollback is required.
