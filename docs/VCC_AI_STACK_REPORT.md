# VCC AI Stack Report

Sprint 0.6 verified the Codex AI environment for VCC-OS without modifying application source code.

## Overall Readiness Score

**78%**

The environment is strong for design review, UI QA, Supabase/PostgreSQL work, Vercel-oriented workflows, security review, financial document handling, and production readiness. The score is held back by GitHub app connectivity returning no installed accounts, Vercel having no visible project linked to this repo, direct Playwright runtime import failing in the sandbox, Context7 not being installed or exposed, and Git commits being blocked by Windows ACL deny entries on `.git`.

## Installed Skills

### User-installed skills

- `a11y-pass`
- `accessibility-audit`
- `animation-vocabulary`
- `component-states`
- `database-testing`
- `data-viz`
- `design-critique`
- `design-systems`
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
- `responsive-layout`
- `review-animations`
- `risk-based-testing`
- `screenshot`
- `security-best-practices`
- `security-ownership-map`
- `security-threat-model`
- `vercel-deploy`
- `visual-testing`
- `yeet`

### System and personal skills

- `find-skills`
- `imagegen`
- `openai-docs`
- `plugin-creator`
- `skill-creator`
- `skill-installer`

### Plugin-provided skills available in this Codex session

- Browser and computer control: `browser:control-in-app-browser`, `computer-use:computer-use`
- GitHub: `github:github`, `github:gh-address-comments`, `github:gh-fix-ci`, `github:yeet`
- Security: `codex-security:security-scan`, `codex-security:security-diff-scan`, `codex-security:deep-security-scan`, `codex-security:threat-model`, `codex-security:fix-finding`, and related validation/triage skills
- Supabase: `supabase:supabase`, `supabase:supabase-postgres-best-practices`
- Vercel: `vercel:nextjs`, `vercel:react-best-practices`, `vercel:shadcn`, `vercel:ai-sdk`, `vercel:vercel-api`, `vercel:vercel-cli`, `vercel:deployments-cicd`, `vercel:verification`, `vercel:agent-browser`, `vercel:agent-browser-verify`, `vercel:env-vars`, `vercel:observability`, `vercel:vercel-functions`, and related Vercel platform skills
- Documents and finance-adjacent artifacts: `spreadsheets:Spreadsheets`, `pdf:pdf`, `documents:documents`, `presentations:Presentations`

## Installed MCPs and Tool Namespaces

| MCP/tool namespace | Status | Notes |
| --- | --- | --- |
| `mcp__node_repl` | Installed and callable | Returned runtime metadata from the current thread. Used for JS/browser automation support. |
| `mcp__codex_apps__github` | Installed, not account-connected | Tool calls succeeded, but returned `accounts: []` and `installations: []`. |
| `mcp__codex_apps__vercel` | Installed and connected | Returned team `CRLZEL` / `team_fnjolZiaZUaMohUCuCKh4ERg`. |
| `mcp__codex_apps__supabase` | Installed and connected | Returned organization `VCC_OS_1` and active project `vcc-os-production`. |
| `mcp__codex_apps__openai_platform` | Installed and connected | Returned organization `Personal` and default project target. |
| `mcp__codex_security` | Installed | Security plugin MCP namespace is available for security workflows. |
| Context7 | Missing | No Context7 MCP tools, config entries, or local files were found. |

## Connected Apps

| App | Status | Verification result |
| --- | --- | --- |
| GitHub | Tools installed, account not connected | GitHub app calls returned no installed accounts and no installations. |
| Vercel | Connected | Team `CRLZEL` was returned. No projects were returned for the visible team, and this repo has no `.vercel/project.json`. |
| Supabase | Connected | Organization `VCC_OS_1` and project `vcc-os-production` are visible. Project is `ACTIVE_HEALTHY`, region `us-east-2`, PostgreSQL `17`. |
| OpenAI Platform | Connected | API key target list returned `Personal` organization and default project. |
| Browser plugin | Installed | Browser plugin cache is present. Config exposes browser backends through `BROWSER_USE_AVAILABLE_BACKENDS=chrome,iab`. |
| Chrome backend | Available through Browser/Node config | Chrome backend scripts are present in the Browser plugin cache. No standalone Chrome plugin was found. |
| Playwright | Partially healthy | Skills are installed and pnpm packages exist, but direct import failed because `playwright-core` was not resolvable from the sandboxed Node import path. |
| Context7 | Missing | Not exposed by `tool_search`, config, plugin cache, or local skill files. |

## Missing or Weak Areas

- GitHub account connection: the GitHub app is installed as a tool namespace but has no accessible installations.
- Vercel project link: Vercel is connected, but no projects are visible for the team and this repo is not linked with `.vercel/project.json`.
- Context7: not installed or exposed.
- Playwright runtime import: `playwright` package exists, and `playwright-core@1.61.1` exists under pnpm-managed modules, but direct import failed in both Node MCP and shell sandbox tests.
- Project metadata: this checkout currently has no `package.json`, `tsconfig.json`, `tailwind.config.*`, `next.config.*`, `playwright.config.*`, `components.json`, or `.vercel/project.json` at the repository root.
- Git commit path: `.git` ACLs block lock-file creation, so staging and committing are currently unavailable from the sandbox.

## Duplicate or Conflicting Skills

