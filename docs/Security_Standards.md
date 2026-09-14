# Security Standards

Updated 2026-09-14 for the implemented React/Vite browser application.

## Actual boundaries

The financial workspace is available locally before authentication. It stores complete financial state in origin-local localStorage and evidence blobs in IndexedDB. Supabase OTP authentication protects optional cloud synchronization. Logout retains the local workspace; local state is not partitioned by authenticated account.

Repository migrations enable owner RLS for app snapshots, receipt rows, and read-only history. Anonymous table access is revoked. These declarations must be verified against the deployed database before claiming live isolation.

VitaScan sends reviewed structured fields and formatted OCR archive text to Supabase when connected. The inspected adapter does not upload image blobs. Portable JSON backups do not include IndexedDB attachment blobs.

## Required improvements before release

- Remove actual owner loan/receipt records from publicly delivered runtime source and assets. Use invented fixtures or deliberate owner imports.
- Bind sign-in to a deliberate browser-initiated flow. Current URL session detection plus automatic first cloud upload has a source-confirmed account-substitution path, conditional on an attacker holding another permitted account.
- Confirm the destination account before attaching an existing local workspace.
- Verify cross-owner access denial and anonymous denial on the deployed database using test accounts and synthetic records.
- Verify logout/error/session-refresh behavior and define shared-browser privacy explicitly.
- Apply and verify hosting CSP, frame denial, nosniff, and permissions headers.
- Keep secrets and private records out of diffs, build artifacts, and fixtures. Publishable keys are browser configuration, not server authorization.
- Maintain patched dependencies and review auth/database/OCR/toolchain updates.

## Policy controls

Use durable auth user IDs for row ownership, never editable metadata. Updates require both USING and WITH CHECK ownership predicates. Privileged history triggers must use qualified objects, a constrained search path, revoked direct execution, and owner-filtered reads. Browser filters do not replace database enforcement.

Record source review and live verification separately. See [current readiness audit](VCC_READINESS_AUDIT_2026-09-12.md). Do not claim a clean security assessment while these findings remain unresolved.

The S2 executable auth contract now reproduces SDK session adoption/persistence with synthetic URL tokens and a fake auth response using actual VCC options. Disabled callback detection prevents adoption while an explicit OTP verification control still passes. This is isolated client verification; it does not validate live JWTs, exercise database policies, or reproduce the downstream first financial upload. The current ordinary source configuration test still expects URL detection enabled; it describes existing behavior and is not security acceptance.
