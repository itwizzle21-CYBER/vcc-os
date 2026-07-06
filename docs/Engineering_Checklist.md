# Engineering Checklist

Sprint: 1.3 - Engineering Environment Validation

Date: 2026-07-04

| Check | Status | Evidence / Blocker |
| --- | --- | --- |
| Repository verified | Partial | `C:\Users\itwiz\Downloads\VCC-OS` is a Git root and the only VCC-OS folder found under Downloads. |
| Correct root | Blocked | Local folder is not buildable and does not match the complete source Vercel is building. |
| Documentation root verified | Pass | `/docs` exists and contains canonical project documentation. |
| Build passes | Fail | `npm run build` fails because `package.json` is missing. |
| Lint passes | Fail | `npm run lint` fails because `package.json` is missing. |
| Type check passes | Blocked | No local TypeScript config or dependency install exists. |
| Tests pass | Blocked | No local test runner config or package manifest exists. |
| Smoke test passes | Blocked | Local HTTP clients failed before response due Windows TLS/credential layer; Vercel deployment itself reports `READY`. |
| Git verified | Partial | Git work tree exists on `main`; no `origin` remote is configured; work tree has uncommitted docs/archive changes. |
| GitHub verified | Fail | Cannot verify GitHub repository because `origin` is not configured. |
| Vercel verified | Partial | Vercel account and project `crlzel/vcc-os` exist; production deployment is `READY`; local folder is not linked. |
| Playwright verified | Blocked | No Playwright config or local install found. |
| Deployment verified | Partial | Production and preview deployments exist and are `READY`; local source cannot be proven to be their source. |

## Required Per-Sprint Preflight

Every future sprint must begin with:

1. Confirm `pwd`.
2. Confirm `git rev-parse --show-toplevel`.
3. Confirm `package.json` exists at the Git root.
4. Confirm `src/`, `public/`, TypeScript config, Vite config, and test config exist.
5. Confirm `git remote -v`.
6. Confirm `.vercel/project.json` points to the intended project.
7. Run build, lint, type check, tests, smoke test, and `git diff --check`.

## Required Per-Sprint Completion Gate

Every sprint, feature, bug fix, or workflow change must end with:

1. Build the project.
2. Run lint.
3. Run type checks.
4. Run all relevant tests.
5. Fix any failures before continuing.
6. Commit changes with a clear commit message.
7. Push to GitHub.
8. Deploy to Vercel.
9. Smoke test the deployed site.
10. Present a clickable Preview URL before asking for review.
11. Publish a Release Report with:
    - Files changed
    - Features added
    - Bugs fixed
    - Tests run
    - Commit hash
    - GitHub branch
    - Deployment URL
    - Smoke test result

If deployment fails, diagnose the issue, fix it when safely actionable, redeploy, and verify before ending the task. If an environment blocker prevents completion, record the exact blocker and next required manual action.
