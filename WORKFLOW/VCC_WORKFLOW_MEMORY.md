# VCC Workflow Memory

Read this file before fixing errors or revisiting previously fixed areas. Never repeat a fixed mistake without checking workflow memory first.

## 2026-07-04 - Sprint 1.1 Dashboard Intelligence Audit

- Error/problem: The dashboard needed architecture/product review before implementation so future work does not redesign, duplicate calculations, or turn the dashboard into an editing surface.
- Root cause: Dashboard intelligence spans `Dashboard.tsx`, extracted dashboard components, financial engine, decision engine, storage defaults, and module summaries; several values are repeated across widgets.
- Fix applied: Created dashboard audit, backlog, architecture review, QA checklist, and risk assessment docs; updated roadmap, PRD, and project health report with Sprint 1.1 findings; did not modify application code.
- Files touched: `docs/Dashboard_Audit.md`, `docs/Dashboard_Backlog.md`, `docs/Dashboard_Architecture_Review.md`, `docs/Dashboard_QA_Checklist.md`, `docs/Dashboard_Risk_Assessment.md`, `docs/Roadmap.md`, `docs/Master_PRD.md`, `docs/Project_Health_Report.md`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: Source reads for `Dashboard.tsx`, dashboard components, storage, helpers, financial engine, decision engine, and docs.
- Commands that failed: None during Sprint 1.1 audit creation.
- Prevention rule: Before implementing dashboard changes, add dashboard/module consistency tests and consolidate duplicated derivation logic before changing UI.
- Relevant skill used: `vcc-os-workflow`, `vercel-react-best-practices`, `playwright-best-practices`, `supabase-postgres-best-practices`.

## 2026-07-04 - Sprint 0.5 Foundation Baseline Blocked By Git Index

- Error/problem: Sprint 0.5 needed to commit Sprint 0 documentation, create `v0.1.0-foundation`, push, deploy, and smoke-test the new baseline, but Git staging failed.
- Root cause: The sandbox cannot create `.git/index.lock` in `C:\Users\itwiz\Documents\Projects\VCC_OS\.git`, even though no stale lock file exists.
- Fix applied: Verified docs are present, ran build/lint/typecheck/production smoke successfully, updated Sprint 0.5 docs, created `docs/Baseline_Report.md`, and stopped before commit/tag/push/deploy.
- Files touched: `docs/Baseline_Report.md`, `docs/Sprint_History.md`, `docs/Changelog.md`, `docs/Master_PRD.md`, `docs/Project_Health_Report.md`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `npm.cmd run build`; `npm.cmd run lint`; `npx.cmd tsc --noEmit`; `npm.cmd run smoke:prod`; `git diff --check`; `git status --short --branch`; `.git/index.lock` check.
- Commands that failed: Git staging remains blocked by `.git/index.lock: Permission denied`.
- Prevention rule: Do not attempt baseline tags, pushes, or deploys from this sandbox until Git index write permissions are fixed; run the provided commands from an unrestricted shell.
- Relevant skill used: `vcc-os-workflow`, `playwright-best-practices`, `requesting-code-review`, `vercel-react-best-practices`.

## 2026-07-04 - Sprint 0 Repository Recovery And Docs Foundation

