# VCC Changelog

Track production-impacting changes and deployments here.

## Unreleased

- Created the permanent `WORKFLOW/` folder and consolidated workflow guidance into it.
- Prepared full-testing baseline by adding section-backed Budget, Buy Next, and Activity pages.
- Restored Settings as the data/status control page with reset, storage, app/version, and data-management information.
- Cleaned reset defaults so starter financial numbers are blank or zero-safe, and guarded engines against blank saved rows creating false bill/debt/goal alerts.
- Removed visible broken glyph text from dashboard alert/recommendation components.
- QA Sprint: added required Settings controls for Export Data, Import Data, Backup / Restore, Developer Diagnostics, and Clear Cache; hardened localStorage read/write/import error handling.
- Lead QA Sprint: fixed Settings import/restore feedback staying hidden after navigation, hardened malformed imported row handling, and restored the ESLint flat config so `npm run lint` works.
- Lead QA Sprint: expanded TypeScript app coverage so root `App.tsx` and `Dashboard.tsx` are checked by `npm run build`.
- Sprint 6: aligned Settings labels with release-candidate requirements, ignored local installed-skill artifacts, and removed obsolete fallback workflow memory files from the release set.
- Added Playwright production smoke workflow for post-deploy checks of production loading, dashboard, navigation, Settings controls, main pages, and console errors.
- Sprint 7: restored Settings as a hash-routed page, aligned Settings controls/cards to the required labels, and tightened desktop sidebar spacing so all nav tabs fit while preserving mobile bottom nav.
- Sprint 0: verified the real app root, added `/docs` as the canonical GitHub Markdown documentation source, and added governance, audit, health, architecture, security, financial, QA, UI, roadmap, and sprint-history documentation.
- Sprint 0.5: validated the foundation docs with build, lint, TypeScript check, and production smoke; created `docs/Baseline_Report.md`; baseline tag remains pending because Git staging is blocked by `.git/index.lock` permission denial.
- Sprint 1.1: completed dashboard intelligence audit documentation, including dashboard inventory, architecture review, QA checklist, risk assessment, and prioritized backlog; no application code changed.
- No production deployment performed.

## Deployment Template

```markdown
## YYYY-MM-DD - Deployment Name

- Production URL: https://vcc-os.vercel.app
- GitHub branch/commit:
- Feature/fix:
- Build command/result:
- Code review:
- Deploy command/result:
- Verification:
- Rollback notes:
```
