# Repository Location Report

Sprint: 1.3 - Engineering Environment Validation

Date: 2026-07-04

## Canonical Root Check

| Item | Result |
| --- | --- |
| Current working directory | `C:\Users\itwiz\Downloads\VCC-OS` |
| Git root | `C:/Users/itwiz/Downloads/VCC-OS` |
| `.git` location | `C:\Users\itwiz\Downloads\VCC-OS\.git` |
| `package.json` location | Not found in repository or under `C:\Users\itwiz\Downloads`. |
| `src` location | Not found in repository or under `C:\Users\itwiz\Downloads`. |
| `public` location | Not found in repository or under `C:\Users\itwiz\Downloads`. |
| `.vercel` location | Not found in repository or under `C:\Users\itwiz\Downloads`. |
| `tsconfig` | Not found. |
| Vite config | Not found. |
| Playwright config | Not found. |
| `vercel.json` | Not found locally. |

## Duplicate Copy Search

Search scope: `C:\Users\itwiz\Downloads`.

Found VCC-related folders:

| Location | Evidence | Recommendation |
| --- | --- | --- |
| `C:\Users\itwiz\Downloads\VCC-OS` | Only VCC-related directory found under Downloads; contains `.git`; contains flat TypeScript/React files and `/docs`. | Keep as the canonical local folder name, but restore the missing application manifest/source tree before implementation work. |

No additional VCC-OS copies, `.git` folders, `.vercel` folders, `package.json` files, `src` folders, `public` folders, Vite configs, TypeScript configs, or Playwright configs were found under `C:\Users\itwiz\Downloads`.

## Canonical Root Decision

`C:\Users\itwiz\Downloads\VCC-OS` is the only local VCC-OS repository found in the inspected workspace area. It should be treated as the canonical local development folder only after its application source tree is restored and aligned with the Vercel project.

Important blocker: Vercel production builds show a complete app package named `vcc-os@0.0.0` with `npm run build`, TypeScript, and Vite. That complete package is not present in the local repository snapshot. Therefore, the currently inspected folder is not yet a verified buildable application root.

## Standard Folder Recommendations

| Purpose | Recommended Location | Notes |
| --- | --- | --- |
| Canonical Development Folder | `C:\Users\itwiz\Downloads\VCC-OS` | Use this as the single working folder after restoring `package.json`, `src`, `public`, configs, and Vercel link metadata. |
| Archive Folder | `C:\Users\itwiz\Downloads\VCC-OS\docs\archive` | Already used for legacy documentation. Do not use archived docs as active source. |
| Export Folder | Outside the canonical repo, for example `C:\Users\itwiz\Downloads\VCC-OS-exports` | Keep exports out of the Git work tree unless intentionally tracked. |
| Backup Folder | Outside the canonical repo, for example `C:\Users\itwiz\Downloads\VCC-OS-backups` | Keep backups read-only/archive-only to prevent accidental sprint work in stale copies. |

## Root Verification Commands Run

| Command | Result |
| --- | --- |
| `pwd` | `C:\Users\itwiz\Downloads\VCC-OS` |
| `git rev-parse --show-toplevel` | `C:/Users/itwiz/Downloads/VCC-OS` |
| recursive app marker search | No package/config/source markers found beyond `.git` and `/docs`. |

## Required Fix Before Feature Work

Restore or fetch the complete application root that Vercel is building, then ensure this folder contains:

- `package.json`
- lockfile
- `src/`
- `public/`
- `tsconfig.json`
- Vite config
- Playwright config, if smoke tests are expected
- `.vercel/project.json` linked to `crlzel/vcc-os`
- Git remote `origin` pointing at the GitHub repository

