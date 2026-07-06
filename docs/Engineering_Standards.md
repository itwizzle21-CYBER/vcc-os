# Engineering Standards

## Required Workflow

1. Verify the app root before work: `package.json`, `src/`, `public/`, `.git`, `.vercel`, and no `.git/index.lock`.
2. Read `WORKFLOW/` and relevant `/docs` files.
3. Inspect existing implementation before editing.
4. Preserve behavior and layout unless the sprint explicitly changes them.
5. Keep changes focused.
6. Run available validation.
7. Update docs when workflow, architecture, product behavior, security posture, QA, or release process changes.
8. Commit, push, deploy, and smoke-test only when validation and permissions allow.

## Installed Skills And When To Use Them

- `vcc-os-workflow`: before every VCC-OS task and after every fix, decision, deployment, or known issue.
- `playwright-best-practices`: smoke tests, browser validation, responsive checks, console errors.
- `requesting-code-review`: before risky commits, major work, merges, or push.
- `supabase-postgres-best-practices`: Supabase/Postgres/RLS/schema/query work.
- `vercel-react-best-practices`: React code, UI behavior, rendering, layout, and Vercel deployment.

## Implementation Rules

- Do not redesign the UI unless explicitly requested.
- Do not refactor for style alone.
- Do not change financial logic without a documented critical reason and validation.
- Prefer existing components, helpers, storage paths, and engine patterns.
- Keep dashboard read-only.
- Keep dedicated pages editable.
- Keep localStorage normalization intact.
- Avoid new abstractions unless they remove real complexity.

## Git Workflow

- Main branch: `main`.
- Default Codex branch prefix when branching: `codex/`.
- Commit format: concise imperative summary, for example `docs: complete Sprint 0 governance and documentation foundation`.
- Keep one sprint-sized unit per commit.
- Never stage unrelated user changes.

## Validation Commands

- `npm.cmd run build`
- `npm.cmd run lint`
- `git diff --check`
- `npm.cmd run smoke` with `SMOKE_BASE_URL` for local/preview checks when UI/routes are touched.
- `npm.cmd run smoke:prod` after production deploy.

## Release Report Template

```markdown
## Release Report

- Sprint:
- Correct root:
- Files changed:
- Build:
- Lint:
- Type check:
- QA:
- Decision Engine:
- Commit:
- Push:
- Deployment:
- Production URL:
- Smoke test:
- Known issues:
- Next recommended sprint:
```

