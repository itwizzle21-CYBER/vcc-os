# VCC AI Stack Report

Sprint 0.6 verified the Codex AI environment for VCC-OS without modifying application source code.

Audit date: 2026-07-15  
Repository: `C:\Users\itwiz\Downloads\VCC-OS`  
Branch: `main`  
Remote: `https://github.com/itwizzle21-CYBER/vcc-os.git`

## Overall Readiness Score

**86%**

The environment is strong for React/Vite work, UI craft, accessibility, financial QA, Vercel deployment checks, Supabase/PostgreSQL support, Context7 documentation lookup, connector-backed GitHub repo access, and local build/test verification. The score is held back by missing local GitHub and Supabase CLIs, Chrome extension/native-host setup, inactive Supabase project state, and some overlapping skills that need routing discipline.

## Verification Evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Local tests | Pass | `npm test` ran Vitest: 4 files, 12 tests passed. |
| Production build | Pass | `npm run build` completed TypeScript check and Vite production build. |
| GitHub | Connector verified for repo access | GitHub app returned repo `itwizzle21-CYBER/vcc-os` with admin/push permissions. Local `gh` CLI is not installed, so PR automation via CLI is unavailable. Installed-account listing returned empty, so broad account discovery is weak. |
| Vercel | Verified and linked | `.vercel/project.json` points to `vcc-os`; Vercel returned project `prj_ZSUV6VGFxLlyLQCUAwATsFOQce78` and ready production deployment `vcc-bvve0ru7h-crlzel.vercel.app`. Local Vercel CLI returned `54.20.1`. |
| Supabase | Connector verified, project inactive | Supabase returned project `vcc-os-production`, ref `awwkueiavctldiehlige`, region `us-east-2`, PostgreSQL 17, status `INACTIVE`. Local `supabase` CLI is not installed. |
| Playwright | Usable via project/CLI path | `npx playwright --version` returned `1.61.1`. |
| Browser | Verified | In-app Browser selected successfully and returned API documentation. |
| Chrome | Not currently usable | Chrome extension backend returned `Browser is not available: extension`; diagnostics show missing native host manifest and no Chrome user-data directory at the expected path. |
| Context7 | Verified | Resolved React docs to `/reactjs/react.dev` and returned current React documentation snippets. |
| Base44 | Verified | Base44 returned VCC apps, including `VCC-OS` id `6a504063c7fb241237db000a`. |
| OpenAI Platform | Verified | Returned `Personal` organization and default project API-key target. |

## Installed Skills

### System and Personal

- `imagegen`
- `openai-docs`
- `plugin-creator`
- `skill-creator`
- `skill-installer`
- `find-skills`

### User-Installed Product, UI, QA, Security, and Git

- `Accessibility Audit`
- `Design Critique & Evaluation`
- `Design Systems`
- `a11y-pass`
- `animation-vocabulary`
- `component-states`
- `data-viz`
- `database-testing`
- `emil-design-eng`
- `frontend-code-review`
- `gh-address-comments`
- `gh-fix-ci`
- `micro-motion`
- `pdf`
- `performance-testing`
- `playwright`
- `playwright-automation`
- `playwright-interactive`
- `release-readiness`
- `remotion:remotion-best-practices`
- `responsive-layout`
- `review-animations`
- `risk-based-testing`
- `screenshot`
- `security-best-practices`
- `security-ownership-map`
- `security-threat-model`
- `vercel-deploy`
- `visual-testing`
- `visualize:visualize`
- `yeet`

### Base44

- `base44:base44-cli`
- `base44:base44-sdk`
- `base44:base44-troubleshooter`

### Browser, Chrome, and Local Control

- `browser:control-in-app-browser`
- `chrome:control-chrome`
- `computer-use:computer-use`

### Codex Security

- `codex-security:attack-path-analysis`
- `codex-security:deep-security-scan`
- `codex-security:finding-discovery`
- `codex-security:fix-finding`
- `codex-security:propose-security-hardening`
- `codex-security:security-diff-scan`
- `codex-security:security-scan`
- `codex-security:threat-model`
- `codex-security:track-findings`
- `codex-security:triage-finding`
- `codex-security:validation`
- `codex-security:vulnerability-writeup`

### Documents, Spreadsheets, Presentations, and PDF

- `documents:documents`
- `pdf:pdf`
- `presentations:Presentations`
- `spreadsheets:Spreadsheets`
- `spreadsheets:excel-live-control`
- `template-creator:template-creator`

### Figma and Product Design

- `figma:figma-code-connect`
- `figma:figma-create-new-file`
- `figma:figma-generate-design`
- `figma:figma-generate-diagram`
- `figma:figma-generate-library`
- `figma:figma-implement-motion`
- `figma:figma-swiftui`
- `figma:figma-use`
- `figma:figma-use-figjam`
- `figma:figma-use-motion`
- `figma:figma-use-slides`
- `product-design:audit`
- `product-design:ideate`
- `product-design:image-to-code`
- `product-design:index`
- `product-design:url-to-code`

