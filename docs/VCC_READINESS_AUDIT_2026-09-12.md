# VCC Product Readiness Audit — 2026-09-12

Follow-up 2026-09-14: the dedicated gate now includes S1 legacy privacy and S2 URL session adoption: **nine failures and one passing control**. See [Sprint 0.31 public-bundle gate](SPRINT_0_31_PUBLIC_BUNDLE_PRIVACY.md) and [Sprint 0.32 auth contract](SPRINT_0_32_AUTH_SESSION_CONTRACT.md). Original audit results below describe the reviewed Sprint 0.28 snapshot.

**Decision: NO-GO for production readiness.** Passing build, ordinary regression tests, dependency audit, or Vercel READY cannot override incorrect financial contracts or private-data exposure. “110% ready” is not a measurable release guarantee.

Reviewed product revision: `cdb31656c7440668ce499e1852814ed3d6dd2ed3` on `codex/backlog-fix-sprint`. Product source was inspected without modifying application code. Authorized changes improve documentation, tests, and compatible tooling lockfile resolutions.

## Confirmed financial, backup, and reporting flaws

The dedicated gate is `npx vitest run --config tests/audit/vitest.config.ts`. It runs eight ordinary assertions: one passing control and **seven failing contracts**. Failures are intentionally visible, not skipped or inverted. The default npm test suite does not include the .audit.ts files; both commands are required.

| ID / priority | Reproduction and actual result | Required behavior / source |
| --- | --- | --- |
| R1 / P1 | From a synthetic balance of 100, two devices independently pay different bills of 10 and 20. Merge retains both transactions and paid bills, but balance is 80. | Balance must reconcile to 70. Generic same-field conflict resolution is not a financial event merge. src/lib/cloud/syncMerge.ts; financialEventEngine.ts. |
| R2 / P1 | Reference date September 12 at 09:00; bill of 25 due September 19. Seven-day count is 0. | Day seven must remain included; pressure 25 and safe-to-spend 75 from cash 100. financialEngine.ts:345/355 compare noon dates to midnight end boundaries. |
| R3 / P1 | Latest confirmed payoff is zero; legacy car balance is 1000. Summary reports 1000 remaining. | Confirmed zero is authoritative. financialEngine.ts:156 uses a truthiness fallback. localStore.ts has a related zero fallback. |
| R4 / P1 | A backup with envelope/data version 999 is accepted and normalized. | Reject unsupported future data versions before changing state. backup.ts:53 validates formatVersion but not supported dataVersion. |
| R5 / P2 | Reports accept impossible date 2026-02-30 as a March transaction. | Validate real calendar dates; avoid JavaScript rollover. ReportsPage.ts:125. |
| R6 / P2 | At September 12 09:00, weekly reports exclude September 12. | Include the complete current calendar day. ReportsPage.ts:125 compares a noon transaction date to current wall time. |
| R7 / P2 | January 2025 income 100 and January 2026 income 200 collapse into one Jan bucket of 300. | Preserve year/month identity, order, and totals. ReportsPage.ts:152. |

The passing control proves a single-device bill payment is idempotent and reconciles one deduction/transaction. It does not establish cross-device safety. All examples above use invented data.

## Security findings

Two source-confirmed findings were independently discovered and parent-validated:

- **S1 / P1 remediation priority, medium security severity:** verified owner loan terms and supplied receipt metadata are hard-coded in src/lib/storage/carLoanReference.ts and retained by localStore normalization. A parent identifier search matched both contract and receipt IDs in the emitted main JavaScript asset. Fresh empty data and omitted images/full VIN limit exposure but do not remove publicly shipped structured financial records. Remove actual records from runtime assets; use invented fixtures or deliberate owner imports.
- **S2 / P1 conditional, medium security severity:** src/lib/cloud/client.ts:6 enables URL session detection with the SDK's default implicit flow. Installed auth-js 2.71.1 accepts valid URL token parameters without browser-initiated state, persists the session, and announces sign-in. useVccCloudSync.ts:240 automatically uploads existing local finances when the adopted account lacks a cloud row. An attacker needs another permitted non-anonymous account, a configured integration, victim navigation, and existing local data. RLS correctly permits the attacker's owner row; no RLS bypass is claimed. Disable URL adoption for OTP code entry and confirm the account before first attaching local data. No live exploit or private-data upload was performed.

Security scan ID: `9ea5256f-41c9-4fe3-88b0-209df0a3abcd`, completed and sealed. Scope coverage is partial: core auth, sync, storage, receipt processing/rendering, evidence handling, hosting controls, and four migrations were reviewed; not every documentation/style/test/helper file was fully examined. Secret contents and live services were excluded from that static scan. Installed SDK source and emitted-asset searches were narrowly used for validation. The scan warns that working-tree content changed during review; results refer to the original revision. Changes were tests, docs, and tooling resolutions, with product application source unchanged.

Owner RLS declarations, constrained private history trigger, React text rendering, and evidence type/size limits were verified in source. A separate post-scan read-only metadata check on vcc-os-production confirmed RLS enabled on all three tables, owner predicates on SELECT/INSERT/UPDATE/DELETE, history SELECT ownership, and no anon table grants. This is live configuration evidence, not test-account proof of effective access denial. Auth provisioning remains unverified. Authenticated grants also include REFERENCES/TRIGGER/TRUNCATE on the two writable tables; review least-privilege removal in a database sprint. No exposed truncate/trigger execution route was established, and no database mutations were performed.

