# Financial Core Audit

Sprint: 1.2 - Financial Core Consolidation

Date: 2026-07-04

## Scope

This audit inventories financial and finance-adjacent calculations in the current VCC-OS repository snapshot. The sprint intentionally excludes dashboard redesigns, new workflows, new user-facing features, and risky behavior changes.

## Executive Summary

Financial values do not yet originate from one authoritative source. Calculations currently exist in three places:

- Pure helper files: `calculations.ts`, `vehicleCalculations.ts`.
- Data access helpers: `db.ts`.
- UI components/pages: dashboard cards and module pages with local sample state or fallback values.

The current repository shape is also not build-ready: no `package.json`, TypeScript config, test config, lockfile, or full imported source tree is present. Because of that, broad implementation consolidation is too risky for Sprint 1.2. The safe ABI outcome is to define the Financial Engine direction, document duplicates, and defer behavior-changing refactors until the repository can run validation reliably.

## Calculation Inventory

| Area | File | Function / Location | Purpose | Inputs | Outputs | Dependencies |
| --- | --- | --- | --- | --- | --- | --- |
| Bills | `calculations.ts` | `calculateTotalBillsThisMonth` | Sum bills due in the current month. | `Bill[]`, current date | String fixed to 2 decimals | `Bill`, `Date`, `parseFloat`, `toFixed` |
| Bills | `calculations.ts` | `calculateBillsDueInDays` | Return pending bills due between today and a future date. | `Bill[]`, day window, current date | `Bill[]` | `Bill`, `Date` |
| Bills | `calculations.ts` | `calculateOverdueBills` | Return pending bills due before today. | `Bill[]`, current date | `Bill[]` | `Bill`, `Date` |
| Bills | `calculations.ts` | `calculatePaidThisMonth` | Sum paid bills with `lastPaidDate` in the current month. | `Bill[]`, current date | String fixed to 2 decimals | `Bill`, `Date`, `parseFloat`, `toFixed` |
| Bills | `calculations.ts` | `getNextDueDate` | Find earliest pending bill due date. | `Bill[]` | `Date \| null` | `Bill`, `Date`, array sort |
| Bills | `db.ts` | `getUpcomingBills` | Fetch bills, filter/sort upcoming bills. | `userId`, `days`, DB rows, current date | Bill rows | Drizzle DB, `bills`, `Date` |
| Bills | `db.ts` | `getOverdueBills` | Fetch pending bills, filter/sort overdue bills. | `userId`, DB rows, current date | Bill rows | Drizzle DB, `bills`, `Date` |
| Bills | `BillsPage.tsx` | `upcomingBills` | Count local pending bills due within 7 days. | Local `bills`, current date | `Bill[]` | React state, `Date` |
| Bills | `BillsPage.tsx` | `overdueBills` | Count local bills whose status is already `overdue`. | Local `bills` | `Bill[]` | React state |
| Bills | `BillsPage.tsx` | `paidThisMonth` | Count paid local bills whose due date is this month. | Local `bills`, current date | `Bill[]` | React state, `Date` |
| Bills | `BillsPage.tsx` | `allUpcoming` | Count pending local bills after now. | Local `bills`, current date | `Bill[]` | React state, `Date` |
| Bills | `BillsPage.tsx` | `totalDue` | Sum local pending and overdue bill amounts. | Local `bills` | Number | React state, `reduce` |
| Bills | `BillsCard.tsx` | fallback `billsData` | Display overdue/upcoming/total due when no props are provided. | Optional card props | Rendered values | Hard-coded fallback |
| Bills | `BillForm.tsx` | amount parsing | Convert amount input to number. | Input string | Number | `parseFloat`, React state |
| Debt | `db.ts` | `getTotalDebt` | Sum active debt current balances from DB rows. | `userId`, DB rows | String fixed to 2 decimals | Drizzle DB, `debt`, `parseFloat` |
| Debt | `DebtPage.tsx` | `totalDebt` | Sum local debt balances. | Local `debts` | Number | React state, `reduce` |
| Debt | `DebtPage.tsx` | `monthlyPayment` | Sum local minimum payments. | Local `debts` | Number | React state, `reduce` |
| Debt | `DebtPage.tsx` | `activeDebts` | Count local active debts. | Local `debts` | Number | React state, `filter` |
| Debt | `DebtPage.tsx` | `averageInterestRate` | Average local debt interest rates. | Local `debts` | Number | React state, `reduce` |
| Debt | `DebtPage.tsx` | `sortedByInterest` | Produce avalanche payoff order. | Local `debts` | `Debt[]` | React state, array sort |
| Debt | `DebtCard.tsx` | fallback `debtData` | Display total debt, active debts, payment required, average rate. | Optional card props | Rendered values | Hard-coded fallback |
| Vehicle Debt | `vehicleCalculations.ts` | `calculatePayoffProgress` | Calculate payoff percentage from current and original balance. | `currentBalance`, `originalBalance` | Number 0-100 | Math clamp |
| Vehicle Debt | `vehicleCalculations.ts` | `calculatePayoffEstimate` | Estimate payoff weeks/date from weekly payment and interest. | Balance, weekly payment, interest rate | `{ weeks, estimatedDate }` | `Date`, iterative interest model |
| Vehicle Debt | `vehicleCalculations.ts` | `calculateDaysUntilDue` | Calculate days until next payment due. | `Date \| undefined`, current date | Number | `Date`, `Math.ceil` |
| Vehicle Debt | `vehicleCalculations.ts` | `getPaymentStatus` | Classify vehicle payment as overdue, due soon, or on track. | Due date | Status string | `calculateDaysUntilDue` |
| Vehicle Debt | `vehicleCalculations.ts` | `calculateTotalInterestPaid` | Estimate total interest through payoff. | Original balance, current balance, weekly payment, rate | Number | `calculatePayoffEstimate` |
| Vehicle Debt | `vehicleCalculations.ts` | `calculateMonthlyEquivalent` | Convert weekly payment to monthly equivalent. | Weekly payment | Number | `52 / 12` assumption |
| Vehicle Debt | `vehicleCalculations.ts` | `calculateAnnualPayment` | Convert weekly payment to annual payment. | Weekly payment | Number | `52` weeks |
| Vehicle Debt | `vehicleCalculations.ts` | `getVehicleDebtSummary` | Aggregate vehicle debt summary for UI/router consumption. | `Debt` | Summary object or `null` | Other vehicle helpers |
| Vehicle Debt | `VehicleDebtTracker.tsx` | derived displays | Display payoff years and days away. | Tracker values, current date | Rendered strings | tRPC data, `Date`, `format` |
| Savings | `SavingsPage.tsx` | `totalSavings` | Sum local goal current amounts. | Local `goals` | Number | React state, `reduce` |
| Savings | `SavingsPage.tsx` | `totalGoalAmount` | Sum local goal targets. | Local `goals` | Number | React state, `reduce` |
| Savings | `SavingsPage.tsx` | `savingsPercentage` | Calculate total saved divided by total goals. | `totalSavings`, `totalGoalAmount` | Number | Local summaries |
| Savings | `SavingsPage.tsx` | per-goal `percentage` | Calculate per-goal completion. | Current amount, goal amount | Number | React render calculation |
| Savings | `SavingsPage.tsx` | per-goal `remaining` | Calculate amount remaining. | Goal amount, current amount | Number | React render calculation |
| Savings | `SavingsPage.tsx` | `getProgressColor` | Classify savings progress visually. | Percentage | CSS class | UI-only rule |
| Savings | `SavingsCard.tsx` | fallback `savingsData` | Display total savings, goal amount, progress, contribution. | Optional card props | Rendered values | Hard-coded fallback |
| Money Snapshot | `Dashboard.tsx` | `mockMoneySnapshot` | Hard-coded total assets, liabilities, net worth, income, expenses, net, allocation percentages. | None | Dashboard fallback object | Local mock data |
| Money Snapshot | `data.ts` | `sampleMoneySnapshot` | Duplicate hard-coded money snapshot sample. | None | Sample object | Local sample data |
| Money Snapshot | `MoneySnapshotCard.tsx` | render-only metrics | Displays snapshot values and allocation percentages. | Snapshot props | Rendered values | No calculation except width percentages |
| Buy Next | `BuyNextCard.tsx` | `criticalCount` | Count critical restock items. | `BuyItem[]` | Number | Card props, `filter` |
| Buy Next | `BuyNextCard.tsx` | estimated total | Sum parsed item estimated costs. | `estimatedCost` strings | String fixed to 2 decimals | `parseFloat`, `replace`, `reduce` |
| Buy Next | `data.ts` | `sampleBuyNext` | Hard-coded estimated item costs and priorities. | None | Sample list | Local sample data |
| Priority Alerts | `Dashboard.tsx` | `mockPriorityAlerts` | Hard-coded financial alert messages. | None | Alert list | Local mock data |
| Priority Alerts | `data.ts` | `samplePriorityAlerts` | Duplicate hard-coded alert messages. | None | Sample list | Local sample data |
| Goal Progress | `Dashboard.tsx` | `mockGoalProgress` | Hard-coded financial and non-financial goal progress. | None | Goal list | Local mock data |
| Goal Progress | `data.ts` | `sampleGoalProgress` | Duplicate hard-coded goal progress. | None | Sample list | Local sample data |
| Goal Progress | `GoalProgressCard.tsx` | render-only progress | Displays provided goal percentages and widths. | Goal props | Rendered values | No source calculation |
| Cash Flow | `data.ts` | `sampleCashFlow` | Hard-coded income, expenses, and net by month. | None | Sample list | Local sample data |
| Transactions | `db.ts` | `getTransactionsByUser` | Fetch and optionally filter/sort transactions by date range. | `userId`, optional dates | Transaction rows | Drizzle DB, `Date` |
| Transactions | `db.ts` | `getTotalIncome` | Sum income transactions in date range. | `userId`, start, end, DB rows | String fixed to 2 decimals | Drizzle DB, `transactions` |
| Transactions | `db.ts` | `getTotalExpense` | Sum expense transactions in date range. | `userId`, start, end, DB rows | String fixed to 2 decimals | Drizzle DB, `transactions` |
| Daily Mission | `TodaysMissionCard.tsx` | `completed`, `progress` | Count completed missions and calculate progress percentage. | Mission props/state | Numbers | React state, `filter`, `Math.round` |
| Reports / Analytics | `data.ts` | `sampleCashFlow` and dashboard samples | Placeholder analytic values only. | None | Sample values | No report engine found |
| Decision Engine | `PriorityAlertsCard.tsx`, `BuyNextCard.tsx`, `GoalProgressCard.tsx` | UI display rules | Display precomputed decisions, counts, and totals. | Props | Rendered values | No central decision engine found |

