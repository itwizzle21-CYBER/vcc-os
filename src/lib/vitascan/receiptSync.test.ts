import { describe, expect, it } from "vitest";
import { createZeroData } from "../storage/defaultData";
import { mergeVitaReceipts, vitaReceiptToTransaction, type VitaReceiptRecord } from "./receiptSync";

const receipt: VitaReceiptRecord = {
  transaction_id: "vitascan-mobile-1",
  merchant: "Coffee House",
  amount: "14.25",
  occurred_on: "2026-07-18",
  direction: "expense",
  account_name: "Cash App",
  category: "Restaurants",
  reference_code: "ABC12345",
};

describe("VitaScan receipt cloud merge", () => {
  it("turns a mobile receipt into the matching VCC transaction", () => {
    expect(vitaReceiptToTransaction(receipt)).toMatchObject({
      id: "vitascan-mobile-1",
      cells: {
        description: "Coffee House",
        amount: "-14.25",
        account: "Cash App",
        notes: "VitaScan - Ref ABC12345",
      },
    });
  });

  it("adds a receipt once and never duplicates it", () => {
    const data = createZeroData();
    const merged = mergeVitaReceipts(data, [receipt, receipt]);
    const mergedAgain = mergeVitaReceipts(merged, [receipt]);

    expect(merged.sections.transactions.filter((row) => row.id === receipt.transaction_id)).toHaveLength(1);
    expect(mergedAgain).toBe(merged);
  });

  it("keeps the complete OCR text with the VCC transaction", () => {
    const transaction = vitaReceiptToTransaction({ ...receipt, raw_text: "Subtotal $12.00\nTax $2.25\nTotal $14.25" });
    expect(transaction.cells.notes).toContain("Full scan:");
    expect(transaction.cells.notes).toContain("Tax $2.25");
  });
});
