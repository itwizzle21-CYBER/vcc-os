import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import type { SpreadsheetRow } from "../types/app";
import { computeFinancialState } from "./financialEngine";
import { identifyTransactionCategory, signedTransactionAmount, transactionType } from "./transactionEngine";

function transaction(id: string, type: string, amount: string, category: string, date = "2026-07-13"): SpreadsheetRow {
  return {
    id,
    cells: {
      description: id,
      type,
      category,
      amount,
      date,
      account: "Checking",
      recurring: "No",
      notes: "",
    },
  };
}

describe("transaction engine", () => {
  it("treats an explicitly typed positive expense as a subtraction", () => {
    const row = transaction("groceries", "expense", "$125.00", "Groceries");

    expect(transactionType(row)).toBe("expense");
    expect(signedTransactionAmount(row)).toBe(-125);
  });

  it("infers a named spending category as an expense when type is blank", () => {
    const row = transaction("fuel", "", "$48.00", "Fuel");

    expect(transactionType(row)).toBe("expense");
    expect(signedTransactionAmount(row)).toBe(-48);
  });

  it("uses signed expenses in the financial totals and weekly net", () => {
    const data = createZeroData();
    data.paycheckPlanner.weekStart = "2026-07-12";
    data.paycheckPlanner.weekEnd = "2026-07-18";
    data.sections.transactions = [
      transaction("paycheck", "income", "$500.00", "Income"),
      transaction("groceries", "expense", "$125.00", "Groceries"),
    ];

    const state = computeFinancialState(data);

    expect(state.transactionWeekNet).toBe(375);
    expect(state.weeklySpending).toBe(125);
    expect(state.categorySummary[0]).toEqual({ label: "Groceries", amount: 125 });
  });

  it("calculates monthly spending from the current calendar month", () => {
    const data = createZeroData();
    const today = new Date().toISOString().slice(0, 10);
    data.sections.transactions = [transaction("current-expense", "expense", "$90.00", "Utilities", today)];

    expect(computeFinancialState(data).monthlySpending).toBe(90);
  });

  it("formats known expenses as negative while preserving positive income", () => {
    const data = createZeroData();
    data.sections.transactions = [
      transaction("groceries", "expense", "$125.00", "Groceries", "2026-07-13"),
      transaction("paycheck", "income", "$500.00", "Income", "2026-07-14"),
    ];

    const state = computeFinancialState(data);

    expect(state.largestExpense).toBe("groceries (-$125.00)");
    expect(state.lastTransaction).toBe("paycheck ($500.00)");
  });

  it("identifies worldwide-style categories from transaction descriptions", () => {
    expect(identifyTransactionCategory(transaction("shell fuel", "", "$42.00", ""))).toBe("Fuel");
    expect(identifyTransactionCategory(transaction("netflix monthly", "", "$19.99", ""))).toBe("Subscriptions");
    expect(identifyTransactionCategory(transaction("payroll deposit", "", "$900.00", ""))).toBe("Income");
  });

  it("uses identified categories in financial summaries", () => {
    const data = createZeroData();
    data.sections.transactions = [
      transaction("shell fuel", "expense", "$42.00", ""),
      transaction("netflix monthly", "expense", "$19.99", ""),
    ];

    const state = computeFinancialState(data);

    expect(state.categorySummary).toEqual([
      { label: "Fuel", amount: 42 },
      { label: "Subscriptions", amount: 19.99 },
    ]);
  });
});
