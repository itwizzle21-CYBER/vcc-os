# VCC AI Stack Report

**Sprint:** 0.6 — Verify and Optimize VCC AI Environment

**Audit date:** 2026-08-20 (America/Chicago)

**Repository:** `itwizzle21-CYBER/vcc-os`
**Scope:** Installed skills, MCP servers, connected apps, named integration health, capability overlap, recommendations, and Git commit readiness. Application code was not modified.

## Executive summary

**Overall readiness: 86%**

VCC's AI environment is production-capable for its current React/Vite/TypeScript stack. GitHub, Supabase, Playwright, the in-app Browser, and both Context7 routes passed live checks. Vercel is fully operational through the linked and authenticated CLI, while its connected-app project lookup is degraded. Google Chrome control is the only failed named integration because Google Chrome is not installed on this machine; the Browser plugin and native-host manifest themselves are present.

| Readiness area | Weight | Score | Evidence |
| --- | ---: | ---: | --- |
| Named integrations | 50 | 43 | Six of seven are usable; Chrome is unavailable. Vercel has a working CLI path but degraded app-project visibility. |
| Requested skill domains | 30 | 25 | Strong first-party coverage in nine domains; TypeScript, Tailwind, Framer Motion, and financial-calculation specialization can improve. |
| Repository/tooling | 15 | 15 | Git, upstream reachability, Node/npm, Playwright, Vercel link, and commit prerequisites are healthy. |
| Duplication/routing hygiene | 5 | 3 | Eight duplicate bare skill names, overlapping browser/deploy/security workflows, and two Context7 routes require routing discipline. |
| **Total** | **100** | **86** | Ready for normal work with targeted remediation, not a broad plugin install. |

## Named integration verification

| Integration | Result | Live evidence | Limitation or action |
| --- | --- | --- | --- |
| GitHub | **Pass** | Authenticated profile and `itwizzle21-CYBER/vcc-os` repository lookups passed; repository metadata reports push/admin capability; `git ls-remote origin main` passed. | The connector's collaborator-permission endpoint returned `403 Resource not accessible by integration`, but repository access and Git transport work. GitHub CLI `gh` is not installed. |
| Vercel | **Pass, connector degraded** | Vercel CLI `54.20.1`, `vercel whoami`, project listing, linked project inspection, and the READY production deployment all passed. | The Vercel app can list the authenticated team but returns no projects and a direct project lookup returns 404. Use the linked CLI until connector scope is repaired. |
| Supabase | **Pass** | The connected app listed and fetched `vcc-os-production`; status is `ACTIVE_HEALTHY` on Postgres 17. | Supabase CLI is not installed. The app/MCP path is the active integration. The current breaking-change index was reviewed; no schema or app change was made. |
| Playwright | **Pass** | `npx` is present; `@playwright/test` and CLI are `1.61.1`; project discovery found **84 tests** across desktop and mobile Chromium projects. | This environment sprint listed tests rather than rerunning application behavior already validated in the preceding release. |
| Browser (in-app) | **Pass** | The Codex in-app Browser connected and returned its supported control API. | None. This is the preferred fallback while Chrome is unavailable. |
| Chrome | **Fail** | Direct selection and one retry failed. Diagnostics found Microsoft Edge only; the Google Chrome user-data directory does not exist. | Install Google Chrome and enable the ChatGPT browser extension under **Settings → Computer use** if Chrome-specific sessions are required. The native-host manifest is present and correct. |
| Context7 | **Pass** | The standalone `context7` MCP resolved React; the Context7 connected app independently resolved TypeScript. | Both routes work and overlap. Keep one primary route to reduce ambiguity. |

## Installed MCP servers and runtime surfaces

Five active MCP namespaces expose **553 callable MCP tools** in this session.

| MCP namespace | Tools | Source | Status |
| --- | ---: | --- | --- |
| `codex_apps` | 528 | Codex desktop aggregated app host | Operational |
| `codex_security` | 19 | Codex Security plugin | Operational |
| `context7` | 2 | Explicit `config.toml` MCP | Operational; live lookup passed |
| `node_repl` | 3 | Explicit native runtime MCP | Operational; Browser transport passed |
| `openai_api_key_local_confirmation` | 1 | OpenAI Developers plugin | Operational |

