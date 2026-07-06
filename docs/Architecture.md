# Architecture

## Verified Root And Tooling

- Root: `C:\Users\itwiz\Documents\Projects\VCC_OS`
- App: Vite + React 19 + TypeScript
- Build: `npm.cmd run build`
- Lint: `npm.cmd run lint`
- Vercel project: `.vercel/project.json` points to project `vcc-os`
- Production URL: `https://vcc-os.vercel.app`

## Folder Structure

```text
VCC_OS/
  App.tsx
  Dashboard.tsx
  index.html
  package.json
  package-lock.json
  playwright.config.ts
  routers.ts
  vite.config.ts
  public/
  src/
    main.tsx
    components/
      dashboard/
      layout/
      modules/
      shared/
    lib/
      calculations/
      engine/
      storage/
      types/
    styles/
  tests/
    smoke/
  docs/
    Governance/
  WORKFLOW/
```

## Routing

VCC-OS is a single-page Vite app. It does not use file-system routing.

- `src/main.tsx` mounts React.
- `App.tsx` renders `Dashboard`.
- `Dashboard.tsx` owns `view: AppView`.
- `AppView` is `dashboard`, `settings`, or a `SectionKey`.
- Hash routes such as `#/settings`, `#/money`, and `#/bills` load the matching screen.
- Invalid hash routes fall back to Dashboard.

## Component Hierarchy

```text
src/main.tsx
  App.tsx
    Dashboard.tsx
      Topbar
      ShellSidebar
      DashboardHome
        BriefingCard
        MetricsGrid
        RecommendedMoveCard
        ObjectiveStack
        ModuleDock
      AlertsPage
      SettingsPage
      ModuleRoute
        MoneySnapshotModule
        BillsModule
        IncomeModule
        TransactionsModule
        DebtModule
        SavingsModule
        InventoryModule
        GoalsModule
        MissionsModule
        ModulePage for Budget, Buy Next, Activity
```

## Data Flow

1. `defaultSections` defines editable sections, columns, starter rows, and read-only alerts metadata.
2. `loadSections()` reads browser localStorage and normalizes saved data.
3. `Dashboard.tsx` stores section state.
4. Edits go through `updateCell`, `addRow`, `deleteRow`, and `resetSection`.
5. `applyDerivedRow()` calculates derived cells.
6. `computeFinancialState()` derives money, bill, debt, savings, inventory, budget, activity, and goal metrics.
7. `computeDecisionEngine()` derives recommendations, alerts, mission stack, and status labels.
8. `saveSections()` persists normalized data to localStorage.

## Storage

Current storage is browser-local:

- Primary key: `vcc_os_protected_vault_v2`
- Backup key: `vcc_os_backup_v1`
- Import/restore uses current section normalization.

## LocalStorage And Offline Strategy

Current app is local-first through localStorage. There is no service worker, sync engine, conflict resolution, or remote offline cache yet.

## Supabase Integration

No active Supabase client, Supabase config, migrations, or RLS policies are present in the current app. Supabase is a future backend option only.

## Authentication

No active authentication is wired into the Vite runtime. `routers.ts` references backend/TRPC concepts that are not part of the active app flow.

## Decision Engine

Decisioning lives in `src/lib/engine/decisionEngine.ts` and consumes `FinancialState` plus sections. It produces:

- Today mission
- Recommended move
- Priority alerts
- Mission stack
- Financial and domain status labels

## Deployment Pipeline

Target flow:

1. Build
2. Lint
3. Diff check
4. Local smoke when relevant
5. Commit
6. Push
7. Vercel production deploy
8. Production smoke
9. Release report

## Architectural Risks And Cleanup

- `routers.ts` is not part of the active runtime and should remain a placeholder until intentionally integrated.
- Git index write permissions are blocked in the sandbox, preventing local commit/push.
- `test-results/` is generated output and should remain out of commits.
- Empty local workflow/skill artifacts may remain due sandbox delete limits.
- Supabase/auth claims should not be made until implementation exists.

