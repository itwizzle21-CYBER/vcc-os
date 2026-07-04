# VCC Decisions

Record UI, architecture, workflow, and deployment decisions here.

## 2026-07-04 - WORKFLOW Folder Is The Permanent Workflow Source

- Decision: Use `WORKFLOW/` as the permanent VCC_OS workflow source for task rules, memory, changelog, known issues, and decisions.
- Reason: The user requested one stable repo-local workflow folder, and `.agents/skills` is not writable from this sandbox.
- Consequences: Before every task, read all files in `WORKFLOW/`. Future fixes update memory; UI/architecture decisions update this file; deployments update changelog; active bugs update known issues.
- Relevant skill used: `skill-creator`.

## 2026-07-04 - Architecture Doc Tracks Production Baseline

- Decision: Add `WORKFLOW/ARCHITECTURE.md` as the production-focused architecture reference.
- Reason: Future changes need one place to check folder structure, routing, data flow, state, design rules, deployment notes, and roadmap before editing code.
- Consequences: Before architecture-affecting work, read and update `ARCHITECTURE.md`; keep files organized in the established folders.
- Relevant skill used: `grill-with-docs`, `vercel-react-best-practices`.

## 2026-07-04 - Search Before Creating New Code

- Decision: Before creating any new component, page, hook, utility, or data model, search for an existing implementation and reuse or extend it whenever practical.
- Reason: VCC_OS needs to grow without accumulating duplicate layers, misplaced files, or obsolete implementations.
- Consequences: New files must have a clear purpose and correct architectural location; obsolete replaced code is removed only after validation; refactoring is preferred when it keeps the repo cleaner.
- Relevant skill used: `grill-with-docs`, `vercel-react-best-practices`.

## 2026-07-04 - Preserve Current Layout Baseline

- Decision: Keep the current VCC_OS layout as the baseline unless the user explicitly asks for redesign.
- Reason: The product rules require gradual improvement, mobile polish, and preserving working functionality.
- Consequences: Improve existing components first, avoid simpler replacement layouts, and ask before replacing a working layout.
- Relevant skill used: `vercel-react-best-practices`.

## 2026-07-04 - Dashboard Read-Only, Dedicated Pages Editable

- Decision: Keep the dashboard read-only and intelligence-focused; use dedicated pages for editing.
- Reason: This preserves the operating model and reduces accidental edits from summary views.
- Consequences: Money, Bills, Inventory, and Debt remain editable on their dedicated pages, not through the dashboard.
- Relevant skill used: `vercel-react-best-practices`.

## 2026-07-04 - Missing Testing Pages Reuse ModulePage

- Decision: Budget, Buy Next, and Activity are section-backed pages that reuse the existing `ModulePage` and `SpreadsheetGrid` flow.
- Reason: The current architecture already supports editable dedicated pages through `defaultSections`, `SectionKey`, and `ModuleRoute`; creating custom page systems would duplicate working behavior.
- Consequences: Future tabs should be added by extending the section model first, then wiring engine metrics, summaries, navigation, and workflow docs.
- Relevant skill used: `grill-with-docs`, `vercel-react-best-practices`.

## 2026-07-04 - Target Release Pipeline For Every Sprint

- Decision: Every sprint should try to complete this full target pipeline: Sprint Complete -> Build -> Lint -> TypeScript -> QA -> Decision Engine -> Git Commit -> Git Push -> Vercel Deploy -> Smoke Test -> Release Report.
- Reason: VCC_OS needs a consistent production-readiness path that validates code, product behavior, decision intelligence, deployment, and live smoke testing before a sprint is considered truly complete.
- Consequences: If any step is blocked, stop at the blocker, explain the exact blocker, avoid repeated retries, and do not pretend the sprint completed. When user action is required, provide exact local commands such as `git status`, `git add .`, `git commit -m "Sprint X: description"`, `git push origin main`, and `vercel --prod`. Never report commit, push, deploy, smoke test, or production verification success unless it actually completed.
- Relevant skill used: `grill-with-docs`, `requesting-code-review`, `playwright-best-practices`, `vercel-react-best-practices`.

## 2026-07-04 - Playwright Production Smoke Test Is Required After Deploy

- Decision: Use the repo Playwright smoke workflow as the required Smoke Test step after every production deploy.
- Reason: VCC_OS needs a repeatable post-deploy check for production URL loading, dashboard loading, navigation, Settings, reset/export/import controls, main pages, and console errors.
- Consequences: Run `npm.cmd run smoke:prod` after `vercel --prod`. The smoke workflow defaults to `https://vcc-os.vercel.app` and can target local or preview URLs with `SMOKE_BASE_URL`.
- Relevant skill used: `playwright-best-practices`, `vercel-react-best-practices`.

## 2026-07-04 - Settings Uses Hash Routing

- Decision: Keep VCC_OS as a Vite single-page app, but map screens to hash routes such as `#/settings`.
- Reason: Sprint 7 required Settings to be a real routed page without redesigning the layout or introducing a larger router.
- Consequences: Navigation updates the hash, direct Settings URLs load the Settings page, invalid hashes fall back to Dashboard, and future views should be added to the existing `AppView`/section route model.
- Relevant skill used: `grill-with-docs`, `playwright-best-practices`, `vercel-react-best-practices`.

## 2026-07-04 - Sidebar Fit Tightening Preserves Mobile Bottom Nav

- Decision: Reduce desktop sidebar top/bottom padding, logo margin, nav gaps, and button height while leaving the mobile bottom navigation sizing in its media query.
- Reason: Sprint 7 required all nav tabs to fit without removing tabs or redesigning the shell.
- Consequences: Desktop nav uses denser but usable targets; mobile continues using horizontal bottom tabs.
- Relevant skill used: `vercel-react-best-practices`.

## Decision Template

```markdown
## YYYY-MM-DD - Decision Name

- Decision:
- Reason:
- Consequences:
- Relevant skill used:
```
