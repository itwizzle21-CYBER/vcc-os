# VCC AI Stack Report

**Audit:** Sprint 0.6 refresh, recorded as Sprint 0.27 environment verification.
**Date:** 2026-09-12 (America/Chicago).
**Repository:** `itwizzle21-CYBER/vcc-os`.
**Source HEAD:** `64122a96`, branch `codex/backlog-fix-sprint`.
**Scope:** Environment inventory, seven integration checks, routing conflicts, recommendations, Git readiness, and requested deployment. Application code was not modified.

## Overall readiness: 90%

This is an environment-readiness score, not a security certification or production reliability measurement. The previous 94% report used a broader authenticated-app verification; this refresh does not inherit those old authentication claims. The score uses current evidence and gives less credit for unverified app authentication and the missing dedicated Motion guidance.

| Area | Weight | Earned | Basis |
| --- | ---: | ---: | --- |
| Seven integrations | 35 | 31 | Five fully pass; Vercel CLI passes with degraded connector; Chrome installed but unavailable for control. |
| Requested domain guidance | 30 | 28 | Installed guidance for all domains; Motion-specific API guidance remains a conditional gap. |
| MCP/app availability | 20 | 17 | Current callable inventory verified; only task-relevant connections exercised. |
| Git/local tooling | 10 | 10 | Clean tree, configured identity, reachable remote, valid objects, and build/test tooling. |
| Routing hygiene | 5 | 4 | Duplicate names and deployment/verification instruction conflicts need explicit routing. |
| **Total** | **100** | **90** | Ready for normal React/Vite/TypeScript work with documented limitations. |

## Installed and verified integrations

| Integration | Result | Current evidence |
| --- | --- | --- |
| GitHub | Pass | Connector fetched the VCC repository with push permission; network-enabled Git fetch succeeded. |
| Vercel | Operational; app degraded | CLI 54.20.1 authenticates and inspects `crlzel/vcc-os`; root directory `.`, build `npm run build`, output `dist`, runtime Node 24.x. Connector project lookup returns 404. |
| Supabase | Pass | Connector lists `vcc-os-production` as ACTIVE_HEALTHY on PostgreSQL 17.6. No database writes were performed. |
| Playwright | Pass | Installed 1.61.1; 114 tests discovered in two files; existing desktop welcome/dashboard smoke test passed. |
| Browser (in-app) | Pass | Runtime selected Codex In-app Browser and returned its supported control documentation. This proves connection/API availability; it is not a full product browser audit. |
| Chrome | Partial | Official diagnostic finds Chrome installed, but browser selector reports unavailable and native host manifest/registry entry is missing. |
| Context7 | Pass | Standalone MCP resolved `/reactjs/react.dev` and returned official React useEffect cleanup documentation. |

## Installed MCP inventory

The current session exposes **629 MCP tools across seven namespaces**, including the desktop app tools. Counts are a session snapshot and may change with enabled plugins. Offered tools do not prove every remote action is authenticated.

| Namespace | Tools | Verification |\n| --- | ---: | --- |\n| `codex_app` | 31 | Callable; not exercised |
| `codex_apps` | 570 | Live checks performed |
| `codex_security` | 20 | Callable; not exercised |
| `context7` | 2 | Live checks performed |
| `node_repl` | 3 | Live checks performed |
| `openai_api_key_local_confirmation` | 1 | Callable; not exercised |
| `openai_artifact_template_picker` | 2 | Callable; not exercised |

User config explicitly contains `node_repl` and `context7`. `cua_repl` is configured but disabled and absent from the callable inventory. Other namespaces are managed runtime/plugin services. GitHub, Vercel, and Supabase are available through `codex_apps`; they do not require separate top-level MCP servers for the verified workflows.

## Connected/offered apps and service provenance

The tool catalog identifies the following 22 plugin/app provenance names. Some are internal services or share tools; per-row counts overlap and must not be summed. “Tools offered” identifies availability in this session and does not assert a new OAuth identity check. Uninstalled plugins in the user-supplied recommendation list are not counted.

