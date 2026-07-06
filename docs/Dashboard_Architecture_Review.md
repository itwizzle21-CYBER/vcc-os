# Dashboard Architecture Review

## Component Hierarchy

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
        PriorityAlerts
      SettingsPage
      ModuleRoute
        Module pages
```

## Shared State

`Dashboard.tsx` owns the runtime state:

- `view`
- `menuOpen`
- `sections`

Derived state:

- `financial = useMemo(() => computeFinancialState(sections), [sections])`
- `decision = useMemo(() => computeDecisionEngine(financial, sections), [financial, sections])`
- `metrics = financial.metrics`

## Routing

Routing is local hash routing:

- `viewFromRoute()` reads `window.location.hash`.
- `open(nextView)` updates state and hash.
- Direct hash routes load known views.
- Invalid routes fall back to Dashboard.

## Data Flow

```text
localStorage
  -> loadSections()
  -> sections state
  -> updateCell/addRow/deleteRow/resetSection
  -> applyDerivedRow()
  -> computeFinancialState()
  -> computeDecisionEngine()
  -> Dashboard cards
  -> saveSections()
  -> localStorage
```

## Architecture Strengths

- Single local section model drives modules and dashboard.
- Dashboard cards receive derived data rather than owning mutable financial state.
- Dedicated module pages reuse `ModulePage` and `SpreadsheetGrid`.
- Import/restore normalize through storage helpers.
- Hash routing avoids extra routing dependencies.

## Architecture Concerns

- `Dashboard.tsx` is large and contains page routing, state mutation, dashboard layout, Settings, sidebar, and card helpers.
- Some dashboard-only panels live inline in `Dashboard.tsx` while other dashboard panels are extracted under `src/components/dashboard/`.
- Bill and inventory normalization are repeated across financial and decision engines.
- `cardFor()` is a dashboard-specific summary map inside `Dashboard.tsx`; module summaries have another switch in `ModulePage.tsx`.
- Decorative analytics panels mix real values with synthetic chart heights.
- The `alerts` section exists in `SectionKey`/defaults but dashboard alert content is computed, not stored.
- `routers.ts` remains an inactive backend placeholder.

## Performance Review

Current risks are modest because data is local and small. Future risks:

- `saveSections(sections)` writes the whole section payload on every edit.
- `computeFinancialState()` recalculates every section on every section change.
- `computeDecisionEngine()` recomputes alerts and repeats some row normalization.
- Large spreadsheet growth could make keypress edits more expensive.

Recommended future improvements:

- Add data-volume performance tests before scaling large inventories/transactions.
- Consider section-scoped memoization only after evidence of slowness.
- Keep the current simple model until real performance pressure appears.

## Future Scalability

Proceed cautiously:

- First add financial/decision engine tests.
- Then extract dashboard panels from `Dashboard.tsx` only when implementing focused behavior.
- Keep engine outputs as the single contract for dashboard intelligence.
- Before Supabase/auth, define server data ownership, migration, export, and offline strategy.

## Recommended Architecture Improvements

| ID | Recommendation | Rationale | Timing |
| --- | --- | --- | --- |
| ARCH-DASH-001 | Extract inline dashboard panels into `src/components/dashboard/` | Reduces `Dashboard.tsx` size without changing behavior | After tests |
| ARCH-DASH-002 | Create shared alert/bill normalization helpers for engines | Reduces duplicated calculation paths | High priority |
| ARCH-DASH-003 | Consolidate dashboard `cardFor()` and module summary maps into a documented summary contract | Avoids divergent labels/values across Dashboard and modules | Medium priority |
| ARCH-DASH-004 | Add explicit analytics data contract before changing Cash Flow/Statistics charts | Prevents synthetic visuals from becoming misleading | Medium priority |
| ARCH-DASH-005 | Document inactive `routers.ts` in code or move later with approval | Reduces backend architecture confusion | Low priority |