The explicit user-configured MCP entries are `node_repl` and `context7`. GitHub, Vercel, Supabase, Figma, Google apps, Slack, Notion, and other app integrations are routed through `codex_apps`. Browser and Chrome are plugins that use `node_repl`; they are not separate top-level MCP namespaces.

## Connected apps

The current desktop host exposes **24 app tool groups** through `codex_apps`. The plugin cache contains **22 unique app declarations**; the difference comes from shared dependencies, system services, and app-host aggregation.

### Authenticated and live-verified

| App | Tools | Verification |
| --- | ---: | --- |
| Base44 | 19 | Authenticated app listing passed. |
| Figma | 33 | Authenticated identity lookup passed. |
| GitHub | 89 | Profile and VCC repository lookup passed. |
| Gmail | 21 | Profile lookup passed. |
| Google Calendar | 15 | Profile lookup passed. |
| Google Drive | 45 | Profile lookup passed. |
| Linear | 59 | Authentication completed and team listing passed. |
| Lovable | 46 | Workspace listing passed. |
| Notion | 18 | Current-user lookup passed. |
| Sites | 22 | Site listing passed. |
| Slack | 32 | Workspace listing passed. |
| Supabase | 29 | VCC production project listing and detail lookup passed. |
| Vercel | 24 | Team lookup passed; project visibility is degraded as documented above. |
| VIXNODE | 22 | Account lookup passed. |

### Callable system or no-identity services

| App/service | Tools | Status |
| --- | ---: | --- |
| Codex Document Control | 3 | Callable; requires a connected document session for document actions. |
| Codex Security Access | 1 | Callable system service. |
| Color Designer / Palette Maker | 1 | Callable generation service. |
| Context7 app | 2 | Documentation lookup passed. |
| Hotline | 1 | Callable locale service. |
| Mobbin | 3 | Callable design-reference service. |
| OpenAI Platform | 3 | Callable; secret creation remains user-confirmed. |
| Plugin Management | 4 | Callable system service. |
| Safety Settings | 5 | Callable system service. |

### Present but not connected

| App | Status |
| --- | --- |
| Atlassian Rovo | Two read-only authentication attempts returned another authentication request instead of accessible resources. Do not treat it as connected until a resource-list call succeeds. |

## Installed skill inventory

The current filesystem contains **208 installed skill records representing 201 distinct bare names**. The inventory includes local, system, current plugin-cache, runtime, and template skills. The active session catalog may intentionally expose a smaller subset.

### Local and system

- **Agent (1):** `find-skills`
- **Local Codex (39):** `a11y-pass`, `Accessibility Audit`, `animation-vocabulary`, `chatgpt-apps`, `component-states`, `data-viz`, `database-testing`, `define-goal`, `Design Critique & Evaluation`, `Design Systems`, `emil-design-eng`, `frontend-code-review`, `gh-address-comments`, `gh-fix-ci`, `jupyter-notebook`, `linear`, `micro-motion`, `notion-knowledge-capture`, `notion-meeting-intelligence`, `notion-research-documentation`, `pdf`, `performance-testing`, `playwright`, `playwright-automation`, `playwright-interactive`, `release-readiness`, `responsive-layout`, `review-animations`, `risk-based-testing`, `screenshot`, `security-best-practices`, `security-ownership-map`, `security-threat-model`, `sentry`, `speech`, `transcribe`, `vercel-deploy`, `visual-testing`, `yeet`
- **System (6):** `imagegen`, `openai-docs`, `plugin-creator`, `review-agent`, `skill-creator`, `skill-installer`

### OpenAI bundled plugins

- **Browser (1):** `control-in-app-browser`
- **Chrome (1 active skill; one obsolete identical cache copy also exists):** `control-chrome`
- **Computer Use (1):** `computer-use`
- **Sites (2):** `sites-building`, `sites-hosting`
- **Visualize (1):** `visualize`

### Curated plugins

