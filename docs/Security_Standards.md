# Security Standards

## Principles

- Treat VCC data as sensitive financial and life-operations data.
- Never expose secrets in client code.
- Do not claim remote security controls exist until they are implemented and verified.
- Require explicit authorization before remote persistence.

## Current Security Model

- Browser-local data stored in localStorage.
- Reset requires typing `RESET`.
- Export/import are user-triggered.
- No active authentication.
- No active Supabase/RLS.

## Future Supabase/Auth Requirements

If Supabase is adopted:

- Enable RLS on every exposed table.
- Use ownership predicates for user-owned rows.
- Use both `USING` and `WITH CHECK` for update policies.
- Do not use user-editable metadata for authorization.
- Do not expose service role keys to browser code.
- Add policy tests before production data.

## Release Security Checklist

- No secrets in diff.
- No service role keys.
- No accidental remote write path.
- Data import/export remains user-controlled.
- Destructive controls are confirmed.

