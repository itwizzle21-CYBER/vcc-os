import { describe, expect, it } from "vitest";
import { formatDashboardOutflow, formatDashboardSpending } from "./Dashboard";

describe("dashboard transaction spending", () => {
  it("always displays non-zero spending as a negative deduction in snapshots", () => {
    expect(formatDashboardSpending(120)).toBe("-$120");
    expect(formatDashboardSpending(-120)).toBe("-$120");
    expect(formatDashboardSpending(0)).toBe("$0");
  });
});

describe("dashboard money snapshot outflow", () => {
  it("shows spending as a positive money-out amount instead of a negative balance", () => {
    expect(formatDashboardOutflow(120)).toBe("$120");
    expect(formatDashboardOutflow(-120)).toBe("$120");
    expect(formatDashboardOutflow(0)).toBe("$0");
  });
});
