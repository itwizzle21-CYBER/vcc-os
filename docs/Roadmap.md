# Roadmap

## Sprint 0: Governance And Documentation

Status: Complete in documentation scope.

Outcomes:

- Canonical `/docs` structure.
- Repository audit.
- Project health report.
- Engineering, QA, security, financial, and UI standards.
- Legacy docs archived.

## Recommended Sprint 1: Repository Restoration

Goal: Make the repository buildable and testable without changing product behavior.

Tasks:

- Add or restore `package.json`, lockfile, TypeScript config, Vite config, and test config.
- Reconcile source paths with imports.
- Restore missing `src`, `modules`, `components`, `_core`, and `drizzle` structure or update imports to match reality.
- Run existing tests.
- Add basic smoke test.

## Recommended Sprint 1A: Canonical Root Restoration

Goal: Eliminate repository confusion and align local development with the deployed Vercel application.

Tasks:

- Restore the complete source tree that Vercel is currently building.
- Add or restore `package.json`, lockfile, `src`, `public`, TypeScript config, Vite config, and Playwright config.
- Configure Git `origin` to the GitHub repository.
- Link `.vercel/project.json` to `crlzel/vcc-os`.
- Verify environment variable names without exposing values.
- Run build, lint, type check, tests, smoke test, and `git diff --check`.
- Archive or mark any exports/backups as non-development copies.

## Recommended Sprint 2: Data Flow Stabilization

Goal: Remove ambiguity between mock data, local state, and server data.

Tasks:

- Define demo mode versus live mode.
- Centralize dashboard data contracts.
- Ensure module pages and cards share data sources.
- Add deterministic date handling.

## Recommended Sprint 2A: Financial Engine Foundation

Goal: Create the single source of truth for financial calculations without changing user-facing behavior.

Tasks:

- Restore build/test tooling before implementation begins.
- Create pure Financial Engine functions for bills, debt, savings, goals, money snapshot, cash flow, and Buy Next summaries.
- Add golden tests that match current Dashboard, Bills, Debt, Savings, and vehicle tracker outputs.
- Replace page-local calculations one module at a time after tests prove parity.
- Keep mock/demo data separated from live financial values.
- Feed Priority Alerts, Decision Engine, Reports, Analytics, future AI, and future automation from engine outputs.

## Recommended Sprint 3: Security And Auth Baseline

Goal: Make user data isolation verifiable.

Tasks:

- Restore authentication server core.
- Add protected route/procedure tests.
- Decide MySQL/Drizzle versus Supabase/Postgres direction.
- If Supabase is selected, create RLS policies before real data.

## Recommended Sprint 4: Decision Engine Contract

Goal: Centralize recommendations and alerts.

Tasks:

- Consume Financial Engine outputs instead of direct UI-local calculations.
- Define inputs and outputs for Daily Briefing, Priority Alerts, Buy Next, and Recommended Actions.
- Add tests for priority ordering and financial safety.
- Connect AI briefing cache only after deterministic engine behavior exists.

## Later Roadmap

- Offline cache and export/import.
- Trading command center.
- Analytics charts.
- Mobile polish and visual regression tests.
- Production observability.
