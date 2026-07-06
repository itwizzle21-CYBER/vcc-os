# ADR-002: Canonical Repository

Date: 2026-07-04

Status: Accepted

## Decision

There shall be one canonical VCC-OS development repository.

Every sprint must verify the application root before implementation.

## Context

Sprint 1.3 found that `C:\Users\itwiz\Downloads\VCC-OS` is the only VCC-OS repository found under Downloads and is a valid Git root. However, it does not contain `package.json`, `src`, `public`, TypeScript config, Vite config, Playwright config, or Vercel link metadata. Meanwhile, Vercel has a live `crlzel/vcc-os` project that builds a complete `vcc-os@0.0.0` package with TypeScript and Vite.

This means future sprint work could accidentally occur in a partial export rather than the actual buildable app root.

## Reason

- Prevent engineering drift.
- Prevent duplicate repositories.
- Prevent invalid builds.
- Improve deployment reliability.
- Ensure future implementation work runs against the application that is actually deployed.

## Consequences

- Sprints must stop before implementation if the current directory is not the verified app root.
- The canonical repository must contain the app manifest, source tree, configs, Git remote, and Vercel link.
- Archive, export, and backup folders must not be used for active development.
- Documentation-only work may proceed in the current docs root, but release reports must clearly state when the app root is not buildable.

## Enforcement

Before code changes, run and record:

```text
pwd
git rev-parse --show-toplevel
git remote -v
npm run build
npm run lint
TypeScript check
tests
smoke test
git diff --check
```

