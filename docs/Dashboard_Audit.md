# Dashboard Audit

## Scope

Sprint 1.1 inspected the current Dashboard as an intelligence hub. No implementation, UI redesign, financial logic change, or feature addition was made.

## Dashboard Role

The Dashboard currently remains an intelligence hub. It renders derived status, priorities, and navigation into source modules. It does not expose spreadsheet editing controls on the dashboard itself. Data entry occurs through dedicated module pages and Settings.

## Dashboard Section Inventory

| Section/Card | Purpose | Current Functionality | Data Source | Dependencies | Navigation | Editability |
| --- | --- | --- | --- | --- | --- | --- |
| Topbar | Mobile/current view context and mobile menu access | Shows current page label and mobile navigation menu | `view`, `sections` | `Topbar`, `AppView`, `Section[]` | Opens Dashboard, sections, Settings | Read-only navigation |
| Shell Sidebar | Primary app navigation | Lists Dashboard, all editable sections except alerts, and Settings | `sections`, `view` | `ShellSidebar`, `sideIcon`, `open()` | Opens selected view/hash route | Read-only navigation |
| Dashboard Top Row | Page identity and utility context | Shows command-center title, search placeholder, alert count, local-mode user pill | `alerts.length` from `decision.missionStack` | `DashboardTopRow` | None | Read-only |
| Daily Briefing / Hero | Highest-priority action summary | Shows top alert title/action or clear-state message | `topAlert = decision.missionStack[0]` | `BriefingCard`, `Alert` | Opens top alert source or Missions | Read-only |
| Spendable Metric | Fast cash safety read | Shows Spendable Cash, Ready/Blocked status, and Operating Cash | `metrics.spendableCash`, `metrics.operatingCash` | `MetricsGrid`, `money()` | Money Snapshot | Read-only |
| Protected Metric | Savings protection proof | Shows protected savings amount | `metrics.protectedSavings` | `MetricsGrid`, `ProofCard` | Savings | Read-only |
| Alerts Metric | Count of active blockers | Shows active alert count and clear/action state | `decision.missionStack.length` | `MetricsGrid`, `ProofCard` | Alerts page | Read-only |
| Debt Progress Panel | Debt pressure visualization | Shows total debt, payment pressure, borrowed money | `metrics.totalDebtBalance`, `metrics.debtPressure`, `metrics.borrowedMoney` | Inline `DebtProgressPanel`, `ProgressLine` | Debt | Read-only |
| Cash Flow Panel | Transaction net snapshot | Shows transaction net and decorative month chart | `metrics.transactionNet` | Inline `CashFlowPanel`, `money()` | Transactions | Read-only |
| Weekly Statistics Panel | Compact cross-domain activity snapshot | Shows synthetic bars from income, bills, debt, savings, transaction, spendable, withdrawal values | `metrics.weeklyIncome`, `billsPressure`, `debtPressure`, `protectedSavings`, `transactionNet`, `spendableCash`, `allowedWithdrawal` | Inline `WeeklyStatsPanel` | Money Snapshot | Read-only |
| Transactions Preview Panel | Table-style status summary | Shows Spendable Cash, Bills Pressure, and Buy Next status rows under a Transactions label | `metrics.spendableCash`, `metrics.billsPressure`, `metrics.buyNext`, `metrics.criticalInventory`, `metrics.overdueBills` | Inline `TransactionsPreviewPanel` | Transactions | Read-only |
| Balance Panel | Total visible cash-style balance | Shows operating cash plus savings vault | `metrics.operatingCash + metrics.savingsVault` | Inline `BalancePanel`, `money()` | Money Snapshot | Read-only |
| Allocation Panel | Pressure breakdown | Shows total pressure, bills pressure, debt pressure, borrowed money | `metrics.totalPressure`, `billsPressure`, `debtPressure`, `borrowedMoney` | Inline `AllocationPanel` | Money Snapshot | Read-only |
| Recommended Move | Decision engine action | Shows title, why, do first, do not do, checkpoint | `decision.recommendedMove` | `RecommendedMoveCard`, `computeDecisionEngine()` | Recommended move source section | Read-only |
| Module Dock | Quick access and per-module summary cards | Shows cards for Bills, Budget, Debt, Savings, Inventory, Buy Next, Activity, Goals, Transactions | `sections`, `metrics`, `alerts`, `cardFor()` | Inline `ModuleDock`, `cardFor()` | Source module page | Read-only navigation |
| Objective Stack | Ordered active blockers | Shows up to 7 sorted alerts with level, source, title, and proof | `decision.missionStack` | `ObjectiveStack`, `labelFor()` | Alert source section | Read-only |
| Alerts Page | Dedicated alert inspection | Shows all priority alerts or clear state | `decision.priorityAlerts` | `AlertsPage`, `PriorityAlerts` | Source section per alert | Read-only |
| Settings Page | App/storage controls | Shows storage, version, app info, validation, diagnostics, reset/export/import/cache controls | `sections`, `metrics`, localStorage/sessionStorage | `SettingsPage`, `normalizeSections()` | Back to Dashboard | Settings controls only |