## Additional browser and architecture findings

- Browser target-size gate reproducibly found the dashboard “Review Money Snapshot” link measuring 177 × 19 px, including a focused rerun after awaiting the route's main heading. This fails the project's 24 px target contract. A standards claim requires checking spacing/inline exceptions; the internal test remains red.
- Layout sweep found Money Snapshot layout 5 structural overflow at 320 px and Bills layout 5 text/structural overflow at 320 and 900 px. Preserve failure screenshots/traces and repair containers/text wrapping before declaring narrow-screen polish complete.
- financialEngine.ts:147 derives starting debt from current debt plus a fixed 5000. Debt-free progress is not tied to an actual starting balance. Replace it with a recorded baseline or explicitly unavailable progress.
- Shared workspace localStorage is origin-wide and logout retains finances. Define account switching/shared-browser behavior and partition or explicitly confirm data attachment.
- Cloud save lifecycle has overlapping async operations and weak remote shape checks. Add synthetic race/error/refresh/sign-out tests before claiming sync reliability.
- localStore/main startup and persistence need graceful handling of browser storage denial/quota and malformed state. No application error boundary was found.
- Backup/cloud snapshots store attachment references, while image/PDF blobs remain device-local IndexedDB records. A JSON restore cannot promise complete evidence recovery.
- VitaScan OCR image input lacks a strict byte/pixel bound; very large user-selected images can exhaust browser resources.
- VitaScan service-worker cleanup deletes every other origin cache and does not precache the required runtime JS/CSS/OCR resources. Verify the complete intended offline workflow.
- Date-sensitive financial state is memoized on data changes; a long-lived session can show yesterday's decisions across midnight.
- No CI workflow or production error-monitoring integration was found. Add release gates and observability after correcting data integrity/privacy.

These source observations are improvement tasks, not runtime-proven exploits.

## Risk-based coverage and next actions

Priority is impact-first: P1 protects confidential data, cash/debt integrity, and recoverability; P2 corrects analytics and usability. No invented confidence percentage is used.

| Area | Evidence / next gate | State |
| --- | --- | --- |
| Build/tooling | Lint, typecheck, build and budget commands; audit/e2e test types checked separately | Pass, including rebuilt output after tooling patches |
| Ordinary unit regression | 26 files, 201 tests after Vitest patch | Pass |
| Financial event integrity | Single-device control passes; concurrent deductions fail | Blocked |
| Financial date/debt calculations | Seventh day and zero payoff fail | Blocked |
| Reports | Invalid dates, morning inclusion, year buckets fail | Blocked |
| Backup recovery | Future data version accepted; blobs not portable | Blocked |
| Authentication/privacy | URL adoption chain; public loan reference records | Blocked |
| Cloud authorization | Owner RLS/trigger declarations inspected; deployed RLS/policy/grant metadata checked | Test-account denial verification pending |
| Browser navigation/edit flows | Full 114-case run: 99 passed, four failed, 11 intentional project skips; focused current-test rerun described below | Product usability gates remain red |
| Accessibility | Internal target-size failure; manual assistive-tech review absent | Blocked / incomplete |
| Responsive layout | Money/Bills overflow in retained-layout sweep | Blocked |
| OCR/offline | Local OCR handoff works in browser; bounds/offline gaps | Partial |
| Performance | Main asset 494890 bytes against 500000 budget before patch; field CWV unmeasured | Partial |
| Deployment/operations | Previous preview revision verified; CI/observability absent | Partial |

## Work completed within the constraint

Full browser run exited 1 in 15.9 minutes. Failures were desktop target size, desktop layout sweep, a stale global-search route assertion, and a mobile heading check performed before lazy route content settled. The latter two were corrected in tests, without relaxing assertions. Focused rerun exited 1 in 2.0 minutes: two passed, two failed, two intentional project skips. Current desktop controls and mobile accessibility checks pass; the real desktop target/layout failures remain. The original HTML report/traces are in output/playwright/report and output/playwright/results; focused traces use output/playwright/audit-rerun. Normal browser route tests found no application runtime errors.

- Added executable readiness contracts and a separate explicit red release gate.
- Updated browser tests to use the mission CTA, All Bills tab, explicit payment review/submission, current filters, and scoped spreadsheet Add Bill action.
- Patched compatible tooling dependencies via npm update: Vitest 4.1.11, browserslist 4.28.9, baseline-browser-mapping 2.11.23, js-yaml 4.3.2 and associated transitive packages. No package.json application dependency declaration changed. npm audit went from five affected packages (two high, three moderate) to zero; ordinary unit suite passes after patch.
- Refreshed QA/security/engineering/roadmap and architecture documentation. Corrected the OCR-text cloud recipient claim.

Advisory evidence: [Vitest](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [js-yaml](https://github.com/advisories/GHSA-2883-xcg3-v3hh), [baseline mapping](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv). A zero package audit describes published advisories for this dependency tree, not complete application security.

## Completion limitation

The developer-provided workspace commit instruction explicitly says **“Do not modify application code.”** The confirmed product fixes require changes under src/public and cannot be implemented under that constraint. No user confirmation can override it. The prioritized next sprint is concrete in Roadmap.md; all correct failing expectations remain visible until authorized instructions permit product remediation.

Do not promote this audit preview as production-ready. Complete the product fixes, pass both regression and audit suites, resolve browser failures, verify live synthetic-account RLS/auth, test backup restoration, and review accessibility/performance before declaring release readiness.
