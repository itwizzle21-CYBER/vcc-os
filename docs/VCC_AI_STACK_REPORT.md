# VCC AI Stack Report

Audit date: 2026-07-29

Scope: Codex skills, MCP servers, connected apps, and the integrations used to develop and release VCC-OS.

Overall readiness: **93%**

## Executive summary

VCC-OS has a strong AI-assisted development environment with broad first-party coverage for React, Vercel, Supabase/PostgreSQL, accessibility, security, testing, browser automation, and product design. GitHub, Vercel, Supabase, Playwright, the Codex in-app browser, and Context7 all passed live read-only checks. The Chrome control skill is installed, but no Chrome extension runtime was connected during this audit.

The physical installation contains **206 skill packages representing 199 unique skill names**, **5 active MCP servers with 536 callable MCP tools**, and **13 apps that answered an identity or workspace probe successfully**. Seven exact-name duplicate skill pairs are installed. Namespacing prevents an immediate runtime collision, but removing redundant local copies would make routing clearer.

No Git repository problem currently prevents commits or pushes. `git fsck --connectivity-only` found only unreachable/dangling objects, which are normal after rebases and amended work; it found no missing or corrupt reachable object. No destructive repository repair was applied.

## Integration verification

| Integration | Status | Evidence |
| --- | --- | --- |
| GitHub | Ready | GitHub app profile probe succeeded; `origin` fetch/push points to `itwizzle21-CYBER/vcc-os`; normal Git operations work. GitHub CLI is not installed, but it is not required because Git and the GitHub connector are functional. |
| Vercel | Ready | Vercel app team probe succeeded; CLI 54.20.1 is authenticated; local project link resolves to `vcc-os` under the expected team. |
| Supabase | Ready | Supabase organization probe succeeded; migrations are present under `supabase/migrations`; Supabase CLI is not installed, so connector-driven migrations are the current path. |
| Playwright | Ready | Playwright 1.61.1 is installed; the full desktop flow suite passed, including the 30-layout responsive matrix. |
| Codex Browser | Ready | The Codex in-app browser runtime was discovered and used successfully for live layout inspection. |
| Chrome | Partial | `control-chrome` is installed, but browser discovery returned only the Codex in-app browser; the Chrome extension runtime was not connected. |
| Context7 | Ready | Library resolution returned `/reactjs/react.dev`, and a documentation query returned current React `createRoot` guidance. |

## Connected apps

The following apps returned a successful read-only identity, team, organization, workspace, or resource-list response:

- Base44
- Figma
- GitHub
- Gmail
- Google Calendar
- Google Drive
- Lovable
- Notion
- Sites
- Slack
- Supabase
- Vercel
- VixNode

Exposed but not connected: Linear.

Available but not installed per the current plugin catalog: Atlassian Rovo, Box, Outlook Calendar, Outlook Email, SharePoint, and Teams.

## Installed MCP servers

- `codex_apps` — app/connectors surface, including GitHub, Google, Figma, Slack, Supabase, Vercel, and other connected apps.
- `codex_security` — security scan orchestration and finding lifecycle.
- `context7` — current third-party library documentation lookup.
- `node_repl` — persistent JavaScript runtime used by browser control and local orchestration.
- `openai_api_key_local_confirmation` — local OpenAI API-key confirmation workflow.

## Installed skills

### Codex local (45)

- imagegen; openai-docs; plugin-creator; review-agent; skill-creator; skill-installer
- a11y-pass; Accessibility Audit; animation-vocabulary; chatgpt-apps; component-states; data-viz; database-testing; define-goal
- Design Critique & Evaluation; Design Systems; emil-design-eng; frontend-code-review
- gh-address-comments; gh-fix-ci; jupyter-notebook; linear; micro-motion
- notion-knowledge-capture; notion-meeting-intelligence; notion-research-documentation
- pdf; performance-testing; playwright; playwright-automation; playwright-interactive
- release-readiness; responsive-layout; review-animations; risk-based-testing; screenshot
- security-best-practices; security-ownership-map; security-threat-model; sentry; speech; transcribe
- vercel-deploy; visual-testing; yeet

### Agent local (1)

- find-skills

