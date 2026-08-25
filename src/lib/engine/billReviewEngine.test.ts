import { describe, expect, it } from "vitest";
import type { SpreadsheetRow } from "../types/app";
import { previewBillPayment, summarizeBillReview } from "./billReviewEngine";

function bill(id: string, cells: Record<string, string>): SpreadsheetRow {
  return { id, cells: { name: id, amount: "0", status: "unpaid", ...cells } };
}

describe("bill review engine", () => {
  const referenceDate = new Date("2026-08-25T12:00:00");

  it("summarizes open, paid, overdue, upcoming, and autopay bills from canonical rows", () => {
    const result = summarizeBillReview([
      bill("overdue", { amount: "10.005", dueDate: "2026-08-24", status: "unpaid" }),
      bill("soon", { amount: "20.00", dueDate: "2026-09-01", autopay: "Yes" }),
      bill("paid", { amount: "5.25", dueDate: "2026-08-20", status: "paid", paymentAccount: "Cash", paidDate: "2026-08-20" }),
      bill("cancelled", { amount: "100.00", dueDate: "2026-08-30", status: "cancelled" }),
      { id: "blank", cells: {} },
    ], referenceDate);

    expect(result).toEqual({
      openCount: 2,
      openAmount: 30.01,
      paidCount: 1,
      paidAmount: 5.25,
      overdueCount: 1,
      upcomingCount: 1,
      autopayCount: 1,
    });
  });

  it("preserves explicit zero and ignores invalid due dates in the upcoming window", () => {
    const result = summarizeBillReview([
      bill("zero", { amount: "0", dueDate: "not-a-date" }),
    ], referenceDate);

    expect(result.openCount).toBe(1);
    expect(result.openAmount).toBe(0);
    expect(result.upcomingCount).toBe(0);
  });

  it("previews a bill payment in cents without mutating an account", () => {
    expect(previewBillPayment("100.005", "25.004")).toEqual({
      availableCash: 100.01,
      billAmount: 25,
      projectedAfterPayment: 75.01,
      canCover: true,
    });
    expect(previewBillPayment(-5, 10)).toEqual({
      availableCash: -5,
      billAmount: 10,
      projectedAfterPayment: -15,
      canCover: false,
    });
  });
});
