import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import { todayIso, weekBounds } from "../calculations/currency";
import type { SpreadsheetRow } from "../types/app";
import { computeFinancialState } from "./financialEngine";
import { identifyTransactionCategory, signedTransactionAmount, transactionMatchesPeriod, transactionType } from "./transactionEngine";

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
    const today = todayIso();
    const week = weekBounds(today);
    data.paycheckPlanner.weekStart = week.start;
    data.paycheckPlanner.weekEnd = week.end;
    data.sections.transactions = [
      transaction("paycheck", "income", "$500.00", "Income", today),
      transaction("groceries", "expense", "$125.00", "Groceries", today),
    ];

    const state = computeFinancialState(data);

    expect(state.transactionWeekNet).toBe(375);
    expect(state.weeklySpending).toBe(125);
    expect(state.categorySummary[0]).toEqual({ label: "Groceries", amount: 125 });
  });

  it("calculates monthly spending from the current calendar month", () => {
    const data = createZeroData();
    const today = todayIso();
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

  it("maps common global merchants and item clues to locked categories", () => {
    expect(identifyTransactionCategory(transaction("tesco milk and bread", "", "$18.20", ""))).toBe("Groceries");
    expect(identifyTransactionCategory(transaction("walmart pharmacy prescription", "", "$11.00", ""))).toBe("Healthcare");
    expect(identifyTransactionCategory(transaction("ikea desk", "", "$129.00", ""))).toBe("Shopping");
    expect(identifyTransactionCategory(transaction("uber trip downtown", "", "$24.00", ""))).toBe("Transportation");
    expect(identifyTransactionCategory(transaction("delta air flight", "", "$330.00", ""))).toBe("Travel");
    expect(identifyTransactionCategory(transaction("chewy dog food", "", "$58.00", ""))).toBe("Pets");
    expect(identifyTransactionCategory(transaction("apple.com/bill icloud", "", "$2.99", ""))).toBe("Subscriptions");
  });

  it("maps common U.S. retail statement descriptions to the category column", () => {
    expect(identifyTransactionCategory(transaction("WM SUPERCENTER #1234", "expense", "$84.21", ""))).toBe("Shopping");
    expect(identifyTransactionCategory(transaction("KROGER #0456", "expense", "$62.40", ""))).toBe("Groceries");
    expect(identifyTransactionCategory(transaction("AMZN Mktp US*AB12C", "expense", "$31.09", ""))).toBe("Shopping");
    expect(identifyTransactionCategory(transaction("MCDONALD'S F123", "expense", "$12.18", ""))).toBe("Restaurants");
    expect(identifyTransactionCategory(transaction("MURPHY USA #7788", "expense", "$46.72", ""))).toBe("Fuel");
    expect(identifyTransactionCategory(transaction("Hidden Valley Ranch", "expense", "$5.25", ""))).toBe("Groceries");
    expect(identifyTransactionCategory(transaction("Rockstar energy drink", "expense", "$3.85", "Income"))).toBe("Groceries");
    expect(identifyTransactionCategory(transaction("Jordans wings 12pc", "expense", "$9.69", ""))).toBe("Restaurants");
    expect(identifyTransactionCategory(transaction("BLK Grap", "expense", "$2.52", ""))).toBe("Tobacco");
  });

  it("uses the completed retail description instead of a stale automatic category", () => {
    const row = transaction("KROGER #0456", "expense", "$62.40", "Shopping");
    row.cells.account = "Cash App";

    expect(identifyTransactionCategory(row)).toBe("Groceries");
    row.cells.description = "WALMART PHARMACY PRESCRIPTION";
    expect(identifyTransactionCategory(row)).toBe("Healthcare");
  });

  it("does not categorize a retail purchase as a transfer from its payment account", () => {
    const row = transaction("TARGET STORE #1122", "expense", "$25.00", "");
    row.cells.account = "Cash App";

    expect(identifyTransactionCategory(row)).toBe("Shopping");
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

  it("separates current and previous calendar weeks", () => {
    const referenceDate = new Date(2026, 6, 17);

    expect(transactionMatchesPeriod("2026-07-12", "week", referenceDate)).toBe(true);
    expect(transactionMatchesPeriod("2026-07-11", "week", referenceDate)).toBe(false);
    expect(transactionMatchesPeriod("2026-07-11", "lastweek", referenceDate)).toBe(true);
    expect(transactionMatchesPeriod("2026-07-04", "lastweek", referenceDate)).toBe(false);
  });

  it("separates current and previous calendar months across year boundaries", () => {
    const referenceDate = new Date(2026, 0, 8);

    expect(transactionMatchesPeriod("2026-01-01", "month", referenceDate)).toBe(true);
    expect(transactionMatchesPeriod("2025-12-31", "lastmonth", referenceDate)).toBe(true);
    expect(transactionMatchesPeriod("2025-11-30", "lastmonth", referenceDate)).toBe(false);
  });

  it("rejects impossible calendar dates instead of normalizing them into another month", () => {
    expect(transactionMatchesPeriod("2026-02-30", "month", new Date(2026, 1, 15))).toBe(false);
  });
});