- Error/problem: The Sprint 0 request was initially attached while the session was in `C:\Users\itwiz\Downloads\VCC-OS`, an export snapshot without `package.json`, `src/`, `public/`, or build tooling.
- Root cause: There are two similarly named folders; only `C:\Users\itwiz\Documents\Projects\VCC_OS` is the real buildable app root.
- Fix applied: Ran root verification commands, confirmed the real app root, verified `.git/index.lock` was absent, documented Vercel project config, added `/docs` canonical documentation and governance files, and recorded the root decision in workflow decisions.
- Files touched: `docs/README.md`, `docs/Master_PRD.md`, `docs/Engineering_Standards.md`, `docs/Architecture.md`, `docs/Roadmap.md`, `docs/Sprint_History.md`, `docs/Changelog.md`, `docs/QA_Standards.md`, `docs/Security_Standards.md`, `docs/Financial_Standards.md`, `docs/UI_Guidelines.md`, `docs/Repository_Audit.md`, `docs/Project_Health_Report.md`, `docs/Governance/Technical_Leadership_Charter.md`, `docs/Governance/Decision_Log.md`, `docs/Governance/Risk_Register.md`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/DECISIONS.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `Get-Location`; `Get-ChildItem -Force`; package root search; `git status --short --branch`; `git rev-parse --show-toplevel`; `.git/index.lock` check.
- Commands that failed: Reading some paths in a broad parallel scan hit a sandbox ACL denial; `git add -- docs WORKFLOW/ARCHITECTURE.md WORKFLOW/CHANGELOG.md WORKFLOW/DECISIONS.md WORKFLOW/VCC_WORKFLOW_MEMORY.md; git commit -m "docs: complete Sprint 0 governance and documentation foundation"` failed with `.git/index.lock: Permission denied`.
- Prevention rule: Before any VCC_OS sprint, verify the active root has `package.json`, `src/`, `public/`, `.git`, and `.vercel`; never continue in `Downloads\VCC-OS` if build tooling is missing.
- Relevant skill used: `grill-with-docs`, `playwright-best-practices`, `requesting-code-review`, `supabase-postgres-best-practices`, `vercel-react-best-practices`.

## 2026-07-04 - Sprint 7 Settings Route And Sidebar Fit

- Error/problem: Settings could only behave like an internal screen and the desktop sidebar had too much vertical spacing for the full tab set.
- Root cause: The app used local `view` state without a URL route sync layer, and earlier sidebar refinements increased logo margins, nav gaps, and button height after more tabs were added.
- Fix applied: Added bounded hash-route syncing for `AppView` routes including `#/settings`; aligned Settings labels and controls with Reset All Data, Export Backup, Import Backup, Clear Cache, App Information, Version, Diagnostics, Data Validation, Storage Status, and future placeholders; tightened desktop-only sidebar spacing while preserving mobile bottom navigation.
- Files touched: `Dashboard.tsx`, `src/styles/vccSkin.css`, `tests/smoke/vcc-os-smoke.spec.ts`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/DECISIONS.md`, `WORKFLOW/ARCHITECTURE.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `npm.cmd run build`; `npm.cmd run lint`; `git diff --check`; local preview smoke with `SMOKE_BASE_URL=http://127.0.0.1:4173 npm.cmd run smoke`.
- Commands that failed: `git add -- Dashboard.tsx src/styles/vccSkin.css tests/smoke/vcc-os-smoke.spec.ts WORKFLOW/CHANGELOG.md WORKFLOW/DECISIONS.md WORKFLOW/ARCHITECTURE.md WORKFLOW/VCC_WORKFLOW_MEMORY.md` failed with `.git/index.lock: Permission denied`.
- Prevention rule: When adding or restoring pages, wire the view into the hash route model and update smoke checks for routeability and exact Settings control labels; keep desktop nav density separate from the mobile bottom nav media query.
- Relevant skill used: `grill-with-docs`, `playwright-best-practices`, `requesting-code-review`, `vercel-react-best-practices`.

## 2026-07-04 - Playwright Smoke Workflow Added