| App/service | Offered tools | Current verification |
| --- | ---: | --- |
| Atlassian Rovo | 32 | Tools offered; authentication not retested |
| Base44 | 19 | Tools offered; authentication not retested |
| Codex Security | 195 | Tools offered; authentication not retested |
| Color Designer - Palette Maker | 1 | Tools offered; authentication not retested |
| Context7 | 2 | App offered; standalone MCP live passed |
| Figma | 38 | Tools offered; authentication not retested |
| GitHub | 89 | Live access passed |
| Gmail | 21 | Tools offered; authentication not retested |
| Google Calendar | 15 | Tools offered; authentication not retested |
| Google Drive | 45 | Tools offered; authentication not retested |
| Linear | 74 | Tools offered; authentication not retested |
| Lovable | 40 | Tools offered; authentication not retested |
| Mobbin | 3 | Tools offered; authentication not retested |
| Notion | 42 | Tools offered; authentication not retested |
| OpenAI Developers | 3 | Tools offered; authentication not retested |
| Plugin Management | 4 | Tools offered; authentication not retested |
| Sites | 23 | Tools offered; authentication not retested |
| Slack | 36 | Tools offered; authentication not retested |
| Spreadsheets | 3 | Tools offered; authentication not retested |
| Supabase | 28 | Live access passed |
| Vercel | 24 | Project access 404; CLI passed |
| VIXNODE | 22 | Tools offered; authentication not retested |

## Installed skill inventory

**185 skills are advertised in this session.** Filesystem discovery found **214 SKILL.md files**, including 29 internal, unadvertised, template, or older-cache copies. Disk-only rows are explicitly separated from usable session skills. No skills/plugins were installed, removed, or updated by this refresh.

Path aliases:

- `USER/`: user Codex skills directory.
- `AGENT/`: user agent skills directory.
- `PROJECT/`: repository `.agents/skills/`.
- `PLUGIN/`: Codex plugin cache, with vendor/package/version retained.

Each row records the frontmatter name rather than inventing a skill identity; use plugin prefixes from the session catalog when invoking names shared across packages.