### OpenAI bundled (6)

- control-in-app-browser; control-chrome; computer-use; sites-building; sites-hosting; visualize

### OpenAI curated (148)

- Base44: base44-cli; base44-remote-dev; base44-sandbox; base44-sdk; base44-troubleshooter
- Codex Security: attack-path-analysis; deep-security-scan; define-security-policy; finding-discovery; fix-finding; propose-security-hardening; security-diff-scan; security-scan; threat-model; track-findings; triage-finding; validation; vulnerability-writeup
- Figma: figma-code-connect; figma-create-new-file; figma-design-to-code; figma-generate-design; figma-generate-diagram; figma-generate-library; figma-implement-motion; figma-swiftui; figma-use; figma-use-figjam; figma-use-motion; figma-use-slides
- GitHub: gh-address-comments; gh-fix-ci; github; yeet
- Gmail: gmail; gmail-inbox-triage
- Google Calendar: google-calendar; google-calendar-daily-brief; google-calendar-free-up-time; google-calendar-group-scheduler; google-calendar-meeting-prep
- Google Drive: google-docs; google-drive; google-drive-comments; google-sheets; google-slides
- Notion: notion-knowledge-capture; notion-meeting-intelligence; notion-research-documentation; notion-spec-to-implementation
- OpenAI Developers: agents-sdk; build-chatgpt-app; chatgpt-app-submission; openai-api-troubleshooting; openai-platform-api-key
- Artifact templates: artifact-template-analytics-dashboard; artifact-template-business-review; artifact-template-design-report; artifact-template-experiment-analysis; artifact-template-financial-budget; artifact-template-investment-committee-memo; artifact-template-legal-memorandum; artifact-template-market-trends-report; artifact-template-minimal-letterhead; artifact-template-operating-calendar; artifact-template-operating-review; artifact-template-project-kickoff; artifact-template-project-tracker; artifact-template-sales-pipeline; artifact-template-simple-dark-mode; artifact-template-simple-light-mode; artifact-template-strategy-memorandum; artifact-template-system-design; artifact-template-team-alignment; artifact-template-three-statement-forecast
- Product Design: audit; design-qa; get-context; ideate; image-to-code; index; research; share; url-to-code; user-context
- Remotion: remotion-best-practices
- Slack: slack; slack-channel-summarization; slack-daily-digest; slack-notification-triage; slack-outgoing-message; slack-reply-drafting
- Supabase: supabase; supabase-postgres-best-practices
- Vercel: agent-browser; agent-browser-verify; ai-elements; ai-gateway; ai-generation-persistence; ai-sdk; auth; bootstrap; cdn-caching; chat-sdk; cms; cron-jobs; deployments-cicd; email; env-vars; eve; geist; geistdocs; investigation-mode; json-render; knowledge-update; marketplace; micro; microfrontends; ncc; next-cache-components; next-forge; next-upgrade; nextjs; observability; payments; react-best-practices; routing-middleware; runtime-cache; satori; shadcn; sign-in-with-vercel; swr; turbopack; turborepo; v0-dev; vercel-agent; vercel-api; vercel-cli; vercel-connect; vercel-firewall; vercel-flags; vercel-functions; vercel-queues; vercel-sandbox; vercel-services; vercel-storage; verification; workflow

### OpenAI primary runtime (6)

- documents; pdf; Presentations; excel-live-control; Spreadsheets; template-creator

## Duplicate and overlapping skills

Exact-name duplicates:

- `gh-address-comments` — local and GitHub plugin copies
- `gh-fix-ci` — local and GitHub plugin copies
- `notion-knowledge-capture` — local and Notion plugin copies
- `notion-meeting-intelligence` — local and Notion plugin copies
- `notion-research-documentation` — local and Notion plugin copies
- `pdf` — local and primary-runtime copies
- `yeet` — local and GitHub plugin copies

Potential semantic overlap, not a hard conflict:

- Accessibility Audit + a11y-pass
- playwright + playwright-automation + playwright-interactive + agent-browser-verify
- performance-testing + react-best-practices + Vercel verification
- local security skills + Codex Security skills
- micro-motion + review-animations + Figma motion skills

