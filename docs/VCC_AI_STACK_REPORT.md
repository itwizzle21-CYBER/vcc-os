# VCC AI Stack Report

**Sprint:** 0.6 — Verify and Optimize VCC AI Environment

**Audit date:** 2026-08-12 (America/Chicago)

**Repository:** `itwizzle21-CYBER/vcc-os`
**Scope:** AI environment, integrations, skills, MCP servers, connected apps, and Git commit readiness. Application code was not modified.

## Executive summary

**Overall readiness: 86%**

The VCC AI environment is ready for normal React/Vite/TypeScript development, Supabase work, Vercel deployment, accessibility and security reviews, and Playwright automation. Six of the seven explicitly requested integrations were verified operational. Google Chrome control is the only failed core integration: the Chrome browser/profile, ChatGPT extension, and native-host registration are absent on this machine. The in-app Browser is operational and Playwright has a complete Chromium test inventory, so browser testing is not blocked.

| Readiness area | Weight | Result | Evidence summary |
|---|---:|---:|---|
| Named integrations | 50 | 43 | GitHub, Vercel, Supabase, Playwright, Browser, and Context7 passed; Chrome failed (6/7). |
| Requested skill domains | 30 | 25 | Strong coverage in 9 domains; partial coverage in TypeScript, Tailwind, Framer Motion, and financial calculations. |
| Repository/tooling | 15 | 15 | Git identity, remote, object integrity, worktree checks, lockfile, and project configs are healthy. |
| Duplication/routing hygiene | 5 | 3 | Exact duplicate names and an obsolete cached Chrome skill version need cleanup/routing rules. |
| **Total** | **100** | **86** | Production-capable with one integration repair and four specialist-skill improvements. |

## Core integration verification

