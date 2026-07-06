# VCC-OS Master PRD

## Product Vision

VCC-OS, the Vitality Command Center, is a local-first personal operating system for answering what needs attention next. It is not primarily a budgeting app; it is a calm command center for money, bills, debt, savings, inventory, goals, missions, activity, and daily operating decisions.

## Core Questions

- What do I need to do today?
- What needs attention next?
- How much money do I actually have?
- What should I buy next?
- Am I moving closer to my goals?

## Product Principles

- Dashboard stays read-only and intelligence-focused.
- Dedicated module pages handle editing.
- Preserve mobile polish.
- Preserve the current premium finance-command-center baseline.
- Financial outputs must be conservative, transparent, and testable.
- Documentation in `/docs` and `WORKFLOW/` must stay current before feature expansion.

## Foundation Baseline

Target baseline tag: `v0.1.0-foundation`.

Status: Pending.

Sprint 0 documentation is present and Sprint 0.5 validation passed build, lint, TypeScript check, and production smoke. The official recoverable baseline is not complete until the documentation commit, tag, push, deployment, and post-deploy smoke are completed from an unrestricted Git environment.

## Current Feature Inventory

| ID | Feature | Status | Notes |
| --- | --- | --- | --- |
| DASH-001 | Dashboard command center | In Progress | Active first screen with briefing, metrics, alerts, recommendations, module dock, and objective stack. |
| NAV-001 | Desktop sidebar navigation | In Progress | Active tab navigation across dashboard and modules. Recent work tightened fit. |
| NAV-002 | Mobile bottom navigation/topbar | In Progress | Active mobile shell; preserve during layout work. |
| NAV-003 | Hash-routed pages | In Progress | `Dashboard.tsx` maps views to hash routes such as `#/settings`. |
| FIN-001 | Money Snapshot | In Progress | Editable dedicated module with derived dashboard metrics. |
| FIN-002 | Budget | In Progress | Section-backed editable module. |
| TXN-001 | Transactions | In Progress | Section-backed transaction tracking and dashboard preview. |
| BILL-001 | Bills | In Progress | Editable bills section with priority and auto-alert derivation. |
| DEBT-001 | Debt | In Progress | Editable debt section and dashboard pressure metrics. |
| INV-001 | Inventory | In Progress | Editable inventory section with auto category/alert support. |
| INV-002 | Buy Next | In Progress | Section-backed next-purchase planning plus decision-engine signals. |
| FIN-003 | Protected Savings Vault | In Progress | Protected/flexible savings tracking and dashboard metrics. |
| GOAL-001 | Goals | In Progress | Editable goals section and progress metrics. |
| AUTO-001 | Missions | In Progress | Editable daily mission section. |
| AUTO-002 | Activity | In Progress | Editable activity log section. |
| AI-001 | Decision Engine | In Progress | Deterministic engine produces recommended move, alerts, statuses, and mission stack. |
| DASH-101 | Dashboard consistency tests | Planned | Sprint 1.1 audit recommends financial consistency tests before dashboard implementation. |
| DASH-102 | Shared dashboard derivation contracts | Planned | Sprint 1.1 audit recommends consolidating duplicated bill and inventory derivation. |
| DASH-103 | Dashboard semantics cleanup | Planned | Sprint 1.1 audit recommends clarifying labels for synthetic or cross-domain widgets before adding new widgets. |
| UI-001 | Settings | In Progress | Data controls, storage status, diagnostics, version, validation, and placeholders. |
| BUG-001 | Git index lock blocker | Needs Review | Sandbox cannot create `.git/index.lock`; blocks commit/push/deploy from this session. |
| FUT-001 | Supabase backend | Planned | No active Supabase client or schema in current app. |
| FUT-002 | Authentication | Planned | `routers.ts` is a placeholder; no active auth in Vite app. |
| FUT-003 | Offline/cache strategy | Planned | Current persistence is browser localStorage; no service worker/offline sync. |

## Non-Goals For Sprint 0

- No feature work.
- No UI redesign.
- No financial logic changes.
- No storage migration.
- No backend or Supabase implementation.

## Sprint 1.1 Dashboard Audit Notes

Sprint 1.1 confirmed the Dashboard remains a read-only intelligence hub. The main product risk is not missing widgets; it is preserving trust by keeping dashboard values consistent with dedicated pages. Implementation should proceed only after consistency tests and shared derivation contracts are in place.