Recommendation: prefer the namespaced plugin skill when both copies are equivalent, then remove the redundant local copy only after comparing its `SKILL.md` for custom behavior. No duplicate was deleted during this audit.

## Stack coverage and recommendations

| Area | Installed coverage | Recommendation |
| --- | --- | --- |
| React | `vercel:react-best-practices`, frontend-code-review | No additional skill required. |
| Next.js | `vercel:nextjs`, next-upgrade, next-cache-components, turbopack | No additional skill required; VCC-OS currently uses Vite, so activate these only for a future Next.js migration. |
| TypeScript | General frontend review only | Add `wshobson/agents@typescript-advanced-types` if advanced type modeling becomes frequent. It had 56.6K skill installs and its source repository had 38.4K GitHub stars at audit time. |
| Tailwind | Design Systems, responsive-layout, Vercel shadcn guidance | Optional: add `nextlevelbuilder/ui-ux-pro-max-skill@ui-styling` for dedicated Tailwind pattern lookup. It had 10.8K skill installs and its source repository had 111.5K GitHub stars. |
| shadcn/ui | `vercel:shadcn` | No additional skill required; the official shadcn skill is already installed. |
| Framer Motion | micro-motion, review-animations, Figma motion | Add `mindrally/skills@framer-motion` only if Framer Motion is added to the application. It had 2.1K skill installs and its source repository was reported with 200 GitHub stars. |
| Supabase | `supabase:supabase` | No additional skill required. |
| PostgreSQL | `supabase:supabase-postgres-best-practices`, database-testing | No additional skill required. |
| Vercel | Deployment, CI/CD, observability, storage, caching, firewall, functions, routing, and verification skills | No additional skill required. |
| Accessibility | Accessibility Audit, a11y-pass, responsive-layout | No additional skill required. Consolidate the two audit/fix entry points after comparing their scopes. |
| Security | Full local and Codex Security suites | No additional skill required. |
| Performance | performance-testing, react-best-practices, Vercel verification | No additional skill required. |
| Financial calculations | Financial templates exist, but no dedicated calculation-engine skill | Create a project-local `vcc-financial-calculations` skill. It should require integer minor units or a decimal library, explicit rounding rules, balanced transfer invariants, tax-allocation reconciliation, sign conventions, and property-based tests. Public search results were all below the preferred 1K-install quality threshold, so none is recommended for direct installation. |

Suggested optional installation commands:

```powershell
npx skills add wshobson/agents@typescript-advanced-types -g -y
npx skills add nextlevelbuilder/ui-ux-pro-max-skill@ui-styling -g -y
npx skills add mindrally/skills@framer-motion -g -y
```

Do not install these merely to increase the skill count. TypeScript is the highest-value addition; Tailwind and Framer Motion are conditional.

## Missing or partial capabilities

- Chrome runtime connection is absent even though the Chrome control skill is installed.
- GitHub CLI is absent; the GitHub connector and normal Git remote operations cover current release needs.
- Supabase CLI is absent; the connected Supabase app covers current database operations.
- No dedicated, high-confidence financial-calculation skill is installed.
- Linear tools are exposed but the Linear app is not connected.

## Repository health

- Branch: `main`, tracking `origin/main`.
- Remote: `https://github.com/itwizzle21-CYBER/vcc-os.git` for fetch and push.
- Reachable object connectivity: healthy.
- Working tree before release: only the intended layout CSS, layout regression test, and this report.
- Observed dangling Git trees/blobs/one commit are unreachable maintenance artifacts, not corruption and not a commit blocker.
- No repository setting, ref, object, or hook needed repair; therefore no repository mutation was made beyond the requested release commit.

## Readiness score

**93 / 100**

Scoring rationale:

- 25/25 core coding and framework guidance
- 19/20 testing and browser automation
- 20/20 deployment and cloud integration
- 14/15 database and backend integration
- 15/15 accessibility, security, and performance coverage
- Deductions: Chrome runtime unavailable (-2), duplicate skill maintenance (-2), no dedicated financial-calculation skill (-2), and missing optional GitHub/Supabase CLIs (-1)

The environment is production-ready for the current VCC-OS Vite/React/Supabase/Vercel workflow.