## Duplicate Calculations

| Value | Duplicate Locations | Risk | Recommendation |
| --- | --- | --- | --- |
| Upcoming bills | `calculations.ts`, `db.ts`, `BillsPage.tsx`, `BillsCard.tsx` fallback | Dashboard, page, and server can disagree. | Move date-window bill logic into Financial Engine; pages/cards consume summary. |
| Overdue bills | `calculations.ts`, `db.ts`, `BillsPage.tsx`, `BillsCard.tsx` fallback | `BillsPage.tsx` trusts status only while helper calculates from dates. | Financial Engine should define overdue as date/status invariant. |
| Total bill pressure / total due | `BillsPage.tsx`, `BillsCard.tsx` fallback, `calculations.ts` monthly total | Different definitions: total due vs this month. | Use named outputs: `totalDueNow`, `totalDueThisMonth`, `totalDueNext7Days`. |
| Debt totals | `db.ts`, `DebtPage.tsx`, `DebtCard.tsx` fallback | DB uses active debts and string balances; UI uses local numeric all debts. | Financial Engine should normalize debt rows and expose one debt summary. |
| Debt payment totals | `DebtPage.tsx`, `DebtCard.tsx` fallback | Local values can diverge from card values. | Add `debt.minimumPaymentTotal` to Financial Engine. |
| Average interest rate | `DebtPage.tsx`, `DebtCard.tsx` fallback | No weighted/unweighted definition is documented. | Financial Engine should define rate methodology explicitly. |
| Goal/savings totals | `SavingsPage.tsx`, `SavingsCard.tsx` fallback, dashboard goal samples | Dashboard and page use different numbers. | Financial Engine should expose savings summary and per-goal progress. |
| Goal progress | `SavingsPage.tsx`, `GoalProgressCard.tsx`, `data.ts`, `Dashboard.tsx` | Percentages can be stale or inconsistent. | Calculate percentages from source amounts in the engine. |
| Money snapshot | `Dashboard.tsx`, `data.ts`, `MoneySnapshotCard.tsx` props | Net worth and monthly net are static fallbacks, not derived from modules. | Financial Engine should compute assets, liabilities, income, expenses, net worth, and safe-to-spend. |
| Cash flow | `db.ts` transaction totals, `data.ts` sample cash flow | Live transaction totals and sample charts can disagree. | Financial Engine should compute period cash flow from transactions. |
| Buy Next estimated total | `BuyNextCard.tsx`, `data.ts` sample costs | Parsing formatted strings risks currency errors. | Engine should store numeric costs and format at UI boundary. |
| Priority alerts | `Dashboard.tsx`, `data.ts`, card display | Alerts are hard-coded and not tied to authoritative signals. | Decision Engine should consume Financial Engine outputs. |