| Skill | Location | Availability |
| --- | --- | --- |
| find-skills | `AGENT/find-skills/SKILL.md` | Session catalog |
| control-in-app-browser | `PLUGIN/openai-bundled/browser/26.908.40834/skills/control-in-app-browser/SKILL.md` | Session catalog |
| control-chrome | `PLUGIN/openai-bundled/chrome/26.825.51511/skills/control-chrome/SKILL.md` | Disk/cache only |
| control-chrome | `PLUGIN/openai-bundled/chrome/26.908.40834/skills/control-chrome/SKILL.md` | Session catalog |
| computer-use | `PLUGIN/openai-bundled/computer-use/26.908.40834/skills/computer-use/SKILL.md` | Session catalog |
| sites-building | `PLUGIN/openai-bundled/sites/0.1.46/skills/sites-building/SKILL.md` | Disk/cache only |
| sites-hosting | `PLUGIN/openai-bundled/sites/0.1.46/skills/sites-hosting/SKILL.md` | Disk/cache only |
| visualize | `PLUGIN/openai-bundled/visualize/1.0.37/skills/visualize/SKILL.md` | Session catalog |
| base44-cli | `PLUGIN/openai-curated-remote/base44/4.0.1/skills/base44-cli/SKILL.md` | Session catalog |
| base44-remote-dev | `PLUGIN/openai-curated-remote/base44/4.0.1/skills/base44-remote-dev/SKILL.md` | Session catalog |
| base44-sandbox | `PLUGIN/openai-curated-remote/base44/4.0.1/skills/base44-sandbox/SKILL.md` | Session catalog |
| base44-sdk | `PLUGIN/openai-curated-remote/base44/4.0.1/skills/base44-sdk/SKILL.md` | Session catalog |
| base44-troubleshooter | `PLUGIN/openai-curated-remote/base44/4.0.1/skills/base44-troubleshooter/SKILL.md` | Session catalog |
| assess-patch-risk | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/assess-patch-risk/SKILL.md` | Session catalog |
| attack-path-analysis | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/attack-path-analysis/SKILL.md` | Session catalog |
| deep-security-scan | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/deep-security-scan/SKILL.md` | Session catalog |
| define-security-policy | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/define-security-policy/SKILL.md` | Session catalog |
| finding-discovery | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/finding-discovery/SKILL.md` | Session catalog |
| fix-finding | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/fix-finding/SKILL.md` | Session catalog |
| propose-security-hardening | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/propose-security-hardening/SKILL.md` | Session catalog |
| security-diff-scan | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/security-diff-scan/SKILL.md` | Session catalog |
| security-scan | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/security-scan/SKILL.md` | Session catalog |
| threat-model | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/threat-model/SKILL.md` | Session catalog |
| track-findings | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/track-findings/SKILL.md` | Session catalog |
| triage-finding | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/triage-finding/SKILL.md` | Session catalog |
| validation | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/validation/SKILL.md` | Session catalog |
| verify-fix | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/verify-fix/SKILL.md` | Session catalog |
| vulnerability-writeup | `PLUGIN/openai-curated-remote/codex-security/0.1.24/skills/vulnerability-writeup/SKILL.md` | Session catalog |
| deep-research | `PLUGIN/openai-curated-remote/deep-research-work/0.1.15/skills/deep-research/SKILL.md` | Session catalog |
| figma-code-connect | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-code-connect/SKILL.md` | Session catalog |
| figma-create-new-file | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-create-new-file/SKILL.md` | Session catalog |
| figma-design-to-code | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-design-to-code/SKILL.md` | Session catalog |
| figma-generate-design | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-generate-design/SKILL.md` | Session catalog |
| figma-generate-diagram | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-generate-diagram/SKILL.md` | Session catalog |
| figma-generate-library | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-generate-library/SKILL.md` | Session catalog |
| figma-implement-motion | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-implement-motion/SKILL.md` | Session catalog |
| figma-swiftui | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-swiftui/SKILL.md` | Session catalog |
| figma-use-figjam | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-use-figjam/SKILL.md` | Session catalog |
| figma-use-motion | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-use-motion/SKILL.md` | Session catalog |
| figma-use-slides | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-use-slides/SKILL.md` | Session catalog |
| figma-use | `PLUGIN/openai-curated-remote/figma/2.0.21/skills/figma-use/SKILL.md` | Session catalog |
| google-docs | `PLUGIN/openai-curated-remote/google-drive/0.1.16/skills/google-docs/SKILL.md` | Session catalog |
| google-drive-comments | `PLUGIN/openai-curated-remote/google-drive/0.1.16/skills/google-drive-comments/SKILL.md` | Session catalog |
| google-drive | `PLUGIN/openai-curated-remote/google-drive/0.1.16/skills/google-drive/SKILL.md` | Session catalog |
| google-sheets | `PLUGIN/openai-curated-remote/google-drive/0.1.16/skills/google-sheets/SKILL.md` | Session catalog |
| google-slides | `PLUGIN/openai-curated-remote/google-drive/0.1.16/skills/google-slides/SKILL.md` | Session catalog |
| notion-knowledge-capture | `PLUGIN/openai-curated-remote/notion/0.1.8/skills/notion-knowledge-capture/SKILL.md` | Session catalog |
| notion-meeting-intelligence | `PLUGIN/openai-curated-remote/notion/0.1.8/skills/notion-meeting-intelligence/SKILL.md` | Session catalog |
| notion-research-documentation | `PLUGIN/openai-curated-remote/notion/0.1.8/skills/notion-research-documentation/SKILL.md` | Session catalog |
| notion-spec-to-implementation | `PLUGIN/openai-curated-remote/notion/0.1.8/skills/notion-spec-to-implementation/SKILL.md` | Session catalog |
| agents | `PLUGIN/openai-curated-remote/openai-developers/1.3.0/skills/agents/SKILL.md` | Session catalog |
| build-chatgpt-app | `PLUGIN/openai-curated-remote/openai-developers/1.3.0/skills/build-chatgpt-app/SKILL.md` | Session catalog |
| chatgpt-app-submission | `PLUGIN/openai-curated-remote/openai-developers/1.3.0/skills/chatgpt-app-submission/SKILL.md` | Session catalog |
| openai-api-troubleshooting | `PLUGIN/openai-curated-remote/openai-developers/1.3.0/skills/openai-api-troubleshooting/SKILL.md` | Session catalog |
| openai-platform-api-key | `PLUGIN/openai-curated-remote/openai-developers/1.3.0/skills/openai-platform-api-key/SKILL.md` | Session catalog |
| artifact-template-analytics-dashboard | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-analytics-dashboard/SKILL.md` | Disk/cache only |
| artifact-template-business-review | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-business-review/SKILL.md` | Disk/cache only |
| artifact-template-design-report | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-design-report/SKILL.md` | Disk/cache only |
| artifact-template-experiment-analysis | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-experiment-analysis/SKILL.md` | Disk/cache only |
| artifact-template-financial-budget | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-financial-budget/SKILL.md` | Disk/cache only |
| artifact-template-investment-committee-memo | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-investment-committee-memo/SKILL.md` | Disk/cache only |
| artifact-template-legal-memorandum | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-legal-memorandum/SKILL.md` | Disk/cache only |
| artifact-template-market-trends-report | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-market-trends-report/SKILL.md` | Disk/cache only |
| artifact-template-minimal-letterhead | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-minimal-letterhead/SKILL.md` | Disk/cache only |
| artifact-template-operating-calendar | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-operating-calendar/SKILL.md` | Disk/cache only |
| artifact-template-operating-review | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-operating-review/SKILL.md` | Disk/cache only |
| artifact-template-project-kickoff | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-project-kickoff/SKILL.md` | Disk/cache only |
| artifact-template-project-tracker | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-project-tracker/SKILL.md` | Disk/cache only |
| artifact-template-sales-pipeline | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-sales-pipeline/SKILL.md` | Disk/cache only |
| artifact-template-simple-dark-mode | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-simple-dark-mode/SKILL.md` | Disk/cache only |
| artifact-template-simple-light-mode | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-simple-light-mode/SKILL.md` | Disk/cache only |
| artifact-template-strategy-memorandum | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-strategy-memorandum/SKILL.md` | Disk/cache only |
| artifact-template-system-design | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-system-design/SKILL.md` | Disk/cache only |
| artifact-template-team-alignment | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-team-alignment/SKILL.md` | Disk/cache only |
| artifact-template-three-statement-forecast | `PLUGIN/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-three-statement-forecast/SKILL.md` | Disk/cache only |
| plugin-management | `PLUGIN/openai-curated-remote/plugin-management/0.1.0/skills/plugin-management/SKILL.md` | Session catalog |
| audit | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/audit/SKILL.md` | Session catalog |
| design-qa | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/design-qa/SKILL.md` | Disk/cache only |
| get-context | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/get-context/SKILL.md` | Disk/cache only |
| ideate | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/ideate/SKILL.md` | Session catalog |
| image-to-code | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/image-to-code/SKILL.md` | Session catalog |
| index | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/index/SKILL.md` | Session catalog |
| research | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/research/SKILL.md` | Disk/cache only |
| share | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/share/SKILL.md` | Disk/cache only |
| url-to-code | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/url-to-code/SKILL.md` | Session catalog |
| user-context | `PLUGIN/openai-curated-remote/product-design/0.1.55/skills/user-context/SKILL.md` | Disk/cache only |
| remotion-best-practices | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-best-practices/SKILL.md` | Session catalog |
| remotion-captions | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-captions/SKILL.md` | Session catalog |
| remotion-create | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-create/SKILL.md` | Session catalog |
| remotion-docs | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-docs/SKILL.md` | Session catalog |
| remotion-interactivity | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-interactivity/SKILL.md` | Session catalog |
| remotion-maps | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-maps/SKILL.md` | Session catalog |
| remotion-markup | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-markup/SKILL.md` | Session catalog |
| remotion-multimedia | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-multimedia/SKILL.md` | Session catalog |
| remotion-render | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-render/SKILL.md` | Session catalog |
| remotion-saas | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-saas/SKILL.md` | Session catalog |
| remotion-studio | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-studio/SKILL.md` | Session catalog |
| remotion-upgrade | `PLUGIN/openai-curated-remote/remotion/1.0.7/skills/remotion-upgrade/SKILL.md` | Session catalog |
| sites-building | `PLUGIN/openai-curated-remote/sites/0.1.62/skills/sites-building/SKILL.md` | Session catalog |
| sites-hosting | `PLUGIN/openai-curated-remote/sites/0.1.62/skills/sites-hosting/SKILL.md` | Session catalog |
| sites-preview-troubleshooting | `PLUGIN/openai-curated-remote/sites/0.1.62/skills/sites-preview-troubleshooting/SKILL.md` | Session catalog |
| supabase-postgres-best-practices | `PLUGIN/openai-curated-remote/supabase/1.0.0/skills/supabase-postgres-best-practices/SKILL.md` | Session catalog |
| supabase | `PLUGIN/openai-curated-remote/supabase/1.0.0/skills/supabase/SKILL.md` | Session catalog |
| agent-browser-verify | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/agent-browser-verify/SKILL.md` | Session catalog |
| agent-browser | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/agent-browser/SKILL.md` | Session catalog |
| ai-elements | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/ai-elements/SKILL.md` | Session catalog |
| ai-gateway | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/ai-gateway/SKILL.md` | Session catalog |
| ai-generation-persistence | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/ai-generation-persistence/SKILL.md` | Session catalog |
| ai-sdk | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/ai-sdk/SKILL.md` | Session catalog |
| auth | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/auth/SKILL.md` | Session catalog |
| bootstrap | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/bootstrap/SKILL.md` | Session catalog |
| cdn-caching | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/cdn-caching/SKILL.md` | Session catalog |
| chat-sdk | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/chat-sdk/SKILL.md` | Session catalog |
| cms | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/cms/SKILL.md` | Session catalog |
| cron-jobs | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/cron-jobs/SKILL.md` | Session catalog |
| deployments-cicd | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/deployments-cicd/SKILL.md` | Session catalog |
| email | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/email/SKILL.md` | Session catalog |
| env-vars | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/env-vars/SKILL.md` | Session catalog |
| eve | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/eve/SKILL.md` | Session catalog |
| geist | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/geist/SKILL.md` | Session catalog |
| geistdocs | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/geistdocs/SKILL.md` | Session catalog |
| investigation-mode | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/investigation-mode/SKILL.md` | Session catalog |
| json-render | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/json-render/SKILL.md` | Session catalog |
| knowledge-update | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/knowledge-update/SKILL.md` | Session catalog |
| marketplace | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/marketplace/SKILL.md` | Session catalog |
| micro | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/micro/SKILL.md` | Session catalog |
| microfrontends | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/microfrontends/SKILL.md` | Session catalog |
| ncc | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/ncc/SKILL.md` | Session catalog |
| next-cache-components | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/next-cache-components/SKILL.md` | Session catalog |
| next-forge | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/next-forge/SKILL.md` | Session catalog |
| next-upgrade | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/next-upgrade/SKILL.md` | Session catalog |
| nextjs | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/nextjs/SKILL.md` | Session catalog |
| observability | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/observability/SKILL.md` | Session catalog |
| payments | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/payments/SKILL.md` | Session catalog |
| react-best-practices | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/react-best-practices/SKILL.md` | Session catalog |
| routing-middleware | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/routing-middleware/SKILL.md` | Session catalog |
| runtime-cache | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/runtime-cache/SKILL.md` | Session catalog |
| satori | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/satori/SKILL.md` | Session catalog |
| shadcn | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/shadcn/SKILL.md` | Session catalog |
| sign-in-with-vercel | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/sign-in-with-vercel/SKILL.md` | Session catalog |
| swr | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/swr/SKILL.md` | Session catalog |
| turbopack | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/turbopack/SKILL.md` | Session catalog |
| turborepo | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/turborepo/SKILL.md` | Session catalog |
| v0-dev | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/v0-dev/SKILL.md` | Session catalog |
| vercel-agent | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-agent/SKILL.md` | Session catalog |
| vercel-api | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-api/SKILL.md` | Session catalog |
| vercel-cli | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-cli/SKILL.md` | Session catalog |
| vercel-connect | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-connect/SKILL.md` | Session catalog |
| vercel-firewall | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-firewall/SKILL.md` | Session catalog |
| vercel-flags | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-flags/SKILL.md` | Session catalog |
| vercel-functions | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-functions/SKILL.md` | Session catalog |
| vercel-queues | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-queues/SKILL.md` | Session catalog |
| vercel-sandbox | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-sandbox/SKILL.md` | Session catalog |
| vercel-services | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-services/SKILL.md` | Session catalog |
| vercel-storage | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/vercel-storage/SKILL.md` | Session catalog |
| verification | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/verification/SKILL.md` | Session catalog |
| workflow | `PLUGIN/openai-curated-remote/vercel/0.21.4/skills/workflow/SKILL.md` | Session catalog |
| documents | `PLUGIN/openai-primary-runtime/documents/26.909.12148/skills/documents/SKILL.md` | Session catalog |
| pdf | `PLUGIN/openai-primary-runtime/pdf/26.909.12148/skills/pdf/SKILL.md` | Session catalog |
| Presentations | `PLUGIN/openai-primary-runtime/presentations/26.909.12148/skills/presentations/SKILL.md` | Session catalog |
| excel-live-control | `PLUGIN/openai-primary-runtime/spreadsheets/26.909.12148/skills/excel-live-control/SKILL.md` | Session catalog |
| Spreadsheets | `PLUGIN/openai-primary-runtime/spreadsheets/26.909.12148/skills/spreadsheets/SKILL.md` | Session catalog |
| template-creator | `PLUGIN/openai-primary-runtime/template-creator/26.909.12148/skills/template-creator/SKILL.md` | Session catalog |
| vcc-financial-calculations | `PROJECT/vcc-financial-calculations/SKILL.md` | Session catalog |
| imagegen | `USER/.system/imagegen/SKILL.md` | Session catalog |
| openai-docs | `USER/.system/openai-docs/SKILL.md` | Session catalog |
| plugin-creator | `USER/.system/plugin-creator/SKILL.md` | Session catalog |
| review-agent | `USER/.system/review-agent/SKILL.md` | Disk/cache only |
| skill-creator | `USER/.system/skill-creator/SKILL.md` | Session catalog |
| skill-installer | `USER/.system/skill-installer/SKILL.md` | Session catalog |
| a11y-pass | `USER/a11y-pass/SKILL.md` | Session catalog |
| Accessibility Audit | `USER/accessibility-audit/SKILL.md` | Session catalog |
| animation-vocabulary | `USER/animation-vocabulary/SKILL.md` | Session catalog |
| chatgpt-apps | `USER/chatgpt-apps/SKILL.md` | Session catalog |
| component-states | `USER/component-states/SKILL.md` | Session catalog |
| core-web-vitals | `USER/core-web-vitals/SKILL.md` | Session catalog |
| data-viz | `USER/data-viz/SKILL.md` | Session catalog |
| database-testing | `USER/database-testing/SKILL.md` | Session catalog |
| define-goal | `USER/define-goal/SKILL.md` | Session catalog |
| Design Critique & Evaluation | `USER/design-critique/SKILL.md` | Session catalog |
| Design Systems | `USER/design-systems/SKILL.md` | Session catalog |
| emil-design-eng | `USER/emil-design-eng/SKILL.md` | Session catalog |
| frontend-code-review | `USER/frontend-code-review/SKILL.md` | Session catalog |
| gh-address-comments | `USER/gh-address-comments/SKILL.md` | Session catalog |
| gh-fix-ci | `USER/gh-fix-ci/SKILL.md` | Session catalog |
| interaction-design | `USER/interaction-design/SKILL.md` | Session catalog |
| jupyter-notebook | `USER/jupyter-notebook/SKILL.md` | Session catalog |
| linear | `USER/linear/SKILL.md` | Session catalog |
| micro-motion | `USER/micro-motion/SKILL.md` | Session catalog |
| notion-knowledge-capture | `USER/notion-knowledge-capture/SKILL.md` | Session catalog |
| notion-meeting-intelligence | `USER/notion-meeting-intelligence/SKILL.md` | Session catalog |
| notion-research-documentation | `USER/notion-research-documentation/SKILL.md` | Session catalog |
| pdf | `USER/pdf/SKILL.md` | Session catalog |
| performance-testing | `USER/performance-testing/SKILL.md` | Session catalog |
| performance | `USER/performance/SKILL.md` | Session catalog |
| playwright-automation | `USER/playwright-automation/SKILL.md` | Session catalog |
| playwright-interactive | `USER/playwright-interactive/SKILL.md` | Session catalog |
| playwright | `USER/playwright/SKILL.md` | Session catalog |
| release-readiness | `USER/release-readiness/SKILL.md` | Session catalog |
| responsive-layout | `USER/responsive-layout/SKILL.md` | Session catalog |
| review-animations | `USER/review-animations/SKILL.md` | Session catalog |
| risk-based-testing | `USER/risk-based-testing/SKILL.md` | Session catalog |
| screenshot | `USER/screenshot/SKILL.md` | Session catalog |
| security-best-practices | `USER/security-best-practices/SKILL.md` | Session catalog |
| security-ownership-map | `USER/security-ownership-map/SKILL.md` | Session catalog |
| security-threat-model | `USER/security-threat-model/SKILL.md` | Session catalog |
| sentry | `USER/sentry/SKILL.md` | Session catalog |
| speech | `USER/speech/SKILL.md` | Session catalog |
| tailwind-design-system | `USER/tailwind-design-system/SKILL.md` | Session catalog |
| transcribe | `USER/transcribe/SKILL.md` | Session catalog |
| typescript-advanced-types | `USER/typescript-advanced-types/SKILL.md` | Session catalog |
| vercel-deploy | `USER/vercel-deploy/SKILL.md` | Session catalog |
| visual-testing | `USER/visual-testing/SKILL.md` | Session catalog |
| yeet | `USER/yeet/SKILL.md` | Session catalog |

## Conflicts

SHA-256 comparison found seven duplicated frontmatter names; all duplicate groups contain different content.

| Name | Copies | Comparison |
| --- | --- | --- |
| control-chrome | `PLUGIN/openai-bundled/chrome/26.825.51511/skills/control-chrome/SKILL.md`<br>`PLUGIN/openai-bundled/chrome/26.908.40834/skills/control-chrome/SKILL.md` | Different content; choose explicit namespace/version |
| sites-building | `PLUGIN/openai-bundled/sites/0.1.46/skills/sites-building/SKILL.md`<br>`PLUGIN/openai-curated-remote/sites/0.1.62/skills/sites-building/SKILL.md` | Different content; choose explicit namespace/version |
| sites-hosting | `PLUGIN/openai-bundled/sites/0.1.46/skills/sites-hosting/SKILL.md`<br>`PLUGIN/openai-curated-remote/sites/0.1.62/skills/sites-hosting/SKILL.md` | Different content; choose explicit namespace/version |
| notion-knowledge-capture | `PLUGIN/openai-curated-remote/notion/0.1.8/skills/notion-knowledge-capture/SKILL.md`<br>`USER/notion-knowledge-capture/SKILL.md` | Different content; choose explicit namespace/version |
| notion-meeting-intelligence | `PLUGIN/openai-curated-remote/notion/0.1.8/skills/notion-meeting-intelligence/SKILL.md`<br>`USER/notion-meeting-intelligence/SKILL.md` | Different content; choose explicit namespace/version |
| notion-research-documentation | `PLUGIN/openai-curated-remote/notion/0.1.8/skills/notion-research-documentation/SKILL.md`<br>`USER/notion-research-documentation/SKILL.md` | Different content; choose explicit namespace/version |
| pdf | `PLUGIN/openai-primary-runtime/pdf/26.909.12148/skills/pdf/SKILL.md`<br>`USER/pdf/SKILL.md` | Different content; choose explicit namespace/version |

- Prefer namespaced Notion and PDF skills for plugin-owned workflows. The standalone versions are separate implementations, not automatically interchangeable.
- Prefer current Chrome package `26.908.40834`; `26.825.51511` is an older disk-cache copy.
- Prefer advertised Sites package `0.1.62`; bundled `0.1.46` is not advertised for this session.
- Context7 is offered both as an app and as a standalone MCP. Use the standalone MCP by default; it passed live resolution and documentation retrieval.
- `vercel-deploy` prohibits fetching a deployed URL, while `release-readiness` requires deployed smoke checks and the Vercel CLI skill documents protected URL verification. Resolve the chosen workflow explicitly. This sprint uses the linked-project CLI workflow and deployment metadata verification; no deployed URL fetch is needed for the environment audit.
- Several UI, motion, security, performance, and browser skills overlap by domain. This is routing overlap, not proof of identical content. Choose one primary workflow and add supporting skills only for a concrete requirement.
- The roadmap is stale relative to shipped 0.26 behavior. This sprint follows the workspace's explicit audit scope rather than inventing an application feature.

## Missing and recommended

| Domain | Installed guidance | Recommended next addition/action |
| --- | --- | --- |
| React | `vercel:react-best-practices`, `frontend-code-review` | Use existing Vercel guidance; avoid installing another duplicate React reviewer. [Official skills overview](https://vercel.com/docs/agent-resources/skills). |
| Next.js | `vercel:nextjs`, upgrade/cache guidance | Apply only if adopting Next.js; VCC currently builds with Vite. Create a project migration contract when that work is explicitly scoped. |
| TypeScript | `typescript-advanced-types`, frontend review | Optional project skill for runtime boundary validation and discriminated financial records; keep advanced-type guidance focused on real requirements. |
| Tailwind | `tailwind-design-system`, design systems | Optional project skill mapping existing tokens and responsive conventions; no additional generic package needed. |
| shadcn/ui | `vercel:shadcn` | Use installed guidance; add a project component-ownership reference if adoption expands. |
| Framer Motion / Motion | `interaction-design`, `micro-motion`, `review-animations` | Conditional dedicated project skill for installed Motion API versions, reduced motion, and animation lifecycle. Motion is not in current dependencies. [Official reduced-motion documentation](https://motion.dev/docs/react-use-reduced-motion). |
| Supabase | `supabase:supabase` | Optional VCC cloud-sync runbook skill covering current state/history tables, auth diagnostics, and revision/conflict evidence. |
| PostgreSQL | `supabase:supabase-postgres-best-practices`, `database-testing` | Optional migration/review skill for VCC ownership predicates, query plans, and rollback evidence. [Official query optimization guidance](https://supabase.com/docs/guides/database/query-optimization). |
| Vercel | CLI, API, CI/CD, env-vars, observability skills | Restore connector access to the linked team/project; existing CLI is a verified fallback. Optional VCC release runbook skill to settle preview/production and verification routing. |
| Accessibility | `Accessibility Audit`, `a11y-pass`, responsive layout | Use installed guidance and existing route audit; add project-specific focus/keyboard acceptance criteria if gaps emerge. |
| Security | Codex Security suite and standalone best-practices/threat-model skills | Route explicitly by scan depth and scope. Optional VCC policy reference for financial payloads, attachments, backups, and cloud auth. |
| Performance | `performance`, `core-web-vitals`, performance testing | Optional project bundle-budget skill; current main chunk is 494,890/500,000 bytes, leaving only 5,110 bytes. |
| Financial calculations | `vcc-financial-calculations`, risk-based testing | Use installed repository skill as the canonical authority; optional extension for any newly scoped currency/date contract rather than another generic finance skill. |

No missing integration blocks a local commit. Chrome control needs user setup through **Settings → Computer use**; native-host repair belongs to the plugin UI. The Chrome skill explicitly prohibits repairing/installing the native host directly. GitHub and Supabase CLIs were previously reported installed, but are not executable through the current PATH; connectors and Git remain usable. Reconcile their executable installation locations before claiming CLI availability.

## Git repository readiness and exact changes

- Initial working tree was clean, and identity/origin/upstream were already configured.
- Fetch found nine local commits ahead and zero behind `origin/codex/backlog-fix-sprint`; no merge/rebase/reset is needed.
- `git fsck --connectivity-only --no-dangling` passed. Ordinary dangling objects are recoverable unused history and were left intact.
- Restricted-shell network calls failed; equivalent authorized network-enabled fetch/CLI inspection succeeded. This is a sandbox restriction, not repository corruption.
- Fetch updated remote metadata only. No application code, Git identity, remotes, hooks, history, or lock files were rewritten.
- This sprint changes the stack report, sprint record, history, and changelog. The requested push also publishes the nine previously committed local changes.
- Commit writes and push require the environment's normal Git/network permission review.

## Release validation

| Check | Result |
| --- | --- |
| Build, TypeScript, main-chunk and startup-asset budgets | Pass; 494,890-byte main chunk and 87,452-byte startup assets. |
| ESLint | Pass; zero warnings. |
| Unit suite | Pass; 201 tests across 26 files. |
| Existing Playwright integration smoke | Pass; desktop welcome/dashboard test, 1/1. |
| Playwright discovery | Pass; 114 tests. Full browser suite was not rerun for this documentation sprint. |
| Production dependency audit | Pass; zero vulnerabilities. |
| Git connectivity | Pass; reachable remote and valid connected objects. |
| Deployment | Requested; verify final result from Vercel CLI metadata after commit/push. |

Deployment is a preview in the existing linked project because the request does not explicitly specify production. Existing production rollback point: `https://vcc-h0i10yf3i-crlzel.vercel.app`. No schema migration or production-data changes are part of this audit. Prior report revisions remain available in Git history.