| Integration | Status | Verification performed | Notes |
|---|---|---|---|
| GitHub | **Pass** | Authenticated profile lookup and repository lookup for `itwizzle21-CYBER/vcc-os`; local `origin` verified. | GitHub app is usable. Local `gh` CLI is not installed, so Actions-log and some branch/PR CLI workflows lack the recommended fallback. |
| Vercel | **Pass** | Authenticated team lookup; `.vercel/project.json` links `vcc-os`; Vercel CLI `54.20.1` is installed. | The connector is usable. `vercel whoami` timed out in the restricted shell, but connector authentication succeeded. |
| Supabase | **Pass** | Authenticated project listing; Supabase tools are callable; project has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` names in `.env.local` and `.env.example`. | Supabase CLI is not installed; the connected app covers SQL, projects, logs, advisors, and docs. No secrets were printed. |
| Playwright | **Pass** | `npx`, Playwright `1.61.1`, `playwright.config.ts`, `test:e2e`, and test discovery verified. | 78 tests were discovered across desktop/mobile Chromium projects. Tests were listed, not executed, because this sprint audits tooling rather than application behavior. |
| Browser (in-app) | **Pass** | Browser runtime selected the Codex in-app browser and returned its control API documentation. | Ready for navigation, snapshots, screenshots, console inspection, and local testing. |
| Chrome | **Fail** | Direct Chrome selection retried; installed-browser, extension, and native-host diagnostics run. | Google Chrome user data was absent; only Microsoft Edge was detected. The Chrome extension/native-host manifest is not installed or registered. Install Chrome, enable the ChatGPT browser extension under **Settings → Computer use**, or intentionally use Edge/in-app Browser. |
| Context7 | **Pass** | Both the configured standalone MCP and connected Context7 app resolved React documentation successfully. | Two working Context7 paths are redundant but currently consistent. |

## Installed MCP servers and runtime surfaces

The audit distinguishes explicit MCP configuration, plugin-declared MCP servers, and the desktop's aggregated connected-app host.

| MCP/server surface | Installation source | Runtime evidence | Status |
|---|---|---:|---|
| `codex_apps` | Codex desktop aggregate app host | 526 callable tools | Operational |
| `codex_security` | Codex Security plugin | 17 callable tools | Operational |
| `context7` | Explicit `config.toml` MCP (`@upstash/context7-mcp@latest`) | 2 callable tools | Operational |
| `node_repl` | Explicit `config.toml` native runtime | 3 callable tools | Operational; provides Browser/Chrome client transport |
| `openai_api_key_local_confirmation` | OpenAI Developers plugin | 1 callable tool | Operational |
| `notion` (embedded declaration) | Notion plugin | Routed through `codex_apps` | Operational through authenticated Notion app |

Browser and Chrome are installed as browser-control plugins/skills, not separate top-level MCP namespaces. Supabase, Vercel, GitHub, Figma, Google apps, Slack, and other connectors are routed through `codex_apps`.

## Connected apps

### Authenticated and verified

| App | Verification |
|---|---|
| Figma | Identity lookup passed |
| GitHub | Identity and current repository lookups passed |
| Gmail | Profile lookup passed |
| Google Calendar | Profile lookup passed |
| Google Drive | Profile lookup passed |
| Lovable | Identity/workspace lookup passed |
| Notion | `self` workspace lookup passed |
| Slack | Workspace listing passed |
| Supabase | Project listing passed |
| Vercel | Team listing passed |
| VIXNODE | Account lookup passed |

### Callable services or system apps (no user-auth identity required/revalidated)

| App/service | Callable tools | Audit status |
|---|---:|---|
| Context7 | 2 | Documentation lookup passed |
| Codex Document Control | 3 | Callable; no identity endpoint |
| Color Designer | 1 | Callable; no identity endpoint |
| Mobbin | 3 | Callable; no identity endpoint |
| OpenAI Platform | 3 | Callable; key setup is user-confirmed when needed |
| Plugin Management | 4 | Callable system service |
| Safety Settings | 5 | Callable system service |
| Sites | 20 | Callable; account/site ownership not revalidated |
| Hotline | 1 | Callable system service |
| Apple Health | 0 in this session | Installed resource, but no callable tool surfaced for connection verification |

### Present in the tool host but not connected

| App | Result |
|---|---|
| Atlassian Rovo | Authentication probe failed; also listed by the desktop as available but not installed |
| Base44 | Authentication probe failed |
| Linear | Authentication probe failed; also listed as a recommended but not-installed plugin |

These failed probes do not affect the seven core integrations. They should not be described as connected until authentication succeeds.

## Installed skill inventory

The filesystem contains **212 `SKILL.md` records representing 204 unique skill names**. Counts include active local skills, system skills, plugin skills, and cached plugin-version records. The desktop session may expose a smaller active catalog than the on-disk cache.

### Local agent skills (1)

- `find-skills`

### Local Codex skills (39)

- `a11y-pass`
- `Accessibility Audit`
- `animation-vocabulary`
- `chatgpt-apps`
- `component-states`
- `database-testing`
- `data-viz`
- `define-goal`
- `Design Critique & Evaluation`
- `Design Systems`
- `emil-design-eng`
- `frontend-code-review`
- `gh-address-comments`
- `gh-fix-ci`
- `jupyter-notebook`
- `linear`
- `micro-motion`
- `notion-knowledge-capture`
- `notion-meeting-intelligence`
- `notion-research-documentation`
- `pdf`
- `performance-testing`
- `playwright`
- `playwright-automation`
- `playwright-interactive`
- `release-readiness`
- `responsive-layout`
- `review-animations`
- `risk-based-testing`
- `screenshot`
- `security-best-practices`
- `security-ownership-map`
- `security-threat-model`
- `sentry`
- `speech`
- `transcribe`
- `vercel-deploy`
- `visual-testing`
- `yeet`

### System skills (6)

- `imagegen`
- `openai-docs`
- `plugin-creator`
- `review-agent`
- `skill-creator`
- `skill-installer`

### Base44 plugin (5)

- `base44-cli`
- `base44-remote-dev`
- `base44-sandbox`
- `base44-sdk`
- `base44-troubleshooter`

### Browser, Chrome, and computer-use plugins (4 records)

- `control-in-app-browser`
- `control-chrome` (current cached version)
- `control-chrome` (obsolete cached version; exact duplicate name)
- `computer-use`

### Codex Security plugin (13)

- `attack-path-analysis`
- `deep-security-scan`
- `define-security-policy`
- `finding-discovery`
- `fix-finding`
- `propose-security-hardening`
- `security-diff-scan`
- `security-scan`
- `threat-model`
- `track-findings`
- `triage-finding`
- `validation`
- `vulnerability-writeup`

### Figma plugin (12)

- `figma-code-connect`
- `figma-create-new-file`
- `figma-design-to-code`
- `figma-generate-design`
- `figma-generate-diagram`
- `figma-generate-library`
- `figma-implement-motion`
- `figma-swiftui`
- `figma-use`
- `figma-use-figjam`
- `figma-use-motion`
- `figma-use-slides`

### GitHub plugin (4)

- `gh-address-comments`
- `gh-fix-ci`
- `github`
- `yeet`

### Gmail plugin (1)

- `gmail`

### Google Calendar plugin (5)

- `google-calendar`
- `google-calendar-daily-brief`
- `google-calendar-free-up-time`
- `google-calendar-group-scheduler`
- `google-calendar-meeting-prep`

### Google Drive plugin (5)

- `google-docs`
- `google-drive`
- `google-drive-comments`
- `google-sheets`
- `google-slides`

### Notion plugin (4)

- `notion-knowledge-capture`
- `notion-meeting-intelligence`
- `notion-research-documentation`
- `notion-spec-to-implementation`

### OpenAI Developers plugin (5)

- `agents-sdk`
- `build-chatgpt-app`
- `chatgpt-app-submission`
- `openai-api-troubleshooting`
- `openai-platform-api-key`

### OpenAI Templates plugin (20)

- `artifact-template-analytics-dashboard`
- `artifact-template-business-review`
- `artifact-template-design-report`
- `artifact-template-experiment-analysis`
- `artifact-template-financial-budget`
- `artifact-template-investment-committee-memo`
- `artifact-template-legal-memorandum`
- `artifact-template-market-trends-report`
- `artifact-template-minimal-letterhead`
- `artifact-template-operating-calendar`
- `artifact-template-operating-review`
- `artifact-template-project-kickoff`
- `artifact-template-project-tracker`
- `artifact-template-sales-pipeline`
- `artifact-template-simple-dark-mode`
- `artifact-template-simple-light-mode`
- `artifact-template-strategy-memorandum`
- `artifact-template-system-design`
- `artifact-template-team-alignment`
- `artifact-template-three-statement-forecast`

### Product Design plugin (10)

- `audit`
- `design-qa`
- `get-context`
- `ideate`
- `image-to-code`
- `index`
- `research`
- `share`
- `url-to-code`
- `user-context`

### Remotion plugin (12)

- `remotion-best-practices`
- `remotion-captions`
- `remotion-create`
- `remotion-docs`
- `remotion-interactivity`
- `remotion-maps`
- `remotion-markup`
- `remotion-multimedia`
- `remotion-render`
- `remotion-saas`
- `remotion-studio`
- `remotion-upgrade`

### Supabase plugin (2)

- `supabase`
- `supabase-postgres-best-practices`

### Vercel plugin (54)

- `agent-browser`
- `agent-browser-verify`
- `ai-elements`
- `ai-gateway`
- `ai-generation-persistence`
- `ai-sdk`
- `auth`
- `bootstrap`
- `cdn-caching`
- `chat-sdk`
- `cms`
- `cron-jobs`
- `deployments-cicd`
- `email`
- `env-vars`
- `eve`
- `geist`
- `geistdocs`
- `investigation-mode`
- `json-render`
- `knowledge-update`
- `marketplace`
- `micro`
- `microfrontends`
- `ncc`
- `next-cache-components`
- `next-forge`
- `nextjs`
- `next-upgrade`
- `observability`
- `payments`
- `react-best-practices`
- `routing-middleware`
- `runtime-cache`
- `satori`
- `shadcn`
- `sign-in-with-vercel`
- `swr`
- `turbopack`
- `turborepo`
- `v0-dev`
- `vercel-agent`
- `vercel-api`
- `vercel-cli`
- `vercel-connect`
- `vercel-firewall`
- `vercel-flags`
- `vercel-functions`
- `vercel-queues`
- `vercel-sandbox`
- `vercel-services`
- `vercel-storage`
- `verification`
- `workflow`

### Other plugin/runtime skills (10)

- Documents: `documents`
- PDF: `pdf`
- Presentations: `Presentations`
- Sites: `sites-building`, `sites-hosting`
- Slack: `slack`
- Spreadsheets: `excel-live-control`, `Spreadsheets`
- Template Creator: `template-creator`
- Visualize: `visualize`
- Lovable: no skill file (app tools only)
- Context7: no skill file (app/MCP tools only)

## Duplicate and conflicting skills

### Exact duplicate names

| Skill name | Copies | Assessment | Recommendation |
|---|---:|---|---|
| `control-chrome` | 2 | Two plugin cache versions (`26.730.61639` and `26.803.61601`). Only the current version is cataloged, but filesystem audits see both. | Remove the obsolete plugin cache through normal Codex/plugin update cleanup; do not delete cache folders manually while Codex is running. |
| `gh-address-comments` | 2 | Local and GitHub-plugin copies overlap. | Prefer `github:gh-address-comments`; archive the local copy after confirming no custom rules are needed. |
| `gh-fix-ci` | 2 | Local and GitHub-plugin copies overlap. | Prefer `github:gh-fix-ci`. |
| `notion-knowledge-capture` | 2 | Local and Notion-plugin copies overlap. | Prefer the namespaced Notion plugin. |
| `notion-meeting-intelligence` | 2 | Local and Notion-plugin copies overlap. | Prefer the namespaced Notion plugin. |
| `notion-research-documentation` | 2 | Local and Notion-plugin copies overlap. | Prefer the namespaced Notion plugin. |
| `pdf` | 2 | Local and primary-runtime copies overlap. | Prefer the primary-runtime `pdf:pdf` skill for document-runtime compatibility. |
| `yeet` | 2 | Local and GitHub-plugin publish workflows overlap. | Prefer `github:yeet`; both require explicit publish authorization. |

### Functional overlap requiring routing discipline

- `playwright`, `playwright-automation`, `playwright-interactive`, `agent-browser`, `agent-browser-verify`, Browser, and Chrome all automate browsers. Use Browser/Chrome for user-session UI control, `playwright` for CLI browser work, and `playwright-automation` only when test code is explicitly requested.
- Local security skills and the Codex Security plugin overlap. Use the Codex Security workflow for scans/findings and local skills for framework guidance or repository ownership/threat-model artifacts.
- `vercel-deploy`, `deployments-cicd`, `vercel-cli`, `vercel-api`, and `verification` overlap. Route by intent: deploy, CI/CD guidance, CLI operations, connected-account API work, or end-to-end verification.
- Context7 exists as both a standalone MCP and an app. Both passed the same resolution test; keep the standalone MCP as the primary docs path and the app as a fallback, or remove one to reduce surface area.

No conflicting instruction changed application behavior during this sprint.

## Domain coverage and recommendations

The skills registry ranks packages by anonymous install telemetry and recommends checking source reputation and security before installation. Existing official/plugin coverage should be preferred over adding duplicates.

| Domain | Current coverage | Gap | Recommendation |
|---|---|---|---|
| React | `vercel:react-best-practices`, `frontend-code-review`, component/design skills | None material | Keep current Vercel skill. Do not install another generic React best-practices duplicate. |
| Next.js | `vercel:nextjs`, `next-cache-components`, `next-upgrade`, `next-forge` | Project currently uses Vite, not Next.js | Keep installed skills dormant until a Next.js project is in scope. |
| TypeScript | Frontend review and React/Next skills include TS patterns | No dedicated strictness/API-modeling skill | Add or create a vetted `typescript-strictness` skill covering strict compiler options, branded/domain types, exhaustive checks, safe parsing, and type-level tests. |
| Tailwind | `vercel:shadcn`, design-system/responsive/a11y skills; project uses Tailwind 3.4 | No dedicated Tailwind v3/v4 migration and class-quality skill | Add or create a `tailwind-css` skill focused on v3/v4 differences, tokenization, responsive variants, class merging, and purge/content safety. |
| shadcn/ui | `vercel:shadcn` | None | Keep current official Vercel plugin skill. |
| Framer Motion | `figma-implement-motion`, `micro-motion`, `review-animations`, `animation-vocabulary` | No Framer Motion API/lifecycle skill | Add or create a vetted `framer-motion` skill covering Motion APIs, layout animations, `AnimatePresence`, reduced motion, performance, and cleanup. |
| Supabase | Official `supabase` skill and authenticated app | CLI absent | Current app coverage is sufficient; optionally install Supabase CLI for local migrations and offline workflows. |
| PostgreSQL | Official `supabase-postgres-best-practices`, `database-testing` | No vendor-neutral operational connector | Current skill coverage is strong. Optionally install the recommended **Neon Postgres** plugin only if direct Neon/database operations are needed. |
| Vercel | 54 plugin skills, authenticated app, linked project, CLI | None material | Do not add more general Vercel skills; reduce overlap instead. |
| Accessibility | `Accessibility Audit`, `a11y-pass`, responsive/design review, Axe-based Playwright test | None material | Keep and formalize WCAG 2.2 AA as a release gate. |
| Security | Local security skills plus 13 Codex Security workflows and Vercel Firewall | No monitoring connector | Skill coverage is strong. Consider the recommended **Sentry** plugin for operational error data; the local Sentry skill alone is not a live connection. |
| Performance | `performance-testing`, Vercel observability/caching/optimization guidance, Playwright | No product analytics connector | Keep existing skills; consider the recommended **PostHog** plugin if real-user product analytics is desired. |
| Financial calculations | Financial-budget/forecast templates and application tests | No dedicated calculation correctness skill | Create a project-specific `financial-calculations` skill. Require decimal-safe arithmetic, explicit currency/rounding policy, amortization formulas, double-entry invariants, reconciliation, boundary/property tests, and reproducible fixtures. Do not install an unknown finance skill without source review. |

### Recommended additions, in priority order

1. **Project-specific `financial-calculations` skill** — highest value for VCC OS and not adequately covered by templates.
2. **Dedicated TypeScript strictness/domain-modeling skill** — improves correctness at financial boundaries.
3. **Dedicated Framer Motion skill** — install only when Framer Motion becomes a dependency.
4. **Dedicated Tailwind v3/v4 skill** — useful before a Tailwind major-version migration.
5. **Sentry plugin** — live production error context; complements the installed local Sentry skill.
6. **PostHog plugin** — product/performance analytics if VCC needs real-user evidence.
7. **Neon Postgres plugin** — only if VCC adds Neon or needs a second Postgres operational surface beyond Supabase.

Do not add more React, Next.js, shadcn/ui, Supabase, PostgreSQL-best-practice, Vercel, accessibility, security-audit, or generic performance skills until exact duplicates are reduced.

## Missing or degraded components

- Google Chrome and its ChatGPT extension/native-host integration are missing.
- GitHub CLI (`gh`) is missing; the GitHub app works, but some Actions and branch/PR fallback workflows expect `gh`.
- Supabase CLI is missing; the authenticated app is sufficient for many remote operations.
- Dedicated TypeScript, Tailwind, Framer Motion, and financial-calculation skills are missing.
- Atlassian Rovo, Base44, and Linear tools are present but not authenticated.
- The standalone Context7 MCP uses an unpinned `@latest` package, reducing reproducibility.

## Git repository health and commit readiness

| Check | Result |
|---|---|
| Branch/upstream | `main` tracking `origin/main` |
| Remote | `https://github.com/itwizzle21-CYBER/vcc-os.git` |
| Git user identity | Name and email configured |
| Object integrity | `git fsck --no-dangling` passed |
| Whitespace/error check | `git diff --check` passed before report creation |
| Initial worktree | Clean |
| Dependency lock | `package-lock.json` present |
| Commit blocker found | None in Git; the managed desktop sandbox cannot write `.git/index.lock`, while an approved outside-sandbox `git add --dry-run` succeeded |