## Missing Or Not Found

- No single Financial Engine module exists.
- No reports module exists in this snapshot.
- No analytics module exists beyond sample data.
- No full goals module exists beyond dashboard card/sample/schema references.
- No cash-flow UI module exists.
- No build/test manifest exists, preventing repeatable validation.
- Several imports reference missing paths, so implementation refactor cannot be safely verified.

## Recommended Consolidation

Create a Financial Engine with pure, tested functions first, then a server adapter:

```text
Financial Engine
  normalize inputs
  calculate bills, debts, savings, goals, cash flow, money snapshot
  return typed summaries and decision signals

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

Initial engine outputs should include:

- `moneySnapshot`: assets, liabilities, net worth, monthly income, monthly expenses, monthly net, safe-to-spend.
- `billSummary`: overdue, due next 7 days, due this month, total due now, next due date.
- `debtSummary`: active debt count, total active debt, minimum monthly payments, average interest rate, strategy order.
- `savingsSummary`: total saved, total target, percentage complete, remaining amount, required contribution.
- `cashFlowSummary`: income, expenses, net by period.
- `buyNextSummary`: critical count, estimated total, ordered recommendations.
- `alerts`: deterministic signals based on engine thresholds.

## Safe Refactor Decision

No broad code refactor was performed in Sprint 1.2. The risk is not the helper extraction itself; the risk is that the current snapshot cannot be built or type-checked, and several test files already reference calculations that are not present in the flat export. A behavior-preserving refactor must wait until repository restoration is complete.

Low-risk next code step after restoration:

1. Create pure summary helpers with existing page formulas copied exactly.
2. Add deterministic tests for current outputs.
3. Replace UI-local formulas one module at a time.
4. Preserve current formatting and rendered values.

