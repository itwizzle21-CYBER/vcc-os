import { describe, expect, it } from "vitest";
import { createVerifiedCarLoanData } from "../storage/carLoanReference";
import { communicationConflicts, receiptComponentTotal, summarizeCarLoan, syncConfirmedReceiptTransactions } from "./carLoanEngine";

describe("car loan evidence engine", () => {
  it("keeps two payments on the same date as separate confirmed records", () => {
    const summary = summarizeCarLoan(createVerifiedCarLoanData());
    expect(summary.confirmedReceipts.filter((receipt) => receipt.paidDate === "2026-03-18")).toHaveLength(2);
    expect(summary.totalCashPaid).toBeCloseTo(689.51);
    expect(summary.officialPayoff).toBeCloseTo(8740.04);
    expect(summary.dealerBalance).toBeCloseTo(10378.42);
  });

  it("keeps the latest documented payoff when a newer receipt omits payoff fields", () => {
    const data = createVerifiedCarLoanData();
    const latest = data.receipts[data.receipts.length - 1];
    data.receipts.push({
      ...latest,
      id: "receipt-without-payoff",
      receiptNumber: "later-payment",
      paidDate: "2026-03-25",
      createdAt: "2026-03-25T12:00:00.000Z",
      officialPayoff: undefined,
      accountBalance: undefined,
      paymentsRemaining: undefined,
    });

    const summary = summarizeCarLoan(data);
    expect(summary.currentReceipt?.id).toBe("receipt-without-payoff");
    expect(summary.officialPayoff).toBeCloseTo(8740.04);
    expect(summary.dealerBalance).toBeCloseTo(10378.42);
    expect(summary.paymentsRemaining).toBe(106);
  });

  it("detects the duplicate dealer receipt number and schedule mismatch", () => {
    const summary = summarizeCarLoan(createVerifiedCarLoanData());
    expect(summary.issues.some((issue) => issue.includes("4-1 appears 2 times"))).toBe(true);
    expect(summary.issues.some((issue) => issue.includes("amortization schedule"))).toBe(true);
  });

  it("preserves receipt component math exactly", () => {
    const receipt = createVerifiedCarLoanData().receipts[2];
    expect(receiptComponentTotal(receipt)).toBeCloseTo(100);
  });

  it("only sends confirmed receipts to transactions", () => {
    const data = createVerifiedCarLoanData();
    data.receipts[0] = { ...data.receipts[0], status: "superseded" };
    const transactions = syncConfirmedReceiptTransactions([], data.receipts);
    expect(transactions).toHaveLength(3);
    expect(transactions.every((row) => row.cells.category === "Debt Payments")).toBe(true);
  });

  it("flags conflicting dealer communications without changing the receipt", () => {
    const receipt = createVerifiedCarLoanData().receipts[3];
    expect(communicationConflicts({
      id: "message-1", messageDate: "2026-03-18", communicationType: "Text",
      dealerRepresentative: "Dealer", exactMessage: "Payoff is 9000", payoffStated: 9000,
      status: "dealer_confirmed", notes: "",
    }, receipt)).toBe(true);
    expect(receipt.officialPayoff).toBe(8740.04);
  });

  it("flags car-payment transactions that lack confirmed receipt evidence", () => {
    const summary = summarizeCarLoan(createVerifiedCarLoanData(), [{
      id: "car-payment-manual", cells: { category: "Debt Payments", notes: "Car payment recorded from Bills." },
    }]);
    expect(summary.issues.some((issue) => issue.includes("not backed by confirmed receipt"))).toBe(true);
  });
});
