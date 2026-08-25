# VCC AI Stack Report

**Sprint:** 0.6 — Verify and Optimize VCC AI Environment

**Audit date:** 2026-08-24 (America/Chicago)

**Repository:** `itwizzle21-CYBER/vcc-os`

**Audited branch/HEAD:** `codex/backlog-fix-sprint` / `79d6449d`

**Scope:** Skills, MCP servers, connected apps, named integrations, conflicts, recommendations, and Git commit readiness. Application code was not modified.

## Executive summary

**Overall readiness: 94%**

The VCC AI environment is ready for normal React/Vite/TypeScript development. GitHub, Supabase, Playwright, the in-app Browser, and Context7 passed live checks. The recommended TypeScript, Tailwind, and interaction-design skills are installed, as are optional GitHub and Supabase CLIs. Vercel remains usable through its authenticated CLI and valid workspace link, although the connected Vercel app cannot see that project. Google Chrome is now installed, but Chrome control remains incomplete until its profile and ChatGPT extension/native host are enabled through **Settings → Computer use**.

| Readiness area | Weight | Score | Evidence |
| --- | ---: | ---: | --- |
| Seven named integrations | 35 | 31 | Five pass; Vercel is operational with app degradation, and Chrome is installed but its control bridge is incomplete. |
| Requested skill-domain coverage | 30 | 30 | All recommended skill additions are installed. |
| MCP and app connectivity | 20 | 19 | Five MCP namespaces and 15 authenticated apps; Vercel app project scope is incomplete. |
| Git and local tooling | 10 | 10 | Repository connectivity, identity, index locking, and object connectivity pass. |
| Duplication/routing hygiene | 5 | 4 | Duplicate bare names are namespaced or stale-cache copies. |
| **Total** | **100** | **94** | High readiness with two connector setup actions remaining. |

## Installed

### Named integration verification

| Integration | Result | Evidence | Required action |
| --- | --- | --- | --- |
| GitHub | **Pass** | The GitHub app fetched `itwizzle21-CYBER/vcc-os`; local `origin` points to the same repository. GitHub CLI `2.98.0` is installed and executable. | Run `gh auth login` only when CLI-authenticated GitHub workflows are needed. |
| Vercel | **Pass; app degraded** | CLI `54.20.1` authenticated as `itwizzle21-cyber`; project inspection found `crlzel/vcc-os`; `.vercel/project.json` has a valid link. | Reauthorize the Vercel app's project scope: team lookup passes, but project listing is empty and direct lookup returns 404. Use the CLI meanwhile. |
| Supabase | **Pass** | The app is authenticated; the project referenced by `VITE_SUPABASE_URL` was fetched; URL and public-client key variables are configured. Supabase CLI `2.115.0` is installed and executable. | None. |
| Playwright | **Pass** | `npx` is available; Playwright `1.61.1`; discovery found **108 tests** in two files across desktop/mobile Chromium; one desktop smoke test passed. | None. |
| Browser (in-app) | **Pass** | The Codex in-app Browser connected and returned its supported control API. | None. |
| Chrome | **Partial** | Google Chrome `151.0.7922.174` is installed. No Chrome profile, ChatGPT extension connection, or native-host registration exists yet. | Launch Chrome once, then install/enable the ChatGPT browser extension in **Settings → Computer use**. Reinstall the Browser plugin through the UI if native-host checks still fail. |
| Context7 | **Pass** | The standalone MCP resolved React documentation. | Prefer it over the duplicate Context7 app route. |

### Installed MCP servers

Five active MCP namespaces expose **554 callable MCP tools**.

| MCP namespace | Tools | Source/role | Status |
| --- | ---: | --- | --- |
| `codex_apps` | 529 | Aggregated connected-app host | Operational |
| `codex_security` | 19 | Managed security scans | Operational |
| `context7` | 2 | Explicit documentation MCP | Operational; live check passed |
| `node_repl` | 3 | Browser/Chrome runtime | Operational; Browser passed |
| `openai_api_key_local_confirmation` | 1 | Local API-key write confirmation | Operational |

