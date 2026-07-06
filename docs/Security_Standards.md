# Security Standards

## Principles

- User financial data is sensitive.
- Authentication must be explicit and testable.
- Authorization must be enforced server-side.
- Never expose service-role credentials or database secrets to client code.
- Do not store secrets in the repository.

## Current Security Posture

- Auth is referenced but incomplete in this snapshot.
- No Supabase client or RLS policies were found.
- MySQL/Drizzle schema files exist.
- No local secret files were found during Sprint 0 audit.

## Supabase And RLS Standards

If Supabase is adopted:

- Enable RLS on every table in exposed schemas.
- Use `TO authenticated` with row ownership predicates.
- For updates, require both `USING` and `WITH CHECK`.
- Do not use user-editable metadata for authorization decisions.
- Do not use `SECURITY DEFINER` to bypass access issues.
- Add policy tests for every table.

## Auth Standards

- Protected routes and procedures must verify the current user.
- User-owned rows must include a durable user identifier.
- Logout must clear server and client session state.
- Session behavior must be documented and tested.

## Dependency Standards

- Commit lockfiles.
- Pin major dependency versions intentionally.
- Review auth, database, and payment dependency changes before deployment.

## Release Security Checklist

- No secrets in diff.
- No public service-role keys.
- No new unauthenticated data access.
- No missing authorization on mutations.
- No financial data export without user intent.

