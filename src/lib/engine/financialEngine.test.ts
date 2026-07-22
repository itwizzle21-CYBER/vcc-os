import { describe, expect, it } from "vitest";
import { createStarterData, createZeroData } from "../storage/defaultData";
import type { SpreadsheetRow } from "../types/app";
import { computeFinancialState } from "./financialEngine";

function row(id: string, cells: Record<string, string>): SpreadsheetRow {
  return { id, cells };
}

describe("financial dashboard totals", () => {
  it("does not double-count the starter emergency fund across dashboard modules", () => {
    const state = computeFinancialState(createStarterData());

    expect(state.protectedSavings).toBe(12800);
    expect(state.availableSavings).toBe(3200);
    expect(state.totalCash).toBe(19480.32);
  });

  it("uses Savings buckets as the source of truth instead of double-counting Money Snapshot mirrors", () => {
    const data = createZeroData();
    data.sections.money = [row("money-savings", { label: "Emergency Fund", section: "savings", amount: "$1,000" })];
    data.sections.savings = [row("savings-emergency", { name: "Emergency Fund", protected: "Yes", balance: "$1,000" })];

    const state = computeFinancialState(data);

    expect(state.protectedSavings).toBe(1000);
    expect(state.totalCash).toBe(1000);
  });

  it("falls back to the latest locked paycheck instead of the largest historical balance", () => {
    const data = createZeroData();
    data.paycheckHistory = [
      { id: "latest", payDate: "2026-07-18", income: "200", spotMe: "0", myPay: "0", remaining: "100", weekStart: "", weekEnd: "", locked: true },
      { id: "older", payDate: "2026-07-11", income: "1200", spotMe: "0", myPay: "0", remaining: "900", weekStart: "", weekEnd: "", locked: true },
    ];

    expect(computeFinancialState(data).totalCash).toBe(100);
  });

  it("honors an explicit zero cash balance instead of reviving historical cash", () => {
    const data = createZeroData();
    data.sections.money = [row("cash", { label: "Checking", section: "cash", amount: "$0" })];
    data.paycheckHistory = [
      { id: "history", payDate: "2026-07-18", income: "900", spotMe: "0", myPay: "0", remaining: "900", weekStart: "", weekEnd: "", locked: true },
    ];

    expect(computeFinancialState(data).totalCash).toBe(0);
  });

  it("does not turn a negative borrowed balance into positive debt", () => {
    const data = createZeroData();
    data.sections.money = [{ id: "advance", cells: { label: "Advance", section: "borrowed", amount: "-25" } }];

    expect(computeFinancialState(data).borrowedMoney).toBe(0);
  });

  it("keeps unpaid and overdue bill amounts in dashboard pressure", () => {
    const data = createZeroData();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayLocal = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, "0"),
      String(yesterday.getDate()).padStart(2, "0"),
    ].join("-");
    data.sections.bills = [
      row("overdue", {
        name: "Electric",
        amount: "$125.50",
        dueDate: yesterdayLocal,
        status: "unpaid",
      }),
    ];

    const state = computeFinancialState(data);

    expect(state.overdueBills).toBe(1);
    expect(state.billsPressure).toBe(125.5);
  });

  it("removes cancelled bills from priority pressure", () => {
    const data = createZeroData();
    data.sections.bills = [row("cancelled", {
      name: "Old subscription",
      amount: "75",
      dueDate: "2020-01-01",
      status: "cancelled",
    })];

    const state = computeFinancialState(data);
    expect(state.overdueBills).toBe(0);
    expect(state.billsPressure).toBe(0);
  });
});
