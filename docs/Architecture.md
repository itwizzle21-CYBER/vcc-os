# Architecture

Updated 2026-09-12. The original flat-export/tRPC/MySQL baseline is historical and superseded by the current implementation below.

## Runtime and routing

VCC-OS is a React 18 + TypeScript application built as static Vite assets. `main.tsx` loads financial data and mounts `src/App.tsx`; the app resolves the current pathname to modules. Vercel serves the static output with SPA rewrites and security headers declared in `vercel.json`. No application API server, tRPC runtime, or payment-transfer backend was found in the current product source.

## Data ownership

Canonical domain engines under `src/lib/engine` calculate financial summaries and apply financial events. Modules edit shared AppData; App normalizes, saves, and recomputes derived state.

The complete local workspace is stored in origin-local localStorage (`vcc-os:data:v2`, schema version 5), with three quota-aware recovery points. Evidence attachment blobs are stored separately in IndexedDB (`vcc-os-private-evidence`). Local workspace/recovery keys are not partitioned by Supabase user. Signing out retains local finances.

Portable JSON exports include workspace data and preferences, but not IndexedDB attachment blobs. Cross-device attachment recovery requires a separate workflow.

## Optional Supabase synchronization

Build-time VITE Supabase URL/publishable-key configuration enables browser OTP sign-in and owner-scoped synchronization. App snapshots, receipt rows, and predecessor history have owner RLS declarations in repository migrations. Client optimistic revision checks and three-way field merging coordinate same-account devices. Live migration and policy enforcement must be verified separately.

VitaScan performs OCR through a bundled Tesseract worker and same-origin English language model. Cloud receipt sync sends structured reviewed fields and formatted OCR archive text, including `raw_text`; inspected image/evidence blobs stay on-device.

## Known architectural gaps

The generic field merge can retain two bill payments while losing one shared-account deduction. Reports still implement some calculations in UI code and have calendar/bucket errors. URL session detection and automatic initial workspace upload lack account-attachment confirmation. Actual verified loan reference records remain reachable in public runtime assets. These are unresolved release blockers documented in [readiness audit](VCC_READINESS_AUDIT_2026-09-12.md).

Build/lint/typecheck/unit and Playwright tooling work. Current operational evidence supersedes historical missing-manifest, missing-origin, and missing-Vercel-link statements. The sections below describe implemented financial and evidence models; their presence does not certify correctness or privacy.

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

## Car Loan Evidence Model (2026-07-17)

The active Vite application stores a typed `carLoan` aggregate in the existing versioned browser data model:

- `contract`: immutable verified legal and scheduled terms.
- `receipts`: actual payment evidence with status, revision, and supersession metadata.
- `communications`: dealer messages that remain separate from receipts and may be flagged as conflicting.
- `schedule`: original amortization rows used only for comparison.

Confirmed receipts are normalized into Transactions by `carLoanEngine.ts`. Money Snapshot and Dashboard consume those normalized transactions and Financial Engine summaries. Official payoff and dealer account balance remain distinct.

Evidence attachments are stored locally in IndexedDB, not bundled into public application assets or stored as oversized base64 values in localStorage. The supplied private images were used to verify structured seed records but are not part of the deployed bundle.

Supabase remains a target architecture rather than active application persistence. The connected `vcc-os-production` project was inactive during this sprint and timed out during schema inspection. No production database migration was attempted. Moving this evidence ledger to Supabase requires authenticated users, private Storage, RLS ownership policies, migration tests, and a verified rollback before cutover.

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
