# VCC Life Command Center - Project TODO

## Phase 1: Architecture & Design
- [x] Design modular plugin architecture
- [x] Design system and visual direction (dark mode, premium, minimal)
- [x] Database schema design (all tables and relationships)
- [x] Module registry system design
- [x] API/tRPC router structure planning
- [x] Navigation and routing structure

## Phase 2: Core Infrastructure
- [x] Create Bills table and schema
- [x] Create Debt table and schema
- [x] Create Savings table and schema
- [x] Create Inventory table and schema
- [x] Create Goals table and schema
- [x] Create Trading table and schema
- [x] Create Transactions table (for cash flow tracking)
- [x] Create AI Briefing cache table
- [x] Run database migrations
- [x] Create database query helpers in server/db.ts
- [x] Create module registry system (server/modules/registry.ts)
- [x] Create module loader (server/_core/moduleLoader.ts)
- [x] Create frontend module registry (client/src/modules/registry.ts)
- [x] Create frontend module loader (client/src/modules/loader.ts)
- [ ] Update main router to use dynamic module loading
- [ ] Update main App.tsx to use dynamic module routes

## Phase 3: Bills Module
- [x] Create server/modules/bills/schema.ts
- [x] Create server/modules/bills/db.ts
- [x] Create server/modules/bills/router.ts
- [x] Create server/modules/bills/calculations.ts
- [x] Create server/modules/bills/index.ts
- [x] Create client/src/modules/bills/pages/BillsPage.tsx
- [x] Create client/src/modules/bills/components/BillForm.tsx
- [x] Create client/src/modules/bills/components/BillsList.tsx
- [x] Create client/src/modules/bills/components/BillsCard.tsx
- [x] Create client/src/modules/bills/hooks/useBills.ts
- [x] Create client/src/modules/bills/index.ts
- [x] Write vitest tests for bills module
- [x] Integrate Bills module into dashboard
- [x] Connect Bills to Priority Alerts

## Phase 4: Debt Module
- [x] Create server/modules/debt/schema.ts
- [x] Create server/modules/debt/db.ts
- [x] Create server/modules/debt/router.ts
- [x] Create server/modules/debt/calculations.ts
- [x] Create server/modules/debt/index.ts
- [x] Create client/src/modules/debt/pages/DebtPage.tsx
- [x] Create client/src/modules/debt/components/DebtForm.tsx
- [x] Create client/src/modules/debt/components/DebtList.tsx
- [x] Create client/src/modules/debt/components/DebtCard.tsx
- [x] Create client/src/modules/debt/hooks/useDebt.ts
- [x] Create client/src/modules/debt/index.ts
- [x] Write vitest tests for debt module
- [x] Integrate Debt module into dashboard
- [x] Connect Debt to Priority Alerts
- [x] Add Vehicle Debt Tracker with payoff calculations
- [x] Add Vehicle Debt Tracker frontend component
- [x] Add Vehicle Debt Tracker to Debt page
- [x] Write Vehicle Debt Tracker vitest tests

## Phase 5: Savings Module
- [x] Create server/modules/savings/schema.ts
- [x] Create server/modules/savings/db.ts
- [x] Create server/modules/savings/router.ts
- [x] Create server/modules/savings/calculations.ts
- [x] Create server/modules/savings/index.ts
- [x] Create client/src/modules/savings/pages/SavingsPage.tsx
- [x] Create client/src/modules/savings/components/SavingsForm.tsx
- [x] Create client/src/modules/savings/components/SavingsList.tsx
- [x] Create client/src/modules/savings/components/SavingsCard.tsx
- [x] Create client/src/modules/savings/hooks/useSavings.ts
- [x] Create client/src/modules/savings/index.ts
- [x] Write vitest tests for savings module
- [x] Integrate Savings module into dashboard
- [x] Connect Savings to Goal Progress

## Phase 6: Inventory Module
- [ ] Create server/modules/inventory/schema.ts
- [ ] Create server/modules/inventory/db.ts
- [ ] Create server/modules/inventory/router.ts
- [ ] Create server/modules/inventory/calculations.ts
- [ ] Create server/modules/inventory/index.ts
- [ ] Create client/src/modules/inventory/pages/InventoryPage.tsx
- [ ] Create client/src/modules/inventory/components/InventoryForm.tsx
- [ ] Create client/src/modules/inventory/components/InventoryList.tsx
- [ ] Create client/src/modules/inventory/components/BuyNextCard.tsx
- [ ] Create client/src/modules/inventory/hooks/useInventory.ts
- [ ] Create client/src/modules/inventory/index.ts
- [ ] Write vitest tests for inventory module