No Git settings or repository internals required repair. The initial dry-run staging check failed only because this task's managed filesystem grants read-only access to `.git`; the same `git add --dry-run` succeeded outside that sandbox, confirming the repository itself can stage and commit normally. No Git configuration was changed. This report is the only workspace change made by Sprint 0.6. It has not been staged or committed because the sprint requested commit readiness and issue repair, not publication.

## Remediation plan

1. Repair Chrome only if Chrome-specific control is required: install Google Chrome, install/enable the ChatGPT extension from **Settings → Computer use**, then re-run the Chrome selection test.
2. Decide whether to keep both Context7 paths. Pin the standalone MCP package version if reproducibility matters.
3. Remove or archive duplicate local GitHub, Notion, PDF, and publish skills after comparing any local customizations.
4. Create the VCC-specific financial-calculations skill before expanding financial features.
5. Add TypeScript/Tailwind/Framer Motion skills only when their specific gaps enter active sprint scope.
6. Optionally install `gh` and Supabase CLI for CLI fallback coverage.

## Audit commands and evidence boundaries

Read-only checks included Git status/remotes/config/fsck/diff checks; executable discovery and version checks; `package.json`, Vercel link, Playwright config/test discovery, environment-variable-name inspection, skill/plugin filesystem inventory, MCP tool/resource inventory, authenticated connector identity/list calls, Context7 resolution, and Browser/Chrome diagnostics. Secret values, access tokens, private project names, and personal profile details were not included in this report.
