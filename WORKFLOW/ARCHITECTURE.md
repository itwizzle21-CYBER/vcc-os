# VCC_OS Architecture

This document describes the current production baseline. Keep it updated whenever architecture, routing, state, data flow, design rules, or deployment behavior changes.

## Current Folder Structure

```text
VCC_OS/
  App.tsx
  Dashboard.tsx
  eslint.config.js
  index.html
  package.json
  routers.ts
  vite.config.ts
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
      vccSkin.css
  docs/
    Governance/
  WORKFLOW/
    ARCHITECTURE.md
    CHANGELOG.md
    DECISIONS.md
    KNOWN_ISSUES.md
    SKILL.md
    VCC_WORKFLOW_MEMORY.md
```

Important current caveat: there are older workflow files outside `WORKFLOW/` from earlier setup work. Do not delete or move them without approval. Treat `WORKFLOW/` as the active source going forward.

## Routing And Pages

VCC_OS is currently a Vite React single-page app. It does not use file-system routing.

- `src/main.tsx` mounts React into `#root`.
- `App.tsx` renders `Dashboard`.
- `Dashboard.tsx` owns the active view through `view: AppView`.
- `AppView` is either `dashboard`, `settings`, or a `SectionKey`.
- Navigation uses the local `open(nextView)` function and syncs the active screen to hash routes such as `#/settings`, `#/money`, and `#/dashboard`.
- Direct hash routes load the matching screen on startup; invalid hashes fall back to Dashboard.
- Sidebar and mobile topbar call `open(view)` to switch screens.

Current screen map:

- `dashboard`: read-only command center.
- `settings`: local settings/control page.
- `alerts`: read-only priority alerts page.
- `money`, `bills`, `income`, `budget`, `transactions`, `debt`, `savings`, `inventory`, `buyNext`, `activity`, `goals`, `missions`: dedicated module pages using `ModulePage` or thin wrappers around it.

`routers.ts` currently references TRPC/server modules that are not part of the active Vite app flow. Treat it as a backend/API placeholder until a real backend integration is intentionally wired and validated.

## Data Flow

The core data model is section-based:

1. `defaultSections` in `src/lib/storage/vccStorage.ts` defines all editable modules, columns, starter rows, and read-only alert metadata.
2. `Dashboard.tsx` initializes `sections` from `loadSections()`.
3. User edits flow through `updateCell`, `addRow`, `deleteRow`, and `resetSection`.
4. `applyDerivedRow` normalizes derived cells such as bill priority, bill auto-alerts, inventory category, and inventory alert.
5. `computeFinancialState(sections)` produces metrics and domain summaries.
6. `computeDecisionEngine(financial, sections)` produces recommended moves, alerts, mission stack, and status labels.
7. Dashboard components render read-only intelligence from computed state.
8. Dedicated module pages render editable grids from `sections`.
9. `saveSections(sections)` persists the current data to browser `localStorage`.

Do not bypass this flow when adding features. New financial intelligence should usually be derived in `src/lib/engine/` or `src/lib/calculations/`, then passed into components.

## State Management

Current state is local React state:

- `view`: active screen.
- `menuOpen`: mobile/topbar menu state.
- `sections`: all user-editable workbook data.

Persistence is browser-local:

- Storage key: `vcc_os_protected_vault_v2`.
- Storage file: `src/lib/storage/vccStorage.ts`.
- Saved rows are merged with current defaults so new default rows can be added without wiping user data.

Rules:

- Keep state as close to `Dashboard.tsx` as practical until a real shared state need appears.
- Preserve localStorage migration behavior when changing section columns.
- Never make the dashboard directly mutate data except navigation and explicit reset actions already housed in Settings.

## Supabase And Backend Notes

There is no active Supabase client or production backend data flow in the current Vite app.

Current backend-related observations:

- `routers.ts` references TRPC-style routers, cookies, auth, and modules that are not present in the active app tree.
- No current source file imports `supabase` or creates a Supabase client.
- Current persistence is local-only in the browser.

If Supabase is added later:

- Use `supabase-postgres-best-practices`.
- Define schema and RLS decisions in `WORKFLOW/DECISIONS.md`.
- Keep dashboard reads intelligence-focused.
- Route writes through dedicated pages or intentional server actions/API functions.
- Preserve local migration/export strategy before replacing browser-local data.
- Do not store service role keys in client code.

## Vercel Deployment Notes

Production source of truth: `https://vcc-os.vercel.app`.

Current app stack:

- Vite
- React 19
- TypeScript
- Build script: `npm run build` (`tsc -b && vite build`)
- If PowerShell blocks `npm`, use `npm.cmd run build` and record the lesson in workflow memory.

Deployment rules:

- Deploy only to `https://vcc-os.vercel.app`.
- Do not use old preview URLs as source of truth.
- Before commit: run build.
- Before push: run code review.
- Every deployment must update `WORKFLOW/CHANGELOG.md`.
- Keep `dist/` generated output out of commits unless the repo intentionally changes deployment strategy.

## Component Hierarchy

High-level runtime hierarchy:

