import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpreadsheetRow } from "../../lib/types/app";
import {
  buildCategoryReport,
  buildForecast,
  buildTrendReport,
  projectedMonthlyCashFlow,
  transactionDateMatchesReport,
} from "./ReportsPage";

function transaction(id: string, type: string, amount: string, category: string, date: string): SpreadsheetRow {
  return {
    id,
    cells: { description: id, type, amount, category, date },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("reports calculations", () => {
  it("aggregates expense categories and sorts the largest first", () => {
    const rows = [
      transaction("rent", "expense", "1000", "housing", "2026-08-01"),
      transaction("power", "expense", "125", "utilities", "2026-08-02"),
      transaction("water", "expense", "75", "utilities", "2026-08-03"),
    ];

    expect(buildCategoryReport(rows)).toEqual([
      { label: "Housing", amount: 1000 },
      { label: "Utilities", amount: 200 },
    ]);
  });

  it("groups monthly trend data by week and preserves income and expenses", () => {
    const rows = [
      transaction("paycheck", "income", "1200", "Income", "2026-08-02"),
      transaction("rent", "expense", "800", "Housing", "2026-08-03"),
      transaction("fuel", "expense", "50", "Fuel", "2026-08-10"),
    ];

    expect(buildTrendReport(rows, "monthly")).toEqual([
      { label: "Week 1", income: 1200, expenses: 800, order: 1 },
      { label: "Week 2", income: 0, expenses: 50, order: 2 },
    ]);
  });

  it("matches report windows against the current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00"));

    expect(transactionDateMatchesReport("2026-08-07", "weekly")).toBe(true);
    expect(transactionDateMatchesReport("2026-08-01", "weekly")).toBe(false);
    expect(transactionDateMatchesReport("2026-08-01", "monthly")).toBe(true);
    expect(transactionDateMatchesReport("2025-08-01", "yearly")).toBe(false);
    expect(transactionDateMatchesReport("2025-08-01", "all")).toBe(true);
  });

  it("normalizes cash flow to a monthly projection and builds twelve points", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00"));

    expect(projectedMonthlyCashFlow(400, "weekly")).toBe(1600);
    expect(projectedMonthlyCashFlow(1200, "yearly")).toBe(100);
    const forecast = buildForecast(400, "weekly");
    expect(forecast).toHaveLength(12);
    expect(forecast[0].balance).toBe(1600);
    expect(forecast[11].balance).toBe(19200);
  });
});