### GitHub

- `github:github`
- `github:gh-address-comments`
- `github:gh-fix-ci`
- `github:yeet`

### OpenAI Developers

- `openai-developers:agents-sdk`
- `openai-developers:build-chatgpt-app`
- `openai-developers:chatgpt-app-submission`
- `openai-developers:openai-api-troubleshooting`
- `openai-developers:openai-platform-api-key`

### Supabase

- `supabase:supabase`
- `supabase:supabase-postgres-best-practices`

### Sites

- `sites:sites-building`
- `sites:sites-hosting`

### Vercel

- `vercel:agent-browser`
- `vercel:agent-browser-verify`
- `vercel:ai-elements`
- `vercel:ai-gateway`
- `vercel:ai-generation-persistence`
- `vercel:ai-sdk`
- `vercel:auth`
- `vercel:bootstrap`
- `vercel:chat-sdk`
- `vercel:cms`
- `vercel:cron-jobs`
- `vercel:deployments-cicd`
- `vercel:email`
- `vercel:env-vars`
- `vercel:geist`
- `vercel:geistdocs`
- `vercel:investigation-mode`
- `vercel:json-render`
- `vercel:marketplace`
- `vercel:micro`
- `vercel:ncc`
- `vercel:next-forge`
- `vercel:nextjs`
- `vercel:observability`
- `vercel:payments`
- `vercel:react-best-practices`
- `vercel:routing-middleware`
- `vercel:runtime-cache`
- `vercel:satori`
- `vercel:shadcn`
- `vercel:sign-in-with-vercel`
- `vercel:swr`
- `vercel:turbopack`
- `vercel:turborepo`
- `vercel:v0-dev`
- `vercel:vercel-agent`
- `vercel:vercel-api`
- `vercel:vercel-cli`
- `vercel:vercel-firewall`
- `vercel:vercel-flags`
- `vercel:vercel-functions`
- `vercel:vercel-queues`
- `vercel:vercel-sandbox`
- `vercel:vercel-services`
- `vercel:vercel-storage`
- `vercel:verification`
- `vercel:workflow`

## Installed MCPs and Tool Namespaces

| MCP/tool namespace | Status | Notes |
| --- | --- | --- |
| `mcp__codex_apps__github` | Installed and repo-verified | Repo lookup works for `itwizzle21-CYBER/vcc-os`; account/installations listing returned empty. |
| `mcp__codex_apps__vercel` | Installed and connected | Project and latest deployment lookup succeeded. |
| `mcp__codex_apps__supabase` | Installed and connected | Project listing succeeded; VCC project is inactive. |
| `mcp__codex_apps__base44` | Installed and connected | VCC apps are visible. |
| `mcp__codex_apps__openai_platform` | Installed and connected | API key target listing succeeded. |
| `mcp__codex_apps__context7` | Installed | App-flavored Context7 docs tools are discoverable. |
| `mcp__context7` | Installed and connected | Direct Context7 docs tools resolved and queried React docs. |
| `mcp__node_repl` | Installed and connected | Used to initialize the in-app Browser runtime. |
| `mcp__codex_apps__codex_document_control` | Installed | Spreadsheet/document-control session tools are discoverable. |
| `mcp__codex_apps__figma` | Installed | Figma design tools are discoverable; not exercised because no Figma file was in scope. |
| `mcp__codex_apps__mobbin` | Installed | Design-reference search tools are discoverable; not exercised because no design reference request was in scope. |
| `mcp__codex_security` | Installed | Security workflow tools are discoverable. |
| `codex_app` | Installed | Local Codex thread/project management tools are discoverable. |

## Connected Apps

| App | Status | Verification result |
| --- | --- | --- |
| GitHub | Connected for repo metadata | Current repo is visible with admin/push permissions; broad installed-account discovery returned no accounts. |
| Vercel | Connected | VCC-OS project and ready production deployment are visible. |
| Supabase | Connected, project inactive | VCC project is visible but inactive; restore before SQL/advisor verification. |
| Base44 | Connected | VCC-OS Base44 apps are visible. |
| OpenAI Platform | Connected | Organization/project targets are visible. |
| Context7 | Connected | React docs lookup succeeded. |
| Browser | Connected | In-app Browser selected successfully. |
| Chrome | Installed but not connected | Extension backend unavailable; native host manifest missing. |
| Figma | Tools installed | Not live-verified because no target file was provided. |
| Mobbin | Tools installed | Not live-verified because no design search was requested. |
| Codex Document Control | Tools installed | Not live-verified because no active workbook/document session was requested. |

## Missing or Weak Areas

