# VCC-OS Master PRD

## Product Vision

VCC-OS, the Vitality Command Center, is a personal operating system that helps the user decide what to do next. It is not primarily a budgeting app. It is a calm, decision-focused command center for money, bills, debt, savings, inventory, goals, trading rules, and daily execution.

## Core Questions

- What do I need to do today?
- What needs attention next?
- How much money do I actually have?
- What should I buy next?
- Am I moving closer to my goals?

## Primary User Experience

The default landing experience is a CEO-style dashboard showing the most important life-operation signals within seconds:

- Daily Briefing
- Today's Mission
- Money Snapshot
- Priority Alerts
- Buy Next
- Goal Progress
- Quick-access module cards

## Product Principles

- Reduce stress by making the next action obvious.
- Prefer actionable summaries over raw spreadsheets.
- Keep financial decisions conservative and auditable.
- Use dedicated modules for editing and dashboard cards for command-center summaries.
- Preserve mobile-first readability and fast scanning.

## Current Feature Inventory

| ID | Feature | Status | Notes |
| --- | --- | --- | --- |
| DASH-001 | CEO Dashboard | In Progress | Implemented as `Dashboard.tsx` with tRPC queries and mock fallback data. |
| DASH-002 | Daily Briefing | In Progress | UI exists; AI/backing data path is not fully present in this repo snapshot. |
| DASH-003 | Today's Mission | In Progress | Dashboard card exists. Persistence path needs verification. |
| FIN-001 | Money Snapshot | In Progress | Dashboard card exists with mock fallback data. |
| BILL-001 | Bills Module | In Progress | UI, router, db helpers, calculations, and tests exist, but paths are inconsistent in this snapshot. |
| DEBT-001 | Debt Module | In Progress | UI and database helpers exist; vehicle debt logic needs schema alignment. |
| SAV-001 | Savings Module | In Progress | UI, db helpers, and tests exist. |
| INV-001 | Inventory Module | In Progress | UI, calculations, db helpers, and tests exist. |
| BUY-001 | Buy Next | In Progress | Dashboard card and inventory-driven UI concept exist. |
| GOAL-001 | Goals | In Progress | Dashboard card and schema table exist. |
| TRADE-001 | Trading Command Center | Planned | Schema table exists; no full routed UI in this snapshot. |
| AI-001 | AI Command Center | Planned | AI briefing cache table exists; implementation is incomplete in this snapshot. |
| AUTH-001 | Authentication | Needs Review | Router references session cookies and protected procedures from missing `_core` files. |
| SEC-001 | RLS Policies | Needs Review | No Supabase RLS policies found; current migration is MySQL/Drizzle oriented. |
| OFF-001 | Offline Cache | Planned | No localStorage/offline cache implementation found in this snapshot. |
| GOV-001 | Documentation Governance | Complete | Sprint 0 establishes `/docs` as source of truth. |
| FIN-CORE-001 | Financial Engine | Accepted | Sprint 1.2 ADR requires financial values to originate from one Financial Engine whenever practical. Implementation is pending repository restoration and validation. |

## Non-Goals For Sprint 0

- No UI redesign.
- No financial logic changes.
- No new features.
- No migrations or schema changes.
- No removal of working functionality.

## Financial Core Requirements

- Financial values must be auditable and traceable to a single authoritative engine whenever practical.
- Money Snapshot, Dashboard, Bills, Debt, Savings, Goals, Cash Flow, Decision Engine, Reports, Analytics, future AI, and future automation should consume the same source of truth.
- UI components may format values, but should not own financial business calculations after consolidation.
- Mock/demo values must be clearly separated from live financial values.
- Financial calculation changes require deterministic tests and QA evidence.
