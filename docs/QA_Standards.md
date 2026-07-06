# QA Standards

## Validation Levels

Use the strongest available validation for the current repository state:

1. Build
2. Lint
3. Type check
4. Unit tests
5. Component tests
6. Route smoke tests
7. Production smoke tests
8. Manual QA for touched flows

## Current Sprint 0 Limitation

This snapshot has no `package.json`, lockfile, TypeScript config, Vite config, or test runner config. Standard build/lint/type/test commands cannot run until tooling is restored.

## Required Future Checks

Once tooling is restored:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run smoke`
- `git diff --check`

## Manual QA Checklist

- Dashboard loads.
- Daily Briefing card is visible.
- Today's Mission card is visible.
- Money Snapshot card is visible.
- Priority Alerts card is visible.
- Buy Next card is visible.
- Goal Progress card is visible.
- Bills page opens and core actions are visible.
- Debt page opens and vehicle tracker is visible.
- Savings page opens.
- Inventory page opens and shows critical/low/buy-next tabs.
- No console errors.
- Mobile layout remains usable.

## Bug Reporting Template

```markdown
## Bug

- Area:
- Steps to reproduce:
- Expected:
- Actual:
- Severity:
- Evidence:
- Suspected cause:
- Suggested fix:
```