Explicit user-configured MCP entries are `node_repl` and `context7`. Supabase, GitHub, and Vercel are routed through `codex_apps`, not separate top-level MCP namespaces.

### Connected apps

These **15 external apps were live-verified** with read-only identity, account, workspace, team, project, or repository calls. Account emails and IDs are omitted.

| App | Result |
| --- | --- |
| Atlassian Rovo | Connected after the requested authentication retry |
| Base44 | Connected |
| Figma | Connected |
| GitHub | Connected; VCC repository accessible |
| Gmail | Connected |
| Google Calendar | Connected |
| Google Drive | Connected |
| Linear | Connected |
| Lovable | Connected |
| Notion | Connected |
| Sites | Connected |
| Slack | Connected |
| Supabase | Connected; configured VCC project accessible |
| Vercel | Connected at team level; linked project not visible to app connector |
| VIXNODE | Connected |

Additional callable app/system services without a separate external-account identity check are Codex Document Control, Codex Security Access, Color Designer, Context7 app tools, Hotline, Mobbin, OpenAI Platform, Plugin Management, and Safety Settings.

### Installed skill inventory

The filesystem contains **208 `SKILL.md` records**. Cached templates, inactive helpers, and one obsolete Chrome cache copy may remain on disk without being exposed as active session skills. Newly installed skills become available to Codex in a fresh task/session.

#### Artifact templates (20)

`artifact-template-analytics-dashboard`, `artifact-template-business-review`, `artifact-template-design-report`, `artifact-template-experiment-analysis`, `artifact-template-financial-budget`, `artifact-template-investment-committee-memo`, `artifact-template-legal-memorandum`, `artifact-template-market-trends-report`, `artifact-template-minimal-letterhead`, `artifact-template-operating-calendar`, `artifact-template-operating-review`, `artifact-template-project-kickoff`, `artifact-template-project-tracker`, `artifact-template-sales-pipeline`, `artifact-template-simple-dark-mode`, `artifact-template-simple-light-mode`, `artifact-template-strategy-memorandum`, `artifact-template-system-design`, `artifact-template-team-alignment`, `artifact-template-three-statement-forecast`

#### Base44 (5)

`base44-cli`, `base44-remote-dev`, `base44-sandbox`, `base44-sdk`, `base44-troubleshooter`

#### Codex Security (13)

`attack-path-analysis`, `deep-security-scan`, `define-security-policy`, `finding-discovery`, `fix-finding`, `propose-security-hardening`, `security-diff-scan`, `security-scan`, `threat-model`, `track-findings`, `triage-finding`, `validation`, `vulnerability-writeup`

#### Codex system (6)

`imagegen`, `openai-docs`, `plugin-creator`, `review-agent`, `skill-creator`, `skill-installer`

#### Figma (12)

`figma-code-connect`, `figma-create-new-file`, `figma-design-to-code`, `figma-generate-design`, `figma-generate-diagram`, `figma-generate-library`, `figma-implement-motion`, `figma-swiftui`, `figma-use`, `figma-use-figjam`, `figma-use-motion`, `figma-use-slides`

#### Google Drive (5)

`google-docs`, `google-drive`, `google-drive-comments`, `google-sheets`, `google-slides`

#### Notion (4)

`notion-knowledge-capture`, `notion-meeting-intelligence`, `notion-research-documentation`, `notion-spec-to-implementation`

#### OpenAI bundled (7 records)

`computer-use`, `control-chrome` (two identical cached versions), `control-in-app-browser`, `sites-building`, `sites-hosting`, `visualize`

#### OpenAI Developers (5)

`agents-sdk`, `build-chatgpt-app`, `chatgpt-app-submission`, `openai-api-troubleshooting`, `openai-platform-api-key`

#### OpenAI primary runtime (6)

`documents`, `excel-live-control`, `pdf`, `Presentations`, `Spreadsheets`, `template-creator`

#### Plugin Management (1)

`plugin-management`

#### Product Design (10)

