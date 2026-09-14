# Sprint 0.32: Auth Session Contract

Date: 2026-09-14. Scope: tests, synthetic fixtures, and documentation. No application/auth configuration changes.

S2 is now an executable client contract. The installed Supabase SDK runs with actual `cloudAuthOptions`, a fabricated token URL, a synthetic permitted user response, and in-memory browser storage. No sign-in method is called. The correct expectation is no adopted session, no stored session, and no auth request. Current behavior instead adopts and persists the synthetic account after querying the fake user endpoint, so the dedicated readiness gate fails.

Three ordinary controls pass: an empty browser stays signed out, disabling URL callback detection ignores supplied tokens, and an explicit email OTP verification still creates/persists a session with callback detection disabled. They demonstrate that avoiding URL adoption does not inherently prevent code-entry authentication. They do not change VCC's runtime options, which still enable callback detection.

## Isolation and evidence

The harness clears the Vite service URL/key before importing VCC's client so its configured singleton remains off. It uses `.invalid` hosts, invented credentials and users, a fetch function that refuses other hosts/routes, disabled browser broadcast channels, a hidden document to prevent background refresh, and cleanup of subscriptions/refresh/globals/environment after every case. Session failure output contains booleans/counts, not credentials.

| Check | Result |
| --- | --- |
| Focused auth harness controls | Three pass |
| Ordinary unit suite | 29 files, 214 tests pass |
| QA TypeScript | Pass; auth fixture/audit included |
| Dedicated readiness suite | Exit 1; nine failures (R1–R7, S1, S2), one passing payment control |

The prior Sprint 0.31 [GitHub run 34806760886](https://github.com/itwizzle21-CYBER/vcc-os/actions/runs/34806760886), revision `6532de64`, completed with quality/dependency checks passing. Public privacy detected ten identifiers in one of 25 JavaScript files and failed; financial/privacy contracts failed. Browser coverage had 100 passes, three desktop navigation/accessibility/layout failures, and 11 intentional skips in 5.5 minutes. This is preceding-revision evidence; no local full browser rerun was needed for this test-only auth harness.

## Sources and limits

Checked the current [Supabase changelog](https://supabase.com/changelog.md) and installed auth source; no relevant browser callback breaking change was identified. The [official implicit-flow documentation](https://supabase.com/docs/guides/auth/sessions/implicit-flow) describes extracting URL fragment tokens and persisting the resulting session. The behavior is an SDK-supported flow; VCC must deliberately select and confirm an authentication flow appropriate to its existing local workspace.

This test uses a fake auth service. It does not validate real JWT signatures, attack live accounts, exercise RLS, read private records, or run the downstream first cloud upload. That upload path remains separately source-confirmed and conditional on an adopted permitted account and an existing local workspace. The hook currently treats non-anonymous sessions as shared accounts and provisions a cloud snapshot when none exists; destination-account consent remains unimplemented.

Application repair must disable uninitiated callback adoption for the code-entry path and confirm the destination account before uploading an existing local workspace. S2 must then pass alongside S1, R1–R7, and public privacy. These repairs remain blocked by the active no-application-code instruction. READY deployment does not establish security or financial readiness.
