import { describe, expect, it } from "vitest";
import type { SpreadsheetRow } from "../types/app";
import { migrateLegacyReceiptTaxRows } from "./receiptTransactionEngine";

describe("receipt transaction migration", () => {
  it("folds a legacy tax-only transaction into the receipt item totals", () => {
    const rows: SpreadsheetRow[] = [
      receiptRow("water", "Sparkling water", "-7.00"),
      receiptRow("bar", "Granola bar", "-1.25"),
      receiptRow("tax", "Sales tax", "-0.50"),
    ];

    const migrated = migrateLegacyReceiptTaxRows(rows);

    expect(migrated).toHaveLength(2);
    expect(migrated.map((row) => row.cells.salesTax)).toEqual(["0.42", "0.08"]);
    expect(migrated.map((row) => row.cells.amount)).toEqual(["-7.42", "-1.33"]);
    expect(migrated.reduce((sum, row) => sum + Number(row.cells.amount), 0)).toBe(-8.75);
    expect(migrated[0].cells).toMatchObject({ receiptSubtotal: "8.25", receiptTax: "0.50", receiptTotal: "8.75" });
  });

  it("does not rewrite unrelated tax transactions", () => {
    const row: SpreadsheetRow = { id: "quarterly-tax", cells: { description: "Sales tax", amount: "-25.00", type: "expense" } };
    expect(migrateLegacyReceiptTaxRows([row])).toEqual([row]);
  });
});

function receiptRow(id: string, description: string, amount: string): SpreadsheetRow {
  return {
    id,
    cells: {
      description,
      amount,
      type: "expense",
      receiptId: "receipt-1",
      balanceApplied: "yes",
      balanceApplication: "transaction-editor",
      balanceEndpointId: "money-1",
    },
  };
}