`audit`, `design-qa`, `get-context`, `ideate`, `image-to-code`, `index`, `research`, `share`, `url-to-code`, `user-context`

#### Remotion (12)

`remotion-best-practices`, `remotion-captions`, `remotion-create`, `remotion-docs`, `remotion-interactivity`, `remotion-maps`, `remotion-markup`, `remotion-multimedia`, `remotion-render`, `remotion-saas`, `remotion-studio`, `remotion-upgrade`

#### Supabase (2)

`supabase`, `supabase-postgres-best-practices`

#### User agent skills (1)

`find-skills`

#### User Codex skills (44)

`a11y-pass`, `Accessibility Audit`, `animation-vocabulary`, `chatgpt-apps`, `component-states`, `core-web-vitals`, `data-viz`, `database-testing`, `define-goal`, `Design Critique & Evaluation`, `Design Systems`, `emil-design-eng`, `frontend-code-review`, `gh-address-comments`, `gh-fix-ci`, `interaction-design`, `jupyter-notebook`, `linear`, `micro-motion`, `notion-knowledge-capture`, `notion-meeting-intelligence`, `notion-research-documentation`, `pdf`, `performance`, `performance-testing`, `playwright`, `playwright-automation`, `playwright-interactive`, `release-readiness`, `responsive-layout`, `review-animations`, `risk-based-testing`, `screenshot`, `security-best-practices`, `security-ownership-map`, `security-threat-model`, `sentry`, `speech`, `tailwind-design-system`, `transcribe`, `typescript-advanced-types`, `vercel-deploy`, `visual-testing`, `yeet`

#### Vercel (54)

`agent-browser`, `agent-browser-verify`, `ai-elements`, `ai-gateway`, `ai-generation-persistence`, `ai-sdk`, `auth`, `bootstrap`, `cdn-caching`, `chat-sdk`, `cms`, `cron-jobs`, `deployments-cicd`, `email`, `env-vars`, `eve`, `geist`, `geistdocs`, `investigation-mode`, `json-render`, `knowledge-update`, `marketplace`, `micro`, `microfrontends`, `ncc`, `next-cache-components`, `next-forge`, `next-upgrade`, `nextjs`, `observability`, `payments`, `react-best-practices`, `routing-middleware`, `runtime-cache`, `satori`, `shadcn`, `sign-in-with-vercel`, `swr`, `turbopack`, `turborepo`, `v0-dev`, `vercel-agent`, `vercel-api`, `vercel-cli`, `vercel-connect`, `vercel-firewall`, `vercel-flags`, `vercel-functions`, `vercel-queues`, `vercel-sandbox`, `vercel-services`, `vercel-storage`, `verification`, `workflow`

#### Workspace (1)

`vcc-financial-calculations`

## Missing or degraded

- **Chrome control bridge:** Chrome is installed, but its profile, ChatGPT extension connection, and native-host setup are not yet present.
- **Vercel app project scope:** team authentication passes, but project listing is empty and the linked project returns 404. The CLI works.
- **GitHub CLI authentication:** `gh` is installed and executable but has no CLI login. Git and the GitHub app already work.
- **Workspace `.mcp.json`:** absent; not a blocker because Supabase is routed through `codex_apps`.

## Recommended

No broad plugin installation is recommended.

| Domain | Installed coverage | Recommendation |
| --- | --- | --- |
| React | `vercel:react-best-practices`, `frontend-code-review` | **No addition.** Use the Vercel reviewer as primary. |
| Next.js | `vercel:nextjs`, cache, upgrade, and next-forge skills | **No addition.** VCC uses Vite. |
| TypeScript | Frontend review, repository typecheck, and `typescript-advanced-types` | **Installed.** Use the advanced-types skill when domain modeling warrants it. |
| Tailwind | `vercel:shadcn`, design, responsive, a11y, and `tailwind-design-system` | **Installed.** Its v4-specific guidance should be applied selectively while VCC remains on Tailwind `3.4.15`. |
| shadcn/ui | `vercel:shadcn` | **No addition.** |
| Framer Motion | Figma motion, local animation skills, and `interaction-design` | **Installed.** Use it when Motion/Framer Motion enters active scope. |
| Supabase | Official skill, connected app, and CLI `2.115.0` | **No addition.** |
| PostgreSQL | Supabase Postgres best practices and database testing | **No addition.** |
| Vercel | 54 Vercel skills, working CLI/link, app | **No addition.** Repair app scope. |
| Accessibility | WCAG audit/fix, responsive, Playwright | **No addition.** |
| Security | Local security skills plus managed Codex Security | **No generic addition.** |
| Performance | Performance, Core Web Vitals, load testing, Vercel skills | **No addition.** |
| Financial calculations | Workspace `vcc-financial-calculations` | **No addition.** Keep it aligned with canonical financial engines. |

