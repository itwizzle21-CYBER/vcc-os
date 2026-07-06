# Risk Register

| ID | Risk | Area | Severity | Likelihood | Status | Mitigation |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-001 | Git cannot create `.git/index.lock` in sandbox | Release | High | High | Active | Fix local Windows repo permissions or commit from unrestricted shell. |
| RISK-002 | Supabase/auth/RLS not implemented | Security | High | Medium | Active | Treat as planned; require security architecture before remote persistence. |
| RISK-003 | Browser-local data can be lost | Storage | Medium | Medium | Active | Use export/backup controls; improve backup UX later. |
| RISK-004 | Financial engine lacks broad automated unit coverage | Financial | High | Medium | Active | Add deterministic financial/decision engine tests in next sprint. |
| RISK-005 | Large `Dashboard.tsx` owns many responsibilities | Maintainability | Medium | Medium | Watch | Extract only when ownership boundaries become clear. |
| RISK-006 | Old export snapshot may be mistaken for active app root | Process | High | Medium | Active | Start every sprint with root verification. |
| RISK-007 | Future nav additions may overflow shell | UI | Medium | Medium | Watch | Preserve compact nav rules and smoke-test all tabs. |
| RISK-008 | Backend placeholder files may confuse architecture | Architecture | Medium | Medium | Watch | Keep `routers.ts` documented as inactive until intentionally wired. |

## Risk Review Cadence

Review this register:

- Before every release.
- Before adopting Supabase/auth.
- Before changing financial calculations.
- Before adding new top-level navigation.

## Template

```markdown
| RISK-### | Summary | Area | Severity | Likelihood | Status | Mitigation |
```