- Error/problem: The release pipeline required a Smoke Test step, but the repo had no repeatable smoke workflow.
- Root cause: Playwright had not been installed or configured in VCC_OS before this sprint.
- Fix applied: Added Playwright config, a production smoke spec, `smoke` and `smoke:prod` scripts, and workflow docs requiring `npm.cmd run smoke:prod` after deploy.
- Files touched: `package.json`, `package-lock.json`, `playwright.config.ts`, `tests/smoke/vcc-os-smoke.spec.ts`, `WORKFLOW/SKILL.md`, `WORKFLOW/DECISIONS.md`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `npm.cmd install -D @playwright/test`; `npx.cmd playwright install chromium`; local smoke workflow validation with `SMOKE_BASE_URL`.
- Commands that failed: None yet for the smoke workflow.
- Prevention rule: Every production deploy must be followed by `npm.cmd run smoke:prod`; never claim smoke success unless Playwright completes.
- Relevant skill used: `playwright-best-practices`, `vercel-react-best-practices`.

## 2026-07-04 - Sprint 6 Commit Blocked By Git Index Permission

- Error/problem: `git add .` failed during the Release Candidate pipeline with `Unable to create 'C:/Users/itwiz/Documents/Projects/VCC_OS/.git/index.lock': Permission denied`.
- Root cause: The sandbox can edit working-tree files but cannot write the Git index lock inside `.git`, despite requesting `.git` write permission.
- Fix applied: Documented the blocker and stopped before commit/push/deploy as required by the Sprint 6 rule.
- Files touched: `WORKFLOW/KNOWN_ISSUES.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `npm.cmd run build`; `npm.cmd run lint`; `git diff --check`; local dev server HTTP 200 check.
- Commands that failed: `git add .`.
- Prevention rule: Before any sprint that must commit, verify `.git/index.lock` can be created by `git add` before starting deploy work; if blocked, fix Windows repo ownership/ACL outside the sandbox.
- Relevant skill used: `requesting-code-review`, `vercel-react-best-practices`, `vercel:deployments-cicd`.

## 2026-07-04 - Sprint 6 Release Candidate Cleanup

- Error/problem: Release candidate commit risked including local installed-skill artifacts or obsolete fallback workflow files; Settings labels did not exactly match release-candidate terminology.
- Root cause: Earlier skill/memory setup created fallback files outside `WORKFLOW/`; installed skills live in `.agents/` and `skills-lock.json`, which are local workflow assets rather than product source; Settings used generic data labels instead of the required backup terminology.
- Fix applied: Added `.agents`, `skills`, and `skills-lock.json` to `.gitignore`; removed obsolete fallback workflow memory files; aligned Settings labels/cards with Export Backup, Import Backup, Data Validation, Diagnostics, App Information, Version, and Storage Status.
- Files touched: `.gitignore`, `Dashboard.tsx`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/KNOWN_ISSUES.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `rg` inspections; `git status --short`; `apply_patch` deletion for obsolete fallback files.
- Commands that failed: PowerShell folder deletion for empty `_write_test_codex` and `skills/` directories was blocked by sandbox policy before execution.
- Prevention rule: Keep local agent skill installation artifacts out of product commits; canonical workflow memory lives only under `WORKFLOW/`; empty sandbox-created directories should be ignored or removed manually if the sandbox blocks deletion.
- Relevant skill used: `grill-with-docs`, `playwright-best-practices`, `vercel-react-best-practices`, `requesting-code-review`.

## 2026-07-04 - Lead QA Import And Lint Defects Fixed

- Error/problem: Lead QA found Settings import/restore feedback was hidden by navigation, malformed imported rows could violate the string-row model, and `npm run lint` could not run because ESLint v10 had no flat config.
- Root cause: Settings reused a replacement helper that navigated away from Settings; storage normalization assumed saved/imported rows were valid `Record<string, string>` objects; the project had an ESLint script and dependencies but no `eslint.config.js`; `tsconfig.app.json` only included `src` even though root `App.tsx` and `Dashboard.tsx` are active runtime files.
- Fix applied: Kept import/restore on Settings so status messages remain visible; hardened row normalization with object guards and string coercion; added `eslint.config.js` at the repo root using installed lint packages; expanded TypeScript app coverage to include root `App.tsx` and `Dashboard.tsx`.
- Files touched: `Dashboard.tsx`, `src/lib/storage/vccStorage.ts`, `eslint.config.js`, `tsconfig.app.json`, `WORKFLOW/ARCHITECTURE.md`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/KNOWN_ISSUES.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `npm.cmd run build`; `npm.cmd run lint`; source inspection with `rg`.
- Commands that failed: `npm run build` remains blocked by PowerShell execution policy in this environment.
- Prevention rule: Import/restore flows must keep user feedback visible; all imported storage data must pass the same normalization and type coercion path as startup; if a package script exists, ensure the required config file exists and runs.
- Relevant skill used: `grill-with-docs`, `playwright-best-practices`, `vercel-react-best-practices`, `requesting-code-review`.

## 2026-07-04 - QA Settings Data Controls Restored

- Error/problem: QA requirements said Settings must include Reset All Data, Export Data, Import Data, Local Storage Status, App Version, Theme, Developer Diagnostics, Backup / Restore, and Clear Cache, but Settings only had reset/status/version/theme placeholders.
- Root cause: The stabilization pass restored Settings as a status page but did not wire the full data-management controls required for end-user QA.
- Fix applied: Added Export Data, Import Data, Backup data, Restore backup, Clear cache, explicit Local Storage Status, App Version, Theme, Developer Diagnostics, and Backup / Restore UI; added a browser backup storage key; reused the startup normalization path for import/restore; wrapped localStorage read/write/reset failures with safe error handling.
- Files touched: `Dashboard.tsx`, `src/lib/storage/vccStorage.ts`, `src/styles/vccSkin.css`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/KNOWN_ISSUES.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: `npm.cmd run build`; PowerShell local dev server job plus `Invoke-WebRequest` returned HTTP 200; source inspection with `rg`.
- Commands that failed: `npm run build` failed because PowerShell blocked `npm.ps1`; Node automation could not import Playwright because local Codex app paths were permission-blocked.
- Prevention rule: Treat Settings data controls as required QA functionality, not optional roadmap placeholders; import/restore must use the same section normalization as app startup.
- Relevant skill used: `grill-with-docs`, `playwright-best-practices`, `vercel-react-best-practices`.

## 2026-07-04 - Full Testing Baseline Restored

- Error/problem: Several requested testing tabs were missing or not wired into the section model, Settings needed testing/status controls, starter rows could create false pressure from blank data, and dashboard text contained broken glyphs.
- Root cause: The app is intentionally section-backed, but Budget, Buy Next, and Activity had not been added to `SectionKey`, defaults, routes, summaries, and engine metrics; starter default rows still carried nonzero/demo-like values or active statuses; some UI text had mojibake from prior encoding.
- Fix applied: Added Budget, Buy Next, and Activity as editable `ModulePage` sections; added budget/activity/buy-next metrics and decision-engine alerts; restored Settings status/storage/app/data-management cards; made reset defaults blank or zero-safe; ignored empty bill/debt/goal/mission rows in engines; replaced broken glyph labels with plain text.
- Files touched: `Dashboard.tsx`, `src/lib/types/vcc.ts`, `src/lib/storage/vccStorage.ts`, `src/lib/calculations/helpers.ts`, `src/lib/engine/financialEngine.ts`, `src/lib/engine/decisionEngine.ts`, `src/components/modules/ModulePage.tsx`, `src/components/dashboard/BriefingCard.tsx`, `src/components/dashboard/RecommendedMoveCard.tsx`, `src/components/dashboard/ObjectiveStack.tsx`, `src/components/dashboard/PriorityAlerts.tsx`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/KNOWN_ISSUES.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`, `WORKFLOW/DECISIONS.md`, `WORKFLOW/ARCHITECTURE.md`.
- Commands that worked: `npm.cmd run build`; `git diff --check`; `rg` inspections for section wiring and broken glyphs; `git status --short`; `git diff --stat`.
- Commands that failed: `npm run build` failed because PowerShell blocked `npm.ps1`; hidden local preview launch with `Start-Process` was rejected by sandbox policy before execution.
- Prevention rule: Before changing tabs/pages, search the section model first and wire any new page through `SectionKey`, `defaultSections`, engine metrics, `ModuleRoute`, page summaries, dashboard navigation/cards, and workflow docs; use `npm.cmd run build` on this Windows/PowerShell setup when `npm.ps1` is blocked.
- Relevant skill used: `grill-with-docs`, `playwright-best-practices`, `requesting-code-review`, `supabase-postgres-best-practices`, `vercel-react-best-practices`.