Completed user-skill installations: `typescript-advanced-types`, `tailwind-design-system`, and `interaction-design` under `C:\Users\itwiz\.codex\skills`.

Registry references: [TypeScript advanced types](https://skills.sh/wshobson/agents/typescript-advanced-types), [Tailwind design system](https://skills.sh/wshobson/agents/tailwind-design-system), and [Interaction design](https://skills.sh/wshobson/agents/interaction-design).

## Conflicts and duplicates

| Bare name | Copies | Hash result | Routing |
| --- | ---: | --- | --- |
| `control-chrome` | 2 | Identical | Stale cache versions `26.814.41957` and `26.818.41509`; active catalog uses current. |
| `notion-knowledge-capture` | 2 | Different | Prefer `notion:notion-knowledge-capture` for connected Notion work. |
| `notion-meeting-intelligence` | 2 | Different | Prefer `notion:notion-meeting-intelligence`. |
| `notion-research-documentation` | 2 | Different | Prefer `notion:notion-research-documentation`. |
| `pdf` | 2 | Different | Prefer runtime-backed `pdf:pdf`; retain local `pdf` only if needed. |

Functional overlap also exists among browser-control skills, Vercel deployment skills, security workflows, and the two Context7 routes. Route signed-in browser state to Browser/Chrome, CLI checks to `playwright`, persistent debugging to `playwright-interactive`, test authoring to `playwright-automation`, managed scans to Codex Security, and documentation queries to standalone Context7. Namespace/version routing currently prevents application-code conflicts.

## Git repository health and commit readiness

| Check | Result |
| --- | --- |
| Branch/upstream | `codex/backlog-fix-sprint`; up to date with its origin before this report change |
| Remote | `https://github.com/itwizzle21-CYBER/vcc-os.git` |
| Git | `2.54.0.windows.1`; user name/email configured |
| Initial worktree | Clean |
| Lock/rebase/merge state | No lock, rebase, or merge state |
| Object connectivity | `git fsck --connectivity-only --no-dangling --no-reflogs` passed |
| Commit dry run | Reached normal `nothing to commit, working tree clean` state when temporary index locking was permitted |
| Application-code changes | None |

No Git repair was required. The initial lock error came from the read-restricted audit sandbox, not the repository. Full `git fsck` found reclaimable dangling objects but no connectivity/corruption error; garbage collection was not run.

## Remediation order

1. Launch Chrome once and install/enable its ChatGPT extension through **Settings → Computer use**; otherwise use the passing in-app Browser.
2. Reauthorize the Vercel app for `crlzel/vcc-os`; use the verified CLI meanwhile.
3. Prefer standalone Context7.
4. Review redundant Notion/PDF variants and obsolete Chrome cache through normal plugin maintenance.
5. Run `gh auth login` only when CLI-authenticated GitHub workflows are needed.

## Evidence boundary

The audit and remediation used read-only configuration inspection, tool metadata, authenticated probes, Git diagnostics, Vercel CLI inspection, Supabase project lookup, Context7 resolution, one Playwright smoke test, Browser/Chrome diagnostics, approved user-level skill installation, approved CLI installation, and the official Chrome installer. It did not expose secrets, modify application code, change database state, alter app permissions, deploy, stage files, or create a commit.
