# Engineering Standards

## Current Workflow

Sprint work should proceed in this order:

1. Verify the application root with `pwd` and `git rev-parse --show-toplevel`.
2. Confirm `package.json`, source folders, config files, Git remote, and Vercel link are present before implementation.
3. Read `/docs/README.md`, `Master_PRD.md`, `Architecture.md`, `Engineering_Standards.md`, and the current sprint request.
4. Inspect the existing implementation before editing.
5. Preserve working functionality and data behavior.
6. Make the smallest change that satisfies the sprint.
7. Run validation.
8. Update documentation when architecture, product behavior, security posture, QA, or release process changes.
9. Commit one focused sprint change.
10. Push, deploy, smoke-test, and publish a release report.

## Mandatory Sprint Completion Gate

After every completed sprint, feature, bug fix, or workflow change, the work is not complete until the full release gate is satisfied:

1. Build the project.
2. Run lint.
3. Run type checks.
4. Run all relevant tests.
5. Fix any validation failures before continuing.
6. Commit changes with a clear commit message.
7. Push to GitHub.
8. Deploy to Vercel.
9. Run a smoke test against the deployed site.
10. Present a clickable preview deployment URL before asking for review.
11. Publish a short Release Report.

If any step is blocked by repository state, credentials, missing project configuration, Git permissions, GitHub connectivity, Vercel configuration, or failing validation, stop and diagnose the blocker. Fix the blocker when it is safely actionable. If it cannot be fixed from the current environment, document the exact reason, evidence, and next manual action. Do not mark the sprint complete without either a verified live preview or a clearly documented hard blocker.

## Canonical Repository Rule

ADR-002 requires one canonical VCC-OS development repository. Every sprint must verify that work is happening in the real application root, not an archive, export, backup, or partial copy.

The canonical application root must contain:

- `.git`
- Git remote `origin`
- `package.json`
- lockfile
- `src/`
- `public/`
- TypeScript config
- Vite config
- test/smoke-test config
- `.vercel/project.json` when deployment is in scope

If these markers are missing, stop implementation work and document the blocker.

## Installed Codex Skills

Use relevant installed skills when available:

- React/Vercel guidance for React component, routing, rendering, deployment, and UI behavior work.
- Supabase guidance when auditing or implementing Supabase, Auth, RLS, Storage, or Postgres behavior.
- Supabase Postgres best practices when writing or reviewing SQL, schema, indexes, RLS, and data-access patterns.
- Playwright/browser guidance when adding or validating smoke tests, navigation, responsive behavior, or console errors.
- Code review guidance before merge, push, or production deployment.

## Implementation Rules

- Do not redesign the UI unless explicitly requested.
- Do not refactor simply for style.
- Do not change financial calculations without tests and a documented reason.
- Do not remove historical documentation; archive it under `/docs/archive`.
- Prefer documenting current architecture before changing it.
- Avoid adding duplicate modules, duplicate routers, or alternate data models.
- Keep financial data transformations explicit and testable.
- Avoid `any` in new code unless a boundary is intentionally unknown and documented.

## Git Workflow

- Default branch: `main`.
- Branch names: `codex/sprint-<number>-<short-description>` when creating a branch.
- Commit format: `Sprint <number>: <imperative summary>`.
- Keep one sprint-sized unit per commit.
- Never commit secrets, generated dependency folders, local cache, or unrelated changes.

## Commit Standards

Each commit should include:

- Code or documentation changes needed for one sprint.
- Passing validation results or a documented blocker.
- Updated docs when behavior, architecture, process, or release state changes.

## Vercel Deployment Workflow

1. Build locally.
2. Lint and type-check.
3. Run tests and smoke checks.
4. Fix any failures.
5. Commit.
6. Push.
7. Confirm `.vercel/project.json` points to the canonical production project.
8. Deploy to Vercel.
9. Run smoke tests on the deployed URL.
10. Present a clickable preview URL.
11. Record the deployment in `Changelog.md`.

## QA Checklist

- App starts without console/runtime errors.
- Dashboard renders.
- Module navigation works.
- Bills, Debt, Savings, Inventory, and dashboard cards preserve current behavior.
- Financial calculations match tests and documented standards.
- No new broken imports or missing routes.
- Mobile and desktop remain readable.

## Smoke Test Checklist

- Load production URL.
- Verify dashboard heading and primary cards.
- Open every major module route.
- Verify no console errors.
- Verify any sprint-touched flow.
- Verify responsive shell at desktop and mobile widths when UI is touched.

## Release Report Template

```markdown
## Release Report

- Sprint:
- Files changed:
- Features added:
- Bugs fixed:
- Build:
- Lint:
- Type check:
- Tests run:
- Commit hash:
- GitHub branch:
- Push:
- Deployment URL:
- Preview URL:
- Smoke test result:
- Known issues:
- Next sprint recommendation:
```

## Sprint Completion Checklist

- Requested scope complete.
- No unrelated feature work added.
- Documentation updated.
- Build, lint, type checks, and relevant tests passed.
- Failures fixed before continuing.
- Changes committed with a clear commit message.
- Commit pushed to GitHub.
- Vercel preview deployment is live.
- Deployed site smoke test passed.
- Clickable Preview URL included before review.
- Release Report published.