- **Base44 (5):** `base44-cli`, `base44-remote-dev`, `base44-sandbox`, `base44-sdk`, `base44-troubleshooter`
- **Codex Security (13):** `attack-path-analysis`, `deep-security-scan`, `define-security-policy`, `finding-discovery`, `fix-finding`, `propose-security-hardening`, `security-diff-scan`, `security-scan`, `threat-model`, `track-findings`, `triage-finding`, `validation`, `vulnerability-writeup`
- **Figma (12):** `figma-code-connect`, `figma-create-new-file`, `figma-design-to-code`, `figma-generate-design`, `figma-generate-diagram`, `figma-generate-library`, `figma-implement-motion`, `figma-swiftui`, `figma-use`, `figma-use-figjam`, `figma-use-motion`, `figma-use-slides`
- **GitHub (4):** `gh-address-comments`, `gh-fix-ci`, `github`, `yeet`
- **Gmail (1):** `gmail`
- **Google Calendar (1):** `google-calendar`
- **Google Drive (5):** `google-docs`, `google-drive`, `google-drive-comments`, `google-sheets`, `google-slides`
- **Notion (4):** `notion-knowledge-capture`, `notion-meeting-intelligence`, `notion-research-documentation`, `notion-spec-to-implementation`
- **OpenAI Developers (5):** `agents-sdk`, `build-chatgpt-app`, `chatgpt-app-submission`, `openai-api-troubleshooting`, `openai-platform-api-key`
- **OpenAI Templates (20):** `artifact-template-analytics-dashboard`, `artifact-template-business-review`, `artifact-template-design-report`, `artifact-template-experiment-analysis`, `artifact-template-financial-budget`, `artifact-template-investment-committee-memo`, `artifact-template-legal-memorandum`, `artifact-template-market-trends-report`, `artifact-template-minimal-letterhead`, `artifact-template-operating-calendar`, `artifact-template-operating-review`, `artifact-template-project-kickoff`, `artifact-template-project-tracker`, `artifact-template-sales-pipeline`, `artifact-template-simple-dark-mode`, `artifact-template-simple-light-mode`, `artifact-template-strategy-memorandum`, `artifact-template-system-design`, `artifact-template-team-alignment`, `artifact-template-three-statement-forecast`
- **Plugin Management (1):** `plugin-management`
- **Product Design (10):** `audit`, `design-qa`, `get-context`, `ideate`, `image-to-code`, `index`, `research`, `share`, `url-to-code`, `user-context`
- **Remotion (12):** `remotion-best-practices`, `remotion-captions`, `remotion-create`, `remotion-docs`, `remotion-interactivity`, `remotion-maps`, `remotion-markup`, `remotion-multimedia`, `remotion-render`, `remotion-saas`, `remotion-studio`, `remotion-upgrade`
- **Slack (1):** `slack`
- **Supabase (2):** `supabase`, `supabase-postgres-best-practices`
- **Vercel (54):** `agent-browser`, `agent-browser-verify`, `ai-elements`, `ai-gateway`, `ai-generation-persistence`, `ai-sdk`, `auth`, `bootstrap`, `cdn-caching`, `chat-sdk`, `cms`, `cron-jobs`, `deployments-cicd`, `email`, `env-vars`, `eve`, `geist`, `geistdocs`, `investigation-mode`, `json-render`, `knowledge-update`, `marketplace`, `micro`, `microfrontends`, `ncc`, `next-cache-components`, `next-forge`, `next-upgrade`, `nextjs`, `observability`, `payments`, `react-best-practices`, `routing-middleware`, `runtime-cache`, `satori`, `shadcn`, `sign-in-with-vercel`, `swr`, `turbopack`, `turborepo`, `v0-dev`, `vercel-agent`, `vercel-api`, `vercel-cli`, `vercel-connect`, `vercel-firewall`, `vercel-flags`, `vercel-functions`, `vercel-queues`, `vercel-sandbox`, `vercel-services`, `vercel-storage`, `verification`, `workflow`

### Primary runtime

- **Documents (1):** `documents`
- **PDF (1):** `pdf`
- **Presentations (1):** `Presentations`
- **Spreadsheets (2):** `excel-live-control`, `Spreadsheets`
- **Template Creator (1):** `template-creator`

## Duplicate and conflicting skills

