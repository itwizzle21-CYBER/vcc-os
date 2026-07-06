# Dashboard Backlog

## Prioritized Implementation Backlog

| Feature ID | Description | Business Value | Engineering Complexity | Risk | Dependencies | Estimated Effort | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DASH-101 | Add dashboard/module financial consistency tests | High: prevents trust-breaking mismatches | Medium | Low | Test harness, current engine contracts | 1 sprint | Proceed |
| DASH-102 | Consolidate bill normalization between financial and decision engines | High: prevents duplicated alert/pressure logic | Medium | Medium | DASH-101 recommended first | 0.5-1 sprint | Proceed |
| DASH-103 | Consolidate inventory Buy Next derivation contract | High: keeps Buy Next counts and alerts consistent | Medium | Medium | DASH-101 | 0.5-1 sprint | Proceed |
| DASH-104 | Rename or clarify `criticalInventory` metric if it represents inventory plus manual Buy Next | Medium: improves maintainability and product truth | Low-Medium | Medium | Tests around current behavior | 0.5 sprint | Revise |
| DASH-105 | Clarify Transactions Preview semantics or source label | Medium: reduces user confusion | Low | Low | UX copy review | 0.5 sprint | Revise |
| DASH-106 | Replace synthetic Cash Flow/Statistics visuals with documented real-data contract | Medium: improves analytical trust | Medium-High | Medium | Historical transaction model | 1-2 sprints | Revise |
| DASH-107 | Add stale-data or data-completeness indicator | High: improves decision confidence | Medium | Medium | Define freshness rules | 1 sprint | Revise |
| DASH-108 | Extract inline dashboard panels into dedicated components | Medium: improves maintainability | Medium | Medium | Tests first | 0.5-1 sprint | Revise |
| DASH-109 | Add accessibility-focused dashboard QA tests | Medium: protects keyboard/focus/card behavior | Medium | Low | Playwright/a11y decisions | 1 sprint | Proceed |
| DASH-110 | Add large dataset performance check for localStorage dashboard | Medium: protects future scale | Medium | Medium | Data factories | 1 sprint | Revise |
| DASH-111 | Implement working dashboard search | Low today: not core decision flow | Medium | Medium | Search scope/product decision | 1 sprint | Reject for now |
| DASH-112 | Add new dashboard widgets | Unclear until duplication is reduced | Medium-High | High | Audit cleanup first | Unknown | Reject for now |

## Recommended Sequence

1. DASH-101: tests for consistency.
2. DASH-102 and DASH-103: shared derivation contracts.
3. DASH-104 and DASH-105: naming/semantic cleanup.
4. DASH-107: data completeness intelligence.
5. DASH-106 and DASH-110: real analytics/performance foundation.

## Leadership Review Summary

- Lead QA: prioritize consistency and route/card-click tests.
- Lead Cybersecurity: keep local-first disclosure clear; do not imply auth.
- Lead Financial Systems Architect: consolidate duplicate derivations before adding intelligence.
- Chief Software Architect: reduce `Dashboard.tsx` responsibility after tests exist.
- Lead Software Engineer: avoid refactors until test coverage locks current behavior.

