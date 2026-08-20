# Sprint 0.16 — Performance and Core Web Vitals Skills

Completed: 2026-08-20

## Goal

Close the performance-specialization gap identified by the Sprint 0.6 AI-stack audit before the next application optimization sprint.

## Scope

- Reviewed the current `addyosmani/web-quality-skills` performance package in the in-app Browser and its public GitHub source.
- Installed the `performance` skill and its directly referenced `core-web-vitals` companion into the user-level Codex skill directory.
- Verified both skill structures and their reciprocal local references.
- Smoke-tested the official VCC deployment in the in-app Browser.
- Reconciled the AI-stack inventory, recommendations, sprint history, and changelog.

Application code, dependencies, runtime configuration, databases, and production data were not changed.

## Installed skills

| Skill | Location | Purpose |
| --- | --- | --- |
| `performance` | `C:\Users\itwiz\.codex\skills\performance` | Lighthouse-oriented performance budgets, loading strategy, runtime efficiency, caching, and measurement. |
| `core-web-vitals` | `C:\Users\itwiz\.codex\skills\core-web-vitals` | LCP, INP, and CLS diagnosis and optimization. |

The companion was installed because `performance/SKILL.md` links directly to `../core-web-vitals/SKILL.md`; installing only `performance` would leave that local reference unresolved.

## Source review

- Source: `addyosmani/web-quality-skills`, MIT licensed.
- Registry page reported 30K installs, approximately 2.6K GitHub stars, and passing Agent Trust Hub, Socket, and Snyk audits at review time.
- The performance directory contains only `SKILL.md`.
- The Core Web Vitals directory contains `SKILL.md` and one Markdown reference; neither installed skill contains executable scripts.

## Validation

| Gate | Result |
| --- | --- |
| `performance` skill structure/frontmatter | Pass; official `skill-creator` validator returned `Skill is valid!` |
| `core-web-vitals` skill structure/frontmatter | Pass; official `skill-creator` validator returned `Skill is valid!` |
| Reciprocal companion references | Pass |
| Official deployment navigation | Pass; `https://vcc-os.vercel.app/` resolved with title `VCC-OS` |
| Live dashboard readiness | Pass; `VCC-OS Dashboard` rendered after the intro |
| Browser console errors | None observed |
| Application code and dependency changes | None |
| Repository whitespace check | Pass |

## Release decision

GO for commit. The installed skills will be available to newly evaluated Codex turns. No Vercel deployment is required because the sprint changes agent capability and documentation only.

Rollback is removal of the two user-level skill directories and reversal of this sprint's documentation commit. No application or user financial data is affected.