### Duplicate bare names

| Name | Locations/copies | Conflict assessment | Routing recommendation |
| --- | --- | --- | --- |
| `control-chrome` | Two cached bundled-plugin versions; files are identical | Stale-cache duplication only | Use current `26.814.41957`; let Codex/plugin maintenance remove the old cache. |
| `gh-address-comments` | Local + GitHub plugin | Different instructions for the same workflow | Prefer `github:gh-address-comments`; archive the local copy after reviewing custom rules. |
| `gh-fix-ci` | Local + GitHub plugin | Different instructions for the same workflow | Prefer the GitHub-plugin copy. |
| `notion-knowledge-capture` | Local + Notion plugin | Overlapping triggers | Prefer `notion:notion-knowledge-capture`. |
| `notion-meeting-intelligence` | Local + Notion plugin | Overlapping triggers | Prefer `notion:notion-meeting-intelligence`. |
| `notion-research-documentation` | Local + Notion plugin | Overlapping triggers | Prefer `notion:notion-research-documentation`. |
| `pdf` | Local + primary runtime | Different document runtimes | Prefer `pdf:pdf` for runtime-backed PDF work. |
| `yeet` | Local + GitHub plugin | Overlapping stage/commit/push workflow | Prefer the namespaced GitHub copy; both still require explicit publish authorization. |

### Functional overlap

- Browser control overlaps across `playwright`, `playwright-interactive`, `playwright-automation`, `agent-browser`, `agent-browser-verify`, Browser, Chrome, and Computer Use. Route user-session work to Browser/Chrome, CLI browser checks to `playwright`, persistent debugging to `playwright-interactive`, and test authoring to `playwright-automation`.
- Deployment overlaps across `vercel-deploy`, `deployments-cicd`, `vercel-cli`, `vercel-api`, and `verification`. Route by deployment, CI/CD, CLI, connected API, or verification intent.
- Security overlaps between local security skills and the 13-skill Codex Security workflow. Use Codex Security for managed scans/findings and local skills for targeted framework or ownership guidance.
- Context7 is duplicated as a standalone MCP and a connected app. Both passed; designate the standalone MCP as primary and the app as fallback, or remove one.

No duplicate produced an application-code conflict during this sprint.

## Domain coverage and recommendations

| Domain | Installed coverage | Recommendation |
| --- | --- | --- |
| React | `vercel:react-best-practices`, `frontend-code-review`, component/design skills | **No additional install.** Prefer the official Vercel reviewer and avoid another generic React duplicate. |
| Next.js | `vercel:nextjs`, `next-cache-components`, `next-upgrade`, `next-forge` | **No additional install.** Coverage is extensive; VCC currently uses Vite, so keep these dormant unless Next.js enters scope. |
| TypeScript | TS guidance is embedded in frontend/React skills | Add `wshobson/agents@typescript-advanced-types` only when advanced domain typing is in scope. Registry evidence: 62.3K installs; source repo 38,937 stars, MIT. Install: `npx skills add wshobson/agents@typescript-advanced-types`. |
| Tailwind | `vercel:shadcn`, design-system, responsive, and a11y skills | Add `wshobson/agents@tailwind-design-system` before a Tailwind redesign or v4 migration. Registry evidence: 60.1K installs; same vetted MIT repository. |
| shadcn/ui | `vercel:shadcn` | **No additional install.** Keep the official Vercel skill. |
| Framer Motion | `figma-implement-motion`, `micro-motion`, `review-animations`, `animation-vocabulary` | Add `freshtechbro/claudedesignskills@motion-framer` only when Framer Motion becomes a dependency. Registry evidence: 3.3K installs; source repo 756 stars, MIT. Review community instructions before enabling. |
| Supabase | Official `supabase` skill and connected app | **No additional skill.** Optionally install the Supabase CLI for local migration/offline workflows. |
| PostgreSQL | `supabase-postgres-best-practices`, `database-testing` | **No additional skill.** Existing official guidance and migration tests cover the current Supabase/Postgres path. |
| Vercel | 54 Vercel skills, authenticated CLI, linked project, connected app | **No additional install.** Repair connector project scope and reduce overlap instead. |
| Accessibility | `Accessibility Audit`, `a11y-pass`, responsive/design review, Playwright checks | **No additional install.** Keep WCAG 2.2 AA and browser checks as release gates. |
| Security | Local security skills, 13 Codex Security workflows, Vercel Firewall guidance | **No additional generic skill.** Existing coverage is deep; add a live monitoring connector only when operational telemetry is required. |
| Performance | `performance-testing`, Vercel observability/caching guidance, Playwright | Add `addyosmani/web-quality-skills@performance` for Lighthouse/Core Web Vitals workflow depth. Registry evidence: 30K installs; source repo 2,643 stars, MIT. |
| Financial calculations | Budget/forecast templates and application tests; no calculation-governance skill | Create a project-local `vcc-financial-calculations` skill with decimal-safe arithmetic, currency/rounding policy, amortization, double-entry invariants, reconciliation, property tests, and golden fixtures. Use the installed `skill-creator`; do not install low-reputation finance skills without code review. |

