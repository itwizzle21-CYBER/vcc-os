import { afterEach, describe, expect, it, vi } from "vitest";
import { createZeroData } from "../../src/lib/storage/defaultData";
import { normalizeAppData } from "../../src/lib/storage/localStore";
import { createVccBackup, parseVccBackup } from "../../src/lib/storage/backup";
import { computeFinancialState } from "../../src/lib/engine/financialEngine";
import { payBillEvent } from "../../src/lib/engine/financialEventEngine";
import { mergeAppDataWithReport } from "../../src/lib/cloud/syncMerge";
import { buildTrendReport, transactionDateMatchesReport } from "../../src/components/modules/ReportsPage";
import type { AppData, SpreadsheetRow } from "../../src/lib/types/app";

const row = (id: string, cells: Record<string, string>): SpreadsheetRow => ({ id, cells });
const today = new Date("2026-09-12T09:00:00");
const account = () => row("audit-account", { label: "Chime", section: "cash", amount: "100.00" });
const bill = (id: string, amount: string, dueDate = "2026-09-12") => row(id, {
  name: id, category: "Utilities", status: "unpaid", amount, dueDate,
});

afterEach(() => vi.useRealTimers());

describe("VCC readiness contracts — failures are unresolved product defects", () => {
  it("S1: a legacy workspace never acquires another owner's loan evidence", () => {
    const legacy: Partial<AppData> = createZeroData();
    delete legacy.carLoan;
    const normalized = normalizeAppData(legacy);
    // Assert booleans/counts so CI failures do not print private record fields.
    expect(normalized.carLoan.contract === null).toBe(true);
    expect(normalized.carLoan.receipts.length).toBe(0);
  });

  it("control: a single-device bill event is idempotent and reconciles cash", () => {
    const base = createZeroData();
    base.sections.money = [account()];
    base.sections.bills = [bill("audit-a", "10.00")];
    const input = { billId: "audit-a", paymentAccount: "Chime", paidDate: "2026-09-12" };
    const paid = payBillEvent(base, input);
    const retried = payBillEvent(paid, input);
    expect(retried.sections.money[0].cells.amount).toBe("90.00");
    expect(retried.sections.transactions).toHaveLength(1);
  });

  it("R1: two independent device payments preserve both exact account deductions", () => {
    const base = createZeroData();
    base.sections.money = [account()];
    base.sections.bills = [bill("audit-a", "10.00"), bill("audit-b", "20.00")];
    const desktop = payBillEvent(base, { billId: "audit-a", paymentAccount: "Chime", paidDate: "2026-09-12" });
    const mobile = payBillEvent(base, { billId: "audit-b", paymentAccount: "Chime", paidDate: "2026-09-12" });
    const merged = mergeAppDataWithReport(base, desktop, mobile);
    expect(merged.data.sections.transactions).toHaveLength(2);
    expect(merged.data.sections.bills.every((item) => item.cells.status === "paid")).toBe(true);
    expect(Number(merged.data.sections.money[0].cells.amount)).toBe(70);
  });

  it("R2: bills due on day seven remain in the seven-day cash pressure window", () => {
    const data = createZeroData();
    data.sections.money = [account()];
    data.sections.bills = [bill("audit-boundary", "25.00", "2026-09-19")];
    const state = computeFinancialState(data, today);
    expect(state.billsDueThisWeek).toBe(1);
    expect(state.billsPressure).toBe(25);
    expect(state.safeToSpend).toBe(75);
  });

  it("R3: confirmed zero payoff wins over a nonzero legacy car balance", () => {
    const data = createZeroData();
    data.carLoan.receipts = [{
      id: "audit-paid-off", revision: 1, status: "confirmed",
      receiptNumber: "audit-1", paymentType: "Final", paymentMethod: "Chime",
      receivedBy: "Invented audit fixture", notes: "Synthetic confirmed payoff evidence",
      paidDate: "2026-09-12", createdAt: "2026-09-12T12:00:00.000Z",
      totalPaid: 0, principalPaid: 0, interestPaid: 0, downPaymentPaid: 0,
      lateFeesPaid: 0, otherFeesPaid: 0, sideNoteFeesPaid: 0, creditsApplied: 0,
      officialPayoff: 0, accountBalance: 0, paymentsRemaining: 0,
    }];
    data.sections.carPayment = [row("audit-legacy-car", { vehicle: "Legacy", remainingBalance: "1000.00" })];
    const state = computeFinancialState(data, today);
    expect(state.carLoanOfficialPayoff).toBe(0);
    expect(state.carPaymentRemainingTotal).toBe(0);
  });

  it("R4: a newer backup data version is rejected before normalization", () => {
    const data = createZeroData();
    const envelope = { ...createVccBackup(data, {}), dataVersion: 999, data: { ...data, version: 999 } };
    expect(() => parseVccBackup(JSON.stringify(envelope))).toThrow(/version|newer|unsupported/i);
  });

  it("R5: reports reject impossible calendar dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T12:00:00"));
    expect(transactionDateMatchesReport("2026-02-30", "monthly")).toBe(false);
    expect(buildTrendReport([row("audit-invalid-date", { type: "expense", amount: "10", date: "2026-02-30" })], "monthly")).toEqual([]);
  });

  it("R6: weekly reports include today's date before noon", () => {
    vi.useFakeTimers();
    vi.setSystemTime(today);
    expect(transactionDateMatchesReport("2026-09-12", "weekly")).toBe(true);
  });

  it("R7: all-time report trends preserve different years as separate periods", () => {
    const rows = [
      row("audit-2025", { type: "income", amount: "100", date: "2025-01-10" }),
      row("audit-2026", { type: "income", amount: "200", date: "2026-01-10" }),
    ];
    const trend = buildTrendReport(rows, "all");
    expect(trend).toHaveLength(2);
    expect(trend.map((bucket) => bucket.income)).toEqual([100, 200]);
  });
});
