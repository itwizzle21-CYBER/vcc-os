import { describe, expect, it } from "vitest";
import type { SpreadsheetRow } from "../types/app";
import {
  effectiveBillStatus,
  hasBillPaymentEvidence,
  isCarPaymentTransaction,
  syncBillPaymentTransactions,
} from "./billPaymentSync";

function bill(status: string): SpreadsheetRow {
  return {
    id: "phone",
    cells: {
      name: "Phone",
      category: "Utilities",
      amount: "$95.00",
      status,
      autopay: "no",
      paymentAccount: status === "paid" ? "Chime" : "",
      paidDate: status === "paid" ? "2026-07-16" : "",
    },
  };
}

describe("paid bill transaction sync", () => {
  it("requires stored account and date evidence before a bill is effectively paid", () => {
    const unsupported = bill("paid");
    unsupported.cells.paymentAccount = "";
    unsupported.cells.paidDate = "";

    expect(hasBillPaymentEvidence(unsupported)).toBe(false);
    expect(effectiveBillStatus(unsupported, new Date("2026-07-01T12:00:00"))).toBe("unpaid");
    expect(effectiveBillStatus(bill("paid"), new Date("2026-07-01T12:00:00"))).toBe("paid");
  });

  it("preserves cancelled and upcoming status while deriving overdue dates", () => {
    const cancelled = bill("cancelled");
    const upcoming = bill("upcoming");
    upcoming.cells.dueDate = "2026-07-16";

    expect(effectiveBillStatus(cancelled, new Date("2026-08-01T12:00:00"))).toBe("cancelled");
    expect(effectiveBillStatus(upcoming, new Date("2026-07-01T12:00:00"))).toBe("upcoming");
    expect(effectiveBillStatus(upcoming, new Date("2026-08-01T12:00:00"))).toBe("overdue");
  });

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
        account: "Chime",
        billId: "phone",
        financialEventType: "bill_payment",
      },
    });
  });

  it("does not duplicate the expense when a paid bill is edited", () => {
    const existing = syncBillPaymentTransactions([bill("overdue")], [bill("paid")], [], "2026-07-16");
    existing[0].cells.principalAmount = "90.00";
    const edited = bill("paid");
    edited.cells.amount = "$105.00";
    edited.cells.name = "Mobile phone";
    const transactions = syncBillPaymentTransactions([bill("paid")], [edited], existing, "2026-07-20");

    expect(transactions).toHaveLength(1);
    expect(transactions[0].cells).toMatchObject({ description: "Mobile phone bill payment", amount: "$105.00", date: "2026-07-16", principalAmount: "90.00" });
  });

  it("does not invent a payment for a legacy paid bill with no linked event", () => {
    const transactions = syncBillPaymentTransactions([bill("paid")], [bill("paid")], [], "2026-07-16");

    expect(transactions).toEqual([]);
  });

  it("removes its generated expense when paid status is corrected back", () => {
    const existing = syncBillPaymentTransactions([bill("overdue")], [bill("paid")], [], "2026-07-16");
    const transactions = syncBillPaymentTransactions([bill("paid")], [bill("overdue")], existing, "2026-07-16");

    expect(transactions).toEqual([]);
  });

  it("marks a paid car note as debt-payment history", () => {
    const carNote = bill("unpaid");
    carNote.id = "car-note";
    carNote.cells.name = "Car note";
    carNote.cells.category = "Loans";

    const [transaction] = syncBillPaymentTransactions([carNote], [{
      ...carNote,
      cells: { ...carNote.cells, status: "paid", paymentAccount: "Chime", paidDate: "2026-07-16" },
    }], [], "2026-07-16");

    expect(isCarPaymentTransaction(transaction)).toBe(true);
    expect(transaction.cells).toMatchObject({
      description: "Car note payment",
      category: "Debt Payments",
      amount: "$95.00",
      date: "2026-07-16",
    });
  });
});