### Recommended addition order

1. Create the project-specific financial-calculations skill.
2. Add the performance skill before the next optimization sprint.
3. Add TypeScript and Tailwind specialization when those gaps enter active scope.
4. Add Framer Motion specialization only after the dependency is adopted.
5. Do not add more generic React, Next.js, shadcn/ui, Supabase, PostgreSQL, Vercel, accessibility, or security skills until duplicate routing is simplified.

Skill-registry install counts were checked with `npx skills find`. Source reputation was checked against the GitHub repositories; packages from repositories below 100 stars were not recommended. Relevant registry pages: [TypeScript advanced types](https://skills.sh/wshobson/agents/typescript-advanced-types), [Tailwind design system](https://skills.sh/wshobson/agents/tailwind-design-system), [Motion/Framer](https://skills.sh/freshtechbro/claudedesignskills/motion-framer), and [web performance](https://skills.sh/addyosmani/web-quality-skills/performance).

## Missing or degraded components

- Google Chrome is not installed, so the enabled Chrome plugin cannot connect.
- The Vercel app connector cannot enumerate the linked VCC project even though its team authentication works; the CLI is the verified operational path.
- GitHub CLI `gh` is absent; Git and the GitHub app both work.
- Supabase CLI is absent; the connected Supabase app works and the VCC project is healthy.
- Atlassian Rovo remains in an authentication loop and is not connected.
- Dedicated TypeScript, Tailwind, Framer Motion, performance/Web Vitals, and financial-calculation specialization is not uniformly installed; only the highest-value additions are recommended above.
- The standalone Context7 MCP and Context7 app duplicate one another.

## Git repository health and commit readiness

| Check | Result |
| --- | --- |
| Branch/upstream | `main` tracks `origin/main`; local branch began this sprint one commit ahead. |
| Remote | `https://github.com/itwizzle21-CYBER/vcc-os.git`; live `main` lookup passed. |
| Git binary | `2.54.0.windows.1` |
| Git identity | Name and email are configured. |
| Worktree before sprint | Clean. |
| Commit blocker | None found. |
| Application-code changes | None. |

No repository repair was required. The prior local commit remains valid and the repository can stage and commit normally. This report is the only Sprint 0.6 workspace change.

## Remediation plan

1. Install Chrome and its ChatGPT extension only if Chrome-specific browser state is required; otherwise use the operational in-app Browser or Edge.
2. Reauthorize or repair the Vercel app connector's project scope; continue using the verified linked CLI meanwhile.
3. Choose one primary Context7 route.
4. Archive duplicate local GitHub, Notion, PDF, and `yeet` skills after reviewing local customizations.
5. Create the VCC-specific financial-calculations skill before expanding financial rules.
6. Reconnect Atlassian only when Jira/Confluence work enters scope.

## Evidence boundary

The audit used read-only configuration inspection, filesystem inventory, tool-surface metadata, identity/list probes, Git remote checks, Vercel CLI inspection, Supabase project lookup, Context7 resolution, Playwright test discovery, and Browser/Chrome diagnostics. It did not print secrets into the report, modify application code, change database state, alter app permissions, install plugins, or deploy.
