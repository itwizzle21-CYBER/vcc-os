import { describe, expect, it } from "vitest";
import { createBrowserData } from "./fixtures/browserData";
import { createVerifiedCarLoanData } from "../src/lib/storage/carLoanReference";
import { receiptComponentTotal, summarizeCarLoan } from "../src/lib/engine/carLoanEngine";

describe("browser fixture privacy and reconciliation", () => {
  it("does not serialize inherited owner loan identifiers or evidence", () => {
    const owner = createVerifiedCarLoanData();
    const payload = JSON.stringify(createBrowserData());
    const privateValues = [owner.contract?.id, owner.contract?.vehicle, owner.contract?.lender,
      ...owner.receipts.flatMap((receipt) => [receipt.id, receipt.receiptNumber, receipt.attachmentName]),
      ...owner.communications.flatMap((message) => [message.id, message.exactMessage, message.attachmentName])];
    // Boolean assertions deliberately keep private source values out of failures.
    expect(privateValues.filter((value) => value && value.length > 3)
      .some((value) => payload.includes(value!))).toBe(false);
  });

  it("reconciles invented receipt components and linked transactions", () => {
    const data = createBrowserData();
    const receipt = data.carLoan.receipts[0];
    expect(Math.round(receiptComponentTotal(receipt) * 100)).toBe(Math.round(receipt.totalPaid * 100));
    const linked = data.sections.transactions.filter((row) => row.id.startsWith("car-receipt-"));
    expect(linked.length).toBe(1);
    expect(linked[0].cells.receiptId).toBe(receipt.id);
    expect(Number(linked[0].cells.amount)).toBe(receipt.totalPaid);
    expect(summarizeCarLoan(data.carLoan, data.sections.transactions).issues.length).toBe(0);
  });

  it("isolates records across newly created browser workspaces", () => {
    const first = createBrowserData();
    first.carLoan.receipts[0].totalPaid = 0;
    first.sections.money[0].cells.amount = "0";
    const second = createBrowserData();
    expect(second.carLoan.receipts[0].totalPaid).toBe(125);
    expect(second.sections.money[0].cells.amount).not.toBe("0");
  });
});
