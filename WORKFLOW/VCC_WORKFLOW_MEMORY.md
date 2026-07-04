# VCC Workflow Memory

Read this file before fixing errors or revisiting previously fixed areas. Never repeat a fixed mistake without checking workflow memory first.

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
