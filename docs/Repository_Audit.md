# Repository Audit

## Scope

Sprint 0 audited folder structure, components, routing, data flow, Supabase integration, authentication, RLS, local storage, offline cache, decision engine, performance, technical debt, documentation, and UI consistency.

## Folder Structure

Findings:

- The repository is a flat export with TypeScript, TSX, tests, SQL, and docs at the root.
- Imports reference missing folders such as `modules`, `components`, `pages`, `_core`, `drizzle`, and alias paths under `@/`.
- New canonical documentation lives under `/docs`.
- Legacy documentation was archived under `/docs/archive/legacy-export`.

Risks:

- Builds are not reproducible from this snapshot.
- Future sprints may patch the wrong structure if imports are not reconciled.

Recommendations:

- Restore or create a standard app structure.
- Add a project manifest and TypeScript config.
- Keep docs in `/docs` only.

Estimated effort: Medium.

## Components

Findings:

- Dashboard and module components exist for bills, debt, savings, inventory, goals, buy next, and vehicle debt.
- Some components use local state while others depend on tRPC.
- UI uses Tailwind/shadcn-style primitives by import, but primitive files are missing.

Risks:

- UI components may not compile until dependencies and paths are restored.
- Data displayed in cards may not match persisted data.

Recommendations:

- Reconcile component paths.
- Replace mock-only paths with typed tRPC boundaries or explicit demo mode.

Estimated effort: Medium.

## Routing

Findings:

- `App.tsx` uses `wouter`.
- `routers.ts` defines tRPC router composition.
- Frontend route loader references missing modules.

Risks:

- Navigation can fail at compile time.
- Server/client route contracts are not verifiable.

Recommendations:

- Define a route map and test every route.
- Restore missing module directories or update imports to match current files.

Estimated effort: Medium.

## Data Flow

Findings:

- tRPC is the intended server-state path.
- Local React state and mock fallback data coexist with server queries.
- Drizzle database helpers return empty data when no database is connected.

Risks:

- Silent empty states can mask database failures.
- Mock data may be mistaken for live data.

Recommendations:

- Document demo mode versus live mode.
- Surface database unavailable states in development.

Estimated effort: Medium.

## Supabase Integration

Findings:

- No Supabase client, config, or migrations were found.
- Database layer is Drizzle/MySQL oriented.

Risks:

- Supabase deployment assumptions would be incorrect for this snapshot.

Recommendations:

- Decide whether Supabase is a roadmap target or remove it from current implementation claims.
- If adopted, design schema, auth, RLS, and migration strategy before coding.

Estimated effort: Large.

## Authentication

Findings:

- Auth is referenced through missing `_core` cookie/session modules.
- Protected procedures are referenced but not present in this snapshot.

Risks:

- Authorization cannot be verified.
- User-specific financial data may not be isolated until auth is restored.

Recommendations:

- Restore server core or document auth as planned.
- Add route and API authorization tests once auth exists.

Estimated effort: Large.

## RLS Policies

Findings:

- No Supabase RLS policies found.
- Current SQL is MySQL-style and does not include row-level security.

Risks:

- If moved to Supabase without RLS, exposed tables could leak user data.

Recommendations:

- Require RLS before any Supabase table is exposed.
- Use ownership predicates for every user-owned row.

Estimated effort: Medium once Supabase is chosen.

## Local Storage And Offline Cache

Findings:

- No localStorage or offline cache implementation was found.

Risks:

- Offline behavior is not available.
- App may depend entirely on server availability.

Recommendations:

- Treat offline cache as planned, not current.
- Design export/import and conflict rules before implementation.

Estimated effort: Medium.

## Decision Engine

Findings:

- Decisioning is distributed across dashboard cards and module calculations.
- No central decision-engine module exists.

Risks:

- Alerts, buy-next priorities, and daily briefings can drift.

Recommendations:

- Create a documented decision-engine contract before expanding AI/action recommendations.

Estimated effort: Medium.

## Performance

Findings:

- Dashboard triggers multiple tRPC queries independently.
- No bundler config was found.
- No performance budgets or smoke automation were found in this snapshot.

Risks:

- Uncoordinated dashboard queries can create loading waterfalls.
- Build size and route performance cannot be measured.

Recommendations:

- Add project tooling, route-level smoke tests, and dashboard query strategy.

Estimated effort: Medium.

## Technical Debt

Findings:

- Missing manifest/config files.
- Broken import topology.
- `any` is used in boundaries.
- Tests reference relative paths that do not match the flat export.
- Time-sensitive tests use dates around June 2026.

Risks:

- Low confidence in repeatable validation.
- Future sprints could compound structural drift.

Recommendations:

- Make repository shape buildable before feature work.
- Add deterministic date handling in tests.

Estimated effort: Large.

## Existing Documentation

Findings:

- Several legacy export docs existed at root.
- Sprint 0 moved them to `/docs/archive/legacy-export`.
- New docs now define source-of-truth structure.

Risks:

- Historical docs may contradict current architecture.

Recommendations:

- Use archived docs only for context.
- Keep current docs concise and updated every sprint.

Estimated effort: Low.

## UI Consistency

Findings:

- Dark premium dashboard style is consistent across many components.
- Inventory page uses more neutral shadcn-style theming than dark dashboard pages.
- UI primitives are imported but not present in this snapshot.

Risks:

- Visual consistency cannot be verified without a buildable app.

Recommendations:

- Preserve existing style.
- Add UI guidelines and visual smoke checks before redesign work.

Estimated effort: Medium.

