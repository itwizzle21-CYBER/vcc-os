# Sprint 0.14 — Security, Accessibility, and Release Hardening

Completed: 2026-08-14

## Goal

Close the production-readiness loop with a changed-surface security review, WCAG 2.2 AA measurable checks across every route, release evidence, and an explicit rollback decision.

## Security Review

Threat model:

- Assets: private financial records, local recovery snapshots, authenticated cloud state, and device sync bases.
- Boundaries: user-selected JSON files, browser local storage, Supabase authenticated rows, realtime device messages, and the Vercel static application boundary.
- Attacker capabilities considered: malicious backup content supplied to a user, oversized local files, compromised same-account device edits, unauthenticated cloud access, and script injection through imported values.
- Security objectives: preserve data confidentiality, prevent cross-user cloud access, bound untrusted parsing, prevent script execution, and avoid silent integrity loss during concurrent edits.

Reviewed surfaces included all 23 release-diff files from `origin/main`, with supporting inspection of storage normalization, Supabase client/RLS assumptions, file input, URL creation, cloud revision filtering, and rendered imported values. The app-backed scanner could not adopt a stale desktop working-tree selection; its capability preflight returned READY and the documented single-parent fallback was used.

One low-reachability availability risk was found and fixed before release: a user-selected JSON file had no size ceiling before `FileReader` and `JSON.parse`. VCC now rejects files over 5 MB in both the UI and parser contract. No reportable security finding remains after remediation. `npm audit --omit=dev` reports zero vulnerabilities.

## Accessibility Review

- Ran the `a11y-pass` built-in measurable auditor across 15 application and not-found routes: zero measured failures.
- Expanded the permanent browser regression from dashboard-only to every route.
- The regression checks accessible names, labels, 24×24 minimum targets, exactly one `h1`, and one `main` landmark.
- Existing browser coverage verifies modal focus containment/return, Escape behavior, mobile drawer inertness, keyboard spreadsheet navigation, and live status regions.
- Desktop and mobile all-route accessibility reruns passed.

This is a measured automated pass plus keyboard/focus and accessibility-tree spot coverage; it is not a claim of certification by a human screen-reader audit.

## Release Gates

| Gate | Result |
| --- | --- |
| Production build | Pass |
| Application bundle budget | Pass; 450,778 / 500,000 bytes |
| ESLint | Pass, zero warnings |
| TypeScript | Pass |
| Unit tests | 165 passed across 24 files |
| Production dependency audit | 0 vulnerabilities |
| Browser matrix | 69 passed, 10 intentional skips; 3 infrastructure timeouts all passed on exact isolated rerun |
| Changed-file whitespace | Pass |

The three initial browser failures were worker/network-suspension timeouts after a prolonged run, not failed product assertions. Exact reruns passed: desktop cash-income behavior 1/1; mobile all-route accessibility and route structure 2/2.

## Release Decision

**GO** for commit and production deployment. There are no database migrations, dependency upgrades, or irreversible state transforms in this release.

Rollback trigger: restore the prior Vercel production deployment immediately for any route-load failure, new cross-user cloud access, data-loss report, repeated same-field reconciliation loop, or backup/recovery failure. Rollback is a Vercel deployment promotion/redeploy of the previous production artifact; local recovery points and backups remain forward-compatible data owned by the user.