## 2026-07-04 - Workflow Consolidated Into WORKFLOW Folder

- Error/problem: The workflow memory skill and memory file existed outside the requested permanent `WORKFLOW/` folder.
- Root cause: Earlier consolidation used a repo-local fallback because `.agents/skills` denied writes, before the permanent `WORKFLOW/` convention was defined.
- Fix applied: Created `WORKFLOW/SKILL.md` and consolidated the existing root `VCC_WORKFLOW_MEMORY.md` content into `WORKFLOW/VCC_WORKFLOW_MEMORY.md`; created the companion `CHANGELOG.md`, `KNOWN_ISSUES.md`, and `DECISIONS.md` files.
- Files touched: `WORKFLOW/SKILL.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`, `WORKFLOW/CHANGELOG.md`, `WORKFLOW/KNOWN_ISSUES.md`, `WORKFLOW/DECISIONS.md`.
- Commands that worked: `rg --files` to inspect existing workflow files; `Get-Content -Raw` to read existing skill and memory files; `git status --short` to inspect current repo state.
- Commands that failed: None during the consolidation edit.
- Prevention rule: Before any new task, read the full `WORKFLOW/` folder and update the matching workflow file as part of the task, not as an afterthought.
- Relevant skill used: `skill-creator`; installed project skills inspected for workflow routing.