- Chrome needs setup: reinstall or enable the ChatGPT Chrome Extension and native host from the plugin UI. Current diagnostics report missing native host manifest at `C:\Users\itwiz\AppData\Local\OpenAI\extension\com.openai.codexextension.json`.
- Supabase project `vcc-os-production` is inactive. Restore it before database-level verification, SQL checks, type generation, or advisors.
- PowerShell blocks the `npx.ps1` shim. Use `npx.cmd` directly, or adjust local execution policy if desired.
- GitHub is partially verified: direct repo access works, but installation/account listing returned empty. This may affect workflows that need repo discovery rather than a known repo name.
- No dedicated financial-calculation skill is installed. Current financial validation is covered by testing, spreadsheet, risk, and data-viz skills.

## Duplicate or Conflicting Skills

| Area | Type | Assessment |
| --- | --- | --- |
| PDF | Name overlap | User `pdf` and bundled `pdf:pdf` overlap. Prefer `pdf:pdf` for rendered layout checks. |
| GitHub workflows | Domain overlap | Local `gh-*`/`yeet` skills overlap with plugin `github:*` skills. Prefer plugin skills for connector-backed PR/repo work and local skills for CLI-only workflows. |
| Security | Domain overlap | Local security skills overlap with Codex Security plugin skills. Prefer Codex Security for formal scans and local skills for lightweight reviews. |
| Playwright | Domain overlap | `playwright`, `playwright-interactive`, and `playwright-automation` are complementary; choose CLI, interactive debugging, or test authoring based on task. |
| Accessibility | Domain overlap | `a11y-pass` and `Accessibility Audit` overlap; use `a11y-pass` for shipping fixes and `Accessibility Audit` for formal WCAG review. |
| Design review | Domain overlap | `Design Critique`, `emil-design-eng`, product-design, Mobbin, and Figma skills overlap. This is useful but should be routed by artifact: code, screenshot, reference, or Figma file. |
| Context7 | Namespace overlap | Both `mcp__codex_apps__context7` and `mcp__context7` are available. Prefer `mcp__context7` for direct docs lookup unless an app-specific flow is needed. |

No exact duplicate local skill folder names were detected from the available skill registry.

## Recommended Additions

| Category | Recommendation | Why |
| --- | --- | --- |
| React | Keep using `frontend-code-review` and `vercel:react-best-practices`. | Strong coverage already exists. |
| Next.js | Keep `vercel:nextjs`; add no extra skill until VCC-OS actually migrates from Vite to Next.js. | Current app is React/Vite, while Next.js support is available when needed. |
| TypeScript | Add a dedicated TypeScript strictness/refactoring skill if a reputable one is found. | Existing coverage is mostly review-oriented. |
| Tailwind | Add a Tailwind-specific design-token/style-system skill if available. | Current coverage is contextual through frontend and responsive skills. |
| shadcn/ui | Keep `vercel:shadcn` and `frontend-code-review`. | Strong coverage already exists. |
| Framer Motion | Consider a dedicated Framer Motion implementation skill. | Motion review skills are strong, but implementation-specific coverage would help. |
| Supabase | Keep `supabase:supabase`; restore the inactive project. | Connector and guidance are present; project state is the blocker. |
| PostgreSQL | Keep `supabase:supabase-postgres-best-practices` and `database-testing`. | Strong coverage already exists. |
| Vercel | Keep Vercel plugin skills and `vercel-deploy`. | Project is linked and deployment lookup works. |
| Accessibility | Keep `a11y-pass`, `Accessibility Audit`, and `frontend-code-review`. | Strong coverage already exists. |
| Security | Keep Codex Security and local security skills; rely on GitHub repo lookup by explicit repo name. | Good coverage, with partial GitHub discovery weakness. |
| Performance | Keep `performance-testing`, `vercel:observability`, and `vercel:verification`. | Strong coverage for local and deployed checks. |
| Financial calculations | Add a dedicated finance/math validation skill or build a local VCC calculation-audit skill. | VCC-OS depends on precise financial math and currently has only general QA/risk/spreadsheet support. |

## Git Repository Health

- `git status --short --branch` succeeded.
- Current branch: `main`.
- Branch was ahead of `origin/main` by 9 commits before this cleanup/report update.
- Remote is configured correctly.
- Existing untracked directory `.codex-audit/` contained old audit screenshots and was removed during cleanup.
- Obsolete root-level React modules were removed after confirming the active Vite entry imports `src/App.tsx`.
- No Git ACL or lock-file issue was observed during this Sprint 0.6 verification pass.

## Readiness Summary

VCC-OS has a capable AI-assisted engineering environment. The immediate priorities are:

1. Repair Chrome plugin/native-host setup if Chrome-profile automation is needed.
2. Restore Supabase `vcc-os-production` before database checks.
3. Use `npx.cmd` on Windows for Playwright/Node one-off commands.
4. Consider adding a dedicated financial calculation validation skill.
5. Keep connector routing explicit where overlapping skills exist.
