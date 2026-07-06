# Architecture

## Current Repository Shape

This snapshot is a flat export of application files at the repository root. Several imports reference a fuller intended structure such as `@/components`, `@/lib/trpc`, `./modules/*`, `../drizzle/schema`, and `./_core/*`, but those directories are not present in this repository snapshot.

Sprint 1.3 verified that the current working directory and Git root are both `C:\Users\itwiz\Downloads\VCC-OS`. This is the only VCC-OS repository found under `C:\Users\itwiz\Downloads`, but it is not yet a verified buildable application root because it lacks `package.json`, `src`, `public`, TypeScript config, Vite config, Playwright config, and `.vercel/project.json`.

Current top-level file groups:

- React app shell: `App.tsx`, `Dashboard.tsx`
- Module pages/cards: `BillsPage.tsx`, `DebtPage.tsx`, `SavingsPage.tsx`, `InventoryPage.tsx`, cards, and forms
- Data/calculation helpers: `calculations.ts`, `vehicleCalculations.ts`, `bills.ts`, `data.ts`
- Backend/router placeholders: `router.ts`, `routers.ts`, `moduleLoader.ts`, `registry.ts`, `db.ts`
- Schema/migration: `schema.ts`, `0001_cheerful_steve_rogers.sql`
- Tests: `*.test.ts`, `*.test.tsx`
- Canonical docs: `docs/`

## Application Architecture

The intended architecture appears to be:

```text
App.tsx
  Router via wouter
  ThemeProvider
  TooltipProvider
  Toaster
  Dashboard route
  Dynamically loaded module routes

Dashboard.tsx
  tRPC dashboard queries
  Dashboard cards
  Mock fallback data

Modules
  Bills
  Debt
  Savings
  Inventory
  Goals
  Trading

Backend
  tRPC routers
  Drizzle database helpers
  Session-based auth context
```

## Routing

`App.tsx` uses `wouter` and attempts to load module routes dynamically. `routers.ts` defines a tRPC app router with dashboard, debt, savings, inventory, and auth routers. The referenced module directories are missing in this snapshot, so route integrity is a high-risk area.

## Component Hierarchy

Known UI components include:

- Dashboard cards: daily briefing, mission, money snapshot, priority alerts, buy next, goal progress
- Module cards: bills, debt, savings, inventory
- Module pages: bills, debt, savings, inventory
- Vehicle debt tracker
- Bill form

Several imports use aliases or paths that do not exist in this snapshot, so the source tree needs reconciliation before reliable builds.

## Data Flow

Two data patterns coexist:

1. Dashboard and some pages call tRPC queries and mutations.
2. Some pages keep local React state with hard-coded sample data.

This creates a risk that dashboard data, module pages, and database state diverge.

## Supabase

No active Supabase client, Supabase configuration, or Supabase migration folder was found. The SQL migration and `db.ts` use MySQL/Drizzle patterns. Supabase RLS policies were not found.

## Authentication

`routers.ts` references cookie-based auth and `protectedProcedure` from missing `_core` modules. Authentication should be treated as incomplete until the missing server core is restored or replaced.

## Storage

No localStorage/sessionStorage persistence was found in this snapshot. No offline cache implementation was found. Database persistence appears intended through Drizzle and tRPC.

## Engineering Environment

Current local evidence:

- Canonical local folder candidate: `C:\Users\itwiz\Downloads\VCC-OS`.
- Git root: `C:/Users/itwiz/Downloads/VCC-OS`.
- Local Git branch: `main`.
- Git remote `origin`: not configured.
- Local Vercel link: missing.
- Local build manifest and app configs: missing.

Live Vercel evidence:

- Vercel project: `crlzel/vcc-os`.
- Project ID: `prj_ZSUV6VGFxLlyLQCUAwATsFOQce78`.
- Production URL: `https://vcc-os.vercel.app`.
- Vercel build command: `npm run build`.
- Vercel output directory: `dist`.
- Vercel Node version: `24.x`.

Architecture implication: the local repository snapshot and deployed Vercel source are out of sync. Implementation sprints must not proceed until the complete buildable application root is restored into the canonical repository and linked to GitHub/Vercel.

## Decision Engine

Decision-engine behavior is present conceptually through dashboard cards, priority alerts, buy-next logic, and AI briefing cache, but there is no single central decision-engine module in this snapshot.

## Financial Engine

Sprint 1.2 established ADR-001: all financial values shall originate from a single Financial Engine whenever practical.

Current state:

- Bills logic exists in `calculations.ts`, `db.ts`, `BillsPage.tsx`, and `BillsCard.tsx` fallback data.
- Debt logic exists in `db.ts`, `DebtPage.tsx`, `DebtCard.tsx`, and `vehicleCalculations.ts`.
- Savings and goal progress logic exists in `SavingsPage.tsx`, `SavingsCard.tsx`, `GoalProgressCard.tsx`, dashboard mock data, and sample data.
- Money Snapshot values are currently precomputed mock/sample values rather than derived from a canonical engine.
- Buy Next and Priority Alerts include finance-adjacent calculations and hard-coded recommendation data.

Target financial data flow:

```text
Financial Engine
  Money Snapshot
  Dashboard
  Bills
  Debt
  Savings
  Goals
  Decision Engine
  Reports
  Analytics
  Future AI
  Future Automation
```

The Financial Engine should be implemented as deterministic pure functions first, with server/database adapters feeding normalized records into it. UI components should consume engine outputs and format values at the display boundary.

## Future Scalability

Recommended target architecture:

```text
src/
  app/
  components/
  modules/
  lib/
  server/
  tests/
docs/
drizzle/
```

Move toward one routed app structure, one server/router structure, and one documented data model before adding new product features.

## Architectural Risks

- Missing project manifest prevents repeatable build/test commands.
- Local repository does not match the complete app package Vercel is currently building.
- Flat export does not match import paths.
- Multiple data sources and mock fallbacks can hide integration failures.
- Auth and protected routes reference missing server infrastructure.
- No RLS policies or Supabase client despite Supabase being part of the audit scope.
- Financial logic relies on current dates in tests, which can become time-sensitive.
- Financial values currently come from multiple helper, database, page, card, mock, and sample-data sources.
- Missing Git remote and Vercel link prevent reliable release automation.