## 2026-07-04 - Project Skill Creation Permission Block

- Error/problem: Creating `vcc-workflow-memory` under `.agents/skills` failed even after repo write access was granted.
- Root cause: `.agents/skills` has explicit Windows ACL deny rules for write/create operations from the sandbox identity.
- Fix applied: Created the skill in the repo-local fallback path `skills/vcc-workflow-memory/SKILL.md` and kept the memory file at root `VCC_WORKFLOW_MEMORY.md`; later consolidated the active workflow into `WORKFLOW/`.
- Files touched: `skills/vcc-workflow-memory/SKILL.md`, `VCC_WORKFLOW_MEMORY.md`, `WORKFLOW/SKILL.md`, `WORKFLOW/VCC_WORKFLOW_MEMORY.md`.
- Commands that worked: Bundled Python path discovery via workspace dependencies; ACL inspection with `icacls .agents\skills`.
- Commands that failed: `python ...init_skill.py` because `python` was not on PATH; quoted bundled Python command without PowerShell call operator; bundled Python initializer because `.agents/skills` denied directory creation; `quick_validate.py` because the bundled Python runtime does not have `yaml`; removing `_write_test_codex` was rejected by sandbox policy.
- Prevention rule: Check `.agents/skills` ACL/write access before trying to install project-local skills there; use PowerShell `&` before quoted executables; verify validator dependencies before relying on `quick_validate.py`; if `.agents/skills` is blocked, state the fallback path before creating files.
- Relevant skill used: `skill-creator`; project skill routing inspected for `grill-with-docs`, `playwright-best-practices`, `requesting-code-review`, `supabase-postgres-best-practices`, and `vercel-react-best-practices`.

## Entry Template

```markdown
## YYYY-MM-DD - Short Problem Name

- Error/problem:
- Root cause:
- Fix applied:
- Files touched:
- Commands that worked:
- Commands that failed:
- Prevention rule:
- Relevant skill used:
```