```text
src/main.tsx
  App.tsx
    Dashboard.tsx
      Topbar
      ShellSidebar
      DashboardHome
        DashboardTopRow
        BriefingCard
        MetricsGrid
        DebtProgressPanel
        CashFlowPanel
        WeeklyStatsPanel
        TransactionsPreviewPanel
        BalancePanel
        AllocationPanel
        RecommendedMoveCard
        ModuleDock
        ObjectiveStack
      AlertsPage
        PageHeader
        PriorityAlerts
      SettingsPage
        PageHeader
      ModuleRoute
        MoneySnapshotModule
        BillsModule
        IncomeModule
        ModulePage for Budget
        TransactionsModule
        DebtModule
        SavingsModule
        InventoryModule
        ModulePage for Buy Next
        ModulePage for Activity
        GoalsModule
        MissionsModule
          ModulePage
            PageHeader
            SpreadsheetGrid
```

Component folders:

- `src/components/dashboard/`: read-only dashboard intelligence widgets.
- `src/components/layout/`: global shell controls such as `Topbar`.
- `src/components/modules/`: dedicated editable pages and module wrappers.
- `src/components/shared/`: reusable shared UI such as page headers and spreadsheet grids.

Before adding a component, first check whether an existing dashboard, module, layout, or shared component can be improved.

## Design System Rules

The active design system is custom CSS in `src/styles/vccSkin.css`.

Rules:

- Preserve the current premium finance-command-center baseline.
- Use existing CSS variables for colors, radius, shadows, layout sizes, and panels.
- Keep dashboard cards read-only and action-oriented.
- Keep editing controls inside dedicated pages.
- Prefer quiet, dense, scannable product UI over marketing-style sections.
- Keep buttons clean, obvious, and accessible.
- Do not create nested card-heavy layouts unless the existing pattern calls for it.
- Do not replace the working layout with a simpler layout without asking.
- Fix mojibake/broken glyphs when encountered, but do not broaden scope without reason.

## Naming Conventions

TypeScript and React:

- Components use PascalCase: `MetricsGrid`, `ModulePage`, `SpreadsheetGrid`.
- Functions and local handlers use camelCase: `computeFinancialState`, `updateCell`, `resetSection`.
- Types use PascalCase: `SectionKey`, `AppView`, `Metrics`.
- Section keys use lowercase string unions: `money`, `bills`, `inventory`.
- CSS classes use camelCase or descriptive compound names already present in the skin: `dashboardShell`, `spreadsheetGrid`, `moneyHeroCard`.

Data conventions:

- Section columns are user-visible labels and may contain spaces.
- Rows are `Record<string, string>`.
- Derived values should be calculated rather than stored when possible.
- Money formatting should use helpers in `src/lib/calculations/helpers.ts`.

## Mobile And Responsive Rules

Mobile polish is a permanent product rule.

Current responsive breakpoints:

- `1240px`: desktop layout compresses into simpler grids.
- `860px`: mobile shell takes over with topbar and bottom navigation.

Rules:

- Preserve the mobile bottom navigation behavior.
- Keep table grids horizontally scrollable rather than crushing columns.
- Ensure controls stay at tappable sizes.
- Avoid text overlap inside buttons, cards, and grid cells.
- Test mobile changes around dashboard, module pages, and spreadsheet editing.
- Use `playwright-best-practices` or browser checks for responsive regressions when UI behavior changes.

## Known Architectural Decisions

Authoritative decisions are tracked in `WORKFLOW/DECISIONS.md`. Current active decisions:

- `WORKFLOW/` is the permanent workflow source.
- The current layout is the baseline unless the user explicitly asks for redesign.
- Dashboard stays read-only and intelligence-focused.
- Dedicated pages handle editing.
- Money, Bills, Inventory, and Debt remain editable.

## Future Roadmap

Near-term:

- Clean up duplicated/old workflow files only after explicit approval.
- Continue polishing existing layout without rebuilding.
- Fix remaining mojibake labels in UI text where they appear.
- Add browser verification once local preview connectivity is reliable.
- Resolve lint configuration mismatch if linting becomes part of the required gate.

Product:

- Expand Settings into real account, theme, layout mode, QR, and quick-access controls.
- Add safer import/export or backup for local VCC data.
- Improve dedicated module summaries and grid ergonomics.
- Add stronger accessibility and keyboard flows for spreadsheet editing.

Backend:

- Decide whether localStorage remains primary or Supabase becomes the persistence layer.
- If Supabase is adopted, design schema, auth, RLS, migrations, and rollback plan before coding.
- Keep local data migration/export in place during any backend transition.

Deployment:

- Keep Vercel production deployment focused on `https://vcc-os.vercel.app`.
- Record every deployment in `WORKFLOW/CHANGELOG.md`.
- Require build and code review before pushing production changes.

## Repository Organization Rule

Always keep the repository organized:

- Before creating any new component, page, hook, utility, or data model, search the project for an existing implementation.
- Reuse or extend existing code whenever practical.
- Avoid duplicate functionality and parallel implementations.
- If replacing old code, remove the obsolete implementation only after verifying the new one works.
- Every file must have a clear purpose and live in the correct architectural location.
- Refactor when appropriate instead of continuously adding layers of code.
- Leave the project cleaner than it was before beginning the task.
- Source code stays under the established `src/` component/lib/styles folders unless there is a clear architectural reason to move it.
- Workflow documentation stays in `WORKFLOW/`.
- Generated files and temporary test artifacts should not be kept unless intentionally part of the repo.
- Remove dead or duplicate code only after validation and only when safe.