| Area | Type | Assessment |
| --- | --- | --- |
| `pdf` | Name overlap | User-installed `pdf` skill overlaps with primary-runtime `pdf:pdf`. This is manageable but can be confusing; prefer `pdf:pdf` for full render-and-verify workflows and local `pdf` for lightweight direct invocation. |
| GitHub PR/CI skills | Domain overlap | Local `gh-address-comments`, `gh-fix-ci`, `yeet` overlap with plugin-provided GitHub skills. This is useful redundancy, not a hard conflict. Prefer plugin-provided GitHub skills when app access is needed. |
| Security skills | Domain overlap | Local OpenAI security skills overlap with Codex Security plugin skills. Use local skills for lightweight reports; use Codex Security plugin skills for repository scans and tracked findings. |
| Playwright skills | Domain overlap plus runtime issue | `playwright`, `playwright-interactive`, and `playwright-automation` complement each other, but runtime import is not fully healthy. |
| Accessibility skills | Domain overlap | `a11y-pass` and `accessibility-audit` overlap but serve different depths: quick ship pass vs formal audit. |
| Design critique skills | Domain overlap | `design-critique`, `emil-design-eng`, and product-design plugin skills overlap. Use `emil-design-eng` for polish, `design-critique` for structured UX critique, product-design skills for screenshot-based product workflows. |

No exact duplicate local skill folder names were found.

## Recommended Additions

| Category | Recommendation | Why |
| --- | --- | --- |
| React | Use installed `frontend-code-review` and plugin `vercel:react-best-practices`; consider installing a dedicated React testing skill later. | React coverage is good, but test-generation depth can improve. |
| Next.js | Use plugin `vercel:nextjs`; install no extra skill yet. | The Vercel plugin is the best fit for current Next.js App Router guidance. |
| TypeScript | Use `frontend-code-review`; add a dedicated strict TypeScript/refactor skill if one is verified from a reputable source. | Current coverage is review-oriented, not type-system-specialist. |
| Tailwind | Use `frontend-code-review`, `responsive-layout`, `component-states`, and `vercel:shadcn`; consider a verified Tailwind-specific skill if found. | Current coverage handles Tailwind in context, but not as a standalone design-token system. |
| shadcn/ui | Use plugin `vercel:shadcn` and `frontend-code-review`. | Already strong. |
| Framer Motion | Use `animation-vocabulary`, `review-animations`, `micro-motion`, and `emil-design-eng`; consider a dedicated Framer Motion implementation skill later. | Motion review is strong, implementation-specific coverage can improve. |
| Supabase | Use plugin `supabase:supabase`; no extra install needed now. | Supabase app and plugin are connected and current. |
| PostgreSQL | Use `supabase:supabase-postgres-best-practices` and `database-testing`. | Strong for schema, migrations, and performance review. |
| Vercel | Use Vercel plugin skills and `vercel-deploy`; next step is linking the repo to a Vercel project. | Skills are strong; project linkage is the gap. |
| Accessibility | Use `a11y-pass`, `accessibility-audit`, and `frontend-code-review`. | Strong. |
| Security | Use local security skills plus Codex Security plugin; connect GitHub for PR/diff workflows. | Strong after GitHub connection is fixed. |
| Performance | Use `performance-testing`, `vercel:observability`, and `vercel:verification`. | Strong for web performance and deployment checks. |
| Financial calculations | Use `spreadsheets:Spreadsheets`, `data-viz`, `risk-based-testing`, and VCC financial docs. Add a dedicated financial calculation validation skill if a reputable one is found. | Current coverage is good for QA and reporting, but no finance-specific calculation skill is installed. |
| Context7 | Install/configure Context7 MCP if the team wants live library documentation lookup. | Currently absent. Useful for framework/API freshness. |

## Git Repository Issue

Git staging fails with:

```text
fatal: Unable to create 'C:/Users/itwiz/Downloads/VCC-OS/.git/index.lock': Permission denied
```

Root cause found:

- `.git` has explicit deny ACL entries for:
  - `S-1-5-21-1920638180-3065005236-1935145213-521615257`
  - `S-1-5-21-905961812-2239828718-1781747580-1098927100`
- Those deny entries include write/delete/read-control permissions and inherit into children such as `.git/index`.
- There is no stale `.git/index.lock`.
- A narrow ACL repair was attempted, but Windows rejected `Set-Acl` inside the sandbox with `UnauthorizedAccessException`.
- No successful Git ACL changes were made.

Recommended fix outside the sandbox, from an elevated PowerShell prompt:

```powershell
icacls "C:\Users\itwiz\Downloads\VCC-OS\.git" /remove:d "*S-1-5-21-1920638180-3065005236-1935145213-521615257" "*S-1-5-21-905961812-2239828718-1781747580-1098927100" /T
```

After that, verify:

```powershell
git status --short --branch
git add docs/VCC_AI_STACK_REPORT.md docs/VCC_CODEX_SKILLS_STACK.md
git commit -m "docs: add VCC AI stack report"
```

If this repository should push to GitHub, also add a remote. No remote is currently configured.

## Readiness Summary

VCC-OS has a strong AI-assisted engineering setup for UI craft, design systems, accessibility, Supabase/PostgreSQL, Vercel, security, documentation, financial report handling, and QA planning. The next highest-value environment fixes are:

1. Connect the GitHub app to the intended GitHub account/repository.
2. Link the repo to a Vercel project.
3. Repair `.git` ACLs so commits work.
4. Fix Playwright package resolution or install project-local Playwright once the app scaffold is restored.
5. Install/configure Context7 if live library documentation lookup is desired.
