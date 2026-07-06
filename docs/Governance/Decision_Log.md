# Decision Log

Use this file for major product, architecture, security, financial, UI, QA, and release decisions. `WORKFLOW/DECISIONS.md` remains the active sprint memory; this file is the durable governance record.

## 2026-07-04 - Docs Become Canonical Source Of Truth

- Decision: Create `/docs` as the canonical GitHub Markdown documentation source.
- Reason: Sprint 0 requires professional repository governance and a long-term source of truth.
- Impact: Future sprints should update `/docs` for durable project knowledge and `WORKFLOW/` for operating memory.
- Status: Accepted.

## 2026-07-04 - Verified App Root Is Documents Project

- Decision: Treat `C:\Users\itwiz\Documents\Projects\VCC_OS` as the real app root.
- Reason: It contains `package.json`, `src`, `public`, `.git`, `.vercel`, build tooling, and active tests.
- Impact: `C:\Users\itwiz\Downloads\VCC-OS` should be treated as an export snapshot, not the active app.
- Status: Accepted.

## 2026-07-04 - Supabase Is Planned, Not Active

- Decision: Document Supabase/auth/RLS as planned architecture, not current implementation.
- Reason: No active Supabase client, config, migrations, or RLS policies were found in the verified app.
- Impact: Future backend work requires a dedicated architecture/security sprint.
- Status: Accepted.

## Template

```markdown
## YYYY-MM-DD - Decision Title

- Decision:
- Reason:
- Options considered:
- Impact:
- Risks:
- Owner:
- Status:
```

