# Dashboard Risk Assessment

## Security Review

Findings:

- Dashboard reads only browser-local section data.
- No active authentication is wired into the current Vite runtime.
- No Supabase or remote API data is displayed.
- Settings exposes storage keys and local app status, but not secret credentials.

Concerns:

- Browser-local financial data is visible to anyone with access to the browser profile.
- Future auth/Supabase assumptions should not be inferred from `routers.ts`.
- Exported backup files contain user-entered financial/life data and should be handled as sensitive.

Recommendation:

- Proceed with local-first dashboard auditing.
- Revise before backend adoption: add auth/RLS/security architecture before remote persistence.

## Financial System Review

Findings:

- Dashboard values mostly flow from `computeFinancialState()`.
- Recommended Move and alerts flow from `computeDecisionEngine()`.
- Dedicated pages use the same `metrics` object for module summaries.
- Dashboard values are read-only and navigate back to source pages.

Concerns:

- `financialEngine.ts` and `decisionEngine.ts` duplicate bill normalization logic.
- `getInventoryBuyNextRows()` is called separately by financial and decision engines.
- `metrics.criticalInventory` currently stores a combined count of inventory buy-next rows plus manual Buy Next rows, so the name is broader than "critical inventory".
- Cash Flow and Statistics visualizations are not true historical charts.
- `TransactionsPreviewPanel` summarizes cross-domain state under a Transactions label.

Recommendation:

- Revise calculation naming and helper consolidation before expanding intelligence.

## Product/UX Risk

Findings:

- Dashboard communicates next action and pressure clearly.
- Recommended Move and Objective Stack support the command-center promise.

Concerns:

- Repeated bills/debt/buy-next signals may feel noisy.
- Read-only search may create a dead-control impression.
- Long recommendations can crowd mobile view.

Recommendation:

- Proceed with current layout as baseline; revise semantics/copy before adding widgets.

## Architecture Risk

Findings:

- State and derived data are centralized enough for current scale.
- `Dashboard.tsx` is large but understandable.

Concerns:

- Inline panels plus extracted dashboard components create mixed ownership.
- Summary mapping is duplicated between Dashboard `cardFor()` and `ModulePage`.
- No dedicated tests assert dashboard/module value consistency.

Recommendation:

- Add tests before refactors.
- Extract only after tests prove current behavior.

## Risk Register

| ID | Risk | Severity | Likelihood | Recommendation |
| --- | --- | --- | --- | --- |
| DASH-RISK-001 | Dashboard/module values diverge after future changes | High | Medium | Add consistency tests before implementation |
| DASH-RISK-002 | Duplicated bill/inventory derivation creates inconsistent alerts | High | Medium | Consolidate helpers |
| DASH-RISK-003 | Synthetic charts imply historical analytics | Medium | High | Clarify or replace only with real data contract |
| DASH-RISK-004 | Dashboard grows into an editing surface | High | Low | Preserve dashboard read-only rule |
| DASH-RISK-005 | Large localStorage payloads slow dashboard | Medium | Medium | Add data-volume tests |
| DASH-RISK-006 | Local browser data exposure | Medium | Medium | Document local-first security model; add auth before cloud sync |
| DASH-RISK-007 | Git blocker prevents audited docs from landing | High | High | Fix `.git/index.lock` permission outside sandbox |

