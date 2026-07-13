import { describe, expect, it } from "vitest";
import { formatDashboardSpending } from "./Dashboard";

describe("dashboard transaction spending", () => {
  it("always displays non-zero spending as a negative amount", () => {
    expect(formatDashboardSpending(120)).toBe("-$120");
    expect(formatDashboardSpending(-120)).toBe("-$120");
    expect(formatDashboardSpending(0)).toBe("$0");
  });
});
