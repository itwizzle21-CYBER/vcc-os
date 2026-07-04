# VCC Known Issues

Known bugs or workflow blockers stay here until fixed. When fixed, move the issue into `WORKFLOW/VCC_WORKFLOW_MEMORY.md` with the full memory fields.

## Active

### Sandbox Cannot Delete `_write_test_codex`

- Problem: A temporary `_write_test_codex` folder remains from a prior write-permission test.
- Impact: Low; it is empty and Git does not track empty folders.
- Current status: Deletion is blocked by sandbox policy, but the folder does not enter `git add .`.
- Relevant skill used: `skill-creator`.

### `.agents/skills` Denies Skill Creation

- Problem: The sandbox cannot create new skill folders under `.agents/skills`.
- Impact: Project-local installed skills cannot be added there by this agent session.
- Current status: Use `WORKFLOW/` as the active workflow source; do not delete or rewrite `.agents/skills`.
- Relevant skill used: `skill-creator`.

### Browser Automation Unavailable In Current Session

- Problem: Playwright/browser automation could not be loaded by the Node automation runtime due local Codex app permission restrictions.
- Impact: Build validation and local HTTP serving pass, but full click-by-click visual QA could not be automated in this session.
- Current status: Local dev server reachability was verified with HTTP 200 using a PowerShell job. Run manual browser QA or approved browser automation before deployment.
- Relevant skill used: `playwright-best-practices`, `vercel-react-best-practices`.

### Git Index Lock Permission Denied

- Problem: `git add .` fails with `Unable to create ...\.git\index.lock: Permission denied`.
- Impact: Blocks Sprint 6 commit, push, and production deploy from this sandbox session.
- Current status: `.git` write permission was requested, but the Windows ACL/sandbox policy still prevents Git from creating the index lock. Fix local `.git` permissions or run commit/push/deploy from a shell with full repo ownership.
- Relevant skill used: `requesting-code-review`, `vercel-react-best-practices`.

### Empty Ignored Skill Fallback Directory Cannot Be Removed By Sandbox

- Problem: The obsolete `skills/` fallback files were removed, but empty directories cannot be deleted because sandbox approval for destructive operations is unavailable.
- Impact: Low; `.gitignore` excludes `skills/`, and empty directories are not committed by Git.
- Current status: Safe to proceed with `git add .`; no fallback skill file remains in the release set.
- Relevant skill used: `grill-with-docs`.

## Resolved During QA

### Settings Import/Restore Feedback Was Hidden

- Problem: Import and restore returned the user to Dashboard before Settings could show the result message.
- Resolution: Data replacement now keeps the user on Settings while preserving reset behavior separately.
- Relevant skill used: `vercel-react-best-practices`.

### Malformed Import Rows Could Bypass Row Shape Expectations

- Problem: Imported JSON rows could contain non-object rows or non-string values.
- Resolution: Storage normalization now ignores malformed row values and coerces imported cell values to strings before calculations/rendering.
- Relevant skill used: `vercel-react-best-practices`, `playwright-best-practices`.

### Lint Script Had No ESLint Flat Config

- Problem: `npm run lint` failed because ESLint v10 requires `eslint.config.js`.
- Resolution: Added repo-root `eslint.config.js` using the installed ESLint, TypeScript ESLint, React Hooks, React Refresh, and browser globals packages.
- Relevant skill used: `vercel-react-best-practices`.

### Root App Files Were Outside TypeScript App Coverage

- Problem: `tsconfig.app.json` only included `src`, while root `App.tsx` and `Dashboard.tsx` contain active runtime logic.
- Resolution: Added `App.tsx` and `Dashboard.tsx` to the app TypeScript include list; stricter build passes.
- Relevant skill used: `vercel-react-best-practices`.

### Obsolete Root Workflow Memory File

- Problem: Root `VCC_WORKFLOW_MEMORY.md` duplicated the canonical `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Resolution: Removed the obsolete root file. `WORKFLOW/` remains the workflow source of truth.
- Relevant skill used: `grill-with-docs`.

## Template

```markdown
### Issue Name

- Problem:
- Impact:
- Current status:
- Relevant skill used:
```