## Financial Value Audit

| Displayed Value | Dashboard Location | Current Source | Notes |
| --- | --- | --- | --- |
| Spendable Cash | MetricsGrid, Transactions Preview, Module Dock, Settings, module summaries | `computeFinancialState().metrics.spendableCash` | Single metric source. |
| Operating Cash | MetricsGrid, Money module summary, Balance Panel | `metrics.operatingCash` | Single metric source. |
| Protected Savings | MetricsGrid, Savings/Goals module summaries, Weekly Statistics | `metrics.protectedSavings` | Single metric source. |
| Alert Count | DashboardTopRow, MetricsGrid | `decision.missionStack.length` / `alerts.length` | Same array currently passed as `alerts`; naming can be clearer. |
| Debt Balance | Debt Progress Panel, Module Dock, Debt summary | `metrics.totalDebtBalance` | Single metric source. |
| Debt Payment Pressure | Debt Progress, Allocation, Module Dock, summaries | `metrics.debtPressure` | Single metric source. |
| Borrowed Money | Debt Progress, Allocation, Money module summary | `metrics.borrowedMoney` | Single metric source. |
| Cash Flow / Transaction Net | Cash Flow Panel, Transactions Preview, Module Dock, summaries | `metrics.transactionNet` | Single metric source; chart is decorative rather than historical. |
| Bills Pressure | Transactions Preview, Allocation, Module Dock, Bills summary | `metrics.billsPressure` | Single metric source. |
| Overdue Bills | Transactions Preview status, Module Dock, Bills summary | `metrics.overdueBills` | Single metric source. |
| Savings Vault | Balance Panel, Savings module summary, Settings detail | `metrics.savingsVault` | Single metric source. |
| Total Pressure | Allocation Panel | `metrics.totalPressure` | Single metric source. |
| Buy Next | Transactions Preview, Module Dock, Inventory/Buy Next summaries, Recommended Move | `metrics.buyNext`, `financialState.inventory.buyNextItems` | Source is split between inventory-derived rows and manual Buy Next rows inside `computeFinancialState()`. |
| Goal Progress | Module Dock, Goals summary, decision alert | `metrics.avgGoalProgress`, `financialState.goals.goalProgress` | Both derive from the same engine function. |

## Single Source Of Truth Findings

- Authoritative runtime data source is `sections`, loaded by `loadSections()` and saved by `saveSections()`.
- Authoritative financial derivation is `computeFinancialState(sections)`.
- Authoritative recommendation/alert derivation is `computeDecisionEngine(financial, sections)`.
- Dashboard cards mostly consume `metrics` or `decision` and do not directly recalculate domain totals.
- The main duplicated derivation risk is alert/bill normalization: both `financialEngine.ts` and `decisionEngine.ts` normalize bill rows independently.
- Inventory Buy Next is derived in `financialEngine.ts` while alert generation re-runs `getInventoryBuyNextRows()` in `decisionEngine.ts`.
- Dashboard decorative charts in Cash Flow and Weekly Statistics use generated/static bar heights, not real history. They should be labeled or revised in a future implementation to avoid implying true historical analytics.

## UX Review

### Desktop

Strengths:

- Dense command-center layout with immediate top alert, metrics, recommended move, module dock, and objective stack.
- Most cards navigate to their source modules.
- Visual hierarchy makes Spendable, alerts, and recommended move prominent.

Concerns:

- Several widgets repeat the same pressure story: Transactions Preview, Allocation, Module Dock, and Objective Stack all surface overlapping bills/debt/buy-next signals.
- `TransactionsPreviewPanel` is labeled "Transactions" but includes Money, Bills, and Inventory summaries; this may confuse click expectations.
- `BalancePanel` label "Card Balance" is generic and may imply a bank/card balance rather than operating cash plus savings vault.
- Search input is read-only and may look functional.
- Cash Flow and Weekly Statistics charts are not true historical analytics.

### Mobile

Strengths:

- Mobile bottom navigation is preserved.
- Dashboard cards stack into a scannable flow.

Concerns:

- Dashboard has many dense widgets; mobile click depth is good, but information density may overwhelm.
- Some card text can become long because recommendations and alerts are content-heavy.
- Mobile users may need a clearer top "what to do next" path if many alert cards appear.

## Missing Intelligence

- No explicit "last updated" timestamp for localStorage data.
- No stale-data warning when critical sections are blank or old.
- No confidence indicator for whether core financial inputs are complete.
- No quick distinction between "cash missing" and "cash safe".
- No separate historical trend source for cash flow/statistics.

## Duplicate Or Overlapping Widgets

- Objective Stack and Alerts metric/Alerts page overlap by design, but need clear roles: count vs inspection vs prioritized list.
- Allocation Panel and Module Dock pressure cards repeat bills/debt pressure.
- Transactions Preview is a multi-domain status table rather than transaction-only preview.

## Audit Conclusion

The Dashboard currently satisfies the product rule: it is read-only and intelligence-focused. The next implementation sprint should consolidate duplicated derivations in engine helpers, clarify widget semantics, and add test coverage before adding any new dashboard features.