## Phase 7: Goals Module
- [ ] Create server/modules/goals/schema.ts
- [ ] Create server/modules/goals/db.ts
- [ ] Create server/modules/goals/router.ts
- [ ] Create server/modules/goals/calculations.ts
- [ ] Create server/modules/goals/index.ts
- [ ] Create client/src/modules/goals/pages/GoalsPage.tsx
- [ ] Create client/src/modules/goals/components/GoalForm.tsx
- [ ] Create client/src/modules/goals/components/GoalsList.tsx
- [ ] Create client/src/modules/goals/components/GoalCard.tsx
- [ ] Create client/src/modules/goals/hooks/useGoals.ts
- [ ] Create client/src/modules/goals/index.ts
- [ ] Write vitest tests for goals module

## Phase 8: Trading Module
- [ ] Create server/modules/trading/schema.ts
- [ ] Create server/modules/trading/db.ts
- [ ] Create server/modules/trading/router.ts
- [ ] Create server/modules/trading/calculations.ts
- [ ] Create server/modules/trading/index.ts
- [ ] Create client/src/modules/trading/pages/TradingPage.tsx
- [ ] Create client/src/modules/trading/components/TradingForm.tsx
- [ ] Create client/src/modules/trading/components/TradingList.tsx
- [ ] Create client/src/modules/trading/components/TradingCard.tsx
- [ ] Create client/src/modules/trading/components/TradingAlerts.tsx
- [ ] Create client/src/modules/trading/hooks/useTrading.ts
- [ ] Create client/src/modules/trading/index.ts
- [ ] Write vitest tests for trading module

## Phase 9: Analytics Module
- [ ] Create server/modules/analytics/router.ts
- [ ] Create server/modules/analytics/calculations.ts
- [ ] Create server/modules/analytics/index.ts
- [ ] Create client/src/modules/analytics/pages/AnalyticsPage.tsx
- [ ] Create client/src/modules/analytics/components/CashFlowChart.tsx
- [ ] Create client/src/modules/analytics/components/DebtTrendChart.tsx
- [ ] Create client/src/modules/analytics/components/SavingsTrendChart.tsx
- [ ] Create client/src/modules/analytics/components/InventoryTrendChart.tsx
- [ ] Create client/src/modules/analytics/components/GoalProgressChart.tsx
- [ ] Create client/src/modules/analytics/hooks/useAnalytics.ts
- [ ] Create client/src/modules/analytics/index.ts
- [ ] Write vitest tests for analytics module

## Phase 10: CEO Dashboard
- [x] Create server/modules/dashboard/router.ts
- [x] Create client/src/pages/Dashboard.tsx
- [x] Create client/src/components/Dashboard/DailyBriefingCard.tsx
- [x] Create client/src/components/Dashboard/TodaysMissionCard.tsx
- [x] Create client/src/components/Dashboard/MoneySnapshotCard.tsx
- [x] Create client/src/components/Dashboard/PriorityAlertsCard.tsx
- [x] Create client/src/components/Dashboard/BuyNextCard.tsx
- [x] Create client/src/components/Dashboard/GoalProgressCard.tsx
- [x] Implement dashboard data aggregation from all modules
- [x] Ensure no-scroll visibility of all key widgets
- [x] Polish dark-mode UI design inspired by Notion/Linear
- [x] Set dashboard as default home page

## Phase 11: AI Command Center
- [ ] Create server/modules/ai/router.ts
- [ ] Implement daily briefing generation
- [ ] Implement weekly briefing generation
- [ ] Implement priority alerts generation
- [ ] Implement recommended actions generation
- [ ] Integrate LLM for analysis
- [ ] Cache briefings to avoid excessive API calls
- [ ] Surface all AI outputs on home dashboard

## Phase 12: Navigation & Layout
- [ ] Create DashboardLayout component
- [ ] Implement sidebar navigation
- [ ] Implement mobile-responsive navigation
- [ ] Wire all module routes
- [ ] Add user profile and logout functionality
- [ ] Create Settings page

## Phase 13: Testing & Polish
- [ ] Run all vitest tests
- [ ] Test all CRUD operations
- [ ] Test dashboard data aggregation
- [ ] Test AI briefing generation
- [ ] UI polish and refinement
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Performance optimization

## Phase 14: Documentation & Deployment
- [ ] Document module creation process
- [ ] Document API endpoints
- [ ] Document deployment process
- [ ] Create user guide
- [ ] Create final checkpoint
- [ ] Prepare project for user review
