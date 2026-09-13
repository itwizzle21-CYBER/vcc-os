# Roadmap

Updated 2026-09-12. Repository restoration and canonical financial-engine foundations are already implemented. The next work is correctness and privacy, with acceptance checks rather than an arbitrary readiness percentage.

## Next sprint: Financial integrity and private data

Production release remains NO-GO until these are addressed:

1. Remove real loan reference records from runtime/public assets. Scan emitted assets for known private identifiers and use invented fixtures.
2. Disable uninitiated URL session adoption for the OTP code-entry flow; require account confirmation before first uploading existing local data. Test with a fake SDK and synthetic accounts.
3. Make concurrent bill events reconcile account balances and transactions atomically. Two devices paying 10 and 20 from 100 must converge to 70 in both merge directions, including retry/delete/undo cases.
4. Include the full seventh due date in seven-day pressure and safe-to-spend calculations. Test midnight/noon, month/year crossings, DST, and overdue bills.
5. Preserve a confirmed zero loan payoff instead of falling back to legacy debt.
6. Reject future backup data versions before normalization or state mutation.
7. Validate calendar dates and use calendar boundaries consistently in reports. Keep different years distinct in all-time trends.

The seven executable R1–R7 contracts are in `tests/audit/readiness.audit.ts`. Run the dedicated config in addition to the ordinary suite.

## Following sprint: Resilience and verifiable operations

- Serialize cloud saves and guard stale async results across sign-out/token refresh; expose failed saves accurately.
- Add storage-failure handling and a recovery/error screen.
- Define loan/debt progress from an actual recorded baseline.
- Make evidence attachments portable or clearly disclose device-only attachment recovery.
- Bound OCR image bytes/pixels and verify offline OCR behavior.
- Scope service-worker cache cleanup and cache the required runtime shell.
- Add CI release gates, live test-account RLS checks, accessible keyboard/screen-reader review, field performance measurements, and production error monitoring.
- Refresh derived date-sensitive decisions across midnight without requiring a data edit.

See [readiness audit](VCC_READINESS_AUDIT_2026-09-12.md) for evidence, confidence, and release limitations. Product code remediation remains constrained by the active no-application-code instruction.
