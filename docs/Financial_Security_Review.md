# Financial Security Review

## 2026-07-17 — Car Loan Evidence Controls

- Full VIN, buyer address, and phone number are not included in normal views or structured seed data.
- Source receipt photographs are not shipped in the public Vercel bundle.
- New user attachments are kept in the browser's private IndexedDB store and referenced by opaque IDs.
- Confirmed receipts cannot be directly edited; corrections create revisions and confirmed revisions supersede prior records.
- Supabase was not adopted while authentication and RLS remain unavailable in the app. A future migration must use private Storage and user-owned RLS policies before any evidence is uploaded.

Sprint: 1.2 - Financial Core Consolidation

Date: 2026-07-04

## Summary

No code paths were changed in Sprint 1.2, so no new financial-data exposure was introduced. The review found that current risk is architectural: financial calculations and sample values are spread across UI components, database helpers, and mock data, while auth/server infrastructure is incomplete in this repository snapshot.

## Findings

| Area | Finding | Risk | Recommendation |
| --- | --- | --- | --- |
| Client-side calculations | Bills, Debt, Savings, Buy Next, mission progress, and dashboard display values are calculated or hard-coded in client components. | Client-side calculations can drift from protected server data and may expose derived financial summaries in the UI bundle or browser state. | Move authoritative calculations to the Financial Engine and expose only user-authorized summaries. |
| Mock financial data | Dashboard and `data.ts` contain hard-coded financial sample values. | Mock values can be mistaken for live values and can hide integration failures. | Clearly separate demo data from live data and prevent demo values from entering production financial decisions. |
| Protected data boundaries | `routers.ts` and `bills.ts` reference protected procedures, cookies, and DB helpers from missing paths. | User data isolation cannot be verified in this snapshot. | Restore auth/core modules and add authorization tests before live financial data is trusted. |
| Database security | No Supabase client or RLS policies were found; current DB helpers use Drizzle/MySQL-style access. | If moved to Supabase later, tables could be exposed without RLS if not planned first. | Decide the database platform and require row-level authorization policies or equivalent server-side checks. |
| Future AI/automation | AI briefing cache exists conceptually, but no central financial signal contract exists yet. | AI or automation could consume raw, duplicated, or stale financial data. | Future AI and automation must consume Financial Engine outputs with explicit source traces. |

## Security Decision

Financial calculations should move toward a server-authoritative Financial Engine. Client components should be treated as presentation surfaces: they may format values, but should not be the source of financial truth.

## Follow-Up Controls

- Add authorization tests for every financial summary endpoint.
- Add tests proving one user cannot access another user's bills, debts, savings, goals, transactions, alerts, or engine summaries.
- Avoid exposing raw transaction/debt data to future AI unless a specific feature requires it.
- Keep financial logs free of personally identifying financial values.
- Document demo mode versus live mode before deployment.

