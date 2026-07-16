import { describe, expect, it } from "vitest";
import type { SpreadsheetRow } from "../types/app";
import { syncBillPaymentTransactions } from "./billPaymentSync";

function bill(status: string): SpreadsheetRow {
  return {
    id: "phone",
    cells: {
      name: "Phone",
      category: "Utilities",
      amount: "$95.00",
      status,
      autopay: "no",
    },
  };
}

describe("paid bill transaction sync", () => {
  it("records an overdue bill as one expense when it is marked paid", () => {
    const transactions = syncBillPaymentTransactions([bill("overdue")], [bill("paid")], [], "2026-07-16");

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      id: "bill-payment-phone",
      cells: {
        description: "Phone bill payment",
        type: "expense",
        amount: "$95.00",
        date: "2026-07-16",
      },
    });
  });

  it("does not duplicate the expense when a paid bill is edited", () => {
    const existing = syncBillPaymentTransactions([bill("overdue")], [bill("paid")], [], "2026-07-16");
    const transactions = syncBillPaymentTransactions([bill("paid")], [bill("paid")], existing, "2026-07-16");

    expect(transactions).toHaveLength(1);
  });

  it("removes its generated expense when paid status is corrected back", () => {
    const existing = syncBillPaymentTransactions([bill("overdue")], [bill("paid")], [], "2026-07-16");
    const transactions = syncBillPaymentTransactions([bill("paid")], [bill("overdue")], existing, "2026-07-16");

    expect(transactions).toEqual([]);
  });
});
