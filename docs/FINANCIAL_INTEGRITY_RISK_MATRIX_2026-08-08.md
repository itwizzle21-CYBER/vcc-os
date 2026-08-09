# Financial Integrity Risk Matrix — 2026-08-08

Scoring uses likelihood (L) and impact (I) from 1–5. Risk score is `L × I`: Critical 20–25, High 12–19, Medium 6–11, Low 1–5. Residual scores reflect the controls implemented in this sprint.

| ID | Failure mode | L | I | Initial | Control / verification | Residual |
|---|---|---:|---:|---:|---|---:|
| FI-01 | Account balance and transaction net counted twice | 4 | 5 | 20 Critical | Canonical-balance invariant and engine regression | 5 Low |
| FI-02 | Unused SpotMe treated as spendable cash | 4 | 5 | 20 Critical | Chime/SpotMe boundary rule and zero/negative tests | 5 Low |
| FI-03 | Used SpotMe subtracted twice | 3 | 5 | 15 High | Negative Chime is the single used-capacity representation | 5 Low |
| FI-04 | Paid bill debits no account | 4 | 5 | 20 Critical | Paying account required by UI and event validation | 5 Low |
| FI-05 | Paid bill creates duplicate transactions/debits | 4 | 5 | 20 Critical | Deterministic event ID and idempotence tests | 5 Low |
| FI-06 | Transaction deletion leaves balance or bill corrupted | 4 | 5 | 20 Critical | Reversal event, linked bill reopen, confirmation, tests | 5 Low |
| FI-07 | Mobile gesture deletes unintentionally | 3 | 4 | 12 High | 64px horizontal threshold, vertical guard, reveal then confirm | 4 Low |
| FI-08 | Inventory duplicate masks an out-of-stock record | 4 | 4 | 16 High | Conservative merge and computed alert regression | 4 Low |
| FI-09 | Deduplication silently destroys conflicting user data | 3 | 5 | 15 High | Exact-only account removal; inventory merge evidence | 5 Low |
| FI-10 | Cloud/import normalization reintroduces duplicates | 3 | 4 | 12 High | Canonicalization on import, cloud-state application, and edits | 4 Low |
| FI-11 | Customization hides a core financial route | 3 | 5 | 15 High | Removed page-level collapse; route availability E2E | 5 Low |
| FI-12 | Sample records override real or empty user state | 4 | 4 | 16 High | Blank production initialization and persistence test | 4 Low |
| FI-13 | Bill payment edit fragments the linked event | 3 | 4 | 12 High | Bill-generated transaction edits are routed to Bills | 4 Low |
| FI-14 | Refresh recreates payment or loses reconciliation | 3 | 5 | 15 High | Versioned storage plus reload E2E asserting one linked event | 5 Low |

## Release focus

The critical financial paths are covered at pure-engine and browser levels. Highest residual uncertainty is legacy data with conflicting same-name account balances: those rows are intentionally preserved for user review because automated selection would risk deleting legitimate money.
