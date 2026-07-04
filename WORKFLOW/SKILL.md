---
name: vcc-os-workflow
description: Use before every VCC_OS task and after every error, fix, UI or architecture decision, deployment, known issue, risky change, commit, push, or production-readiness check. Requires reading the WORKFLOW folder, loading relevant installed project skills, preserving existing functionality and layout, validating before replacement, and updating workflow memory, decisions, changelog, and known issues.
---

# VCC_OS Workflow

Use this workflow before doing any VCC_OS work.

## Source Of Truth

- Project: `C:\Users\itwiz\Documents\Projects\VCC_OS`
- Production: `https://vcc-os.vercel.app`
- GitHub: `https://github.com/itwizzle21-CYBER/vcc-os.git`

## Required First Step

Before every task, read the full `WORKFLOW/` folder:

- `WORKFLOW/SKILL.md`
- `WORKFLOW/VCC_WORKFLOW_MEMORY.md`
- `WORKFLOW/CHANGELOG.md`
- `WORKFLOW/KNOWN_ISSUES.md`
- `WORKFLOW/DECISIONS.md`
- `WORKFLOW/ARCHITECTURE.md`

Check `VCC_WORKFLOW_MEMORY.md` before repeating any previously fixed mistake.

## Installed Project Skills

Load and use every relevant installed skill automatically:

- `grill-with-docs`: repo, docs, workflow, planning, architecture, and decision shaping.
- `playwright-best-practices`: UI/browser/testing issues, responsive checks, console errors, Playwright work.
- `requesting-code-review`: before risky commits, major work, merges, or every push.
- `supabase-postgres-best-practices`: Supabase, Postgres, schema, query, auth, or RLS issues.
- `vercel-react-best-practices`: React, Vercel, deployment, layout, rendering, performance, frontend refactors.

## Permanent Rules

1. Work only in `C:\Users\itwiz\Documents\Projects\VCC_OS`.
2. Never use old Codex folders or preview URLs.
3. Inspect the current codebase before editing.
4. Reuse existing components before creating new ones.
5. Improve existing components instead of rebuilding them unless the user explicitly asks for redesign.
6. Preserve working functionality and data flow.
7. Never replace a working layout with a simpler version without asking.
8. Do not make the user paste raw code into the terminal.
9. Give terminal commands one at a time.
10. Replace old or broken files with corrected versions only after validation passes.
11. Remove dead or duplicate code when safe.
12. Do not delete important files without approval.
13. Run `npm run build` before every commit. If PowerShell blocks `npm`, use `npm.cmd run build` and record the lesson.
14. Run code review before every push.
15. Keep one feature or fix per commit.
16. Keep the repo production-ready.

## Architecture Rule

Before creating any new component, page, hook, utility, or data model:

- Search the project for an existing implementation.
- Reuse or extend existing code whenever practical.
- Avoid duplicate functionality.
- If replacing old code, remove the obsolete implementation only after verifying the new one works.
- Keep every file purposeful and in the correct architectural location.
- Refactor when appropriate instead of continuously adding layers.
- Leave the project cleaner than it was before beginning the task.

## Product Rules

- Dashboard stays read-only and intelligence-focused.
- Dedicated pages handle editing.
- Money, Bills, Inventory, and Debt remain editable.
- Preserve mobile polish.
- Keep the current layout as the baseline unless the user explicitly asks for redesign.
- Improve existing components instead of rebuilding them.

## Memory Rules

- Every completed fix updates `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Every UI or architecture decision updates `WORKFLOW/DECISIONS.md`.
- Every deployment updates `WORKFLOW/CHANGELOG.md`.
- Every known bug goes into `WORKFLOW/KNOWN_ISSUES.md` until fixed.
- Every architecture change updates `WORKFLOW/ARCHITECTURE.md`.
- When a bug is fixed, move it from `KNOWN_ISSUES.md` into `VCC_WORKFLOW_MEMORY.md` with:
  - Error/problem
  - Root cause
  - Fix applied
  - Files touched
  - Commands that worked
  - Commands that failed
  - Prevention rule
  - Relevant skill used

## Validation

Choose validation based on the change:

- Code or UI change: run the relevant checks and `npm run build` before commit.
- Browser/UI behavior: use browser or Playwright guidance when available; record blockers.
- Docs/workflow-only change: verify files exist, content is readable, and git diff is scoped.
- Deployment: update `CHANGELOG.md` with production URL, command, result, and rollback notes.

Never claim a validation passed if it could not run.

## End Of Sprint Release Pipeline

Every sprint should try to complete the full target VCC_OS release pipeline:

```text
Sprint Complete
-> Build
-> Lint
-> TypeScript
-> QA
-> Decision Engine
-> Git Commit
-> Git Push
-> Vercel Deploy
-> Smoke Test
-> Release Report
```

Required validation steps include:

- `npm.cmd run build`
- `npm.cmd run lint`
- `git diff --check`
- Local server or route check when applicable.
- Any targeted QA needed for touched pages, settings, calculations, storage, or decision-engine behavior.

If validation passes, commit, push, and deploy automatically when Git and Vercel permissions allow.

If any pipeline step is blocked:

1. Stop at the blocker.
2. Explain the exact blocker.
3. Do not pretend the sprint completed.
4. Do not retry endlessly.
5. Provide exact local commands when user action is required, such as:
   - `git status`
   - `git add .`
   - `git commit -m "Sprint X: description"`
   - `git push origin main`
   - `vercel --prod`

Never claim commit, push, deploy, smoke test, or production verification succeeded unless the command or check actually completed.

Always finish with a release report:

- Sprint name
- Files changed
- Validation results
- Commit hash if committed
- Push status
- Deploy status
- Production URL
- Known issues
- Next recommended sprint
