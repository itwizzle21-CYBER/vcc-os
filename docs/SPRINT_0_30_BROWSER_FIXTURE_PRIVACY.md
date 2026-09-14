# Sprint 0.30: Browser Fixture Privacy

Date: 2026-09-13. Scope: tests, QA tooling, CI comments, and documentation. Application code remains unchanged under the active restriction.

Both Playwright suites previously serialized `createStarterData()` directly into browser storage, including an owner's verified loan evidence and receipt-derived transactions. They now share `createBrowserData()`: generic regression rows remain, while the loan contract, receipt, communication, schedule, legacy loan summary, and linked transactions use invented test records.

The synthetic receipt pays 125 dollars: 120 principal plus 5 interest, reconciled as 12,500 cents. `carLoanEngine` owns component reconciliation and receipt-to-transaction mapping. The fixture preserves one linked expense transaction, an 880-dollar payoff/balance, and a matching synthetic communication/schedule. The fixture replaces the engine's vehicle-specific transaction description with a synthetic label. Account balances remain canonical and are not deducted again when assembling this already-paid fixture.

Three regression checks protect serialized owner-identifier exclusion, receipt/transaction reconciliation, and independence between separately created browser workspaces. Privacy assertions print a boolean rather than owner reference values. The QA TypeScript project now includes every browser test, global setup, and fixture; this exposed and fixed four existing persistence instrumentation cast errors through a test-only Window declaration.

## Validation

| Command | Result |
| --- | --- |
| `npm test -- tests/browserFixture.test.ts` | Three new checks pass |
| `npm run typecheck:qa` | Pass; complete browser/fixture coverage |
| `npm test` | 27 files, 204 tests pass |
| `npm run test:e2e -- --grep "exercises major navigation\|persists one app snapshot\|resets only the selected section"` | Five pass, one intentional mobile skip; 32.6 seconds |
| `npm run test:readiness` | Exit 1: eight unresolved contracts, one control pass |

The latest completed full Linux browser run, on the preceding sprint commit `0144ae95`, was [GitHub run 34785595857](https://github.com/itwizzle21-CYBER/vcc-os/actions/runs/34785595857): 100 passed, three failed, 11 intentional skips in 6.7 minutes. The failed contracts are desktop navigation bounds, cross-route accessibility target sizing, and retained-layout collision checks. Its quality/dependency job passed and financial/privacy job failed as expected. This is preceding-revision evidence; this sprint's local browser run is focused coverage.

## Remaining work

This fixes browser seed serialization, not public application assets or legacy normalization. Runtime imports still bundle owner reference evidence, so S1 remains unresolved and automatic trace/screenshot artifact uploads remain disabled. It also does not repair R1–R7, URL session adoption, or desktop layout/accessibility failures. No data migration, live account test, database operation, or financial mutation was performed.

The next product sprint remains financial integrity and private-data remediation. That work requires application changes prohibited by the active workspace instruction. A successful deployment does not establish product readiness.
