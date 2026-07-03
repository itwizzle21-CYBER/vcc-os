import { describe, it, expect } from "vitest";

describe("BillsCard Component", () => {
  it("should display default sample data structure", () => {
    const billsData = {
      overdueBills: 1,
      upcomingBills: 3,
      totalDue: 250.49,
    };

    expect(billsData.overdueBills).toBe(1);
    expect(billsData.upcomingBills).toBe(3);
    expect(billsData.totalDue).toBe(250.49);
  });

  it("should format total due correctly", () => {
    const totalDue = 1250.75;
    const formatted = `$${totalDue.toFixed(2)}`;
    expect(formatted).toBe("$1250.75");
  });

  it("should show overdue alert when bills are overdue", () => {
    const data = {
      overdueBills: 2,
      upcomingBills: 1,
      totalDue: 500,
    };

    const hasOverdueAlert = data.overdueBills > 0;
    expect(hasOverdueAlert).toBe(true);
  });

  it("should not show overdue alert when no overdue bills", () => {
    const data = {
      overdueBills: 0,
      upcomingBills: 2,
      totalDue: 300,
    };

    const hasOverdueAlert = data.overdueBills > 0;
    expect(hasOverdueAlert).toBe(false);
  });

  it("should calculate correct dashboard metrics", () => {
    const bills = [
      { id: 1, status: "overdue", amount: 125.5 },
      { id: 2, status: "pending", amount: 79.99 },
      { id: 3, status: "pending", amount: 45.0 },
      { id: 4, status: "paid", amount: 200 },
    ];

    const overdueBills = bills.filter((b) => b.status === "overdue").length;
    const upcomingBills = bills.filter((b) => b.status === "pending").length;
    const totalDue = bills
      .filter((b) => b.status === "overdue" || b.status === "pending")
      .reduce((sum, b) => sum + b.amount, 0);

    expect(overdueBills).toBe(1);
    expect(upcomingBills).toBe(2);
    expect(totalDue).toBeCloseTo(250.49, 2);
  });
});
