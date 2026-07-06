# QA Standards

## Required Gates

- `npm.cmd run build`
- `npm.cmd run lint`
- `git diff --check`
- Local smoke when UI/routes are touched
- Production smoke after deploy

## Manual QA Checklist

- Dashboard loads.
- Sidebar/nav tabs are visible and usable.
- Mobile bottom nav remains usable.
- Settings opens by navigation and `#/settings`.
- Reset/export/import/clear-cache controls remain visible.
- Main module pages open.
- Spreadsheet grids remain editable where intended.
- Dashboard remains read-only.
- No console/page errors in smoke tests.

## Decision Engine QA

- Priority alerts still render.
- Recommended move still renders.
- Mission stack still renders.
- Metrics do not show false pressure from blank starter rows.
- New sections do not silently bypass engine review.

## Blocker Reporting

If a gate cannot run, report:

- Command
- Result
- Why it failed
- Exact next action

