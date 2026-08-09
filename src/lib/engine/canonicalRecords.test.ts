import { describe, expect, it } from "vitest";
import type { SpreadsheetRow } from "../types/app";
import { canonicalizeAccountRows, canonicalizeInventoryRows } from "./canonicalRecords";
import { getInventoryAlert } from "./inventoryEngine";

function row(id: string, cells: Record<string, string>): SpreadsheetRow {
  return { id, cells };
}

describe("canonical record normalization", () => {
  it("removes exact duplicate accounts but preserves conflicting balances for review", () => {
    const accounts = canonicalizeAccountRows([
      row("one", { label: "Chime", section: "cash", amount: "25.00", notes: "Primary" }),
      row("duplicate", { label: " chime ", section: "CASH", amount: "$25", notes: " primary " }),
      row("conflict", { label: "Chime", section: "cash", amount: "10.00", notes: "Primary" }),
    ]);

    expect(accounts.map((account) => account.id)).toEqual(["one", "conflict"]);
  });

  it("merges duplicate inventory conservatively and keeps original evidence", () => {
    const [item] = canonicalizeInventoryRows([
      row("water-a", { item: "Bottled Water", qty: "12", minNeeded: "4", cost: "5.00" }),
      row("water-b", { item: " bottled-water ", qty: "0", minNeeded: "6", cost: "6.00" }),
    ]);

    expect(item.cells).toMatchObject({ qty: "0", minNeeded: "6", cost: "6.00", alert: "Critical" });
    expect(getInventoryAlert(item.cells.qty, item.cells.minNeeded)).toBe("Critical");
    expect(JSON.parse(item.cells.duplicateMergeEvidence)).toHaveLength(2);
  });
});
